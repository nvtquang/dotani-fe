import { useState } from 'react';
import { Checkbox, cn } from '../../components/ui';
import type { OrganizationUnit } from '../../types/organization';

type ScopeFieldProps = {
  /** all units the user can see (ward + TDPs) */
  organizations: OrganizationUnit[];
  value: string[];
  onChange: (ids: string[]) => void;
  /** creating: several TDPs at once (one record each); editing: exactly one unit */
  multiple: boolean;
  error?: string;
  /** what the ward option means for this kind of content */
  wardHint: string;
};

/** "Toàn phường" or a set of TDPs. */
export const ScopeField = ({ organizations, value, onChange, multiple, error, wardHint }: ScopeFieldProps) => {
  const ward = organizations.find((organization) => organization.type === 'WARD');
  const branches = organizations.filter((organization) => organization.type === 'YOUTH_UNION_BRANCH');
  const [scope, setScope] = useState<'WARD' | 'TDP'>(ward && value[0] === ward.id ? 'WARD' : 'TDP');

  const chooseScope = (next: 'WARD' | 'TDP') => {
    setScope(next);
    onChange(next === 'WARD' && ward ? [ward.id] : []);
  };

  const toggle = (id: string) =>
    onChange(multiple ? (value.includes(id) ? value.filter((item) => item !== id) : [...value, id]) : [id]);

  return (
    <fieldset className="sm:col-span-2">
      <legend className="text-sm font-medium text-slate-800">Phạm vi</legend>
      {ward && (
        <div className="mt-2 inline-flex rounded-lg border border-slate-300 p-0.5" role="radiogroup" aria-label="Phạm vi">
          {(['WARD', 'TDP'] as const).map((option) => (
            <button
              key={option}
              type="button"
              role="radio"
              aria-checked={scope === option}
              onClick={() => chooseScope(option)}
              className={cn('h-9 rounded-md px-3 text-sm font-medium', scope === option ? 'bg-brand-600 text-white' : 'text-slate-700 hover:bg-slate-100')}
            >
              {option === 'WARD' ? 'Toàn phường' : 'Tổ dân phố'}
            </button>
          ))}
        </div>
      )}
      {scope === 'WARD' && ward ? (
        <p className="mt-2 text-sm text-slate-600">{wardHint}</p>
      ) : (
        <>
          {multiple && (
            <div className="mt-2 flex items-center gap-3 text-sm">
              <span className="text-slate-600">{value.length} đã chọn</span>
              <button type="button" className="font-medium text-brand-700 hover:underline" onClick={() => onChange(branches.map((item) => item.id))}>
                Chọn tất cả
              </button>
              <button type="button" className="font-medium text-slate-700 hover:underline" onClick={() => onChange([])}>
                Bỏ chọn
              </button>
            </div>
          )}
          <div className="mt-2 grid max-h-56 grid-cols-1 gap-x-4 overflow-y-auto rounded-lg border border-slate-200 px-3 py-1 sm:grid-cols-2">
            {branches.map((branch) => (
              <Checkbox
                key={branch.id}
                label={branch.name}
                type={multiple ? 'checkbox' : 'radio'}
                name="scope-organization"
                checked={value.includes(branch.id)}
                onChange={() => toggle(branch.id)}
              />
            ))}
          </div>
          {multiple && value.length > 1 && <p className="mt-1 text-xs text-slate-600">Mỗi tổ dân phố được tạo một bản riêng.</p>}
        </>
      )}
      {error && (
        <p className="mt-1 text-xs font-medium text-accent-700" role="alert">
          {error}
        </p>
      )}
    </fieldset>
  );
};
