import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
    function middleware(req) {
        // If authenticated, allow the request
        return NextResponse.next();
    },
    {
        callbacks: {
            authorized: ({ token, req }) => {
                // Allow access to login page and auth API without authentication
                const { pathname } = req.nextUrl;

                // Public paths that don't require authentication
                const publicPaths = [
                    "/login",
                    "/api/auth",
                    // Internal API routes - protected by session check in dashboard
                    "/api/email",
                    "/api/orders",
                    "/api/image",
                ];

                // Check if current path is public
                const isPublicPath = publicPaths.some(path =>
                    pathname.startsWith(path)
                );

                if (isPublicPath) {
                    return true;
                }

                // For all other paths, require authentication
                return !!token;
            },
        },
        pages: {
            signIn: "/login",
        },
    }
);

// Configure which paths the middleware runs on
export const config = {
    matcher: [
        /*
         * Match all request paths except:
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         * - public folder files
         */
        "/((?!_next/static|_next/image|favicon.ico|.*\\.png$|.*\\.jpg$|.*\\.jpeg$|.*\\.gif$|.*\\.svg$).*)",
    ],
};
