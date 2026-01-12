import React from 'react';
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';

import { Theme } from '../styles/theme';

interface CaptionProps {
    text: string;
    startFrame: number;
    endFrame: number;
    fontSize?: number;
    theme?: Theme;
}

export const Caption: React.FC<CaptionProps> = ({
    text,
    startFrame,
    endFrame,
    fontSize = 48,
    theme,
}) => {
    const frame = useCurrentFrame();
    const { fps } = useVideoConfig();

    // Fade in/out animation
    const opacity = interpolate(
        frame,
        [startFrame, startFrame + 5, endFrame - 5, endFrame],
        [0, 1, 1, 0],
        { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
    );

    // Slide up + Fade animation
    const translateY = interpolate(
        frame,
        [startFrame, startFrame + 8],
        [32, 0],
        { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
    );

    const pop = spring({
        frame: frame - startFrame,
        fps,
        config: { damping: 200, stiffness: 140 },
    });

    const scale = interpolate(pop, [0, 1], [0.96, 1]);

    // Only render during active frames
    if (frame < startFrame || frame > endFrame) {
        return null;
    }

    return (
        <AbsoluteFill
            style={{
                justifyContent: 'flex-end',
                alignItems: 'center',
                paddingBottom: 180, // Safe margin for YouTube Shorts
            }}
        >
            <div
                style={{
                    padding: '12px 20px',
                    maxWidth: '88%',
                    opacity,
                    transform: `translateY(${translateY}px) scale(${scale})`,
                    background: 'rgba(8, 12, 20, 0.58)',
                    borderRadius: 18,
                    border: `1px solid ${theme?.accent || 'rgba(255,255,255,0.3)'}`,
                    boxShadow: '0 12px 30px rgba(0,0,0,0.35)',
                }}
            >
                <p
                    style={{
                        color: theme?.text || 'white',
                        fontSize,
                        fontWeight: 900,
                        textAlign: 'center',
                        margin: 0,
                        lineHeight: 1.15,
                        fontFamily: theme?.font || '"Hiragino Kaku Gothic ProN", "Noto Sans JP", sans-serif',
                        letterSpacing: '0.02em',
                        textShadow: theme?.captionShadow,
                        whiteSpace: 'pre-wrap',
                    }}
                >
                    {text}
                </p>
            </div>
        </AbsoluteFill>
    );
};
