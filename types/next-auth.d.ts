import "next-auth";
import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface User {
    role?: "admin";
  }

  interface Session {
    user: {
      role?: "admin";
    } & DefaultSession["user"];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role?: "admin";
  }
}
