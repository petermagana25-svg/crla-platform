import { NextResponse } from 'next/server';
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

    let agentRecordId: string | null = null;
    let createdUserId: string | null = null;
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
            'id, user_id, role, is_active, certification_status, profile_completed, agent_status, admin_override_active, admin_override_profile_complete, admin_override_training_complete, admin_override_membership_active'
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
        role: 'agent',
      };
      let inviteMode: 'invite' | 'recovery' = 'invite';
      let authUserId: string | null = existingUser?.id ?? null;

      if (existingUser) {
        console.log('USER FOUND IN AUTH', {
          email,
          authUserId: existingUser.id,
        });

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

        const { error: recoveryError } = await admin.auth.resetPasswordForEmail(
          email,
          {
            redirectTo,
          }
        );

        if (recoveryError) {
          console.error('RESET EMAIL FAILED', {
            email,
            error: recoveryError,
          });

          return apiError(
            'invite_email_failed',
            recoveryError.message || 'Failed to send password setup email.',
            500
          );
        }

        inviteMode = 'recovery';
        console.log('RESET EMAIL SENT', {
          email,
          authUserId: existingUser.id,
        });
      } else {
        console.log('USER NOT FOUND IN AUTH', {
          email,
        });

        const { data: inviteResult, error: inviteError } =
          await admin.auth.admin.inviteUserByEmail(email, {
            data: approvedUserMetadata,
            redirectTo,
          });

        if (inviteError || !inviteResult.user) {
          console.error('INVITE EMAIL FAILED', {
            email,
            error: inviteError,
          });

          return apiError(
            'invite_email_failed',
            inviteError?.message || 'Failed to send Supabase invite email.',
            500
          );
        }

        authUserId = inviteResult.user.id;
        createdUserId = inviteResult.user.id;
        inviteMode = 'invite';
        console.log('INVITE EMAIL SENT', {
          email,
          authUserId,
        });
      }

      console.info('[admin-approve] link generated', {
        applicationId,
        email,
        inviteMode,
        redirectTo,
        existingUserId: authUserId,
        linkedUserId: existingAgentByEmail?.user_id ?? null,
      });
      const existingAgent = existingAgentByEmail;
      const roleBeforeUpsert = existingAgent?.role ?? null;
      const role =
        roleBeforeUpsert === 'admin' ? 'admin' : roleBeforeUpsert ?? 'agent';
      const isAdminAgent = role === 'admin';
      const nextUserId = existingAgent?.user_id ?? authUserId;

      if (existingAgent?.user_id && authUserId && existingAgent.user_id !== authUserId) {
        console.warn('[admin-approve] agent/auth linkage mismatch detected', {
          applicationId,
          agentId: existingAgent.id,
          email,
          agentUserId: existingAgent.user_id,
          authUserId,
        });
      }

      console.log('ROLE BEFORE UPSERT:', roleBeforeUpsert);
      console.log('ROLE AFTER:', role);
      console.info('[admin-approve] applying initial agent state', {
        agentId: existingAgent?.id ?? null,
        email,
        nextUserId,
        isActive: isAdminAgent ? existingAgent?.is_active ?? true : false,
        admin_override_active:
          isAdminAgent ? existingAgent?.admin_override_active ?? null : null,
      });

      if (existingAgent) {
        const { error: agentUpdateError } = await admin
          .from('agents')
          .update({
            agent_status: existingAgent.agent_status ?? 'pending',
            full_name: fullName,
            email,
            license_number: licenseNumber,
            ...(existingAgent.user_id ? {} : { user_id: nextUserId }),
            role,
            is_active: isAdminAgent ? existingAgent.is_active ?? true : false,
            certification_status:
              existingAgent.certification_status ?? 'not_started',
            profile_completed: existingAgent.profile_completed ?? false,
            admin_override_active:
              isAdminAgent ? existingAgent.admin_override_active ?? null : null,
            admin_override_profile_complete:
              isAdminAgent
                ? existingAgent.admin_override_profile_complete ?? null
                : null,
            admin_override_training_complete:
              isAdminAgent
                ? existingAgent.admin_override_training_complete ?? null
                : null,
            admin_override_membership_active:
              isAdminAgent
                ? existingAgent.admin_override_membership_active ?? null
                : null,
          })
          .eq('id', existingAgent.id);

        if (agentUpdateError) {
          throw new Error(
            agentUpdateError.message || 'Failed to update agent row.'
          );
        }

        agentRecordId = existingAgent.id;
      } else {
        const { data: insertedAgent, error: agentInsertError } = await admin
          .from('agents')
          .insert({
            agent_status: 'pending',
            full_name: fullName,
            email,
            license_number: licenseNumber,
            user_id: nextUserId,
            role,
            is_active: false,
            certification_status: 'not_started',
            profile_completed: false,
            admin_override_active: null,
            admin_override_profile_complete: null,
            admin_override_training_complete: null,
            admin_override_membership_active: null,
          })
          .select('id')
          .single();

        if (agentInsertError || !insertedAgent) {
          throw new Error(
            agentInsertError?.message || 'Failed to insert agent row.'
          );
        }

        insertedAgentRow = true;
        agentRecordId = insertedAgent.id;
      }

      if (!agentRecordId) {
        throw new Error('Failed to resolve the approved agent record.');
      }

      console.info('[admin-approve] skipping membership bootstrap', {
        agentRecordId,
        reason:
          'Newly approved agents should remain membership-inactive until they activate membership.',
      });

      await refreshAgentActivationStatus(agentRecordId, admin);

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
      console.log('APPLICATION APPROVED', {
        applicationId,
        agentRecordId,
        email,
        inviteMode,
      });

      return NextResponse.json({
        success: true,
        message:
          inviteMode === 'recovery'
            ? 'Agent approved and reset email sent.'
            : 'Agent approved and invite email sent.',
        inviteMode,
      });
    } catch (error) {
      if (applicationMarkedApproved) {
        await admin
          .from('agent_applications')
          .update({ status: 'pending' })
          .eq('id', applicationId);
      }

      if (insertedAgentRow && agentRecordId) {
        await admin.from('agents').delete().eq('id', agentRecordId);
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
