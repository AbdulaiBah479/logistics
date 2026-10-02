import { getToken } from "next-auth/jwt";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function proxy(request: NextRequest) {
  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
  const { pathname } = request.nextUrl;

  if (!token) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (pathname.startsWith("/dashboard") && token.role !== "ADMIN" && token.role !== "DISPATCHER") {
    return NextResponse.redirect(new URL("/", request.url));
  }

  if (pathname.startsWith("/rider") && token.role !== "RIDER") {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/rider/:path*"],
};
