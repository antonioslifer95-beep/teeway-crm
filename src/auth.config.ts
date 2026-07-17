import type { NextAuthConfig } from "next-auth";

// Edge-safe config: no Prisma/bcrypt here, so this can be used from
// middleware (Edge runtime). The Credentials provider itself is added
// only in src/auth.ts, which runs in the Node runtime.
export const authConfig = {
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
  },
  providers: [],
  callbacks: {
    // Runs in every NextAuth() instance that spreads this config — both the
    // full instance in src/auth.ts and middleware's edge-only instance.
    // Without this here, middleware's own instance never learns to copy
    // id/role onto the session (it doesn't inherit auth.ts's callbacks),
    // so auth?.user?.role would always read as undefined in authorized().
    jwt({ token, user }) {
      if (user) {
        token.id = user.id as string;
        token.role = user.role;
      }
      return token;
    },
    session({ session, token }) {
      session.user.id = token.id;
      session.user.role = token.role;
      return session;
    },
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const isLoginPage = nextUrl.pathname === "/login";
      const isAdminPath = nextUrl.pathname.startsWith("/settings");

      if (isLoginPage) {
        return isLoggedIn ? Response.redirect(new URL("/", nextUrl)) : true;
      }

      if (!isLoggedIn) return false;

      if (isAdminPath && auth?.user?.role !== "ADMIN") {
        return Response.redirect(new URL("/", nextUrl));
      }

      return true;
    },
  },
} satisfies NextAuthConfig;
