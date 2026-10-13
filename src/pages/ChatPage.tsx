import { useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ArrowLeft, Info, MessageCircle } from 'lucide-react';
import { useChatConnected } from '../api/chatSocket';
import { Button, EmptyState, LoadingSkeleton, UserAvatar, cn, useToast } from '../components/ui';
import { conversationTitle, otherMemberId } from '../features/chat/chatUtils';
import { ConversationList } from '../features/chat/ConversationList';
import { GroupInfoDialog } from '../features/chat/GroupInfoDialog';
import { MessageComposer } from '../features/chat/MessageComposer';
import { MessageList } from '../features/chat/MessageList';
import { NewConversationDialog } from '../features/chat/NewConversationDialog';
import { MemberProfileDialog } from '../features/members/MemberProfileDialog';
import {
  useConversationRealtime,
  useConversations,
  useCreateConversation,
  useMessages,
  useTypingIndicator,
  useUploadChatAttachment,
} from '../hooks/useChat';
import { useMemberMap } from '../hooks/useMembers';
import { useAuth } from '../stores/AuthContext';
import { toApiError } from '../utils/apiError';
import { resolveAssetUrl } from '../utils/assetUrl';

/**
 * Two panes on wide screens; on phones either the list or the open conversation.
 * The open conversation lives in the URL (?c=id) so back/forward and links work;
 * ?with=memberId opens (or starts) a direct chat with that member.
 */
