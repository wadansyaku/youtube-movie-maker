import { NextResponse } from "next/server";
import { getSignedUploadUrl, getContentType, validateFileType } from "@/lib/storage";

// POST /api/upload/presigned - Get a presigned URL for direct upload
export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { fileName, contentType, prefix, allowedTypes } = body;

        if (!fileName) {
            return NextResponse.json(
                { error: "fileName is required" },
                { status: 400 }
            );
        }

        // Validate file type if restrictions specified
        if (allowedTypes && allowedTypes.length > 0) {
            if (!validateFileType(fileName, allowedTypes)) {
                return NextResponse.json(
                    { error: `File type not allowed. Allowed types: ${allowedTypes.join(", ")}` },
                    { status: 400 }
                );
            }
        }

        const mimeType = contentType || getContentType(fileName);
        const { key, uploadUrl } = await getSignedUploadUrl(
            fileName,
            mimeType,
            prefix || "uploads",
            3600 // 1 hour expiry
        );

        return NextResponse.json({
            key,
            uploadUrl,
            contentType: mimeType,
            expiresIn: 3600,
        });
    } catch (error) {
        console.error("Failed to generate presigned URL:", error);
        return NextResponse.json(
            { error: "Failed to generate upload URL" },
            { status: 500 }
        );
    }
}
