import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import fs from 'fs';

const execAsync = promisify(exec);

export interface RenderOptions {
    compositionId: string;
    outputPath: string;
    propsPath?: string;
    props?: Record<string, unknown>;
    width?: number;
    height?: number;
    fps?: number;
    concurrency?: number;
}

export interface RenderProgress {
    percent: number;
    frame: number;
    totalFrames: number;
    status: 'rendering' | 'encoding' | 'completed' | 'failed';
    error?: string;
}

export interface RenderResult {
    success: boolean;
    outputPath?: string;
    duration?: number;
    error?: string;
}

const OUTPUT_DIR = path.join(process.cwd(), 'out', 'renders');
const PROPS_DIR = path.join(process.cwd(), 'out', 'props');

function ensureDir(dirPath: string) {
    if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
    }
}

/**
 * Render a Remotion composition to video
 */
export async function renderVideo(options: RenderOptions): Promise<RenderResult> {
    const {
        compositionId,
        outputPath,
        propsPath,
        props,
        concurrency = 1,
    } = options;

    ensureDir(OUTPUT_DIR);
    ensureDir(PROPS_DIR);

    const finalOutputPath = outputPath.startsWith('/')
        ? outputPath
        : path.join(OUTPUT_DIR, outputPath);

    let propsArg = '';

    if (props) {
        // Write props to temp file
        const propsFile = path.join(PROPS_DIR, `props-${Date.now()}.json`);
        fs.writeFileSync(propsFile, JSON.stringify(props, null, 2));
        propsArg = `--props="${propsFile}"`;
    } else if (propsPath) {
        propsArg = `--props="${propsPath}"`;
    }

    const cmd = [
        'npx remotion render',
        compositionId,
        `"${finalOutputPath}"`,
        propsArg,
        `--concurrency=${concurrency}`,
        '--log=info',
    ].filter(Boolean).join(' ');

    const startTime = Date.now();

    try {
        console.log(`[RenderEngine] Starting render: ${cmd}`);
        const { stdout, stderr } = await execAsync(cmd, {
            cwd: process.cwd(),
            timeout: 600000, // 10 minutes timeout
        });

        console.log('[RenderEngine] Render output:', stdout);
        if (stderr) {
            console.warn('[RenderEngine] Render stderr:', stderr);
        }

        const duration = (Date.now() - startTime) / 1000;

        return {
            success: true,
            outputPath: finalOutputPath,
            duration,
        };
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.error('[RenderEngine] Render failed:', errorMessage);

        return {
            success: false,
            error: errorMessage,
            duration: (Date.now() - startTime) / 1000,
        };
    }
}

/**
 * Get list of available compositions
 */
export function getAvailableCompositions(): string[] {
    return ['MedicalShorts', 'HelloWorld'];
}

/**
 * Validate render options
 */
export function validateRenderOptions(options: Partial<RenderOptions>): string[] {
    const errors: string[] = [];

    if (!options.compositionId) {
        errors.push('compositionId is required');
    } else if (!getAvailableCompositions().includes(options.compositionId)) {
        errors.push(`Unknown composition: ${options.compositionId}`);
    }

    if (!options.outputPath) {
        errors.push('outputPath is required');
    }

    return errors;
}
