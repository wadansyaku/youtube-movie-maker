import React from 'react';
import { AbsoluteFill, interpolate, useCurrentFrame } from 'remotion';
import { Theme } from '../styles/theme';

interface HookSectionProps {
    text: string;
    startFrame: number;
    endFrame: number;
    theme?: Theme;
}

export const HookSection: React.FC<HookSectionProps> = ({
    text,
    startFrame,
    endFrame,
    theme,
}) => {
    const frame = useCurrentFrame();

    const opacity = interpolate(
        frame,
        [startFrame, startFrame + 8, endFrame - 5, endFrame],
        [0, 1, 1, 0],
        { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
    );

    const scale = interpolate(
        frame,
        [startFrame, startFrame + 10],
        [0.8, 1],
        { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
    );

    if (frame < startFrame || frame > endFrame) {
        return null;
    }

    return (
        <AbsoluteFill
            style={{
                justifyContent: 'center',
                alignItems: 'center',
                background: theme?.gradient || 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                opacity,
            }}
        >
            <div
                style={{
                    transform: `scale(${scale})`,
                    textAlign: 'center',
                    padding: '0 60px',
                }}
            >
                <span
                    style={{
                        color: 'white',
                        fontSize: 72,
                        fontWeight: 800,
                        textShadow: '4px 4px 8px rgba(0,0,0,0.3)',
                        lineHeight: 1.3,
                        fontFamily: theme?.font,
                    }}
                >
                    {text}
                </span>
            </div>
        </AbsoluteFill>
    );
};
