import { jwtVerify } from "jose";

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "incharge-secret-2026"
);

export async function verifyAuth(request) {
  try {
    const authHeader = request.headers.get("authorization") || "";

    if (!authHeader.startsWith("Bearer ")) {
      return null;
    }

    const token = authHeader.slice(7);

    const { payload } = await jwtVerify(token, JWT_SECRET);

    return payload;
  } catch {
    return null;
  }
}