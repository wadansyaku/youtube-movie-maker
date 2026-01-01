'use client';

import React, { useState } from 'react';
import {
    Sparkles,
    Calendar,
    Download,
    RefreshCw,
    ChevronRight,
    FileText,
    Copy,
    Check
} from 'lucide-react';
import { toast } from 'sonner';

interface DayPlan {
    day: number;
    title: string;
    hook: string;
    keyPoints: string[];
    cta: string;
}

// 30日分のコンテンツテーマ例（脳科学）
const generateBrainSciencePlan = (): DayPlan[] => {
    const topics = [
        { title: '脳は1日7万回思考する', hook: 'あなたの脳は今日、何万回思考した？', keyPoints: ['無意識の思考が95%', '習慣が思考を支配', '意識的思考は5%のみ'], cta: '思考をコントロールする方法はプロフィールから' },
        { title: '睡眠中に記憶が整理される理由', hook: '寝ている間に脳は大忙し', keyPoints: ['レム睡眠で記憶定着', '海馬から大脳皮質へ', '睡眠不足で記憶力30%低下'], cta: '睡眠の質を上げる方法をフォローして学ぼう' },
        { title: 'ドーパミンが報酬を予測する仕組み', hook: 'スマホを見たくなる本当の理由', keyPoints: ['期待が快感を生む', 'SNSはドーパミンハック', '達成より期待が重要'], cta: 'ドーパミンリセットについて詳しくは概要欄' },
        { title: '脳は20%のエネルギーを消費する', hook: '体重の2%なのに..', keyPoints: ['グルコースが主燃料', '思考でカロリー消費', '脳疲労は本物'], cta: '脳に良い食事を知りたい人はフォロー' },
        { title: 'ストレスで海馬が縮小する', hook: '慢性ストレスの恐ろしい影響', keyPoints: ['コルチゾールが神経を破壊', '記憶力が低下', '運動で回復可能'], cta: 'ストレス対策はプロフィールリンクから' },
        { title: '脳の可塑性は生涯続く', hook: '大人になっても脳は変われる', keyPoints: ['神経新生は続く', '学習で神経回路増加', '使わないと衰える'], cta: '脳トレ方法をフォローして学ぼう' },
        { title: 'マルチタスクは脳に悪影響', hook: '効率的だと思っていたのに...', keyPoints: ['認知切り替えコスト', '生産性40%低下', 'シングルタスクが最強'], cta: '集中力を高める方法は概要欄' },
        { title: '瞑想で脳の灰白質が増加', hook: '8週間で脳が変わる', keyPoints: ['前頭前皮質が発達', '扁桃体が縮小', 'ストレス耐性向上'], cta: '瞑想の始め方をフォローして学ぼう' },
        { title: '運動で脳由来神経栄養因子が増加', hook: '運動は最強の脳トレ', keyPoints: ['BDNFが神経成長促進', '記憶力向上', 'うつ症状改善'], cta: '脳に効く運動法はプロフィールから' },
        { title: '脳は顔を認識する専用領域がある', hook: '顔を見ただけで識別できる理由', keyPoints: ['紡錘状回顔領域', '0.1秒で認識', '相貌失認という障害'], cta: '脳の不思議をもっと知りたい人はフォロー' },
        { title: '笑いは脳全体を活性化する', hook: '笑うだけで頭が良くなる？', keyPoints: ['前頭葉・側頭葉が活性化', 'エンドルフィン放出', '創造性向上'], cta: '脳を活性化する習慣をフォローして学ぼう' },
        { title: '音楽を聴くと脳全体が光る', hook: 'MRIで見た驚きの光景', keyPoints: ['聴覚野だけじゃない', '感情・運動野も活性化', '演奏者はさらに活性化'], cta: '音楽と脳の関係をもっと知りたい人はフォロー' },
        { title: '脳は否定形を理解しにくい', hook: '「考えるな」と言われると考える理由', keyPoints: ['肯定形で処理', 'イメージが先行', 'ポジティブ表現が効果的'], cta: '脳科学的コミュニケーション術は概要欄' },
        { title: 'デジャヴは記憶のバグ', hook: '「これ見たことある」の正体', keyPoints: ['海馬の誤作動', '新情報が既視感に', '疲労時に起きやすい'], cta: '脳の不思議現象をもっと知りたい人はフォロー' },
        { title: '読書は脳の接続を強化する', hook: '本を読むと脳が変わる', keyPoints: ['言語野が発達', '共感力向上', '認知症リスク低下'], cta: '脳に良い読書法をフォローして学ぼう' },
        { title: '孤独は脳を萎縮させる', hook: '社会的孤立の恐ろしい影響', keyPoints: ['認知機能低下', '炎症反応増加', '社会交流が脳を守る'], cta: '脳を守る生活習慣はプロフィールから' },
        { title: '脳は節約モードで動く', hook: '考えるのが面倒くさい理由', keyPoints: ['認知的省力化', 'ヒューリスティクス', 'バイアスの原因'], cta: '認知バイアスについてフォローして学ぼう' },
        { title: '青色は集中力を高める', hook: '部屋の色で生産性が変わる', keyPoints: ['青は冷静さ促進', '赤は注意力向上', '緑はリラックス'], cta: '環境デザインの科学は概要欄' },
        { title: '午後2時は脳のパフォーマンス低下', hook: 'ランチ後に眠くなる本当の理由', keyPoints: ['概日リズムの影響', '血糖値スパイク', '仮眠が効果的'], cta: '最適な1日のスケジュールをフォローして学ぼう' },
        { title: '噛むことで脳血流が増加', hook: 'ガムを噛むと頭が良くなる？', keyPoints: ['咀嚼で血流20%増', '集中力向上', '認知症予防効果'], cta: '脳を活性化する食習慣は概要欄' },
        { title: '新しい経験で脳が若返る', hook: '旅行が脳に良い科学的理由', keyPoints: ['神経新生促進', 'BDNF増加', 'ルーティン打破'], cta: '脳を若返らせる習慣をフォローして学ぼう' },
        { title: '香りは記憶と直結している', hook: '匂いで思い出が蘇る理由', keyPoints: ['嗅覚は海馬に直結', '感情記憶と結合', 'アロマで集中力UP'], cta: '脳科学的な香りの使い方は概要欄' },
        { title: '脳は変化を恐れる', hook: '新しいことを始められない理由', keyPoints: ['扁桃体の防衛反応', '未知への警戒', '小さな一歩が鍵'], cta: '行動を変える科学をフォローして学ぼう' },
        { title: '感謝で脳内報酬系が活性化', hook: '感謝日記の科学的効果', keyPoints: ['ドーパミン放出', 'セロトニン増加', 'うつ症状改善'], cta: '感謝習慣の作り方は概要欄' },
        { title: '脳は物語形式で記憶する', hook: 'ストーリーが記憶に残る理由', keyPoints: ['神経結合が強化', '感情が記憶を定着', '事実より物語'], cta: '記憶術をフォローして学ぼう' },
        { title: '自然の中で脳がリセットされる', hook: '森林浴の科学的効果', keyPoints: ['前頭前皮質が休息', 'コルチゾール低下', '創造性向上'], cta: '脳リセット法はプロフィールから' },
        { title: '脳は夜に創造的になる', hook: '夜型人間の意外な強み', keyPoints: ['前頭葉の抑制低下', '発散思考が増加', '制約が外れる'], cta: '創造性を高める方法をフォローして学ぼう' },
        { title: '手書きはタイピングより記憶に良い', hook: 'デジタル時代に手書きが必要な理由', keyPoints: ['運動野が関与', '処理が深くなる', '長期記憶に有利'], cta: '効果的なノート術は概要欄' },
        { title: '脳は完璧主義を好まない', hook: '70%でOKを出す理由', keyPoints: ['認知負荷軽減', '決断疲れ防止', '行動が学習を生む'], cta: '脳に優しい働き方をフォローして学ぼう' },
        { title: '好奇心が脳を活性化する', hook: '知りたい欲求が脳を変える', keyPoints: ['ドーパミン分泌', '記憶力向上', '学習効率UP'], cta: '好奇心を育てる方法は概要欄' },
    ];

    return topics.map((topic, index) => ({
        day: index + 1,
        title: topic.title,
        hook: topic.hook,
        keyPoints: topic.keyPoints,
        cta: topic.cta,
    }));
};

