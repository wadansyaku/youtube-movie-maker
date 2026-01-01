import React from 'react';
import { Img, staticFile, interpolate, useCurrentFrame, AbsoluteFill } from 'remotion';
import { Highlight } from '../types/video';

interface FigureOverlayProps {
    imagePath?: string;
    highlight?: Highlight;
    startFrame: number;
    endFrame: number;
}

export const FigureOverlay: React.FC<FigureOverlayProps> = ({
    imagePath,
    highlight,
    startFrame,
    endFrame,
}) => {
    const frame = useCurrentFrame();

    // Calculate safe fade durations based on section length
    const duration = endFrame - startFrame;
    const fadeIn = Math.min(10, Math.floor(duration / 4));
    const fadeOut = Math.min(10, Math.floor(duration / 4));
    const scaleDuration = Math.min(15, Math.floor(duration / 3));

    // Ensure monotonically increasing inputRange
    const fadeInEnd = startFrame + fadeIn;
    const fadeOutStart = Math.max(fadeInEnd, endFrame - fadeOut);

    // Fade and scale animation
    const opacity = interpolate(
        frame,
        [startFrame, fadeInEnd, fadeOutStart, endFrame],
        [0, 1, 1, 0],
        { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
    );

    const scale = interpolate(
        frame,
        [startFrame, startFrame + scaleDuration],
        [0.9, 1],
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
                opacity,
            }}
        >
            {/* Image container */}
            <div
                style={{
                    position: 'relative',
                    transform: `scale(${scale})`,
                    maxWidth: '90%',
                    maxHeight: '60%',
                }}
            >
                {imagePath && (
                    <Img
                        src={staticFile(imagePath)}
                        style={{
                            maxWidth: '100%',
                            maxHeight: 900,
                            borderRadius: 16,
                            boxShadow: '0 20px 60px rgba(0,0,0,0.4)',
                        }}
                    />
                )}

                {/* Highlight label */}
                {highlight && (
                    <div
                        style={{
                            position: 'absolute',
                            left: highlight.x - 80,
                            top: highlight.y - 25,
                            display: 'flex',
                            alignItems: 'center',
                            gap: 8,
                        }}
                    >
                        {/* Arrow indicator */}
                        <div
                            style={{
                                width: 0,
                                height: 0,
                                borderTop: '12px solid transparent',
                                borderBottom: '12px solid transparent',
                                borderLeft: `20px solid ${highlight.color || '#fbbf24'}`,
                            }}
                        />
                        <div
                            style={{
                                background: highlight.color || '#fbbf24',
                                padding: '8px 16px',
                                borderRadius: 8,
                            }}
                        >
                            <span
                                style={{
                                    color: '#000',
                                    fontSize: 24,
                                    fontWeight: 700,
                                }}
                            >
                                {highlight.label}
                            </span>
                        </div>
                    </div>
                )}
            </div>
        </AbsoluteFill>
    );
};
