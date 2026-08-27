import { ImageResponse } from "next/og";

export const size = {
  width: 32,
  height: 32,
};

export const contentType = "image/png";

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
          background: "black",
          fontSize: 22,
          fontWeight: 600,
        }}
      >
        <span style={{ color: "white" }}>A</span>
        <span style={{ color: "#22d3ee" }}>I</span>
      </div>
    ),
    size
  );
}
