import { useRef } from 'react';
import { FileText, Trash2, Upload } from 'lucide-react';
import { Button, Card, cn } from './ui';
import { resolveAssetUrl } from '../utils/assetUrl';

export type GalleryItem = { id: string; url: string; kind: string; name?: string | null };

type AttachmentGalleryProps = {
  title: string;
  items: GalleryItem[];
  /** shows the upload button and per-item delete when set */
  manage?: {
    accept: string;
    uploading: boolean;
    onUpload: (files: File[]) => void;
    onDelete: (id: string) => void;
  };
};

export const AttachmentGallery = ({ title, items, manage }: AttachmentGalleryProps) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const images = items.filter((item) => item.kind === 'IMAGE');
  const files = items.filter((item) => item.kind !== 'IMAGE');

  if (!manage && items.length === 0) {
    return null;
  }

  return (
    <Card className="p-4 sm:p-5">
      <div className="mb-3 flex items-center justify-between gap-2">
        <h2 className="text-base font-semibold text-slate-900">
          {title} {items.length > 0 && <span className="font-normal text-slate-600">({items.length})</span>}
        </h2>
        {manage && (
          <>
            <input
              ref={inputRef}
              type="file"
              multiple
              accept={manage.accept}
              className="sr-only"
              tabIndex={-1}
              aria-hidden="true"
              onChange={(event) => {
                const selected = Array.from(event.target.files ?? []);
                event.target.value = '';
                if (selected.length) manage.onUpload(selected);
              }}
            />
            <Button size="sm" variant="secondary" loading={manage.uploading} onClick={() => inputRef.current?.click()}>
              <Upload size={16} aria-hidden="true" />
              Tải lên
            </Button>
          </>
        )}
      </div>

      {items.length === 0 && <p className="text-sm text-slate-600">Chưa có tệp đính kèm.</p>}

      {images.length > 0 && (
        <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {images.map((item) => {
            const url = resolveAssetUrl(item.url) ?? '#';
            return (
              <li key={item.id} className="group relative overflow-hidden rounded-lg border border-slate-200 bg-slate-100">
                <a href={url} target="_blank" rel="noreferrer" aria-label={`Mở ảnh ${item.name ?? ''}`.trim()}>
                  <img src={url} alt={item.name ?? ''} loading="lazy" decoding="async" className="aspect-square w-full object-cover" />
                </a>
                {manage && (
                  <button
                    type="button"
                    onClick={() => manage.onDelete(item.id)}
                    className="absolute top-1.5 right-1.5 inline-flex size-9 items-center justify-center rounded-full bg-white/90 text-accent-700 shadow hover:bg-white"
                    aria-label={`Xóa ảnh ${item.name ?? ''}`.trim()}
                  >
                    <Trash2 size={16} aria-hidden="true" />
                  </button>
                )}
              </li>
            );
          })}
        </ul>
      )}

      {files.length > 0 && (
        <ul className={cn('flex flex-col gap-1', images.length > 0 && 'mt-3')}>
          {files.map((item) => (
            <li key={item.id} className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2">
              <FileText size={18} className="shrink-0 text-slate-600" aria-hidden="true" />
              <a href={resolveAssetUrl(item.url) ?? '#'} target="_blank" rel="noreferrer" className="min-w-0 flex-1 truncate text-sm font-medium text-brand-700 hover:underline">
                {item.name ?? 'Tệp đính kèm'}
              </a>
              {manage && (
                <button type="button" onClick={() => manage.onDelete(item.id)} className="inline-flex size-9 items-center justify-center rounded-lg text-accent-700 hover:bg-accent-50" aria-label={`Xóa ${item.name ?? 'tệp'}`}>
                  <Trash2 size={16} aria-hidden="true" />
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
};
