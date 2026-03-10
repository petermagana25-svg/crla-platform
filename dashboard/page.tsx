"use client";

import Link from "next/link";
import {
  LayoutDashboard,
  Home,
  Inbox,
  GraduationCap,
  Award,
  BarChart3,
  Megaphone,
  User,
  CreditCard,
  HelpCircle,
  LogOut,
  PlusCircle,
  ArrowRight,
  ShieldCheck,
  Eye,
  MousePointerClick,
  Users,
  Briefcase,
  CheckCircle2,
  CalendarDays,
  Download,
  Star,
  Clock3,
} from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import Container from "@/components/layout/Container";

type SidebarItemProps = {
  icon: React.ReactNode;
  label: string;
  active?: boolean;
};

function SidebarItem({ icon, label, active = false }: SidebarItemProps) {
  return (
    <button
      className={`flex w-full items-center gap-3 rounded-2xl border px-4 py-3 text-left text-sm font-medium transition ${
        active
          ? "border-[var(--gold-main)]/30 bg-[rgba(212,175,55,0.10)] text-white shadow-[0_10px_30px_rgba(212,175,55,.10)]"
          : "border-white/10 bg-white/5 text-white/70 hover:bg-white/[0.08] hover:text-white"
      }`}
    >
      <span className={active ? "text-[var(--gold-main)]" : "text-white/60"}>
        {icon}
      </span>
      {label}
    </button>
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
  return (
    <main className="min-h-screen bg-[var(--navy-dark)] text-white">
      <Navbar />

      <Container>
        <div className="py-10 lg:py-14">
          <div className="grid gap-8 lg:grid-cols-[280px_minmax(0,1fr)]">
            {/* SIDEBAR */}
            <aside className="space-y-6">
              <div className="rounded-[32px] border border-white/10 bg-white/5 p-6 backdrop-blur-2xl shadow-[0_25px_70px_rgba(0,0,0,.28)]">
                <div className="flex items-center gap-4">
                  <div className="h-16 w-16 overflow-hidden rounded-2xl border border-white/10 bg-white/5">
                    <img
                      src="/images/agent-1.jpg"
                      alt="Agent profile"
                      className="h-full w-full object-cover"
                    />
                  </div>

                  <div className="min-w-0">
                    <p className="text-xs uppercase tracking-[0.2em] text-white/40">
                      Certified Agent
                    </p>
                    <h2 className="mt-1 truncate text-xl font-semibold">
                      James Walker
                    </h2>
                    <div className="mt-2 inline-flex items-center gap-2 rounded-full border border-[var(--gold-main)]/25 bg-[rgba(212,175,55,0.10)] px-3 py-1 text-xs font-medium text-[var(--gold-main)]">
                      <ShieldCheck size={14} />
                      Gold Member
                    </div>
                  </div>
                </div>

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
                <div className="space-y-2">
                  <SidebarItem
                    icon={<LayoutDashboard size={18} />}
                    label="Dashboard"
                    active
                  />
                  <SidebarItem
                    icon={<Home size={18} />}
                    label="My Listings"
                  />
                  <SidebarItem
                    icon={<Inbox size={18} />}
                    label="Leads"
                  />
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

                <div className="mt-5 border-t border-white/10 pt-5">
                  <div className="space-y-2">
                    <SidebarItem
                      icon={<HelpCircle size={18} />}
                      label="Help & Support"
                    />
                    <SidebarItem
                      icon={<LogOut size={18} />}
                      label="Logout"
                    />
                  </div>
                </div>
              </div>
            </aside>

            {/* MAIN */}
            <section className="space-y-8">
              {/* HEADER */}
              <div className="rounded-[36px] border border-white/10 bg-[linear-gradient(135deg,rgba(22,37,68,0.92),rgba(11,20,38,0.90))] p-8 shadow-[0_35px_90px_rgba(0,0,0,.30)] backdrop-blur-2xl">
                <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <p className="text-sm uppercase tracking-[0.22em] text-white/40">
                      Agent Growth Hub
                    </p>
                    <h1 className="mt-3 text-4xl font-bold md:text-5xl">
                      Welcome back, James
                    </h1>
                    <p className="mt-4 max-w-2xl text-lg leading-8 text-[var(--text-muted)]">
                      Track your exposure, grow your professional profile, access
                      training, and monitor how the platform is helping your business.
                    </p>
                  </div>

                  <div className="flex flex-col gap-3 sm:flex-row">
                    <Link
                      href="#"
                      className="inline-flex items-center justify-center gap-2 rounded-full bg-[var(--gold-main)] px-7 py-4 font-semibold text-black transition duration-300 hover:-translate-y-1 hover:bg-[var(--gold-soft)] hover:shadow-[0_15px_45px_rgba(212,175,55,.35)]"
                    >
                      <PlusCircle size={18} />
                      Add Listing
                    </Link>
                    <Link
                      href="#"
                      className="inline-flex items-center justify-center gap-2 rounded-full border border-white/15 bg-white/5 px-7 py-4 font-semibold text-white transition duration-300 hover:-translate-y-1 hover:bg-white/10"
                    >
                      <Download size={18} />
                      Download Marketing Kit
                    </Link>
                  </div>
                </div>
              </div>

              {/* STATUS / PERFORMANCE METRICS */}
              <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
                <MetricCard
                  icon={<Eye size={20} />}
                  title="Profile Views"
                  value="1,284"
                  detail="Viewed by homeowners this month"
                />
                <MetricCard
                  icon={<MousePointerClick size={20} />}
                  title="Listing Clicks"
                  value="372"
                  detail="Buyer engagement across your listings"
                />
                <MetricCard
                  icon={<Users size={20} />}
                  title="Leads Received"
                  value="24"
                  detail="New inquiries from the platform"
                />
                <MetricCard
                  icon={<Briefcase size={20} />}
                  title="Deals Closed"
                  value="7"
                  detail="Closed transactions this quarter"
                />
              </div>

              {/* GROWTH + CERTIFICATION */}
              <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
                <div className="rounded-[32px] border border-white/10 bg-white/5 p-7 backdrop-blur-2xl">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h2 className="text-2xl font-semibold">
                        Growth Tracker
                      </h2>
                      <p className="mt-2 text-sm text-[var(--text-muted)]">
                        Strengthen your visibility, credibility, and client response performance.
                      </p>
                    </div>
                    <div className="rounded-full border border-[var(--gold-main)]/25 bg-[rgba(212,175,55,0.10)] px-3 py-1 text-xs font-medium text-[var(--gold-main)]">
                      Elite path ready
                    </div>
                  </div>

                  <div className="mt-6 grid gap-5 md:grid-cols-2">
                    <ProgressCard
                      title="Profile Completion"
                      value="92%"
                      progress={92}
                      note="Add an intro video to reach full completion."
                    />
                    <ProgressCard
                      title="Courses Completed"
                      value="6 of 8"
                      progress={75}
                      note="Two final modules unlock advanced recognition."
                    />
                    <ProgressCard
                      title="Response Time Score"
                      value="89%"
                      progress={89}
                      note="Fast responses improve lead conversion and ranking."
                    />
                    <ProgressCard
                      title="Client Rating Average"
                      value="4.9 / 5"
                      progress={98}
                      note="Excellent trust signal for new homeowner visitors."
                    />
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
                    You are currently a verified Gold member. Complete your remaining
                    academy modules and maintain strong response performance to qualify
                    for Elite recognition.
                  </p>

                  <div className="mt-6 space-y-4">
                    {[
                      "Certification valid through Dec 18, 2026",
                      "6 continuing education credits completed",
                      "2 advanced modules left for Elite tier",
                      "Verification badge visible on your public profile",
                    ].map((item, index) => (
                      <div
                        key={index}
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

              {/* ACADEMY + ACHIEVEMENTS */}
              <div className="grid gap-6 xl:grid-cols-[1fr_1fr]">
                <div className="rounded-[32px] border border-white/10 bg-white/5 p-7 backdrop-blur-2xl">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h2 className="text-2xl font-semibold">Academy Center</h2>
                      <p className="mt-2 text-sm text-[var(--text-muted)]">
                        Continue your training and unlock more credibility tools.
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
                        <CalendarDays size={16} className="text-[var(--gold-main)]" />
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
                    <AchievementBadge
                      title="Top Responder"
                      subtitle="Fast lead response this month"
                    />
                    <AchievementBadge
                      title="5-Star Service"
                      subtitle="Outstanding client rating"
                    />
                    <AchievementBadge
                      title="Luxury Specialist"
                      subtitle="Premium listing performance"
                    />
                    <AchievementBadge
                      title="Market Advisor"
                      subtitle="Strong homeowner engagement"
                    />
                  </div>
                </div>
              </div>

              {/* LISTINGS + QUICK ACTIONS */}
              <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
                <div className="rounded-[32px] border border-white/10 bg-white/5 p-7 backdrop-blur-2xl">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h2 className="text-2xl font-semibold">Recent Listings</h2>
                      <p className="mt-2 text-sm text-[var(--text-muted)]">
                        Properties currently visible in your certified agent portfolio.
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
                    {[
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
                    ].map((item, index) => (
                      <div
                        key={index}
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

                <div className="rounded-[32px] border border-white/10 bg-[linear-gradient(135deg,rgba(22,37,68,0.94),rgba(11,20,38,0.92))] p-7 backdrop-blur-2xl">
                  <h2 className="text-2xl font-semibold">Quick Actions</h2>
                  <p className="mt-2 text-sm text-[var(--text-muted)]">
                    Use the platform to improve visibility and keep momentum high.
                  </p>

                  <div className="mt-6 space-y-4">
                    <QuickAction
                      icon={<PlusCircle size={16} />}
                      title="Add New Listing"
                    />
                    <QuickAction
                      icon={<User size={16} />}
                      title="Update Profile"
                    />
                    <QuickAction
                      icon={<Download size={16} />}
                      title="Download Marketing Assets"
                    />
                    <QuickAction
                      icon={<HelpCircle size={16} />}
                      title="Request Support"
                    />
                  </div>

                  <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-5">
                    <p className="text-sm text-white/55">Plan & Exposure</p>
                    <p className="mt-2 text-lg font-semibold text-white">
                      Professional Visibility Plan
                    </p>
                    <p className="mt-2 text-sm leading-7 text-[var(--text-muted)]">
                      Your listings, profile visibility, and badge exposure are active.
                      Continue improving performance to increase reach inside the platform.
                    </p>
                  </div>
                </div>
              </div>
            </section>
          </div>
        </div>
      </Container>
    </main>
  );
}