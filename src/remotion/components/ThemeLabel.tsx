import React from 'react';
import { AbsoluteFill } from 'remotion';
import { Theme } from '../styles/theme';

interface ThemeLabelProps {
    label: string;
    fontSize?: number;
    theme?: Theme;
}

export const ThemeLabel: React.FC<ThemeLabelProps> = ({
    label,
    fontSize = 28,
    theme,
}) => {
    return (
        <AbsoluteFill>
            <div
                style={{
                    position: 'absolute',
                    top: 80, // Safe margin from top
                    left: 40,
                    background: theme?.accent || 'rgba(99, 102, 241, 0.9)', // Indigo
                    padding: '10px 20px',
                    borderRadius: 8,
                }}
            >
                <span
                    style={{
                        color: 'white',
                        fontSize,
                        fontWeight: 600,
                        letterSpacing: 1,
                        fontFamily: theme?.font,
                    }}
                >
                    {label}
                </span>
            </div>
        </AbsoluteFill>
    );
};
