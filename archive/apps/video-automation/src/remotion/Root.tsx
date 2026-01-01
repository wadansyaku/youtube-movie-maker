import { Composition } from 'remotion';
import { MedicalShorts } from './compositions/MedicalShorts';
import { HelloWorld } from './compositions/HelloWorld';
import { VideoConfig } from './types/video';

// Default props for MedicalShorts - Brain Facts Video
const defaultMedicalShortsProps: VideoConfig = {
    title: '脳の驚きの事実 3選',
    themeLabel: '🧠 脳科学の豆知識',
    themeId: 'medical-dark',
    duration: 55,
    bgm: 'bgm/brain_facts_bgm.wav',
    bgmVolume: 0.25,
    backgroundVideo: 'video/neural_network_bg.mp4',
    sections: [
        {
            type: 'hook',
            startSec: 0,
            endSec: 5,
            onScreenText: 'あなたの脳は\n1日に7万回思考してる\n...って知ってた？',
        },
        {
            type: 'keypoint',
            startSec: 5,
            endSec: 18,
            onScreenText: '① 脳は体重の2%なのに\nエネルギーの20%を消費',
        },
        {
            type: 'keypoint',
            startSec: 18,
            endSec: 32,
            onScreenText: '② 脳の情報処理速度は\n1秒に1000兆回の計算',
        },
        {
            type: 'quiz',
            startSec: 32,
            endSec: 47,
            question: '脳のニューロンは何個？',
            choices: ['1億個', '860億個', '1兆個'],
            answer: '860億個',
        },
        {
            type: 'conclusion',
            startSec: 47,
            endSec: 55,
            onScreenText: '🔔 フォローして\n脳の秘密をもっと知ろう！',
        },
    ],
    disclaimer: '※ 数値は概算です',
};

export const RemotionRoot: React.FC = () => {
    const fps = 30;

    return (
        <>
            {/* Medical Shorts - Main composition for YouTube Shorts */}
            <Composition
                id="MedicalShorts"
                component={MedicalShorts as any}
                durationInFrames={60 * fps}
                fps={fps}
                width={1080}
                height={1920}
                defaultProps={defaultMedicalShortsProps as any}
                calculateMetadata={({ props }) => {
                    const videoProps = props as unknown as VideoConfig;
                    const duration = videoProps.duration || 60;
                    return {
                        durationInFrames: Math.round(duration * fps),
                    };
                }}
            />

            {/* HelloWorld - Sample composition */}
            <Composition
                id="HelloWorld"
                component={HelloWorld as any}
                durationInFrames={150}
                fps={fps}
                width={1920}
                height={1080}
                defaultProps={{
                    titleText: 'Welcome to Video Automation',
                    titleColor: '#ffffff',
                }}
            />
        </>
    );
};
