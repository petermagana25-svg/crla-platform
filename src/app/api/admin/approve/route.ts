import { NextResponse } from 'next/server';
import { refreshAgentActivationStatus } from '@/lib/agent-activation';
import { createSupabaseAdminClient } from '@/lib/supabase-admin';
import { sendEmail } from '@/lib/email';
import { buildAgentApprovalEmail } from '@/lib/email-templates/agent-approval';
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

      const { data: existingAgentByEmail, error: existingAgentByEmailError } =
        await admin
          .from('agents')
          .select('id')
          .eq('email', email)
          .maybeSingle();

      if (existingAgentByEmailError) {
        if (createdUserId) {
          await admin.auth.admin.deleteUser(createdUserId);
        }

        return apiError(
          'agent_lookup_failed',
          existingAgentByEmailError.message || 'Failed to load agent record.',
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

      const { error: agentInsertError } = await admin
        .from('agents')
        .upsert(
          {
            id: approvedUserId,
            agent_status: existingAgentById?.agent_status ?? 'pending',
            full_name: fullName,
            email,
            license_number: licenseNumber,
            role: existingAgentById?.role ?? 'agent',
            is_active: existingAgentById?.is_active ?? true,
            certification_status:
              existingAgentById?.certification_status ?? 'not_started',
            profile_completed: existingAgentById?.profile_completed ?? false,
          },
          { onConflict: 'id' }
        );

      if (agentInsertError) {
        throw new Error(
          agentInsertError.message || 'Failed to insert agent row.'
        );
      }

      insertedAgentRow = !existingAgentById;

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

      const emailTemplate = buildAgentApprovalEmail({
        activationLink,
        name: fullName,
      });

      const emailResult = await sendEmail({
        to: email,
        subject: emailTemplate.subject,
        html: emailTemplate.html,
        text: emailTemplate.text,
      });

      console.info('[admin-approve] email sent', {
        applicationId,
        email,
        subject: emailTemplate.subject,
        resendEmailId:
          typeof emailResult === 'object' &&
          emailResult !== null &&
          'id' in emailResult &&
          typeof emailResult.id === 'string'
            ? emailResult.id
            : null,
      });

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
