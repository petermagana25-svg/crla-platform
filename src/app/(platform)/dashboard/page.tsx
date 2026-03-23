"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  ArrowRight,
  Award,
  BarChart3,
  CalendarDays,
  CheckCircle2,
  Clock3,
  CreditCard,
  Download,
  ExternalLink,
  Eye,
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
  Briefcase,
} from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import Container from "@/components/layout/Container";
import { getCurrentUserRoleClient } from "@/lib/get-current-user-role-client";
import { logout } from "@/lib/logout";
import { supabase } from "@/lib/supabase";

type Profile = {
  avatar_url: string | null;
  city: string | null;
  full_name: string | null;
  license_number: string | null;
};

type Resource = {
  id: string;
  title: string | null;
  category: string | null;
  file_url: string | null;
  created_at: string | null;
};

type SidebarItemProps = {
  icon: React.ReactNode;
  label: string;
  href?: string;
  onClick?: () => void;
  disabled?: boolean;
};

const subtleHeaderButtonClass =
  "inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm font-medium text-slate-200 transition hover:bg-white/10 hover:text-white disabled:cursor-not-allowed disabled:opacity-60";

// TODO: Replace these dashboard cards with live analytics once reporting data is available.
const metricCards = [
  {
    icon: <Eye size={20} />,
    title: "Profile Views",
    value: "1,284",
    detail: "Viewed by homeowners this month",
  },
  {
    icon: <MousePointerClick size={20} />,
    title: "Listing Clicks",
    value: "372",
    detail: "Buyer engagement across your listings",
  },
  {
    icon: <Users size={20} />,
    title: "Leads Received",
    value: "24",
    detail: "New inquiries from the platform",
  },
  {
    icon: <Briefcase size={20} />,
    title: "Deals Closed",
    value: "7",
    detail: "Closed transactions this quarter",
  },
] as const;

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

const recentListings = [
  {
    title: "Modern Family Home",
    status: "Active",
    metric: "142 views this week",
  },
  {
    title: "Luxury Coastal Villa",
    status: "Pending",
    metric: "87 clicks this week",
  },
  {
    title: "Downtown Loft Upgrade",
    status: "Active",
    metric: "64 saves this week",
  },
] as const;

