import { NextRequest, NextResponse } from "next/server";
import { auth } from "../auth";

const ProtectedRoutes = ["/my-reservation", "/checkout", "/admin"];

export async function proxy(req: NextRequest) {
  const session = await auth();

  const isLoggedIn = !!session?.user;
  const role = session?.user?.role;
  const { pathname } = req.nextUrl;

  // Belum login tapi mencoba membuka halaman protected
  if (
    !isLoggedIn &&
    ProtectedRoutes.some((route) => pathname.startsWith(route))
  ) {
    return NextResponse.redirect(new URL("/signin", req.url));
  }

  // User biasa tidak boleh membuka halaman admin
  if (
    isLoggedIn &&
    role !== "ADMIN" &&
    pathname.startsWith("/admin")
  ) {
    return NextResponse.redirect(new URL("/", req.url));
  }

  // User yang sudah login tidak perlu membuka signin/register lagi
  if (
    isLoggedIn &&
    (
      pathname.startsWith("/signin") ||
      pathname.startsWith("/register")
    )
  ) {
    return NextResponse.redirect(new URL("/", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico).*)",
  ],
};