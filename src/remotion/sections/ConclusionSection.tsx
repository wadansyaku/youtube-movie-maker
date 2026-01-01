import React from 'react';
import { AbsoluteFill, interpolate, useCurrentFrame } from 'remotion';
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

    const opacity = interpolate(
        frame,
        [startFrame, startFrame + 8, endFrame - 5, endFrame],
        [0, 1, 1, 0],
        { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
    );

    const translateY = interpolate(
        frame,
        [startFrame, startFrame + 12],
        [30, 0],
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
                background: theme?.gradient || 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)',
                opacity,
            }}
        >
            <div
                style={{
                    transform: `translateY(${translateY}px)`,
                    textAlign: 'center',
                    padding: '0 60px',
                }}
            >
                {/* "Answer" badge */}
                <div
                    style={{
                        background: 'rgba(255,255,255,0.3)',
                        padding: '8px 24px',
                        borderRadius: 20,
                        marginBottom: 24,
                        display: 'inline-block',
                    }}
                >
                    <span style={{ color: 'white', fontSize: 28, fontWeight: 600 }}>
                        💡 結論
                    </span>
                </div>

                <p
                    style={{
                        color: 'white',
                        fontSize: 56,
                        fontWeight: 700,
                        textShadow: '3px 3px 6px rgba(0,0,0,0.3)',
                        lineHeight: 1.4,
                        margin: 0,
                        whiteSpace: 'pre-wrap',
                        fontFamily: theme?.font,
                    }}
                >
                    {text}
                </p>
            </div>
        </AbsoluteFill>
    );
};
