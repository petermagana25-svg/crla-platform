"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  ArrowRight,
  Award,
  CheckCircle2,
  Clock3,
  CreditCard,
  Download,
  Eye,
  FileText,
  GraduationCap,
  HelpCircle,
  Home,
  Inbox,
  LayoutDashboard,
  LogOut,
  Megaphone,
  MousePointerClick,
  PlusCircle,
  ShieldCheck,
  Star,
  User,
  Users,
  PlayCircle,
} from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import Container from "@/components/layout/Container";
import ChangePasswordSection from "@/components/dashboard/ChangePasswordSection";
import { getCurrentUserRoleClient } from "@/lib/get-current-user-role-client";
import { computeAgentStatus } from "@/lib/agent-status";
import {
  formatMembershipCurrency,
  formatMembershipDate,
  formatMembershipStatus,
  getDaysRemaining,
  getMembershipStatusBadgeClass,
  Membership,
  MembershipStatus,
  selectPreferredMembership,
} from "@/lib/membership";
import {
  logout,
} from "@/lib/logout";
import { supabase } from "@/lib/supabase";
import { setViewMode } from "@/lib/view-mode";

type Profile = {
  avatar_url: string | null;
};

type AgentAccess = {
  admin_override_active: boolean | null;
  admin_override_membership_active: boolean | null;
  admin_override_profile_complete: boolean | null;
  admin_override_training_complete: boolean | null;
  agent_status: string | null;
  city: string | null;
  certification_status:
    | "not_started"
    | "in_progress"
    | "completed"
    | "certified"
    | null;
  id: string;
  full_name: string | null;
  is_active: boolean | null;
  license_number: string | null;
  profile_completed: boolean | null;
  role: string | null;
  state: string | null;
};

type Resource = {
  id: string;
  title: string | null;
  category: string | null;
  description: string | null;
  file_url: string | null;
  created_at: string | null;
};

type MarketingAsset = {
  id: string;
  title: string | null;
  category: string | null;
  description: string | null;
  file_url: string | null;
  created_at: string | null;
};

type Listing = {
  expected_completion_date: string | null;
  id: string;
  projected_price: number | null;
  status: "in_progress" | "ready" | "sold";
  title: string | null;
};

type SidebarItemProps = {
  activePaths?: string[];
  badge?: React.ReactNode;
  disabledLabel?: string;
  exactMatch?: boolean;
  icon: React.ReactNode;
  label: string;
  href?: string;
  onClick?: () => void;
  disabled?: boolean;
  tone?: "primary" | "secondary" | "account" | "footer";
};

type ActivationStepStatus = "completed" | "in_progress" | "pending";

const subtleHeaderButtonClass =
  "inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm font-medium text-slate-200 transition hover:bg-white/10 hover:text-white disabled:cursor-not-allowed disabled:opacity-60";

// TODO: Wire certification and training progress to real member progress data.
const progressCards = [
  {
    title: "Profile Completion",
    value: "92%",
    progress: 92,
    note: "Add an intro video to reach full completion.",
  },
  {
    title: "Courses Completed",
    value: "6 of 8",
    progress: 75,
    note: "Two final modules unlock advanced recognition.",
  },
  {
    title: "Response Time Score",
    value: "89%",
    progress: 89,
    note: "Fast responses improve lead conversion and ranking.",
  },
  {
    title: "Client Rating Average",
    value: "4.9 / 5",
    progress: 98,
    note: "Excellent trust signal for new homeowner visitors.",
  },
] as const;

// TODO: Replace these academy and listing placeholders with live learning and listing data.
const certificationHighlights = [
  "Certification valid through Dec 18, 2026",
  "6 continuing education credits completed",
  "2 advanced modules left for Elite tier",
  "Verification badge visible on your public profile",
] as const;

const achievements = [
  {
    title: "Top Responder",
    subtitle: "Fast lead response this month",
  },
  {
    title: "5-Star Service",
    subtitle: "Outstanding client rating",
  },
  {
    title: "Luxury Specialist",
    subtitle: "Premium listing performance",
  },
  {
    title: "Market Advisor",
    subtitle: "Strong homeowner engagement",
  },
] as const;

