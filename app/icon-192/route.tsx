import { ImageResponse } from "next/og";

export const size = { width: 192, height: 192 };
export const contentType = "image/png";

// 192x192 app icon for the PWA manifest (home screen / app switcher).
// Generated at build/request time rather than checked in as a static
// asset, so it always matches the oxblood brand color used elsewhere.
export function GET() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#3a0d1a",
          fontSize: 96,
          fontWeight: 600,
          color: "white",
          fontFamily: "sans-serif",
        }}
      >
        c.
      </div>
    ),
    { ...size }
  );
}
