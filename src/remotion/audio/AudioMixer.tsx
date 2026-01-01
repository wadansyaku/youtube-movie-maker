import React from 'react';
import { Audio, staticFile, useCurrentFrame, interpolate } from 'remotion';

interface AudioMixerProps {
    narrationPath?: string;
    bgmPath?: string;
    bgmVolume?: number;
    duckingEnabled?: boolean;
}

export const AudioMixer: React.FC<AudioMixerProps> = ({
    narrationPath,
    bgmPath,
    bgmVolume = 0.1,
    duckingEnabled = true,
}) => {
    const frame = useCurrentFrame();

    // Simple ducking: reduce BGM when narration is playing
    // In a real implementation, you'd analyze the narration audio
    // For now, we apply a constant low volume for BGM
    const effectiveBgmVolume = duckingEnabled ? bgmVolume * 0.5 : bgmVolume;

    return (
        <>
            {/* Narration audio - full volume */}
            {narrationPath && (
                <Audio
                    src={staticFile(narrationPath)}
                    volume={1}
                />
            )}

            {/* BGM - ducked volume */}
            {bgmPath && (
                <Audio
                    src={staticFile(bgmPath)}
                    volume={effectiveBgmVolume}
                    loop
                />
            )}
        </>
    );
};
