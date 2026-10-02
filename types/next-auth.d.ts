import type { Role } from "@/lib/generated/prisma/client";
import "next-auth";
import "next-auth/jwt";

declare module "next-auth" {
  interface User {
    role: Role;
  }

  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      role: Role;
      riderId?: string;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role: Role;
    riderId?: string;
  }
}
