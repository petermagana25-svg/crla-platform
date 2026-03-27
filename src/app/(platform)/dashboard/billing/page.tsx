"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import {
  CreditCard,
  FileText,
  Loader2,
  Receipt,
  ShieldCheck,
} from "lucide-react";
import { useRouter } from "next/navigation";
import BackToDashboardButton from "@/components/dashboard/BackToDashboardButton";
import Container from "@/components/layout/Container";
import Navbar from "@/components/layout/Navbar";
import {
  formatMembershipCurrency,
  formatMembershipDate,
  formatMembershipStatus,
  getDaysRemaining,
  getMembershipStatusBadgeClass,
  Membership,
  MembershipPayment,
  selectPreferredMembership,
} from "@/lib/membership";
import { getCurrentUserRoleClient } from "@/lib/get-current-user-role-client";
import { supabase } from "@/lib/supabase";

type AgentAccess = {
  profile_completed: boolean | null;
  role: string | null;
};

export default function BillingPage() {
  const router = useRouter();
  const [membership, setMembership] = useState<Membership | null>(null);
  const [payments, setPayments] = useState<MembershipPayment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [message, setMessage] = useState<{
    text: string;
    type: "error" | "success";
  } | null>(null);

  async function loadBillingData() {
    setIsLoading(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      router.replace("/login");
      return;
    }

    const { data: agentAccessRaw } = await supabase
      .from("agents")
      .select("profile_completed, role")
      .eq("id", user.id)
      .maybeSingle();

    const agentAccess = (agentAccessRaw as AgentAccess | null) ?? null;
    const role = agentAccess?.role ?? (await getCurrentUserRoleClient());

    if (role !== "admin" && !agentAccess?.profile_completed) {
      router.replace("/onboarding/profile");
      return;
    }

    const [{ data: membershipsData, error: membershipsError }, { data: paymentsData, error: paymentsError }] =
      await Promise.all([
        supabase
          .from("memberships")
          .select(
            "id, plan_name, status, amount, currency, renewal_period, starts_at, expires_at, created_at"
          )
          .eq("agent_id", user.id)
          .order("created_at", { ascending: false })
          .limit(10),
        supabase
          .from("membership_payments")
          .select(
            "id, amount, currency, status, paid_at, invoice_url, created_at"
          )
          .eq("agent_id", user.id)
          .order("created_at", { ascending: false })
          .limit(10),
      ]);

    setMembership(
      membershipsError ? null : selectPreferredMembership(membershipsData ?? [])
    );
    setPayments(paymentsError ? [] : paymentsData ?? []);
    setIsLoading(false);
  }

  async function handleMockPayment() {
    setIsProcessingPayment(true);
    setMessage(null);

    try {
      const response = await fetch("/api/agent/membership/mock-pay", {
        method: "POST",
      });

      const result = (await response.json().catch(() => null)) as
        | {
            error?: { message?: string };
            success?: boolean;
          }
        | null;

      if (!response.ok || !result?.success) {
        throw new Error(
          result?.error?.message || "Unable to activate membership."
        );
      }

      await loadBillingData();
      setMessage({
        type: "success",
        text: "Membership payment recorded. Your activation status has been refreshed.",
      });
    } catch (error) {
      setMessage({
        type: "error",
        text:
          error instanceof Error
            ? error.message
            : "Unable to activate membership.",
      });
    } finally {
      setIsProcessingPayment(false);
    }
  }

  useEffect(() => {
    void loadBillingData();
  }, []);

  const daysRemaining = getDaysRemaining(membership?.expires_at ?? null);
  const isMembershipActive = membership?.status === "active";

  return (
    <main className="min-h-screen bg-[var(--navy-dark)] text-white">
      <Navbar />

      <Container>
        <div className="space-y-10 py-10 lg:py-14">
          <BackToDashboardButton />

          {message && (
            <div
              className={`rounded-2xl px-4 py-3 text-sm ${
                message.type === "success"
                  ? "border border-emerald-400/30 bg-emerald-400/10 text-emerald-200"
                  : "border border-red-400/30 bg-red-400/10 text-red-200"
              }`}
            >
              {message.text}
            </div>
          )}

          <div className="rounded-[36px] border border-white/10 bg-[linear-gradient(135deg,rgba(22,37,68,0.92),rgba(11,20,38,0.90))] p-8 shadow-[0_35px_90px_rgba(0,0,0,.30)] backdrop-blur-2xl">
            <div className="flex items-center justify-between gap-6">
              <div>
                <p className="text-sm uppercase tracking-[0.22em] text-white/40">
                  Membership Console
                </p>
                <h1 className="mt-3 text-4xl font-bold md:text-5xl">
                  Billing & Membership
                </h1>
                <p className="mt-4 max-w-2xl text-lg text-[var(--text-muted)]">
                  Review your current CRLA membership, renewal timing, and recent
                  payment activity.
                </p>
              </div>

              <div className="hidden items-center gap-4 rounded-3xl border border-[var(--gold-main)]/25 bg-[rgba(212,175,55,0.10)] px-4 py-3 sm:flex">
                <div className="relative h-12 w-12 overflow-hidden rounded-2xl border border-white/10">
                  <Image
                    src="/images/branding/crla-logo.jpg"
                    alt="CRLA logo"
                    fill
                    className="object-cover"
                  />
                </div>
                <CreditCard size={24} className="text-[var(--gold-main)]" />
              </div>
            </div>
          </div>

          <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
            <section className="rounded-[32px] border border-white/10 bg-white/5 p-7 backdrop-blur-2xl">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <h2 className="text-2xl font-semibold">Current Membership</h2>
                  <p className="mt-2 text-sm text-[var(--text-muted)]">
                    {isMembershipActive
                      ? "Your membership is active and your renewal details are listed below."
                      : "Your membership is not active yet. Complete payment to finish activation."}
                  </p>
                </div>
                <span
                  className={`inline-flex w-fit rounded-full px-3 py-1 text-xs font-semibold ${getMembershipStatusBadgeClass(
                    membership?.status ?? null
                  )}`}
                >
                  {formatMembershipStatus(membership?.status ?? null)}
                </span>
              </div>

              {membership ? (
                <div className="mt-6 space-y-6">
                  <div className="rounded-3xl border border-white/10 bg-[linear-gradient(135deg,rgba(212,175,55,0.12),rgba(255,255,255,0.04))] p-6 shadow-[0_20px_50px_rgba(212,175,55,0.10)]">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <p className="text-sm text-white/55">Membership Plan</p>
                        <p className="mt-2 text-2xl font-semibold text-white">
                          {membership.plan_name || "CRLA Annual Membership"}
                        </p>
                        <p className="mt-3 text-sm text-[var(--text-muted)]">
                          Price:{" "}
                          {formatMembershipCurrency(
                            membership.amount,
                            membership.currency
                          )}{" "}
                          / {membership.renewal_period || "year"}
                        </p>
                      </div>

                      <div className="relative h-16 w-16 overflow-hidden rounded-3xl border border-white/10">
                        <Image
                          src="/images/branding/crla-logo.jpg"
                          alt="CRLA logo"
                          fill
                          className="object-cover"
                        />
                      </div>
                    </div>
                  </div>

                  {isMembershipActive ? (
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
                        <p className="text-sm text-white/55">Valid From</p>
                        <p className="mt-2 text-lg font-semibold text-white">
                          {formatMembershipDate(membership.starts_at)}
                        </p>
                      </div>
                      <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
                        <p className="text-sm text-white/55">Valid Until</p>
                        <p className="mt-2 text-lg font-semibold text-white">
                          {formatMembershipDate(membership.expires_at)}
                        </p>
                      </div>
                      <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
                        <p className="text-sm text-white/55">Days Remaining</p>
                        <p className="mt-2 text-lg font-semibold text-white">
                          {daysRemaining === null ? "—" : `${daysRemaining} days`}
                        </p>
                      </div>
                      <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
                        <p className="text-sm text-white/55">Renewal Period</p>
                        <p className="mt-2 text-lg font-semibold text-white">
                          {membership.renewal_period
                            ? membership.renewal_period.charAt(0).toUpperCase() +
                              membership.renewal_period.slice(1)
                            : "—"}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="rounded-2xl border border-dashed border-white/10 bg-white/5 px-5 py-6 text-sm text-white/70">
                      Your membership is not active.
                    </div>
                  )}
                </div>
              ) : (
                <div className="mt-6 rounded-2xl border border-dashed border-white/10 bg-white/5 px-5 py-8 text-sm text-slate-400">
                  {isLoading
                    ? "Loading membership details..."
                    : "No membership record found yet. Once billing is activated, your plan details will appear here."}
                </div>
              )}
            </section>

            <section className="rounded-[32px] border border-white/10 bg-[linear-gradient(135deg,rgba(22,37,68,0.94),rgba(11,20,38,0.92))] p-7 backdrop-blur-2xl">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-semibold">Renewal Action</h2>
                  <p className="mt-2 text-sm text-[var(--text-muted)]">
                    Use the MVP payment action now, then swap this into Stripe
                    checkout next.
                  </p>
                </div>
                <ShieldCheck className="text-[var(--gold-main)]" size={24} />
              </div>

              <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-5">
                <p className="text-sm text-white/55">Next Step</p>
                <p className="mt-2 text-lg font-semibold text-white">
                  {isMembershipActive
                    ? "Membership is active"
                    : "Activate your annual membership"}
                </p>
                <p className="mt-2 text-sm leading-7 text-[var(--text-muted)]">
                  {isMembershipActive
                    ? "Your membership is already active. Future renewals can use the same billing architecture when Stripe checkout is connected."
                    : "This mock action records a paid membership, sets your start and expiration dates, and refreshes your activation status so the end-to-end lifecycle can be tested now."}
                </p>
              </div>

              {isMembershipActive ? (
                <div className="mt-6 rounded-xl border border-emerald-400/30 bg-emerald-400/10 px-4 py-3 text-sm font-medium text-emerald-200">
                  Membership payment complete.
                </div>
              ) : (
                <button
                  type="button"
                  onClick={handleMockPayment}
                  disabled={isProcessingPayment}
                  className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[var(--gold-main)] px-4 py-3 text-sm font-semibold text-black transition hover:bg-[var(--gold-soft)] disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {isProcessingPayment ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : null}
                  Pay $1,000
                </button>
              )}
            </section>
          </div>

          <section className="rounded-[32px] border border-white/10 bg-white/5 p-7 backdrop-blur-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-2xl font-semibold">Payment History</h2>
                <p className="mt-2 text-sm text-[var(--text-muted)]">
                  Recent membership transactions and invoice references.
                </p>
              </div>
              <Receipt className="text-[var(--gold-main)]" size={24} />
            </div>

            <div className="mt-6 space-y-4">
              {payments.map((payment) => (
                <div
                  key={payment.id}
                  className="flex flex-col gap-4 rounded-2xl border border-white/10 bg-white/5 p-5 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <p className="font-semibold text-white">
                      {formatMembershipCurrency(payment.amount, payment.currency)}
                    </p>
                    <p className="mt-1 text-sm text-[var(--text-muted)]">
                      {formatMembershipDate(payment.paid_at ?? payment.created_at)}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-3">
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-semibold ${getMembershipStatusBadgeClass(
                        payment.status
                      )}`}
                    >
                      {formatMembershipStatus(payment.status)}
                    </span>
                    {payment.invoice_url ? (
                      <a
                        href={payment.invoice_url}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-2 text-sm font-medium text-white transition hover:bg-white/10"
                      >
                        Invoice
                        <FileText size={14} />
                      </a>
                    ) : (
                      <span className="text-sm text-white/45">
                        Invoice pending
                      </span>
                    )}
                  </div>
                </div>
              ))}

              {!isLoading && payments.length === 0 && (
                <div className="rounded-2xl border border-dashed border-white/10 bg-white/5 px-5 py-8 text-center text-sm text-slate-400">
                  No payment records available yet.
                </div>
              )}

              {isLoading && (
                <div className="rounded-2xl border border-white/10 bg-white/5 px-5 py-8 text-center text-sm text-slate-400">
                  Loading payment history...
                </div>
              )}
            </div>
          </section>
        </div>
      </Container>
    </main>
  );
}
