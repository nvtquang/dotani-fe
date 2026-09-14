import type { Role } from '../types/api';
import type { Gender, MemberRole, MemberStatus } from '../types/member';
import type { EventStatus, EventType, ParticipationStatus } from '../types/event';
import type { PostStatus, PostType } from '../types/post';

export const roleLabel: Record<Role | MemberRole, string> = {
  WARD_SECRETARY: 'Bí thư phường',
  WARD_DEPUTY_SECRETARY: 'Phó bí thư phường',
  TDP_SECRETARY: 'Bí thư TDP',
  TDP_DEPUTY_SECRETARY: 'Phó bí thư TDP',
  MEMBER: 'Đoàn viên',
};

export const memberStatusLabel: Record<MemberStatus, string> = {
  ACTIVE: 'Đang hoạt động',
  PENDING: 'Chờ duyệt',
  INACTIVE: 'Không hoạt động',
};

export const genderLabel: Record<Gender, string> = {
  MALE: 'Nam',
  FEMALE: 'Nữ',
  OTHER: 'Khác',
};

export const eventTypeLabel: Record<EventType, string> = {
  EVENT: 'Sự kiện',
  MEETING: 'Họp',
  CONGRESS: 'Đại hội',
  TASK: 'Công việc',
  ACTIVITY: 'Hoạt động',
};

export const eventStatusLabel: Record<EventStatus, string> = {
  DRAFT: 'Bản nháp',
  PUBLISHED: 'Đã công bố',
  CANCELLED: 'Đã hủy',
  COMPLETED: 'Hoàn thành',
};

export const participationStatusLabel: Record<ParticipationStatus, string> = {
  GOING: 'Tham gia',
  NOT_GOING: 'Không tham gia',
  UNDECIDED: 'Chưa chắc',
};

export const postTypeLabel: Record<PostType, string> = {
  NEWS: 'Tin tức',
  ANNOUNCEMENT: 'Thông báo',
  ACTIVITY_REPORT: 'Báo cáo hoạt động',
  OTHER: 'Khác',
};

export const postStatusLabel: Record<PostStatus, string> = {
  DRAFT: 'Bản nháp',
  PUBLISHED: 'Đã xuất bản',
  ARCHIVED: 'Đã lưu trữ',
};

export const shortId = (value?: string | null) => (value ? value.slice(0, 8) : '-');
