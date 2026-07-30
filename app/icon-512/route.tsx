import { ImageResponse } from "next/og";

export const size = { width: 512, height: 512 };
export const contentType = "image/png";

// 512x512 app icon for the PWA manifest (splash screens, larger displays).
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
          background: "#38040E",
          fontSize: 256,
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
