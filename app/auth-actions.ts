"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { isSupabaseEnabled } from "@/lib/config";
import { createClient } from "@/lib/supabase/server";

export async function signIn(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    return { error: "Email and password are required." };
  }

  if (!isSupabaseEnabled) {
    const cookieStore = await cookies();
    const role = /admin|james/i.test(email) ? "admin" : "client";
    const fullName = email.split("@")[0].replace(/[._-]/g, " ");

    cookieStore.set("local-session", "1");
    cookieStore.set("local-role", role);
    cookieStore.set("local-email", email);
    cookieStore.set("local-name", fullName || "Local User");
    cookieStore.set("local-client-id", "client-stratx");

    revalidatePath("/", "layout");
    redirect("/");
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/", "layout");
  redirect("/");
}

export async function signOut() {
  if (!isSupabaseEnabled) {
    const cookieStore = await cookies();
    cookieStore.delete("local-session");
    cookieStore.delete("local-role");
    cookieStore.delete("local-email");
    cookieStore.delete("local-name");
    cookieStore.delete("local-client-id");
    revalidatePath("/", "layout");
    redirect("/sign-in");
  }

  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/sign-in");
}
