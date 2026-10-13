import { useState } from 'react';
import { Alert, Button, Dialog, Field, Input, cn } from '../../components/ui';
import { useCreateConversation } from '../../hooks/useChat';
import { useAuth } from '../../stores/AuthContext';
import type { ConversationType } from '../../types/chat';
import type { MemberDirectoryItem } from '../../types/member';
import { toApiError } from '../../utils/apiError';
import { MemberPicker } from './MemberPicker';

type NewConversationDialogProps = {
  open: boolean;
  onClose: () => void;
  onCreated: (conversationId: string) => void;
};

/** "+ Tin nhắn mới": a direct chat with one person or a named group. */
export const NewConversationDialog = ({ open, onClose, onCreated }: NewConversationDialogProps) => {
  const { user } = useAuth();
  const createConversation = useCreateConversation();
  const [type, setType] = useState<ConversationType>('DIRECT');
  const [title, setTitle] = useState('');
  const [members, setMembers] = useState<MemberDirectoryItem[]>([]);
  const [error, setError] = useState<string | null>(null);

  const reset = () => {
    setType('DIRECT');
    setTitle('');
    setMembers([]);
    setError(null);
  };

  const close = () => {
    reset();
    onClose();
  };

  const submit = async () => {
    if (members.length === 0) {
      setError(type === 'DIRECT' ? 'Chọn người nhận.' : 'Chọn ít nhất một thành viên.');
      return;
    }
    try {
      const created = await createConversation.mutateAsync({
        type,
        title: type === 'GROUP' ? title.trim() || undefined : undefined,
        memberIds: members.map((member) => member.id),
      });
      reset();
      onCreated(created.id);
    } catch (caught) {
      setError(toApiError(caught).message ?? 'Không thể tạo cuộc trò chuyện');
    }
  };

  return (
    <Dialog
      open={open}
      onClose={close}
      title="Tin nhắn mới"
      footer={
        <>
          <Button variant="secondary" onClick={close}>
            Hủy
          </Button>
          <Button onClick={submit} loading={createConversation.isPending} disabled={members.length === 0}>
            {type === 'GROUP' ? 'Tạo nhóm' : 'Bắt đầu trò chuyện'}
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <div className="inline-flex self-start rounded-lg border border-slate-300 p-0.5" role="radiogroup" aria-label="Loại trò chuyện">
          {(['DIRECT', 'GROUP'] as const).map((value) => (
            <button
              key={value}
              type="button"
              role="radio"
              aria-checked={type === value}
              onClick={() => {
                setType(value);
                if (value === 'DIRECT') setMembers((current) => current.slice(0, 1));
              }}
              className={cn('h-9 rounded-md px-3 text-sm font-medium', type === value ? 'bg-brand-600 text-white' : 'text-slate-700 hover:bg-slate-100')}
            >
              {value === 'DIRECT' ? 'Trò chuyện riêng' : 'Nhóm'}
            </button>
          ))}
        </div>
        {type === 'GROUP' && (
          <Field label="Tên nhóm" hint="Bỏ trống để dùng tên các thành viên">
            <Input value={title} maxLength={255} onChange={(event) => setTitle(event.target.value)} />
          </Field>
        )}
        <MemberPicker
          label={type === 'GROUP' ? 'Thành viên' : 'Người nhận'}
          selected={members}
          onChange={(next) => {
            setMembers(next);
            setError(null);
          }}
          excludeIds={user?.memberId ? [user.memberId] : []}
          multiple={type === 'GROUP'}
          autoFocus
        />
        {error && <Alert>{error}</Alert>}
      </div>
    </Dialog>
  );
};
