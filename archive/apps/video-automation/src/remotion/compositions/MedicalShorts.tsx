import React from 'react';
import { AbsoluteFill, Sequence, useVideoConfig, Audio, Video, staticFile } from 'remotion';
import { VideoConfig, Section } from '../types/video';
import { Caption } from '../components/Caption';
import { ThemeLabel } from '../components/ThemeLabel';
import { Disclaimer } from '../components/Disclaimer';
import { Avatar } from '../components/Avatar';
import { HookSection } from '../sections/HookSection';
import { ConclusionSection } from '../sections/ConclusionSection';
import { KeyPointSection } from '../sections/KeyPointSection';
import { QuizSection } from '../sections/QuizSection';
import { RecapSection } from '../sections/RecapSection';
import { themes, defaultTheme } from '../styles/theme';

export const MedicalShorts: React.FC<VideoConfig> = (props) => {
    const videoConfig = props;
    const currentTheme = videoConfig.themeId ? themes[videoConfig.themeId] || defaultTheme : defaultTheme;

    const { fps } = useVideoConfig();

    // Helper to convert seconds to frames
    const secToFrame = (sec: number) => Math.round(sec * fps);

    // Track keypoint index for numbering
    let keypointIndex = 0;

    const renderSection = (section: Section, index: number) => {
        const startFrame = secToFrame(section.startSec);
        const endFrame = secToFrame(section.endSec);

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
                                pointNumber={keypointIndex}
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

                default:
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
            {/* Background Video - if provided */}
            {videoConfig.backgroundVideo && (
                <AbsoluteFill>
                    <Video
                        src={staticFile(videoConfig.backgroundVideo)}
                        style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover',
                        }}
                        loop
                        muted
                    />
                    {/* Dark overlay for better text readability */}
                    <AbsoluteFill
                        style={{
                            backgroundColor: 'rgba(0, 0, 0, 0.4)',
                        }}
                    />
                </AbsoluteFill>
            )}

            {/* Background Music - loops throughout the video */}
            {videoConfig.bgm && (
                <Audio
                    src={staticFile(videoConfig.bgm)}
                    volume={videoConfig.bgmVolume ?? 0.3}
                    loop
                />
            )}

            {/* Render all sections sorted by startSec */}
            {[...videoConfig.sections]
                .sort((a, b) => a.startSec - b.startSec)
                .map((section, index) => renderSection(section, index))}

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
        </AbsoluteFill>
    );
};
