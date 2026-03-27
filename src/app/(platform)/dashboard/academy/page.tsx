"use client";

import { useEffect, useState } from "react";
import {
  CheckCircle2,
  Download,
  FileText,
  GraduationCap,
  Loader2,
  PlayCircle,
} from "lucide-react";
import { useRouter } from "next/navigation";
import BackToDashboardButton from "@/components/dashboard/BackToDashboardButton";
import Navbar from "@/components/layout/Navbar";
import Container from "@/components/layout/Container";
import { supabase } from "@/lib/supabase";

type CertificationStatus = "not_started" | "in_progress" | "completed";

type AcademyResource = {
  id: string;
  title: string | null;
  description: string | null;
  file_url: string | null;
  created_at: string | null;
};

function inferResourceType(resource: AcademyResource) {
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

function formatCreatedAt(value: string | null) {
  if (!value) {
    return "—";
  }

  return new Date(value).toLocaleDateString();
}

export default function AcademyPage() {
  const router = useRouter();
  const [resources, setResources] = useState<AcademyResource[]>([]);
  const [certificationStatus, setCertificationStatus] =
    useState<CertificationStatus>("not_started");
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdatingCertification, setIsUpdatingCertification] = useState(false);
  const [message, setMessage] = useState<{
    text: string;
    type: "error" | "success";
  } | null>(null);

  async function fetchAcademyResources() {
    setIsLoading(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      router.replace("/login");
      return;
    }

    const [{ data, error }, { data: agentData, error: agentError }] =
      await Promise.all([
        supabase
          .from("resources")
          .select("id, title, description, file_url, created_at")
          .eq("category", "training")
          .order("created_at", { ascending: false }),
        supabase
          .from("agents")
          .select("certification_status")
          .eq("id", user.id)
          .maybeSingle(),
      ]);

    setResources(error ? [] : data ?? []);
    setCertificationStatus(
      agentError || !agentData?.certification_status
        ? "not_started"
        : (agentData.certification_status as CertificationStatus)
    );
    setIsLoading(false);
  }

  async function updateCertificationStatus(nextStatus: CertificationStatus) {
    setIsUpdatingCertification(true);
    setMessage(null);

    try {
      const response = await fetch("/api/agent/certification", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: nextStatus }),
      });

      const result = (await response.json().catch(() => null)) as
        | {
            error?: { message?: string };
            success?: boolean;
          }
        | null;

      if (!response.ok || !result?.success) {
        throw new Error(
          result?.error?.message ||
            "Unable to update certification progress."
        );
      }

      setCertificationStatus(nextStatus);
      setMessage({
        type: "success",
        text:
          nextStatus === "completed"
            ? "Certification marked complete."
            : "Certification progress updated.",
      });
    } catch (error) {
      setMessage({
        type: "error",
        text:
          error instanceof Error
            ? error.message
            : "Unable to update certification progress.",
      });
    } finally {
      setIsUpdatingCertification(false);
    }
  }

  useEffect(() => {
    void fetchAcademyResources();
  }, []);

  const certificationBadgeClass =
    certificationStatus === "completed"
      ? "border border-emerald-400/30 bg-emerald-400/10 text-emerald-200"
      : certificationStatus === "in_progress"
        ? "border border-yellow-400/30 bg-yellow-400/10 text-yellow-200"
        : "border border-red-400/30 bg-red-400/10 text-red-200";

  const certificationCta =
    certificationStatus === "completed"
      ? {
          action: null,
          label: "Certification Completed",
        }
      : certificationStatus === "in_progress"
        ? {
            action: () => updateCertificationStatus("completed"),
            label: "Complete Certification",
          }
        : {
            action: () => updateCertificationStatus("in_progress"),
            label: "Start Certification",
          };

  return (
    <main className="min-h-screen bg-[var(--navy-dark)] text-white">
      <Navbar />

      <Container>
        <div className="space-y-10 py-10 lg:py-14">
          <BackToDashboardButton />

          <div className="rounded-[36px] border border-white/10 bg-[linear-gradient(135deg,rgba(22,37,68,0.92),rgba(11,20,38,0.90))] p-8 shadow-[0_35px_90px_rgba(0,0,0,.30)] backdrop-blur-2xl">
            <div className="flex items-center justify-between gap-6">
              <div>
                <p className="text-sm uppercase tracking-[0.22em] text-white/40">
                  Training Library
                </p>
                <h1 className="mt-3 text-4xl font-bold md:text-5xl">
                  Academy
                </h1>
                <p className="mt-4 max-w-2xl text-lg text-[var(--text-muted)]">
                  Explore the latest CRLA training materials, SOPs, and member
                  education resources in one place.
                </p>
              </div>

              <div className="hidden h-16 w-16 items-center justify-center rounded-3xl border border-[var(--gold-main)]/25 bg-[rgba(212,175,55,0.10)] text-[var(--gold-main)] sm:flex">
                <GraduationCap size={28} />
              </div>
            </div>
          </div>

          <div className="rounded-[32px] border border-white/10 bg-white/5 p-7 backdrop-blur-2xl">
            {message && (
              <div
                className={`mb-6 rounded-2xl px-4 py-3 text-sm ${
                  message.type === "success"
                    ? "border border-emerald-400/30 bg-emerald-400/10 text-emerald-200"
                    : "border border-red-400/30 bg-red-400/10 text-red-200"
                }`}
              >
                {message.text}
              </div>
            )}

            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <p className="text-sm uppercase tracking-[0.2em] text-white/45">
                  Certification Status
                </p>
                <h2 className="mt-3 text-2xl font-semibold text-white">
                  Finish the CRLA certification path
                </h2>
                <p className="mt-3 max-w-2xl text-sm leading-7 text-[var(--text-muted)]">
                  This MVP flow lets you move certification from not started to
                  in progress to completed so the activation system can evaluate
                  your full readiness for directory visibility.
                </p>
              </div>

              <span
                className={`inline-flex w-fit rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] ${certificationBadgeClass}`}
              >
                {certificationStatus.replace("_", " ")}
              </span>
            </div>

            <div className="mt-6 rounded-3xl border border-white/10 bg-[linear-gradient(135deg,rgba(212,175,55,0.12),rgba(255,255,255,0.04))] p-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-start gap-3">
                  <div className="mt-1 rounded-2xl bg-[rgba(212,175,55,0.12)] p-3 text-[var(--gold-main)]">
                    <CheckCircle2 size={20} />
                  </div>
                  <div>
                    <p className="text-lg font-semibold text-white">
                      Certification workflow
                    </p>
                    <p className="mt-2 text-sm text-[var(--text-muted)]">
                      Start training here, then complete the certification step
                      to satisfy one of the three activation requirements.
                    </p>
                  </div>
                </div>

                {certificationCta.action ? (
                  <button
                    type="button"
                    onClick={certificationCta.action}
                    disabled={isUpdatingCertification}
                    className="inline-flex items-center justify-center gap-2 rounded-full bg-[var(--gold-main)] px-5 py-3 text-sm font-semibold text-black transition hover:bg-[var(--gold-soft)] disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    {isUpdatingCertification ? (
                      <Loader2 size={16} className="animate-spin" />
                    ) : null}
                    {certificationCta.label}
                  </button>
                ) : (
                  <div className="rounded-full border border-emerald-400/30 bg-emerald-400/10 px-4 py-2 text-sm font-semibold text-emerald-200">
                    {certificationCta.label}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="rounded-[32px] border border-white/10 bg-white/5 p-7 backdrop-blur-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-2xl font-semibold">Latest Academy Content</h2>
                <p className="mt-2 text-sm text-[var(--text-muted)]">
                  Stay current with documents, videos, and operational guidance.
                </p>
              </div>
              <GraduationCap className="text-[var(--gold-main)]" size={24} />
            </div>

            <div className="mt-6 space-y-4">
              {resources.map((resource) => {
                const resourceType = inferResourceType(resource);

                return (
                  <div
                    key={resource.id}
                    className="rounded-2xl border border-white/10 bg-white/5 p-5"
                  >
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <div className="flex flex-wrap items-center gap-3">
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
                          {resource.title || "Untitled academy resource"}
                        </p>
                        <p className="mt-2 text-sm text-[var(--text-muted)]">
                          {resource.description ||
                            "New academy guidance is available for review."}
                        </p>
                      </div>

                      {resource.file_url ? (
                        <a
                          href={resource.file_url}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-2 text-sm font-medium text-white transition hover:bg-white/10"
                        >
                          Open resource
                          <Download size={14} />
                        </a>
                      ) : (
                        <span className="text-sm text-white/45">
                          File unavailable
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}

              {!isLoading && resources.length === 0 && (
                <div className="rounded-2xl border border-white/10 bg-white/5 px-5 py-8 text-center text-sm text-slate-400">
                  No training materials available yet.
                </div>
              )}

              {isLoading && (
                <div className="rounded-2xl border border-white/10 bg-white/5 px-5 py-8 text-center text-sm text-slate-400">
                  Loading academy content...
                </div>
              )}
            </div>
          </div>
        </div>
      </Container>
    </main>
  );
}
