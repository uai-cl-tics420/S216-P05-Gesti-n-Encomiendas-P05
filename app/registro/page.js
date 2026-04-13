"use client";

import RegisterForm from "../components/registro/RegisterForm";

// Pagina para registrar una encomienda nueva
// El conserje entra aca cuando llega un paquete al edificio
export default function RegisterPage() {
  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#f8fafc",
        padding: "1rem",
      }}
    >
      <RegisterForm />
    </main>
  );
}
