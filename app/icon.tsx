import { ImageResponse } from "next/og";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

// Browser tab favicon. Next.js auto-injects the appropriate <link rel="icon">.
export default function Icon() {
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
          fontSize: 18,
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
