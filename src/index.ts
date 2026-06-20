import { serve } from "bun";
import index from "./index.html";
import { POST as login } from "./api/login.js";
import { POST as register } from "./api/register.js";
import { GET as getUsers, PATCH as patchUser } from "./api/users.js";
import { Google, generateState, generateCodeVerifier, decodeIdToken } from "arctic";
import { SignJWT } from "jose";
import { prisma } from "./lib/prisma.ts";
import { GET as getPackages, POST as createPackage, PATCH as deliverPackage } from "./api/packages.js";
import { POST as verifyOtp } from "./api/verify-otp.js";
import { GET as getNotifications, PATCH as readNotification } from "./api/notifications.js";
import { GET as getComplaints, POST as createComplaint, PATCH as updateComplaint} from "./api/complaints";

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || "incharge-secret-2026");

const google = new Google(
  process.env.GOOGLE_CLIENT_ID!,
  process.env.GOOGLE_CLIENT_SECRET!,
  "http://localhost:3000/api/auth/google/callback"
);

const server = serve({
  routes: {
    "/*": index,
    "/api/login": { POST: login },
    "/api/register": { POST: register },
    "/api/users": { GET: getUsers, PATCH: patchUser },
    "/api/packages": { GET: getPackages, POST: createPackage, PATCH: deliverPackage },
    "/api/verify-otp": { POST: verifyOtp },
    "/api/notifications": { GET: getNotifications, PATCH: readNotification },
    "/api/complaints": { GET: getComplaints, POST: createComplaint, PATCH: updateComplaint},

    "/api/auth/google": {
      async GET() {
        const state = generateState();
        const codeVerifier = generateCodeVerifier();
        const url = google.createAuthorizationURL(state, codeVerifier, ["openid", "email", "profile"]);
        const headers = new Headers();
        headers.append("Set-Cookie", `google_state=${state}; Path=/; HttpOnly; SameSite=Lax`);
        headers.append("Set-Cookie", `google_verifier=${codeVerifier}; Path=/; HttpOnly; SameSite=Lax`);
        headers.append("Location", url.toString());
        return new Response(null, { status: 302, headers });
      }
    },

    "/api/auth/google/callback": {
      async GET(req) {
        const url = new URL(req.url);
        const code = url.searchParams.get("code");
        const state = url.searchParams.get("state");
        const cookie = req.headers.get("cookie") || "";
        const storedState = cookie.match(/google_state=([^;]+)/)?.[1];
        const codeVerifier = cookie.match(/google_verifier=([^;]+)/)?.[1];

        if (!code || !state || state !== storedState || !codeVerifier) {
          return new Response("Invalid request", { status: 400 });
        }

        const tokens = await google.validateAuthorizationCode(code, codeVerifier);
        const claims = decodeIdToken(tokens.idToken()) as any;
        const email = claims.email;
        const name = claims.name;

        let user = await prisma.user.findFirst({ where: { email } });
        if (!user) {
          user = await prisma.user.create({
            data: { name: name, email, role: "residente" },
          });
        }

        const token = await new SignJWT({
          id: user.id, email: user.email, name: user.name, role: user.role,
        })
          .setProtectedHeader({ alg: "HS256" })
          .setExpirationTime("24h")
          .sign(JWT_SECRET);

        const userData = JSON.stringify({ id: user.id, name: user.name, email: user.email, role: user.role });

        return new Response(
          `<script>
            localStorage.setItem('incharge_token', '${token}');
            localStorage.setItem('incharge_user', '${userData}');
            window.location.href = '/';
          </script>`,
          { headers: { "Content-Type": "text/html" } }
        );
      }
    },
  },

  development: process.env.NODE_ENV !== "production" && {
    hmr: true,
    console: true,
  },
});

console.log(`Server running at ${server.url}`);