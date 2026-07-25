import type { DefaultSession } from "next-auth";
import type { Role } from "@/generated/prisma/client";

// Rozšíření typů Auth.js o `id` a `role`.
declare module "next-auth" {
  interface User {
    role: Role;
  }
  interface Session {
    user: {
      id: string;
      role: Role;
    } & DefaultSession["user"];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: Role;
  }
}

// JWT interface žije v @auth/core/jwt (next-auth ji jen re-exportuje),
// takže augmentaci potřebujeme i tady, aby se typy `token.id`/`token.role`
// v callbacku session skutečně projevily.
declare module "@auth/core/jwt" {
  interface JWT {
    id: string;
    role: Role;
  }
}
