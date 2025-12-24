import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export interface SessionUser {
    id?: string;
    name?: string | null;
    email?: string | null;
    role?: string;
}

export async function requireUser(): Promise<SessionUser> {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
        throw new Error('ログインが必要です');
    }
    return session.user as SessionUser;
}
