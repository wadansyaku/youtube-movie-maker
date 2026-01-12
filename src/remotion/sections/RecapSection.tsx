import React from 'react';
import { AbsoluteFill, interpolate, useCurrentFrame } from 'remotion';

import { Theme } from '../styles/theme';

interface RecapSectionProps {
    text: string;
    points?: string[];
    startFrame: number;
    endFrame: number;
    theme?: Theme;
}

export const RecapSection: React.FC<RecapSectionProps> = ({
    text,
    points = [],
    startFrame,
    endFrame,
    theme,
}) => {
    const frame = useCurrentFrame();

    const opacity = interpolate(
        frame,
        [startFrame, startFrame + 10, endFrame - 5, endFrame],
        [0, 1, 1, 0],
        { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
    );

    const scale = interpolate(
        frame,
        [startFrame, startFrame + 15],
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
                        fontWeight: 800,
                        lineHeight: 1.35,
                        textShadow: theme?.captionShadow || '3px 3px 6px rgba(0,0,0,0.3)',
                        whiteSpace: 'pre-wrap',
                        margin: 0,
                        fontFamily: theme?.font,
                    }}
                >
                    {text}
                </p>

                {points.length > 0 && (
                    <div
                        style={{
                            marginTop: 32,
                            display: 'grid',
                            gap: 16,
                        }}
                    >
                        {points.slice(0, 3).map((point, index) => (
                            <div
                                key={`${point}-${index}`}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 16,
                                    padding: '12px 20px',
                                    borderRadius: 16,
                                    background: 'rgba(0,0,0,0.35)',
                                    border: `1px solid ${theme?.accent || 'rgba(255,255,255,0.25)'}`,
                                }}
                            >
                                <div
                                    style={{
                                        width: 36,
                                        height: 36,
                                        borderRadius: 12,
                                        background: theme?.accent || '#4facfe',
                                        color: 'white',
                                        fontWeight: 800,
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        fontFamily: theme?.font,
                                    }}
                                >
                                    {index + 1}
                                </div>
                                <span
                                    style={{
                                        color: 'white',
                                        fontSize: 34,
                                        fontWeight: 600,
                                        fontFamily: theme?.font,
                                        textAlign: 'left',
                                        flex: 1,
                                        whiteSpace: 'pre-wrap',
                                    }}
                                >
                                    {point}
                                </span>
                            </div>
                        ))}
                    </div>
                )}

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
