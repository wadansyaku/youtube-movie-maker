// Job Queue System for Background Processing

export type JobStatus = 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
export type JobType = 'video_generation' | 'slide_rendering' | 'transcription' | 'export' | 'ai_improvement';

export interface Job {
    id: string;
    type: JobType;
    status: JobStatus;
    progress: number;
    title: string;
    description?: string;
    createdAt: Date;
    startedAt?: Date;
    completedAt?: Date;
    error?: string;
    result?: unknown;
    metadata?: Record<string, unknown>;
}

export interface JobQueueState {
    jobs: Job[];
    activeJobId: string | null;
}

// In-memory job store (for development - would use Redis/DB in production)
let jobStore: Job[] = [];
let subscribers: Set<(jobs: Job[]) => void> = new Set();

function generateJobId(): string {
    return `job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

function notifySubscribers() {
    subscribers.forEach(fn => fn([...jobStore]));
}

export const jobQueue = {
    /**
     * Create a new job
     */
    create(params: {
        type: JobType;
        title: string;
        description?: string;
        metadata?: Record<string, unknown>;
    }): Job {
        const job: Job = {
            id: generateJobId(),
            type: params.type,
            status: 'pending',
            progress: 0,
            title: params.title,
            description: params.description,
            createdAt: new Date(),
            metadata: params.metadata,
        };
        jobStore.unshift(job);
        notifySubscribers();
        return job;
    },

    /**
     * Start a job
     */
    start(jobId: string): Job | null {
        const job = jobStore.find(j => j.id === jobId);
        if (job && job.status === 'pending') {
            job.status = 'running';
            job.startedAt = new Date();
            job.progress = 0;
            notifySubscribers();
            return job;
        }
        return null;
    },

    /**
     * Update job progress
     */
    updateProgress(jobId: string, progress: number): void {
        const job = jobStore.find(j => j.id === jobId);
        if (job && job.status === 'running') {
            job.progress = Math.min(100, Math.max(0, progress));
            notifySubscribers();
        }
    },

    /**
     * Complete a job successfully
     */
    complete(jobId: string, result?: unknown): void {
        const job = jobStore.find(j => j.id === jobId);
        if (job) {
            job.status = 'completed';
            job.progress = 100;
            job.completedAt = new Date();
            job.result = result;
            notifySubscribers();
        }
    },

    /**
     * Fail a job
     */
    fail(jobId: string, error: string): void {
        const job = jobStore.find(j => j.id === jobId);
        if (job) {
            job.status = 'failed';
            job.completedAt = new Date();
            job.error = error;
            notifySubscribers();
        }
    },

    /**
     * Cancel a job
     */
    cancel(jobId: string): void {
        const job = jobStore.find(j => j.id === jobId);
        if (job && (job.status === 'pending' || job.status === 'running')) {
            job.status = 'cancelled';
            job.completedAt = new Date();
            notifySubscribers();
        }
    },

    /**
     * Get all jobs
     */
    getAll(): Job[] {
        return [...jobStore];
    },

    /**
     * Get a specific job
     */
    get(jobId: string): Job | null {
        return jobStore.find(j => j.id === jobId) || null;
    },

    /**
     * Get active jobs
     */
    getActive(): Job[] {
        return jobStore.filter(j => j.status === 'pending' || j.status === 'running');
    },

    /**
     * Subscribe to job updates
     */
    subscribe(callback: (jobs: Job[]) => void): () => void {
        subscribers.add(callback);
        return () => subscribers.delete(callback);
    },

    /**
     * Clear completed/failed jobs
     */
    clearCompleted(): void {
        jobStore = jobStore.filter(j => j.status === 'pending' || j.status === 'running');
        notifySubscribers();
    },

    /**
     * Run a job with automatic status management
     */
    async run<T>(
        params: {
            type: JobType;
            title: string;
            description?: string;
            metadata?: Record<string, unknown>;
        },
        executor: (
            updateProgress: (progress: number) => void,
            signal: AbortSignal
        ) => Promise<T>
    ): Promise<{ job: Job; result?: T; error?: string }> {
        const job = this.create(params);
        this.start(job.id);

        const abortController = new AbortController();

        try {
            const result = await executor(
                (progress) => this.updateProgress(job.id, progress),
                abortController.signal
            );
            this.complete(job.id, result);
            return { job: this.get(job.id)!, result };
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            this.fail(job.id, errorMessage);
            return { job: this.get(job.id)!, error: errorMessage };
        }
    },
};

export type JobQueue = typeof jobQueue;
