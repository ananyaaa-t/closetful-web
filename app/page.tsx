import Link from "next/link";

export default function Home() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center bg-[#3a0d1a] px-6 font-sans">
      <main className="flex w-full max-w-xl flex-col items-center gap-6 text-center">
        <h1 className="text-4xl font-semibold lowercase tracking-tight text-white">
          closetful.
        </h1>
        <p className="max-w-md text-lg leading-8 text-white/60">
          Save anything you want from anywhere on the internet, organized
          automatically in one place.
        </p>
        <div className="flex flex-col gap-4 text-base font-medium sm:flex-row">
          <Link
            className="flex h-12 w-full items-center justify-center gap-2 rounded-full bg-white px-5 text-black transition-colors hover:bg-white/85 md:w-[158px]"
            href="/signup"
          >
            Get started
          </Link>
          <Link
            className="flex h-12 w-full items-center justify-center rounded-full border border-white/25 px-5 text-white transition-colors hover:border-white/60 md:w-[158px]"
            href="/login"
          >
            Log in
          </Link>
        </div>
      </main>
    </div>
  );
}
