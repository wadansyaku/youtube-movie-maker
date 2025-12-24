import Link from 'next/link';
import { createSeries } from '@/app/actions';

export default function NewSeriesPage() {
    return (
        <div className="p-8 max-w-2xl animate-fade-in">
            {/* Breadcrumb */}
            <div className="text-sm text-[var(--muted)] mb-6">
                <Link href="/series" className="hover:text-white">シリーズ</Link>
                <span className="mx-2">/</span>
                <span>新規作成</span>
            </div>

            <h1 className="text-2xl font-bold mb-2">新規シリーズ作成</h1>
            <p className="text-[var(--muted)] mb-8">
                シリーズの基本情報を入力してください。World Bibleは作成後に編集できます。
            </p>

            <form action={createSeries} className="space-y-6">
                <div>
                    <label className="block text-sm font-medium mb-2">
                        タイトル <span className="text-accent-500">*</span>
                    </label>
                    <input
                        type="text"
                        name="title"
                        required
                        placeholder="例: 未来都市シリーズ"
                        className="input"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium mb-2">
                        説明
                    </label>
                    <textarea
                        name="description"
                        placeholder="このシリーズの概要、テーマ、ターゲット視聴者などを記載..."
                        className="textarea"
                        rows={4}
                    />
                </div>

                <div className="glass rounded-lg p-4">
                    <h3 className="font-medium mb-2 flex items-center gap-2">
                        <span>📚</span> World Bible 自動生成
                    </h3>
                    <p className="text-sm text-[var(--muted)]">
                        シリーズ作成時にデフォルトのWorld Bibleが自動生成されます。
                        作成後にビジュアルスタイル、オーディオスタイル、キャラクター、ルールなどを編集してください。
                    </p>
                </div>

                <div className="flex items-center gap-3 pt-4">
                    <button type="submit" className="btn btn-primary">
                        シリーズを作成
                    </button>
                    <Link href="/series" className="btn btn-secondary">
                        キャンセル
                    </Link>
                </div>
            </form>
        </div>
    );
}
