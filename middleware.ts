import { NextResponse, type NextRequest } from "next/server";

import { isSupabaseEnabled } from "@/lib/config";
import { updateSession } from "@/lib/supabase/middleware";

const PUBLIC_ROUTES = ["/sign-in"];

export async function middleware(request: NextRequest) {
  if (!isSupabaseEnabled) {
    const hasSession = request.cookies.get("local-session")?.value === "1";
    const isPublicRoute = PUBLIC_ROUTES.some((route) => request.nextUrl.pathname.startsWith(route));

    if (!hasSession && !isPublicRoute) {
      return NextResponse.redirect(new URL("/sign-in", request.url));
    }

    if (hasSession && isPublicRoute) {
      return NextResponse.redirect(new URL("/", request.url));
    }

    return NextResponse.next();
  }

  const { response, user } = await updateSession(request);
  const hasSession = Boolean(user);

  const isPublicRoute = PUBLIC_ROUTES.some((route) => request.nextUrl.pathname.startsWith(route));

  if (!hasSession && !isPublicRoute) {
    return NextResponse.redirect(new URL("/sign-in", request.url));
  }

  if (hasSession && isPublicRoute) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
