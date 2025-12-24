"use client";

import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { AlertCircle, ArrowLeft } from "lucide-react";

const errorMessages: Record<string, string> = {
    Configuration: "サーバー設定エラーが発生しました",
    AccessDenied: "アクセスが拒否されました",
    Verification: "認証リンクが無効または期限切れです",
    OAuthSignin: "OAuth認証でエラーが発生しました",
    OAuthCallback: "OAuth認証のコールバックでエラーが発生しました",
    OAuthCreateAccount: "アカウント作成中にエラーが発生しました",
    EmailCreateAccount: "メールアカウント作成中にエラーが発生しました",
    Callback: "認証コールバックでエラーが発生しました",
    OAuthAccountNotLinked: "このメールアドレスは別の方法で登録されています",
    EmailSignin: "メール送信中にエラーが発生しました",
    CredentialsSignin: "認証情報が正しくありません",
    SessionRequired: "このページにアクセスするにはサインインが必要です",
    Default: "認証中にエラーが発生しました",
};

export default function AuthErrorPage() {
    const searchParams = useSearchParams();
    const error = searchParams.get("error") || "Default";

    return (
        <div className="min-h-screen bg-gray-950 flex items-center justify-center p-6">
            <div className="w-full max-w-md text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-red-500/20 rounded-full mb-6">
                    <AlertCircle size={32} className="text-red-400" />
                </div>

                <h1 className="text-2xl font-bold text-white mb-4">
                    認証エラー
                </h1>

                <p className="text-gray-400 mb-6">
                    {errorMessages[error] || errorMessages.Default}
                </p>

                <div className="bg-gray-900 border border-gray-700 rounded-xl p-4 mb-6">
                    <p className="text-gray-500 text-sm">
                        問題が解決しない場合は、サポートまでお問い合わせください。
                    </p>
                </div>

                <Link
                    href="/auth/signin"
                    className="inline-flex items-center gap-2 text-indigo-400 hover:text-indigo-300"
                >
                    <ArrowLeft size={18} />
                    サインインページに戻る
                </Link>
            </div>
        </div>
    );
}
