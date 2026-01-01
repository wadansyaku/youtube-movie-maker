import React from 'react';
import { AbsoluteFill, Sequence, useVideoConfig, Audio, staticFile } from 'remotion';
import { VideoConfig, Section } from './types/video';
import { Caption } from './components/Caption';
import { ThemeLabel } from './components/ThemeLabel';
import { Disclaimer } from './components/Disclaimer';
import { Avatar } from './components/Avatar';
// 基本セクション
import { HookSection } from './sections/HookSection';
import { ConclusionSection } from './sections/ConclusionSection';
import { KeyPointSection } from './sections/KeyPointSection';
import { QuizSection } from './sections/QuizSection';
import { RecapSection } from './sections/RecapSection';
// 新規セクション
import { DialogueSection } from './sections/DialogueSection';
import { TitleSection } from './sections/TitleSection';
import { FactSection } from './sections/FactSection';
import { StorySection } from './sections/StorySection';
import { CharacterSection } from './sections/CharacterSection';
import { ComparisonSection } from './sections/ComparisonSection';
import { TransitionSection } from './sections/TransitionSection';
import { CountdownSection } from './sections/CountdownSection';
import { RevealSection } from './sections/RevealSection';
import { themes, defaultTheme } from './styles/theme';
import { AudioMixer } from './audio/AudioMixer';

export const MedicalShorts: React.FC<VideoConfig> = (props) => {
    const videoConfig = props;
    const currentTheme = videoConfig.themeId ? themes[videoConfig.themeId] || defaultTheme : defaultTheme;

    const { fps } = useVideoConfig();

    // テーマカラーを抽出
    const themeColors = {
        primary: currentTheme.accent,
        secondary: currentTheme.subAccent,
        background: currentTheme.bg,
    };

    // Helper to convert seconds to frames
    const secToFrame = (sec: number) => Math.round(sec * fps);

    // Track keypoint index for numbering
    let keypointIndex = 0;

    const renderSection = (section: Section, index: number) => {
        const startFrame = secToFrame(section.startSec);
        const endFrame = secToFrame(section.endSec);
        const durationInFrames = endFrame - startFrame;

        const content = (() => {
            switch (section.type) {
                case 'hook':
                    return (
                        <HookSection
                            text={section.onScreenText}
                            theme={currentTheme}
                            startFrame={startFrame}
                            endFrame={endFrame}
                        />
                    );

                case 'conclusion':
                    return (
                        <ConclusionSection
                            text={section.onScreenText}
                            theme={currentTheme}
                            startFrame={startFrame}
                            endFrame={endFrame}
                        />
                    );

                case 'keypoint':
                    keypointIndex++;
                    return (
                        <>
                            <KeyPointSection
                                text={section.onScreenText}
                                image={section.image}
                                highlight={section.highlight}
                                theme={currentTheme}
                                startFrame={startFrame}
                                endFrame={endFrame}
                                pointNumber={section.pointNumber || keypointIndex}
                            />
                            <Caption
                                text={section.onScreenText}
                                theme={currentTheme}
                                startFrame={startFrame}
                                endFrame={endFrame}
                            />
                        </>
                    );

                case 'quiz':
                    return (
                        <QuizSection
                            question={section.question}
                            choices={section.choices}
                            answer={section.answer}
                            answerSoundEffect={section.answerSoundEffect}
                            theme={currentTheme}
                            startFrame={startFrame}
                            endFrame={endFrame}
                        />
                    );

                case 'recap':
                    return (
                        <RecapSection
                            text={section.onScreenText}
                            theme={currentTheme}
                            startFrame={startFrame}
                            endFrame={endFrame}
                        />
                    );

                // === 新規セクション ===

                case 'dialogue':
                    return (
                        <Sequence from={startFrame} durationInFrames={durationInFrames}>
                            <DialogueSection
                                section={section}
                                characters={videoConfig.characters}
                                themeColors={themeColors}
                            />
                        </Sequence>
                    );

                case 'title':
                    return (
                        <Sequence from={startFrame} durationInFrames={durationInFrames}>
                            <TitleSection
                                section={section}
                                themeColors={themeColors}
                            />
                        </Sequence>
                    );

                case 'fact':
                    return (
                        <Sequence from={startFrame} durationInFrames={durationInFrames}>
                            <FactSection
                                section={section}
                                themeColors={themeColors}
                            />
                        </Sequence>
                    );

                case 'story':
                    return (
                        <Sequence from={startFrame} durationInFrames={durationInFrames}>
                            <StorySection
                                section={section}
                                themeColors={themeColors}
                            />
                        </Sequence>
                    );

                case 'character':
                    return (
                        <Sequence from={startFrame} durationInFrames={durationInFrames}>
                            <CharacterSection
                                section={section}
                                characters={videoConfig.characters}
                                themeColors={themeColors}
                            />
                        </Sequence>
                    );

                case 'comparison':
                    return (
                        <Sequence from={startFrame} durationInFrames={durationInFrames}>
                            <ComparisonSection
                                section={section}
                                themeColors={themeColors}
                            />
                        </Sequence>
                    );

                case 'transition':
                    return (
                        <Sequence from={startFrame} durationInFrames={durationInFrames}>
                            <TransitionSection
                                section={section}
                                themeColors={themeColors}
                            />
                        </Sequence>
                    );

                case 'countdown':
                    return (
                        <Sequence from={startFrame} durationInFrames={durationInFrames}>
                            <CountdownSection
                                section={section}
                                themeColors={themeColors}
                            />
                        </Sequence>
                    );

                case 'reveal':
                    return (
                        <Sequence from={startFrame} durationInFrames={durationInFrames}>
                            <RevealSection
                                section={section}
                                themeColors={themeColors}
                            />
                        </Sequence>
                    );

                default:
                    console.warn(`Unknown section type: ${(section as any).type}`);
                    return null;
            }
        })();

        return (
            <React.Fragment key={index}>
                {content}
                {/* Play section sound effect if provided */}
                {section.soundEffect && (
                    <Sequence from={startFrame}>
                        <Audio src={staticFile(section.soundEffect)} />
                    </Sequence>
                )}
            </React.Fragment>
        );
    };

    return (
        <AbsoluteFill style={{ backgroundColor: currentTheme.bg, fontFamily: currentTheme.font }}>
            {/* Render all sections */}
            {videoConfig.sections.map((section, index) => renderSection(section, index))}

            {/* Theme label - always visible */}
            <ThemeLabel label={videoConfig.themeLabel} theme={currentTheme} />

            {/* Avatar - if provided */}
            {videoConfig.avatar && (
                <Avatar avatarPath={videoConfig.avatar} position="bottom-right" />
            )}

            {/* Disclaimer - always visible */}
            {videoConfig.disclaimer && (
                <Disclaimer text={videoConfig.disclaimer} theme={currentTheme} />
            )}

            {/* Audio mixer */}
            <AudioMixer
                narrationPath={videoConfig.narration}
                bgmPath={videoConfig.bgm}
                bgmVolume={videoConfig.bgmVolume || 0.1}
            />
        </AbsoluteFill>
    );
};
