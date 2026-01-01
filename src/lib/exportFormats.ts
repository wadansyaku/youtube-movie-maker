// External Export Formats for Video Editing Software
// Supports FCP XML, EDL, and CapCut package export

export interface TimelineClip {
    id: string;
    name: string;
    startTime: number;     // in seconds
    endTime: number;       // in seconds
    sourceFile?: string;
    type: 'video' | 'audio' | 'image' | 'title';
}

export interface Timeline {
    name: string;
    duration: number;      // in seconds
    frameRate: number;
    clips: TimelineClip[];
}

/**
 * Generate Final Cut Pro X XML
 */
export function generateFCPXML(timeline: Timeline): string {
    const { name, duration, frameRate, clips } = timeline;
    const frameDuration = `${Math.round(1000 / frameRate)}/1000s`;

    const clipElements = clips.map((clip, index) => {
        const startFrame = Math.round(clip.startTime * frameRate);
        const endFrame = Math.round(clip.endTime * frameRate);
        const clipDuration = endFrame - startFrame;

        return `
        <asset-clip ref="r${index + 2}" offset="${startFrame}/${frameRate}s" 
            name="${escapeXml(clip.name)}" 
            duration="${clipDuration}/${frameRate}s" 
            tcFormat="NDF">
        </asset-clip>`;
    }).join('\n');

    const assetElements = clips.map((clip, index) => {
        const duration = Math.round((clip.endTime - clip.startTime) * frameRate);
        return `
    <asset id="r${index + 2}" name="${escapeXml(clip.name)}" 
        duration="${duration}/${frameRate}s" 
        hasVideo="1" hasAudio="1">
        ${clip.sourceFile ? `<media-rep src="file://${escapeXml(clip.sourceFile)}"/>` : ''}
    </asset>`;
    }).join('\n');

    return `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE fcpxml>
<fcpxml version="1.9">
    <resources>
        <format id="r1" name="FFVideoFormat${Math.round(frameRate)}p" 
            frameDuration="${frameDuration}" 
            width="1920" height="1080"/>
        ${assetElements}
    </resources>
    <library>
        <event name="${escapeXml(name)}">
            <project name="${escapeXml(name)}">
                <sequence format="r1" tcStart="0s" tcFormat="NDF" 
                    audioLayout="stereo" audioRate="48k">
                    <spine>
                        ${clipElements}
                    </spine>
                </sequence>
            </project>
        </event>
    </library>
</fcpxml>`;
}

/**
 * Generate EDL (Edit Decision List) - CMX 3600 format
 */
export function generateEDL(timeline: Timeline): string {
    const { name, clips } = timeline;
    const lines: string[] = [
        `TITLE: ${name}`,
        `FCM: NON-DROP FRAME`,
        ``
    ];

    clips.forEach((clip, index) => {
        const eventNum = String(index + 1).padStart(3, '0');
        const sourceIn = formatTimecode(clip.startTime, timeline.frameRate);
        const sourceOut = formatTimecode(clip.endTime, timeline.frameRate);
        const recordIn = formatTimecode(clip.startTime, timeline.frameRate);
        const recordOut = formatTimecode(clip.endTime, timeline.frameRate);

        lines.push(`${eventNum}  AX       V     C        ${sourceIn} ${sourceOut} ${recordIn} ${recordOut}`);
        lines.push(`* FROM CLIP NAME: ${clip.name}`);
        if (clip.sourceFile) {
            lines.push(`* SOURCE FILE: ${clip.sourceFile}`);
        }
        lines.push(``);
    });

    return lines.join('\n');
}

/**
 * Generate CapCut Draft JSON structure
 */
export function generateCapCutDraft(timeline: Timeline): object {
    const { name, duration, clips } = timeline;
    const microsecondsPerSecond = 1000000;

    const tracks = clips.map((clip, index) => ({
        id: `track_${index}`,
        segments: [{
            id: clip.id,
            material_id: `material_${index}`,
            target_timerange: {
                start: Math.round(clip.startTime * microsecondsPerSecond),
                duration: Math.round((clip.endTime - clip.startTime) * microsecondsPerSecond)
            },
            source_timerange: {
                start: 0,
                duration: Math.round((clip.endTime - clip.startTime) * microsecondsPerSecond)
            }
        }]
    }));

    const materials = clips.map((clip, index) => ({
        id: `material_${index}`,
        type: clip.type === 'video' ? 'video' : clip.type === 'audio' ? 'audio' : 'photo',
        name: clip.name,
        path: clip.sourceFile || ''
    }));

    return {
        name,
        canvas: {
            width: 1920,
            height: 1080,
            ratio: "16:9"
        },
        duration: Math.round(duration * microsecondsPerSecond),
        tracks,
        materials,
        version: "3.0.0",
        last_modified_platform: {
            app_id: "youtube-movie-maker",
            os: "web"
        }
    };
}

/**
 * Generate CapCut package (ZIP file structure info)
 */
export function getCapCutPackageStructure(timeline: Timeline): {
    draftFilename: string;
    draftContent: string;
    mediaFiles: string[];
} {
    const draft = generateCapCutDraft(timeline);
    const mediaFiles = timeline.clips
        .filter(clip => clip.sourceFile)
        .map(clip => clip.sourceFile!);

    return {
        draftFilename: 'draft_content.json',
        draftContent: JSON.stringify(draft, null, 2),
        mediaFiles
    };
}

// Helper functions
function escapeXml(str: string): string {
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;');
}

function formatTimecode(seconds: number, frameRate: number): string {
    const totalFrames = Math.round(seconds * frameRate);
    const hours = Math.floor(totalFrames / (frameRate * 3600));
    const minutes = Math.floor((totalFrames % (frameRate * 3600)) / (frameRate * 60));
    const secs = Math.floor((totalFrames % (frameRate * 60)) / frameRate);
    const frames = totalFrames % frameRate;

    return [hours, minutes, secs, frames]
        .map(n => String(n).padStart(2, '0'))
        .join(':');
}

// Export format types
export type ExportFormat = 'fcpxml' | 'edl' | 'capcut';

export const EXPORT_FORMATS: { key: ExportFormat; label: string; ext: string; description: string }[] = [
    { key: 'fcpxml', label: 'Final Cut Pro XML', ext: '.fcpxml', description: 'Final Cut Pro X/11 プロジェクト' },
    { key: 'edl', label: 'EDL (CMX 3600)', ext: '.edl', description: 'Adobe Premiere, DaVinci Resolve等' },
    { key: 'capcut', label: 'CapCut Draft', ext: '.json', description: 'CapCut/剪映 ドラフト' },
];

/**
 * Export timeline to specified format
 */
export function exportTimeline(timeline: Timeline, format: ExportFormat): { content: string; filename: string; mimeType: string } {
    const safeName = timeline.name.replace(/[^a-zA-Z0-9_\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]/g, '_');

    switch (format) {
        case 'fcpxml':
            return {
                content: generateFCPXML(timeline),
                filename: `${safeName}.fcpxml`,
                mimeType: 'application/xml'
            };
        case 'edl':
            return {
                content: generateEDL(timeline),
                filename: `${safeName}.edl`,
                mimeType: 'text/plain'
            };
        case 'capcut':
            return {
                content: JSON.stringify(generateCapCutDraft(timeline), null, 2),
                filename: `${safeName}_draft.json`,
                mimeType: 'application/json'
            };
    }
}
