"use client";

import { Suspense, useActionState } from "react";
import Link from "next/link";
import { signup, type AuthState } from "@/app/actions/auth";
import { SiteHeader } from "@/components/site-header";
import { PageBackground } from "@/components/page-background";
import { GoogleButton } from "@/components/google-button";
import { AuthMessage } from "@/components/auth-message";

const initialState: AuthState = { error: null };

export default function SignupPage() {
  const [state, formAction, pending] = useActionState(signup, initialState);

  return (
    <div className="relative flex flex-1 flex-col">
      <PageBackground />
      <SiteHeader />

      <div className="flex flex-1 items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm rounded-2xl border border-white/10 bg-white/5 p-8 shadow-2xl shadow-black/30">
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
            <div className="h-px flex-1 bg-white/10" />
            <span className="text-xs uppercase tracking-wider text-white/30">
              or
            </span>
            <div className="h-px flex-1 bg-white/10" />
          </div>

          <form action={formAction} className="flex flex-col gap-5">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="email" className="text-sm font-medium text-white/80">
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                autoComplete="email"
                className="rounded-lg border border-white/15 bg-white/[0.03] px-4 py-2.5 text-sm text-white outline-none transition-colors focus:border-white/40 focus:ring-2 focus:ring-white/10"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label htmlFor="password" className="text-sm font-medium text-white/80">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                minLength={6}
                autoComplete="new-password"
                className="rounded-lg border border-white/15 bg-white/[0.03] px-4 py-2.5 text-sm text-white outline-none transition-colors focus:border-white/40 focus:ring-2 focus:ring-white/10"
              />
            </div>

            {state.error && (
              <p className="text-sm text-red-300">{state.error}</p>
            )}

            <button
              type="submit"
              disabled={pending}
              className="mt-1 rounded-full bg-white px-5 py-2.5 text-sm font-medium text-black transition-colors hover:bg-white/85 disabled:opacity-50"
            >
              {pending ? "Creating account…" : "Sign up"}
            </button>
          </form>

          <p className="mt-6 text-sm text-white/50">
            Already have an account?{" "}
            <Link href="/login" className="font-medium text-white underline">
              Log in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
