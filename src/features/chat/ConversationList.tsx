import { useMemo, useState } from 'react';
import { Search, SquarePen } from 'lucide-react';
import { Button, EmptyState, Input, LoadingSkeleton, UserAvatar, cn } from '../../components/ui';
import type { Conversation } from '../../types/chat';
import { resolveAssetUrl } from '../../utils/assetUrl';
import { formatRelative } from '../../utils/dateTime';
import { normalizeText } from '../../utils/text';
import { conversationActivity, conversationTitle, otherMemberId, type MemberMap } from './chatUtils';

type ConversationListProps = {
  conversations: Conversation[];
  isLoading: boolean;
  members: MemberMap;
  me?: string | null;
  selectedId: string | null;
  onSelect: (id: string) => void;
  onNew: () => void;
  connected: boolean;
};

export const ConversationList = ({ conversations, isLoading, members, me, selectedId, onSelect, onNew, connected }: ConversationListProps) => {
  const [filter, setFilter] = useState('');

  const rows = useMemo(() => {
    const needle = normalizeText(filter);
    return conversations
      .map((conversation) => {
        const other = otherMemberId(conversation, me);
        return {
          conversation,
          title: conversationTitle(conversation, members, me),
          avatar: resolveAssetUrl(conversation.type === 'GROUP' ? conversation.avatarUrl : other ? members[other]?.avatarUrl : null),
        };
      })
      .filter((row) => !needle || normalizeText(row.title).includes(needle))
      .sort((left, right) => conversationActivity(right.conversation) - conversationActivity(left.conversation));
  }, [conversations, members, me, filter]);

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex items-center gap-2 px-4 pt-4 pb-2">
        <h1 className="flex-1 text-xl font-bold text-slate-900">Chat</h1>
        <span className={cn('inline-flex items-center gap-1.5 text-xs', connected ? 'text-emerald-800' : 'text-slate-600')} role="status">
          <span className={cn('size-2 rounded-full', connected ? 'bg-emerald-500' : 'bg-slate-400')} aria-hidden="true" />
          {connected ? 'Trực tuyến' : 'Đang kết nối…'}
        </span>
      </div>
      <div className="flex gap-2 px-4 pb-3">
        <div className="relative flex-1">
          <Search size={16} className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-slate-500" aria-hidden="true" />
          <Input className="pl-9" placeholder="Tìm cuộc trò chuyện" aria-label="Tìm cuộc trò chuyện" value={filter} onChange={(event) => setFilter(event.target.value)} />
        </div>
        <Button onClick={onNew} aria-label="Tin nhắn mới" title="Tin nhắn mới" className="px-3 sm:px-4">
          <SquarePen size={17} aria-hidden="true" />
          <span className="hidden sm:inline xl:hidden 2xl:inline">Tin nhắn mới</span>
        </Button>
      </div>

      <ul className="min-h-0 flex-1 overflow-y-auto px-2 pb-2" aria-label="Cuộc trò chuyện">
        {isLoading && <LoadingSkeleton rows={6} />}
        {rows.map(({ conversation, title, avatar }) => {
          const unread = conversation.unreadCount ?? 0;
          const active = conversation.id === selectedId;
          return (
            <li key={conversation.id}>
              <button
                type="button"
                onClick={() => onSelect(conversation.id)}
                aria-current={active ? 'true' : undefined}
                className={cn('flex w-full items-center gap-3 rounded-xl px-2 py-2.5 text-left', active ? 'bg-brand-50' : 'hover:bg-slate-50')}
              >
                <UserAvatar name={title} src={avatar} size="md" />
                <span className="min-w-0 flex-1">
                  <span className="flex items-baseline gap-2">
                    <span className={cn('min-w-0 flex-1 truncate text-sm', unread ? 'font-bold text-slate-900' : 'font-medium text-slate-900')}>{title}</span>
                    {conversation.lastMessageAt && <span className="shrink-0 text-xs text-slate-600">{formatRelative(conversation.lastMessageAt)}</span>}
                  </span>
                  <span className="flex items-center gap-2">
                    <span className={cn('min-w-0 flex-1 truncate text-sm', unread ? 'font-semibold text-slate-900' : 'text-slate-600')}>
                      {conversation.lastMessagePreview ?? (conversation.type === 'GROUP' ? `Nhóm · ${conversation.memberIds.length} thành viên` : 'Bắt đầu trò chuyện')}
                    </span>
                    {unread > 0 && (
                      <span className="inline-flex min-w-5 shrink-0 items-center justify-center rounded-full bg-accent-600 px-1.5 text-[11px] leading-5 font-bold text-white">
                        {unread > 99 ? '99+' : unread}
                        <span className="sr-only"> tin chưa đọc</span>
                      </span>
                    )}
                  </span>
                </span>
              </button>
            </li>
          );
        })}
        {!isLoading && conversations.length === 0 && (
          <EmptyState
            title="Chưa có cuộc trò chuyện"
            action={
              <Button onClick={onNew}>
                <SquarePen size={16} aria-hidden="true" />
                Tin nhắn mới
              </Button>
            }
          />
        )}
      </ul>
    </div>
  );
};
