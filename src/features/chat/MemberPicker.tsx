import { useId, useState } from 'react';
import { Search, X } from 'lucide-react';
import { Input, LoadingSkeleton, UserAvatar } from '../../components/ui';
import { useMemberDirectory } from '../../hooks/useMembers';
import type { MemberDirectoryItem } from '../../types/member';
import { resolveAssetUrl } from '../../utils/assetUrl';

type MemberPickerProps = {
  label: string;
  selected: MemberDirectoryItem[];
  onChange: (members: MemberDirectoryItem[]) => void;
  excludeIds?: string[];
  /** false: picking someone replaces the current choice */
  multiple?: boolean;
  autoFocus?: boolean;
};

/** Search the member directory and pick one or more people. */
export const MemberPicker = ({ label, selected, onChange, excludeIds = [], multiple = true, autoFocus }: MemberPickerProps) => {
  const inputId = useId();
  const [keyword, setKeyword] = useState('');
  const trimmed = keyword.trim();
  const directory = useMemberDirectory(trimmed);
  const blocked = new Set([...excludeIds, ...selected.map((member) => member.id)]);
  const options = (directory.data?.content ?? []).filter((member) => !blocked.has(member.id));

  const choose = (member: MemberDirectoryItem) => {
    onChange(multiple ? [...selected, member] : [member]);
    setKeyword('');
  };

  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={inputId} className="text-sm font-medium text-slate-800">
        {label}
      </label>
      {selected.length > 0 && (
        <ul className="flex flex-wrap gap-1.5" aria-label="Đã chọn">
          {selected.map((member) => (
            <li key={member.id} className="inline-flex items-center gap-1.5 rounded-full bg-brand-50 py-1 pr-1 pl-1 text-sm text-brand-900">
              <UserAvatar name={member.fullName} src={resolveAssetUrl(member.avatarUrl)} size="xs" />
              {member.fullName}
              <button
                type="button"
                onClick={() => onChange(selected.filter((item) => item.id !== member.id))}
                className="inline-flex size-6 items-center justify-center rounded-full hover:bg-brand-100"
                aria-label={`Bỏ chọn ${member.fullName}`}
              >
                <X size={14} aria-hidden="true" />
              </button>
            </li>
          ))}
        </ul>
      )}
      <div className="relative">
        <Search size={16} className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-slate-500" aria-hidden="true" />
        <Input
          id={inputId}
          className="pl-9"
          placeholder="Tìm theo tên, số điện thoại hoặc email"
          value={keyword}
          autoFocus={autoFocus}
          autoComplete="off"
          onChange={(event) => setKeyword(event.target.value)}
        />
      </div>
      {trimmed.length > 0 && trimmed.length < 2 && <p className="text-xs text-slate-600">Nhập ít nhất 2 ký tự.</p>}
      {trimmed.length >= 2 && (
        <div className="max-h-60 overflow-y-auto rounded-lg border border-slate-200" aria-live="polite">
          {directory.isLoading && <LoadingSkeleton rows={2} />}
          {!directory.isLoading && options.length === 0 && <p className="p-3 text-sm text-slate-600">Không tìm thấy thành viên phù hợp.</p>}
          <ul>
            {options.map((member) => (
              <li key={member.id}>
                <button type="button" onClick={() => choose(member)} className="flex w-full items-center gap-3 px-3 py-2 text-left hover:bg-slate-50">
                  <UserAvatar name={member.fullName} src={resolveAssetUrl(member.avatarUrl)} size="sm" />
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-medium text-slate-900">{member.fullName}</span>
                    <span className="block truncate text-xs text-slate-600">{member.organizationName ?? 'Chưa có TDP'}</span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};
