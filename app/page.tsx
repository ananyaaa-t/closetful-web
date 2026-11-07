import Link from "next/link";
import { SiteHeader } from "@/components/site-header";
import { PageBackground } from "@/components/page-background";
import { ClosetMockup } from "@/components/closet-mockup";
import { FeatureHighlights } from "@/components/feature-highlights";
import { SaveMethods } from "@/components/save-methods";

export default function Home() {
  return (
    <div className="relative flex flex-1 flex-col font-sans">
      <PageBackground />
      <SiteHeader />

      <main className="flex flex-1 flex-col items-center gap-16 px-6 pb-24 pt-8 text-center sm:gap-20">
        <div className="flex w-full max-w-xl flex-col items-center gap-6">
          <h1 className="text-4xl font-semibold lowercase tracking-tight text-white sm:text-5xl">
            closetful.
          </h1>
          <p className="max-w-md text-lg leading-8 text-white/60">
            All your wishlists, one place. Save what catches your eye, then
            compare your favorites and choose what&apos;s actually worth buying.
          </p>
          <div className="flex flex-col gap-4 text-base font-medium sm:flex-row">
            <Link
              className="flex h-12 w-full items-center justify-center gap-2 rounded-full bg-white px-5 text-black transition-colors hover:bg-white/85 md:w-[158px]"
              href="/demo"
            >
              Try the demo
            </Link>
            <Link
              className="flex h-12 w-full items-center justify-center rounded-full border border-white/25 px-5 text-white transition-colors hover:border-white/60 md:w-[158px]"
              href="/login"
            >
              Log in
            </Link>
          </div>
        </div>

        <ClosetMockup />
        <FeatureHighlights />
        <SaveMethods />
      </main>
    </div>
  );
}
