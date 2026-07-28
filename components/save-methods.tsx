import Link from "next/link";

const METHODS: {
  title: string;
  badge: string;
  description: string;
  cta?: { label: string; href: string; external?: boolean };
}[] = [
  {
    title: "Paste a link",
    badge: "Works everywhere",
    description:
      "The easiest way to save — copy a product link from any site or app and paste it into your closet. No install, works on any phone, tablet, or computer.",
    cta: { label: "Get started", href: "/signup" },
  },
  {
    title: "Share from your phone",
    badge: "Coming soon",
    description:
      "A dedicated mobile experience is on the way — share any link straight from your phone's share sheet, no copy-paste needed.",
  },
  {
    title: "Browser bookmarklet",
    badge: "Desktop",
    description:
      "Drag the Save button to your bookmarks bar for one-click saving from any product page, or use the companion Chrome extension.",
    cta: {
      label: "View the extension",
      href: "https://github.com/ananyaaa-t/closetful-extension",
      external: true,
    },
  },
];

/** Landing-page "ways to save" section. Leads with the paste-URL flow —
 * the only method that works on every device with zero install — rather
 * than the Chrome extension, which most people won't install. The mobile
 * share-sheet card is marked "Coming soon": an Android Web Share Target
 * is already wired up (see app/manifest.ts `share_target`), but since it
 * doesn't work on iOS Safari at all and iPhone is the priority audience
 * for now, it's intentionally not marketed as available yet. */
export function SaveMethods() {
  return (
    <section className="flex w-full max-w-4xl flex-col gap-6">
      <h2 className="text-xl font-semibold text-white">
        Save from anywhere, however you like
      </h2>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {METHODS.map((method) => (
          <div
            key={method.title}
            className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-white/[0.04] p-6 text-left"
          >
            <span className="w-fit rounded-full bg-white/10 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-white/60">
              {method.badge}
            </span>
            <h3 className="text-sm font-semibold text-white">
              {method.title}
            </h3>
            <p className="flex-1 text-sm leading-6 text-white/50">
              {method.description}
            </p>
            {method.cta && (
              <Link
                href={method.cta.href}
                target={method.cta.external ? "_blank" : undefined}
                rel={method.cta.external ? "noopener noreferrer" : undefined}
                className="mt-1 text-sm font-medium text-white underline underline-offset-2 hover:text-white/80"
              >
                {method.cta.label}
              </Link>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
