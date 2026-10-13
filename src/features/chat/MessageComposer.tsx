import { useRef, useState, type KeyboardEvent } from 'react';
import { ImageIcon, Paperclip, SendHorizontal } from 'lucide-react';
import { Button } from '../../components/ui';

type MessageComposerProps = {
  disabled: boolean;
  uploading: boolean;
  onSend: (content: string) => boolean;
  onTyping: () => void;
  onAttach: (file: File) => void;
};

const IMAGE_TYPES = 'image/jpeg,image/png,image/webp,image/gif';
const FILE_TYPES = `.pdf,.txt,.doc,.docx,.xls,.xlsx,${IMAGE_TYPES}`;

/** Enter sends, Shift+Enter adds a line; grows with the text up to a few lines. */
export const MessageComposer = ({ disabled, uploading, onSend, onTyping, onAttach }: MessageComposerProps) => {
  const [draft, setDraft] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const imageRef = useRef<HTMLInputElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const resize = () => {
    const element = textareaRef.current;
    if (element) {
      element.style.height = 'auto';
      element.style.height = `${Math.min(element.scrollHeight, 140)}px`;
    }
  };

  const send = () => {
    if (onSend(draft)) {
      setDraft('');
      requestAnimationFrame(resize);
    }
  };

  const onKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing) {
      event.preventDefault();
      send();
    }
  };

  const picker = (ref: React.RefObject<HTMLInputElement | null>, accept: string) => (
    <input
      ref={ref}
      type="file"
      accept={accept}
      className="sr-only"
      tabIndex={-1}
      aria-hidden="true"
      onChange={(event) => {
        const file = event.target.files?.[0];
        event.target.value = '';
        if (file) onAttach(file);
      }}
    />
  );

  return (
    <form
      className="flex items-end gap-1 border-t border-slate-200 bg-white px-2 py-2 sm:px-3"
      onSubmit={(event) => {
        event.preventDefault();
        send();
      }}
    >
      {picker(imageRef, IMAGE_TYPES)}
      {picker(fileRef, FILE_TYPES)}
      <Button variant="ghost" size="icon" onClick={() => imageRef.current?.click()} disabled={uploading} aria-label="Gửi ảnh" title="Gửi ảnh">
        <ImageIcon size={20} aria-hidden="true" />
      </Button>
      <Button variant="ghost" size="icon" onClick={() => fileRef.current?.click()} disabled={uploading} aria-label="Gửi tệp" title="Gửi tệp">
        <Paperclip size={20} aria-hidden="true" />
      </Button>
      <label className="sr-only" htmlFor="chat-composer">
        Nội dung tin nhắn
      </label>
      <textarea
        id="chat-composer"
        ref={textareaRef}
        rows={1}
        maxLength={2000}
        value={draft}
        placeholder="Nhập tin nhắn…"
        onChange={(event) => {
          setDraft(event.target.value);
          resize();
          if (event.target.value.trim()) onTyping();
        }}
        onKeyDown={onKeyDown}
        className="max-h-36 min-h-10 min-w-0 flex-1 resize-none rounded-2xl border border-slate-300 bg-slate-50 px-3.5 py-2 text-base leading-snug focus:border-brand-600 focus:bg-white focus:ring-2 focus:ring-brand-600/20 focus:outline-none sm:text-sm"
      />
      <Button type="submit" size="icon" disabled={disabled || !draft.trim()} aria-label="Gửi" title={disabled ? 'Đang kết nối lại…' : 'Gửi (Enter)'} className="rounded-full">
        <SendHorizontal size={18} aria-hidden="true" />
      </Button>
    </form>
  );
};
