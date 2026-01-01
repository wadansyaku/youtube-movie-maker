import React from 'react';
import { AbsoluteFill, interpolate, useCurrentFrame, spring, useVideoConfig } from 'remotion';
import { Theme } from '../styles/theme';

interface ConclusionSectionProps {
    text: string;
    startFrame: number;
    endFrame: number;
    theme?: Theme;
}

export const ConclusionSection: React.FC<ConclusionSectionProps> = ({
    text,
    startFrame,
    endFrame,
    theme,
}) => {
    const frame = useCurrentFrame();
    const { fps } = useVideoConfig();

    // Calculate safe fade durations based on section length
    const duration = endFrame - startFrame;
    const fadeIn = Math.min(8, Math.floor(duration / 4));
    const fadeOut = Math.min(5, Math.floor(duration / 4));

    // Ensure monotonically increasing inputRange
    const fadeInEnd = startFrame + fadeIn;
    const fadeOutStart = Math.max(fadeInEnd, endFrame - fadeOut);

    const opacity = interpolate(
        frame,
        [startFrame, fadeInEnd, fadeOutStart, endFrame],
        [0, 1, 1, 0],
        { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
    );

    // Spring animation for entrance
    const springIn = spring({
        frame: frame - startFrame,
        fps,
        config: {
            damping: 12,
            stiffness: 100,
            mass: 0.5,
        },
    });

    const translateY = interpolate(springIn, [0, 1], [60, 0]);
    const scale = interpolate(springIn, [0, 1], [0.8, 1]);

    // Subscribe button pulse animation
    const pulseTime = (frame - startFrame) / fps;
    const buttonPulse = 1 + Math.sin(pulseTime * 4) * 0.05;

    // Bell icon shake animation
    const bellShake = Math.sin(pulseTime * 15) * 5;

    if (frame < startFrame || frame > endFrame) {
        return null;
    }

    return (
        <AbsoluteFill
            style={{
                justifyContent: 'center',
                alignItems: 'center',
                background: 'transparent', // Let background video show
                opacity,
            }}
        >
            {/* Semi-transparent overlay for readability */}
            <AbsoluteFill
                style={{
                    background: 'linear-gradient(180deg, rgba(0,0,0,0.3) 0%, rgba(0,0,0,0.7) 100%)',
                }}
            />

            <div
                style={{
                    transform: `translateY(${translateY}px) scale(${scale})`,
                    textAlign: 'center',
                    padding: '0 50px',
                    zIndex: 1,
                }}
            >
                {/* CTA Badge */}
                <div
                    style={{
                        background: 'linear-gradient(135deg, #ff0000 0%, #cc0000 100%)',
                        padding: '16px 40px',
                        borderRadius: 30,
                        marginBottom: 30,
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 12,
                        transform: `scale(${buttonPulse})`,
                        boxShadow: '0 8px 30px rgba(255, 0, 0, 0.4), 0 0 60px rgba(255, 0, 0, 0.2)',
                        border: '2px solid rgba(255,255,255,0.3)',
                    }}
                >
                    <span
                        style={{
                            fontSize: 36,
                            transform: `rotate(${bellShake}deg)`,
                            display: 'inline-block',
                        }}
                    >
                        🔔
                    </span>
                    <span style={{
                        color: 'white',
                        fontSize: 32,
                        fontWeight: 800,
                        letterSpacing: '0.05em',
                    }}>
                        チャンネル登録
                    </span>
                </div>

                {/* Main CTA text with background box */}
                <div
                    style={{
                        background: 'rgba(0, 0, 0, 0.6)',
                        backdropFilter: 'blur(10px)',
                        borderRadius: 24,
                        padding: '30px 50px',
                        border: '2px solid rgba(255,255,255,0.15)',
                        boxShadow: '0 10px 40px rgba(0,0,0,0.5)',
                    }}
                >
                    <p
                        style={{
                            color: 'white',
                            fontSize: 52,
                            fontWeight: 700,
                            textShadow: '0 4px 12px rgba(0,0,0,0.5)',
                            lineHeight: 1.4,
                            margin: 0,
                            whiteSpace: 'pre-wrap',
                            fontFamily: theme?.font,
                        }}
                    >
                        {text}
                    </p>
                </div>

                {/* Arrow pointing up animation */}
                <div
                    style={{
                        marginTop: 30,
                        transform: `translateY(${Math.sin(pulseTime * 3) * 10}px)`,
                    }}
                >
                    <span style={{ fontSize: 48, opacity: 0.8 }}>👆</span>
                </div>
            </div>
        </AbsoluteFill>
    );
};