export const ChatPage = () => {
  const { user } = useAuth();
  const me = user?.memberId;
  const toast = useToast();
  const connected = useChatConnected();
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedId = searchParams.get('c');
  const withMember = searchParams.get('with');
  const [newOpen, setNewOpen] = useState(false);
  const [groupOpen, setGroupOpen] = useState(false);
  const [profileId, setProfileId] = useState<string | null>(null);

  const conversationsQuery = useConversations();
  const conversations = useMemo(() => conversationsQuery.data ?? [], [conversationsQuery.data]);
  const selected = conversations.find((conversation) => conversation.id === selectedId) ?? null;
  const messagesQuery = useMessages(selected?.id ?? null);
  const { send } = useConversationRealtime(selected?.id ?? null);
  const { typingNames, notifyTyping } = useTypingIndicator(selected?.id ?? null);
  const upload = useUploadChatAttachment(selected?.id ?? '');
  const createConversation = useCreateConversation();

  const messages = useMemo(
    () => [...(messagesQuery.data?.pages ?? [])].reverse().flatMap((page) => [...page.content].reverse()),
    [messagesQuery.data],
  );
  const memberIds = useMemo(() => {
    const ids = new Set<string>();
    conversations.forEach((conversation) => conversation.memberIds.forEach((id) => ids.add(id)));
    return Array.from(ids);
  }, [conversations]);
  const members = useMemberMap(memberIds);

  const open = (id: string | null) => setSearchParams(id ? { c: id } : {}, { replace: Boolean(withMember) });

  // ?with=memberId → existing direct conversation, or a new one
  const resolvingRef = useRef<string | null>(null);
  useEffect(() => {
    if (!withMember || !conversationsQuery.isSuccess || resolvingRef.current === withMember) return;
    resolvingRef.current = withMember;
    const existing = conversations.find((conversation) => conversation.type === 'DIRECT' && conversation.memberIds.includes(withMember));
    if (existing) {
      open(existing.id);
      return;
    }
    createConversation
      .mutateAsync({ type: 'DIRECT', memberIds: [withMember] })
      .then((created) => open(created.id))
      .catch((caught) => {
        toast.error(toApiError(caught).message ?? 'Không thể mở cuộc trò chuyện');
        open(null);
      });
    // runs once per ?with= value; open/createConversation are stable enough for that
  }, [withMember, conversationsQuery.isSuccess]);

  // wide screens: open the most recent conversation by default
  useEffect(() => {
    if (!selectedId && !withMember && conversations.length && window.matchMedia('(min-width: 1024px)').matches) {
      const latest = [...conversations].sort((a, b) => new Date(b.lastMessageAt ?? 0).getTime() - new Date(a.lastMessageAt ?? 0).getTime())[0];
      setSearchParams({ c: latest.id }, { replace: true });
    }
  }, [selectedId, withMember, conversations, setSearchParams]);

  const title = selected ? conversationTitle(selected, members, me) : '';
  const directId = otherMemberId(selected, me);
  const headerAvatar = resolveAssetUrl(selected?.type === 'GROUP' ? selected.avatarUrl : directId ? members[directId]?.avatarUrl : null);

  const onSend = (content: string) => {
    const sent = send(content);
    if (!sent && content.trim()) toast.error('Mất kết nối, đang thử kết nối lại. Vui lòng gửi lại sau giây lát.');
    return sent;
  };

  return (
    // phones/tablets: pinned between the top bar and the tab bar; desktop: fills the content area
    <div className="flex overflow-hidden bg-white max-lg:fixed max-lg:inset-x-0 max-lg:top-14 max-lg:bottom-[calc(4rem+env(safe-area-inset-bottom))] max-lg:z-10 lg:h-[calc(100dvh-8rem)] lg:rounded-card lg:border lg:border-slate-200 lg:shadow-card">
      <aside className={cn('w-full min-w-0 border-slate-200 lg:block lg:w-80 lg:border-r xl:w-96', selected || withMember ? 'hidden' : 'block')}>
        <ConversationList
          conversations={conversations}
          isLoading={conversationsQuery.isLoading}
          members={members}
          me={me}
          selectedId={selected?.id ?? null}
          onSelect={open}
          onNew={() => setNewOpen(true)}
          connected={connected}
        />
      </aside>

      <section className={cn('min-w-0 flex-1 flex-col', selected || withMember ? 'flex' : 'hidden lg:flex')} aria-label={title || 'Cuộc trò chuyện'}>
        {!selected ? (
          withMember ? (
            <LoadingSkeleton rows={4} />
          ) : (
            <div className="flex flex-1 items-center justify-center">
              <EmptyState
                icon={<MessageCircle size={22} />}
                title="Chọn một cuộc trò chuyện"
                description="Hoặc bắt đầu trò chuyện mới với đoàn viên, cán bộ."
                action={<Button onClick={() => setNewOpen(true)}>Tin nhắn mới</Button>}
              />
            </div>
          )
        ) : (
          <>
            <header className="flex items-center gap-2 border-b border-slate-200 px-2 py-2 sm:px-3">
              <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => open(null)} aria-label="Quay lại danh sách">
                <ArrowLeft size={20} aria-hidden="true" />
              </Button>
              <button
                type="button"
                className="flex min-w-0 flex-1 items-center gap-3 rounded-lg p-1 text-left hover:bg-slate-50"
                onClick={() => (selected.type === 'GROUP' ? setGroupOpen(true) : directId && setProfileId(directId))}
              >
                <UserAvatar name={title} src={headerAvatar} size="sm" />
                <span className="min-w-0">
                  <span className="block truncate font-semibold text-slate-900">{title}</span>
                  <span className="block truncate text-xs text-slate-600">
                    {typingNames.length ? 'đang nhập…' : selected.type === 'GROUP' ? `${selected.memberIds.length} thành viên` : (members[directId ?? '']?.organizationName ?? 'Trò chuyện riêng')}
                  </span>
                </span>
              </button>
              {selected.type === 'GROUP' && (
                <Button variant="ghost" size="icon" onClick={() => setGroupOpen(true)} aria-label="Thông tin nhóm">
                  <Info size={20} aria-hidden="true" />
                </Button>
              )}
            </header>

            {messagesQuery.isLoading ? (
              <div className="flex-1 p-4">
                <LoadingSkeleton rows={6} />
              </div>
            ) : (
              <MessageList
                conversation={selected}
                messages={messages}
                members={members}
                me={me}
                typingNames={typingNames}
                hasOlder={Boolean(messagesQuery.hasNextPage)}
                loadingOlder={messagesQuery.isFetchingNextPage}
                onLoadOlder={() => void messagesQuery.fetchNextPage()}
                onOpenProfile={setProfileId}
              />
            )}

            <MessageComposer
              disabled={!connected}
              uploading={upload.isPending}
              onSend={onSend}
              onTyping={notifyTyping}
              onAttach={(file) => upload.mutate(file, { onError: (caught) => toast.error(toApiError(caught).message ?? 'Không gửi được tệp') })}
            />

            {selected.type === 'GROUP' && (
              <GroupInfoDialog
                open={groupOpen}
                onClose={() => setGroupOpen(false)}
                conversation={selected}
                title={title}
                members={members}
                me={me}
                onOpenProfile={setProfileId}
                onLeft={() => {
                  setGroupOpen(false);
                  open(null);
                  toast.success('Đã rời nhóm');
                }}
              />
            )}
          </>
        )}
      </section>

      <NewConversationDialog
        open={newOpen}
        onClose={() => setNewOpen(false)}
        onCreated={(id) => {
          setNewOpen(false);
          open(id);
        }}
      />
      <MemberProfileDialog memberId={profileId} basic={profileId ? members[profileId] : undefined} onClose={() => setProfileId(null)} />
    </div>
  );
};
