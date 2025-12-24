export type DeckLayout = "center" | "grid" | "split";

export interface DeckSlide {
    id: string;
    steps: number;
    note: string;
    layout: DeckLayout;
    content: string;
}

export interface DeckMeta {
    title: string;
    subtitle?: string;
}

const escapeHtml = (value: string) =>
    value
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");

export const buildCognitiveDeckSlides = (topic: string, audience: string): DeckSlide[] => {
    const safeTopic = escapeHtml(topic || "Codex時代のバイブコーディング");
    const safeAudience = escapeHtml(audience || "初心者〜中級者のバイブコーディングエンジニア");

    return [
        {
            id: "slide-hook",
            steps: 5,
            note: "導入。テーマの重要性と、今日の目的を短く提示する。",
            layout: "center",
            content: `
            <div class="flex flex-col items-center justify-center text-center gap-6 h-full">
                <h1 class="text-5xl md:text-6xl font-heading font-bold leading-tight">
                    「${safeTopic}」は<br/>速いほど危ない？
                </h1>
                <p class="text-slate-400 text-lg max-w-2xl">
                    今日は“勢い”を“再現性”に変える話です。
                </p>

                <div class="fragment transition-all duration-500 ease-out" data-step="1">
                    <div class="glass px-6 py-4 rounded-2xl inline-flex items-center gap-3">
                        <i class="fa-solid fa-triangle-exclamation text-rose-400 text-xl"></i>
                        <span class="text-xl">手戻りの多くは「意図のズレ」</span>
                    </div>
                </div>

                <div class="fragment transition-all duration-500 ease-out" data-step="2">
                    <div class="text-blue-400 text-lg">
                        今日のゴール：速度と品質の“両立”を習慣化
                    </div>
                </div>

                <div class="fragment transition-all duration-500 ease-out" data-step="3">
                    <div class="text-slate-300 text-sm">
                        対象：${safeAudience}
                    </div>
                </div>

                <div class="fragment transition-all duration-500 ease-out" data-step="4">
                    <div class="flex items-center justify-center gap-3 text-amber-400">
                        <i class="fa-solid fa-key"></i>
                        <span>鍵は3つ：意図 / ループ / ガードレール</span>
                    </div>
                </div>

                <div class="fragment transition-all duration-500 ease-out" data-step="5">
                    <div class="text-slate-100 text-lg font-semibold">
                        “再現できるバイブ”にアップデートしよう
                    </div>
                </div>
            </div>
            `
        },
        {
            id: "slide-gap-1",
            steps: 6,
            note: "現状と理想の対比。どこでズレるのかを可視化する。",
            layout: "split",
            content: `
            <div class="flex flex-col md:flex-row gap-8 h-full">
                <div class="glass rounded-2xl p-6 flex-1">
                    <h2 class="text-2xl font-heading font-semibold text-rose-400 mb-4">
                        <i class="fa-solid fa-cloud-rain mr-2"></i>現状
                    </h2>
                    <div class="space-y-3 text-slate-300">
                        <div class="fragment transition-all duration-500 ease-out" data-step="1">プロンプトが長文日記になる</div>
                        <div class="fragment transition-all duration-500 ease-out" data-step="2">「動いたからOK」で止まる</div>
                        <div class="fragment transition-all duration-500 ease-out" data-step="3">チームで再現できない</div>
                    </div>
                </div>

                <div class="glass rounded-2xl p-6 flex-1">
                    <h2 class="text-2xl font-heading font-semibold text-emerald-400 mb-4">
                        <i class="fa-solid fa-sun mr-2"></i>理想
                    </h2>
                    <div class="space-y-3 text-slate-300">
                        <div class="fragment transition-all duration-500 ease-out" data-step="4">意図が先に固定される</div>
                        <div class="fragment transition-all duration-500 ease-out" data-step="5">検証が自動で回る</div>
                        <div class="fragment transition-all duration-500 ease-out" data-step="6">ナレッジが共有資産になる</div>
                    </div>
                </div>
            </div>
            `
        },
        {
            id: "slide-gap-2",
            steps: 5,
            note: "失速ポイントの洗い出し。心理と設計の両面に触れる。",
            layout: "grid",
            content: `
            <div class="flex flex-col gap-6">
                <h2 class="text-3xl font-heading font-semibold text-center">失速ポイント</h2>
                <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    <div class="fragment transition-all duration-500 ease-out glass p-5 rounded-2xl" data-step="1">
                        <i class="fa-solid fa-scroll text-rose-400 text-2xl mb-3"></i>
                        <div class="font-semibold">要件が空気化</div>
                        <div class="text-sm text-slate-400">“早く動く”が目的化</div>
                    </div>
                    <div class="fragment transition-all duration-500 ease-out glass p-5 rounded-2xl" data-step="2">
                        <i class="fa-solid fa-feather-pointed text-amber-400 text-2xl mb-3"></i>
                        <div class="font-semibold">指示が冗長</div>
                        <div class="text-sm text-slate-400">重要な制約が埋もれる</div>
                    </div>
                    <div class="fragment transition-all duration-500 ease-out glass p-5 rounded-2xl" data-step="3">
                        <i class="fa-solid fa-microscope text-blue-400 text-2xl mb-3"></i>
                        <div class="font-semibold">検証が後回し</div>
                        <div class="text-sm text-slate-400">成功に見えて実は壊れている</div>
                    </div>
                    <div class="fragment transition-all duration-500 ease-out glass p-5 rounded-2xl" data-step="4">
                        <i class="fa-solid fa-memory text-rose-400 text-2xl mb-3"></i>
                        <div class="font-semibold">文脈が毎回崩れる</div>
                        <div class="text-sm text-slate-400">前提が揺れると精度も揺れる</div>
                    </div>
                    <div class="fragment transition-all duration-500 ease-out glass p-5 rounded-2xl xl:col-span-2" data-step="5">
                        <i class="fa-solid fa-skull text-rose-400 text-2xl mb-3"></i>
                        <div class="font-semibold text-lg">結果：速度が上がるほど品質が落ちる</div>
                        <div class="text-sm text-slate-400">“手戻りスパイラル”に入る</div>
                    </div>
                </div>
            </div>
            `
        },
        {
            id: "slide-mech-loop",
            steps: 6,
            note: "Vibe Coding Loop。短いループを設計することを強調。",
            layout: "center",
            content: `
            <div class="flex flex-col items-center justify-center gap-6 h-full">
                <h2 class="text-3xl font-heading font-semibold">Vibe Coding Loop 2.0</h2>

                <div class="relative w-full max-w-3xl h-80">
                    <div class="absolute inset-0 flex items-center justify-center">
                        <div class="w-56 h-56 rounded-full border border-slate-600/50"></div>
                    </div>

                    <div class="fragment transition-all duration-500 ease-out absolute top-0 left-1/2 -translate-x-1/2 glass px-4 py-2 rounded-xl" data-step="1">
                        <i class="fa-solid fa-bullseye text-blue-400 mr-2"></i>意図の固定
                    </div>
                    <div class="fragment transition-all duration-500 ease-out absolute right-0 top-1/2 -translate-y-1/2 glass px-4 py-2 rounded-xl" data-step="2">
                        <i class="fa-solid fa-pen-nib text-amber-400 mr-2"></i>草案生成
                    </div>
                    <div class="fragment transition-all duration-500 ease-out absolute bottom-0 left-1/2 -translate-x-1/2 glass px-4 py-2 rounded-xl" data-step="3">
                        <i class="fa-solid fa-magnifying-glass text-rose-400 mr-2"></i>批評・検証
                    </div>
                    <div class="fragment transition-all duration-500 ease-out absolute left-0 top-1/2 -translate-y-1/2 glass px-4 py-2 rounded-xl" data-step="4">
                        <i class="fa-solid fa-wrench text-emerald-400 mr-2"></i>差分修正
                    </div>
                    <div class="fragment transition-all duration-500 ease-out absolute inset-0 flex items-center justify-center" data-step="5">
                        <div class="glass px-6 py-3 rounded-full">
                            <i class="fa-solid fa-rotate text-blue-400 mr-2"></i>小さく回すほど強い
                        </div>
                    </div>
                </div>

                <div class="fragment transition-all duration-500 ease-out text-slate-300" data-step="6">
                    ループの「長さ」ではなく「検証の粒度」を設計する
                </div>
            </div>
            `
        },
        {
            id: "slide-mech-prompt",
            steps: 6,
            note: "Prompt Ladder。短い指示でも精度が出る順番を共有する。",
            layout: "grid",
            content: `
            <div class="flex flex-col gap-6">
                <h2 class="text-3xl font-heading font-semibold text-center">Prompt Ladder</h2>

                <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    <div class="fragment transition-all duration-500 ease-out glass p-5 rounded-2xl" data-step="1">
                        <div class="text-blue-400 font-semibold">1. Intent</div>
                        <div class="text-sm text-slate-400">なぜやるのかを固定</div>
                    </div>
                    <div class="fragment transition-all duration-500 ease-out glass p-5 rounded-2xl" data-step="2">
                        <div class="text-amber-400 font-semibold">2. Constraints</div>
                        <div class="text-sm text-slate-400">守るべき境界だけを書く</div>
                    </div>
                    <div class="fragment transition-all duration-500 ease-out glass p-5 rounded-2xl" data-step="3">
                        <div class="text-emerald-400 font-semibold">3. Examples</div>
                        <div class="text-sm text-slate-400">良い/悪い例で精度を上げる</div>
                    </div>
                    <div class="fragment transition-all duration-500 ease-out glass p-5 rounded-2xl" data-step="4">
                        <div class="text-rose-400 font-semibold">4. Checks</div>
                        <div class="text-sm text-slate-400">OK条件を明文化</div>
                    </div>
                    <div class="fragment transition-all duration-500 ease-out glass p-5 rounded-2xl" data-step="5">
                        <div class="text-blue-400 font-semibold">5. Fallbacks</div>
                        <div class="text-sm text-slate-400">迷った時の退避ルール</div>
                    </div>
                    <div class="fragment transition-all duration-500 ease-out glass p-5 rounded-2xl" data-step="6">
                        <div class="font-semibold text-lg">結果：短い指示でも再現性が出る</div>
                        <div class="text-sm text-slate-400">長文プロンプトから卒業できる</div>
                    </div>
                </div>
            </div>
            `
        },
        {
            id: "slide-mech-guardrail",
            steps: 6,
            note: "ガードレール設計。人間の判断を減らすより、失敗を減らす。",
            layout: "split",
            content: `
            <div class="flex flex-col md:flex-row gap-8 h-full">
                <div class="glass rounded-2xl p-6 flex-1">
                    <h2 class="text-2xl font-heading font-semibold text-emerald-400 mb-4">
                        <i class="fa-solid fa-shield-halved mr-2"></i>ガードレール
                    </h2>
                    <div class="space-y-3 text-slate-300">
                        <div class="fragment transition-all duration-500 ease-out" data-step="1">Diffベースで変更を最小化</div>
                        <div class="fragment transition-all duration-500 ease-out" data-step="2">自動テスト + 目視チェック</div>
                        <div class="fragment transition-all duration-500 ease-out" data-step="3">「やらないこと」を宣言</div>
                    </div>
                </div>

                <div class="glass rounded-2xl p-6 flex-1">
                    <h2 class="text-2xl font-heading font-semibold text-blue-400 mb-4">
                        <i class="fa-solid fa-diagram-project mr-2"></i>実行フロー
                    </h2>
                    <div class="space-y-4 text-slate-300">
                        <div class="fragment transition-all duration-500 ease-out flex items-center gap-3" data-step="4">
                            <div class="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center">1</div>
                            <span>Spec → 生成 → Diff</span>
                        </div>
                        <div class="fragment transition-all duration-500 ease-out flex items-center gap-3" data-step="5">
                            <div class="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center">2</div>
                            <span>テスト → 修正 → 確定</span>
                        </div>
                        <div class="fragment transition-all duration-500 ease-out flex items-center gap-3" data-step="6">
                            <div class="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center">3</div>
                            <span>ログ化 → 再利用テンプレ化</span>
                        </div>
                    </div>
                </div>
            </div>
            `
        },
        {
            id: "slide-proof",
            steps: 5,
            note: "効果の見える化。数字はサンプルとして扱う。",
            layout: "center",
            content: `
            <div class="flex flex-col items-center justify-center gap-6 h-full">
                <h2 class="text-3xl font-heading font-semibold">効果の実測（サンプル）</h2>

                <div class="fragment transition-all duration-500 ease-out glass p-6 rounded-2xl w-full max-w-3xl" data-step="1">
                    <canvas id="proofChart" height="140"></canvas>
                </div>

                <div class="fragment transition-all duration-500 ease-out text-emerald-400 text-lg" data-step="2">
                    レビュー時間：平均 -43%
                </div>
                <div class="fragment transition-all duration-500 ease-out text-blue-400 text-lg" data-step="3">
                    手戻り率：平均 -38%
                </div>
                <div class="fragment transition-all duration-500 ease-out text-amber-400 text-lg" data-step="4">
                    リリース速度：+1.6倍
                </div>
                <div class="fragment transition-all duration-500 ease-out text-slate-300 text-sm" data-step="5">
                    「速いほど安定する」設計へ移行
                </div>
            </div>
            `
        },
        {
            id: "slide-action",
            steps: 6,
            note: "行動。30-60-90プランと習慣化。",
            layout: "grid",
            content: `
            <div class="flex flex-col gap-6">
                <h2 class="text-3xl font-heading font-semibold text-center">今日からの実践プラン</h2>

                <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    <div class="fragment transition-all duration-500 ease-out glass p-5 rounded-2xl" data-step="1">
                        <div class="text-amber-400 font-semibold">今日</div>
                        <div class="text-sm text-slate-400">Intent / Constraintsだけで1タスク</div>
                    </div>
                    <div class="fragment transition-all duration-500 ease-out glass p-5 rounded-2xl" data-step="2">
                        <div class="text-blue-400 font-semibold">今週</div>
                        <div class="text-sm text-slate-400">Diffベース運用に切り替える</div>
                    </div>
                    <div class="fragment transition-all duration-500 ease-out glass p-5 rounded-2xl" data-step="3">
                        <div class="text-emerald-400 font-semibold">2週間</div>
                        <div class="text-sm text-slate-400">OK条件テンプレを作る</div>
                    </div>
                    <div class="fragment transition-all duration-500 ease-out glass p-5 rounded-2xl" data-step="4">
                        <div class="text-rose-400 font-semibold">1ヶ月</div>
                        <div class="text-sm text-slate-400">チーム共有のPrompt Ladder化</div>
                    </div>
                    <div class="fragment transition-all duration-500 ease-out glass p-5 rounded-2xl" data-step="5">
                        <div class="font-semibold text-lg">儀式化する</div>
                        <div class="text-sm text-slate-400">毎回「意図→制約→検証」を声に出す</div>
                    </div>
                    <div class="fragment transition-all duration-500 ease-out glass p-5 rounded-2xl" data-step="6">
                        <div class="text-lg text-slate-100 font-semibold">
                            “再現性のあるバイブ”が勝つ
                        </div>
                    </div>
                </div>
            </div>
            `
        },
        {
            id: "slide-close",
            steps: 4,
            note: "締め。行動と共有への誘導。",
            layout: "center",
            content: `
            <div class="flex flex-col items-center justify-center text-center gap-6 h-full">
                <h2 class="text-4xl font-heading font-semibold">まとめ</h2>

                <div class="fragment transition-all duration-500 ease-out text-blue-400 text-xl" data-step="1">
                    速度は“設計”で安定する
                </div>
                <div class="fragment transition-all duration-500 ease-out text-emerald-400 text-xl" data-step="2">
                    ループは“短く、厳密に”
                </div>
                <div class="fragment transition-all duration-500 ease-out text-amber-400 text-xl" data-step="3">
                    ガードレールが“自由度”を守る
                </div>
                <div class="fragment transition-all duration-500 ease-out text-slate-300 text-sm" data-step="4">
                    次の一歩：自分のチーム仕様でテンプレ化しよう
                </div>
            </div>
            `
        },
    ];
};

