"use client";

import { useEffect, useState } from "react";
import { Loader2, UploadCloud } from "lucide-react";
import { useRouter } from "next/navigation";
import BackToListingsButton from "@/components/dashboard/BackToListingsButton";
import Container from "@/components/layout/Container";
import Navbar from "@/components/layout/Navbar";
import { supabase } from "@/lib/supabase";

type AgentAccess = {
  agent_status: string | null;
};

export type ListingFormInitialData = {
  address: string;
  city: string;
  description: string;
  expected_completion_date: string | null;
  id: string;
  image_url: string | null;
  postal_code: string;
  projected_price: number | null;
  renovation_details: string | null;
  state: string;
  title: string;
};

type ListingFormProps = {
  initialData?: ListingFormInitialData | null;
  isLoadingInitialData?: boolean;
  listingId?: string;
  loadError?: string | null;
  mode: "create" | "edit";
};

type FormValues = {
  address: string;
  city: string;
  description: string;
  expectedCompletionDate: string;
  imageUrl: string;
  postalCode: string;
  projectedPrice: string;
  renovationDetails: string;
  state: string;
  title: string;
};

const emptyValues: FormValues = {
  address: "",
  city: "",
  description: "",
  expectedCompletionDate: "",
  imageUrl: "",
  postalCode: "",
  projectedPrice: "",
  renovationDetails: "",
  state: "",
  title: "",
};

