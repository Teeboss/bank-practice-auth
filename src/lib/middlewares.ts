import { NextApiRequest, NextApiResponse } from "next";
import { verifyToken } from "./auth";
import { NextRequest, NextResponse } from "next/server";

export async function authMiddleware(req: NextRequest) {
  const token = req.cookies.get("token")?.value;
  const pathname = req.nextUrl;

  const protectedRoutes = ["/dashboard", "/profile", "/settings", "/upload"];
  const autRoutes = ["/login", "/register", "/forgot-password"];

  // Check if the request is for a protected route
  const isProtectedRoute = protectedRoutes.some((route) =>
    pathname.pathname.startsWith(route)
  );

  // Check if the request is for an auth route
  const isAuthRoute = autRoutes.some((route) =>
    pathname.pathname.startsWith(route)
  );

  if (isProtectedRoute) {
    if (!token) {
      const url = req.nextUrl.clone();
      url.pathname = "/login";
      return NextResponse.redirect(new URL("/login", req.url));
    }

    const decoded = await verifyToken(token);
    if (!decoded) {
      const url = req.nextUrl.clone();
      url.pathname = "/login";
      const response = NextResponse.redirect(new URL("/login", req.url));
      response.cookies.delete("token");
      return response;
    }
  }

  // Redirect to dashboard if user is authenticated and trying to access auth routes
  if (isAuthRoute && token) {
    const decoded = await verifyToken(token);
    if (decoded) {
      const url = req.nextUrl.clone();
      url.pathname = "/dashboard";
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }
  }

  NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/profile/:path*",
    "/settings/:path*",
    "/login",
    "/register",
    "/forgot-password",
  ],
};
