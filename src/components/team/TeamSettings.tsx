'use client';

/* eslint-disable @next/next/no-img-element */

import { useState } from 'react';
import { Users, Mail, Shield, X, Plus, Crown, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export type TeamRole = 'owner' | 'admin' | 'editor' | 'viewer';

export interface TeamMember {
    id: string;
    email: string;
    name: string;
    role: TeamRole;
    avatarUrl?: string;
    joinedAt: Date;
}

const ROLE_CONFIG: Record<TeamRole, { label: string; color: string; icon: React.ReactNode }> = {
    owner: { label: 'オーナー', color: 'text-yellow-400', icon: <Crown size={14} /> },
    admin: { label: '管理者', color: 'text-purple-400', icon: <Shield size={14} /> },
    editor: { label: '編集者', color: 'text-blue-400', icon: <Users size={14} /> },
    viewer: { label: '閲覧者', color: 'text-gray-400', icon: <Users size={14} /> },
};

interface Props {
    members: TeamMember[];
    currentUserId: string;
    onInvite: (email: string, role: TeamRole) => Promise<void>;
    onUpdateRole: (memberId: string, role: TeamRole) => Promise<void>;
    onRemoveMember: (memberId: string) => Promise<void>;
}

export function TeamSettings({ members, currentUserId, onInvite, onUpdateRole, onRemoveMember }: Props) {
    const [showInviteModal, setShowInviteModal] = useState(false);
    const [inviteEmail, setInviteEmail] = useState('');
    const [inviteRole, setInviteRole] = useState<TeamRole>('editor');
    const [isInviting, setIsInviting] = useState(false);
    const [error, setError] = useState('');

    const currentMember = members.find(m => m.id === currentUserId);
    const canManage = currentMember?.role === 'owner' || currentMember?.role === 'admin';

    const handleInvite = async () => {
        if (!inviteEmail.trim()) {
            setError('メールアドレスを入力してください');
            return;
        }

        setIsInviting(true);
        setError('');
        try {
            await onInvite(inviteEmail, inviteRole);
            setShowInviteModal(false);
            setInviteEmail('');
            setInviteRole('editor');
        } catch (err) {
            setError(err instanceof Error ? err.message : '招待に失敗しました');
        } finally {
            setIsInviting(false);
        }
    };

    const handleRemove = async (memberId: string) => {
        if (!confirm('このメンバーを削除しますか？')) return;
        await onRemoveMember(memberId);
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-lg font-semibold">チームメンバー</h2>
                    <p className="text-sm text-gray-400">{members.length} メンバー</p>
                </div>
                {canManage && (
                    <button
                        onClick={() => setShowInviteModal(true)}
                        className="btn btn-primary flex items-center gap-2"
                    >
                        <Plus size={16} />
                        メンバーを招待
                    </button>
                )}
            </div>

            {/* Member List */}
            <div className="space-y-2">
                {members.map((member) => (
                    <MemberRow
                        key={member.id}
                        member={member}
                        isCurrentUser={member.id === currentUserId}
                        canManage={canManage && member.role !== 'owner'}
                        onUpdateRole={onUpdateRole}
                        onRemove={() => handleRemove(member.id)}
                    />
                ))}
            </div>

            {/* Invite Modal */}
            <AnimatePresence>
                {showInviteModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4"
                        onClick={() => setShowInviteModal(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            onClick={(e) => e.stopPropagation()}
                            className="bg-gray-900 rounded-xl border border-gray-800 shadow-2xl w-full max-w-md p-6"
                        >
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-semibold">メンバーを招待</h3>
                                <button
                                    onClick={() => setShowInviteModal(false)}
                                    className="text-gray-400 hover:text-white"
                                >
                                    <X size={20} />
                                </button>
                            </div>

                            {error && (
                                <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg mb-4">
                                    <p className="text-sm text-red-400">{error}</p>
                                </div>
                            )}

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm text-gray-400 mb-1">
                                        メールアドレス
                                    </label>
                                    <div className="relative">
                                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                                        <input
                                            type="email"
                                            value={inviteEmail}
                                            onChange={(e) => setInviteEmail(e.target.value)}
                                            placeholder="email@example.com"
                                            className="input pl-10"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm text-gray-400 mb-1">
                                        権限
                                    </label>
                                    <select
                                        value={inviteRole}
                                        onChange={(e) => setInviteRole(e.target.value as TeamRole)}
                                        className="input"
                                    >
                                        <option value="editor">編集者 - 編集可能</option>
                                        <option value="viewer">閲覧者 - 閲覧のみ</option>
                                        <option value="admin">管理者 - メンバー管理可能</option>
                                    </select>
                                </div>
                            </div>

                            <div className="flex justify-end gap-2 mt-6">
                                <button
                                    onClick={() => setShowInviteModal(false)}
                                    className="btn btn-secondary"
                                >
                                    キャンセル
                                </button>
                                <button
                                    onClick={handleInvite}
                                    disabled={isInviting}
                                    className="btn btn-primary flex items-center gap-2"
                                >
                                    {isInviting && <Loader2 size={16} className="animate-spin" />}
                                    招待を送信
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

function MemberRow({
    member,
    isCurrentUser,
    canManage,
    onUpdateRole,
    onRemove,
}: {
    member: TeamMember;
    isCurrentUser: boolean;
    canManage: boolean;
    onUpdateRole: (memberId: string, role: TeamRole) => Promise<void>;
    onRemove: () => void;
}) {
    const config = ROLE_CONFIG[member.role];

    return (
        <div className="flex items-center gap-3 p-3 bg-gray-800/30 rounded-lg">
            {/* Avatar */}
            <div className="w-10 h-10 bg-gray-700 rounded-full flex items-center justify-center">
                {member.avatarUrl ? (
                    <img src={member.avatarUrl} alt={member.name} className="w-10 h-10 rounded-full" />
                ) : (
                    <span className="text-sm font-medium">{member.name[0]}</span>
                )}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                    <span className="font-medium truncate">{member.name}</span>
                    {isCurrentUser && (
                        <span className="text-xs bg-gray-700 px-1.5 py-0.5 rounded">あなた</span>
                    )}
                </div>
                <span className="text-sm text-gray-500 truncate block">{member.email}</span>
            </div>

            {/* Role */}
            <div className={`flex items-center gap-1 ${config.color}`}>
                {config.icon}
                <span className="text-sm">{config.label}</span>
            </div>

            {/* Actions */}
            {canManage && !isCurrentUser && (
                <div className="flex items-center gap-1">
                    <select
                        value={member.role}
                        onChange={(e) => onUpdateRole(member.id, e.target.value as TeamRole)}
                        className="bg-gray-800 border-gray-700 rounded text-xs py-1"
                    >
                        <option value="editor">編集者</option>
                        <option value="viewer">閲覧者</option>
                        <option value="admin">管理者</option>
                    </select>
                    <button
                        onClick={onRemove}
                        className="p-1 text-gray-500 hover:text-red-400"
                    >
                        <X size={14} />
                    </button>
                </div>
            )}
        </div>
    );
}

export default TeamSettings;
