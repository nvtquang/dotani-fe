import type { Event } from '../../types/event';

/** Seats left, or null when the event has no limit. */
export const seatsLeft = (event: Event) =>
  event.maxParticipants == null ? null : Math.max(0, event.maxParticipants - (event.goingCount ?? 0));

export const hasStarted = (event: Event, now = Date.now()) => new Date(event.startTime).getTime() <= now;

export const deadlinePassed = (event: Event, now = Date.now()) =>
  Boolean(event.registrationDeadline && new Date(event.registrationDeadline).getTime() < now);

/** Why registration is closed, or null when it is open. */
export const registrationClosedReason = (event: Event, now = Date.now()) => {
  if (event.status === 'CANCELLED') return 'Sự kiện đã bị hủy';
  if (event.status === 'COMPLETED' || hasStarted(event, now)) return 'Sự kiện đã diễn ra';
  if (event.status !== 'PUBLISHED') return 'Sự kiện chưa công bố';
  if (deadlinePassed(event, now)) return 'Đã hết hạn đăng ký';
  if (seatsLeft(event) === 0) return 'Đã đủ số lượng';
  return null;
};

export const seatsLabel = (event: Event) => {
  const left = seatsLeft(event);
  if (left === null) {
    return `${event.goingCount ?? 0} người tham gia`;
  }
  return left === 0 ? 'Đã đủ chỗ' : `Còn ${left}/${event.maxParticipants} chỗ`;
};
