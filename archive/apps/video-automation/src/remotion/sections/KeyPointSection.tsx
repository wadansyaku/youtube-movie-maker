import React from 'react';
import { AbsoluteFill, interpolate, useCurrentFrame, spring, useVideoConfig } from 'remotion';
import { FigureOverlay } from '../components/FigureOverlay';
import { Highlight } from '../types/video';
import { Theme } from '../styles/theme';

interface KeyPointSectionProps {
    text: string;
    image?: string;
    highlight?: Highlight;
    startFrame: number;
    endFrame: number;
    pointNumber?: number;
    theme?: Theme;
}

export const KeyPointSection: React.FC<KeyPointSectionProps> = ({
    text,
    image,
    highlight,
    startFrame,
    endFrame,
    pointNumber,
    theme,
}) => {
    const frame = useCurrentFrame();
    const { fps } = useVideoConfig();

    // Calculate safe fade durations based on section length
    const duration = endFrame - startFrame;
    const fadeIn = Math.min(10, Math.floor(duration / 4));
    const fadeOut = Math.min(8, Math.floor(duration / 4));

    // Ensure monotonically increasing inputRange
    const fadeInEnd = startFrame + fadeIn;
    const fadeOutStart = Math.max(fadeInEnd, endFrame - fadeOut);

    const opacity = interpolate(
        frame,
        [startFrame, fadeInEnd, fadeOutStart, endFrame],
        [0, 1, 1, 0],
        { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
    );

    // Slide-in animation for content
    const slideIn = spring({
        frame: frame - startFrame,
        fps,
        config: {
            damping: 15,
            stiffness: 120,
            mass: 0.5,
        },
    });

    const translateX = interpolate(slideIn, [0, 1], [-100, 0]);

    // Badge pop animation
    const badgePop = spring({
        frame: frame - startFrame - 5,
        fps,
        config: {
            damping: 10,
            stiffness: 200,
            mass: 0.3,
        },
    });

    const badgeScale = interpolate(badgePop, [0, 1], [0, 1]);

    if (frame < startFrame || frame > endFrame) {
        return null;
    }

    return (
        <AbsoluteFill
            style={{
                background: 'transparent', // Let background video show through
                opacity,
            }}
        >
            {/* Point number badge with pop animation */}
            {pointNumber && (
                <div
                    style={{
                        position: 'absolute',
                        top: 200,
                        left: '50%',
                        transform: `translateX(-50%) scale(${badgeScale})`,
                        background: `linear-gradient(135deg, ${theme?.accent || '#f093fb'} 0%, ${theme?.subAccent || '#f5576c'} 100%)`,
                        width: 90,
                        height: 90,
                        borderRadius: '50%',
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        boxShadow: '0 8px 20px rgba(0,0,0,0.4), 0 0 30px rgba(255,255,255,0.2)',
                        border: '3px solid rgba(255,255,255,0.3)',
                    }}
                >
                    <span style={{
                        color: 'white',
                        fontSize: 48,
                        fontWeight: 900,
                        fontFamily: theme?.font,
                        textShadow: '0 2px 4px rgba(0,0,0,0.3)',
                    }}>
                        {pointNumber}
                    </span>
                </div>
            )}

            {/* Text content with slide-in animation and background box */}
            <div
                style={{
                    position: 'absolute',
                    top: pointNumber ? 320 : 200,
                    left: 0,
                    right: 0,
                    display: 'flex',
                    justifyContent: 'center',
                    transform: `translateX(${translateX}px)`,
                }}
            >
                <div
                    style={{
                        background: 'rgba(0, 0, 0, 0.6)',
                        backdropFilter: 'blur(10px)',
                        borderRadius: 24,
                        padding: '30px 50px',
                        margin: '0 40px',
                        border: '2px solid rgba(255,255,255,0.15)',
                        boxShadow: '0 10px 40px rgba(0,0,0,0.5)',
                    }}
                >
                    <p
                        style={{
                            color: 'white',
                            fontSize: 52,
                            fontWeight: 700,
                            lineHeight: 1.4,
                            textAlign: 'center',
                            textShadow: '0 2px 8px rgba(0,0,0,0.5)',
                            whiteSpace: 'pre-wrap',
                            margin: 0,
                        }}
                    >
                        {text}
                    </p>
                </div>
            </div>

            {/* Figure with highlight */}
            <FigureOverlay
                imagePath={image}
                highlight={highlight}
                startFrame={startFrame}
                endFrame={endFrame}
            />
        </AbsoluteFill>
    );
};
