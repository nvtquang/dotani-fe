import type { Conversation, Message } from '../../types/chat';
import type { MemberDirectoryItem } from '../../types/member';
import { isSameDay } from '../../utils/dateTime';

export type MemberMap = Record<string, MemberDirectoryItem>;

export const otherMemberId = (conversation: Conversation | null | undefined, me?: string | null) =>
  conversation?.type === 'DIRECT' ? (conversation.memberIds.find((id) => id !== me) ?? null) : null;

export const memberName = (id: string, conversation: Conversation | null | undefined, members: MemberMap, me?: string | null) => {
  if (id === me) return 'Bạn';
  return members[id]?.fullName ?? conversation?.memberNames?.[id] ?? 'Thành viên';
};

export const conversationTitle = (conversation: Conversation, members: MemberMap, me?: string | null) => {
  if (conversation.title) return conversation.title;
  const other = otherMemberId(conversation, me);
  if (other) return memberName(other, conversation, members, me);
  const names = conversation.memberIds
    .filter((id) => id !== me)
    .map((id) => memberName(id, conversation, members, me))
    .slice(0, 3);
  return names.length ? names.join(', ') : 'Nhóm chat';
};

export const conversationActivity = (conversation: Conversation) =>
  new Date(conversation.lastMessageAt ?? conversation.updatedAt ?? conversation.createdAt ?? 0).getTime();

/** A run of messages from one sender, close in time, drawn as one block. */
export type MessageGroup = { key: string; senderId: string; messages: Message[] };
export type DaySection = { day: string; groups: MessageGroup[] };

const GROUP_GAP_MS = 5 * 60_000;

export const groupMessages = (messages: Message[]): DaySection[] => {
  const sections: DaySection[] = [];
  messages.forEach((message) => {
    const created = new Date(message.createdAt);
    let section = sections[sections.length - 1];
    if (!section || !isSameDay(new Date(section.day), created)) {
      section = { day: message.createdAt, groups: [] };
      sections.push(section);
    }
    const group = section.groups[section.groups.length - 1];
    const last = group?.messages[group.messages.length - 1];
    if (group && group.senderId === message.senderId && last && created.getTime() - new Date(last.createdAt).getTime() < GROUP_GAP_MS) {
      group.messages.push(message);
    } else {
      section.groups.push({ key: message.id, senderId: message.senderId, messages: [message] });
    }
  });
  return sections;
};

/** Members other than the sender who have read up to (or past) the message. */
export const seenBy = (conversation: Conversation, message: Message) =>
  Object.entries(conversation.readStates ?? {})
    .filter(([memberId, readAt]) => memberId !== message.senderId && readAt && new Date(readAt) >= new Date(message.createdAt))
    .map(([memberId]) => memberId);
