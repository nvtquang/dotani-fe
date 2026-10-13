import { useRef, useState } from 'react';
import { ImageIcon, LogOut, UserMinus } from 'lucide-react';
import { Button, Dialog, UserAvatar, useConfirm, useToast } from '../../components/ui';
import { useAddConversationMember, useRemoveConversationMember, useUpdateGroupAvatar } from '../../hooks/useChat';
import type { Conversation } from '../../types/chat';
import type { MemberDirectoryItem } from '../../types/member';
import { toApiError } from '../../utils/apiError';
import { resolveAssetUrl } from '../../utils/assetUrl';
import { memberName, type MemberMap } from './chatUtils';
import { MemberPicker } from './MemberPicker';

type GroupInfoDialogProps = {
  open: boolean;
  onClose: () => void;
  conversation: Conversation;
  title: string;
  members: MemberMap;
  me?: string | null;
  onOpenProfile: (memberId: string) => void;
  onLeft: () => void;
};

export const GroupInfoDialog = ({ open, onClose, conversation, title, members, me, onOpenProfile, onLeft }: GroupInfoDialogProps) => {
  const toast = useToast();
  const confirm = useConfirm();
  const avatarRef = useRef<HTMLInputElement>(null);
  const [toAdd, setToAdd] = useState<MemberDirectoryItem[]>([]);
  const addMember = useAddConversationMember(conversation.id);
  const removeMember = useRemoveConversationMember(conversation.id);
  const updateAvatar = useUpdateGroupAvatar(conversation.id);
  const fail = (caught: unknown, fallback: string) => toast.error(toApiError(caught).message ?? fallback);

  const add = async () => {
    try {
      await Promise.all(toAdd.map((member) => addMember.mutateAsync(member.id)));
      toast.success(toAdd.length > 1 ? `Đã thêm ${toAdd.length} thành viên` : `Đã thêm ${toAdd[0].fullName}`);
      setToAdd([]);
    } catch (caught) {
      fail(caught, 'Không thể thêm thành viên');
    }
  };

  const remove = async (memberId: string) => {
    const name = memberName(memberId, conversation, members, me);
    if (!(await confirm({ title: `Xóa ${name} khỏi nhóm?`, confirmLabel: 'Xóa khỏi nhóm', tone: 'danger' }))) return;
    removeMember.mutate(memberId, { onError: (caught) => fail(caught, 'Không thể xóa thành viên') });
  };

  const leave = async () => {
    if (!me || !(await confirm({ title: 'Rời nhóm chat này?', description: 'Bạn sẽ không nhận tin nhắn của nhóm nữa.', confirmLabel: 'Rời nhóm', tone: 'danger' }))) return;
    try {
      await removeMember.mutateAsync(me);
      onLeft();
    } catch (caught) {
      fail(caught, 'Không thể rời nhóm');
    }
  };

  return (
    <Dialog open={open} onClose={onClose} title="Thông tin nhóm">
      <div className="flex items-center gap-4">
        <UserAvatar name={title} src={resolveAssetUrl(conversation.avatarUrl)} size="lg" />
        <div className="min-w-0">
          <p className="truncate text-lg font-semibold text-slate-900">{title}</p>
          <p className="text-sm text-slate-600">{conversation.memberIds.length} thành viên</p>
          <input
            ref={avatarRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            className="sr-only"
            tabIndex={-1}
            aria-hidden="true"
            onChange={(event) => {
              const file = event.target.files?.[0];
              event.target.value = '';
              if (file) updateAvatar.mutate(file, { onError: (caught) => fail(caught, 'Không thể đổi ảnh nhóm') });
            }}
          />
          <Button variant="secondary" size="sm" className="mt-2" loading={updateAvatar.isPending} onClick={() => avatarRef.current?.click()}>
            <ImageIcon size={16} aria-hidden="true" />
            Đổi ảnh nhóm
          </Button>
        </div>
      </div>

      <section className="mt-6">
        <MemberPicker label="Thêm thành viên" selected={toAdd} onChange={setToAdd} excludeIds={conversation.memberIds} />
        {toAdd.length > 0 && (
          <Button className="mt-2" size="sm" onClick={add} loading={addMember.isPending}>
            Thêm vào nhóm
          </Button>
        )}
      </section>

      <section className="mt-6">
        <h3 className="mb-2 text-sm font-semibold text-slate-900">Thành viên</h3>
        <ul className="divide-y divide-slate-100">
          {conversation.memberIds.map((memberId) => {
            const name = memberName(memberId, conversation, members, me);
            return (
              <li key={memberId} className="flex items-center gap-3 py-2">
                <button type="button" onClick={() => onOpenProfile(memberId)} className="flex min-w-0 flex-1 items-center gap-3 rounded-lg text-left">
                  <UserAvatar name={name} src={resolveAssetUrl(members[memberId]?.avatarUrl)} size="sm" />
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-medium text-slate-900">{name}</span>
                    <span className="block truncate text-xs text-slate-600">{members[memberId]?.organizationName ?? 'Chưa có TDP'}</span>
                  </span>
                </button>
                {memberId !== me && (
                  <Button variant="ghost" size="icon" onClick={() => remove(memberId)} disabled={removeMember.isPending} aria-label={`Xóa ${name} khỏi nhóm`}>
                    <UserMinus size={18} aria-hidden="true" />
                  </Button>
                )}
              </li>
            );
          })}
        </ul>
      </section>

      <Button variant="danger" className="mt-6 w-full" onClick={leave} loading={removeMember.isPending}>
        <LogOut size={16} aria-hidden="true" />
        Rời nhóm
      </Button>
    </Dialog>
  );
};
