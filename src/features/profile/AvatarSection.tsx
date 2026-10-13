import { useRef, type ReactNode } from 'react';
import { Camera, Trash2 } from 'lucide-react';
import { Button, Card, UserAvatar } from '../../components/ui';
import type { Member } from '../../types/member';
import { resolveAssetUrl } from '../../utils/assetUrl';

type AvatarSectionProps = {
  member: Member;
  subtitle?: ReactNode;
  isUploading?: boolean;
  isDeleting?: boolean;
  onUpload: (file: File) => void;
  onDelete: () => void;
};

/** Profile header: photo, name, and the photo actions. */
export const AvatarSection = ({ member, subtitle, isUploading, isDeleting, onUpload, onDelete }: AvatarSectionProps) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  return (
    <Card className="flex flex-col items-center gap-4 p-5 text-center sm:flex-row sm:text-left">
      <UserAvatar name={member.fullName} src={resolveAssetUrl(member.avatarUrl)} size="lg" />
      <div className="min-w-0 flex-1">
        <h1 className="text-xl font-bold text-slate-900">{member.fullName}</h1>
        {subtitle && <div className="mt-1 text-sm text-slate-600">{subtitle}</div>}
        <div className="mt-3 flex flex-wrap justify-center gap-2 sm:justify-start">
          <input
            ref={fileInputRef}
            className="sr-only"
            type="file"
            tabIndex={-1}
            aria-hidden="true"
            accept="image/jpeg,image/png,image/webp"
            onChange={(event) => {
              const file = event.target.files?.[0];
              event.target.value = '';
              if (file) onUpload(file);
            }}
          />
          <Button size="sm" variant="secondary" loading={isUploading} onClick={() => fileInputRef.current?.click()}>
            <Camera size={16} aria-hidden="true" />
            Đổi ảnh đại diện
          </Button>
          {member.avatarUrl && (
            <Button size="sm" variant="ghost" loading={isDeleting} onClick={onDelete}>
              <Trash2 size={16} aria-hidden="true" />
              Xóa ảnh
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
};
