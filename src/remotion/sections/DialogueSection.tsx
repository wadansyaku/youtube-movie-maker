/* eslint-disable @next/next/no-img-element */
import React from 'react';
import { useCurrentFrame, useVideoConfig, interpolate, Easing } from 'remotion';
import { DialogueSection as DialogueSectionType, Character } from '../types/video';

interface Props {
    section: DialogueSectionType;
    characters?: Character[];
    themeColors?: {
        primary: string;
        secondary: string;
        background: string;
        fontFamily?: string;
    };
}

export const DialogueSection: React.FC<Props> = ({
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
    const durationInFrames = (section.endSec - section.startSec) * fps;

    const dialogueCount = section.dialogues.length;
    const framesPerDialogue = durationInFrames / dialogueCount;

    const getCharacter = (characterId: string): Character => {
        return characters.find(c => c.id === characterId) || {
            id: characterId,
            name: characterId,
            color: themeColors.primary,
        };
    };

    const getEmotionEmoji = (emotion?: string) => {
        switch (emotion) {
            case 'happy': return '😊';
            case 'surprised': return '😮';
            case 'thinking': return '🤔';
            case 'excited': return '🤩';
            default: return '';
        }
    };

    return (
        <div
            style={{
                width: '100%',
                height: '100%',
                background: `linear-gradient(180deg, ${themeColors.background} 0%, #1E1B4B 100%)`,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
                padding: '60px 40px',
                fontFamily: themeColors.fontFamily || '"Hiragino Kaku Gothic ProN", "Noto Sans JP", sans-serif',
            }}
        >
            {/* 対話バブル */}
            <div
                style={{
                    width: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '20px',
                }}
            >
                {section.dialogues.map((dialogue, index) => {
                    const startFrame = index * framesPerDialogue;
                    const endFrame = (index + 1) * framesPerDialogue;
                    const isActive = frame >= startFrame && frame < endFrame;
                    const hasAppeared = frame >= startFrame;

                    const character = getCharacter(dialogue.characterId);
                    const isLeft = index % 2 === 0;

                    const slideProgress = interpolate(
                        frame,
                        [startFrame, startFrame + 10],
                        [0, 1],
                        { extrapolateRight: 'clamp', easing: Easing.out(Easing.cubic) }
                    );

                    const opacity = interpolate(
                        frame,
                        [startFrame, startFrame + 8],
                        [0, 1],
                        { extrapolateRight: 'clamp' }
                    );

                    const scale = isActive ? 1.02 : 1;
                    const translateX = isLeft
                        ? interpolate(slideProgress, [0, 1], [-50, 0])
                        : interpolate(slideProgress, [0, 1], [50, 0]);

                    if (!hasAppeared) return null;

                    return (
                        <div
                            key={index}
                            style={{
                                display: 'flex',
                                flexDirection: isLeft ? 'row' : 'row-reverse',
                                alignItems: 'flex-end',
                                gap: '16px',
                                opacity,
                                transform: `translateX(${translateX}px) scale(${scale})`,
                                transition: 'transform 0.2s',
                            }}
                        >
                            {/* アバター */}
                            <div
                                style={{
                                    width: '120px',
                                    height: '120px',
                                    borderRadius: '50%',
                                    background: `linear-gradient(135deg, ${character.color || themeColors.primary}, ${themeColors.secondary})`,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontSize: '48px',
                                    color: 'white',
                                    fontWeight: 'bold',
                                    boxShadow: isActive ? `0 0 30px ${character.color || themeColors.primary}` : 'none',
                                    border: '4px solid white',
                                    flexShrink: 0,
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
                            </div>

                            {/* 吹き出し */}
                            <div
                                style={{
                                    flex: 1,
                                    background: isLeft
                                        ? 'linear-gradient(135deg, rgba(139, 92, 246, 0.3), rgba(139, 92, 246, 0.1))'
                                        : 'linear-gradient(135deg, rgba(6, 182, 212, 0.3), rgba(6, 182, 212, 0.1))',
                                    borderRadius: '24px',
                                    padding: '24px 32px',
                                    position: 'relative',
                                    border: `2px solid ${isLeft ? 'rgba(139, 92, 246, 0.5)' : 'rgba(6, 182, 212, 0.5)'}`,
                                    backdropFilter: 'blur(10px)',
                                }}
                            >
                                {/* 名前 */}
                                <div
                                    style={{
                                        fontSize: '24px',
                                        fontWeight: 'bold',
                                        color: isLeft ? '#A78BFA' : '#22D3EE',
                                        marginBottom: '8px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '8px',
                                    }}
                                >
                                    {character.name}
                                    {dialogue.emotion && (
                                        <span style={{ fontSize: '28px' }}>
                                            {getEmotionEmoji(dialogue.emotion)}
                                        </span>
                                    )}
                                </div>

                                {/* セリフ */}
                                <div
                                    style={{
                                        fontSize: '36px',
                                        fontWeight: '600',
                                        color: 'white',
                                        lineHeight: 1.4,
                                        whiteSpace: 'pre-wrap',
                                        wordBreak: 'break-word',
                                    }}
                                >
                                    {dialogue.text}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default DialogueSection;
