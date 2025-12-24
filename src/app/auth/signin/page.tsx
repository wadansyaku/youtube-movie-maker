"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Mail, Loader2, AlertCircle, Wand2 } from "lucide-react";

export default function SignInPage() {
    const searchParams = useSearchParams();
    const callbackUrl = searchParams.get("callbackUrl") || "/dashboard";
    const error = searchParams.get("error");

    const [email, setEmail] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [isDevMode, setIsDevMode] = useState(false);

    const handleEmailSignIn = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email) return;

        setIsLoading(true);
        try {
            await signIn("email", {
                email,
                callbackUrl,
            });
        } catch (err) {
            console.error("Sign in error:", err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleDevSignIn = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email) return;

        setIsLoading(true);
        try {
            await signIn("credentials", {
                email,
                callbackUrl,
            });
        } catch (err) {
            console.error("Sign in error:", err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleGoogleSignIn = () => {
        signIn("google", { callbackUrl });
    };

    return (
        <div className="min-h-screen bg-gray-950 flex items-center justify-center p-6">
            <div className="w-full max-w-md">
                {/* Logo */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-indigo-600 rounded-2xl mb-4">
                        <Wand2 size={32} className="text-white" />
                    </div>
                    <h1 className="text-2xl font-bold text-white">CreativeFlow Studio</h1>
                    <p className="text-gray-400 mt-2">制作管理アプリにサインイン</p>
                </div>

                {/* Error Message */}
                {error && (
                    <div className="flex items-center gap-3 mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-xl">
                        <AlertCircle size={20} className="text-red-400" />
                        <p className="text-red-400 text-sm">
                            {error === "OAuthAccountNotLinked"
                                ? "このメールアドレスは別の方法で登録されています"
                                : "サインインに失敗しました"}
                        </p>
                    </div>
                )}

                {/* Sign In Form */}
                <div className="bg-gray-900 border border-gray-700 rounded-xl p-6">
                    <form onSubmit={isDevMode ? handleDevSignIn : handleEmailSignIn}>
                        <div className="mb-4">
                            <label className="block text-sm text-gray-400 mb-2">
                                メールアドレス
                            </label>
                            <div className="relative">
                                <Mail
                                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500"
                                    size={18}
                                />
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="your@email.com"
                                    className="w-full pl-10 pr-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                    required
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading || !email}
                            className="w-full flex items-center justify-center gap-2 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-600/50 text-white rounded-lg transition-colors"
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 size={18} className="animate-spin" />
                                    送信中...
                                </>
                            ) : (
                                <>
                                    <Mail size={18} />
                                    {isDevMode ? "開発モードでサインイン" : "マジックリンクを送信"}
                                </>
                            )}
                        </button>
                    </form>

                    {/* Divider */}
                    <div className="relative my-6">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-gray-700"></div>
                        </div>
                        <div className="relative flex justify-center text-sm">
                            <span className="px-2 bg-gray-900 text-gray-500">または</span>
                        </div>
                    </div>

                    {/* Google Sign In */}
                    <button
                        onClick={handleGoogleSignIn}
                        className="w-full flex items-center justify-center gap-3 py-3 bg-gray-800 hover:bg-gray-700 border border-gray-700 text-white rounded-lg transition-colors"
                    >
                        <svg className="w-5 h-5" viewBox="0 0 24 24">
                            <path
                                fill="currentColor"
                                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                            />
                            <path
                                fill="currentColor"
                                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                            />
                            <path
                                fill="currentColor"
                                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                            />
                            <path
                                fill="currentColor"
                                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                            />
                        </svg>
                        Googleでサインイン
                    </button>

                    {/* Dev Mode Toggle */}
                    {process.env.NODE_ENV === "development" && (
                        <div className="mt-4 pt-4 border-t border-gray-700">
                            <label className="flex items-center gap-2 text-sm text-gray-400 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={isDevMode}
                                    onChange={(e) => setIsDevMode(e.target.checked)}
                                    className="w-4 h-4 rounded bg-gray-800 border-gray-700 text-indigo-600 focus:ring-indigo-500"
                                />
                                開発モード（即時サインイン）
                            </label>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <p className="text-center text-sm text-gray-500 mt-6">
                    サインインすることで、
                    <Link href="/terms" className="text-indigo-400 hover:underline">
                        利用規約
                    </Link>
                    に同意したものとみなされます
                </p>
            </div>
        </div>
    );
}
