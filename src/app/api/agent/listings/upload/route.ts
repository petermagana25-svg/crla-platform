import { NextResponse } from 'next/server';
import { computeAgentStatus } from '@/lib/agent-status';
import { selectPreferredMembership } from '@/lib/membership';
import { createSupabaseAdminClient } from '@/lib/supabase-admin';
import { createServerSupabaseClient } from '@/lib/supabase-server';

export const runtime = 'nodejs';

function buildStoragePath(agentId: string, fileName: string) {
  const safeFileName = fileName.replace(/\s+/g, '_');
  return `${agentId}/${Date.now()}_${safeFileName}`;
}

export async function POST(request: Request) {
  try {
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json(
        {
          success: false,
          error: { message: 'Authentication required.' },
        },
        { status: 401 }
      );
    }

    const { data: agent, error: agentError } = await supabase
      .from('agents')
      .select(
        'role, is_active, profile_completed, certification_status, admin_override_active, admin_override_profile_complete, admin_override_training_complete, admin_override_membership_active'
      )
      .eq('id', user.id)
      .maybeSingle();

    if (agentError) {
      throw new Error(agentError.message || 'Unable to verify agent access.');
    }

    const { data: memberships, error: membershipsError } = await supabase
      .from('memberships')
      .select('id, status, starts_at, expires_at, created_at')
      .eq('agent_id', user.id)
      .order('created_at', { ascending: false });

    if (membershipsError) {
      throw new Error(
        membershipsError.message || 'Unable to load membership activation data.'
      );
    }

    const preferredMembership = selectPreferredMembership(
      (memberships ?? []).map((membership) => ({
        amount: null,
        created_at: membership.created_at,
        currency: null,
        expires_at: membership.expires_at,
        id: membership.id,
        plan_name: null,
        renewal_period: null,
        starts_at: membership.starts_at,
        status: membership.status,
      }))
    );

    const isAdmin = agent?.role === 'admin';
    const isActiveAgent = agent
      ? computeAgentStatus({
          ...agent,
          membership_status: preferredMembership?.status ?? 'pending',
        }).finalActive
      : false;

    if (!isAdmin && !isActiveAgent) {
      return NextResponse.json(
        {
          success: false,
          error: {
            message: 'Complete your activation to start adding listings.',
          },
        },
        { status: 403 }
      );
    }

    const formData = await request.formData();
    const file = formData.get('file');

    if (!(file instanceof File) || !file.name) {
      return NextResponse.json(
        {
          success: false,
          error: { message: 'A listing image file is required.' },
        },
        { status: 400 }
      );
    }

    const admin = createSupabaseAdminClient();
    const filePath = buildStoragePath(user.id, file.name);
    const fileBytes = new Uint8Array(await file.arrayBuffer());

    const { error: uploadError } = await admin.storage
      .from('listings')
      .upload(filePath, fileBytes, {
        contentType: file.type || undefined,
        upsert: false,
      });

    if (uploadError) {
      throw new Error(uploadError.message || 'Unable to upload listing image.');
    }

    const {
      data: { publicUrl },
    } = admin.storage.from('listings').getPublicUrl(filePath);

    return NextResponse.json({
      success: true,
      data: {
        imageUrl: publicUrl,
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: {
          message:
            error instanceof Error
              ? error.message
              : 'Unable to upload listing image.',
        },
      },
      { status: 500 }
    );
  }
}
