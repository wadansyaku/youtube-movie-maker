import { prisma } from "@/lib/db";

export type AuditAction =
    | "create"
    | "update"
    | "delete"
    | "upload"
    | "export"
    | "review"
    | "generate";

export type EntityType =
    | "project"
    | "series"
    | "episode"
    | "scene"
    | "shot"
    | "asset"
    | "review"
    | "generation_run";

interface LogActivityParams {
    userId: string;
    action: AuditAction;
    entityType: EntityType;
    entityId: string;
    oldValues?: any;
    newValues?: any;
    metadata?: any;
}

export async function logActivity({
    userId,
    action,
    entityType,
    entityId,
    oldValues,
    newValues,
    metadata
}: LogActivityParams) {
    try {
        await prisma.auditLog.create({
            data: {
                userId,
                action,
                entityType,
                entityId,
                oldValues: oldValues ? JSON.stringify(oldValues) : null,
                newValues: newValues ? JSON.stringify(newValues) : null,
                // We'll store extra metadata in newValues for now if needed, 
                // or just rely on the structured fields we have. 
                // The schema has oldValues/newValues as String?, so JSON.stringify is correct.
            }
        });
    } catch (error) {
        // Fail silently to not block main application flow, but log to console
        console.error("Failed to create audit log:", error);
    }
}
