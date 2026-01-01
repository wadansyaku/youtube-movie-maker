import React from 'react';
import { useCurrentFrame, useVideoConfig, interpolate, Easing } from 'remotion';
import { CharacterSection as CharacterSectionType, Character } from '../types/video';

interface Props {
    section: CharacterSectionType;
    characters?: Character[];
    themeColors?: {
        primary: string;
        secondary: string;
        background: string;
    };
}

export const CharacterSection: React.FC<Props> = ({
    section,
    characters = [],
    themeColors = {
        primary: '#8B5CF6',
        secondary: '#06B6D4',
        background: '#0F172A',
    },
}) => {
    const frame = useCurrentFrame();
    const { fps } = useVideoConfig();

    const character = characters.find(c => c.id === section.characterId) || {
        id: section.characterId,
        name: section.characterId,
        color: themeColors.primary,
    };

    // アニメーション
    const avatarScale = interpolate(
        frame,
        [0, 15, 20],
        [0, 1.1, 1],
        { extrapolateRight: 'clamp', easing: Easing.out(Easing.back(1.5)) }
    );

    const avatarOpacity = interpolate(
        frame,
        [0, 10],
        [0, 1],
        { extrapolateRight: 'clamp' }
    );

    const textOpacity = interpolate(
        frame,
        [15, 30],
        [0, 1],
        { extrapolateRight: 'clamp' }
    );

    const textY = interpolate(
        frame,
        [15, 30],
        [30, 0],
        { extrapolateRight: 'clamp', easing: Easing.out(Easing.cubic) }
    );

    // ポーズに応じたエモジ
    const getPoseEmoji = () => {
        switch (section.pose) {
            case 'wave': return '👋';
            case 'think': return '🤔';
            case 'point': return '👉';
            default: return '😊';
        }
    };

    // パルスエフェクト
    const pulseScale = 1 + Math.sin(frame * 0.1) * 0.03;

    return (
        <div
            style={{
                width: '100%',
                height: '100%',
                background: `radial-gradient(ellipse at center, ${themeColors.background} 0%, #000 100%)`,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
                fontFamily: 'sans-serif',
                position: 'relative',
                overflow: 'hidden',
            }}
        >
            {/* 背景グロー */}
            <div
                style={{
                    position: 'absolute',
                    width: '500px',
                    height: '500px',
                    borderRadius: '50%',
                    background: `radial-gradient(circle, ${character.color || themeColors.primary}40 0%, transparent 70%)`,
                    transform: `scale(${pulseScale})`,
                }}
            />

            {/* 装飾リング */}
            <div
                style={{
                    position: 'absolute',
                    width: '350px',
                    height: '350px',
                    borderRadius: '50%',
                    border: `3px solid ${character.color || themeColors.primary}30`,
                    opacity: avatarOpacity,
                }}
            />
            <div
                style={{
                    position: 'absolute',
                    width: '400px',
                    height: '400px',
                    borderRadius: '50%',
                    border: `2px dashed ${character.color || themeColors.primary}20`,
                    opacity: avatarOpacity,
                    transform: `rotate(${frame}deg)`,
                }}
            />

            {/* キャラクターアバター */}
            <div
                style={{
                    opacity: avatarOpacity,
                    transform: `scale(${avatarScale})`,
                    width: '200px',
                    height: '200px',
                    borderRadius: '50%',
                    background: `linear-gradient(135deg, ${character.color || themeColors.primary}, ${themeColors.secondary})`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '80px',
                    color: 'white',
                    fontWeight: 'bold',
                    boxShadow: `0 0 60px ${character.color || themeColors.primary}60`,
                    border: '6px solid white',
                    position: 'relative',
                    zIndex: 10,
                }}
            >
                {character.avatar ? (
                    <img
                        src={character.avatar}
                        alt={character.name}
                        style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }}
                    />
                ) : (
                    character.name.charAt(0)
                )}

                {/* ポーズエモジ */}
                <div
                    style={{
                        position: 'absolute',
                        bottom: '-10px',
                        right: '-10px',
                        fontSize: '48px',
                        filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.3))',
                    }}
                >
                    {getPoseEmoji()}
                </div>
            </div>

            {/* キャラクター名 */}
            <div
                style={{
                    opacity: textOpacity,
                    transform: `translateY(${textY}px)`,
                    marginTop: '30px',
                    fontSize: '48px',
                    fontWeight: '900',
                    background: `linear-gradient(135deg, white 0%, ${character.color || themeColors.primary} 100%)`,
                    backgroundClip: 'text',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    textShadow: `0 0 40px ${character.color || themeColors.primary}40`,
                    zIndex: 10,
                }}
            >
                {character.name}
            </div>

            {/* 紹介テキスト */}
            <div
                style={{
                    opacity: textOpacity,
                    transform: `translateY(${textY}px)`,
                    marginTop: '16px',
                    fontSize: '32px',
                    color: 'rgba(255, 255, 255, 0.8)',
                    textAlign: 'center',
                    maxWidth: '800px',
                    zIndex: 10,
                }}
            >
                {section.introText}
            </div>
        </div>
    );
};

export default CharacterSection;
