import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

const METHODS: {
  title: string;
  badge: string;
  description: string;
  cta?: { label: string; href: string; external?: boolean; };
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
          <Card
            key={method.title}
            className="gap-3 p-6 text-left"
          >
            <Badge variant="secondary" className="w-fit">
              {method.badge}
            </Badge>
            <h3 className="text-sm font-semibold text-white">
              {method.title}
            </h3>
            <p className="flex-1 text-sm leading-6 text-white/50">
              {method.description}
            </p>
            {method.cta && (
              <Button asChild variant="link" className="mt-1 justify-start px-0">
                <Link
                  href={method.cta.href}
                  target={method.cta.external ? "_blank" : undefined}
                  rel={method.cta.external ? "noopener noreferrer" : undefined}
                >
                  {method.cta.label}
                </Link>
              </Button>
            )}
          </Card>
        ))}
      </div>
    </section>
  );
}
