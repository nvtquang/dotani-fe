import { useId, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Pencil, Trash2 } from 'lucide-react';
import { AttachmentGallery } from '../../components/AttachmentGallery';
import { ForbiddenMessage } from '../../components/ForbiddenMessage';
import { Alert, Badge, Button, Card, Dialog, LoadingSkeleton, Skeleton, StatusBadge, Time, UserAvatar, useConfirm, useToast } from '../../components/ui';
import { PostForm, PostFormFooter } from '../../features/posts/PostForm';
import { useOrganizations } from '../../hooks/useOrganizations';
import { useDeletePost, useDeletePostImage, usePost, useUpdatePost, useUploadPostImages } from '../../hooks/usePosts';
import { isManager, isWardRole } from '../../routes/navigation';
import { useAuth } from '../../stores/AuthContext';
import type { PostFormValues } from '../../types/post';
import { toApiError } from '../../utils/apiError';
import { postStatusLabel, postTypeLabel } from '../../utils/labels';

export const PostDetailPage = () => {
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const confirm = useConfirm();
  const formId = useId();
  const [searchParams, setSearchParams] = useSearchParams();
  const { role } = useAuth();
  const canManage = isWardRole(role);
  const isEditing = canManage && searchParams.get('mode') === 'edit';
  const [formError, setFormError] = useState<string | null>(null);

  const postQuery = usePost(id);
  const organizationsQuery = useOrganizations(canManage);
  const updatePost = useUpdatePost(id);
  const deletePost = useDeletePost();
  const uploadImages = useUploadPostImages(id);
  const deleteImage = useDeletePostImage(id);

  const showError = (caught: unknown, fallback: string) => toast.error(toApiError(caught).message ?? fallback);

  const handleUpdate = async (values: PostFormValues) => {
    await updatePost.mutateAsync(values);
    toast.success('Đã lưu bài viết');
    setSearchParams({}, { replace: true });
  };

  const handleDelete = async () => {
    if (!(await confirm({ title: 'Xóa bài viết này?', confirmLabel: 'Xóa', tone: 'danger' }))) return;
    try {
      await deletePost.mutateAsync(id);
      toast.success('Đã xóa bài viết');
      navigate('/posts');
    } catch (caught) {
      showError(caught, 'Không xóa được bài viết');
    }
  };

  const handleDeleteImage = async (imageId: string) => {
    if (!(await confirm({ title: 'Xóa tệp đính kèm này?', confirmLabel: 'Xóa', tone: 'danger' }))) return;
    deleteImage.mutate(imageId, { onError: (caught) => showError(caught, 'Không xóa được tệp') });
  };

  if (postQuery.error && toApiError(postQuery.error).status === 403) {
    return <ForbiddenMessage />;
  }
  if (postQuery.isLoading) {
    return (
      <Card className="p-5">
        <Skeleton className="mb-4 h-7 w-2/3" />
        <LoadingSkeleton rows={6} />
      </Card>
    );
  }
  if (!postQuery.data) {
    return <Alert>Không tìm thấy bài viết.</Alert>;
  }

  const post = postQuery.data;

  return (
    <div className="mx-auto max-w-3xl">
      <Link to="/posts" className="mb-3 inline-flex h-10 items-center gap-1.5 text-sm font-medium text-slate-700 hover:text-slate-900">
        <ArrowLeft size={17} aria-hidden="true" />
        Bài viết
      </Link>

      <Card as="article" className="p-4 sm:p-6">
        <div className="flex flex-wrap items-center gap-1.5">
          <Badge tone="gray">{postTypeLabel[post.type]}</Badge>
          {isManager(role) && post.status !== 'PUBLISHED' && <StatusBadge value={post.status} label={postStatusLabel[post.status]} />}
        </div>
        <h1 className="mt-2 text-xl font-bold text-slate-900 sm:text-2xl">{post.title}</h1>
        <div className="mt-3 flex items-center gap-2.5">
          <UserAvatar name={post.authorName ?? post.organizationName} size="sm" />
          <div className="text-sm leading-tight">
            <p className="font-semibold text-slate-900">{post.authorName ?? 'Ban chấp hành'}</p>
            <p className="text-slate-600">
              {post.organizationName ?? 'Đoàn phường'} · <Time value={post.createdAt} relative />
            </p>
          </div>
        </div>
        <div className="mt-5 text-[15px] leading-relaxed whitespace-pre-line text-slate-800">{post.content}</div>

        {canManage && (
          <div className="mt-6 flex flex-wrap gap-2 border-t border-slate-200 pt-4">
            <Button variant="secondary" onClick={() => setSearchParams({ mode: 'edit' })}>
              <Pencil size={16} aria-hidden="true" />
              Sửa
            </Button>
            <Button variant="danger" onClick={handleDelete} loading={deletePost.isPending}>
              <Trash2 size={16} aria-hidden="true" />
              Xóa
            </Button>
          </div>
        )}
      </Card>

      <div className="mt-4">
        <AttachmentGallery
          title="Ảnh và tài liệu"
          items={(post.images ?? []).map((image) => ({ id: image.id, url: image.imageUrl, kind: image.attachmentKind ?? 'IMAGE', name: image.fileName }))}
          manage={
            canManage
              ? {
                  accept: 'image/jpeg,image/png,image/webp,.pdf,.txt,.doc,.docx,.xls,.xlsx',
                  uploading: uploadImages.isPending,
                  onUpload: (files) => uploadImages.mutate(files, { onError: (caught) => showError(caught, 'Không tải lên được tệp') }),
                  onDelete: handleDeleteImage,
                }
              : undefined
          }
        />
      </div>

      {canManage && (
        <Dialog
          open={isEditing}
          onClose={() => setSearchParams({}, { replace: true })}
          title="Sửa bài viết"
          size="lg"
          footer={<PostFormFooter formId={formId} onCancel={() => setSearchParams({}, { replace: true })} submitLabel="Lưu" isSubmitting={updatePost.isPending} />}
        >
          {formError && <Alert className="mb-4">{formError}</Alert>}
          {organizationsQuery.isLoading ? (
            <Skeleton className="h-64" />
          ) : (
            <PostForm formId={formId} initialValue={post} organizations={organizationsQuery.data ?? []} onSubmit={handleUpdate} onError={setFormError} />
          )}
        </Dialog>
      )}
    </div>
  );
};