export const buildCognitiveDeckHtml = (slides: DeckSlide[], meta: DeckMeta): string => {
    const safeTitle = escapeHtml(meta.title || "Cognitive Deck");
    const safeSubtitle = meta.subtitle ? escapeHtml(meta.subtitle) : "";
    const slidesJson = JSON.stringify(slides, null, 2);

    return `<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>${safeTitle}</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <link rel="preconnect" href="https://fonts.googleapis.com"/>
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin/>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@500;600;700;800&family=Noto+Sans+JP:wght@400;500;700&display=swap" rel="stylesheet"/>
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css"/>
  <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
  <style>
    :root { color-scheme: dark; }
    body { font-family: "Noto Sans JP", sans-serif; }
    h1, h2, h3, .font-heading { font-family: "Inter", "Noto Sans JP", sans-serif; }
    .glass {
      background: rgba(15, 23, 42, 0.5);
      border: 1px solid rgba(100, 116, 139, 0.5);
      backdrop-filter: blur(12px);
    }
    .fragment {
      opacity: 0;
      transform: translateY(1rem);
      transition: opacity 0.5s ease-out, transform 0.5s ease-out;
    }
    .fragment.visible {
      opacity: 1 !important;
      transform: translateY(0) !important;
    }
    #presenter-bar {
      background: rgba(15, 23, 42, 0.8);
      border-top: 1px solid rgba(100, 116, 139, 0.5);
      backdrop-filter: blur(14px);
      transform: translateY(calc(100% - 30px));
      transition: transform 0.3s ease;
    }
    #presenter-bar:hover { transform: translateY(0); }
    .glow { box-shadow: 0 0 30px rgba(59, 130, 246, 0.25); }
  </style>
</head>
<body class="bg-slate-950 text-slate-100">
  <div id="app" class="h-screen w-screen overflow-hidden flex flex-col">
    <div class="px-8 pt-6 flex items-center justify-between text-xs text-slate-400">
      <div class="flex items-center gap-3">
        <span class="px-3 py-1 rounded-full glass">Midnight Glass</span>
        <span id="slide-indicator" class="tracking-wide"></span>
      </div>
      <div class="flex items-center gap-3">
        <span class="text-slate-400">
          <i class="fa-solid fa-bolt text-amber-400 mr-1"></i>
          ${safeTitle}
        </span>
        <span id="step-indicator" class="tracking-wide"></span>
      </div>
    </div>

    <div class="flex-1 px-8 pb-20 pt-4">
      <div id="slide-panel" class="glass h-full w-full rounded-3xl p-10">
        <div id="slide-content" class="h-full w-full"></div>
      </div>
    </div>

    <div class="absolute bottom-24 left-8 text-xs text-slate-500">
      <i class="fa-solid fa-arrow-left"></i> / <i class="fa-solid fa-arrow-right"></i> / Space
    </div>
  </div>

  <div id="presenter-bar" class="fixed bottom-0 left-0 right-0">
    <div class="max-w-6xl mx-auto px-6 py-3">
      <div class="flex items-center justify-between mb-2">
        <div class="text-xs uppercase tracking-[0.2em] text-slate-400">Presenter Console</div>
        <div class="flex items-center gap-4 text-xs text-slate-400">
          <div><i class="fa-regular fa-clock text-blue-400 mr-1"></i><span id="clock-now"></span></div>
          <div><i class="fa-solid fa-stopwatch text-emerald-400 mr-1"></i><span id="elapsed"></span></div>
        </div>
      </div>
      <div class="w-full h-2 bg-slate-800 rounded-full overflow-hidden mb-3">
        <div id="progress-bar" class="h-full bg-gradient-to-r from-blue-500 via-indigo-500 to-emerald-400" style="width:0%"></div>
      </div>
      <div class="text-sm text-slate-200" id="teleprompter"></div>
      ${safeSubtitle ? `<div class="text-xs text-slate-500 mt-1">${safeSubtitle}</div>` : ""}
    </div>
  </div>

  <script>
    const slides = ${slidesJson};

    const layoutClasses = {
      center: "flex flex-col items-center justify-center text-center gap-6",
      split: "grid grid-cols-1 md:grid-cols-2 gap-8 items-center",
      grid: "grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 content-start"
    };

    const state = { currentSlide: 0, currentStep: 0 };

    const slideContent = document.getElementById("slide-content");
    const slideIndicator = document.getElementById("slide-indicator");
    const stepIndicator = document.getElementById("step-indicator");
    const teleprompter = document.getElementById("teleprompter");
    const progressBar = document.getElementById("progress-bar");

    let proofChart = null;
    const totalSteps = slides.reduce((sum, s) => sum + s.steps, 0);

    function renderSlide() {
      const slide = slides[state.currentSlide];
      slideContent.className = "h-full w-full " + (layoutClasses[slide.layout] || layoutClasses.center);
      slideContent.innerHTML = slide.content;
      updateFragments();
      updatePresenter();
      updateIndicators();
      if (slide.id === "slide-proof") {
        renderChart();
      }
    }

    function updateFragments() {
      const fragments = slideContent.querySelectorAll(".fragment");
      fragments.forEach((fragment) => {
        const step = Number(fragment.dataset.step || 0);
        if (state.currentStep >= step) {
          fragment.classList.add("visible");
        } else {
          fragment.classList.remove("visible");
        }
      });
    }

    function updateIndicators() {
      slideIndicator.textContent = "Slide " + (state.currentSlide + 1) + " / " + slides.length;
      stepIndicator.textContent = "Step " + state.currentStep + " / " + slides[state.currentSlide].steps;
    }

    function updatePresenter() {
      const slide = slides[state.currentSlide];
      teleprompter.textContent = slide.note;
      const stepsBefore = slides.slice(0, state.currentSlide).reduce((sum, s) => sum + s.steps, 0);
      const progress = Math.min(100, Math.round(((stepsBefore + state.currentStep) / totalSteps) * 100));
      progressBar.style.width = progress + "%";
    }

    function next() {
      const slide = slides[state.currentSlide];
      if (state.currentStep < slide.steps) {
        state.currentStep += 1;
        updateFragments();
      } else if (state.currentSlide < slides.length - 1) {
        state.currentSlide += 1;
        state.currentStep = 0;
        renderSlide();
      }
      updatePresenter();
      updateIndicators();
    }

    function prev() {
      if (state.currentStep > 0) {
        state.currentStep -= 1;
        updateFragments();
      } else if (state.currentSlide > 0) {
        state.currentSlide -= 1;
        state.currentStep = slides[state.currentSlide].steps;
        renderSlide();
      }
      updatePresenter();
      updateIndicators();
    }

    document.addEventListener("keydown", (e) => {
      if (e.code === "Space" || e.code === "ArrowRight") {
        e.preventDefault();
        next();
      } else if (e.code === "ArrowLeft") {
        e.preventDefault();
        prev();
      }
    });

    function renderChart() {
      const canvas = document.getElementById("proofChart");
      if (!canvas) return;
      if (proofChart) {
        proofChart.destroy();
        proofChart = null;
      }
      const ctx = canvas.getContext("2d");
      Chart.defaults.color = "#e2e8f0";
      Chart.defaults.font.family = "Noto Sans JP";

      proofChart = new Chart(ctx, {
        type: "bar",
        data: {
          labels: ["レビュー時間", "手戻り率", "仕様ズレ"],
          datasets: [
            {
              label: "従来",
              data: [100, 100, 100],
              backgroundColor: "rgba(248, 113, 113, 0.6)",
              borderRadius: 6
            },
            {
              label: "Vibe 2.0",
              data: [57, 62, 48],
              backgroundColor: "rgba(52, 211, 153, 0.7)",
              borderRadius: 6
            }
          ]
        },
        options: {
          plugins: { legend: { position: "top" } },
          scales: {
            y: {
              beginAtZero: true,
              ticks: { color: "#94a3b8" },
              grid: { color: "rgba(148,163,184,0.2)" }
            },
            x: {
              ticks: { color: "#94a3b8" },
              grid: { display: false }
            }
          }
        }
      });
    }

    const startTime = Date.now();
    const clockNow = document.getElementById("clock-now");
    const elapsed = document.getElementById("elapsed");

    function updateClock() {
      const now = new Date();
      clockNow.textContent = now.toLocaleTimeString("ja-JP", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
      const diff = Date.now() - startTime;
      const mins = Math.floor(diff / 60000);
      const secs = Math.floor((diff % 60000) / 1000);
      elapsed.textContent = String(mins).padStart(2, "0") + ":" + String(secs).padStart(2, "0");
    }

    renderSlide();
    updateClock();
    setInterval(updateClock, 1000);
  </script>
</body>
</html>`;
};
