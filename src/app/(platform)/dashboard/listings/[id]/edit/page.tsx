import ListingForm, {
  ListingFormInitialData,
} from "@/components/dashboard/ListingForm";
import { createServerSupabaseClient } from "@/lib/supabase-server";

async function fetchListingById(id: string) {
  const supabase = await createServerSupabaseClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      listing: null,
      loadError: "You must be signed in to edit a listing.",
    };
  }

  const { data, error } = await supabase
    .from("listings")
    .select(
      "address, city, description, expected_completion_date, id, image_url, postal_code, projected_price, renovation_details, state, title"
    )
    .eq("id", id)
    .eq("agent_id", user.id)
    .maybeSingle();

  if (error || !data) {
    return {
      listing: null,
      loadError: "Unable to load this listing.",
    };
  }

  return {
    listing: data as ListingFormInitialData,
    loadError: null,
  };
}

export default async function EditListingPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { listing, loadError } = await fetchListingById(id);

  return (
    <ListingForm
      mode="edit"
      listingId={id}
      initialData={listing}
      isLoadingInitialData={false}
      loadError={loadError}
    />
  );
}
