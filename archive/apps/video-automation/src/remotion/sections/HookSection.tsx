import React from 'react';
import { AbsoluteFill, interpolate, useCurrentFrame, spring, useVideoConfig } from 'remotion';
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

    // Dramatic zoom-in with spring bounce effect
    const zoomSpring = spring({
        frame: frame - startFrame,
        fps,
        config: {
            damping: 12,
            stiffness: 100,
            mass: 0.8,
        },
    });

    // Start from 1.5x zoom and spring down to 1x for dramatic entrance
    const scale = interpolate(zoomSpring, [0, 1], [1.5, 1]);

    // Subtle pulse animation for engagement
    const pulsePhase = (frame - startFrame) / fps;
    const pulse = 1 + Math.sin(pulsePhase * 3) * 0.02;

    // Text entrance: slide up with scale
    const textY = interpolate(
        frame,
        [startFrame, startFrame + 15],
        [50, 0],
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
                    transform: `scale(${scale * pulse}) translateY(${textY}px)`,
                    textAlign: 'center',
                    padding: '0 50px',
                }}
            >
                {/* Background box for better readability */}
                <div
                    style={{
                        background: 'rgba(0, 0, 0, 0.5)',
                        borderRadius: 20,
                        padding: '30px 40px',
                        backdropFilter: 'blur(10px)',
                        border: '2px solid rgba(255, 255, 255, 0.2)',
                    }}
                >
                    <span
                        style={{
                            color: 'white',
                            fontSize: 68,
                            fontWeight: 900,
                            textShadow: `
                                0 0 20px rgba(255,255,255,0.5),
                                0 4px 8px rgba(0,0,0,0.8),
                                0 8px 16px rgba(0,0,0,0.5)
                            `,
                            lineHeight: 1.3,
                            fontFamily: theme?.font,
                            letterSpacing: '-0.02em',
                            whiteSpace: 'pre-wrap',
                        }}
                    >
                        {text}
                    </span>
                </div>
            </div>
        </AbsoluteFill>
    );
};
