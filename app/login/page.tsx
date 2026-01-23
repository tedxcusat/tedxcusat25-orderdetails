"use client";

import { useState, useEffect, Suspense } from "react";
import { signIn, useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";

function LoginForm() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();
    const searchParams = useSearchParams();
    const { status } = useSession();

    // Redirect if already authenticated
    useEffect(() => {
        if (status === "authenticated") {
            router.push("/");
        }
    }, [status, router]);

    // Check for error in URL params
    useEffect(() => {
        const errorParam = searchParams.get("error");
        if (errorParam) {
            setError("Invalid credentials. Please try again.");
        }
    }, [searchParams]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setIsLoading(true);

        try {
            const result = await signIn("credentials", {
                email,
                password,
                redirect: false,
            });

            if (result?.error) {
                setError("Invalid email or password. Please try again.");
                setIsLoading(false);
            } else if (result?.ok) {
                // Use window.location for hard redirect to ensure session is properly loaded
                window.location.href = "/";
            }
        } catch {
            setError("An unexpected error occurred. Please try again.");
            setIsLoading(false);
        }
    };

    // Show loading while checking session
    if (status === "loading") {
        return (
            <div className="min-h-screen bg-[var(--background)] flex items-center justify-center">
                <div className="w-12 h-12 border-4 border-[var(--tedx-red)] border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    // Don't render login form if authenticated (will redirect)
    if (status === "authenticated") {
        return null;
    }

    return (
        <div className="min-h-screen bg-[var(--background)] flex items-center justify-center p-4">
            <div className="w-full max-w-md">
                {/* Logo and Title */}
                <div className="text-center mb-8">
                    <div className="flex justify-center mb-4">
                        <Image
                            src="/tedx-logo.png"
                            alt="TEDx Logo"
                            width={150}
                            height={42}
                            className="h-10 w-auto"
                            priority
                        />
                    </div>
                    <h1 className="text-2xl font-bold text-white mb-2">Order Dashboard</h1>
                    <p className="text-[var(--muted)]">Sign in to access the admin panel</p>
                </div>

                {/* Login Form */}
                <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-xl p-6 shadow-2xl">
                    <form onSubmit={handleSubmit} className="space-y-5">
                        {/* Error Message */}
                        {error && (
                            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                                <p className="text-sm text-red-400 text-center">{error}</p>
                            </div>
                        )}

                        {/* Email Field */}
                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-zinc-300 mb-2">
                                Email Address
                            </label>
                            <input
                                id="email"
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="admin@example.com"
                                required
                                autoComplete="email"
                                className="w-full px-4 py-3 bg-zinc-900 border border-[var(--card-border)] rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-[var(--tedx-red)] focus:ring-1 focus:ring-[var(--tedx-red)] transition-colors"
                            />
                        </div>

                        {/* Password Field */}
                        <div>
                            <label htmlFor="password" className="block text-sm font-medium text-zinc-300 mb-2">
                                Password
                            </label>
                            <input
                                id="password"
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="••••••••••••"
                                required
                                autoComplete="current-password"
                                className="w-full px-4 py-3 bg-zinc-900 border border-[var(--card-border)] rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-[var(--tedx-red)] focus:ring-1 focus:ring-[var(--tedx-red)] transition-colors"
                            />
                        </div>

                        {/* Submit Button */}
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full py-3 bg-[var(--tedx-red)] hover:bg-[var(--tedx-red-dark)] disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-colors flex items-center justify-center gap-2"
                        >
                            {isLoading ? (
                                <>
                                    <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    Signing in...
                                </>
                            ) : (
                                <>
                                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
                                        <polyline points="10 17 15 12 10 7" />
                                        <line x1="15" x2="3" y1="12" y2="12" />
                                    </svg>
                                    Sign In
                                </>
                            )}
                        </button>
                    </form>
                </div>

                {/* Security Notice */}
                <div className="mt-6 text-center">
                    <p className="text-xs text-zinc-500">
                        🔒 This is a secure admin area. Unauthorized access is prohibited.
                    </p>
                </div>
            </div>
        </div>
    );
}

export default function LoginPage() {
    return (
        <Suspense 
            fallback={
                <div className="min-h-screen bg-[var(--background)] flex items-center justify-center">
                    <div className="w-12 h-12 border-4 border-[var(--tedx-red)] border-t-transparent rounded-full animate-spin" />
                </div>
            }
        >
            <LoginForm />
        </Suspense>
    );
}
