import type { Role } from '../types/api';
import type { Gender, MemberRole, MemberStatus } from '../types/member';
import type { EventStatus, EventType, ParticipationStatus } from '../types/event';
import type { PostStatus, PostType } from '../types/post';
import type { FeePeriodStatus, PaymentMethod } from '../types/fee';
import type { TransferStatus } from '../types/transfer';
import type { AwardForm, RatingLevel } from '../types/emulation';
import type { ReactionType } from '../types/engagement';
import type { PollStatus, ResultsVisibility } from '../types/poll';

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

export const feePeriodStatusLabel: Record<FeePeriodStatus, string> = {
  OPEN: 'Đang thu',
  CLOSED: 'Đã đóng',
};

export const paymentMethodLabel: Record<PaymentMethod, string> = {
  CASH: 'Tiền mặt',
  TRANSFER: 'Chuyển khoản',
};

export const transferStatusLabel: Record<TransferStatus, string> = {
  PENDING: 'Chờ duyệt',
  APPROVED: 'Đã duyệt',
  REJECTED: 'Từ chối',
  CANCELLED: 'Đã hủy',
};

export const awardFormLabel: Record<AwardForm, string> = {
  PRAISE: 'Tuyên dương',
  CERTIFICATE_OF_MERIT: 'Giấy khen',
  HONOR_CERTIFICATE: 'Bằng khen',
  OTHER_COMMENDATION: 'Khen thưởng khác',
  REPRIMAND: 'Khiển trách',
  WARNING: 'Cảnh cáo',
  EXPULSION: 'Khai trừ',
};

export const ratingLabel: Record<RatingLevel, string> = {
  EXCELLENT: 'Hoàn thành xuất sắc nhiệm vụ',
  GOOD: 'Hoàn thành tốt nhiệm vụ',
  COMPLETED: 'Hoàn thành nhiệm vụ',
  NOT_COMPLETED: 'Không hoàn thành nhiệm vụ',
};

export const reactionLabel: Record<ReactionType, { emoji: string; label: string }> = {
  LIKE: { emoji: '👍', label: 'Thích' },
  LOVE: { emoji: '❤️', label: 'Yêu thích' },
  HAHA: { emoji: '😆', label: 'Haha' },
  WOW: { emoji: '😮', label: 'Wow' },
  SAD: { emoji: '😢', label: 'Buồn' },
};

export const pollStatusLabel: Record<PollStatus, string> = {
  DRAFT: 'Bản nháp',
  OPEN: 'Đang mở',
  CLOSED: 'Đã kết thúc',
};

export const resultsVisibilityLabel: Record<ResultsVisibility, string> = {
  ALWAYS: 'Luôn hiện kết quả',
  AFTER_VOTE: 'Hiện sau khi đã biểu quyết',
  AFTER_CLOSE: 'Chỉ hiện khi kết thúc',
};

/** "60.000 đ" */
export const formatMoney = (value?: number | null) => (value === null || value === undefined ? '-' : `${value.toLocaleString('vi-VN')} đ`);

/** "33,3%" or "-" when there is no rate. */
export const formatRate = (rate?: number | null) =>
  rate === null || rate === undefined ? '-' : `${(rate * 100).toLocaleString('vi-VN', { maximumFractionDigits: 1 })}%`;

export const shortId = (value?: string | null) => (value ? value.slice(0, 8) : '-');
