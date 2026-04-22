import type { Metadata } from "next";

import { SignInForm } from "@/components/auth/sign-in-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Sign In | James Marlin Client Dashboard",
};

export default function SignInPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f6f8fb] p-6">
      <Card className="w-full max-w-md border-slate-200 bg-white shadow-sm">
        <CardHeader className="space-y-3">
          <p className="text-xs uppercase tracking-[0.14em] text-slate-500">Client Portal</p>
          <CardTitle className="text-2xl font-semibold tracking-tight text-slate-900">
            James Marlin Client Dashboard
          </CardTitle>
          <p className="text-sm text-slate-600">
            Sign in to access your private project workspace and latest deliverables.
          </p>
        </CardHeader>
        <CardContent>
          <SignInForm />
        </CardContent>
      </Card>
    </main>
  );
}
