import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export interface SessionUser {
    id?: string;
    name?: string | null;
    email?: string | null;
    role?: string;
}

// Development mode mock user
const DEV_USER: SessionUser = {
    id: 'dev-user-id',
    name: 'Dev User',
    email: 'dev@example.com',
    role: 'admin',
};

export async function requireUser(): Promise<SessionUser> {
    // Skip auth in development mode for easier testing
    if (process.env.NODE_ENV === 'development' && !process.env.REQUIRE_AUTH) {
        return DEV_USER;
    }

    const session = await getServerSession(authOptions);
    if (!session?.user) {
        throw new Error('ログインが必要です');
    }
    return session.user as SessionUser;
}

// Optional user - returns null if not logged in instead of throwing
export async function getOptionalUser(): Promise<SessionUser | null> {
    if (process.env.NODE_ENV === 'development' && !process.env.REQUIRE_AUTH) {
        return DEV_USER;
    }

    const session = await getServerSession(authOptions);
    return session?.user as SessionUser | null;
}

