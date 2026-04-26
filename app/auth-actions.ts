"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

export async function signIn(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    return { error: "Email and password are required." };
  }

  const supabase = await createClient();
  let { error } = await supabase.auth.signInWithPassword({ email, password });

  // Backward compatibility for users who were seeded with .com while using .com.au.
  if (error && email.endsWith("@stratxadvisory.com.au")) {
    const fallbackEmail = email.replace("@stratxadvisory.com.au", "@stratxadvisory.com");
    const retry = await supabase.auth.signInWithPassword({ email: fallbackEmail, password });
    error = retry.error;
  }

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/", "layout");
  return { error: null, success: true as const };
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/sign-in");
}
