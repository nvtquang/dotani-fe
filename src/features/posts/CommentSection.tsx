import { useState, type FormEvent } from 'react';
import { Send } from 'lucide-react';
import { Alert, Button, Card, LoadingSkeleton, Textarea, Time, UserAvatar, useConfirm, useToast } from '../../components/ui';
import { useCommentMutations, useComments } from '../../hooks/useEngagement';
import type { PostComment } from '../../types/engagement';
import { toApiError } from '../../utils/apiError';
import { resolveAssetUrl } from '../../utils/assetUrl';

const MAX_LENGTH = 2000;

const CommentItem = ({ comment, postId }: { comment: PostComment; postId: string }) => {
  const toast = useToast();
  const confirm = useConfirm();
  const { edit, remove } = useCommentMutations(postId);
  const [draft, setDraft] = useState<string | null>(null);

  const save = () => {
    if (!draft?.trim()) return;
    edit.mutate(
      { id: comment.id, content: draft.trim() },
      { onSuccess: () => setDraft(null), onError: (caught) => toast.error(toApiError(caught).message ?? 'Không sửa được bình luận') },
    );
  };

  return (
    <li className="flex gap-2.5 py-3">
      <UserAvatar name={comment.authorName} src={resolveAssetUrl(comment.authorAvatarUrl)} size="sm" />
      <div className="min-w-0 flex-1">
        <div className="rounded-2xl bg-slate-100 px-3 py-2">
          <p className="text-sm font-semibold text-slate-900">{comment.authorName ?? 'Đoàn viên'}</p>
          {draft === null ? (
            <p className="text-sm whitespace-pre-line break-words text-slate-800">{comment.content}</p>
          ) : (
            <Textarea
              aria-label="Sửa bình luận"
              className="mt-1 min-h-16!"
              maxLength={MAX_LENGTH}
              value={draft}
              autoFocus
              onChange={(event) => setDraft(event.target.value)}
            />
          )}
        </div>
        <div className="mt-1 flex flex-wrap items-center gap-3 px-3 text-xs text-slate-600">
          <Time value={comment.createdAt} relative />
          {comment.edited && <span>Đã sửa</span>}
          {draft === null ? (
            <>
              {comment.canEdit && (
                <button type="button" className="font-semibold hover:underline" onClick={() => setDraft(comment.content)}>
                  Sửa
                </button>
              )}
              {comment.canDelete && (
                <button
                  type="button"
                  className="font-semibold hover:underline"
                  onClick={async () => {
                    if (await confirm({ title: 'Xóa bình luận này?', confirmLabel: 'Xóa', tone: 'danger' })) {
                      remove.mutate(comment.id, { onError: (caught) => toast.error(toApiError(caught).message ?? 'Không xóa được bình luận') });
                    }
                  }}
                >
                  Xóa
                </button>
              )}
            </>
          ) : (
            <>
              <button type="button" className="font-semibold text-brand-700 hover:underline" onClick={save} disabled={edit.isPending}>
                Lưu
              </button>
              <button type="button" className="font-semibold hover:underline" onClick={() => setDraft(null)}>
                Hủy
              </button>
            </>
          )}
        </div>
      </div>
    </li>
  );
};

/** Comments under a published post, oldest first, with a box to add one. */
export const CommentSection = ({ postId }: { postId: string }) => {
  const toast = useToast();
  const commentsQuery = useComments(postId);
  const { add } = useCommentMutations(postId);
  const [content, setContent] = useState('');
  const comments = commentsQuery.data?.pages.flatMap((page) => page.content) ?? [];
  const total = commentsQuery.data?.pages[0]?.totalElements ?? 0;

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (!content.trim()) return;
    add.mutate(content.trim(), {
      onSuccess: () => setContent(''),
      onError: (caught) => toast.error(toApiError(caught).message ?? 'Không gửi được bình luận'),
    });
  };

  return (
    <Card className="p-4 sm:p-6" as="section">
      <h2 id="comments" className="text-base font-semibold text-slate-900">
        Bình luận {total > 0 && <span className="font-normal text-slate-600">({total})</span>}
      </h2>
      {commentsQuery.isLoading && <LoadingSkeleton rows={3} />}
      {commentsQuery.isError && <Alert className="mt-3">Không thể tải bình luận.</Alert>}
      <ul className="divide-y divide-slate-100">
        {comments.map((comment) => (
          <CommentItem key={comment.id} comment={comment} postId={postId} />
        ))}
      </ul>
      {commentsQuery.hasNextPage && (
        <Button variant="ghost" size="sm" onClick={() => void commentsQuery.fetchNextPage()} loading={commentsQuery.isFetchingNextPage}>
          Xem thêm bình luận
        </Button>
      )}
      <form onSubmit={submit} className="mt-3 flex items-end gap-2">
        <Textarea
          aria-label="Viết bình luận"
          placeholder="Viết bình luận..."
          className="min-h-11!"
          rows={1}
          maxLength={MAX_LENGTH}
          value={content}
          onChange={(event) => setContent(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter' && !event.shiftKey) {
              event.preventDefault();
              event.currentTarget.form?.requestSubmit();
            }
          }}
        />
        <Button type="submit" size="icon" aria-label="Gửi bình luận" loading={add.isPending} disabled={!content.trim()}>
          <Send size={17} aria-hidden="true" />
        </Button>
      </form>
    </Card>
  );
};