function SidebarItem({
  activePaths,
  badge,
  disabledLabel,
  exactMatch = false,
  icon,
  label,
  href = "#",
  onClick,
  disabled = false,
  tone = "secondary",
}: SidebarItemProps) {
  const rawPathname = usePathname();
  const pathname = rawPathname ?? "";
  const routes =
    activePaths && activePaths.length > 0
      ? activePaths
      : href !== "#"
        ? [href]
        : [];
  const isActiveRoute = routes.some((route) =>
    exactMatch ? pathname === route : pathname === route || pathname.startsWith(`${route}/`)
  );

  const toneClass =
    tone === "primary"
      ? "font-semibold text-white/95"
      : tone === "secondary"
        ? "font-medium text-white/80"
        : tone === "account"
          ? "font-medium text-white/75"
          : "font-medium text-white/65";

  const iconClass = isActiveRoute
    ? "text-black"
    : tone === "primary"
      ? "text-white/75 group-hover:text-[var(--gold-main)]"
      : tone === "secondary"
        ? "text-white/60 group-hover:text-[var(--gold-main)]"
        : tone === "account"
          ? "text-white/55 group-hover:text-[var(--gold-main)]"
          : "text-white/45 group-hover:text-[var(--gold-main)]";

  const className = `group flex w-full items-center justify-between gap-3 rounded-2xl border px-4 py-3 text-left text-[15px] transition-all duration-300 ${
    isActiveRoute
      ? "border-yellow-300/70 bg-[var(--gold-main)] text-black shadow-[0_0_0_1px_rgba(212,175,55,0.24),0_0_24px_rgba(212,175,55,0.34)]"
      : disabled
        ? "cursor-not-allowed border-transparent bg-transparent text-white/50 opacity-50"
        : `border-transparent bg-transparent ${toneClass} hover:border-yellow-400/20 hover:bg-white/[0.045] hover:text-[var(--gold-main)] hover:shadow-[0_0_18px_rgba(212,175,55,0.12)]`
  }`;

  const badgeClass = isActiveRoute
    ? "bg-black/10 text-black/75"
    : disabled
      ? "border border-white/10 bg-white/5 text-white/40"
      : "border border-[var(--gold-main)]/20 bg-[rgba(212,175,55,0.12)] text-[var(--gold-main)]";

  const content = (
    <>
      <span className="flex min-w-0 items-center gap-3">
        <span className={`transition-colors duration-300 ${iconClass}`}>
          {icon}
        </span>
        <span className="truncate">{label}</span>
      </span>
      {badge || disabledLabel ? (
        <span
          className={`inline-flex shrink-0 items-center rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] ${badgeClass}`}
        >
          {badge || disabledLabel}
        </span>
      ) : null}
    </>
  );

  if (!disabled && href !== "#") {
    return (
      <Link
        href={href}
        onClick={onClick}
        aria-current={isActiveRoute ? "page" : undefined}
        className={className}
      >
        {content}
      </Link>
    );
  }

  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        disabled={disabled}
        className={className}
      >
        {content}
      </button>
    );
  }

  return (
    <div aria-disabled={disabled} className={className}>
      {content}
    </div>
  );
}

function MetricCard({
  icon,
  title,
  value,
  detail,
}: {
  icon: React.ReactNode;
  title: string;
  value: string;
  detail: string;
}) {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl transition duration-300 hover:-translate-y-1 hover:bg-white/[0.08] hover:shadow-[0_20px_50px_rgba(0,0,0,.28)]">
      <div className="mb-4 inline-flex rounded-2xl bg-[rgba(212,175,55,0.10)] p-3 text-[var(--gold-main)]">
        {icon}
      </div>
      <p className="text-sm text-white/55">{title}</p>
      <p className="mt-2 text-3xl font-bold text-white">{value}</p>
      <p className="mt-2 text-sm text-[var(--text-muted)]">{detail}</p>
    </div>
  );
}

function ProgressCard({
  title,
  value,
  progress,
  note,
}: {
  title: string;
  value: string;
  progress: number;
  note: string;
}) {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl transition duration-300 hover:bg-white/[0.08]">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm text-white/55">{title}</p>
          <p className="mt-2 text-2xl font-bold text-white">{value}</p>
        </div>
        <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/60">
          {progress}%
        </span>
      </div>

      <div className="mt-5 h-2 w-full rounded-full bg-white/10">
        <div
          className="h-2 rounded-full bg-[var(--gold-main)]"
          style={{ width: `${progress}%` }}
        />
      </div>

      <p className="mt-3 text-sm text-[var(--text-muted)]">{note}</p>
    </div>
  );
}

function AchievementBadge({
  title,
  subtitle,
}: {
  title: string;
  subtitle: string;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-5 text-center backdrop-blur-xl transition duration-300 hover:-translate-y-1 hover:bg-white/[0.08]">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-[rgba(212,175,55,0.12)] text-[var(--gold-main)]">
        <Award size={22} />
      </div>
      <p className="mt-4 font-semibold text-white">{title}</p>
      <p className="mt-1 text-xs text-[var(--text-muted)]">{subtitle}</p>
    </div>
  );
}

function QuickAction({
  icon,
  title,
  href = "#",
}: {
  icon: React.ReactNode;
  title: string;
  href?: string;
}) {
  return (
    <Link
      href={href}
      className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-5 py-4 text-sm font-medium text-white/80 backdrop-blur transition duration-300 hover:-translate-y-1 hover:bg-white/[0.08] hover:text-white"
    >
      <span className="flex items-center gap-3">
        <span className="text-[var(--gold-main)]">{icon}</span>
        {title}
      </span>
      <ArrowRight size={16} className="text-white/40" />
    </Link>
  );
}

