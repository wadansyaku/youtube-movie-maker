import React from 'react';
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
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
    const { fps } = useVideoConfig();

    const opacity = interpolate(
        frame,
        [startFrame, startFrame + 8, endFrame - 5, endFrame],
        [0, 1, 1, 0],
        { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
    );

    const pop = spring({
        frame: frame - startFrame,
        fps,
        config: { damping: 180, stiffness: 140 },
    });

    const scale = interpolate(pop, [0, 1], [0.92, 1]);
    const translateY = interpolate(
        frame,
        [startFrame, startFrame + 12],
        [24, 0],
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
                    position: 'absolute',
                    inset: 0,
                    background: `
                        radial-gradient(circle at 20% 20%, rgba(255,255,255,0.2), transparent 45%),
                        radial-gradient(circle at 80% 80%, rgba(0,0,0,0.35), transparent 55%)
                    `,
                    mixBlendMode: 'screen',
                }}
            />
            <div
                style={{
                    transform: `translateY(${translateY}px) scale(${scale})`,
                    textAlign: 'center',
                    padding: '0 70px',
                }}
            >
                <span
                    style={{
                        color: 'white',
                        fontSize: 78,
                        fontWeight: 900,
                        textShadow: theme?.captionShadow || '4px 4px 12px rgba(0,0,0,0.45)',
                        lineHeight: 1.15,
                        fontFamily: theme?.font,
                        whiteSpace: 'pre-wrap',
                        wordBreak: 'break-word',
                        letterSpacing: '0.02em',
                    }}
                >
                    {text}
                </span>
            </div>
        </AbsoluteFill>
    );
};
