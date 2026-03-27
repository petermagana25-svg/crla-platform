import { NextResponse } from 'next/server';
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
      .select('agent_status, role')
      .eq('id', user.id)
      .maybeSingle();

    if (agentError) {
      throw new Error(agentError.message || 'Unable to verify agent access.');
    }

    const isAdmin = agent?.role === 'admin';
    const isActiveAgent = agent?.agent_status === 'active';

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