function formatLabel(value: string | null, fallback: string) {
  if (!value) {
    return fallback;
  }

  return value
    .split("_")
    .join(" ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function formatCompactCurrency(value: number | null) {
  if (value === null) {
    return "Price TBD";
  }

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

function getProfileInitials(fullName: string | null | undefined) {
  if (!fullName) {
    return "";
  }

  const parts = fullName
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2);

  return parts.map((part) => part[0]?.toUpperCase() ?? "").join("");
}

function formatAgentLocation(city: string | null, state: string | null) {
  const trimmedCity = city?.trim() ?? "";
  const trimmedState = state?.trim() ?? "";

  if (trimmedCity && trimmedState) {
    return trimmedCity.toLowerCase() === trimmedState.toLowerCase()
      ? trimmedCity
      : `${trimmedCity}, ${trimmedState}`;
  }

  if (trimmedCity) {
    return trimmedCity;
  }

  if (trimmedState) {
    return trimmedState;
  }

  return "Location not set";
}

function getCertificationStatusLabel(isActive: boolean) {
  switch (isActive) {
    case true:
      return "Verified & Active";
    default:
      return "Pending Activation";
  }
}

function inferAcademyType(resource: Resource) {
  const source = `${resource.title ?? ""} ${resource.description ?? ""} ${
    resource.file_url ?? ""
  }`.toLowerCase();

  if (source.includes("sop")) {
    return "SOP";
  }

  if (
    source.includes(".mp4") ||
    source.includes("youtube") ||
    source.includes("vimeo") ||
    source.includes("video")
  ) {
    return "Video";
  }

  return "Document";
}

function getActivationStepBadgeClass(status: ActivationStepStatus) {
  switch (status) {
    case "completed":
      return "border border-emerald-400/30 bg-emerald-400/10 text-emerald-200";
    case "in_progress":
      return "border border-yellow-400/30 bg-yellow-400/10 text-yellow-200";
    default:
      return "border border-red-400/30 bg-red-400/10 text-red-200";
  }
}

function ActivationStepCard({
  href,
  icon,
  status,
  title,
}: {
  href: string;
  icon: React.ReactNode;
  status: ActivationStepStatus;
  title: string;
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 backdrop-blur-xl transition duration-300 hover:-translate-y-[1px] hover:bg-white/[0.08]"
    >
      <div className="inline-flex rounded-xl bg-[rgba(212,175,55,0.10)] p-2.5 text-[var(--gold-main)]">
        {icon}
      </div>
      <p className="text-sm font-semibold text-white">{title}</p>
      <span
        className={`ml-auto rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] ${getActivationStepBadgeClass(
          status
        )}`}
      >
        {status === "completed"
          ? "done"
          : status === "in_progress"
            ? "in progress"
            : "pending"}
      </span>
    </Link>
  );
}

export default function AgentDashboardPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [academyResources, setAcademyResources] = useState<Resource[]>([]);
  const [listings, setListings] = useState<Listing[]>([]);
  const [marketingAssets, setMarketingAssets] = useState<MarketingAsset[]>([]);
  const [agentAccess, setAgentAccess] = useState<AgentAccess | null>(null);
  const [membership, setMembership] = useState<Membership | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [agentLookupError, setAgentLookupError] = useState<string | null>(null);
  const [listingViewCount, setListingViewCount] = useState(0);
  const [leadsCount, setLeadsCount] = useState(0);
  const [profileViewCount, setProfileViewCount] = useState(0);
  const [unreadMessageCount, setUnreadMessageCount] = useState(0);

  const loadDashboard = useCallback(async () => {
    setIsLoading(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      router.replace("/login");
      return;
    }

    const [{ data: agentAccessRaw, error: agentAccessError }, { data: profileData }] =
      await Promise.all([
        supabase
          .from("agents")
          .select(
            "id, agent_status, city, certification_status, full_name, is_active, license_number, profile_completed, role, state, admin_override_active, admin_override_profile_complete, admin_override_training_complete, admin_override_membership_active"
          )
          .eq("user_id", user.id)
          .maybeSingle(),
        supabase
          .from("profiles")
          .select("avatar_url")
          .eq("id", user.id)
          .maybeSingle(),
      ]);

    const agentAccess = (agentAccessRaw as AgentAccess | null) ?? null;
    console.log("agent fetch", {
      source: "dashboard",
      userId: user.id,
      found: Boolean(agentAccess),
    });

    if (agentAccessError) {
      setAgentLookupError(
        agentAccessError.message || "Unable to load your agent profile."
      );
      setIsLoading(false);
      return;
    }

    const role = agentAccess?.role ?? (await getCurrentUserRoleClient());
    const admin = role === "admin";

    if (!agentAccess && !admin) {
      setAgentLookupError(
        "No linked agent profile was found for this account. Please contact support."
      );
      setProfile(profileData);
      setAgentAccess(null);
      setIsAdmin(false);
      setIsLoading(false);
      return;
    }

    const resolvedAgentId = agentAccess?.id ?? user.id;
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const thirtyDaysAgoIso = thirtyDaysAgo.toISOString();

    const [
      { data: marketingAssetData, error: marketingAssetsError },
      { data: academyResourceData, error: academyResourcesError },
      { data: membershipsData, error: membershipsError },
      { data: listingData, error: listingsError },
      { count: profileViewsCount, error: profileViewsError },
      { count: listingViewsCount, error: listingViewsError },
      { count: messagesCount, error: messagesCountError },
      { count: unreadMessagesCount, error: unreadMessagesError },
    ] =
      await Promise.all([
        supabase
          .from("marketing_assets")
          .select("id, title, category, description, file_url, created_at")
          .order("created_at", { ascending: false }),
        supabase
          .from("resources")
          .select("id, title, category, description, file_url, created_at")
          .eq("category", "training")
          .order("created_at", { ascending: false })
          .limit(3),
        supabase
          .from("memberships")
          .select(
            "id, plan_name, status, amount, currency, renewal_period, starts_at, expires_at, created_at"
          )
          .eq("agent_id", resolvedAgentId)
          .order("created_at", { ascending: false })
          .limit(10),
        supabase
          .from("listings")
          .select(
            "expected_completion_date, id, projected_price, status, title"
          )
          .eq("agent_id", resolvedAgentId)
          .order("created_at", { ascending: false })
          .limit(3),
        supabase
          .from("profile_views")
          .select("id", { count: "exact", head: true })
          .eq("agent_id", resolvedAgentId)
          .gte("created_at", thirtyDaysAgoIso),
        supabase
          .from("listing_views")
          .select("id", { count: "exact", head: true })
          .eq("agent_id", resolvedAgentId)
          .gte("created_at", thirtyDaysAgoIso),
        supabase
          .from("messages")
          .select("id", { count: "exact", head: true })
          .eq("agent_id", resolvedAgentId)
          .gte("created_at", thirtyDaysAgoIso),
        supabase
          .from("messages")
          .select("id", { count: "exact", head: true })
          .eq("agent_id", resolvedAgentId)
          .eq("sender_type", "client")
          .eq("status", "unread"),
      ]);

    const preferredMembership = membershipsError
      ? null
      : selectPreferredMembership(membershipsData ?? []);
    const computedAgentStatus = agentAccess
      ? computeAgentStatus({
          ...agentAccess,
          membership_status: preferredMembership?.status ?? "pending",
        })
      : null;
    setAgentAccess(agentAccess);
    setIsAdmin(admin);
    setAgentLookupError(null);

    if (!admin && !computedAgentStatus?.profileComplete) {
      router.push("/onboarding");
      return;
    }

    setProfile(profileData);
    setMarketingAssets(marketingAssetsError ? [] : marketingAssetData ?? []);
    setAcademyResources(
      academyResourcesError ? [] : academyResourceData ?? []
    );
    setMembership(preferredMembership);
    setListings(listingsError ? [] : ((listingData ?? []) as Listing[]));
    setProfileViewCount(profileViewsError ? 0 : profileViewsCount ?? 0);
    setListingViewCount(listingViewsError ? 0 : listingViewsCount ?? 0);
    setLeadsCount(messagesCountError ? 0 : messagesCount ?? 0);
    setUnreadMessageCount(
      unreadMessagesError ? 0 : unreadMessagesCount ?? 0
    );
    setIsLoading(false);
  }, [router]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadDashboard();
  }, [loadDashboard]);

  async function handleLogout() {
    setIsLoggingOut(true);
    await logout(router);
  }

  function handleOpenProfileSettings() {
    setViewMode("agent");
    router.push("/onboarding");
  }

  function handleDashboardReset() {
    window.scrollTo({ top: 0, behavior: "smooth" });
    void loadDashboard();
  }

  function handleSwitchToAdminPanel() {
    setViewMode("admin");
    router.push("/admin");
  }

  function formatCreatedAt(value: string | null) {
    if (!value) {
      return "—";
    }

    return new Date(value).toLocaleDateString();
  }

  const latestMarketingAssets = marketingAssets.slice(0, 3);
  const membershipDaysRemaining = getDaysRemaining(membership?.expires_at ?? null);
  const membershipStatus = (membership?.status ?? "pending") as MembershipStatus;
  const computedAgentStatus = agentAccess
    ? computeAgentStatus({
        ...agentAccess,
        membership_status: membershipStatus,
      })
    : null;
  const profileStepStatus: ActivationStepStatus = computedAgentStatus?.profileComplete
    ? "completed"
    : "pending";
  const certificationStepStatus: ActivationStepStatus =
    computedAgentStatus?.trainingComplete
      ? "completed"
      : agentAccess?.certification_status === "in_progress"
        ? "in_progress"
        : "pending";
  const membershipStepStatus: ActivationStepStatus =
    computedAgentStatus?.membershipComplete
      ? "completed"
      : membership
        ? "in_progress"
        : "pending";
  const activationCompletedCount = [
    profileStepStatus === "completed",
    certificationStepStatus === "completed",
    membershipStepStatus === "completed",
  ].filter(Boolean).length;
  const isActiveAgent = computedAgentStatus?.finalActive ?? false;
  const profileName = agentAccess?.full_name?.trim() ?? "";
  const profileInitials = getProfileInitials(profileName);
  const heroHeading = profileName ? `Welcome back, ${profileName}` : "Welcome";
  const certificationStatusLabel = getCertificationStatusLabel(
    isActiveAgent
  );
  const renewalDate = membership?.status === "active" ? membership.expires_at : null;
  const locationLabel = formatAgentLocation(
    agentAccess?.city ?? null,
    agentAccess?.state ?? null
  );
  const totalViews = profileViewCount + listingViewCount;
  const engagementRate =
    totalViews > 0 ? ((leadsCount / totalViews) * 100).toFixed(1) : "0";
  const dashboardMetricCards = [
    {
      icon: <Eye size={20} />,
      title: "Profile Views",
      value: profileViewCount.toLocaleString("en-US"),
      detail: "Directory views in the last 30 days",
    },
    {
      icon: <MousePointerClick size={20} />,
      title: "Listing Views",
      value: listingViewCount.toLocaleString("en-US"),
      detail: "Property interactions in the last 30 days",
    },
    {
      icon: <Users size={20} />,
      title: "Leads Received",
      value: leadsCount.toLocaleString("en-US"),
      detail: "Messages received in the last 30 days",
    },
    {
      icon: <Star size={20} />,
      title: "Engagement Rate",
      value: `${engagementRate}%`,
      detail: "Leads divided by profile and listing views",
    },
  ];

  return (
    <main className="min-h-screen bg-[var(--navy-dark)] text-white">
      <Navbar />

      <Container>
        <div className="py-10 lg:py-14">
          <div className="grid gap-8 lg:grid-cols-[280px_minmax(0,1fr)]">
            <aside className="space-y-6">
              <div className="rounded-[32px] border border-white/10 bg-white/5 p-6 backdrop-blur-2xl shadow-[0_25px_70px_rgba(0,0,0,.28)]">
                <div className="flex items-center gap-4">
                  <div className="h-16 w-16 overflow-hidden rounded-2xl border border-white/10 bg-white/5">
                    {isLoading ? (
                      <div className="h-full w-full animate-pulse rounded-2xl bg-white/10" />
                    ) : profile?.avatar_url ? (
                      <div className="relative h-full w-full">
                        <Image
                          src={profile.avatar_url}
                          alt={profileName ? `${profileName} profile photo` : "Profile photo"}
                          fill
                          className="object-cover"
                          sizes="64px"
                        />
                      </div>
                    ) : profileInitials ? (
                      <div className="flex h-full w-full items-center justify-center bg-[linear-gradient(135deg,rgba(212,175,55,0.18),rgba(255,255,255,0.06))] text-lg font-semibold tracking-[0.14em] text-[var(--gold-main)]">
                        {profileInitials}
                      </div>
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-white/5 text-white/35">
                        <User size={24} />
                      </div>
                    )}
                  </div>

                  <div className="min-w-0">
                    <p className="text-xs uppercase tracking-[0.2em] text-white/40">
                      Certified Agent
                    </p>

                    {isLoading ? (
                      <div className="mt-2 space-y-2">
                        <div className="h-5 w-28 animate-pulse rounded-full bg-white/10" />
                        <div className="h-3 w-24 animate-pulse rounded-full bg-white/10" />
                        <div className="h-3 w-20 animate-pulse rounded-full bg-white/10" />
                      </div>
                    ) : (
                      <>
                        {profileName ? (
                          <h2 className="mt-1 truncate text-xl font-semibold">
                            {profileName}
                          </h2>
                        ) : null}

                        <p className="mt-1 text-xs text-white/50">
                          {locationLabel}
                        </p>

                        <p className="mt-1 text-xs text-white/40">
                          License #{agentAccess?.license_number || "—"}
                        </p>
                      </>
                    )}
                  </div>
                </div>

                <div className="mt-6 rounded-2xl border border-white/10 bg-[rgba(255,255,255,0.03)] p-4">
                  {isLoading ? (
                    <div className="space-y-2">
                      <div className="h-4 w-28 animate-pulse rounded-full bg-white/10" />
                      <div className="h-6 w-40 animate-pulse rounded-full bg-white/10" />
                      <div className="h-4 w-36 animate-pulse rounded-full bg-white/10" />
                    </div>
                  ) : (
                    <>
                      <p className="text-sm text-white/55">Certification Status</p>
                      <p className="mt-2 text-lg font-semibold text-white">
                        {certificationStatusLabel}
                      </p>
                      <p className="mt-1 text-sm text-[var(--text-muted)]">
                        {renewalDate
                          ? `Renewal due on ${formatMembershipDate(renewalDate)}`
                          : "Renewal date pending"}
                      </p>
                    </>
                  )}
                </div>
              </div>

              <div className="rounded-[32px] border border-white/10 bg-white/5 p-4 backdrop-blur-2xl">
                <nav aria-label="Dashboard navigation">
                  <div className="flex flex-col gap-2">
                    <SidebarItem
                      icon={<LayoutDashboard size={18} />}
                      label="Dashboard"
                      onClick={handleDashboardReset}
                      activePaths={["/dashboard"]}
                      exactMatch
                      tone="primary"
                    />
                    <SidebarItem
                      icon={<Home size={18} />}
                      label="My Listings"
                      href="/dashboard/listings"
                      activePaths={["/dashboard/listings"]}
                      tone="primary"
                    />
                    <SidebarItem
                      icon={<Inbox size={18} />}
                      label="Inbox"
                      href="/dashboard/inbox"
                      activePaths={["/dashboard/inbox"]}
                      exactMatch
                      badge={String(unreadMessageCount)}
                      tone="primary"
                    />
                  </div>

                  <div className="mt-6 flex flex-col gap-2">
                    <SidebarItem
                      icon={<GraduationCap size={18} />}
                      label="Academy"
                      href="/dashboard/academy"
                      activePaths={["/dashboard/academy"]}
                      exactMatch
                      tone="secondary"
                    />
                    <SidebarItem
                      icon={<Megaphone size={18} />}
                      label="Marketing Assets"
                      href="/dashboard/marketing-assets"
                      activePaths={["/dashboard/marketing-assets"]}
                      exactMatch
                      tone="secondary"
                    />
                  </div>

                  <div className="mt-6 flex flex-col gap-2">
                    <SidebarItem
                      icon={<User size={18} />}
                      label="Profile Settings"
                      onClick={handleOpenProfileSettings}
                      activePaths={["/onboarding"]}
                      exactMatch
                      tone="account"
                    />
                    <SidebarItem
                      icon={<CreditCard size={18} />}
                      label="Billing & Membership"
                      href="/dashboard/billing"
                      activePaths={["/dashboard/billing"]}
                      exactMatch
                      tone="account"
                    />
                  </div>

                  <div className="mt-6 flex flex-col gap-2">
                    <SidebarItem
                      icon={<HelpCircle size={18} />}
                      label="Help & Support"
                      href="/dashboard/help"
                      activePaths={["/dashboard/help"]}
                      exactMatch
                      tone="footer"
                    />
                    <SidebarItem
                      icon={<LogOut size={18} />}
                      label={isLoggingOut ? "Logging out..." : "Logout"}
                      onClick={handleLogout}
                      disabled={isLoggingOut}
                      tone="footer"
                    />
                  </div>
                </nav>
              </div>
            </aside>

            <section className="space-y-8">
              {agentLookupError && (
                <div className="rounded-2xl border border-red-400/30 bg-red-400/10 px-4 py-3 text-sm text-red-200">
                  {agentLookupError}
                </div>
              )}

              <div className="rounded-[36px] border border-white/10 bg-[linear-gradient(135deg,rgba(22,37,68,0.92),rgba(11,20,38,0.90))] p-8 shadow-[0_35px_90px_rgba(0,0,0,.30)] backdrop-blur-2xl">
                <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <p className="text-sm uppercase tracking-[0.22em] text-white/40">
                      Agent Growth Hub
                    </p>
                    {isLoading ? (
                      <div className="mt-3 space-y-3">
                        <div className="h-10 w-56 animate-pulse rounded-full bg-white/10 md:h-12 md:w-72" />
                      </div>
                    ) : (
                      <h1 className="mt-3 text-4xl font-bold md:text-5xl">
                        {heroHeading}
                      </h1>
                    )}

                    <p className="mt-4 max-w-2xl text-lg leading-8 text-[var(--text-muted)]">
                      Track your exposure, grow your professional profile, access
                      training, and monitor how the platform is helping your
                      business.
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center justify-start gap-3 lg:justify-end">
                    {isActiveAgent ? (
                      <Link
                        href="/dashboard/listings/new"
                        className="inline-flex items-center gap-2 rounded-full bg-[var(--gold-main)] px-4 py-2.5 text-sm font-semibold text-black transition hover:bg-[var(--gold-soft)]"
                      >
                        <PlusCircle size={16} />
                        Add Listing
                      </Link>
                    ) : (
                      <p className="max-w-xs text-right text-sm text-yellow-200">
                        Complete your activation to start adding listings
                      </p>
                    )}
                    {isAdmin && (
                      <button
                        type="button"
                        onClick={handleSwitchToAdminPanel}
                        className={subtleHeaderButtonClass}
                      >
                        <ShieldCheck size={16} />
                        Switch to Admin Panel
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={handleLogout}
                      disabled={isLoggingOut}
                      className={subtleHeaderButtonClass}
                    >
                      <LogOut size={16} />
                      {isLoggingOut ? "Logging out..." : "Logout"}
                    </button>
                  </div>
                </div>
              </div>

              <div className="rounded-[30px] border border-white/10 bg-[linear-gradient(135deg,rgba(212,175,55,0.10),rgba(255,255,255,0.03))] p-4 shadow-[0_18px_45px_rgba(0,0,0,.18)] backdrop-blur-2xl">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <p className="text-sm uppercase tracking-[0.22em] text-white/45">
                      Activation Progress
                    </p>
                    <h2 className="mt-2 text-xl font-semibold text-white">
                      Become a Certified CRLA Agent
                    </h2>
                    <p className="mt-2 text-sm text-[var(--text-muted)]">
                      {isActiveAgent
                        ? "You are now an active CRLA Agent"
                        : "Complete your activation to be listed in the CRLA directory"}
                    </p>
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-right">
                    <p className="text-[11px] uppercase tracking-[0.18em] text-white/45">
                      Progress
                    </p>
                    <p className="mt-1 text-2xl font-bold text-white">
                      {activationCompletedCount} / 3
                    </p>
                    <p className="mt-1 text-xs text-[var(--text-muted)]">
                      completed
                    </p>
                  </div>
                </div>

                <div className="mt-4 grid gap-3 lg:grid-cols-3">
                  <ActivationStepCard
                    title="Profile Setup"
                    href="/onboarding"
                    icon={<User size={18} />}
                    status={profileStepStatus}
                  />
                  <ActivationStepCard
                    title="Certification"
                    href="/dashboard/academy"
                    icon={<GraduationCap size={18} />}
                    status={certificationStepStatus}
                  />
                  <ActivationStepCard
                    title="Membership Payment"
                    href="/dashboard/billing"
                    icon={<CreditCard size={18} />}
                    status={membershipStepStatus}
                  />
                </div>
              </div>

              <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
                {dashboardMetricCards.map((card) => (
                  <MetricCard
                    key={card.title}
                    icon={card.icon}
                    title={card.title}
                    value={card.value}
                    detail={card.detail}
                  />
                ))}
              </div>

              <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
                <div className="rounded-[32px] border border-white/10 bg-white/5 p-7 backdrop-blur-2xl">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h2 className="text-2xl font-semibold">Growth Tracker</h2>
                      <p className="mt-2 text-sm text-[var(--text-muted)]">
                        Strengthen your visibility, credibility, and client
                        response performance.
                      </p>
                    </div>
                    <div className="rounded-full border border-[var(--gold-main)]/25 bg-[rgba(212,175,55,0.10)] px-3 py-1 text-xs font-medium text-[var(--gold-main)]">
                      Elite path ready
                    </div>
                  </div>

                  <div className="mt-6 grid gap-5 md:grid-cols-2">
                    {progressCards.map((card) => (
                      <ProgressCard
                        key={card.title}
                        title={card.title}
                        value={card.value}
                        progress={card.progress}
                        note={card.note}
                      />
                    ))}
                  </div>
                </div>

                <div className="rounded-[32px] border border-white/10 bg-[linear-gradient(135deg,rgba(212,175,55,0.10),rgba(255,255,255,0.04))] p-7 backdrop-blur-2xl">
                  <p className="text-sm uppercase tracking-[0.2em] text-white/45">
                    Certification Path
                  </p>
                  <h2 className="mt-3 text-2xl font-semibold">
                    Gold Certified Member
                  </h2>
                  <p className="mt-3 text-sm leading-7 text-[var(--text-muted)]">
                    You are currently a verified Gold member. Complete your
                    remaining academy modules and maintain strong response
                    performance to qualify for Elite recognition.
                  </p>

                  <div className="mt-6 space-y-4">
                    {certificationHighlights.map((item) => (
                      <div
                        key={item}
                        className="flex items-start gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3"
                      >
                        <CheckCircle2
                          size={18}
                          className="mt-0.5 text-[var(--gold-main)]"
                        />
                        <span className="text-sm text-white/80">{item}</span>
                      </div>
                    ))}
                  </div>

                  <Link
                    href="#"
                    className="mt-6 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-6 py-3 text-sm font-semibold text-white transition duration-300 hover:bg-white/10"
                  >
                    View Certification Details
                    <ArrowRight size={16} />
                  </Link>
                </div>
              </div>

              <ChangePasswordSection />

              <div className="grid gap-6 xl:grid-cols-[1fr_1fr]">
                <div className="rounded-[32px] border border-white/10 bg-white/5 p-7 backdrop-blur-2xl">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h2 className="text-2xl font-semibold">New in Academy</h2>
                      <p className="mt-2 text-sm text-[var(--text-muted)]">
                        Fresh training materials and operating guidance for your
                        next session.
                      </p>
                    </div>
                    <GraduationCap className="text-[var(--gold-main)]" size={24} />
                  </div>

                  <div className="mt-6 space-y-4">
                    {academyResources.map((resource) => {
                      const resourceType = inferAcademyType(resource);

                      return (
                        <div
                          key={resource.id}
                          className="rounded-2xl border border-white/10 bg-white/5 p-5"
                        >
                          <div className="flex items-center justify-between gap-4">
                            <span className="inline-flex items-center gap-2 rounded-full border border-[var(--gold-main)]/20 bg-[rgba(212,175,55,0.10)] px-3 py-1 text-xs font-semibold text-[var(--gold-main)]">
                              {resourceType === "Video" ? (
                                <PlayCircle size={14} />
                              ) : (
                                <FileText size={14} />
                              )}
                              {resourceType}
                            </span>
                            <span className="text-xs text-white/45">
                              {formatCreatedAt(resource.created_at)}
                            </span>
                          </div>
                          <p className="mt-4 text-lg font-semibold text-white">
                            {resource.title || "Untitled training resource"}
                          </p>
                          <p className="mt-2 text-sm text-[var(--text-muted)]">
                            {resource.description ||
                              "New academy guidance is ready for review."}
                          </p>
                        </div>
                      );
                    })}

                    {!isLoading && academyResources.length === 0 && (
                      <div className="rounded-2xl border border-white/10 bg-white/5 p-5 text-sm text-slate-400">
                        No training materials available yet.
                      </div>
                    )}

                    {isLoading && (
                      <div className="rounded-2xl border border-white/10 bg-white/5 p-5 text-sm text-slate-400">
                        Loading academy content...
                      </div>
                    )}

                    <div className="grid gap-4 sm:grid-cols-2">
                      <QuickAction
                        icon={<Download size={16} />}
                        title="Latest Training Files"
                        href="/dashboard/academy"
                      />
                      <QuickAction
                        icon={<GraduationCap size={16} />}
                        title="Go to Academy"
                        href="/dashboard/academy"
                      />
                    </div>
                  </div>
                </div>

                <div className="rounded-[32px] border border-white/10 bg-white/5 p-7 backdrop-blur-2xl">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h2 className="text-2xl font-semibold">Achievements</h2>
                      <p className="mt-2 text-sm text-[var(--text-muted)]">
                        Recognition that strengthens your public credibility.
                      </p>
                    </div>
                    <Star className="text-[var(--gold-main)]" size={24} />
                  </div>

                  <div className="mt-6 grid gap-4 sm:grid-cols-2">
                    {achievements.map((badge) => (
                      <AchievementBadge
                        key={badge.title}
                        title={badge.title}
                        subtitle={badge.subtitle}
                      />
                    ))}
                  </div>
                </div>
              </div>

              <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
                <div className="rounded-[32px] border border-white/10 bg-white/5 p-7 backdrop-blur-2xl">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h2 className="text-2xl font-semibold">
                        Latest Marketing Assets
                      </h2>
                      <p className="mt-2 text-sm text-[var(--text-muted)]">
                        The newest branded downloads ready to share, post, and
                        present.
                      </p>
                    </div>
                    <Link
                      href="/dashboard/marketing-assets"
                      className="rounded-full border border-white/15 bg-white/5 px-4 py-2 text-sm font-medium text-white transition hover:bg-white/10"
                    >
                      View all assets
                    </Link>
                  </div>

                  <div className="mt-6 space-y-4">
                    {latestMarketingAssets.map((asset) => (
                      <div
                        key={asset.id}
                        className="flex flex-col gap-4 rounded-2xl border border-white/10 bg-white/5 p-5"
                      >
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                          <div className="flex items-center gap-4">
                            {asset.file_url ? (
                              <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-2xl border border-white/10 bg-white/5">
                                <img
                                  src={asset.file_url}
                                  alt={asset.title || "Marketing asset preview"}
                                  className="h-full w-full object-cover"
                                />
                              </div>
                            ) : null}
                            <div>
                              <p className="font-semibold text-white">
                                {asset.title || "Untitled asset"}
                              </p>
                              <p className="mt-1 text-sm text-[var(--text-muted)]">
                                {formatLabel(asset.category, "Marketing")} •{" "}
                                {formatCreatedAt(asset.created_at)}
                              </p>
                              {asset.description && (
                                <p className="mt-2 text-sm text-white/60">
                                  {asset.description}
                                </p>
                              )}
                            </div>
                          </div>
                          {asset.file_url ? (
                            <a
                              href={`${asset.file_url}?download=1`}
                              className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-2 text-sm font-medium text-white transition hover:bg-white/10"
                            >
                              Download
                              <Download size={14} />
                            </a>
                          ) : (
                            <span className="text-sm text-white/45">
                              File unavailable
                            </span>
                          )}
                        </div>
                      </div>
                    ))}

                    {!isLoading && latestMarketingAssets.length === 0 && (
                      <div className="rounded-2xl border border-white/10 bg-white/5 px-5 py-8 text-center text-sm text-slate-400">
                        No assets available yet.
                      </div>
                    )}

                    {isLoading && (
                      <div className="rounded-2xl border border-white/10 bg-white/5 px-5 py-8 text-center text-sm text-slate-400">
                        Loading marketing assets...
                      </div>
                    )}
                  </div>
                </div>

                <div className="rounded-[32px] border border-white/10 bg-[linear-gradient(135deg,rgba(22,37,68,0.94),rgba(11,20,38,0.92))] p-7 backdrop-blur-2xl">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h2 className="text-2xl font-semibold">
                        Billing & Membership
                      </h2>
                      <p className="mt-2 text-sm text-[var(--text-muted)]">
                        Track plan status, membership validity, and billing
                        history from one place.
                      </p>
                    </div>
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-semibold ${getMembershipStatusBadgeClass(
                        membership?.status ?? null
                      )}`}
                    >
                      {formatMembershipStatus(membership?.status ?? null)}
                    </span>
                  </div>

                  <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-5">
                    <p className="text-sm text-white/55">Current Membership</p>
                    <p className="mt-2 text-lg font-semibold text-white">
                      {membership?.plan_name || "No membership on file"}
                    </p>
                    <p className="mt-2 text-sm text-[var(--text-muted)]">
                      {membership
                        ? `${formatMembershipCurrency(
                            membership.amount,
                            membership.currency
                          )} • Valid until ${formatMembershipDate(
                            membership.expires_at
                          )}`
                        : "Membership details will appear here once your billing record is created."}
                    </p>
                  </div>

                  <div className="mt-4 grid gap-4 sm:grid-cols-2">
                    <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
                      <p className="text-sm text-white/55">Days Remaining</p>
                      <p className="mt-2 text-lg font-semibold text-white">
                        {membershipDaysRemaining === null
                          ? "—"
                          : `${membershipDaysRemaining} days`}
                      </p>
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
                      <p className="text-sm text-white/55">Renewal Period</p>
                      <p className="mt-2 text-lg font-semibold text-white">
                        {membership?.renewal_period
                          ? membership.renewal_period.charAt(0).toUpperCase() +
                            membership.renewal_period.slice(1)
                          : "—"}
                      </p>
                    </div>
                  </div>

                  <div className="mt-6 space-y-4">
                    <QuickAction
                      icon={<Home size={16} />}
                      title="Open My Listings"
                      href="/dashboard/listings"
                    />
                    <QuickAction
                      icon={<CreditCard size={16} />}
                      title="Open Billing & Membership"
                      href="/dashboard/billing"
                    />
                    <QuickAction
                      icon={<Megaphone size={16} />}
                      title="Open Marketing Assets"
                      href="/dashboard/marketing-assets"
                    />
                    <QuickAction
                      icon={<HelpCircle size={16} />}
                      title="Request Support"
                    />
                  </div>
                </div>
              </div>

              <div className="rounded-[32px] border border-white/10 bg-white/5 p-7 backdrop-blur-2xl">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h2 className="text-2xl font-semibold">Recent Listings</h2>
                    <p className="mt-2 text-sm text-[var(--text-muted)]">
                      Your latest renovation listings and projected readiness.
                    </p>
                  </div>
                  <Link
                    href="/dashboard/listings"
                    className="rounded-full border border-white/15 bg-white/5 px-4 py-2 text-sm font-medium text-white transition hover:bg-white/10"
                  >
                    View All
                  </Link>
                </div>

                <div className="mt-6 space-y-4">
                  {listings.map((item) => (
                    <div
                      key={item.id}
                      className="flex flex-col gap-4 rounded-2xl border border-white/10 bg-white/5 px-5 py-4 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div>
                        <p className="font-semibold text-white">
                          {item.title || "Untitled listing"}
                        </p>
                        <p className="mt-1 text-sm text-[var(--text-muted)]">
                          {formatCompactCurrency(item.projected_price)} • Expected{" "}
                          {formatCreatedAt(item.expected_completion_date)}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-medium ${
                            item.status === "ready"
                              ? "bg-[rgba(212,175,55,0.12)] text-[var(--gold-main)]"
                              : "bg-white/10 text-white/70"
                          }`}
                        >
                          {item.status.replace("_", " ")}
                        </span>
                        <Clock3 size={16} className="text-white/35" />
                      </div>
                    </div>
                  ))}

                  {!isLoading && listings.length === 0 && (
                    <div className="rounded-2xl border border-white/10 bg-white/5 px-5 py-8 text-center text-sm text-slate-400">
                      You don’t have any listings yet
                    </div>
                  )}
                </div>
              </div>
            </section>
          </div>
        </div>
      </Container>
    </main>
  );
}
