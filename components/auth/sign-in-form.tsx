"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { signIn } from "@/app/auth-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const initialState: { error: string | null; success?: boolean } = { error: null, success: false };

export function SignInForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isNavigating, setIsNavigating] = useState(false);
  const [state, action, pending] = useActionState(
    async (_: { error: string | null; success?: boolean }, formData: FormData) => {
      const result = await signIn(formData);
      return { error: result?.error ?? null, success: result?.success ?? false };
    },
    initialState,
  );

  useEffect(() => {
    if (!state.success) return;
    setIsNavigating(true);
    router.replace("/dashboard");
    router.refresh();
  }, [router, state.success]);

  return (
    <form action={action} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          name="email"
          type="email"
          placeholder="nhowe@stratxadvisory.com.au"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          disabled={pending || isNavigating}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          name="password"
          type="password"
          required
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          disabled={pending || isNavigating}
        />
      </div>
      {state.error ? <p className="text-sm text-rose-600">{state.error}</p> : null}
      {isNavigating ? <p className="text-center text-xs font-medium uppercase tracking-[0.12em] text-zinc-500">Logging in...</p> : null}
      <Button type="submit" className="w-full bg-zinc-900 text-white hover:bg-zinc-800" disabled={pending || isNavigating}>
        {pending || isNavigating ? "Logging in..." : "Sign in"}
      </Button>
    </form>
  );
}
