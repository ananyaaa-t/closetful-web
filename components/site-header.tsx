import Link from "next/link";

/** Persistent marketing-page header: wordmark + primary auth actions.
 * Used on the landing, login, and signup pages. The authenticated `/closet`
 * page has its own header (with logout) instead of this one. */
export function SiteHeader() {
  return (
    <header className="relative z-10 flex items-center justify-between px-6 py-5 sm:px-10">
      <Link
        href="/"
        className="text-xl font-semibold lowercase tracking-tight text-white"
      >
        closetful.
      </Link>
      <nav className="flex items-center gap-3 text-sm font-medium">
        <Link
          href="/login"
          className="rounded-full px-4 py-2 text-white/70 transition-colors hover:text-white"
        >
          Log in
        </Link>
        <Link
          href="/signup"
          className="rounded-full bg-white px-4 py-2 text-black transition-colors hover:bg-white/85"
        >
          Get started
        </Link>
      </nav>
    </header>
  );
}
