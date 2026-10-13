import { useEffect, useId, useMemo, useRef, useState, type KeyboardEvent, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { CalendarDays, CornerDownLeft, FileText, Search, X } from 'lucide-react';
import { UserAvatar, cn } from '../ui';
import { useSearch } from '../../hooks/useFeed';
import { navigationFor, navLabel, isTdpRole, isWardRole } from '../../routes/navigation';
import { useAuth } from '../../stores/AuthContext';
import { resolveAssetUrl } from '../../utils/assetUrl';
import { formatDate } from '../../utils/dateTime';
import { normalizeText } from '../../utils/text';

const OPEN_EVENT = 'dotani:open-search';

/** Opens the palette from anywhere (e.g. the search button in the top bar). */
export const openCommandPalette = () => window.dispatchEvent(new Event(OPEN_EVENT));

type Option = { id: string; group: string; label: string; detail?: string; icon: ReactNode; to: string };

const useDebounced = (value: string, delay: number) => {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = window.setTimeout(() => setDebounced(value), delay);
    return () => window.clearTimeout(timer);
  }, [value, delay]);
  return debounced;
};

/** Ctrl+K / ⌘K: jump to a page, or find members, events and posts. */
export const CommandPalette = () => {
  const { user, role } = useAuth();
  const navigate = useNavigate();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listId = useId();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [active, setActive] = useState(0);
  const debounced = useDebounced(query.trim(), 250);
  const searchQuery = useSearch(open ? debounced : '');

  useEffect(() => {
    const onKey = (event: globalThis.KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        setOpen((current) => !current);
      }
    };
    const onOpen = () => setOpen(true);
    window.addEventListener('keydown', onKey);
    window.addEventListener(OPEN_EVENT, onOpen);
    return () => {
      window.removeEventListener('keydown', onKey);
      window.removeEventListener(OPEN_EVENT, onOpen);
    };
  }, []);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) {
      dialog.showModal();
      setQuery('');
      setActive(0);
      inputRef.current?.focus();
    } else if (!open && dialog.open) {
      dialog.close();
    }
  }, [open]);

  const options = useMemo<Option[]>(() => {
    // Members: officers open the profile when it is in their scope, everyone else starts a chat.
    const memberTarget = (memberId: string, organizationId: string) =>
      isWardRole(role) || (isTdpRole(role) && organizationId === user?.tdpId) ? `/members/${memberId}` : `/chat?with=${memberId}`;
    const needle = normalizeText(query);
    const pages: Option[] = navigationFor(role)
      .filter((item) => !needle || normalizeText(`${navLabel(item, role)} ${item.keywords ?? ''}`).includes(needle))
      .map((item) => {
        const Icon = item.icon;
        return { id: `nav-${item.to}`, group: 'Trang', label: navLabel(item, role), icon: <Icon size={18} aria-hidden="true" />, to: item.to };
      });

    const results = debounced.length >= 2 ? searchQuery.data : undefined;
    const members: Option[] = (results?.members ?? [])
      .filter((member) => member.id !== user?.memberId)
      .map((member) => ({
        id: `member-${member.id}`,
        group: 'Đoàn viên',
        label: member.fullName,
        detail: member.organizationName ?? undefined,
        icon: <UserAvatar name={member.fullName} src={resolveAssetUrl(member.avatarUrl)} size="xs" />,
        to: memberTarget(member.id, member.organizationId),
      }));
    const events: Option[] = (results?.events ?? []).map((event) => ({
      id: `event-${event.id}`,
      group: 'Sự kiện',
      label: event.title,
      detail: formatDate(event.startTime),
      icon: <CalendarDays size={18} aria-hidden="true" />,
      to: `/events/${event.id}`,
    }));
    const posts: Option[] = (results?.posts ?? []).map((post) => ({
      id: `post-${post.id}`,
      group: 'Bài viết',
      label: post.title,
      detail: post.organizationName ?? undefined,
      icon: <FileText size={18} aria-hidden="true" />,
      to: `/posts/${post.id}`,
    }));
    return [...pages, ...members, ...events, ...posts];
  }, [query, debounced, searchQuery.data, role, user?.memberId, user?.tdpId]);

  useEffect(() => setActive(0), [query]);

  const choose = (option: Option | undefined) => {
    if (!option) return;
    setOpen(false);
    navigate(option.to);
  };

  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      const step = event.key === 'ArrowDown' ? 1 : -1;
      setActive((current) => (options.length ? (current + step + options.length) % options.length : 0));
    } else if (event.key === 'Enter') {
      event.preventDefault();
      choose(options[active]);
    }
  };

  useEffect(() => {
    document.getElementById(`${listId}-${active}`)?.scrollIntoView({ block: 'nearest' });
  }, [active, listId]);

  const isSearching = debounced.length >= 2 && searchQuery.isFetching;
  let lastGroup = '';

  return (
    <dialog
      ref={dialogRef}
      aria-label="Tìm kiếm"
      onCancel={(event) => {
        event.preventDefault();
        setOpen(false);
      }}
      onClick={(event) => event.target === dialogRef.current && setOpen(false)}
      className="fixed inset-x-0 top-0 m-0 h-dvh max-h-none w-full max-w-none bg-white p-0 shadow-overlay open:flex open:flex-col sm:top-[12vh] sm:mx-auto sm:h-auto sm:max-h-[70vh] sm:max-w-xl sm:rounded-2xl"
    >
      {open && (
        <>
          <div className="flex items-center gap-2 border-b border-slate-200 px-4">
            <Search size={18} className="shrink-0 text-slate-600" aria-hidden="true" />
            <input
              ref={inputRef}
              role="combobox"
              aria-expanded="true"
              aria-controls={listId}
              aria-activedescendant={options.length ? `${listId}-${active}` : undefined}
              aria-autocomplete="list"
              aria-label="Tìm trang, đoàn viên, sự kiện, bài viết"
              placeholder="Tìm trang, đoàn viên, sự kiện, bài viết…"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              onKeyDown={onKeyDown}
              className="h-14 min-w-0 flex-1 bg-transparent text-base outline-none placeholder:text-slate-500"
            />
            {isSearching && <span className="size-4 animate-spin rounded-full border-2 border-brand-600 border-r-transparent" aria-hidden="true" />}
            <button type="button" onClick={() => setOpen(false)} className="inline-flex size-10 items-center justify-center rounded-lg text-slate-600 hover:bg-slate-100" aria-label="Đóng tìm kiếm">
              <X size={18} aria-hidden="true" />
            </button>
          </div>

          <ul id={listId} role="listbox" aria-label="Kết quả" className="min-h-0 flex-1 overflow-y-auto p-2">
            {options.map((option, index) => {
              const header = option.group !== lastGroup ? option.group : null;
              lastGroup = option.group;
              return (
                <li key={option.id} role="presentation">
                  {header && <p className="px-3 pt-3 pb-1 text-xs font-semibold text-slate-600 uppercase" aria-hidden="true">{header}</p>}
                  <div
                    id={`${listId}-${index}`}
                    role="option"
                    aria-selected={index === active}
                    onMouseMove={() => setActive(index)}
                    onClick={() => choose(option)}
                    className={cn(
                      'flex min-h-11 cursor-pointer items-center gap-3 rounded-lg px-3 py-2 text-sm',
                      index === active ? 'bg-brand-50 text-brand-800' : 'text-slate-800',
                    )}
                  >
                    <span className="flex size-7 shrink-0 items-center justify-center text-slate-600">{option.icon}</span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-medium">{option.label}</span>
                      {option.detail && <span className="block truncate text-xs text-slate-600">{option.detail}</span>}
                    </span>
                    {index === active && <CornerDownLeft size={16} className="shrink-0 text-slate-500" aria-hidden="true" />}
                  </div>
                </li>
              );
            })}
            {options.length === 0 && (
              <li className="px-3 py-8 text-center text-sm text-slate-600">
                {debounced.length < 2 ? 'Nhập ít nhất 2 ký tự để tìm.' : isSearching ? 'Đang tìm…' : 'Không tìm thấy kết quả.'}
              </li>
            )}
          </ul>

          <p className="hidden border-t border-slate-200 px-4 py-2 text-xs text-slate-600 sm:block">
            <kbd className="rounded border border-slate-300 px-1">↑</kbd> <kbd className="rounded border border-slate-300 px-1">↓</kbd> để chọn ·{' '}
            <kbd className="rounded border border-slate-300 px-1">Enter</kbd> để mở · <kbd className="rounded border border-slate-300 px-1">Esc</kbd> để đóng
          </p>
        </>
      )}
    </dialog>
  );
};
