import Link from "next/link";
import { Mail, ArrowLeft } from "lucide-react";

export default function VerifyRequestPage() {
    return (
        <div className="min-h-screen bg-gray-950 flex items-center justify-center p-6">
            <div className="w-full max-w-md text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-indigo-600/20 rounded-full mb-6">
                    <Mail size={32} className="text-indigo-400" />
                </div>

                <h1 className="text-2xl font-bold text-white mb-4">
                    メールをご確認ください
                </h1>

                <p className="text-gray-400 mb-6">
                    サインイン用のマジックリンクをお送りしました。
                    <br />
                    メールを開いてリンクをクリックしてください。
                </p>

                <div className="bg-gray-900 border border-gray-700 rounded-xl p-4 mb-6">
                    <p className="text-gray-500 text-sm">
                        メールが届かない場合は、迷惑メールフォルダもご確認ください。
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
