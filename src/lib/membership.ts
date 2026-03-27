export type MembershipStatus =
  | "active"
  | "expired"
  | "pending"
  | "cancelled"
  | null;

export type Membership = {
  id: string;
  plan_name: string | null;
  status: MembershipStatus;
  amount: number | null;
  currency: string | null;
  renewal_period: string | null;
  starts_at: string | null;
  expires_at: string | null;
  created_at: string | null;
};

export type MembershipPaymentStatus =
  | "pending"
  | "paid"
  | "failed"
  | "refunded"
  | null;

export type MembershipPayment = {
  id: string;
  amount: number | null;
  currency: string | null;
  status: MembershipPaymentStatus;
  paid_at: string | null;
  invoice_url: string | null;
  created_at: string | null;
};

const membershipPriority: Record<string, number> = {
  active: 0,
  pending: 1,
  expired: 2,
  cancelled: 3,
};

export function selectPreferredMembership(memberships: Membership[]) {
  if (memberships.length === 0) {
    return null;
  }

  return [...memberships].sort((left, right) => {
    const leftPriority = membershipPriority[left.status ?? "cancelled"] ?? 99;
    const rightPriority =
      membershipPriority[right.status ?? "cancelled"] ?? 99;

    if (leftPriority !== rightPriority) {
      return leftPriority - rightPriority;
    }

    const leftDate = Date.parse(
      left.starts_at ?? left.created_at ?? "1970-01-01T00:00:00.000Z"
    );
    const rightDate = Date.parse(
      right.starts_at ?? right.created_at ?? "1970-01-01T00:00:00.000Z"
    );

    return rightDate - leftDate;
  })[0];
}

export function formatMembershipDate(value: string | null) {
  if (!value) {
    return "—";
  }

  return new Date(value).toLocaleDateString();
}

export function formatMembershipCurrency(
  amount: number | null,
  currency: string | null
) {
  if (amount === null) {
    return "—";
  }

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency ?? "USD",
  }).format(amount);
}

export function getDaysRemaining(expiresAt: string | null) {
  if (!expiresAt) {
    return null;
  }

  const now = new Date();
  const expiration = new Date(expiresAt);
  const difference = expiration.getTime() - now.getTime();

  return Math.ceil(difference / (1000 * 60 * 60 * 24));
}

export function formatMembershipStatus(status: string | null) {
  if (!status) {
    return "No membership";
  }

  return status.charAt(0).toUpperCase() + status.slice(1);
}

export function getMembershipStatusBadgeClass(status: string | null) {
  switch (status) {
    case "active":
    case "paid":
      return "border border-emerald-400/30 bg-emerald-400/10 text-emerald-200";
    case "pending":
      return "border border-yellow-400/30 bg-yellow-400/10 text-yellow-200";
    case "expired":
    case "failed":
      return "border border-red-400/30 bg-red-400/10 text-red-200";
    case "cancelled":
    case "refunded":
      return "border border-white/15 bg-white/10 text-white/70";
    default:
      return "border border-white/15 bg-white/10 text-white/70";
  }
}
