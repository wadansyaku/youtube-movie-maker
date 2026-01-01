import { NextRequest, NextResponse } from 'next/server';

// Placeholder Team API
// Note: Full team functionality requires schema changes to add teamId to User model
// This API provides the interface for when schema is ready

export interface TeamMemberResponse {
    id: string;
    email: string;
    name: string;
    role: string;
    avatarUrl?: string;
    joinedAt: Date;
}

// GET /api/team - Get team members (placeholder)
export async function GET(request: NextRequest) {
    // Placeholder response
    const members: TeamMemberResponse[] = [
        {
            id: '1',
            email: 'owner@example.com',
            name: 'オーナー',
            role: 'owner',
            joinedAt: new Date(),
        },
    ];

    return NextResponse.json({
        members,
        message: 'チーム機能はスキーマ更新後に利用可能になります',
    });
}

// POST /api/team - Invite a team member (placeholder)
export async function POST(request: NextRequest) {
    const body = await request.json();
    const { email, role } = body;

    // Placeholder - would create invitation
    return NextResponse.json({
        success: true,
        message: `招待機能は準備中です: ${email} (${role})`,
        member: {
            id: 'placeholder',
            email,
            name: email.split('@')[0],
            role,
            joinedAt: new Date(),
        },
    });
}

// PATCH /api/team - Update member role (placeholder)
export async function PATCH(request: NextRequest) {
    const body = await request.json();
    const { memberId, role } = body;

    return NextResponse.json({
        success: true,
        message: `権限更新準備中: ${memberId} → ${role}`,
    });
}

// DELETE /api/team - Remove member (placeholder)
export async function DELETE(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const memberId = searchParams.get('memberId');

    return NextResponse.json({
        success: true,
        message: `メンバー削除準備中: ${memberId}`,
    });
}
