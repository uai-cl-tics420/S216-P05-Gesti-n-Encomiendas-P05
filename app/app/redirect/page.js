"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function Page() {
  const router = useRouter();

  useEffect(() => {
    const rol = localStorage.getItem("rol");

    if (rol === "Admin") router.push("/dashboard/admin");
    else if (rol === "Conserje") router.push("/dashboard/conserje");
    else router.push("/dashboard/residente");
  }, [router]);

  return <p>Redirigiendo...</p>;
}