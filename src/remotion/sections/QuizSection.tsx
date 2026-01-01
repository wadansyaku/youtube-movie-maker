import React from 'react';
import { AbsoluteFill, interpolate, useCurrentFrame, Sequence, Audio, staticFile } from 'remotion';

import { Theme } from '../styles/theme';

interface QuizSectionProps {
    question: string;
    choices: string[];
    answer: string;
    answerSoundEffect?: string;
    startFrame: number;
    endFrame: number;
    theme?: Theme;
}

export const QuizSection: React.FC<QuizSectionProps> = ({
    question,
    choices,
    answer,
    answerSoundEffect,
    startFrame,
    endFrame,
    theme,
}) => {
    const frame = useCurrentFrame();

    const opacity = interpolate(
        frame,
        [startFrame, startFrame + 10, endFrame - 8, endFrame],
        [0, 1, 1, 0],
        { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
    );

    // Show answer in final 2 seconds
    const answerRevealFrame = endFrame - 60; // 2s at 30fps
    const showAnswer = frame >= answerRevealFrame;

    if (frame < startFrame || frame > endFrame) {
        return null;
    }

    return (
        <AbsoluteFill
            style={{
                // Quiz should stand out, maybe use subAccent or just theme.bg with style
                background: theme?.bg || 'linear-gradient(135deg, #ff9a56 0%, #ff6b6b 100%)',
                justifyContent: 'center',
                alignItems: 'center',
                opacity,
            }}
        >
            <div
                style={{
                    textAlign: 'center',
                    padding: '0 50px',
                    maxWidth: '100%',
                }}
            >
                {/* Quiz badge */}
                <div
                    style={{
                        background: theme?.subAccent || 'rgba(255,255,255,0.3)',
                        padding: '12px 32px',
                        borderRadius: 30,
                        marginBottom: 40,
                        display: 'inline-block',
                    }}
                >
                    <span style={{ color: 'white', fontSize: 32, fontWeight: 700, fontFamily: theme?.font }}>
                        🧠 クイズ
                    </span>
                </div>

                {/* Question */}
                <p
                    style={{
                        color: 'white',
                        fontSize: 48,
                        fontWeight: 700,
                        marginBottom: 50,
                        lineHeight: 1.4,
                        textShadow: '2px 2px 4px rgba(0,0,0,0.2)',
                        whiteSpace: 'pre-wrap',
                    }}
                >
                    {question}
                </p>

                {/* Choices */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                    {choices.map((choice, index) => {
                        const isCorrect = choice === answer;
                        const choiceOpacity = interpolate(
                            frame,
                            [startFrame + 15 + index * 8, startFrame + 20 + index * 8],
                            [0, 1],
                            { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
                        );

                        return (
                            <div
                                key={index}
                                style={{
                                    background: showAnswer && isCorrect
                                        ? 'rgba(16, 185, 129, 0.9)'
                                        : 'rgba(255,255,255,0.25)',
                                    padding: '20px 40px',
                                    borderRadius: 16,
                                    opacity: choiceOpacity,
                                    border: showAnswer && isCorrect
                                        ? '4px solid #10b981'
                                        : '4px solid transparent',
                                    transition: 'all 0.3s',
                                }}
                            >
                                <span
                                    style={{
                                        color: 'white',
                                        fontSize: 40,
                                        fontWeight: 600,
                                    }}
                                >
                                    {choice}
                                </span>
                            </div>
                        );
                    })}
                </div>

                {/* Answer reveal */}
                {showAnswer && (
                    <div
                        style={{
                            marginTop: 40,
                            opacity: interpolate(
                                frame,
                                [answerRevealFrame, answerRevealFrame + 10],
                                [0, 1],
                                { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
                            ),
                            transform: `scale(${interpolate(
                                frame,
                                [answerRevealFrame, answerRevealFrame + 10, answerRevealFrame + 20],
                                [0.5, 1.1, 1],
                                { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
                            )})`,
                        }}
                    >
                        <span style={{ color: 'white', fontSize: 36, fontWeight: 600 }}>
                            ✅ 正解は {answer}！
                        </span>
                    </div>
                )}

                {answerSoundEffect && (
                    <Sequence from={answerRevealFrame}>
                        <Audio src={staticFile(answerSoundEffect)} />
                    </Sequence>
                )}
            </div>
        </AbsoluteFill>
    );
};
