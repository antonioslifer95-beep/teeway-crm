import type { DefaultSession } from "next-auth";
import type { Role } from "@/generated/prisma/client";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: Role;
    } & DefaultSession["user"];
  }

  interface User {
    role: Role;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: Role;
  }
}

// next-auth re-exports these from @auth/core, and @auth/core's own
// callback signatures reference the @auth/core-declared interfaces
// directly — augment both so the merge applies where it's actually used.
declare module "@auth/core/jwt" {
  interface JWT {
    id: string;
    role: Role;
  }
}

declare module "@auth/core/types" {
  interface Session {
    user: {
      id: string;
      role: Role;
    } & DefaultSession["user"];
  }

  interface User {
    role: Role;
  }
}