function SidebarItem({
  icon,
  label,
  href = "#",
  onClick,
  disabled = false,
}: SidebarItemProps) {
  const pathname = usePathname();
  const isActiveRoute = href !== "#" && pathname === href;
  const isPrimary = href === "/dashboard/marketing-assets";

  const className = `flex w-full items-center gap-3 rounded-2xl border px-5 py-3.5 text-left text-[15px] font-medium transition-all duration-300 ${
    isPrimary
      ? "border-[var(--gold-main)] bg-[var(--gold-main)] text-black shadow-[0_10px_30px_rgba(212,175,55,.35)] hover:bg-[var(--gold-soft)] hover:shadow-[0_15px_40px_rgba(212,175,55,.45)] hover:-translate-y-[1px]"
      : isActiveRoute
        ? "border-[var(--gold-main)]/30 bg-[rgba(212,175,55,0.10)] text-white shadow-[0_10px_30px_rgba(212,175,55,.10)]"
        : href !== "#" || onClick
          ? "border-white/10 bg-white/5 text-white/80 hover:border-[var(--gold-main)]/30 hover:bg-[rgba(212,175,55,0.18)] hover:text-white hover:shadow-[0_10px_25px_rgba(212,175,55,.15)]"
          : "cursor-default border-white/10 bg-white/5 text-white/45"
  } ${disabled ? "cursor-not-allowed opacity-60" : ""}`;

  const content = (
    <>
      <span
        className={
          isPrimary
            ? "text-black"
            : isActiveRoute
              ? "text-[var(--gold-main)]"
              : "text-white/60"
        }
      >
        {icon}
      </span>
      {label}
    </>
  );

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
    <Link href={href}>
      <div className={className}>{content}</div>
    </Link>
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

export default function AgentDashboardPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [resources, setResources] = useState<Resource[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  useEffect(() => {
    void loadDashboard();
  }, []);

  async function loadDashboard() {
    setIsLoading(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      router.replace("/login");
      return;
    }

    const role = await getCurrentUserRoleClient();
    setIsAdmin(role === "admin");

    const [{ data: profileData }, { data: resourceData, error: resourceError }] =
      await Promise.all([
        supabase
          .from("profiles")
          .select("avatar_url, city, full_name, license_number")
          .eq("id", user.id)
          .maybeSingle(),
        supabase
          .from("resources")
          .select("id, title, category, file_url, created_at")
          .order("created_at", { ascending: false }),
      ]);

    if (!profileData) {
      router.push("/onboarding");
      return;
    }

    setProfile(profileData);
    setResources(resourceError ? [] : resourceData ?? []);
    setIsLoading(false);
  }

  async function handleLogout() {
    setIsLoggingOut(true);
    await logout(router);
  }

  function formatCreatedAt(value: string | null) {
    if (!value) {
      return "—";
    }

    return new Date(value).toLocaleDateString();
  }

  const featuredResources = resources.slice(0, 4);

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
                    <img
                      src={profile?.avatar_url || "https://i.pravatar.cc/300"}
                      alt="Agent profile"
                      className="h-full w-full object-cover"
                    />
                  </div>

                  <div className="min-w-0">
                    <p className="text-xs uppercase tracking-[0.2em] text-white/40">
                      Certified Agent
                    </p>

                    <h2 className="mt-1 truncate text-xl font-semibold">
                      {profile?.full_name || "Your Name"}
                    </h2>

                    <p className="mt-1 text-xs text-white/50">
                      {profile?.city || "City not set"}
                    </p>

                    <p className="mt-1 text-xs text-white/40">
                      License #{profile?.license_number || "—"}
                    </p>
                  </div>
                </div>

                <Link
                  href="/onboarding"
                  className="mt-5 inline-flex w-full justify-center rounded-xl border border-[var(--gold-main)]/30 px-4 py-2 text-sm font-semibold text-[var(--gold-main)] transition hover:bg-[rgba(212,175,55,0.08)]"
                >
                  Update My Profile
                </Link>

                <div className="mt-6 rounded-2xl border border-white/10 bg-[rgba(255,255,255,0.03)] p-4">
                  <p className="text-sm text-white/55">Certification Status</p>
                  <p className="mt-2 text-lg font-semibold text-white">
                    Verified & Active
                  </p>
                  <p className="mt-1 text-sm text-[var(--text-muted)]">
                    Renewal due on Dec 18, 2026
                  </p>
                </div>
              </div>

              <div className="rounded-[32px] border border-white/10 bg-white/5 p-4 backdrop-blur-2xl">
                <div className="flex flex-col gap-3">
                  <SidebarItem
                    icon={<LayoutDashboard size={18} />}
                    label="Dashboard"
                    href="/dashboard"
                  />
                  <SidebarItem icon={<Home size={18} />} label="My Listings" />
                  <SidebarItem icon={<Inbox size={18} />} label="Leads" />
                  <SidebarItem
                    icon={<GraduationCap size={18} />}
                    label="Academy"
                  />
                  <SidebarItem
                    icon={<Award size={18} />}
                    label="Certification Path"
                  />
                  <SidebarItem
                    icon={<BarChart3 size={18} />}
                    label="Performance Metrics"
                  />
                  <SidebarItem
                    icon={<Megaphone size={18} />}
                    label="Marketing Assets"
                    href="/dashboard/marketing-assets"
                  />
                  <SidebarItem
                    icon={<User size={18} />}
                    label="Profile Settings"
                  />
                  <SidebarItem
                    icon={<CreditCard size={18} />}
                    label="Billing & Plan"
                  />
                </div>

                <div className="mt-6 border-t border-white/10 pt-6">
                  <div className="flex flex-col gap-3">
                    <SidebarItem
                      icon={<HelpCircle size={18} />}
                      label="Help & Support"
                    />
                    <SidebarItem
                      icon={<LogOut size={18} />}
                      label={isLoggingOut ? "Logging out..." : "Logout"}
                      onClick={handleLogout}
                      disabled={isLoggingOut}
                    />
                  </div>
                </div>
              </div>
            </aside>

            <section className="space-y-8">
              <div className="rounded-[36px] border border-white/10 bg-[linear-gradient(135deg,rgba(22,37,68,0.92),rgba(11,20,38,0.90))] p-8 shadow-[0_35px_90px_rgba(0,0,0,.30)] backdrop-blur-2xl">
                <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <p className="text-sm uppercase tracking-[0.22em] text-white/40">
                      Agent Growth Hub
                    </p>
                    <h1 className="mt-3 text-4xl font-bold md:text-5xl">
                      Welcome back, {profile?.full_name || "Agent"}
                    </h1>

                    <p className="mt-4 max-w-2xl text-lg leading-8 text-[var(--text-muted)]">
                      Track your exposure, grow your professional profile, access
                      training, and monitor how the platform is helping your
                      business.
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center justify-start gap-3 lg:justify-end">
                    {isAdmin && (
                      <Link href="/admin" className={subtleHeaderButtonClass}>
                        <ShieldCheck size={16} />
                        Go to Admin Panel
                      </Link>
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

              <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
                {metricCards.map((card) => (
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

              <div className="grid gap-6 xl:grid-cols-[1fr_1fr]">
                <div className="rounded-[32px] border border-white/10 bg-white/5 p-7 backdrop-blur-2xl">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h2 className="text-2xl font-semibold">Academy Center</h2>
                      <p className="mt-2 text-sm text-[var(--text-muted)]">
                        Continue your training and unlock more credibility
                        tools.
                      </p>
                    </div>
                    <GraduationCap className="text-[var(--gold-main)]" size={24} />
                  </div>

                  <div className="mt-6 space-y-4">
                    <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
                      <p className="text-sm text-white/55">Course in Progress</p>
                      <p className="mt-1 text-lg font-semibold text-white">
                        Advanced Renovation ROI for Listings
                      </p>
                      <p className="mt-2 text-sm text-[var(--text-muted)]">
                        78% completed • Finish to unlock Elite pathway credit.
                      </p>
                    </div>

                    <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
                      <p className="text-sm text-white/55">Upcoming Live Training</p>
                      <div className="mt-2 flex items-center gap-2 text-white">
                        <CalendarDays
                          size={16}
                          className="text-[var(--gold-main)]"
                        />
                        <span className="font-medium">
                          Seller Psychology & Renovation Positioning
                        </span>
                      </div>
                      <p className="mt-2 text-sm text-[var(--text-muted)]">
                        Thursday • 2:00 PM UTC
                      </p>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                      <QuickAction
                        icon={<Download size={16} />}
                        title="Download CRLA Playbook"
                      />
                      <QuickAction
                        icon={<GraduationCap size={16} />}
                        title="Enter Academy"
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
                        Marketing Assets
                      </h2>
                      <p className="mt-2 text-sm text-[var(--text-muted)]">
                        Recent marketing and training resources available to your
                        account.
                      </p>
                    </div>
                    <Link
                      href="/dashboard/marketing-assets"
                      className="rounded-full border border-white/15 bg-white/5 px-4 py-2 text-sm font-medium text-white transition hover:bg-white/10"
                    >
                      View All
                    </Link>
                  </div>

                  <div className="mt-6 space-y-4">
                    {featuredResources.map((resource) => (
                      <div
                        key={resource.id}
                        className="flex flex-col gap-4 rounded-2xl border border-white/10 bg-white/5 px-5 py-4 sm:flex-row sm:items-center sm:justify-between"
                      >
                        <div>
                          <p className="font-semibold text-white">
                            {resource.title || "Untitled resource"}
                          </p>
                          <p className="mt-1 text-sm text-[var(--text-muted)]">
                            {(resource.category || "General").replace("_", " ")} •{" "}
                            {formatCreatedAt(resource.created_at)}
                          </p>
                        </div>
                        {resource.file_url ? (
                          <a
                            href={resource.file_url}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-2 text-sm font-medium text-white transition hover:bg-white/10"
                          >
                            Open
                            <ExternalLink size={14} />
                          </a>
                        ) : (
                          <span className="text-sm text-white/45">
                            File unavailable
                          </span>
                        )}
                      </div>
                    ))}

                    {!isLoading && featuredResources.length === 0 && (
                      <div className="rounded-2xl border border-white/10 bg-white/5 px-5 py-8 text-center text-sm text-slate-400">
                        No resources available yet.
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
                  <h2 className="text-2xl font-semibold">Billing & Plan</h2>
                  <p className="mt-2 text-sm text-[var(--text-muted)]">
                    Keep your membership, visibility, and support access in good
                    standing.
                  </p>

                  <div className="mt-6 space-y-4">
                    <QuickAction
                      icon={<PlusCircle size={16} />}
                      title="Add New Listing"
                    />
                    <QuickAction
                      icon={<User size={16} />}
                      title="Update Profile"
                      href="/onboarding"
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

                  <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-5">
                    <p className="text-sm text-white/55">Current Plan</p>
                    <p className="mt-2 text-lg font-semibold text-white">
                      Professional Visibility Plan
                    </p>
                    <p className="mt-2 text-sm leading-7 text-[var(--text-muted)]">
                      Your listings, profile visibility, and badge exposure are
                      active. Continue improving performance to increase reach
                      inside the platform.
                    </p>
                  </div>
                </div>
              </div>

              <div className="rounded-[32px] border border-white/10 bg-white/5 p-7 backdrop-blur-2xl">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h2 className="text-2xl font-semibold">Recent Listings</h2>
                    <p className="mt-2 text-sm text-[var(--text-muted)]">
                      Properties currently visible in your certified agent
                      portfolio.
                    </p>
                  </div>
                  <Link
                    href="#"
                    className="rounded-full border border-white/15 bg-white/5 px-4 py-2 text-sm font-medium text-white transition hover:bg-white/10"
                  >
                    View All
                  </Link>
                </div>

                <div className="mt-6 space-y-4">
                  {recentListings.map((item) => (
                    <div
                      key={item.title}
                      className="flex flex-col gap-4 rounded-2xl border border-white/10 bg-white/5 px-5 py-4 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div>
                        <p className="font-semibold text-white">{item.title}</p>
                        <p className="mt-1 text-sm text-[var(--text-muted)]">
                          {item.metric}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-medium ${
                            item.status === "Active"
                              ? "bg-[rgba(212,175,55,0.12)] text-[var(--gold-main)]"
                              : "bg-white/10 text-white/70"
                          }`}
                        >
                          {item.status}
                        </span>
                        <Clock3 size={16} className="text-white/35" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          </div>
        </div>
      </Container>
    </main>
  );
}
