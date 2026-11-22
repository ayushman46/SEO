import { NextResponse, type NextRequest } from "next/server";
import { ADMIN_REALM, getAdminPassword, isAuthorizedAdmin } from "@/lib/security/admin-auth";

/**
 * Next 16 Proxy (formerly Middleware). Guards /admin with HTTP Basic auth.
 * - ADMIN_PASSWORD unset (or shorter than 12 chars) → 404, so /admin doesn't advertise itself.
 * - Wrong/missing credentials → 401 with a Basic challenge.
 * The admin page re-checks the header itself (proxy coverage can silently change with matchers).
 */
export async function proxy(request: NextRequest) {
  const password = getAdminPassword();
  if (!password) {
    return new NextResponse("Not found", {
      status: 404,
      headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-store" },
    });
  }

  if (!(await isAuthorizedAdmin(request.headers.get("authorization"), password))) {
    return new NextResponse("Authentication required", {
      status: 401,
      headers: {
        "WWW-Authenticate": `Basic realm="${ADMIN_REALM}", charset="UTF-8"`,
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-store",
      },
    });
  }

  const response = NextResponse.next();
  response.headers.set("Cache-Control", "no-store");
  response.headers.set("X-Robots-Tag", "noindex, nofollow");
  return response;
}

export const config = {
  matcher: ["/admin/:path*"],
};
