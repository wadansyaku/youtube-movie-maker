import React from 'react';
import { Img, Video, staticFile, AbsoluteFill } from 'remotion';

interface AvatarProps {
    avatarPath?: string;
    position?: 'bottom-right' | 'bottom-left' | 'center';
    size?: number;
}

export const Avatar: React.FC<AvatarProps> = ({
    avatarPath,
    position = 'bottom-right',
    size = 200,
}) => {
    if (!avatarPath) return null;

    const isVideo = avatarPath.endsWith('.mp4') || avatarPath.endsWith('.webm');

    const positionStyles: Record<string, React.CSSProperties> = {
        'bottom-right': {
            bottom: 220,
            right: 40,
        },
        'bottom-left': {
            bottom: 220,
            left: 40,
        },
        'center': {
            top: '30%',
            left: '50%',
            transform: 'translateX(-50%)',
        },
    };

    return (
        <AbsoluteFill>
            <div
                style={{
                    position: 'absolute',
                    ...positionStyles[position],
                    width: size,
                    height: size,
                    borderRadius: '50%',
                    overflow: 'hidden',
                    border: '4px solid rgba(255,255,255,0.8)',
                    boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
                }}
            >
                {isVideo ? (
                    <Video
                        src={staticFile(avatarPath)}
                        style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover',
                        }}
                    />
                ) : (
                    <Img
                        src={staticFile(avatarPath)}
                        style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover',
                        }}
                    />
                )}
            </div>
        </AbsoluteFill>
    );
};
