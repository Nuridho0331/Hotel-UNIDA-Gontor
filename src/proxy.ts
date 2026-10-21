
import { NextRequest, NextResponse } from "next/server";
import { auth } from "../auth";

const protectedRoutes = [
  "/my-reservation",
  "/checkout",
  "/admin",
];

export async function proxy(req: NextRequest) {
  const session = await auth();

  const isLoggedIn = !!session?.user;
  const role = session?.user?.role;
  const pathname = req.nextUrl.pathname;

  const isProtected = protectedRoutes.some((route) =>
    pathname === route || pathname.startsWith(`${route}/`)
  );

  const isAdminRoute =
    pathname === "/admin" || pathname.startsWith("/admin/");

  const isUserReservation =
    pathname === "/my-reservation" ||
    pathname.startsWith("/my-reservation/") ||
    pathname === "/checkout" ||
    pathname.startsWith("/checkout/");

  if (!isLoggedIn && isProtected) {
    return NextResponse.redirect(
      new URL("/signin", req.url)
    );
  }

  if (isLoggedIn) {
    if (role !== "ADMIN" && isAdminRoute) {
      return NextResponse.redirect(
        new URL("/", req.url)
      );
    }

    if (role !== "USER" && isUserReservation) {
      return NextResponse.redirect(
        new URL(
          role === "ADMIN" ? "/admin" : "/",
          req.url
        )
      );
    }

    if (
      pathname === "/signin" ||
      pathname === "/register"
    ) {
      return NextResponse.redirect(
        new URL(
          role === "ADMIN" ? "/admin" : "/",
          req.url
        )
      );
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico).*)",
  ],
};
