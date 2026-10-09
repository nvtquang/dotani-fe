import { useRef, useState } from 'react';
import { Upload } from 'lucide-react';
import type { Member } from '../../types/member';
import { resolveAssetUrl } from '../../utils/assetUrl';

type AvatarSectionProps = {
  member: Member;
  isUploading?: boolean;
  isDeleting?: boolean;
  onUpload: (file: File) => void;
  onDelete: () => void;
};

export const AvatarSection = ({ member, isUploading, isDeleting, onUpload, onDelete }: AvatarSectionProps) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const avatarUrl = resolveAssetUrl(member.avatarUrl);
  const [failedUrl, setFailedUrl] = useState<string | null>(null);

  return (
    <section className="surface profile-card">
      <div className="avatar-preview">
        {avatarUrl && failedUrl !== avatarUrl ? (
          <img src={avatarUrl} alt={member.fullName} onError={() => setFailedUrl(avatarUrl)} />
        ) : (
          <span>{member.fullName.charAt(0)}</span>
        )}
      </div>
      <div>
        <p className="page-eyebrow">Hồ sơ đoàn viên</p>
        <h2>{member.fullName}</h2>
        <p className="page-description">Ảnh đại diện hỗ trợ jpg, jpeg, png, webp theo validation backend.</p>
        <div className="form-actions section-gap">
          <input
            ref={fileInputRef}
            className="visually-hidden"
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) {
                onUpload(file);
                event.target.value = '';
              }
            }}
          />
          <button
            className="primary-button inline-button"
            type="button"
            disabled={isUploading}
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload size={17} aria-hidden="true" />
            Tải avatar
          </button>
          <button
            className="secondary-button inline-button"
            type="button"
            disabled={isDeleting || !member.avatarUrl}
            onClick={onDelete}
          >
            Xóa avatar
          </button>
        </div>
      </div>
    </section>
  );
};
