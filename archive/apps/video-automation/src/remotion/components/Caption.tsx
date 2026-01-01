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

    // Calculate safe fade durations based on section length
    const duration = endFrame - startFrame;
    const fadeDuration = Math.min(5, Math.floor(duration / 4));
    const slideDuration = Math.min(8, Math.floor(duration / 3));

    // Ensure monotonically increasing inputRange
    const fadeInEnd = startFrame + fadeDuration;
    const fadeOutStart = Math.max(fadeInEnd, endFrame - fadeDuration);

    // Fade in/out animation
    const opacity = interpolate(
        frame,
        [startFrame, fadeInEnd, fadeOutStart, endFrame],
        [0, 1, 1, 0],
        { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
    );

    // Slide up + Fade animation
    const translateY = interpolate(
        frame,
        [startFrame, startFrame + slideDuration],
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
