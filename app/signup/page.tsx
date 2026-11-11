"use client";

import { Suspense, useActionState } from "react";
import Link from "next/link";
import { signup, type AuthState } from "@/app/actions/auth";
import { SiteHeader } from "@/components/site-header";
import { PageBackground } from "@/components/page-background";
import { GoogleButton } from "@/components/google-button";
import { AuthMessage } from "@/components/auth-message";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";

const initialState: AuthState = { error: null };

export default function SignupPage() {
  const [state, formAction, pending] = useActionState(signup, initialState);

  return (
    <div className="relative flex flex-1 flex-col">
      <PageBackground />
      <SiteHeader />

      <div className="flex flex-1 items-center justify-center px-6 py-12">
        <Card className="w-full max-w-sm gap-0 p-8 shadow-2xl shadow-black/30">
          <h1 className="text-2xl font-semibold tracking-tight text-white">
            Create your account
          </h1>
          <p className="mt-1 text-sm text-white/50">
            Start collecting everything you want, in one place.
          </p>

          <div className="mt-6">
            <Suspense fallback={null}>
              <AuthMessage />
            </Suspense>
            <GoogleButton />
          </div>

          <div className="my-6 flex items-center gap-3">
            <Separator className="flex-1" />
            <span className="text-xs uppercase tracking-wider text-white/30">
              or
            </span>
            <Separator className="flex-1" />
          </div>

          <form action={formAction} className="flex flex-col gap-5">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="email">
                Email
              </Label>
              <Input
                id="email"
                name="email"
                type="email"
                required
                autoComplete="email"
                className="h-11"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="password">
                Password
              </Label>
              <Input
                id="password"
                name="password"
                type="password"
                required
                minLength={6}
                autoComplete="new-password"
                className="h-11"
              />
            </div>

            {state.error && (
              <Alert variant="destructive">
                <AlertDescription>{state.error}</AlertDescription>
              </Alert>
            )}

            <Button
              type="submit"
              disabled={pending}
              className="mt-1"
            >
              {pending ? "Creating account…" : "Sign up"}
            </Button>
          </form>

          <p className="mt-6 text-sm text-white/50">
            Already have an account?{" "}
            <Link href="/login" className="font-medium text-white underline">
              Log in
            </Link>
          </p>
        </Card>
      </div>
    </div>
  );
}
