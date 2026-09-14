import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import { MessageCircle, Plus, Search, Send, Wifi, WifiOff, X } from 'lucide-react';
import {
  useAddConversationMember,
  useChatSocket,
  useConversations,
  useCreateConversation,
  useMessages,
  useRemoveConversationMember,
} from '../hooks/useChat';
import { useMemberDirectory } from '../hooks/useMembers';
import { useAuth } from '../stores/AuthContext';
import type { Conversation, ConversationType, Message } from '../types/chat';
import type { MemberDirectoryItem } from '../types/member';
import { Badge, EmptyState, LoadingSkeleton, UserAvatar } from '../components/ui';
import { formatDateTime } from '../utils/dateTime';
import { toApiError } from '../utils/apiError';
import { resolveAssetUrl } from '../utils/assetUrl';

const historyPageSize = 30;

const memberDisplayName = (
  conversation: Conversation | null,
  memberId?: string | null,
  currentMemberId?: string | null,
) => {
  if (!memberId) {
    return 'Thành viên';
  }
  if (memberId === currentMemberId) {
    return 'Bạn';
  }
  return conversation?.memberNames?.[memberId] ?? 'Thành viên';
};

const conversationTitle = (conversation: Conversation, currentMemberId?: string | null) => {
  if (conversation.title) {
    return conversation.title;
  }

  if (conversation.type === 'DIRECT') {
    const otherMember = conversation.memberIds.find((memberId) => memberId !== currentMemberId);
    return otherMember ? memberDisplayName(conversation, otherMember, currentMemberId) : 'Chat trực tiếp';
  }

  const namedMembers = conversation.memberIds
    .filter((memberId) => memberId !== currentMemberId)
    .map((memberId) => memberDisplayName(conversation, memberId, currentMemberId))
    .filter((name) => name !== 'Thành viên')
    .slice(0, 3);

  return namedMembers.length ? namedMembers.join(', ') : 'Nhóm chat';
};

type MemberPickerProps = {
  label: string;
  selectedMembers: MemberDirectoryItem[];
  onSelect: (member: MemberDirectoryItem) => void;
  onRemove: (memberId: string) => void;
  excludeIds?: string[];
  multiple?: boolean;
};

const MemberPicker = ({
  label,
  selectedMembers,
  onSelect,
  onRemove,
  excludeIds = [],
  multiple = true,
}: MemberPickerProps) => {
  const [keyword, setKeyword] = useState('');
  const directoryQuery = useMemberDirectory(keyword);
  const blockedIds = new Set([...excludeIds, ...selectedMembers.map((member) => member.id)]);
  const options = (directoryQuery.data?.content ?? []).filter((member) => !blockedIds.has(member.id));

  const choose = (member: MemberDirectoryItem) => {
    onSelect(member);
    setKeyword('');
  };

  return (
    <div className="member-picker">
      <label>
        <span>{label}</span>
        <span className="member-search-box">
          <Search size={16} aria-hidden="true" />
          <input
            placeholder="Tìm theo tên, số điện thoại hoặc email"
            value={keyword}
            onChange={(event) => setKeyword(event.target.value)}
          />
        </span>
      </label>

      {selectedMembers.length > 0 && (
        <div className="selected-member-list">
          {selectedMembers.map((member) => (
            <span className="selected-member-chip" key={member.id}>
              <UserAvatar name={member.fullName} src={resolveAssetUrl(member.avatarUrl)} size="sm" />
              <span>
                <strong>{member.fullName}</strong>
                <small>{member.organizationName ?? 'Chưa có TDP'}</small>
              </span>
              <button type="button" onClick={() => onRemove(member.id)} aria-label={`Bỏ chọn ${member.fullName}`}>
                <X size={14} aria-hidden="true" />
              </button>
            </span>
          ))}
        </div>
      )}

      {keyword.trim().length > 0 && keyword.trim().length < 2 && (
        <p className="form-hint">Nhập ít nhất 2 ký tự để tìm thành viên.</p>
      )}

      {keyword.trim().length >= 2 && (
        <div className="member-search-results">
          {directoryQuery.isLoading && <LoadingSkeleton rows={2} />}
          {!directoryQuery.isLoading &&
            options.map((member) => (
              <button key={member.id} type="button" onClick={() => choose(member)}>
                <UserAvatar name={member.fullName} src={resolveAssetUrl(member.avatarUrl)} size="sm" />
                <span>
                  <strong>{member.fullName}</strong>
                  <small>{member.organizationName ?? 'Chưa có TDP'}</small>
                </span>
              </button>
            ))}
          {!directoryQuery.isLoading && options.length === 0 && (
            <p className="form-hint">Không tìm thấy thành viên phù hợp.</p>
          )}
        </div>
      )}

      {!multiple && selectedMembers.length >= 1 && <p className="form-hint">Chat trực tiếp chỉ chọn một thành viên.</p>}
    </div>
  );
};

