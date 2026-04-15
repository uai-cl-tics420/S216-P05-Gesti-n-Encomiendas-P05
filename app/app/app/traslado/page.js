"use client";

import TransferForm from "../components/traslado/TransferForm";

export default function TransferPage() {
  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#f8fafc",
        padding: "1rem",
      }}
    >
      <TransferForm locale="es" />
    </main>
  );
}
