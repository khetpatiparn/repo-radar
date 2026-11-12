import { ImageResponse } from "next/og";

// Route segment config
export const runtime = "edge";

// Image metadata
export const size = {
  width: 32,
  height: 32,
};
export const contentType = "image/png";

// Icon generation (Radar with emerald blips)
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
          backgroundColor: "#09090b",
          borderRadius: "8px",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Outer Ring */}
        <div
          style={{
            position: "absolute",
            width: "26px",
            height: "26px",
            borderRadius: "50%",
            border: "1.5px solid #065f46",
          }}
        />
        {/* Inner Ring */}
        <div
          style={{
            position: "absolute",
            width: "16px",
            height: "16px",
            borderRadius: "50%",
            border: "1.5px solid #10b981",
          }}
        />
        {/* Center Point */}
        <div
          style={{
            position: "absolute",
            width: "6px",
            height: "6px",
            borderRadius: "50%",
            backgroundColor: "#34d399",
            boxShadow: "0 0 6px #34d399",
          }}
        />
        {/* Radar Detected Blip */}
        <div
          style={{
            position: "absolute",
            top: "5px",
            right: "7px",
            width: "4px",
            height: "4px",
            borderRadius: "50%",
            backgroundColor: "#6ee7b7",
            boxShadow: "0 0 4px #6ee7b7",
          }}
        />
      </div>
    ),
    {
      ...size,
    }
  );
}
