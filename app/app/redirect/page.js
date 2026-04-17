"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";

export default function Page() {
  const router = useRouter();
  const { data: session, status } = useSession();

  useEffect(() => {
    if (status === "loading") return;
    if (status === "unauthenticated") {
      router.push("/");
      return;
    }
    
    const role = session?.user?.role;
    console.log("ROL DETECTADO:", role);
    console.log("SESSION COMPLETA:", session);
    
    if (role === "admin") router.push("/dashboard/admin");
    else if (role === "conserje") router.push("/dashboard/conserje");
    else router.push("/dashboard/residente");
  }, [status, session, router]);

  return <p style={{textAlign: 'center', marginTop: '40vh', fontSize: '18px', color: '#999'}}>Redirigiendo...</p>;
}