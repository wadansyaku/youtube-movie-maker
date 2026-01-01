import React from 'react';
import { useCurrentFrame, useVideoConfig, interpolate, Easing } from 'remotion';
import { CountdownSection as CountdownSectionType } from '../types/video';

interface Props {
    section: CountdownSectionType;
    themeColors?: {
        primary: string;
        secondary: string;
        background: string;
    };
}

export const CountdownSection: React.FC<Props> = ({
    section,
    themeColors = {
        primary: '#F59E0B',
        secondary: '#EF4444',
        background: '#0F172A',
    },
}) => {
    const frame = useCurrentFrame();
    const { fps } = useVideoConfig();
    const durationInFrames = (section.endSec - section.startSec) * fps;

    const startNumber = section.startNumber;
    const endNumber = section.endNumber ?? 0;
    const totalNumbers = startNumber - endNumber + 1;
    const framesPerNumber = durationInFrames / totalNumbers;

    const currentIndex = Math.min(
        Math.floor(frame / framesPerNumber),
        totalNumbers - 1
    );
    const currentNumber = startNumber - currentIndex;

    const frameInNumber = frame % framesPerNumber;

    // 数字のアニメーション
    const numberScale = interpolate(
        frameInNumber,
        [0, 8, 12],
        [0, 1.3, 1],
        { extrapolateRight: 'clamp', easing: Easing.out(Easing.back(2)) }
    );

    const numberOpacity = interpolate(
        frameInNumber,
        [0, 5, framesPerNumber - 5, framesPerNumber],
        [0, 1, 1, 0],
        { extrapolateRight: 'clamp' }
    );

    // リングアニメーション
    const ringProgress = interpolate(
        frameInNumber,
        [0, framesPerNumber],
        [0, 1],
        { extrapolateRight: 'clamp' }
    );

    const ringRotation = ringProgress * 360;

    // パルス
    const pulseScale = 1 + Math.sin(frame * 0.3) * 0.05;

    return (
        <div
            style={{
                width: '100%',
                height: '100%',
                background: `radial-gradient(circle at center, ${themeColors.background} 0%, #000 100%)`,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
                fontFamily: 'sans-serif',
                position: 'relative',
                overflow: 'hidden',
            }}
        >
            {/* 背景リング */}
            <div
                style={{
                    position: 'absolute',
                    width: '400px',
                    height: '400px',
                    borderRadius: '50%',
                    border: `8px solid ${themeColors.primary}20`,
                    transform: `scale(${pulseScale})`,
                }}
            />

            {/* プログレスリング */}
            <svg
                width="420"
                height="420"
                style={{
                    position: 'absolute',
                    transform: 'rotate(-90deg)',
                }}
            >
                <circle
                    cx="210"
                    cy="210"
                    r="190"
                    fill="none"
                    stroke={themeColors.primary}
                    strokeWidth="12"
                    strokeDasharray={`${ringProgress * 1194} 1194`}
                    strokeLinecap="round"
                    style={{
                        filter: `drop-shadow(0 0 20px ${themeColors.primary})`,
                    }}
                />
            </svg>

            {/* 数字 */}
            <div
                style={{
                    opacity: numberOpacity,
                    transform: `scale(${numberScale})`,
                    fontSize: '200px',
                    fontWeight: '900',
                    background: `linear-gradient(180deg, white 0%, ${themeColors.primary} 100%)`,
                    backgroundClip: 'text',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    textShadow: `0 0 60px ${themeColors.primary}`,
                    zIndex: 10,
                }}
            >
                {currentNumber}
            </div>

            {/* ラベル */}
            {section.label && (
                <div
                    style={{
                        position: 'absolute',
                        bottom: '150px',
                        fontSize: '36px',
                        fontWeight: '600',
                        color: 'rgba(255, 255, 255, 0.8)',
                        letterSpacing: '0.1em',
                    }}
                >
                    {section.label}
                </div>
            )}

            {/* 放射状のライン */}
            {Array.from({ length: 12 }).map((_, i) => (
                <div
                    key={i}
                    style={{
                        position: 'absolute',
                        width: '3px',
                        height: '40px',
                        background: `linear-gradient(180deg, ${themeColors.primary}60, transparent)`,
                        transform: `rotate(${i * 30 + ringRotation}deg) translateY(-260px)`,
                        transformOrigin: 'center center',
                    }}
                />
            ))}
        </div>
    );
};

export default CountdownSection;
