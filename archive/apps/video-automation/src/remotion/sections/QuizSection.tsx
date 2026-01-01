import React from 'react';
import { AbsoluteFill, interpolate, useCurrentFrame, Sequence, Audio, staticFile, spring, useVideoConfig } from 'remotion';
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

    // Show answer in final 2 seconds
    const answerRevealFrame = endFrame - 60; // 2s at 30fps
    const showAnswer = frame >= answerRevealFrame;

    // Countdown timer: 3 seconds before answer reveal
    const countdownStart = answerRevealFrame - 90; // 3s countdown
    const countdownProgress = (frame - countdownStart) / fps;
    const showCountdown = frame >= countdownStart && frame < answerRevealFrame;
    const countdownNumber = Math.max(1, 3 - Math.floor(countdownProgress));

    // Countdown pulse animation
    const countdownPulse = showCountdown ?
        1 + (1 - (countdownProgress % 1)) * 0.3 : 1;

    if (frame < startFrame || frame > endFrame) {
        return null;
    }

    return (
        <AbsoluteFill
            style={{
                background: 'transparent', // Let background video show
                justifyContent: 'center',
                alignItems: 'center',
                opacity,
            }}
        >
            {/* Dark overlay for readability */}
            <AbsoluteFill
                style={{
                    background: 'rgba(0, 0, 0, 0.5)',
                }}
            />

            <div
                style={{
                    textAlign: 'center',
                    padding: '0 40px',
                    maxWidth: '100%',
                    zIndex: 1,
                }}
            >
                {/* Quiz badge */}
                <div
                    style={{
                        background: 'linear-gradient(135deg, #ff6b6b 0%, #feca57 100%)',
                        padding: '16px 40px',
                        borderRadius: 30,
                        marginBottom: 30,
                        display: 'inline-block',
                        boxShadow: '0 8px 30px rgba(255, 107, 107, 0.4)',
                        border: '2px solid rgba(255,255,255,0.3)',
                    }}
                >
                    <span style={{
                        color: 'white',
                        fontSize: 36,
                        fontWeight: 800,
                        fontFamily: theme?.font,
                        letterSpacing: '0.05em',
                    }}>
                        🧠 クイズ
                    </span>
                </div>

                {/* Question with background box */}
                <div
                    style={{
                        background: 'rgba(0, 0, 0, 0.6)',
                        backdropFilter: 'blur(10px)',
                        borderRadius: 24,
                        padding: '30px 40px',
                        marginBottom: 30,
                        border: '2px solid rgba(255,255,255,0.15)',
                    }}
                >
                    <p
                        style={{
                            color: 'white',
                            fontSize: 44,
                            fontWeight: 700,
                            marginBottom: 0,
                            lineHeight: 1.4,
                            textShadow: '0 2px 8px rgba(0,0,0,0.5)',
                            whiteSpace: 'pre-wrap',
                            margin: 0,
                        }}
                    >
                        {question}
                    </p>
                </div>

                {/* Countdown Timer */}
                {showCountdown && (
                    <div
                        style={{
                            marginBottom: 20,
                            transform: `scale(${countdownPulse})`,
                        }}
                    >
                        <div
                            style={{
                                background: 'linear-gradient(135deg, #ff0000 0%, #ff6b6b 100%)',
                                width: 100,
                                height: 100,
                                borderRadius: '50%',
                                display: 'inline-flex',
                                justifyContent: 'center',
                                alignItems: 'center',
                                boxShadow: '0 0 40px rgba(255, 0, 0, 0.5)',
                                border: '4px solid white',
                            }}
                        >
                            <span
                                style={{
                                    color: 'white',
                                    fontSize: 56,
                                    fontWeight: 900,
                                }}
                            >
                                {countdownNumber}
                            </span>
                        </div>
                        <p style={{
                            color: 'white',
                            fontSize: 24,
                            marginTop: 10,
                            fontWeight: 600,
                        }}>
                            考えてね！
                        </p>
                    </div>
                )}

                {/* Choices */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    {choices.map((choice, index) => {
                        const isCorrect = choice.startsWith(answer);
                        const choiceSpring = spring({
                            frame: frame - startFrame - 15 - index * 5,
                            fps,
                            config: {
                                damping: 15,
                                stiffness: 150,
                                mass: 0.5,
                            },
                        });

                        const choiceOpacity = interpolate(choiceSpring, [0, 1], [0, 1]);
                        const choiceX = interpolate(choiceSpring, [0, 1], [-50, 0]);

                        return (
                            <div
                                key={index}
                                style={{
                                    background: showAnswer && isCorrect
                                        ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
                                        : 'rgba(255,255,255,0.2)',
                                    padding: '20px 40px',
                                    borderRadius: 16,
                                    opacity: choiceOpacity,
                                    transform: `translateX(${choiceX}px) scale(${showAnswer && isCorrect ? 1.05 : 1})`,
                                    border: showAnswer && isCorrect
                                        ? '3px solid #10b981'
                                        : '3px solid transparent',
                                    boxShadow: showAnswer && isCorrect
                                        ? '0 0 30px rgba(16, 185, 129, 0.5)'
                                        : 'none',
                                    backdropFilter: 'blur(5px)',
                                }}
                            >
                                <span
                                    style={{
                                        color: 'white',
                                        fontSize: 36,
                                        fontWeight: 600,
                                    }}
                                >
                                    {['A', 'B', 'C'][index]}. {choice}
                                </span>
                            </div>
                        );
                    })}
                </div>

                {/* Answer reveal */}
                {showAnswer && (
                    <div
                        style={{
                            marginTop: 30,
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
                        <div
                            style={{
                                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                                padding: '16px 40px',
                                borderRadius: 30,
                                display: 'inline-block',
                                boxShadow: '0 8px 30px rgba(16, 185, 129, 0.4)',
                            }}
                        >
                            <span style={{ color: 'white', fontSize: 32, fontWeight: 700 }}>
                                ✅ 正解は {answer}！
                            </span>
                        </div>
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
