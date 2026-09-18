import { useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Paperclip, Pencil, Upload } from 'lucide-react';
import { ForbiddenMessage } from '../../components/ForbiddenMessage';
import { Card, EmptyState, LoadingSkeleton, PageHeader, StatusBadge } from '../../components/ui';
import { PostForm } from '../../features/posts/PostForm';
import { useDeletePost, useDeletePostImage, usePost, useUpdatePost, useUploadPostImages } from '../../hooks/usePosts';
import { useOrganizations } from '../../hooks/useOrganizations';
import { useAuth } from '../../stores/AuthContext';
import type { ApiError } from '../../types/api';
import type { PostFormValues } from '../../types/post';
import { resolveAssetUrl } from '../../utils/assetUrl';
import { formatDateTime } from '../../utils/dateTime';
import { postStatusLabel, postTypeLabel } from '../../utils/labels';
import { toApiError } from '../../utils/apiError';

const canManagePosts = (role: string | null) => role === 'WARD_SECRETARY' || role === 'WARD_DEPUTY_SECRETARY';

const isTdpOfficer = (role: string | null) => role === 'TDP_SECRETARY' || role === 'TDP_DEPUTY_SECRETARY';

export const PostDetailPage = () => {
  const { id = '' } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const { role, user } = useAuth();
  const [formError, setFormError] = useState<ApiError | null>(null);
  const [openImageUrl, setOpenImageUrl] = useState<string | null>(null);
  const isEditing = searchParams.get('mode') === 'edit';
  const canManage = canManagePosts(role);

  const postQuery = usePost(id);
  const organizationsQuery = useOrganizations();
  const organizations = useMemo(
    () => (organizationsQuery.data ?? []).filter((organization) => organization.type === 'YOUTH_UNION_BRANCH'),
    [organizationsQuery.data],
  );
  const updatePost = useUpdatePost(id);
  const deletePost = useDeletePost();
  const uploadImages = useUploadPostImages(id);
  const deleteImage = useDeletePostImage(id);
  const fixedOrganizationId = isTdpOfficer(role) ? user?.tdpId : undefined;

  const handleUpdate = async (values: PostFormValues) => {
    setFormError(null);
    try {
      await updatePost.mutateAsync({
        ...values,
        organizationId: fixedOrganizationId ?? values.organizationId,
      });
      setSearchParams({});
    } catch (error) {
      setFormError(toApiError(error));
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Xóa bài viết này?')) {
      return;
    }

    setFormError(null);
    try {
      await deletePost.mutateAsync(id);
      navigate('/posts');
    } catch (error) {
      setFormError(toApiError(error));
    }
  };

  const handleUploadImages = async (files: FileList | null) => {
    if (!files?.length) {
      return;
    }

    setFormError(null);
    try {
      await uploadImages.mutateAsync(Array.from(files));
    } catch (error) {
      setFormError(toApiError(error));
    } finally {
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleDeleteImage = async (imageId: string) => {
    if (!window.confirm('Xóa tệp đính kèm này?')) {
      return;
    }

    setFormError(null);
    try {
      await deleteImage.mutateAsync(imageId);
    } catch (error) {
      setFormError(toApiError(error));
    }
  };

  if (postQuery.error && toApiError(postQuery.error).status === 403) {
    return <ForbiddenMessage />;
  }

  if (postQuery.isLoading) {
    return (
      <Card>
        <LoadingSkeleton rows={5} />
      </Card>
    );
  }

  if (!postQuery.data) {
    return <section className="error-box">Không tìm thấy bài viết.</section>;
  }

  const post = postQuery.data;

  return (
    <div className="page-stack">
      <PageHeader
        eyebrow={postTypeLabel[post.type]}
        title={post.title}
        description={`${postStatusLabel[post.status]} · ${formatDateTime(post.createdAt)}`}
        actions={
          <>
            <Link className="secondary-button inline-button" to="/posts">
              <ArrowLeft size={17} aria-hidden="true" />
              Quay lại
            </Link>
            {canManage && (
              <>
                <button
                  className="primary-button inline-button"
                  type="button"
                  onClick={() => setSearchParams(isEditing ? {} : { mode: 'edit' })}
                >
                  <Pencil size={17} aria-hidden="true" />
                  {isEditing ? 'Xem chi tiết' : 'Sửa'}
                </button>
                <button className="secondary-button inline-button" type="button" onClick={handleDelete}>
                  Xóa
                </button>
              </>
            )}
          </>
        }
      />

      {formError?.status === 403 && <ForbiddenMessage />}
      {formError && formError.status !== 403 && <section className="error-box">{formError.message}</section>}

      {isEditing && canManage ? (
        <Card>
          <div className="section-heading">
            <h2>Sửa bài viết</h2>
          </div>
          <PostForm
            initialValue={post}
            organizations={organizations}
            fixedOrganizationId={fixedOrganizationId}
            isSubmitting={updatePost.isPending}
            submitLabel="Lưu bài viết"
            onSubmit={handleUpdate}
            onCancel={() => setSearchParams({})}
          />
        </Card>
      ) : (
        <article className="surface post-body">
          <StatusBadge value={post.status} label={postStatusLabel[post.status]} />
          <p>{post.content}</p>
        </article>
      )}

      <Card>
        <div className="section-heading">
          <div>
            <h2>Tệp đính kèm</h2>
            <p className="page-description">Upload nhiều ảnh hoặc tài liệu, backend validate định dạng và dung lượng.</p>
          </div>
          {canManage && (
            <>
              <input
                ref={fileInputRef}
                className="visually-hidden"
                type="file"
                multiple
                accept="image/jpeg,image/png,image/webp,.pdf,.txt,.doc,.docx,.xls,.xlsx"
                onChange={(event) => handleUploadImages(event.target.files)}
              />
              <button
                className="primary-button inline-button"
                type="button"
                disabled={uploadImages.isPending}
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload size={17} aria-hidden="true" />
                Đính kèm
              </button>
            </>
          )}
        </div>

        <div className="image-grid">
          {(post.images ?? []).map((image) => {
            const imageUrl = resolveAssetUrl(image.imageUrl);
            const isImage = !image.attachmentKind || image.attachmentKind === 'IMAGE';
            return (
              <div className="image-tile" key={image.id}>
                {imageUrl && isImage && (
                  <button type="button" onClick={() => setOpenImageUrl(imageUrl)}>
                    <img src={imageUrl} alt={image.fileName ?? 'Ảnh bài viết'} />
                  </button>
                )}
                {imageUrl && !isImage && (
                  <a className="chat-file-link" href={imageUrl} target="_blank" rel="noreferrer">
                    <Paperclip size={16} aria-hidden="true" />
                    <span>{image.fileName ?? 'Tệp đính kèm'}</span>
                  </a>
                )}
                {canManage && (
                  <button className="danger-link" type="button" onClick={() => handleDeleteImage(image.id)}>
                    Xóa
                  </button>
                )}
              </div>
            );
          })}
          {(post.images ?? []).length === 0 && <EmptyState title="Chưa có tệp đính kèm" />}
        </div>
      </Card>

      {openImageUrl && (
        <div className="modal-backdrop" role="presentation" onClick={() => setOpenImageUrl(null)}>
          <div className="qr-modal" role="dialog" aria-modal="true" onClick={(event) => event.stopPropagation()}>
            <img src={openImageUrl} alt="Ảnh bài viết phóng to" />
            <button className="secondary-button inline-button" type="button" onClick={() => setOpenImageUrl(null)}>
              Đóng
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
