import { NextResponse } from 'next/server';
import { refreshAgentActivationStatus } from '@/lib/agent-activation';
import { createServerSupabaseClient } from '@/lib/supabase-server';

export async function POST() {
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

    const result = await refreshAgentActivationStatus(user.id);

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
              : 'Unable to refresh activation status.',
        },
      },
      { status: 500 }
    );
  }
}
