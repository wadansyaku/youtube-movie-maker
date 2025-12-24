"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import ProjectList from "@/components/project/ProjectList";
import ProjectForm from "@/components/project/ProjectForm";

interface Project {
    id: string;
    name: string;
    description: string | null;
    status: string;
    aspectRatio: string | null;
    targetDurationSeconds: number | null;
    createdAt: string;
    updatedAt: string;
    createdBy: {
        id: string;
        name: string | null;
        image: string | null;
    } | null;
    scenes: {
        id: string;
        name: string;
        shots: { id: string }[];
    }[];
    _count: {
        projectAssets: number;
        exports: number;
    };
}

export default function ProjectsPage() {
    const router = useRouter();
    const [projects, setProjects] = useState<Project[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [showCreateForm, setShowCreateForm] = useState(false);

    useEffect(() => {
        fetchProjects();
    }, []);

    const fetchProjects = async () => {
        setIsLoading(true);
        try {
            const res = await fetch("/api/projects");
            const data = await res.json();
            setProjects(data.projects || []);
        } catch (error) {
            console.error("Failed to fetch projects:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleCreateProject = async (formData: {
        name: string;
        description: string;
        aspectRatio: string;
        targetDurationSeconds: number | null;
    }) => {
        const res = await fetch("/api/projects", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(formData),
        });

        if (!res.ok) {
            throw new Error("Failed to create project");
        }

        const newProject = await res.json();
        router.push(`/projects/${newProject.id}`);
    };

    const handleProjectSelect = (project: Project) => {
        router.push(`/projects/${project.id}`);
    };

    return (
        <div className="max-w-7xl mx-auto">
            <ProjectList
                initialProjects={projects}
                onProjectSelect={handleProjectSelect}
                onCreateProject={() => setShowCreateForm(true)}
            />

            <ProjectForm
                isOpen={showCreateForm}
                onClose={() => setShowCreateForm(false)}
                onSubmit={handleCreateProject}
                mode="create"
            />
        </div>
    );
}
