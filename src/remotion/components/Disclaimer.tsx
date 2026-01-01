import React from 'react';
import { AbsoluteFill } from 'remotion';
import { Theme } from '../styles/theme';

interface DisclaimerProps {
    text: string;
    fontSize?: number;
    theme?: Theme;
}

export const Disclaimer: React.FC<DisclaimerProps> = ({
    text,
    fontSize = 16,
    theme,
}) => {
    return (
        <AbsoluteFill>
            <div
                style={{
                    position: 'absolute',
                    bottom: 60,
                    right: 40,
                    maxWidth: 300,
                }}
            >
                <span
                    style={{
                        color: theme?.text ? `${theme.text}99` : 'rgba(255, 255, 255, 0.6)',
                        fontSize,
                        lineHeight: 1.3,
                        fontFamily: theme?.font,
                    }}
                >
                    {text}
                </span>
            </div>
        </AbsoluteFill>
    );
};