export default function ContentPlannerPage() {
    const [theme, setTheme] = useState('脳科学・神経科学');
    const [plans, setPlans] = useState<DayPlan[]>([]);
    const [isGenerating, setIsGenerating] = useState(false);
    const [selectedDay, setSelectedDay] = useState<DayPlan | null>(null);
    const [copiedDay, setCopiedDay] = useState<number | null>(null);

    const handleGenerate = async () => {
        setIsGenerating(true);
        // 実際にはAI APIを呼び出す
        await new Promise(resolve => setTimeout(resolve, 1500));
        const generatedPlans = generateBrainSciencePlan();
        setPlans(generatedPlans);
        setIsGenerating(false);
        toast.success('30日分のコンテンツプランを生成しました！');
    };

    const handleExportJSON = () => {
        const data = {
            theme,
            generatedAt: new Date().toISOString(),
            plans,
        };
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `content_plan_${theme}_30days.json`;
        a.click();
        toast.success('JSONファイルをエクスポートしました');
    };

    const handleCopyDay = (day: DayPlan) => {
        const text = `【Day ${day.day}】${day.title}

🎣 フック: ${day.hook}

💡 ポイント:
${day.keyPoints.map((p, i) => `${i + 1}. ${p}`).join('\n')}

📢 CTA: ${day.cta}`;

        navigator.clipboard.writeText(text);
        setCopiedDay(day.day);
        setTimeout(() => setCopiedDay(null), 2000);
        toast.success('コピーしました');
    };

    return (
        <div className="min-h-screen bg-gray-950 text-gray-100">
            {/* ヘッダー */}
            <header className="border-b border-gray-800 bg-gray-900/80 backdrop-blur-sm sticky top-0 z-50">
                <div className="max-w-6xl mx-auto px-6 py-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-2xl font-bold flex items-center gap-2">
                                <Calendar className="h-6 w-6 text-amber-400" />
                                30日コンテンツプランナー
                            </h1>
                            <p className="text-sm text-gray-400 mt-1">
                                テーマから30日分のショート動画企画を自動生成
                            </p>
                        </div>
                    </div>
                </div>
            </header>

            <main className="max-w-6xl mx-auto px-6 py-8">
                {/* 入力セクション */}
                <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 mb-8">
                    <label className="block text-sm font-medium text-gray-400 mb-2">
                        コンテンツテーマ
                    </label>
                    <div className="flex gap-4">
                        <input
                            type="text"
                            value={theme}
                            onChange={(e) => setTheme(e.target.value)}
                            placeholder="例: 脳科学、心理学、ビジネス..."
                            className="flex-1 bg-gray-950 border border-gray-800 rounded-lg px-4 py-3 text-white focus:border-amber-500 focus:outline-none"
                        />
                        <button
                            onClick={handleGenerate}
                            disabled={isGenerating || !theme}
                            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-white font-medium rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isGenerating ? (
                                <RefreshCw className="h-5 w-5 animate-spin" />
                            ) : (
                                <Sparkles className="h-5 w-5" />
                            )}
                            {isGenerating ? '生成中...' : '30日分を生成'}
                        </button>
                    </div>
                </div>

                {/* 結果表示 */}
                {plans.length > 0 && (
                    <>
                        {/* アクションバー */}
                        <div className="flex items-center justify-between mb-6">
                            <p className="text-gray-400">
                                <span className="text-white font-bold">{plans.length}日分</span>のプランを生成しました
                            </p>
                            <button
                                onClick={handleExportJSON}
                                className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg transition-colors"
                            >
                                <Download className="h-4 w-4" />
                                JSONエクスポート
                            </button>
                        </div>

                        {/* カレンダービュー */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {plans.map((plan) => (
                                <div
                                    key={plan.day}
                                    onClick={() => setSelectedDay(plan)}
                                    className={`group relative bg-gray-900 border rounded-xl p-4 cursor-pointer transition-all hover:border-amber-500/60 ${selectedDay?.day === plan.day
                                            ? 'border-amber-500 ring-2 ring-amber-500/20'
                                            : 'border-gray-800'
                                        }`}
                                >
                                    {/* Day番号 */}
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-xs font-bold text-amber-400">
                                            DAY {plan.day}
                                        </span>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleCopyDay(plan);
                                            }}
                                            className="opacity-0 group-hover:opacity-100 p-1 hover:bg-gray-800 rounded transition-all"
                                        >
                                            {copiedDay === plan.day ? (
                                                <Check className="h-4 w-4 text-green-400" />
                                            ) : (
                                                <Copy className="h-4 w-4 text-gray-400" />
                                            )}
                                        </button>
                                    </div>

                                    {/* タイトル */}
                                    <h3 className="font-semibold text-white mb-2 line-clamp-2">
                                        {plan.title}
                                    </h3>

                                    {/* フック */}
                                    <p className="text-sm text-gray-400 line-clamp-1">
                                        🎣 {plan.hook}
                                    </p>

                                    {/* ポイント数 */}
                                    <div className="mt-3 flex items-center gap-2 text-xs text-gray-500">
                                        <span className="px-2 py-0.5 bg-gray-800 rounded">
                                            {plan.keyPoints.length}ポイント
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </>
                )}

                {/* 詳細モーダル */}
                {selectedDay && (
                    <div
                        className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50"
                        onClick={() => setSelectedDay(null)}
                    >
                        <div
                            className="bg-gray-900 border border-gray-800 rounded-2xl p-6 max-w-lg w-full max-h-[80vh] overflow-y-auto"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="flex items-center justify-between mb-4">
                                <span className="text-sm font-bold text-amber-400">
                                    DAY {selectedDay.day}
                                </span>
                                <button
                                    onClick={() => handleCopyDay(selectedDay)}
                                    className="flex items-center gap-1 px-3 py-1 bg-gray-800 hover:bg-gray-700 rounded-lg text-sm transition-colors"
                                >
                                    <Copy className="h-4 w-4" />
                                    コピー
                                </button>
                            </div>

                            <h2 className="text-xl font-bold text-white mb-4">
                                {selectedDay.title}
                            </h2>

                            <div className="space-y-4">
                                <div>
                                    <h3 className="text-sm font-medium text-gray-400 mb-1">🎣 フック</h3>
                                    <p className="text-white bg-gray-800 rounded-lg p-3">
                                        {selectedDay.hook}
                                    </p>
                                </div>

                                <div>
                                    <h3 className="text-sm font-medium text-gray-400 mb-1">💡 キーポイント</h3>
                                    <ul className="space-y-2">
                                        {selectedDay.keyPoints.map((point, i) => (
                                            <li key={i} className="flex items-start gap-2 text-white bg-gray-800 rounded-lg p-3">
                                                <span className="text-amber-400 font-bold">{i + 1}.</span>
                                                {point}
                                            </li>
                                        ))}
                                    </ul>
                                </div>

                                <div>
                                    <h3 className="text-sm font-medium text-gray-400 mb-1">📢 CTA</h3>
                                    <p className="text-white bg-gray-800 rounded-lg p-3">
                                        {selectedDay.cta}
                                    </p>
                                </div>
                            </div>

                            <div className="mt-6 flex gap-3">
                                <button
                                    onClick={() => setSelectedDay(null)}
                                    className="flex-1 py-2 border border-gray-700 rounded-lg text-gray-300 hover:bg-gray-800 transition-colors"
                                >
                                    閉じる
                                </button>
                                <a
                                    href={`/shorts-maker?template=20scene&title=${encodeURIComponent(selectedDay.title)}`}
                                    className="flex-1 flex items-center justify-center gap-2 py-2 bg-amber-500 hover:bg-amber-400 text-white font-medium rounded-lg transition-colors"
                                >
                                    <FileText className="h-4 w-4" />
                                    動画を作成
                                </a>
                            </div>
                        </div>
                    </div>
                )}

                {/* 空の状態 */}
                {plans.length === 0 && (
                    <div className="text-center py-20">
                        <Calendar className="h-16 w-16 text-gray-700 mx-auto mb-4" />
                        <h3 className="text-xl font-semibold text-gray-400 mb-2">
                            コンテンツプランを生成しましょう
                        </h3>
                        <p className="text-gray-500">
                            上のフォームにテーマを入力して「30日分を生成」をクリック
                        </p>
                    </div>
                )}
            </main>
        </div>
    );
}
