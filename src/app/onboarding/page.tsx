import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { OnboardingForm } from "@/components/onboarding-form";

export default async function OnboardingPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase.from("profile").select("user_id").maybeSingle();
  if (profile) redirect("/dashboard");

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-lg flex-col px-5 py-8">
      <OnboardingForm />
    </div>
  );
}
