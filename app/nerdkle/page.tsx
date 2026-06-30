import { NerdkleConsole } from "./nerdkle-console";

export const metadata = {
  title: "Nerdkle | Werkles",
  robots: { index: false, follow: false }
};

export default function NerdklePage() {
  return (
    <main
      style={{
        minHeight: "100vh",
        padding: "clamp(28px, 6vw, 72px)",
        background:
          "radial-gradient(circle at 14% 10%, rgba(24, 197, 174, 0.16), transparent 24rem), radial-gradient(circle at 86% 12%, rgba(246, 173, 85, 0.18), transparent 24rem), linear-gradient(180deg, #ebe2d4 0%, #f6efe5 100%)",
        color: "#1f1814"
      }}
    >
      <div style={{ maxWidth: "1040px", margin: "0 auto", display: "grid", gap: "28px" }}>
        <header>
          <p style={{ margin: "0 0 10px", color: "#7a4c24", fontWeight: 900, letterSpacing: "0.08em", textTransform: "uppercase" }}>
            Nerdkle
          </p>
          <h1 style={{ margin: 0, fontSize: "clamp(2.4rem, 7vw, 5.5rem)", lineHeight: 0.92 }}>
            Bring a thing into the world.
          </h1>
          <p style={{ maxWidth: "760px", color: "#44362c", fontSize: "1.08rem", lineHeight: 1.65 }}>
            Give Nerdkle messy intent. It returns an operating object: artifact, unresolved fields, human gates,
            execution owner, receipt requirement, next action, evidence, and failure condition.
          </p>
        </header>

        <NerdkleConsole />
      </div>
    </main>
  );
}