export const ChatPage = () => {
  const { user } = useAuth();
  const conversationsQuery = useConversations();
  const createConversation = useCreateConversation();
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  const [historyPage, setHistoryPage] = useState(0);
  const [liveMessages, setLiveMessages] = useState<Message[]>([]);
  const [draft, setDraft] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [conversationType, setConversationType] = useState<ConversationType>('DIRECT');
  const [conversationTitleInput, setConversationTitleInput] = useState('');
  const [selectedMembers, setSelectedMembers] = useState<MemberDirectoryItem[]>([]);
  const [memberToAdd, setMemberToAdd] = useState<MemberDirectoryItem[]>([]);

  const selectedConversation = useMemo(
    () => conversationsQuery.data?.find((conversation) => conversation.id === selectedConversationId) ?? null,
    [conversationsQuery.data, selectedConversationId],
  );
  const messagesQuery = useMessages(selectedConversationId, historyPage, historyPageSize);
  const addMember = useAddConversationMember(selectedConversationId ?? '');
  const removeMember = useRemoveConversationMember(selectedConversationId ?? '');

  useEffect(() => {
    if (!selectedConversationId && conversationsQuery.data?.length) {
      setSelectedConversationId(conversationsQuery.data[0].id);
    }
  }, [conversationsQuery.data, selectedConversationId]);

  useEffect(() => {
    setHistoryPage(0);
    setLiveMessages([]);
    setMemberToAdd([]);
  }, [selectedConversationId]);

  useEffect(() => {
    if (conversationType === 'DIRECT' && selectedMembers.length > 1) {
      setSelectedMembers((members) => members.slice(0, 1));
    }
  }, [conversationType, selectedMembers.length]);

  const handleSocketMessage = useCallback((message: Message) => {
    setLiveMessages((current) => {
      if (current.some((item) => item.id === message.id)) {
        return current;
      }
      return [...current, message];
    });
  }, []);

  const { isConnected, sendMessage } = useChatSocket({
    conversationId: selectedConversationId,
    onMessage: handleSocketMessage,
    onError: setError,
  });

  const historicalMessages = useMemo(
    () => [...(messagesQuery.data?.content ?? [])].reverse(),
    [messagesQuery.data?.content],
  );
  const mergedMessages = useMemo(() => {
    const seen = new Set<string>();
    return [...historicalMessages, ...liveMessages].filter((message) => {
      if (seen.has(message.id)) {
        return false;
      }
      seen.add(message.id);
      return true;
    });
  }, [historicalMessages, liveMessages]);

  const handleCreateConversation = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);

    const memberIds = selectedMembers.map((member) => member.id);
    if (memberIds.length === 0) {
      setError('Hãy chọn ít nhất một thành viên để bắt đầu trò chuyện.');
      return;
    }

    try {
      const created = await createConversation.mutateAsync({
        type: conversationType,
        title: conversationType === 'GROUP' ? conversationTitleInput || undefined : undefined,
        memberIds,
      });
      setConversationTitleInput('');
      setSelectedMembers([]);
      setSelectedConversationId(created.id);
    } catch (caught) {
      setError(toApiError(caught).message ?? 'Không thể tạo cuộc trò chuyện');
    }
  };

  const handleAddMember = async (event: FormEvent) => {
    event.preventDefault();

    if (!selectedConversationId || memberToAdd.length === 0) {
      return;
    }

    setError(null);
    try {
      await Promise.all(memberToAdd.map((member) => addMember.mutateAsync(member.id)));
      setMemberToAdd([]);
    } catch (caught) {
      setError(toApiError(caught).message ?? 'Không thể thêm thành viên');
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    const name = memberDisplayName(selectedConversation, memberId, user?.memberId);
    if (!window.confirm(`Xóa ${name} khỏi nhóm?`)) {
      return;
    }

    setError(null);
    try {
      await removeMember.mutateAsync(memberId);
    } catch (caught) {
      setError(toApiError(caught).message ?? 'Không thể xóa thành viên');
    }
  };

  const handleSend = (event: FormEvent) => {
    event.preventDefault();
    setError(null);

    const sent = sendMessage(draft);

    if (!sent) {
      setError('Chưa kết nối realtime hoặc nội dung tin nhắn trống.');
      return;
    }

    setDraft('');
  };

  const selectedTitle = selectedConversation ? conversationTitle(selectedConversation, user?.memberId) : '';

  return (
    <div className="chat-page messenger-layout">
      <aside className="surface chat-sidebar">
        <div className="chat-sidebar-header">
          <div>
            <p className="page-eyebrow">Trao đổi nội bộ</p>
            <h1 className="page-title">Chat</h1>
            <p className="page-description chat-connection">
              {isConnected ? (
                <>
                  <Wifi size={14} aria-hidden="true" /> Trực tuyến 
                </>
              ) : (
                <>
                  <WifiOff size={14} aria-hidden="true" /> Ngoại tuyến
                </>
              )}
            </p>
          </div>
        </div>

        <form className="chat-create-form" onSubmit={handleCreateConversation}>
          <select value={conversationType} onChange={(event) => setConversationType(event.target.value as ConversationType)}>
            <option value="DIRECT">Chat trực tiếp</option>
            <option value="GROUP">Nhóm chat</option>
          </select>
          {conversationType === 'GROUP' && (
            <input
              placeholder="Tên nhóm"
              value={conversationTitleInput}
              onChange={(event) => setConversationTitleInput(event.target.value)}
            />
          )}
          <MemberPicker
            label={conversationType === 'GROUP' ? 'Thành viên nhóm' : 'Người nhận'}
            selectedMembers={selectedMembers}
            onSelect={(member) =>
              setSelectedMembers((current) => (conversationType === 'DIRECT' ? [member] : [...current, member]))
            }
            onRemove={(memberId) => setSelectedMembers((current) => current.filter((member) => member.id !== memberId))}
            excludeIds={user?.memberId ? [user.memberId] : []}
            multiple={conversationType === 'GROUP'}
          />
          <button className="primary-button inline-button" type="submit" disabled={createConversation.isPending}>
            <Plus size={17} aria-hidden="true" />
            Tạo
          </button>
        </form>

        <div className="conversation-list">
          {conversationsQuery.isLoading && <LoadingSkeleton rows={5} />}
          {(conversationsQuery.data ?? []).map((conversation) => {
            const title = conversationTitle(conversation, user?.memberId);
            return (
              <button
                className={conversation.id === selectedConversationId ? 'conversation-item active' : 'conversation-item'}
                key={conversation.id}
                type="button"
                onClick={() => setSelectedConversationId(conversation.id)}
                title={title}
              >
                <UserAvatar name={title} size="sm" />
                <span className="conversation-copy">
                  <strong>{title}</strong>
                  <span>
                    {conversation.type === 'GROUP' ? 'Nhóm' : 'Trực tiếp'} · {conversation.memberIds.length} thành viên
                  </span>
                </span>
              </button>
            );
          })}
          {!conversationsQuery.isLoading && (conversationsQuery.data ?? []).length === 0 && (
            <EmptyState title="Chưa có cuộc trò chuyện" />
          )}
        </div>
      </aside>

      <section className="surface chat-panel">
        {error && <div className="error-box">{error}</div>}

        {!selectedConversation ? (
          <div className="empty-panel">
            <MessageCircle size={38} aria-hidden="true" />
            <p>Chọn hoặc tạo cuộc trò chuyện để bắt đầu.</p>
          </div>
        ) : (
          <>
            <header className="chat-panel-header">
              <UserAvatar name={selectedTitle} size="md" />
              <div>
                <h2>{selectedTitle}</h2>
                <p>
                  {selectedConversation.type === 'GROUP' ? 'Nhóm chat' : 'Chat trực tiếp'} · {selectedConversation.memberIds.length} thành viên
                </p>
              </div>
            </header>

            {selectedConversation.type === 'GROUP' && (
              <section className="group-members">
                <form className="form-actions" onSubmit={handleAddMember}>
                  <MemberPicker
                    label="Thêm thành viên"
                    selectedMembers={memberToAdd}
                    onSelect={(member) => setMemberToAdd((current) => [...current, member])}
                    onRemove={(memberId) => setMemberToAdd((current) => current.filter((member) => member.id !== memberId))}
                    excludeIds={selectedConversation.memberIds}
                  />
                  <button className="secondary-button inline-button" type="submit" disabled={addMember.isPending || memberToAdd.length === 0}>
                    Thêm
                  </button>
                </form>
                <div className="member-chip-list">
                  {selectedConversation.memberIds.map((memberId) => {
                    const name = memberDisplayName(selectedConversation, memberId, user?.memberId);
                    return (
                      <span className="member-chip" key={memberId} title={name}>
                        {name}
                        {memberId !== user?.memberId && (
                          <button type="button" onClick={() => handleRemoveMember(memberId)} aria-label={`Xóa ${name}`}>
                            ×
                          </button>
                        )}
                      </span>
                    );
                  })}
                </div>
              </section>
            )}

            <div className="message-history">
              <div className="history-actions">
                <button
                  className="secondary-button inline-button"
                  type="button"
                  disabled={!messagesQuery.data || historyPage >= messagesQuery.data.totalPages - 1}
                  onClick={() => setHistoryPage((current) => current + 1)}
                >
                  Tải tin cũ hơn
                </button>
                {messagesQuery.isLoading && <Badge tone="gray">Đang tải history</Badge>}
              </div>

              {mergedMessages.map((message) => {
                const isMine = message.senderId === user?.memberId;
                const senderName = isMine
                  ? 'Bạn'
                  : (message.senderName ?? memberDisplayName(selectedConversation, message.senderId, user?.memberId));
                return (
                  <article className={isMine ? 'message-bubble mine' : 'message-bubble'} key={message.id}>
                    {!isMine && <UserAvatar name={senderName} size="sm" />}
                    <div className="message-content">
                      <div className="message-meta">
                        <strong>{senderName}</strong>
                        <span>{formatDateTime(message.createdAt)}</span>
                      </div>
                      <p>{message.content}</p>
                    </div>
                  </article>
                );
              })}
              {mergedMessages.length === 0 && !messagesQuery.isLoading && <EmptyState title="Chưa có tin nhắn" />}
            </div>

            <form className="message-input" onSubmit={handleSend}>
              <input
                maxLength={2000}
                placeholder="Nhập tin nhắn..."
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
              />
              <button className="primary-button inline-button" type="submit" disabled={!isConnected || !draft.trim()}>
                <Send size={17} aria-hidden="true" />
                Gửi
              </button>
            </form>
          </>
        )}
      </section>
    </div>
  );
};
