import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import { ImageIcon, LogOut, MessageCircle, Paperclip, Plus, Search, Send, UsersRound, Wifi, WifiOff, X } from 'lucide-react';
import {
  useAddConversationMember,
  useChatSocket,
  useConversations,
  useCreateConversation,
  useMessages,
  useRemoveConversationMember,
  useUpdateGroupAvatar,
  useUploadChatAttachment,
} from '../hooks/useChat';
import { useMember, useMemberDirectory, useMemberMap } from '../hooks/useMembers';
import { useAuth } from '../stores/AuthContext';
import type { Conversation, ConversationType, Message } from '../types/chat';
import type { MemberDirectoryItem } from '../types/member';
import { Badge, EmptyState, LoadingSkeleton, UserAvatar } from '../components/ui';
import { formatDateTime } from '../utils/dateTime';
import { toApiError } from '../utils/apiError';
import { resolveAssetUrl } from '../utils/assetUrl';
import { genderLabel, memberStatusLabel, roleLabel } from '../utils/labels';

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
  const [profileMemberId, setProfileMemberId] = useState<string | null>(null);
  const [isGroupDetailsOpen, setIsGroupDetailsOpen] = useState(false);

  const selectedConversation = useMemo(
    () => conversationsQuery.data?.find((conversation) => conversation.id === selectedConversationId) ?? null,
    [conversationsQuery.data, selectedConversationId],
  );
  const messagesQuery = useMessages(selectedConversationId, historyPage, historyPageSize);
  const visibleMemberIds = useMemo(() => {
    const ids = new Set<string>();
    (conversationsQuery.data ?? []).forEach((conversation) => conversation.memberIds.forEach((memberId) => ids.add(memberId)));
    liveMessages.forEach((message) => ids.add(message.senderId));
    (messagesQuery.data?.content ?? []).forEach((message) => ids.add(message.senderId));
    return Array.from(ids);
  }, [conversationsQuery.data, liveMessages, messagesQuery.data?.content]);
  const memberMap = useMemberMap(visibleMemberIds);
  const selectedProfileQuery = useMember(profileMemberId ?? '');
  const selectedProfile = selectedProfileQuery.data;
  const addMember = useAddConversationMember(selectedConversationId ?? '');
  const removeMember = useRemoveConversationMember(selectedConversationId ?? '');
  const uploadAttachment = useUploadChatAttachment(selectedConversationId ?? '');
  const updateGroupAvatar = useUpdateGroupAvatar(selectedConversationId ?? '');

  useEffect(() => {
    if (!selectedConversationId && conversationsQuery.data?.length) {
      setSelectedConversationId(conversationsQuery.data[0].id);
    }
  }, [conversationsQuery.data, selectedConversationId]);

  useEffect(() => {
    setHistoryPage(0);
    setLiveMessages([]);
    setMemberToAdd([]);
    setIsGroupDetailsOpen(false);
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

  const handleLeaveGroup = async () => {
    if (!selectedConversationId || !user?.memberId || selectedConversation?.type !== 'GROUP') {
      return;
    }
    if (!window.confirm('Bạn chắc chắn muốn rời nhóm chat này?')) {
      return;
    }

    setError(null);
    try {
      await removeMember.mutateAsync(user.memberId);
      setLiveMessages([]);
      setIsGroupDetailsOpen(false);
      const refreshed = await conversationsQuery.refetch();
      setSelectedConversationId(refreshed.data?.[0]?.id ?? null);
    } catch (caught) {
      setError(toApiError(caught).message ?? 'Không thể rời nhóm chat');
    }
  };

  const handleGroupAvatarUpload = async (file?: File | null) => {
    if (!file || !selectedConversationId || selectedConversation?.type !== 'GROUP') {
      return;
    }

    setError(null);
    try {
      await updateGroupAvatar.mutateAsync(file);
    } catch (caught) {
      setError(toApiError(caught).message ?? 'Không thể đổi ảnh nhóm');
    }
  };

  const handleAttachmentUpload = async (file?: File | null) => {
    if (!file || !selectedConversationId) {
      return;
    }

    setError(null);
    try {
      const uploaded = await uploadAttachment.mutateAsync(file);
      setLiveMessages((current) => (current.some((message) => message.id === uploaded.id) ? current : [...current, uploaded]));
    } catch (caught) {
      setError(toApiError(caught).message ?? 'Không thể gửi file');
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

  const openMemberProfile = (memberId?: string | null) => {
    if (memberId) {
      setProfileMemberId(memberId);
    }
  };

  const getMemberName = (conversation: Conversation | null, memberId?: string | null) => {
    if (!memberId) {
      return 'Thành viên';
    }
    if (memberId === user?.memberId) {
      return 'Bạn';
    }
    return memberMap[memberId]?.fullName ?? memberDisplayName(conversation, memberId, user?.memberId);
  };

  const getMemberAvatar = (memberId?: string | null) => resolveAssetUrl(memberId ? memberMap[memberId]?.avatarUrl : null);

  const getDirectOtherMemberId = (conversation: Conversation | null) =>
    conversation?.type === 'DIRECT' ? conversation.memberIds.find((memberId) => memberId !== user?.memberId) : null;

  const selectedDirectMemberId = getDirectOtherMemberId(selectedConversation);
  const selectedTitle = selectedConversation
    ? selectedDirectMemberId
      ? getMemberName(selectedConversation, selectedDirectMemberId)
      : conversationTitle(selectedConversation, user?.memberId)
    : '';
  const selectedAvatarUrl =
    selectedConversation?.type === 'GROUP'
      ? resolveAssetUrl(selectedConversation.avatarUrl)
      : getMemberAvatar(selectedDirectMemberId);

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
            const directMemberId = getDirectOtherMemberId(conversation);
            const title = directMemberId
              ? getMemberName(conversation, directMemberId)
              : conversationTitle(conversation, user?.memberId);
            return (
              <button
                className={conversation.id === selectedConversationId ? 'conversation-item active' : 'conversation-item'}
                key={conversation.id}
                type="button"
                onClick={() => setSelectedConversationId(conversation.id)}
                title={title}
              >
                <UserAvatar name={title} src={getMemberAvatar(directMemberId)} size="sm" />
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
              <button
                className="avatar-profile-button"
                type="button"
                onClick={() =>
                  selectedConversation.type === 'GROUP' ? setIsGroupDetailsOpen(true) : openMemberProfile(selectedDirectMemberId)
                }
                disabled={selectedConversation.type !== 'GROUP' && !selectedDirectMemberId}
                aria-label={selectedConversation.type === 'GROUP' ? 'Mở thông tin nhóm' : `Xem hồ sơ ${selectedTitle}`}
              >
                <UserAvatar name={selectedTitle} src={selectedAvatarUrl} size="md" />
              </button>
              <div>
                <button
                  className="chat-title-button"
                  type="button"
                  onClick={() =>
                    selectedConversation.type === 'GROUP' ? setIsGroupDetailsOpen(true) : openMemberProfile(selectedDirectMemberId)
                  }
                  disabled={selectedConversation.type !== 'GROUP' && !selectedDirectMemberId}
                >
                  <h2>{selectedTitle}</h2>
                </button>
                <p>
                  {selectedConversation.type === 'GROUP' ? 'Nhóm chat' : 'Chat trực tiếp'} · {selectedConversation.memberIds.length} thành viên
                </p>
              </div>
              {selectedConversation.type === 'GROUP' && (
                <button
                  className="secondary-button inline-button chat-leave-button"
                  type="button"
                  onClick={() => setIsGroupDetailsOpen(true)}
                >
                  <UsersRound size={16} aria-hidden="true" />
                  Thông tin nhóm
                </button>
              )}
            </header>

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
                  : (memberMap[message.senderId]?.fullName ??
                    message.senderName ??
                    memberDisplayName(selectedConversation, message.senderId, user?.memberId));
                const attachmentUrl = message.attachmentUrl ? resolveAssetUrl(message.attachmentUrl) : undefined;
                return (
                  <article className={isMine ? 'message-bubble mine' : 'message-bubble'} key={message.id}>
                    {!isMine && (
                      <button
                        className="avatar-profile-button"
                        type="button"
                        onClick={() => openMemberProfile(message.senderId)}
                        aria-label={`Xem hồ sơ ${senderName}`}
                      >
                        <UserAvatar name={senderName} src={getMemberAvatar(message.senderId)} size="sm" />
                      </button>
                    )}
                    <div className="message-content">
                      <div className="message-meta">
                        <button type="button" onClick={() => openMemberProfile(message.senderId)}>
                          <strong>{senderName}</strong>
                        </button>
                        <span>{formatDateTime(message.createdAt)}</span>
                      </div>
                      {attachmentUrl && message.attachmentKind === 'IMAGE' && (
                        <a href={attachmentUrl} target="_blank" rel="noreferrer">
                          <img
                            className="chat-message-image"
                            src={attachmentUrl}
                            alt={message.attachmentName ?? 'Ảnh trong chat'}
                          />
                        </a>
                      )}
                      {attachmentUrl && message.attachmentKind === 'FILE' && (
                        <a className="chat-file-link" href={attachmentUrl} target="_blank" rel="noreferrer">
                          <Paperclip size={16} aria-hidden="true" />
                          <span>{message.attachmentName ?? message.content}</span>
                        </a>
                      )}
                      {(!message.attachmentUrl || message.content !== message.attachmentName) && <p>{message.content}</p>}
                    </div>
                  </article>
                );
              })}
              {mergedMessages.length === 0 && !messagesQuery.isLoading && <EmptyState title="Chưa có tin nhắn" />}
            </div>

            <form className="message-input" onSubmit={handleSend}>
              <div className="message-upload-actions">
                <label className="icon-button" title="Gửi ảnh" aria-label="Gửi ảnh">
                  <ImageIcon size={18} aria-hidden="true" />
                  <input
                    accept="image/jpeg,image/png,image/webp,image/gif"
                    type="file"
                    onChange={(event) => {
                      void handleAttachmentUpload(event.target.files?.[0]);
                      event.target.value = '';
                    }}
                  />
                </label>
                <label className="icon-button" title="Gửi file" aria-label="Gửi file">
                  <Paperclip size={18} aria-hidden="true" />
                  <input
                    accept=".pdf,.txt,.doc,.docx,.xls,.xlsx,image/jpeg,image/png,image/webp,image/gif"
                    type="file"
                    onChange={(event) => {
                      void handleAttachmentUpload(event.target.files?.[0]);
                      event.target.value = '';
                    }}
                  />
                </label>
              </div>
              <input
                maxLength={2000}
                placeholder="Nhập tin nhắn..."
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
              />
              <button
                className="primary-button inline-button"
                type="submit"
                disabled={!isConnected || !draft.trim() || uploadAttachment.isPending}
              >
                <Send size={17} aria-hidden="true" />
                Gửi
              </button>
            </form>
          </>
        )}
      </section>

      {isGroupDetailsOpen && selectedConversation?.type === 'GROUP' && (
        <div className="modal-backdrop" role="dialog" aria-modal="true" aria-label="Thông tin nhóm chat">
          <section className="surface profile-modal chat-group-modal">
            <button
              className="icon-button modal-close-button"
              type="button"
              onClick={() => setIsGroupDetailsOpen(false)}
              aria-label="Đóng thông tin nhóm"
            >
              <X size={18} aria-hidden="true" />
            </button>

            <div className="profile-modal-header">
              <UserAvatar name={selectedTitle} src={selectedAvatarUrl} size="lg" />
              <div>
                <p className="page-eyebrow">Nhóm chat</p>
                <h2>{selectedTitle}</h2>
                <p>{selectedConversation.memberIds.length} thành viên</p>
                <label className="secondary-button inline-button chat-avatar-upload">
                  <ImageIcon size={16} aria-hidden="true" />
                  Đổi ảnh nhóm
                  <input
                    accept="image/jpeg,image/png,image/webp,image/gif"
                    type="file"
                    onChange={(event) => {
                      void handleGroupAvatarUpload(event.target.files?.[0]);
                      event.target.value = '';
                    }}
                  />
                </label>
              </div>
            </div>

            <form className="chat-group-section" onSubmit={handleAddMember}>
              <h3>Thêm thành viên</h3>
              <MemberPicker
                label="Tìm thành viên"
                selectedMembers={memberToAdd}
                onSelect={(member) => setMemberToAdd((current) => [...current, member])}
                onRemove={(memberId) => setMemberToAdd((current) => current.filter((member) => member.id !== memberId))}
                excludeIds={selectedConversation.memberIds}
              />
              <button
                className="secondary-button inline-button"
                type="submit"
                disabled={addMember.isPending || memberToAdd.length === 0}
              >
                Thêm vào nhóm
              </button>
            </form>

            <section className="chat-group-section">
              <h3>Thành viên nhóm</h3>
              <div className="chat-member-list">
                {selectedConversation.memberIds.map((memberId) => {
                  const name = getMemberName(selectedConversation, memberId);
                  return (
                    <div className="chat-member-row" key={memberId}>
                      <button type="button" onClick={() => openMemberProfile(memberId)}>
                        <UserAvatar name={name} src={getMemberAvatar(memberId)} size="sm" />
                        <span>
                          <strong>{name}</strong>
                          <small>{memberMap[memberId]?.organizationName ?? 'Chưa có TDP'}</small>
                        </span>
                      </button>
                      {memberId !== user?.memberId && (
                        <button
                          className="text-action danger"
                          type="button"
                          onClick={() => handleRemoveMember(memberId)}
                          disabled={removeMember.isPending}
                        >
                          Xóa
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </section>

            <button
              className="danger-button inline-button"
              type="button"
              onClick={handleLeaveGroup}
              disabled={removeMember.isPending}
            >
              <LogOut size={16} aria-hidden="true" />
              Rời nhóm
            </button>
          </section>
        </div>
      )}

      {profileMemberId && (
        <div className="modal-backdrop" role="dialog" aria-modal="true" aria-label="Hồ sơ đoàn viên">
          <section className="surface profile-modal">
            <button
              className="icon-button modal-close-button"
              type="button"
              onClick={() => setProfileMemberId(null)}
              aria-label="Đóng hồ sơ"
            >
              <X size={18} aria-hidden="true" />
            </button>

            {selectedProfileQuery.isLoading && <LoadingSkeleton rows={5} />}
            {selectedProfileQuery.error && (
              <section className="error-box">{toApiError(selectedProfileQuery.error).message}</section>
            )}

            {selectedProfile && (
              <>
                <div className="profile-modal-header">
                  <UserAvatar
                    name={selectedProfile.fullName}
                    src={resolveAssetUrl(selectedProfile.avatarUrl)}
                    size="lg"
                  />
                  <div>
                    <p className="page-eyebrow">Hồ sơ đoàn viên</p>
                    <h2>{selectedProfile.fullName}</h2>
                    <p>{selectedProfile.organizationName || 'Chưa có TDP'}</p>
                    <div className="form-actions section-gap">
                      <Badge tone="green">{memberStatusLabel[selectedProfile.memberStatus]}</Badge>
                      <Badge tone="blue">{roleLabel[selectedProfile.memberRole] ?? selectedProfile.memberRole}</Badge>
                    </div>
                  </div>
                </div>

                <div className="detail-grid profile-modal-detail">
                  <div>
                    <span>Email</span>
                    <strong>{selectedProfile.email || '-'}</strong>
                  </div>
                  <div>
                    <span>Số điện thoại</span>
                    <strong>{selectedProfile.phone || '-'}</strong>
                  </div>
                  <div>
                    <span>Ngày sinh</span>
                    <strong>{selectedProfile.dateOfBirth || '-'}</strong>
                  </div>
                  <div>
                    <span>Giới tính</span>
                    <strong>{selectedProfile.gender ? genderLabel[selectedProfile.gender] : '-'}</strong>
                  </div>
                  <div>
                    <span>Địa chỉ</span>
                    <strong>{selectedProfile.address || '-'}</strong>
                  </div>
                  <div>
                    <span>Ngày vào Đoàn</span>
                    <strong>{selectedProfile.youthUnionJoinDate || '-'}</strong>
                  </div>
                </div>
              </>
            )}
          </section>
        </div>
      )}
    </div>
  );
};
