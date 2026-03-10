"use client";

import Link from "next/link";
import {
  LayoutDashboard,
  Home,
  User,
  Inbox,
  Settings,
  LogOut,
  PlusCircle,
} from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import Container from "@/components/layout/Container";

function StatCard({ title, value }: { title: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur hover:bg-white/[0.07] transition">
      <p className="text-sm text-white/60">{title}</p>
      <p className="mt-2 text-3xl font-bold text-[var(--gold-main)]">{value}</p>
    </div>
  );
}

export default function AgentDashboard() {
  return (
    <main className="min-h-screen bg-[var(--navy-dark)] text-white">
      <Navbar />

      <Container>
        <div className="flex gap-10 py-16">

          {/* SIDEBAR */}
          <aside className="hidden w-64 flex-col gap-4 lg:flex">
            <div className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur">
              <p className="text-sm text-white/50">Agent Portal</p>
              <h2 className="mt-2 text-xl font-semibold">James Walker</h2>
            </div>

            <nav className="flex flex-col gap-2">
              {[
                { icon: LayoutDashboard, label: "Dashboard" },
                { icon: Home, label: "My Listings" },
                { icon: Inbox, label: "Leads Inbox" },
                { icon: User, label: "Profile" },
                { icon: Settings, label: "Settings" },
              ].map((item, i) => (
                <button
                  key={i}
                  className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/80 backdrop-blur transition hover:bg-white/[0.08]"
                >
                  <item.icon size={18} />
                  {item.label}
                </button>
              ))}

              <button className="mt-6 flex items-center gap-3 rounded-xl border border-red-400/20 bg-red-500/10 px-4 py-3 text-sm text-red-300 backdrop-blur transition hover:bg-red-500/20">
                <LogOut size={18} />
                Logout
              </button>
            </nav>
          </aside>

          {/* MAIN CONTENT */}
          <div className="flex-1">

            {/* HEADER */}
            <div className="mb-10 flex flex-wrap items-center justify-between gap-6">
              <div>
                <h1 className="text-4xl font-bold">Dashboard Overview</h1>
                <p className="mt-2 text-white/60">
                  Manage your listings, profile, and client inquiries.
                </p>
              </div>

              <Link
                href="#"
                className="inline-flex items-center gap-2 rounded-full bg-[var(--gold-main)] px-6 py-3 font-semibold text-black transition hover:-translate-y-1 hover:bg-[var(--gold-soft)]"
              >
                <PlusCircle size={18} />
                Add New Listing
              </Link>
            </div>

            {/* STATS */}
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              <StatCard title="Active Listings" value="12" />
              <StatCard title="New Leads" value="8" />
              <StatCard title="Profile Strength" value="92%" />
              <StatCard title="Certification" value="Verified" />
            </div>

            {/* CONTENT BLOCKS */}
            <div className="mt-12 grid gap-10 lg:grid-cols-2">

              {/* Listings */}
              <div className="rounded-3xl border border-white/10 bg-white/5 p-8 backdrop-blur">
                <h2 className="text-2xl font-semibold">Recent Listings</h2>
                <p className="mt-2 text-sm text-white/60">
                  Your most recent property updates
                </p>

                <div className="mt-6 space-y-4">
                  {["Modern Family Home", "Luxury Coastal Villa", "Downtown Loft"].map((item, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 px-4 py-3"
                    >
                      <span>{item}</span>
                      <span className="text-xs text-[var(--gold-main)]">Active</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Profile Completion */}
              <div className="rounded-3xl border border-white/10 bg-gradient-to-br from-[#162544] to-[#0b1426] p-8 shadow-[0_30px_90px_rgba(0,0,0,.35)]">
                <h2 className="text-2xl font-semibold">Profile Optimization</h2>
                <p className="mt-2 text-sm text-white/60">
                  Complete your profile to gain more visibility
                </p>

                <div className="mt-6 h-3 w-full rounded-full bg-white/10">
                  <div className="h-3 w-[92%] rounded-full bg-[var(--gold-main)]" />
                </div>

                <ul className="mt-6 space-y-3 text-sm text-white/70">
                  <li>✓ Profile photo uploaded</li>
                  <li>✓ Bio completed</li>
                  <li>✓ Service areas added</li>
                  <li className="text-yellow-300">• Add intro video</li>
                </ul>
              </div>

            </div>

          </div>
        </div>
      </Container>
    </main>
  );
}