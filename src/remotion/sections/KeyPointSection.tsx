import React from 'react';
import { AbsoluteFill, interpolate, useCurrentFrame } from 'remotion';
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

    const opacity = interpolate(
        frame,
        [startFrame, startFrame + 10, endFrame - 8, endFrame],
        [0, 1, 1, 0],
        { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
    );

    if (frame < startFrame || frame > endFrame) {
        return null;
    }

    return (
        <AbsoluteFill
            style={{
                // Use theme background, fall back to dark gradient if undefined
                background: theme?.bg || 'linear-gradient(180deg, #1a1a2e 0%, #16213e 100%)',
                opacity,
            }}
        >
            {/* Point number badge */}
            {pointNumber && (
                <div
                    style={{
                        position: 'absolute',
                        top: 160,
                        left: '50%',
                        transform: 'translateX(-50%)',
                        background: theme?.accent || 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
                        width: 70,
                        height: 70,
                        borderRadius: '50%',
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        boxShadow: '0 4px 10px rgba(0,0,0,0.3)',
                    }}
                >
                    <span style={{ color: 'white', fontSize: 36, fontWeight: 800, fontFamily: theme?.font }}>
                        {pointNumber}
                    </span>
                </div>
            )}

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
