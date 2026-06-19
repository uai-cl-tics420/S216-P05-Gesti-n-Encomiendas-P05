import { test, expect, describe } from "bun:test";
import { SignJWT } from "jose";
import { verifyAuth } from "./auth.js";


const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "incharge-secret-2026"
);


function fakeRequest(authHeader) {
  return new Request("http://localhost/api/test", {
    headers: authHeader ? { Authorization: authHeader } : {},
  });
}


async function makeToken(payload, secret = JWT_SECRET, exp = "24h") {
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime(exp)
    .sign(secret);
}

describe("verifyAuth - verificacion de JWT", () => {

  test("un token valido retorna el payload del usuario", async () => {
    
    const token = await makeToken({ id: 1, email: "ana@uai.cl", name: "Ana", role: "residente" });
    const req = fakeRequest(`Bearer ${token}`);

    
    const payload = await verifyAuth(req);

    
    expect(payload).not.toBeNull();
    expect(payload.id).toBe(1);
    expect(payload.role).toBe("residente");
  });

  test("una request sin header Authorization retorna null", async () => {
    
    const req = fakeRequest(null);

    
    const payload = await verifyAuth(req);

    
    expect(payload).toBeNull();
  });

  test("un header sin el prefijo Bearer retorna null", async () => {
    
    const token = await makeToken({ id: 1, role: "admin" });
    const req = fakeRequest(token); 

    
    const payload = await verifyAuth(req);

    
    expect(payload).toBeNull();
  });

  test("un token mal formado retorna null", async () => {
    
    const req = fakeRequest("Bearer esto.no.es.un.jwt");

    
    const payload = await verifyAuth(req);

    
    expect(payload).toBeNull();
  });

  test("un token firmado con otra clave retorna null", async () => {
    
    const otraClave = new TextEncoder().encode("clave-de-un-atacante");
    const token = await makeToken({ id: 9, role: "admin" }, otraClave);
    const req = fakeRequest(`Bearer ${token}`);

    
    const payload = await verifyAuth(req);

    
    expect(payload).toBeNull();
  });

  test("un token expirado retorna null", async () => {
    
    const token = await makeToken({ id: 1, role: "residente" }, JWT_SECRET, "-1h");
    const req = fakeRequest(`Bearer ${token}`);

    
    const payload = await verifyAuth(req);

    
    expect(payload).toBeNull();
  });

});