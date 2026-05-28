import { ImageResponse } from "next/og";

export const runtime = "edge";

export async function GET() {
  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          width: "100%",
          height: "100%",
          background: "#07080A",
          padding: "64px 72px",
          fontFamily: "system-ui, sans-serif",
        }}
      >
        {/* Wordmark */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
          }}
        >
          <span
            style={{
              color: "#00FFFF",
              fontSize: 18,
              fontWeight: 700,
              letterSpacing: "0.1em",
            }}
          >
            RBX
          </span>
          <span
            style={{
              color: "#4A4A50",
              fontSize: 18,
              fontWeight: 300,
            }}
          >
            · Inteligência de Mercado
          </span>
        </div>

        {/* Main content */}
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          <div
            style={{
              color: "#7A7F87",
              fontSize: 14,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
            }}
          >
            Assinatura · BTC Futuros
          </div>
          <div
            style={{
              color: "#ECECEC",
              fontSize: 52,
              fontWeight: 600,
              lineHeight: 1.15,
              letterSpacing: "-0.02em",
            }}
          >
            Briefing Diário BTC
          </div>
          <div
            style={{
              color: "#B8BCC2",
              fontSize: 22,
              fontWeight: 300,
              lineHeight: 1.5,
              maxWidth: 640,
            }}
          >
            Leitura operacional diária. Contexto, cenários e plano de voo,
            entregues antes das 07h.
          </div>
        </div>

        {/* Bottom rule */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
          }}
        >
          <div
            style={{
              width: 32,
              height: 2,
              background: "#00FFFF",
            }}
          />
          <span
            style={{
              color: "#4A4A50",
              fontSize: 13,
              letterSpacing: "0.06em",
            }}
          >
            rbx.ia.br · rbxsystems.ch
          </span>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    }
  );
}
