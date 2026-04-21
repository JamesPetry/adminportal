"use client";

import { useActionState } from "react";

import { signIn } from "@/app/auth-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const initialState: { error: string | null } = { error: null };

export function SignInForm() {
  const [state, action, pending] = useActionState(
    async (_: { error: string | null }, formData: FormData) => {
      const result = await signIn(formData);
      return { error: result?.error ?? null };
    },
    initialState,
  );

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
      <Button type="submit" className="w-full bg-blue-600 text-white hover:bg-blue-700" disabled={pending}>
        {pending ? "Signing in..." : "Sign in"}
      </Button>
    </form>
  );
}
