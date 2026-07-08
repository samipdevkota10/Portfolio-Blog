"use client";

export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#f6f1e8",
          color: "#151515",
          fontFamily: '"Inter", "Avenir Next", "Segoe UI", sans-serif',
          textAlign: "center",
          padding: "2rem",
        }}
      >
        <div>
          <p style={{ letterSpacing: "0.3em", textTransform: "uppercase", fontSize: "0.875rem", color: "#c46435", fontWeight: 600 }}>
            Error
          </p>
          <h1 style={{ fontFamily: "Georgia, serif", fontSize: "2.5rem", margin: "1rem 0" }}>
            Something went wrong.
          </h1>
          <button
            type="button"
            onClick={reset}
            style={{
              marginTop: "1rem",
              borderRadius: "9999px",
              backgroundColor: "#151515",
              color: "#ffffff",
              padding: "0.75rem 1.5rem",
              fontSize: "0.875rem",
              fontWeight: 600,
              border: "none",
              cursor: "pointer",
            }}
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
