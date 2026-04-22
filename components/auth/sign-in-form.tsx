"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";

import { signIn } from "@/app/auth-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const initialState: { error: string | null; success?: boolean } = { error: null, success: false };

export function SignInForm() {
  const router = useRouter();
  const [state, action, pending] = useActionState(
    async (_: { error: string | null; success?: boolean }, formData: FormData) => {
      const result = await signIn(formData);
      return { error: result?.error ?? null, success: result?.success ?? false };
    },
    initialState,
  );

  useEffect(() => {
    if (!state.success) return;
    router.replace("/dashboard");
    router.refresh();
  }, [router, state.success]);

  return (
    <form action={action} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input id="email" name="email" type="email" placeholder="name@company.com" required />
      </div>
      <div className="space-y-2">
        <Label htmlFor="password">Password</Label>
        <Input id="password" name="password" type="password" required />
      </div>
      {state.error ? <p className="text-sm text-rose-600">{state.error}</p> : null}
      <Button type="submit" className="w-full bg-zinc-900 text-white hover:bg-zinc-800" disabled={pending}>
        {pending ? "Signing in..." : "Sign in"}
      </Button>
    </form>
  );
}
