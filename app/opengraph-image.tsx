import { ImageResponse } from "next/og";

export const size = {
  width: 1200,
  height: 630,
};

export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "linear-gradient(135deg, #f6f1e8 0%, #efe4d1 40%, #d9c8b0 100%)",
          padding: 64,
          color: "#151515",
        }}
      >
        <div style={{ fontSize: 28, letterSpacing: 6, textTransform: "uppercase", color: "#c46435" }}>
          Samip Devkota
        </div>
        <div style={{ fontSize: 74, lineHeight: 1.05, fontWeight: 600, width: "80%" }}>
          Server-first portfolio platform with grounded AI.
        </div>
        <div style={{ fontSize: 28, color: "#3a3a3a" }}>
          Writing, case studies, retrieval-backed chat, and operational rigor.
        </div>
      </div>
    ),
    size,
  );
}
