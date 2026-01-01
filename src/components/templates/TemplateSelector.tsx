'use client';

import { useState } from 'react';
import { FileText, ChevronRight, Copy, Check } from 'lucide-react';
import { Template, TemplateVariable, applyTemplate, validateTemplateValues } from '@/lib/templates';

interface Props {
    templates: Template[];
    onApply: (content: string) => void;
    currentLane?: string;
}

export function TemplateSelector({ templates, onApply, currentLane }: Props) {
    const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
    const [values, setValues] = useState<Record<string, string | number>>({});
    const [errors, setErrors] = useState<string[]>([]);
    const [copied, setCopied] = useState(false);

    // Filter templates by lane
    const filteredTemplates = templates.filter(t => !t.lane || t.lane === currentLane);

    const handleSelectTemplate = (template: Template) => {
        setSelectedTemplate(template);
        // Initialize with default values
        const initialValues: Record<string, string | number> = {};
        template.variables.forEach(v => {
            if (v.defaultValue !== undefined) {
                initialValues[v.key] = v.defaultValue;
            }
        });
        setValues(initialValues);
        setErrors([]);
    };

    const handleValueChange = (key: string, value: string | number) => {
        setValues(prev => ({ ...prev, [key]: value }));
    };

    const handleApply = () => {
        if (!selectedTemplate) return;

        const validation = validateTemplateValues(selectedTemplate, values);
        if (!validation.valid) {
            setErrors(validation.errors);
            return;
        }

        const result = applyTemplate(selectedTemplate, values);
        onApply(result);
        setSelectedTemplate(null);
        setValues({});
    };

    const handleCopyPreview = () => {
        if (!selectedTemplate) return;
        const result = applyTemplate(selectedTemplate, values);
        navigator.clipboard.writeText(result);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    if (!selectedTemplate) {
        return (
            <div className="space-y-2">
                <h4 className="text-sm font-medium text-gray-400 mb-3">テンプレートを選択</h4>
                {filteredTemplates.length === 0 ? (
                    <p className="text-sm text-gray-500">利用可能なテンプレートがありません</p>
                ) : (
                    <div className="grid grid-cols-1 gap-2">
                        {filteredTemplates.map((template) => (
                            <button
                                key={template.id}
                                onClick={() => handleSelectTemplate(template)}
                                className="flex items-center gap-3 p-3 bg-gray-800/50 hover:bg-gray-800 rounded-lg border border-gray-700/50 hover:border-indigo-500/50 transition-all text-left"
                            >
                                <FileText className="w-5 h-5 text-indigo-400 flex-shrink-0" />
                                <div className="flex-1 min-w-0">
                                    <span className="text-sm font-medium block">{template.name}</span>
                                    {template.description && (
                                        <span className="text-xs text-gray-500 block truncate">{template.description}</span>
                                    )}
                                </div>
                                <ChevronRight className="w-4 h-4 text-gray-500" />
                            </button>
                        ))}
                    </div>
                )}
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between">
                <button
                    onClick={() => setSelectedTemplate(null)}
                    className="text-sm text-gray-400 hover:text-white"
                >
                    ← 戻る
                </button>
                <span className="text-sm font-medium">{selectedTemplate.name}</span>
            </div>

            {/* Errors */}
            {errors.length > 0 && (
                <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
                    {errors.map((error, i) => (
                        <p key={i} className="text-sm text-red-400">{error}</p>
                    ))}
                </div>
            )}

            {/* Variables Form */}
            <div className="space-y-3">
                {selectedTemplate.variables.map((variable) => (
                    <VariableInput
                        key={variable.key}
                        variable={variable}
                        value={values[variable.key] ?? ''}
                        onChange={(val) => handleValueChange(variable.key, val)}
                    />
                ))}
            </div>

            {/* Preview */}
            <div className="p-3 bg-gray-800/50 rounded-lg border border-gray-700/50">
                <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-gray-400">プレビュー</span>
                    <button
                        onClick={handleCopyPreview}
                        className="text-gray-400 hover:text-white"
                    >
                        {copied ? <Check size={14} className="text-green-400" /> : <Copy size={14} />}
                    </button>
                </div>
                <pre className="text-xs text-gray-300 whitespace-pre-wrap max-h-40 overflow-y-auto">
                    {applyTemplate(selectedTemplate, values)}
                </pre>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2">
                <button
                    onClick={() => setSelectedTemplate(null)}
                    className="flex-1 btn btn-secondary"
                >
                    キャンセル
                </button>
                <button
                    onClick={handleApply}
                    className="flex-1 btn btn-primary"
                >
                    適用
                </button>
            </div>
        </div>
    );
}

function VariableInput({
    variable,
    value,
    onChange,
}: {
    variable: TemplateVariable;
    value: string | number;
    onChange: (val: string | number) => void;
}) {
    const id = `var-${variable.key}`;

    return (
        <div>
            <label htmlFor={id} className="block text-xs text-gray-400 mb-1">
                {variable.label} {variable.required && <span className="text-red-400">*</span>}
            </label>
            {variable.type === 'textarea' ? (
                <textarea
                    id={id}
                    value={String(value)}
                    onChange={(e) => onChange(e.target.value)}
                    className="textarea min-h-[60px]"
                    placeholder={variable.label}
                />
            ) : variable.type === 'select' && variable.options ? (
                <select
                    id={id}
                    value={String(value)}
                    onChange={(e) => onChange(e.target.value)}
                    className="input"
                >
                    <option value="">選択してください</option>
                    {variable.options.map((opt) => (
                        <option key={opt} value={opt}>{opt}</option>
                    ))}
                </select>
            ) : variable.type === 'number' ? (
                <input
                    id={id}
                    type="number"
                    value={value}
                    onChange={(e) => onChange(Number(e.target.value))}
                    className="input"
                    placeholder={variable.label}
                />
            ) : (
                <input
                    id={id}
                    type="text"
                    value={String(value)}
                    onChange={(e) => onChange(e.target.value)}
                    className="input"
                    placeholder={variable.label}
                />
            )}
        </div>
    );
}

export default TemplateSelector;
