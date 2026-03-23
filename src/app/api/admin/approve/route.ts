import { NextResponse } from 'next/server';
import { createSupabaseAdminClient } from '@/lib/supabase-admin';
import { apiError, getUserByEmail, requireAdmin } from '../_utils';

export const runtime = 'nodejs';

type ApproveRequestBody = {
  applicationId?: string;
  email?: string;
  full_name?: string;
  license_number?: string;
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
    const email = body.email?.trim().toLowerCase();
    const fullName = body.full_name?.trim();
    const licenseNumber = body.license_number?.trim();

    if (!applicationId || !email || !fullName || !licenseNumber) {
      return apiError(
        'missing_fields',
        'applicationId, email, full_name, and license_number are required.',
        400
      );
    }

    const admin = createSupabaseAdminClient();
    let createdUserId: string | null = null;
    try {
      console.info('[admin-approve]', {
        applicationId,
        email,
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

      const existingUser = await getUserByEmail(admin, email);

      if (existingUser) {
        return apiError(
          'duplicate_user',
          'A user with this email already exists.',
          409
        );
      }

      const inviteOptions = {
        data: {
          full_name: application.full_name ?? fullName,
          license_number: application.license_number ?? licenseNumber,
        },
        redirectTo: process.env.NEXT_PUBLIC_SITE_URL
          ? `${process.env.NEXT_PUBLIC_SITE_URL}/login`
          : undefined,
      };

      const { data: invitedUser, error: inviteError } =
        await admin.auth.admin.inviteUserByEmail(
          application.email ?? email,
          inviteOptions
        );

      if (inviteError || !invitedUser.user) {
        return apiError(
          'invite_user_failed',
          inviteError?.message || 'Failed to invite user.',
          500
        );
      }

      createdUserId = invitedUser.user.id;

      const { error: agentInsertError } = await admin
        .from('agents')
        .insert({
          id: createdUserId,
          full_name: application.full_name ?? fullName,
          email: application.email ?? email,
          license_number: application.license_number ?? licenseNumber,
          role: 'agent',
        });

      if (agentInsertError) {
        throw new Error(
          agentInsertError.message || 'Failed to insert agent row.'
        );
      }

      const { error: updateError } = await admin
        .from('agent_applications')
        .update({ status: 'approved' })
        .eq('id', applicationId);

      if (updateError) {
        throw new Error(
          updateError.message || 'Failed to update application status.'
        );
      }

      return NextResponse.json({
        success: true,
        message: 'Agent approved and invitation sent.',
      });
    } catch (error) {
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
