import { NextResponse } from 'next/server';
import {
  AgentCertificationStatus,
  refreshAgentActivationStatus,
} from '@/lib/agent-activation';
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
    const { error: updateError } = await admin
      .from('agents')
      .update({ certification_status: nextStatus })
      .eq('id', user.id);

    if (updateError) {
      throw new Error(
        updateError.message || 'Unable to update certification status.'
      );
    }

    const result = await refreshAgentActivationStatus(user.id, admin);

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