export default function ListingForm({
  initialData = null,
  isLoadingInitialData = false,
  listingId,
  loadError = null,
  mode,
}: ListingFormProps) {
  const router = useRouter();
  const [formValues, setFormValues] = useState<FormValues>(emptyValues);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState("");
  const [isActiveAgent, setIsActiveAgent] = useState<boolean | null>(null);
  const [isLoadingAccess, setIsLoadingAccess] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<{
    text: string;
    type: "error" | "success";
  } | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadAccess() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.replace("/login");
        return;
      }

      const { data: agentData } = await supabase
        .from("agents")
        .select("agent_status")
        .eq("id", user.id)
        .maybeSingle();

      if (!isMounted) {
        return;
      }

      setIsActiveAgent(
        (agentData as AgentAccess | null)?.agent_status === "active"
      );
      setIsLoadingAccess(false);
    }

    void loadAccess();

    return () => {
      isMounted = false;
    };
  }, [router]);

  useEffect(() => {
    if (!initialData) {
      if (mode === "create") {
        setFormValues(emptyValues);
      }
      return;
    }

    setFormValues({
      address: initialData.address ?? "",
      city: initialData.city ?? "",
      description: initialData.description ?? "",
      expectedCompletionDate: initialData.expected_completion_date ?? "",
      imageUrl: initialData.image_url ?? "",
      postalCode: initialData.postal_code ?? "",
      projectedPrice:
        initialData.projected_price !== null &&
        initialData.projected_price !== undefined
          ? String(initialData.projected_price)
          : "",
      renovationDetails: initialData.renovation_details ?? "",
      state: initialData.state ?? "",
      title: initialData.title ?? "",
    });
    setImagePreviewUrl("");
    setImageFile(null);
  }, [initialData, mode]);

  function updateField(field: keyof FormValues, value: string) {
    setFormValues((current) => ({
      ...current,
      [field]: value,
    }));
  }

  function handleImageChange(event: React.ChangeEvent<HTMLInputElement>) {
    const nextFile = event.target.files?.[0] ?? null;
    setImageFile(nextFile);

    if (!nextFile) {
      setImagePreviewUrl("");
      return;
    }

    const previewUrl = URL.createObjectURL(nextFile);
    setImagePreviewUrl(previewUrl);
  }

  async function uploadListingImage() {
    if (!imageFile) {
      return "";
    }

    const formData = new FormData();
    formData.append("file", imageFile);

    const response = await fetch("/api/agent/listings/upload", {
      method: "POST",
      body: formData,
    });

    const result = (await response.json().catch(() => null)) as
      | {
          data?: {
            imageUrl?: string;
          };
          error?: { message?: string };
          success?: boolean;
        }
      | null;

    if (!response.ok || !result?.success || !result.data?.imageUrl) {
      throw new Error(result?.error?.message || "Unable to upload listing image.");
    }

    return result.data.imageUrl;
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);

    if (!isActiveAgent) {
      setMessage({
        type: "error",
        text: "Complete your activation to start adding listings",
      });
      return;
    }

    if (mode === "edit" && !listingId) {
      setMessage({
        type: "error",
        text: "Unable to identify this listing.",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.replace("/login");
        return;
      }

      const nextImageUrl = imageFile
        ? await uploadListingImage()
        : formValues.imageUrl;

      const payload = {
        address: formValues.address.trim(),
        city: formValues.city.trim(),
        description: formValues.description.trim(),
        expected_completion_date: formValues.expectedCompletionDate || null,
        image_url: nextImageUrl || null,
        postal_code: formValues.postalCode.trim(),
        projected_price: formValues.projectedPrice
          ? Number(formValues.projectedPrice)
          : null,
        renovation_details: formValues.renovationDetails.trim(),
        state: formValues.state.trim(),
        title: formValues.title.trim(),
      };

      const { error } =
        mode === "edit"
          ? await supabase
              .from("listings")
              .update(payload)
              .eq("id", listingId as string)
              .eq("agent_id", user.id)
          : await supabase.from("listings").insert({
              ...payload,
              agent_id: user.id,
            });

      if (error) {
        throw new Error(
          error.message ||
            (mode === "edit"
              ? "Unable to update listing."
              : "Unable to create listing.")
        );
      }

      router.push("/dashboard/listings");
    } catch (error) {
      setMessage({
        type: "error",
        text:
          error instanceof Error
            ? error.message
            : mode === "edit"
              ? "Unable to update listing."
              : "Unable to create listing.",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  const previewImage = imagePreviewUrl || formValues.imageUrl;
  const isLoadingPage = isLoadingAccess || (mode === "edit" && isLoadingInitialData);
  const eyebrow = mode === "edit" ? "Edit Listing" : "New Listing";
  const title = mode === "edit" ? "Edit Listing" : "Add Listing";
  const description =
    mode === "edit"
      ? "Update your renovation listing details and keep the showcase current."
      : "Create a new renovation listing for your active CRLA portfolio.";
  const submitLabel = mode === "edit" ? "Save Changes" : "Create Listing";

  return (
    <main className="min-h-screen bg-[var(--navy-dark)] text-white">
      <Navbar />

      <Container>
        <div className="space-y-10 py-10 lg:py-14">
          <BackToListingsButton />

          <div className="rounded-[36px] border border-white/10 bg-[linear-gradient(135deg,rgba(22,37,68,0.92),rgba(11,20,38,0.90))] p-8 shadow-[0_35px_90px_rgba(0,0,0,.30)] backdrop-blur-2xl">
            <p className="text-sm uppercase tracking-[0.22em] text-white/40">
              {eyebrow}
            </p>
            <h1 className="mt-3 text-4xl font-bold md:text-5xl">{title}</h1>
            <p className="mt-4 max-w-2xl text-lg text-[var(--text-muted)]">
              {description}
            </p>
          </div>

          {loadError && !isLoadingPage ? (
            <div className="rounded-[28px] border border-red-400/30 bg-red-400/10 px-6 py-10 text-center text-sm text-red-200">
              {loadError}
            </div>
          ) : isLoadingPage ? (
            <div className="rounded-[28px] border border-white/10 bg-white/5 px-6 py-10 text-center text-sm text-slate-300">
              {mode === "edit"
                ? "Loading your listing..."
                : "Checking your listing access..."}
            </div>
          ) : !isActiveAgent ? (
            <div className="rounded-[28px] border border-white/10 bg-white/5 px-6 py-10 text-center text-sm text-yellow-200">
              Complete your activation to start adding listings
            </div>
          ) : (
            <form
              onSubmit={handleSubmit}
              className="rounded-[32px] border border-white/10 bg-white/5 p-6 backdrop-blur-2xl"
            >
              {message && (
                <div className="mb-6 rounded-2xl border border-red-400/30 bg-red-400/10 px-4 py-3 text-sm text-red-200">
                  {message.text}
                </div>
              )}

              <div className="grid gap-5 sm:grid-cols-2">
                <label className="space-y-2">
                  <span className="text-sm font-medium text-white/80">Title</span>
                  <input
                    value={formValues.title}
                    onChange={(event) => updateField("title", event.target.value)}
                    required
                    className="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-white outline-none transition focus:border-[var(--gold-main)]/40"
                  />
                </label>

                <label className="space-y-2">
                  <span className="text-sm font-medium text-white/80">Address</span>
                  <input
                    value={formValues.address}
                    onChange={(event) => updateField("address", event.target.value)}
                    required
                    className="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-white outline-none transition focus:border-[var(--gold-main)]/40"
                  />
                </label>

                <label className="space-y-2">
                  <span className="text-sm font-medium text-white/80">City</span>
                  <input
                    value={formValues.city}
                    onChange={(event) => updateField("city", event.target.value)}
                    required
                    className="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-white outline-none transition focus:border-[var(--gold-main)]/40"
                  />
                </label>

                <label className="space-y-2">
                  <span className="text-sm font-medium text-white/80">State</span>
                  <input
                    value={formValues.state}
                    onChange={(event) => updateField("state", event.target.value)}
                    required
                    className="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-white outline-none transition focus:border-[var(--gold-main)]/40"
                  />
                </label>

                <label className="space-y-2">
                  <span className="text-sm font-medium text-white/80">Postal Code</span>
                  <input
                    value={formValues.postalCode}
                    onChange={(event) =>
                      updateField("postalCode", event.target.value)
                    }
                    required
                    className="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-white outline-none transition focus:border-[var(--gold-main)]/40"
                  />
                </label>

                <label className="space-y-2">
                  <span className="text-sm font-medium text-white/80">
                    Projected Price
                  </span>
                  <input
                    type="number"
                    min="0"
                    step="1000"
                    value={formValues.projectedPrice}
                    onChange={(event) =>
                      updateField("projectedPrice", event.target.value)
                    }
                    className="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-white outline-none transition focus:border-[var(--gold-main)]/40"
                  />
                </label>

                <label className="space-y-2 sm:col-span-2">
                  <span className="text-sm font-medium text-white/80">
                    Expected Completion Date
                  </span>
                  <input
                    type="date"
                    value={formValues.expectedCompletionDate}
                    onChange={(event) =>
                      updateField("expectedCompletionDate", event.target.value)
                    }
                    className="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-white outline-none transition focus:border-[var(--gold-main)]/40"
                  />
                </label>

                <label className="space-y-2 sm:col-span-2">
                  <span className="text-sm font-medium text-white/80">
                    Description
                  </span>
                  <textarea
                    value={formValues.description}
                    onChange={(event) =>
                      updateField("description", event.target.value)
                    }
                    required
                    rows={4}
                    className="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-white outline-none transition focus:border-[var(--gold-main)]/40"
                  />
                </label>

                <label className="space-y-2 sm:col-span-2">
                  <span className="text-sm font-medium text-white/80">
                    Renovation Details
                  </span>
                  <textarea
                    value={formValues.renovationDetails}
                    onChange={(event) =>
                      updateField("renovationDetails", event.target.value)
                    }
                    rows={4}
                    className="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-white outline-none transition focus:border-[var(--gold-main)]/40"
                  />
                </label>

                <label className="space-y-2 sm:col-span-2">
                  <span className="text-sm font-medium text-white/80">
                    Listing Image
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="block w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm text-white file:mr-4 file:rounded-full file:border-0 file:bg-[var(--gold-main)] file:px-4 file:py-2 file:font-semibold file:text-black"
                  />
                  <div className="mt-3 aspect-square w-40 overflow-hidden rounded-2xl border border-dashed border-white/10 bg-white/5">
                    {previewImage ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={previewImage}
                        alt="Listing preview"
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full flex-col items-center justify-center gap-2 px-4 text-center text-sm text-white/40">
                        <UploadCloud size={24} />
                        <span>Upload Image</span>
                      </div>
                    )}
                  </div>
                </label>
              </div>

              <div className="mt-6 flex justify-end">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex items-center gap-2 rounded-full bg-[var(--gold-main)] px-6 py-3 font-semibold text-black transition hover:bg-[var(--gold-soft)] disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {isSubmitting ? (
                    <Loader2 size={18} className="animate-spin" />
                  ) : null}
                  {submitLabel}
                </button>
              </div>
            </form>
          )}
        </div>
      </Container>
    </main>
  );
}
