"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";

export default function OnboardingPage() {
  const router = useRouter();

  const [fullName, setFullName] = useState("");
  const [city, setCity] = useState("");
  const [license, setLicense] = useState("");
  const [bio, setBio] = useState("");

  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarUrl, setAvatarUrl] = useState("");

  const [loading, setLoading] = useState(false);

  async function uploadAvatar(file: File, userId: string) {
    const fileExt = file.name.split(".").pop();
    const filePath = `${userId}.${fileExt}`;

    const { error } = await supabase.storage
      .from("avatars")
      .upload(filePath, file, { upsert: true });

    if (error) {
      console.error(error);
      return null;
    }

    const { data } = supabase.storage
      .from("avatars")
      .getPublicUrl(filePath);

    return data.publicUrl;
  }

  async function handleSubmit(e: any) {
    e.preventDefault();
    setLoading(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      alert("Not authenticated");
      return;
    }

    let finalAvatarUrl = avatarUrl;

    // upload if file exists
    if (avatarFile) {
      const uploadedUrl = await uploadAvatar(avatarFile, user.id);
      if (uploadedUrl) finalAvatarUrl = uploadedUrl;
    }

    const { error } = await supabase.from("profiles").upsert({
      id: user.id,
      full_name: fullName,
      city: city,
      license_number: license,
      bio: bio,
      avatar_url: finalAvatarUrl, // ✅ FIXED
    });

    setLoading(false);

    if (error) {
      alert(error.message);
    } else {
      router.push("/dashboard");
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--navy-dark)] text-white">
      <form
        onSubmit={handleSubmit}
        className="bg-white/5 backdrop-blur-xl p-8 rounded-3xl w-full max-w-md space-y-4"
      >
        <h2 className="text-2xl font-bold">Complete Your Profile</h2>

        <input
          placeholder="Full Name"
          className="w-full p-3 rounded bg-black/30"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          required
        />

        <input
          placeholder="City / Area"
          className="w-full p-3 rounded bg-black/30"
          value={city}
          onChange={(e) => setCity(e.target.value)}
          required
        />

        <input
          placeholder="License Number"
          className="w-full p-3 rounded bg-black/30"
          value={license}
          onChange={(e) => setLicense(e.target.value)}
          required
        />

        {/* FILE UPLOAD */}
        <input
          type="file"
          accept="image/*"
          className="w-full p-3 rounded bg-black/30"
          onChange={(e) =>
            setAvatarFile(e.target.files ? e.target.files[0] : null)
          }
        />

        <textarea
          placeholder="Short Bio"
          className="w-full p-3 rounded bg-black/30"
          value={bio}
          onChange={(e) => setBio(e.target.value)}
        />

        <button
          type="submit"
          className="btn-gold w-full py-3 rounded-full"
        >
          {loading ? "Saving..." : "Save Profile"}
        </button>
      </form>
    </div>
  );
}