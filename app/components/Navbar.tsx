"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { useRefresh } from "../context/RefreshContext";

const LogoutIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
    <polyline points="16 17 21 12 16 7" />
    <line x1="21" x2="9" y1="12" y2="12" />
  </svg>
);

export default function Navbar() {
  const { data: session, status } = useSession();
  const pathname = usePathname();
  const { refreshHandler, isRefreshing } = useRefresh();

  if (status !== "authenticated") return null;

  const links = [
    { name: "Orders", href: "/" },
    { name: "Affiliations", href: "/referrals" },
    { name: "Leaderboard", href: "/leaderboard" },
  ];

  return (
    <nav className="sticky top-0 z-40 bg-black/80 backdrop-blur-xl border-b border-zinc-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-6">
            <Link href="/" className="flex items-center gap-3">
              <Image
                src="/tedx-logo.png"
                alt="TEDx Logo"
                width={100}
                height={28}
                className="h-7 w-auto"
                priority
              />
            </Link>

            <div className="hidden sm:block h-6 w-px bg-zinc-800" />

            <div className="flex items-center gap-1">
              {links.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${pathname === link.href
                    ? "bg-zinc-800 text-white"
                    : "text-zinc-400 hover:text-white hover:bg-zinc-800/50"
                    }`}
                >
                  {link.name}
                </Link>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* User Info */}
            {session?.user?.email && (
              <span className="hidden md:block text-sm text-zinc-400">
                {session.user.email}
              </span>
            )}

            {/* Refresh Button - Only visible when a handler is registered */}
            {refreshHandler && (
              <button
                onClick={async () => {
                  if (refreshHandler) await refreshHandler();
                }}
                disabled={isRefreshing}
                className="flex items-center gap-2 px-3 py-2 bg-[#EB0028] hover:bg-[#c40022] disabled:opacity-50 text-white rounded-lg text-sm font-medium transition-colors"
                title="Refresh Page"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={isRefreshing ? "animate-spin" : ""}>
                  <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                  <path d="M3 3v5h5" />
                  <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16" />
                  <path d="M16 16h5v5" />
                </svg>
                <span className="hidden sm:inline">Refresh</span>
              </button>
            )}

            {/* Logout Button */}
            <button
              onClick={() => signOut()}
              className="flex items-center gap-2 px-3 py-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-white rounded-lg text-sm font-medium transition-colors"
              title="Sign out"
            >
              <LogoutIcon />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}
