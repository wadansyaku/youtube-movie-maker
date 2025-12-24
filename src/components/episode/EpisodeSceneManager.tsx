"use client";

import { useState } from "react";
import UnifiedSceneHierarchy from "@/components/common/UnifiedSceneHierarchy";

interface Shot {
    id: string;
    name: string;
    description: string | null;
    durationSeconds: number | null;
    cameraMovement: string | null;
    orderIndex: number;
}

interface Scene {
    id: string;
    name: string;
    description: string | null;
    durationSeconds: number | null;
    orderIndex: number;
    shots: Shot[];
}

interface EpisodeSceneManagerProps {
    episodeId: string;
    initialScenes: Scene[];
}

export default function EpisodeSceneManager({
    episodeId,
    initialScenes,
}: EpisodeSceneManagerProps) {
    const [scenes, setScenes] = useState<Scene[]>(initialScenes);

    return (
        <UnifiedSceneHierarchy
            ownerId={episodeId}
            mode="episode"
            scenes={scenes}
            onScenesChange={setScenes}
        />
    );
}
