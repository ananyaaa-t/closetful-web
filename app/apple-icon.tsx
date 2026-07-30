import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

// iOS home-screen icon, used when a user taps "Add to Home Screen" in
// mobile Safari. Next.js auto-injects the <link rel="apple-touch-icon">.
export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#38040E",
          fontSize: 90,
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
