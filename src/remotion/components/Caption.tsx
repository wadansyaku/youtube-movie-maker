import React from 'react';
import { AbsoluteFill, interpolate, useCurrentFrame } from 'remotion';

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
        [20, 0],
        { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
    );

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
                    // Removed background box for cleaner look
                    padding: '8px 16px',
                    maxWidth: '94%',
                    opacity,
                    transform: `translateY(${translateY}px)`,
                }}
            >
                <p
                    style={{
                        color: theme?.text || 'white',
                        fontSize,
                        fontWeight: 900,
                        textAlign: 'center',
                        margin: 0,
                        lineHeight: 1.2,
                        fontFamily: theme?.font || '"Hiragino Kaku Gothic ProN", "Noto Sans JP", sans-serif',
                        // Strong outline + shadow from theme
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
