import { NextResponse } from 'next/server';
import { refreshAgentActivationStatus } from '@/lib/agent-activation';
import { selectPreferredMembership } from '@/lib/membership';
import { createSupabaseAdminClient } from '@/lib/supabase-admin';
import { createServerSupabaseClient } from '@/lib/supabase-server';

export const runtime = 'nodejs';

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

    const admin = createSupabaseAdminClient();
    const { data: memberships, error: membershipsError } = await admin
      .from('memberships')
      .select(
        'id, plan_name, status, amount, currency, renewal_period, starts_at, expires_at, created_at'
      )
      .eq('agent_id', user.id)
      .order('created_at', { ascending: false });

    if (membershipsError) {
      throw new Error(
        membershipsError.message || 'Unable to load membership records.'
      );
    }

    const selectedMembership = selectPreferredMembership(memberships ?? []);
    const now = new Date();
    const expiresAt = new Date(now);
    expiresAt.setFullYear(expiresAt.getFullYear() + 1);

    let membershipId = selectedMembership?.id ?? null;

    if (membershipId) {
      const { error: updateMembershipError } = await admin
        .from('memberships')
        .update({
          amount: selectedMembership?.amount ?? 1000,
          currency: selectedMembership?.currency ?? 'USD',
          expires_at: expiresAt.toISOString(),
          plan_name: selectedMembership?.plan_name ?? 'CRLA Annual Membership',
          renewal_period: selectedMembership?.renewal_period ?? 'annual',
          starts_at: now.toISOString(),
          status: 'active',
        })
        .eq('id', membershipId);

      if (updateMembershipError) {
        throw new Error(
          updateMembershipError.message || 'Unable to activate membership.'
        );
      }
    } else {
      const { data: insertedMembership, error: insertMembershipError } =
        await admin
          .from('memberships')
          .insert({
            agent_id: user.id,
            amount: 1000,
            currency: 'USD',
            expires_at: expiresAt.toISOString(),
            plan_name: 'CRLA Annual Membership',
            renewal_period: 'annual',
            starts_at: now.toISOString(),
            status: 'active',
          })
          .select('id')
          .single();

      if (insertMembershipError || !insertedMembership) {
        throw new Error(
          insertMembershipError?.message || 'Unable to create membership.'
        );
      }

      membershipId = insertedMembership.id;
    }

    const { error: paymentError } = await admin
      .from('membership_payments')
      .insert({
        agent_id: user.id,
        amount: selectedMembership?.amount ?? 1000,
        currency: selectedMembership?.currency ?? 'USD',
        membership_id: membershipId,
        paid_at: now.toISOString(),
        status: 'paid',
      });

    if (paymentError) {
      throw new Error(paymentError.message || 'Unable to record payment.');
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
              : 'Unable to activate membership.',
        },
      },
      { status: 500 }
    );
  }
}
