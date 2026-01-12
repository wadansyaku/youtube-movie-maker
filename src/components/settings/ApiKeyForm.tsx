"use client";

import { useEffect, useState, useTransition } from "react";
import { toast } from "sonner";
import { AlertCircle, CheckCircle, Loader2, ShieldCheck } from "lucide-react";

type ActionResult = {
    ok: boolean;
    message: string;
};

type ApiKeyAction = (formData: FormData) => Promise<ActionResult | void>;

interface ApiKeyFormProps {
    label: string;
    defaultValue?: string | null;
    placeholder?: string;
    action: ApiKeyAction;
    submitLabel?: string;
    testAction?: ApiKeyAction;
    testLabel?: string;
}

export default function ApiKeyForm({
    label,
    defaultValue,
    placeholder,
    action,
    submitLabel = "保存",
    testAction,
    testLabel = "テスト",
}: ApiKeyFormProps) {
    const [value, setValue] = useState(defaultValue ?? "");
    const [isSaving, startSaving] = useTransition();
    const [isTesting, startTesting] = useTransition();
    const [testResult, setTestResult] = useState<"idle" | "testing" | "success" | "error">("idle");
    const [testError, setTestError] = useState<string | null>(null);

    useEffect(() => {
        setValue(defaultValue ?? "");
    }, [defaultValue]);

    useEffect(() => {
        setTestResult("idle");
        setTestError(null);
    }, [value]);

    const runAction = (actionFn: ApiKeyAction | undefined, fallbackMessage: string, transition: typeof startSaving) => {
        if (!actionFn) return;
        const data = new FormData();
        data.set("apiKey", value);

        transition(() => {
            actionFn(data)
                .then((result) => {
                    if (result?.ok) {
                        toast.success(result.message || fallbackMessage);
                    } else {
                        toast.error(result?.message || "処理に失敗しました");
                    }
                })
                .catch((error) => {
                    toast.error(error instanceof Error ? error.message : "処理に失敗しました");
                });
        });
    };

    const runTest = () => {
        if (!testAction) return;
        const data = new FormData();
        data.set("apiKey", value);
        setTestResult("testing");
        setTestError(null);

        startTesting(() => {
            testAction(data)
                .then((result) => {
                    if (result?.ok) {
                        setTestResult("success");
                        toast.success(result.message || "検証が完了しました");
                    } else {
                        const message = result?.message || "テストに失敗しました";
                        setTestResult("error");
                        setTestError(message);
                        toast.error(message);
                    }
                })
                .catch((error) => {
                    const message = error instanceof Error ? error.message : "テストに失敗しました";
                    setTestResult("error");
                    setTestError(message);
                    toast.error(message);
                });
        });
    };

    return (
        <div className="space-y-4">
            <div>
                <label className="block text-sm font-medium mb-1">{label}</label>
                <input
                    type="password"
                    value={value}
                    onChange={(event) => setValue(event.target.value)}
                    placeholder={placeholder}
                    className="input w-full font-mono"
                />
            </div>
            <div className="flex flex-wrap gap-2">
                <button
                    type="button"
                    onClick={() => runAction(action, "保存しました", startSaving)}
                    disabled={isSaving || !value.trim()}
                    className="btn btn-primary px-6 py-2.5 text-sm font-medium rounded-lg shadow-md hover:shadow-lg transition-all disabled:opacity-50"
                >
                    {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : submitLabel}
                </button>
                {testAction && (
                    <button
                        type="button"
                        onClick={runTest}
                        disabled={isTesting || !value.trim()}
                        className="btn bg-gray-800 text-gray-100 hover:bg-gray-700 px-4 py-2.5 text-sm font-medium rounded-lg transition-all disabled:opacity-50 flex items-center gap-2"
                    >
                        {isTesting ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
                        {testLabel}
                    </button>
                )}
            </div>
            {testAction && testResult !== "idle" && (
                <div className="text-sm">
                    {testResult === "testing" && (
                        <div className="flex items-center gap-2 text-gray-400">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            <span>検証中...</span>
                        </div>
                    )}
                    {testResult === "success" && (
                        <div className="flex items-center gap-2 text-emerald-400 animate-fade-in">
                            <CheckCircle className="h-4 w-4" />
                            <span>API OK</span>
                        </div>
                    )}
                    {testResult === "error" && (
                        <div className="flex items-center gap-2 text-red-400">
                            <AlertCircle className="h-4 w-4" />
                            <span>{testError || "テスト失敗"}</span>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
