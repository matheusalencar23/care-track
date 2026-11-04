import { NextResponse, type NextRequest } from "next/server";

export function proxy(request: NextRequest) {
  if (request.cookies.has("token")) {
    return NextResponse.next();
  }

  return NextResponse.redirect(new URL("/login", request.url));
}

export const config = {
  matcher: ["/dashboard/:path*"],
};
