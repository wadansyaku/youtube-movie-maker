import React from 'react';
import { useCurrentFrame, useVideoConfig, interpolate, Easing } from 'remotion';
import { TransitionSection as TransitionSectionType } from '../types/video';

interface Props {
    section: TransitionSectionType;
    themeColors?: {
        primary: string;
        secondary: string;
        background: string;
    };
}

export const TransitionSection: React.FC<Props> = ({
    section,
    themeColors = {
        primary: '#8B5CF6',
        secondary: '#EC4899',
        background: '#0F172A',
    },
}) => {
    const frame = useCurrentFrame();
    const { fps } = useVideoConfig();
    const durationInFrames = (section.endSec - section.startSec) * fps;

    const getTransitionStyle = () => {
        switch (section.style) {
            case 'swipe':
                const swipeProgress = interpolate(frame, [0, durationInFrames], [-100, 100], { extrapolateRight: 'clamp' });
                return {
                    transform: `translateX(${swipeProgress}%)`,
                };
            case 'zoom':
                const zoomScale = interpolate(frame, [0, durationInFrames / 2, durationInFrames], [1, 3, 1], { extrapolateRight: 'clamp' });
                return {
                    transform: `scale(${zoomScale})`,
                };
            case 'flash':
                const flashOpacity = interpolate(
                    frame,
                    [0, 5, 10, 15],
                    [0, 1, 1, 0],
                    { extrapolateRight: 'clamp' }
                );
                return {
                    opacity: flashOpacity,
                    background: 'white',
                };
            case 'dramatic':
                const dramaticScale = interpolate(frame, [0, 15, 20], [0.8, 1.1, 1], { extrapolateRight: 'clamp' });
                const dramaticOpacity = interpolate(frame, [0, 10], [0, 1], { extrapolateRight: 'clamp' });
                return {
                    transform: `scale(${dramaticScale})`,
                    opacity: dramaticOpacity,
                };
            default: // fade
                const fadeOpacity = interpolate(
                    frame,
                    [0, 15, durationInFrames - 15, durationInFrames],
                    [0, 1, 1, 0],
                    { extrapolateRight: 'clamp' }
                );
                return { opacity: fadeOpacity };
        }
    };

    const textOpacity = interpolate(
        frame,
        [10, 20],
        [0, 1],
        { extrapolateRight: 'clamp' }
    );

    const textScale = interpolate(
        frame,
        [10, 25],
        [0.8, 1],
        { extrapolateRight: 'clamp', easing: Easing.out(Easing.back(1.5)) }
    );

    return (
        <div
            style={{
                width: '100%',
                height: '100%',
                background: section.style === 'flash' ? 'white' : `radial-gradient(ellipse at center, ${themeColors.primary}40 0%, ${themeColors.background} 70%)`,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
                fontFamily: 'sans-serif',
                position: 'relative',
                overflow: 'hidden',
                ...getTransitionStyle(),
            }}
        >
            {/* 動的な背景エフェクト */}
            {section.style === 'dramatic' && (
                <>
                    <div
                        style={{
                            position: 'absolute',
                            width: '150%',
                            height: '10px',
                            background: `linear-gradient(90deg, transparent, ${themeColors.primary}, transparent)`,
                            top: '30%',
                            transform: `translateX(${interpolate(frame, [0, 30], [-100, 100])}%)`,
                        }}
                    />
                    <div
                        style={{
                            position: 'absolute',
                            width: '150%',
                            height: '10px',
                            background: `linear-gradient(90deg, transparent, ${themeColors.secondary}, transparent)`,
                            top: '70%',
                            transform: `translateX(${interpolate(frame, [0, 30], [100, -100])}%)`,
                        }}
                    />
                </>
            )}

            {/* トランジションテキスト */}
            {section.transitionText && (
                <div
                    style={{
                        opacity: textOpacity,
                        transform: `scale(${textScale})`,
                        fontSize: '64px',
                        fontWeight: '900',
                        color: 'white',
                        textAlign: 'center',
                        textShadow: `0 0 40px ${themeColors.primary}`,
                        zIndex: 10,
                    }}
                >
                    {section.transitionText}
                </div>
            )}
        </div>
    );
};

export default TransitionSection;
