import React from 'react';
import { Composition } from 'remotion';
import { MedicalShorts } from './MedicalShorts';
import { defaultTheme } from './styles/theme';

export const RemotionRoot: React.FC = () => {
    return (
        <>
            <Composition
                id="MedicalShorts"
                component={MedicalShorts as any}
                durationInFrames={2040} // 68s * 30fps for monetization
                fps={30}
                width={1080}
                height={1920}
                defaultProps={{
                    title: 'Medical Shorts Demo',
                    themeLabel: 'Cardiology',
                    themeId: 'medical-dark',
                    duration: 15,
                    sections: [
                        { type: 'hook', startSec: 0, endSec: 3, onScreenText: 'Hook' },
                        { type: 'conclusion', startSec: 3, endSec: 5, onScreenText: 'End' }
                    ],
                    disclaimer: 'Demo'
                }}
            />
        </>
    );
};
