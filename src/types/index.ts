/**
 * YouTube Movie Maker - Shared Type Definitions
 * 
 * This file contains all shared types derived from Prisma schema
 * and used across client/server components.
 */

// ============================================
// Base Types (from Prisma)
// ============================================

export interface Series {
    id: string;
    title: string;
    description: string | null;
    status: 'draft' | 'active' | 'archived';
    createdAt: string | Date;
    updatedAt: string | Date;
}

export interface WorldBible {
    id: string;
    seriesId: string;
    visualStyle: string;
    audioStyle: string;
    characters: string;
    settings: string;
    rules: string;
    updatedAt: string | Date;
}

export interface ProductionEpisode {
    id: string;
    seriesId: string | null;
    episodeNumber: number | null;
    title: string;
    synopsis: string | null;
    status: ProductionEpisodeStatus;
    lane: string | null;
    variant: string;
    createdAt: string | Date;
    updatedAt: string | Date;
    publishedAt: string | Date | null;
}

export type ProductionEpisodeStatus =
    | 'scripting'
    | 'voice'
    | 'assets'
    | 'editing'
    | 'review'
    | 'scheduled'
    | 'published'
    | 'archived';

export interface Idea {
    id: string;
    seriesId: string | null;
    title: string;
    description: string | null;
    lane: string | null;
    targetAudience: string | null;
    tags: string[];
    status: string;
    createdAt: string | Date;
    updatedAt: string | Date;
}

export interface DecisionLog {
    id: string;
    episodeId: string;
    editorialIntent: string;
    differentiationPoints: string | null;
    humanContributions: string;
    aiToolUsage: string;
    createdAt: string | Date;
    updatedAt: string | Date;
}

export interface Asset {
    id: string;
    type: AssetType;
    fileName: string;
    filePath: string;
    fileSize: number | null;
    mimeType: string | null;
    duration: number | null;
    metadata: string;
    source: AssetSource;
    generationParams: string;
    createdAt: string | Date;
    updatedAt: string | Date;
}

export type AssetType = 'video' | 'audio' | 'image' | 'script' | 'thumbnail' | 'slides';
export type AssetSource =
    | 'manual'
    | 'runway'
    | 'sora'
    | 'veo'
    | 'suno'
    | 'video_editor'
    | 'dynamic_slides'
    | 'stability'
    | 'luma'
    | 'kling'
    | 'other';

export interface Tag {
    id: string;
    name: string;
    color: string;
    createdAt: string | Date;
}

export interface PromptPack {
    id: string;
    seriesId: string;
    name: string;
    category: PromptCategory;
    createdAt: string | Date;
    updatedAt: string | Date;
}

export type PromptCategory = 'visual' | 'audio' | 'narrative' | 'general';

export interface Prompt {
    id: string;
    promptPackId: string;
    type: string;
    name: string;
    content: string;
    variables: string;
    createdAt: string | Date;
    updatedAt: string | Date;
}

// ============================================
// Extended Types (with Relations)
// ============================================

export interface SeriesWithRelations extends Series {
    worldBible: WorldBible | null;
    productionEpisodes: ProductionEpisodeWithRelations[];
    ideas: Idea[];
    promptPacks: PromptPackWithCounts[];
}

export interface ProductionEpisodeWithRelations extends ProductionEpisode {
    decisionLog: DecisionLog | null;
    episodeAssets: EpisodeAssetWithAsset[];
    _count?: {
        episodeAssets: number;
    };
}

export interface EpisodeAssetWithAsset {
    episodeId: string;
    assetId: string;
    role: string | null;
    orderIndex: number;
    notes: string | null;
    asset: Asset;
}

export interface PromptPackWithCounts extends PromptPack {
    _count?: {
        prompts: number;
    };
}

export interface AssetWithRelations extends Asset {
    assetTags: { tag: Tag }[];
    episodeAssets: {
        episode: {
            id: string;
            seriesId: string | null;
            episodeNumber: number | null;
        };
    }[];
}

// ============================================
// Parsed JSON Types
// ============================================

export interface VisualStyle {
    colorPalette?: string[];
    lightingStyle?: string;
    cameraStyle?: string;
    aspectRatio?: string;
    notes?: string;
}

export interface AudioStyle {
    genre?: string;
    tempo?: string;
    mood?: string;
    instruments?: string[];
    notes?: string;
}

export interface Rules {
    mustInclude?: string[];
    mustAvoid?: string[];
    styleGuidelines?: string[];
}

export interface AIToolUsageEntry {
    used?: boolean;
    purpose?: string;
    output?: string;
    notes?: string;
}

export interface AIToolUsage {
    version?: number;
    summary?: string;
    tools?: Record<string, AIToolUsageEntry>;
    runway?: {
        workflowsUsed?: string[];
        manualEdits?: string;
    };
    suno?: {
        tracksGenerated?: number;
        selectedTrack?: string;
        selectionReason?: string;
    };
}

// ============================================
// Component Props Types
// ============================================

export interface SeriesCardProps {
    series: Series & {
        _count?: {
            productionEpisodes: number;
        };
    };
}

export interface DashboardStats {
    totalSeries: number;
    totalEpisodes: number;
    publishedEpisodes: number;
    totalAssets: number;
}
