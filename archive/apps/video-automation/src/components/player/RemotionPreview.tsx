'use client';

import { Player } from '@remotion/player';
import { useState, useMemo } from 'react';
import { MedicalShorts } from '@/remotion/compositions/MedicalShorts';
import { HelloWorld } from '@/remotion/compositions/HelloWorld';
import { VideoConfig } from '@/remotion/types/video';

interface RemotionPreviewProps {
    compositionId: 'MedicalShorts' | 'HelloWorld';
    props?: Record<string, unknown>;
    className?: string;
}

// Updated to use the brain facts video content
const defaultMedicalShortsProps: VideoConfig = {
    title: '脳の驚きの事実 3選',
    themeLabel: '🧠 脳科学の豆知識',
    themeId: 'medical-dark',
    duration: 55,
    bgm: 'bgm/brain_facts_bgm.wav',
    bgmVolume: 0.25,
    backgroundVideo: 'video/neural_network_bg.mp4',
    sections: [
        {
            type: 'hook',
            startSec: 0,
            endSec: 5,
            onScreenText: 'あなたの脳は\n1日に7万回思考してる\n...って知ってた？',
        },
        {
            type: 'keypoint',
            startSec: 5,
            endSec: 18,
            onScreenText: '① 脳は体重の2%なのに\nエネルギーの20%を消費',
        },
        {
            type: 'keypoint',
            startSec: 18,
            endSec: 32,
            onScreenText: '② 脳の情報処理速度は\n1秒に1000兆回の計算',
        },
        {
            type: 'quiz',
            startSec: 32,
            endSec: 47,
            question: '脳のニューロンは何個？',
            choices: ['1億個', '860億個', '1兆個'],
            answer: '860億個',
        },
        {
            type: 'conclusion',
            startSec: 47,
            endSec: 55,
            onScreenText: '🔔 フォローして\n脳の秘密をもっと知ろう！',
        },
    ],
    disclaimer: '※ 数値は概算です',
};

const defaultHelloWorldProps = {
    titleText: 'Welcome to Video Automation',
    titleColor: '#ffffff',
};

export function RemotionPreview({
    compositionId,
    props,
    className = '',
}: RemotionPreviewProps) {
    const [isPlaying, setIsPlaying] = useState(false);

    const { component, defaultProps, width, height, fps, durationInFrames } = useMemo(() => {
        if (compositionId === 'MedicalShorts') {
            const videoProps = (props as VideoConfig) || defaultMedicalShortsProps;
            const duration = videoProps.duration || 60;
            return {
                component: MedicalShorts,
                defaultProps: videoProps,
                width: 1080,
                height: 1920,
                fps: 30,
                durationInFrames: Math.round(duration * 30),
            };
        } else {
            return {
                component: HelloWorld,
                defaultProps: props || defaultHelloWorldProps,
                width: 1920,
                height: 1080,
                fps: 30,
                durationInFrames: 150,
            };
        }
    }, [compositionId, props]);

    return (
        <div className={`relative ${className}`}>
            <div className="rounded-xl overflow-hidden border border-[var(--border)] bg-black">
                <Player
                    component={component as any}
                    inputProps={defaultProps as any}
                    durationInFrames={durationInFrames}
                    compositionWidth={width}
                    compositionHeight={height}
                    fps={fps}
                    style={{
                        width: '100%',
                        aspectRatio: `${width}/${height}`,
                    }}
                    controls
                    autoPlay={isPlaying}
                    loop
                />
            </div>
            <div className="mt-4 flex items-center justify-between">
                <div className="text-sm text-[var(--muted)]">
                    {compositionId} • {width}x{height} • {fps}fps • {Math.round(durationInFrames / fps)}秒
                </div>
            </div>
        </div>
    );
}
