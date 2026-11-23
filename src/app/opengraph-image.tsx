import { ImageResponse } from "next/og";
import { site } from "@/content/site";

export const alt = "noticr: be seen by people and by the machines they ask.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const PAPER = "#F7F6F2";
const INK = "#14130F";
const MUTED = "#5B5850";
const ACCENT = "#1E7BF5";

// Uses next/og's bundled default font so the image renders without any network fetch at build time.
export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: PAPER,
          padding: "72px 88px",
          color: INK,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 16, fontSize: 26, color: MUTED, letterSpacing: 4 }}>
          <div style={{ width: 14, height: 14, borderRadius: 7, background: ACCENT }} />
          <div style={{ display: "flex" }}>SEO + GEO AUDITS</div>
        </div>

        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ display: "flex", fontSize: 196, fontWeight: 700, letterSpacing: -10, lineHeight: 1 }}>
            {site.name}
          </div>
          <div style={{ width: 220, height: 8, background: ACCENT, marginTop: 36, marginBottom: 36 }} />
          <div style={{ display: "flex", fontSize: 48, lineHeight: 1.2, maxWidth: 960 }}>{site.tagline}</div>
        </div>

        <div style={{ display: "flex", fontSize: 26, color: MUTED }}>
          Checks your site for Google, ChatGPT, Perplexity, Claude, Gemini and AI Overviews.
        </div>
      </div>
    ),
    { ...size },
  );
}
