import { NextResponse } from 'next/server';
import { Resend } from 'resend';
import { refreshAgentActivationStatus } from '@/lib/agent-activation';
import { createSupabaseAdminClient } from '@/lib/supabase-admin';
import { apiError, getUserByEmail, requireAdmin } from '../_utils';

export const runtime = 'nodejs';

type ApproveRequestBody = {
  applicationId?: string;
};

export async function POST(request: Request) {
  try {
    const adminCheck = await requireAdmin();
    if (!adminCheck.ok) {
      return adminCheck.response;
    }

    let body: ApproveRequestBody;

    try {
      body = (await request.json()) as ApproveRequestBody;
    } catch {
      return apiError('invalid_body', 'Invalid JSON body.', 400);
    }

    const applicationId = body.applicationId?.trim();

    if (!applicationId) {
      return apiError(
        'missing_fields',
        'applicationId is required.',
        400
      );
    }

    const admin = createSupabaseAdminClient();
    let createdUserId: string | null = null;
    let approvedUserId: string | null = null;
    let insertedAgentRow = false;
    let applicationMarkedApproved = false;

    try {
      console.info('[admin-approve]', {
        applicationId,
        adminUserId: adminCheck.userId,
      });

      const { data: application, error: applicationError } = await admin
        .from('agent_applications')
        .select('id, email, full_name, license_number, status')
        .eq('id', applicationId)
        .maybeSingle();

      if (applicationError) {
        return apiError(
          'application_lookup_failed',
          applicationError.message || 'Unable to load application.',
          500
        );
      }

      if (!application) {
        return apiError('application_not_found', 'Application not found.', 404);
      }

      if (application.status !== 'pending') {
        return apiError(
          'invalid_application_status',
          'Only pending applications can be approved.',
          409
        );
      }

      const email = application.email?.trim().toLowerCase();
      const fullName = application.full_name?.trim();
      const licenseNumber = application.license_number?.trim();

      if (!email || !fullName || !licenseNumber) {
        return apiError(
          'missing_application_fields',
          'Application is missing the required approval fields.',
          400
        );
      }

      const { data: existingAgentByEmail, error: existingAgentByEmailError } =
        await admin
          .from('agents')
          .select(
            'id, role, is_active, certification_status, profile_completed, agent_status'
          )
          .eq('email', email)
          .maybeSingle();

      if (existingAgentByEmailError) {
        return apiError(
          'agent_lookup_failed',
          existingAgentByEmailError.message || 'Failed to load agent record.',
          500
        );
      }

      const redirectBaseUrl = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, '');

      if (!redirectBaseUrl) {
        return apiError(
          'missing_site_url',
          'Missing NEXT_PUBLIC_SITE_URL configuration.',
          500
        );
      }

      const existingUser = await getUserByEmail(admin, email);
      const redirectTo = `${redirectBaseUrl}/set-password`;
      const approvedUserMetadata = {
        full_name: fullName,
        license_number: licenseNumber,
      };
      let activationLink = '';
      let linkType: 'invite' | 'recovery' = 'invite';

      if (existingUser) {
        const { error: updateUserError } = await admin.auth.admin.updateUserById(
          existingUser.id,
          {
            user_metadata: {
              ...(existingUser.user_metadata ?? {}),
              ...approvedUserMetadata,
            },
          }
        );

        if (updateUserError) {
          throw new Error(
            updateUserError.message || 'Failed to update existing auth user.'
          );
        }

        const { data: recoveryLink, error: recoveryError } =
          await admin.auth.admin.generateLink({
            type: 'recovery',
            email,
            options: {
              redirectTo,
            },
          });

        if (recoveryError || !recoveryLink.properties?.action_link) {
          return apiError(
            'generate_link_failed',
            recoveryError?.message || 'Failed to generate activation link.',
            500
          );
        }

        approvedUserId = existingUser.id;
        activationLink = recoveryLink.properties.action_link;
        linkType = 'recovery';
      } else {
        const { data: inviteLink, error: inviteError } =
          await admin.auth.admin.generateLink({
            type: 'invite',
            email,
            options: {
              data: approvedUserMetadata,
              redirectTo,
            },
          });

        if (inviteError || !inviteLink.user || !inviteLink.properties?.action_link) {
          return apiError(
            'generate_link_failed',
            inviteError?.message || 'Failed to generate activation link.',
            500
          );
        }

        approvedUserId = inviteLink.user.id;
        createdUserId = inviteLink.user.id;
        activationLink = inviteLink.properties.action_link;
        linkType = 'invite';
      }

      if (!approvedUserId) {
        throw new Error('Failed to resolve the approved auth user.');
      }

      console.info('[admin-approve] link generated', {
        applicationId,
        email,
        linkType,
        redirectTo,
        approvedUserId,
      });

      const { data: existingAgentById, error: existingAgentError } = await admin
        .from('agents')
        .select(
          'id, role, is_active, certification_status, profile_completed, agent_status'
        )
        .eq('id', approvedUserId)
        .maybeSingle();

      if (existingAgentError) {
        if (createdUserId) {
          await admin.auth.admin.deleteUser(createdUserId);
        }

        return apiError(
          'agent_lookup_failed',
          existingAgentError.message || 'Failed to load agent record.',
          500
        );
      }

      if (existingAgentByEmail && existingAgentByEmail.id !== approvedUserId) {
        if (createdUserId) {
          await admin.auth.admin.deleteUser(createdUserId);
        }

        return apiError(
          'agent_email_conflict',
          'An existing agent record already uses this email.',
          409
        );
      }

      const existingAgent = existingAgentByEmail ?? existingAgentById;
      const roleBeforeUpsert = existingAgent?.role ?? null;
      const role =
        roleBeforeUpsert === 'admin' ? 'admin' : roleBeforeUpsert ?? 'agent';

      console.log('ROLE BEFORE UPSERT:', roleBeforeUpsert);
      console.log('ROLE AFTER:', role);

      const { error: agentInsertError } = await admin
        .from('agents')
        .upsert(
          {
            id: approvedUserId,
            agent_status: existingAgent?.agent_status ?? 'pending',
            full_name: fullName,
            email,
            license_number: licenseNumber,
            // Preserve any existing role, especially admin, and only default to
            // agent when no role exists yet.
            role,
            is_active: existingAgent?.is_active ?? true,
            certification_status:
              existingAgent?.certification_status ?? 'not_started',
            profile_completed: existingAgent?.profile_completed ?? false,
          },
          { onConflict: 'id' }
        );

      if (agentInsertError) {
        throw new Error(
          agentInsertError.message || 'Failed to insert agent row.'
        );
      }

      insertedAgentRow = !existingAgent;

      const { data: existingMembership, error: membershipLookupError } =
        await admin
          .from('memberships')
          .select('id')
          .eq('agent_id', approvedUserId)
          .maybeSingle();

      if (membershipLookupError) {
        throw new Error(
          membershipLookupError.message ||
            'Failed to verify membership setup.'
        );
      }

      if (!existingMembership) {
        const { error: membershipInsertError } = await admin
          .from('memberships')
          .insert({
            agent_id: approvedUserId,
            amount: 1000,
            currency: 'USD',
            plan_name: 'CRLA Annual Membership',
            renewal_period: 'annual',
            status: 'pending',
          });

        if (membershipInsertError) {
          throw new Error(
            membershipInsertError.message || 'Failed to create membership.'
          );
        }
      }

      await refreshAgentActivationStatus(approvedUserId, admin);

      const { error: updateError } = await admin
        .from('agent_applications')
        .update({ status: 'approved' })
        .eq('id', applicationId);

      if (updateError) {
        throw new Error(
          updateError.message || 'Failed to update application status.'
        );
      }

      applicationMarkedApproved = true;

      const resendApiKey = process.env.RESEND_API_KEY;

      if (!resendApiKey) {
        throw new Error('Missing RESEND_API_KEY configuration.');
      }

      const resend = new Resend(resendApiKey);
      const loginUrl = `${redirectBaseUrl}/login`;

      try {
        await resend.emails.send({
          from: 'CRLA <onboarding@resend.dev>',
          to: email,
          subject: 'Welcome to CRLA — Your Agent Access is Ready',
          html: `
            <p>Hi ${fullName},</p>

            <p>Welcome to CRLA — Certified Renovation Listing Agent.</p>

            <p>Your account has been approved. You can now access your agent dashboard using the link below:</p>

            <p>
              <a href="${loginUrl}">
                Access Your Agent Portal
              </a>
            </p>

            <p>If this is your first time signing in, complete your account setup here:</p>

            <p>
              <a href="${activationLink}">
                Set Your Password
              </a>
            </p>

            <p>To become a fully certified and listed agent, please complete the following steps:</p>

            <ol>
              <li>Complete your profile</li>
              <li>Finish your certification training</li>
              <li>Activate your membership</li>
            </ol>

            <p>Once completed, your profile will be visible to homeowners and buyers on the platform.</p>

            <p>We’re excited to have you on board.</p>

            <p>— CRLA Team</p>
          `,
        });

        console.log('Approval email sent to:', email);
      } catch (error) {
        console.error('Approval email error:', error);
        throw error;
      }

      return NextResponse.json({
        success: true,
        message: 'Agent approved and activation email sent.',
      });
    } catch (error) {
      if (applicationMarkedApproved) {
        await admin
          .from('agent_applications')
          .update({ status: 'pending' })
          .eq('id', applicationId);
      }

      if (insertedAgentRow && approvedUserId) {
        await admin.from('agents').delete().eq('id', approvedUserId);
      }

      if (createdUserId) {
        await admin.auth.admin.deleteUser(createdUserId);
      }

      throw error;
    }
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Approval request failed.';

    return apiError('approval_failed', message, 500);
  }
}
