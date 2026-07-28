/** Decorative gradient background for marketing pages. Sits behind content
 * (absolute, -z-10) to add depth to the flat oxblood color without
 * distracting from the foreground UI. Pure CSS — no images. */
export function PageBackground() {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 -z-10 overflow-hidden bg-[#3a0d1a]"
    >
      {/* Base gradient wash for subtle depth top-to-bottom */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_-10%,rgba(255,255,255,0.08),transparent)]" />

      {/* Floating blurred color blobs */}
      <div className="absolute -left-32 top-20 h-80 w-80 rounded-full bg-rose-500/20 blur-[100px]" />
      <div className="absolute -right-24 top-1/3 h-96 w-96 rounded-full bg-orange-400/10 blur-[120px]" />
      <div className="absolute bottom-0 left-1/4 h-72 w-72 rounded-full bg-fuchsia-400/10 blur-[110px]" />
    </div>
  );
}
