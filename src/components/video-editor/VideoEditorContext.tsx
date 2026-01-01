'use client';

import { createContext, useContext, ReactNode } from 'react';
import { VideoEditorState, VideoEditorActions } from './types';

interface VideoEditorContextValue extends VideoEditorState, VideoEditorActions { }

const VideoEditorContext = createContext<VideoEditorContextValue | null>(null);

export function useVideoEditorContext() {
    const context = useContext(VideoEditorContext);
    if (!context) {
        throw new Error('useVideoEditorContext must be used within a VideoEditorProvider');
    }
    return context;
}

interface VideoEditorProviderProps {
    children: ReactNode;
    value: VideoEditorContextValue;
}

export function VideoEditorProvider({ children, value }: VideoEditorProviderProps) {
    return (
        <VideoEditorContext.Provider value={value}>
            {children}
        </VideoEditorContext.Provider>
    );
}
