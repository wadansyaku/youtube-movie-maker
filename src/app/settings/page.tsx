import {
    getApiKey,
    saveApiKey,
    testGeminiApiKey,
    getRunwayApiKey,
    saveRunwayApiKey,
    getElevenLabsApiKey,
    saveElevenLabsApiKey,
    getStabilityApiKey,
    saveStabilityApiKey,
    getStripeSecretKey,
    saveStripeSecretKey,
    getStripePublishableKey,
    saveStripePublishableKey,
    getStripeWebhookSecret,
    saveStripeWebhookSecret,
} from './actions';
import ApiKeyForm from '@/components/settings/ApiKeyForm';

export default async function SettingsPage() {
    const geminiKey = await getApiKey();
    const runwayKey = await getRunwayApiKey();
    const elevenLabsKey = await getElevenLabsApiKey();
    const stabilityKey = await getStabilityApiKey();
    const stripeSecretKey = await getStripeSecretKey();
    const stripePublishableKey = await getStripePublishableKey();
    const stripeWebhookSecret = await getStripeWebhookSecret();

    return (
        <div className="p-8 animate-fade-in max-w-2xl">
            <h1 className="text-2xl font-bold mb-6 flex items-center gap-2">
                <span>⚙️</span> 設定
            </h1>

            {/* Gemini AI */}
            <div className="card p-6 mb-6">
                <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <span>🤖</span> Google Gemini
                </h2>
                <p className="text-[var(--muted)] text-sm mb-4">
                    AI Copilot機能（Script Generator、Prompt Optimizer、SEO Generator等）に使用します。
                </p>

                <ApiKeyForm
                    label="Gemini API Key"
                    defaultValue={geminiKey || ''}
                    placeholder="AIzaSy..."
                    action={saveApiKey}
                    testAction={testGeminiApiKey}
                    submitLabel="保存"
                    testLabel="キーをテスト"
                />

                <div className="mt-4 text-xs text-[var(--muted)]">
                    <a
                        href="https://makersuite.google.com/app/apikey"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:text-white underline"
                    >
                        Google AI Studioでキーを取得 →
                    </a>
                </div>
            </div>

            {/* Runway */}
            <div className="card p-6 mb-6">
                <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <span>🎬</span> Runway
                </h2>
                <p className="text-[var(--muted)] text-sm mb-4">
                    Gen-3 Alpha を使用した映像生成をアプリ内で直接行えます。
                </p>

                <ApiKeyForm
                    label="Runway API Key"
                    defaultValue={runwayKey || ''}
                    placeholder="rway_..."
                    action={saveRunwayApiKey}
                    submitLabel="保存"
                />

                <div className="mt-4 text-xs text-[var(--muted)]">
                    <a
                        href="https://app.runwayml.com/settings/api"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:text-white underline"
                    >
                        Runway API Keyを取得 →
                    </a>
                </div>
            </div>

            {/* ElevenLabs */}
            <div className="card p-6">
                <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <span>🎙️</span> ElevenLabs
                </h2>
                <p className="text-[var(--muted)] text-sm mb-4">
                    ナレーション音声の自動生成に使用します。多言語対応。
                </p>

                <ApiKeyForm
                    label="ElevenLabs API Key"
                    defaultValue={elevenLabsKey || ''}
                    placeholder="sk_..."
                    action={saveElevenLabsApiKey}
                    submitLabel="保存"
                />

                <div className="mt-4 text-xs text-[var(--muted)]">
                    <a
                        href="https://elevenlabs.io/app/settings/api-keys"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:text-white underline"
                    >
                        ElevenLabs API Keyを取得 →
                    </a>
                </div>
            </div>

            {/* Stability AI */}
            <div className="card p-6">
                <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <span>🎨</span> Stability AI
                </h2>
                <p className="text-[var(--muted)] text-sm mb-4">
                    Stable Diffusion 3 でサムネイル画像を生成します。
                </p>

                <ApiKeyForm
                    label="Stability API Key"
                    defaultValue={stabilityKey || ''}
                    placeholder="sk-..."
                    action={saveStabilityApiKey}
                    submitLabel="保存"
                />

                <div className="mt-4 text-xs text-[var(--muted)]">
                    <a
                        href="https://platform.stability.ai/account/keys"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:text-white underline"
                    >
                        Stability AI API Keyを取得 →
                    </a>
                </div>
            </div>

            {/* Stripe */}
            <div className="card p-6 mt-6">
                <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <span>💳</span> Stripe (決済)
                </h2>
                <p className="text-[var(--muted)] text-sm mb-4">
                    サブスクリプション決済機能に使用します。
                </p>

                <div className="mb-6">
                    <ApiKeyForm
                        label="Secret Key"
                        defaultValue={stripeSecretKey || ''}
                        placeholder="sk_live_..."
                        action={saveStripeSecretKey}
                        submitLabel="保存"
                    />
                </div>

                <div className="mb-6">
                    <ApiKeyForm
                        label="Publishable Key"
                        defaultValue={stripePublishableKey || ''}
                        placeholder="pk_live_..."
                        action={saveStripePublishableKey}
                        submitLabel="保存"
                    />
                </div>

                <ApiKeyForm
                    label="Webhook Secret"
                    defaultValue={stripeWebhookSecret || ''}
                    placeholder="whsec_..."
                    action={saveStripeWebhookSecret}
                    submitLabel="保存"
                />

                <div className="mt-4 text-xs text-[var(--muted)]">
                    <a
                        href="https://dashboard.stripe.com/apikeys"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:text-white underline"
                    >
                        Stripe ダッシュボードでキーを取得 →
                    </a>
                </div>
            </div>
        </div>
    );
}
