import React from 'react';
import { AbsoluteFill, interpolate, useCurrentFrame } from 'remotion';

import { Theme } from '../styles/theme';

interface RecapSectionProps {
    text: string;
    startFrame: number;
    endFrame: number;
    theme?: Theme;
}

export const RecapSection: React.FC<RecapSectionProps> = ({
    text,
    startFrame,
    endFrame,
    theme,
}) => {
    const frame = useCurrentFrame();

    // Calculate safe fade durations based on section length
    const duration = endFrame - startFrame;
    const fadeIn = Math.min(10, Math.floor(duration / 4));
    const fadeOut = Math.min(5, Math.floor(duration / 4));
    const scaleDuration = Math.min(15, Math.floor(duration / 3));

    // Ensure monotonically increasing inputRange
    const fadeInEnd = startFrame + fadeIn;
    const fadeOutStart = Math.max(fadeInEnd, endFrame - fadeOut);

    const opacity = interpolate(
        frame,
        [startFrame, fadeInEnd, fadeOutStart, endFrame],
        [0, 1, 1, 0],
        { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
    );

    const scale = interpolate(
        frame,
        [startFrame, startFrame + scaleDuration],
        [0.95, 1],
        { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
    );

    // Pulsing effect for CTA
    const pulse = interpolate(
        frame % 30,
        [0, 15, 30],
        [1, 1.05, 1],
        { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
    );

    if (frame < startFrame || frame > endFrame) {
        return null;
    }

    return (
        <AbsoluteFill
            style={{
                background: theme?.gradient || 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
                justifyContent: 'center',
                alignItems: 'center',
                opacity,
            }}
        >
            <div
                style={{
                    transform: `scale(${scale})`,
                    textAlign: 'center',
                    padding: '0 50px',
                }}
            >
                {/* Recap badge */}
                <div
                    style={{
                        background: 'rgba(255,255,255,0.3)',
                        padding: '12px 32px',
                        borderRadius: 30,
                        marginBottom: 40,
                        display: 'inline-block',
                    }}
                >
                    <span style={{ color: 'white', fontSize: 32, fontWeight: 700, fontFamily: theme?.font }}>
                        📝 まとめ
                    </span>
                </div>

                {/* Main text */}
                <p
                    style={{
                        color: 'white',
                        fontSize: 52,
                        fontWeight: 700,
                        lineHeight: 1.5,
                        textShadow: '3px 3px 6px rgba(0,0,0,0.2)',
                        whiteSpace: 'pre-wrap',
                        margin: 0,
                        fontFamily: theme?.font,
                    }}
                >
                    {text}
                </p>

                {/* CTA Button */}
                <div
                    style={{
                        marginTop: 60,
                        transform: `scale(${pulse})`,
                    }}
                >
                    <div
                        style={{
                            background: 'white',
                            padding: '20px 50px',
                            borderRadius: 50,
                            display: 'inline-block',
                            boxShadow: '0 10px 30px rgba(0,0,0,0.2)',
                        }}
                    >
                        <span
                            style={{
                                color: theme?.accent || '#4facfe',
                                fontSize: 32,
                                fontWeight: 700,
                                fontFamily: theme?.font,
                            }}
                        >
                            👆 フォローで医学知識UP
                        </span>
                    </div>
                </div>
            </div>
        </AbsoluteFill>
    );
};
