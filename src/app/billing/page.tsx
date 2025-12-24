"use client";

import { useState, useEffect } from "react";
import { Check, Loader2, CreditCard, Zap, Users, Crown, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";

interface Plan {
    id: string;
    name: string;
    description: string;
    price: number;
    currency: string;
    limits: {
        aiCalls: number;
        videoMinutes: number;
        narrationChars: number;
        thumbnails: number;
    };
}

interface Subscription {
    planId: string;
    planName: string;
    status: string;
    currentPeriodEnd: string;
}

interface UsageItem {
    used: number;
    limit: number;
}

interface Usage {
    aiCalls: UsageItem;
    videoMinutes: UsageItem;
    narrationChars: UsageItem;
    thumbnails: UsageItem;
}

const PLANS: Plan[] = [
    {
        id: 'free',
        name: 'Free',
        description: '試用プラン',
        price: 0,
        currency: 'jpy',
        limits: { aiCalls: 5, videoMinutes: 0, narrationChars: 0, thumbnails: 2 },
    },
    {
        id: 'creator',
        name: 'Creator',
        description: '個人クリエイター向け',
        price: 1980,
        currency: 'jpy',
        limits: { aiCalls: 100, videoMinutes: 10, narrationChars: 50000, thumbnails: 50 },
    },
    {
        id: 'pro',
        name: 'Pro',
        description: 'プロ制作者向け',
        price: 4980,
        currency: 'jpy',
        limits: { aiCalls: -1, videoMinutes: 60, narrationChars: 200000, thumbnails: -1 },
    },
    {
        id: 'team',
        name: 'Team',
        description: 'チーム・企業向け',
        price: 9800,
        currency: 'jpy',
        limits: { aiCalls: -1, videoMinutes: -1, narrationChars: -1, thumbnails: -1 },
    },
];

const planIcons: Record<string, React.ReactNode> = {
    free: <Zap className="text-gray-400" />,
    creator: <CreditCard className="text-blue-400" />,
    pro: <Crown className="text-purple-400" />,
    team: <Users className="text-emerald-400" />,
};

export default function BillingPage() {
    const [subscription, setSubscription] = useState<Subscription | null>(null);
    const [usage, setUsage] = useState<Usage | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [upgrading, setUpgrading] = useState<string | null>(null);

    useEffect(() => {
        fetchSubscription();
    }, []);

    const fetchSubscription = async () => {
        try {
            const res = await fetch('/api/billing/subscription');
            if (res.ok) {
                const data = await res.json();
                setSubscription(data.subscription);
                setUsage(data.usage);
            }
        } catch (error) {
            console.error('Failed to fetch subscription:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleUpgrade = async (planId: string) => {
        setUpgrading(planId);
        try {
            const res = await fetch('/api/billing/checkout', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ planId }),
            });

            if (res.ok) {
                const { url } = await res.json();
                if (url) {
                    window.location.href = url;
                }
            } else {
                const error = await res.json();
                alert(error.error || 'Checkout failed');
            }
        } catch (error) {
            console.error('Checkout failed:', error);
            alert('決済処理に失敗しました');
        } finally {
            setUpgrading(null);
        }
    };

    const formatLimit = (value: number) => {
        if (value === -1) return '無制限';
        if (value === 0) return '-';
        return value.toLocaleString();
    };

    const calculateProgress = (used: number, limit: number) => {
        if (limit === -1) return 0;
        if (limit === 0) return 100;
        return Math.min((used / limit) * 100, 100);
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <Loader2 className="animate-spin text-indigo-500" size={32} />
            </div>
        );
    }

    return (
        <div className="max-w-6xl mx-auto p-8">
            <h1 className="text-3xl font-bold mb-2">プラン & 請求</h1>
            <p className="text-gray-400 mb-8">サブスクリプションと使用状況を管理</p>

            {/* Current Plan */}
            {subscription && (
                <div className="bg-gradient-to-r from-indigo-900/50 to-purple-900/50 border border-indigo-500/30 rounded-2xl p-6 mb-8">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-indigo-300">現在のプラン</p>
                            <h2 className="text-2xl font-bold text-white">{subscription.planName}</h2>
                            <p className="text-sm text-gray-400 mt-1">
                                次回更新: {new Date(subscription.currentPeriodEnd).toLocaleDateString('ja-JP')}
                            </p>
                        </div>
                        <div className="text-right">
                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${subscription.status === 'active'
                                    ? 'bg-green-500/20 text-green-400'
                                    : 'bg-yellow-500/20 text-yellow-400'
                                }`}>
                                {subscription.status === 'active' ? 'アクティブ' : subscription.status}
                            </span>
                        </div>
                    </div>
                </div>
            )}

            {/* Usage Stats */}
            {usage && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                    {[
                        { key: 'aiCalls', label: 'AI呼び出し', data: usage.aiCalls },
                        { key: 'videoMinutes', label: '動画生成(分)', data: usage.videoMinutes },
                        { key: 'narrationChars', label: 'ナレーション(文字)', data: usage.narrationChars },
                        { key: 'thumbnails', label: 'サムネイル', data: usage.thumbnails },
                    ].map(({ key, label, data }) => (
                        <div key={key} className="bg-gray-900 border border-gray-800 rounded-xl p-4">
                            <p className="text-xs text-gray-500 mb-1">{label}</p>
                            <p className="text-xl font-bold text-white">
                                {data.used.toLocaleString()}
                                <span className="text-sm text-gray-500 font-normal">
                                    / {formatLimit(data.limit)}
                                </span>
                            </p>
                            {data.limit !== -1 && data.limit > 0 && (
                                <div className="mt-2 h-1.5 bg-gray-800 rounded-full overflow-hidden">
                                    <div
                                        className={`h-full transition-all ${calculateProgress(data.used, data.limit) > 80
                                                ? 'bg-red-500'
                                                : 'bg-indigo-500'
                                            }`}
                                        style={{ width: `${calculateProgress(data.used, data.limit)}%` }}
                                    />
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {/* Plans Grid */}
            <h2 className="text-xl font-bold mb-4">プラン一覧</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {PLANS.map((plan, index) => {
                    const isCurrent = subscription?.planId === plan.id;
                    const isPopular = plan.id === 'pro';

                    return (
                        <motion.div
                            key={plan.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1 }}
                            className={`relative bg-gray-900 border rounded-2xl p-6 ${isPopular
                                    ? 'border-purple-500 ring-2 ring-purple-500/20'
                                    : 'border-gray-800'
                                }`}
                        >
                            {isPopular && (
                                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-purple-600 text-white text-xs font-medium rounded-full">
                                    人気
                                </div>
                            )}

                            <div className="flex items-center gap-3 mb-4">
                                {planIcons[plan.id]}
                                <div>
                                    <h3 className="font-bold text-white">{plan.name}</h3>
                                    <p className="text-xs text-gray-500">{plan.description}</p>
                                </div>
                            </div>

                            <div className="mb-4">
                                <span className="text-3xl font-bold text-white">
                                    ¥{plan.price.toLocaleString()}
                                </span>
                                <span className="text-sm text-gray-500">/月</span>
                            </div>

                            <ul className="space-y-2 mb-6 text-sm">
                                <li className="flex items-center gap-2 text-gray-300">
                                    <Check size={14} className="text-green-400" />
                                    AI呼び出し: {formatLimit(plan.limits.aiCalls)}
                                </li>
                                <li className="flex items-center gap-2 text-gray-300">
                                    <Check size={14} className="text-green-400" />
                                    動画生成: {formatLimit(plan.limits.videoMinutes)}分
                                </li>
                                <li className="flex items-center gap-2 text-gray-300">
                                    <Check size={14} className="text-green-400" />
                                    ナレーション: {formatLimit(plan.limits.narrationChars)}
                                </li>
                                <li className="flex items-center gap-2 text-gray-300">
                                    <Check size={14} className="text-green-400" />
                                    サムネイル: {formatLimit(plan.limits.thumbnails)}
                                </li>
                            </ul>

                            {isCurrent ? (
                                <button
                                    disabled
                                    className="w-full py-2.5 bg-gray-800 text-gray-500 rounded-lg font-medium"
                                >
                                    現在のプラン
                                </button>
                            ) : (
                                <button
                                    onClick={() => handleUpgrade(plan.id)}
                                    disabled={upgrading !== null || plan.id === 'free'}
                                    className={`w-full py-2.5 rounded-lg font-medium flex items-center justify-center gap-2 transition-all ${isPopular
                                            ? 'bg-purple-600 hover:bg-purple-500 text-white'
                                            : 'bg-gray-800 hover:bg-gray-700 text-white'
                                        } disabled:opacity-50`}
                                >
                                    {upgrading === plan.id ? (
                                        <Loader2 size={16} className="animate-spin" />
                                    ) : (
                                        <>
                                            アップグレード
                                            <ArrowRight size={14} />
                                        </>
                                    )}
                                </button>
                            )}
                        </motion.div>
                    );
                })}
            </div>

            {/* FAQ */}
            <div className="mt-12 text-center text-sm text-gray-500">
                <p>
                    請求に関するお問い合わせは <a href="mailto:support@example.com" className="text-indigo-400 hover:underline">support@example.com</a> まで
                </p>
            </div>
        </div>
    );
}
