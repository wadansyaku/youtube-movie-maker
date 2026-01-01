'use client';

import { useState, useEffect } from 'react';
import { jobQueue, Job } from '@/lib/jobQueue';

export function useJobs() {
    const [jobs, setJobs] = useState<Job[]>([]);

    useEffect(() => {
        // Initial load
        setJobs(jobQueue.getAll());

        // Subscribe to updates
        const unsubscribe = jobQueue.subscribe(setJobs);
        return unsubscribe;
    }, []);

    return {
        jobs,
        activeJobs: jobs.filter(j => j.status === 'pending' || j.status === 'running'),
        completedJobs: jobs.filter(j => j.status === 'completed' || j.status === 'failed' || j.status === 'cancelled'),
        cancelJob: (id: string) => jobQueue.cancel(id),
        clearCompleted: () => jobQueue.clearCompleted(),
    };
}
