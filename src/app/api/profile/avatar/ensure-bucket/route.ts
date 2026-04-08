import { NextResponse } from 'next/server';
import { createSupabaseAdminClient } from '@/lib/supabase-admin';
import { createServerSupabaseClient } from '@/lib/supabase-server';

export const runtime = 'nodejs';

const avatarBucketName = 'avatars';
const avatarMimeTypes = ['image/jpeg', 'image/png', 'image/webp'];
const avatarFileSizeLimit = 3 * 1024 * 1024;

export async function POST() {
  try {
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          error: { message: 'Authentication required.' },
        },
        { status: 401 }
      );
    }

    const admin = createSupabaseAdminClient();
    const { data: buckets, error: bucketsError } = await admin.storage.listBuckets();

    if (bucketsError) {
      throw new Error(bucketsError.message || 'Unable to verify avatar storage.');
    }

    const avatarBucket = buckets.find((bucket) => bucket.name === avatarBucketName);

    if (!avatarBucket) {
      const { error: createError } = await admin.storage.createBucket(
        avatarBucketName,
        {
          public: true,
          allowedMimeTypes: avatarMimeTypes,
          fileSizeLimit: avatarFileSizeLimit,
        }
      );

      if (createError) {
        throw new Error(createError.message || 'Unable to create avatar bucket.');
      }
    } else {
      const { error: updateError } = await admin.storage.updateBucket(
        avatarBucketName,
        {
          public: true,
          allowedMimeTypes: avatarMimeTypes,
          fileSizeLimit: avatarFileSizeLimit,
        }
      );

      if (updateError) {
        throw new Error(updateError.message || 'Unable to configure avatar bucket.');
      }
    }

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: {
          message:
            error instanceof Error
              ? error.message
              : 'Unable to prepare avatar storage.',
        },
      },
      { status: 500 }
    );
  }
}
