import { useLayoutEffect, useMemo, useRef } from 'react';
import { CheckCheck, Paperclip } from 'lucide-react';
import { Button, UserAvatar, cn } from '../../components/ui';
import type { Conversation, Message } from '../../types/chat';
import { resolveAssetUrl } from '../../utils/assetUrl';
import { formatDayLabel, formatFull, formatTime } from '../../utils/dateTime';
import { groupMessages, memberName, seenBy, type MemberMap } from './chatUtils';

type MessageListProps = {
  conversation: Conversation;
  messages: Message[];
  members: MemberMap;
  me?: string | null;
  typingNames: string[];
  hasOlder: boolean;
  loadingOlder: boolean;
  onLoadOlder: () => void;
  onOpenProfile: (memberId: string) => void;
};

const Bubble = ({ message, mine }: { message: Message; mine: boolean }) => {
  const url = message.attachmentUrl ? resolveAssetUrl(message.attachmentUrl) : null;
  const showText = !message.attachmentUrl || message.content !== message.attachmentName;
  return (
    <div className={cn('flex max-w-[85%] flex-col gap-1 sm:max-w-[70%]', mine ? 'items-end' : 'items-start')}>
      {url && message.attachmentKind === 'IMAGE' && (
        <a href={url} target="_blank" rel="noreferrer" className="overflow-hidden rounded-2xl border border-slate-200">
          <img src={url} alt={message.attachmentName ?? 'Ảnh'} loading="lazy" className="max-h-72 w-auto max-w-full object-cover" />
        </a>
      )}
      {url && message.attachmentKind !== 'IMAGE' && (
        <a
          href={url}
          target="_blank"
          rel="noreferrer"
          className={cn('flex items-center gap-2 rounded-2xl px-3 py-2 text-sm font-medium underline', mine ? 'bg-brand-600 text-white' : 'bg-slate-100 text-slate-900')}
        >
          <Paperclip size={16} aria-hidden="true" />
          <span className="break-all">{message.attachmentName ?? message.content}</span>
        </a>
      )}
      {showText && (
        <p
          title={formatFull(message.createdAt)}
          className={cn(
            'rounded-2xl px-3.5 py-2 text-[15px] leading-snug break-words whitespace-pre-wrap',
            mine ? 'bg-brand-600 text-white' : 'bg-slate-100 text-slate-900',
          )}
        >
          {message.content}
        </p>
      )}
    </div>
  );
};

export const MessageList = ({ conversation, messages, members, me, typingNames, hasOlder, loadingOlder, onLoadOlder, onOpenProfile }: MessageListProps) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const sections = useMemo(() => groupMessages(messages), [messages]);
  const lastMine = [...messages].reverse().find((message) => message.senderId === me);
  const seen = lastMine ? seenBy(conversation, lastMine) : [];
  const newest = messages[messages.length - 1];

  // Keep the reader's place: stick to the bottom for new messages (if already near it, or if it is mine),
  // keep the visible message steady when older history is prepended above.
  const stateRef = useRef({ conversationId: '', newestId: '', height: 0 });
  useLayoutEffect(() => {
    const element = scrollRef.current;
    if (!element) return;
    const previous = stateRef.current;
    const switched = previous.conversationId !== conversation.id;
    const newMessage = newest && newest.id !== previous.newestId;
    // distance from the bottom as it was before this render added content
    const nearBottom = previous.height - element.scrollTop - element.clientHeight < 160;
    if (switched || (newMessage && (newest.senderId === me || nearBottom))) {
      element.scrollTop = element.scrollHeight;
    } else if (!newMessage && element.scrollHeight > previous.height && previous.height > 0) {
      element.scrollTop += element.scrollHeight - previous.height;
    }
    stateRef.current = { conversationId: conversation.id, newestId: newest?.id ?? '', height: element.scrollHeight };
  }, [conversation.id, newest, me, messages.length]);

  return (
    <div ref={scrollRef} className="min-h-0 flex-1 overflow-y-auto px-3 py-4 sm:px-5" role="log" aria-live="polite" aria-label="Tin nhắn">
      {hasOlder && (
        <div className="mb-4 flex justify-center">
          <Button variant="secondary" size="sm" loading={loadingOlder} onClick={onLoadOlder}>
            Tải tin cũ hơn
          </Button>
        </div>
      )}
      {messages.length === 0 && !hasOlder && <p className="py-10 text-center text-sm text-slate-600">Chưa có tin nhắn. Hãy gửi lời chào!</p>}

      {sections.map((section) => (
        <section key={section.day} aria-label={formatDayLabel(section.day)}>
          <div className="my-4 flex items-center gap-3 text-xs font-medium text-slate-600" role="separator">
            <span className="h-px flex-1 bg-slate-200" />
            {formatDayLabel(section.day)}
            <span className="h-px flex-1 bg-slate-200" />
          </div>
          {section.groups.map((group) => {
            const mine = group.senderId === me;
            const name = memberName(group.senderId, conversation, members, me);
            return (
              <div key={group.key} className={cn('mb-3 flex gap-2', mine ? 'flex-row-reverse' : 'flex-row')}>
                {!mine && (
                  <button type="button" onClick={() => onOpenProfile(group.senderId)} className="self-end rounded-full" aria-label={`Xem hồ sơ ${name}`}>
                    <UserAvatar name={name} src={resolveAssetUrl(members[group.senderId]?.avatarUrl)} size="xs" />
                  </button>
                )}
                <div className={cn('flex min-w-0 flex-1 flex-col gap-0.5', mine ? 'items-end' : 'items-start')}>
                  {!mine && conversation.type === 'GROUP' && <span className="px-1 text-xs font-medium text-slate-600">{name}</span>}
                  {group.messages.map((message) => (
                    <Bubble key={message.id} message={message} mine={mine} />
                  ))}
                  <span className="px-1 text-[11px] text-slate-600">
                    <time dateTime={group.messages[group.messages.length - 1].createdAt}>{formatTime(group.messages[group.messages.length - 1].createdAt)}</time>
                    {mine && lastMine && group.messages.some((message) => message.id === lastMine.id) && (
                      <span className="ml-1.5 inline-flex items-center gap-0.5">
                        {seen.length > 0 ? (
                          <>
                            <CheckCheck size={13} className="text-brand-600" aria-hidden="true" />
                            {conversation.type === 'DIRECT'
                              ? 'Đã xem'
                              : `Đã xem bởi ${seen.length === 1 ? memberName(seen[0], conversation, members, me) : `${seen.length} người`}`}
                          </>
                        ) : (
                          'Đã gửi'
                        )}
                      </span>
                    )}
                  </span>
                </div>
              </div>
            );
          })}
        </section>
      ))}

      {typingNames.length > 0 && (
        <div className="flex items-center gap-2 px-1 text-sm text-slate-600" aria-live="polite">
          <span className="inline-flex gap-1 rounded-full bg-slate-100 px-3 py-2" aria-hidden="true">
            {[0, 150, 300].map((delay) => (
              <span key={delay} className="size-1.5 animate-bounce rounded-full bg-slate-500" style={{ animationDelay: `${delay}ms` }} />
            ))}
          </span>
          {typingNames.length === 1 ? `${typingNames[0]} đang nhập…` : `${typingNames.length} người đang nhập…`}
        </div>
      )}
    </div>
  );
};
