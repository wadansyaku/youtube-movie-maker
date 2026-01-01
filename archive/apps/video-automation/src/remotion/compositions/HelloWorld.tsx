import React from 'react';
import { AbsoluteFill, interpolate, useCurrentFrame, Sequence } from 'remotion';

export interface HelloWorldProps {
    titleText: string;
    titleColor?: string;
}

export const HelloWorld: React.FC<HelloWorldProps> = ({
    titleText,
    titleColor = '#ffffff',
}) => {
    const frame = useCurrentFrame();

    const opacity = interpolate(frame, [0, 30], [0, 1], {
        extrapolateRight: 'clamp',
    });

    const scale = interpolate(frame, [0, 30], [0.8, 1], {
        extrapolateRight: 'clamp',
    });

    return (
        <AbsoluteFill
            style={{
                background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
            }}
        >
            <Sequence from={0}>
                <div
                    style={{
                        opacity,
                        transform: `scale(${scale})`,
                        textAlign: 'center',
                    }}
                >
                    <h1
                        style={{
                            fontSize: 80,
                            fontWeight: 'bold',
                            color: titleColor,
                            textShadow: '0 4px 20px rgba(0,0,0,0.5)',
                            fontFamily: 'system-ui, -apple-system, sans-serif',
                        }}
                    >
                        {titleText}
                    </h1>
                    <p
                        style={{
                            fontSize: 32,
                            color: 'rgba(255,255,255,0.7)',
                            marginTop: 20,
                        }}
                    >
                        Video Automation Studio
                    </p>
                </div>
            </Sequence>
        </AbsoluteFill>
    );
};
