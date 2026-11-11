import { Card } from "@/components/ui/card";

const FEATURES: { title: string; description: string; icon: string; }[] = [
  {
    icon: "✦",
    title: "AI auto-categorization",
    description:
      "Every saved item is automatically tagged and sorted — clothing, shoes, makeup, tech — using Google Gemini's structured output. No manual filing.",
  },
  {
    icon: "⇄",
    title: "Save from any device",
    description:
      "Paste a link from your phone, tablet, or computer — no install required. Power users can add the browser bookmarklet or Chrome extension too.",
  },
  {
    icon: "◈",
    title: "Bypasses bot-blocked sites",
    description:
      "The extension reads product data straight from the page DOM in your own browser, sidestepping anti-bot protection that blocks traditional scraping.",
  },
];

/** Landing-page value-prop section. Content pulled from the project README
 * so marketing copy stays consistent with the documented feature set. */
export function FeatureHighlights() {
  return (
    <section className="grid w-full max-w-4xl grid-cols-1 gap-4 sm:grid-cols-3">
      {FEATURES.map((feature) => (
        <Card
          key={feature.title}
          className="gap-3 p-6 text-left"
        >
          <span className="text-2xl text-white/80">{feature.icon}</span>
          <h3 className="text-sm font-semibold text-white">{feature.title}</h3>
          <p className="text-sm leading-6 text-white/50">
            {feature.description}
          </p>
        </Card>
      ))}
    </section>
  );
}
