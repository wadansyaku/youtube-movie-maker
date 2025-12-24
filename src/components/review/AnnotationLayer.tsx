"use client";

import { useState, useRef, useEffect } from "react";
import { MessageSquarePlus } from "lucide-react";

interface AnnotationLayerProps {
    assetId: string;
    onAddAnnotation: (x: number, y: number, time: number) => void;
    currentTime: number; // For video players
    width: number;
    height: number;
}

export default function AnnotationLayer({ onAddAnnotation, currentTime, width, height }: AnnotationLayerProps) {
    const layerRef = useRef<HTMLDivElement>(null);
    const [isDrawing, setIsDrawing] = useState(false);

    const handleClick = (e: React.MouseEvent) => {
        if (!layerRef.current) return;
        const rect = layerRef.current.getBoundingClientRect();
        const x = (e.clientX - rect.left) / rect.width * 100; // Percentage
        const y = (e.clientY - rect.top) / rect.height * 100; // Percentage

        onAddAnnotation(x, y, currentTime);
    };

    return (
        <div
            ref={layerRef}
            className="absolute inset-0 z-20 cursor-crosshair"
            onClick={handleClick}
        >
            {/* Visual feedback for hover/click could go here */}
            <div className="absolute top-2 right-2 bg-black/50 text-white text-[10px] px-2 py-1 rounded pointer-events-none">
                Click to annotate
            </div>
        </div>
    );
}
