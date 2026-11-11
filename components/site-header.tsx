import Link from "next/link";
import { Button } from "@/components/ui/button";

/** Persistent marketing-page header: wordmark + primary auth actions.
 * Used on the landing, login, and signup pages. The authenticated `/closet`
 * page has its own header (with logout) instead of this one. */
export function SiteHeader() {
  return (
    <header className="relative z-10 flex flex-wrap items-center justify-between gap-3 px-6 py-5 sm:px-10">
      <Link
        href="/"
        className="text-xl font-semibold lowercase tracking-tight text-white"
      >
        closetful.
      </Link>
      <nav className="flex items-center gap-3 text-sm font-medium">
        <Button asChild variant="ghost">
          <Link href="/login">Log in</Link>
        </Button>
        <Button asChild>
          <Link href="/signup">Get started</Link>
        </Button>
      </nav>
    </header>
  );
}
