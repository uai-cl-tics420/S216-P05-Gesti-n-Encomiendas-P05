"use client";

import RegisterForm from "../components/registro/RegisterForm";

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
