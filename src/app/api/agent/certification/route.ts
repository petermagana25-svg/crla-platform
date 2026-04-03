import { NextResponse } from 'next/server';
import {
  refreshAgentActivationStatus,
} from '@/lib/agent-activation';
import { AgentCertificationStatus } from '@/lib/agent-status';
import { createSupabaseAdminClient } from '@/lib/supabase-admin';
import { createServerSupabaseClient } from '@/lib/supabase-server';

type Body = {
  status?: AgentCertificationStatus;
};

const allowedStatuses: AgentCertificationStatus[] = [
  'not_started',
  'in_progress',
  'completed',
];

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Body;
    const nextStatus = body.status;

    if (!nextStatus || !allowedStatuses.includes(nextStatus)) {
      return NextResponse.json(
        {
          success: false,
          error: { message: 'A valid certification status is required.' },
        },
        { status: 400 }
      );
    }

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

    const admin = createSupabaseAdminClient();
    const { data: agentRecord, error: agentLookupError } = await admin
      .from('agents')
      .select('id')
      .eq('user_id', user.id)
      .maybeSingle();

    if (agentLookupError) {
      throw new Error(
        agentLookupError.message || 'Unable to find your linked agent profile.'
      );
    }

    if (!agentRecord) {
      return NextResponse.json(
        {
          success: false,
          error: { message: 'No linked agent profile was found for this account.' },
        },
        { status: 404 }
      );
    }

    const { error: updateError } = await admin
      .from('agents')
      .update({ certification_status: nextStatus })
      .eq('id', agentRecord.id);

    if (updateError) {
      throw new Error(
        updateError.message || 'Unable to update certification status.'
      );
    }

    const result = await refreshAgentActivationStatus(agentRecord.id, admin);

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: {
          message:
            error instanceof Error
              ? error.message
              : 'Unable to update certification status.',
        },
      },
      { status: 500 }
    );
  }
}
