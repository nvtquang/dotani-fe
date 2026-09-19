import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Eye, FilePlus, Pencil } from 'lucide-react';
import { ForbiddenMessage } from '../../components/ForbiddenMessage';
import { EmptyState, LoadingSkeleton, PageHeader, StatusBadge } from '../../components/ui';
import { PostForm } from '../../features/posts/PostForm';
import { useCreatePost, useDeletePost, usePosts } from '../../hooks/usePosts';
import { useOrganizations } from '../../hooks/useOrganizations';
import { useAuth } from '../../stores/AuthContext';
import type { ApiError } from '../../types/api';
import type { PostFilters, PostFormValues, PostType } from '../../types/post';
import type { OrganizationUnit } from '../../types/organization';
import { formatDateTime } from '../../utils/dateTime';
import { postStatusLabel, postTypeLabel } from '../../utils/labels';
import { toApiError } from '../../utils/apiError';

const pageSize = 10;

const canManagePosts = (role: string | null) => role === 'WARD_SECRETARY' || role === 'WARD_DEPUTY_SECRETARY';

const getVisibleOrganizations = (
  organizations: OrganizationUnit[],
  role: string | null,
  tdpId?: string | null,
) => {
  const branches = organizations.filter((organization) => organization.type === 'YOUTH_UNION_BRANCH');

  if (role === 'TDP_SECRETARY' || role === 'TDP_DEPUTY_SECRETARY') {
    return branches.filter((organization) => organization.id === tdpId);
  }

  return branches;
};

export const PostListPage = () => {
  const { role, user } = useAuth();
  const [page, setPage] = useState(0);
  const [type, setType] = useState<PostType | ''>('');
  const [organization, setOrganization] = useState('');
  const [date, setDate] = useState('');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [formError, setFormError] = useState<ApiError | null>(null);

  const organizationsQuery = useOrganizations();
  const organizations = useMemo(
    () => getVisibleOrganizations(organizationsQuery.data ?? [], role, user?.tdpId),
    [organizationsQuery.data, role, user?.tdpId],
  );
  const fixedOrganizationId =
    role === 'TDP_SECRETARY' || role === 'TDP_DEPUTY_SECRETARY' ? user?.tdpId : undefined;
  const formFixedOrganizationId = fixedOrganizationId ?? (organization || undefined);
  const canManage = canManagePosts(role);

  const filters: PostFilters = {
    organization: fixedOrganizationId ?? organization,
    type,
    date,
    page,
    size: pageSize,
  };
  const postsQuery = usePosts(filters);
  const createPost = useCreatePost();
  const deletePost = useDeletePost();

  const posts = postsQuery.data?.content ?? [];
  const totalPages = postsQuery.data?.totalPages ?? 0;
  const organizationNameById = useMemo(
    () => new Map((organizationsQuery.data ?? []).map((item) => [item.id, item.name])),
    [organizationsQuery.data],
  );

  const handleCreate = async (values: PostFormValues) => {
    setFormError(null);
    try {
      const organizationIds = formFixedOrganizationId
        ? [formFixedOrganizationId]
        : values.organizationIds?.length
          ? values.organizationIds
          : [values.organizationId];

      for (const organizationId of organizationIds) {
        await createPost.mutateAsync({
          ...values,
          organizationId,
          organizationIds: undefined,
        });
      }
      setIsCreateOpen(false);
    } catch (error) {
      setFormError(toApiError(error));
    }
  };

  const handleDelete = async (postId: string) => {
    if (!window.confirm('Xóa bài viết này?')) {
      return;
    }

    setFormError(null);
    try {
      await deletePost.mutateAsync(postId);
    } catch (error) {
      setFormError(toApiError(error));
    }
  };

  if (postsQuery.error && toApiError(postsQuery.error).status === 403) {
    return <ForbiddenMessage />;
  }

  return (
    <>
      <PageHeader
        eyebrow="Bài viết và báo cáo"
        title="Bài viết"
        description="Đoàn viên chỉ thấy nội dung đã xuất bản. Cán bộ quản lý theo phạm vi tổ chức."
        actions={
          canManage && (
            <button className="primary-button inline-button" type="button" onClick={() => setIsCreateOpen(true)}>
              <FilePlus size={17} aria-hidden="true" />
              Tạo bài viết
            </button>
          )
        }
      />

      <section className="surface toolbar">
        <label>
          Loại bài
          <select value={type} onChange={(event) => { setType(event.target.value as PostType | ''); setPage(0); }}>
            <option value="">Tất cả</option>
            {(Object.keys(postTypeLabel) as PostType[]).map((item) => (
              <option key={item} value={item}>
                {postTypeLabel[item]}
              </option>
            ))}
          </select>
        </label>
        <label>
          TDP
          <select
            disabled={Boolean(fixedOrganizationId)}
            value={fixedOrganizationId ?? organization}
            onChange={(event) => { setOrganization(event.target.value); setPage(0); }}
          >
            <option value="">Tất cả</option>
            {organizations.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </select>
        </label>
        <label>
          Ngày
          <input type="date" value={date} onChange={(event) => { setDate(event.target.value); setPage(0); }} />
        </label>
      </section>

      {formError?.status === 403 && <ForbiddenMessage />}
      {formError && formError.status !== 403 && <section className="error-box">{formError.message}</section>}

      {isCreateOpen && (
        <section className="surface section-gap">
          <div className="section-heading">
            <h2>Tạo bài viết</h2>
          </div>
          <PostForm
            organizations={organizations}
            fixedOrganizationId={formFixedOrganizationId}
            allowMultipleOrganizations={!formFixedOrganizationId}
            isSubmitting={createPost.isPending}
            submitLabel="Tạo bài viết"
            onSubmit={handleCreate}
            onCancel={() => setIsCreateOpen(false)}
          />
        </section>
      )}

      <section className="event-grid section-gap">
        {postsQuery.isLoading && (
          <div className="surface">
            <LoadingSkeleton rows={4} />
          </div>
        )}
        {!postsQuery.isLoading && posts.length === 0 && (
          <div className="surface">
            <EmptyState title="Không có bài viết" description="Thử thay đổi bộ lọc hoặc ngày đăng." />
          </div>
        )}
        {posts.map((post) => (
          <article className="surface event-card" key={post.id}>
            <div>
              <StatusBadge value={post.status} label={postStatusLabel[post.status]} />
              <h2>{post.title}</h2>
              <p>{post.content.slice(0, 160)}{post.content.length > 160 ? '...' : ''}</p>
            </div>
            <dl className="compact-list">
              <div>
                <dt>Loại bài</dt>
                <dd>{postTypeLabel[post.type]}</dd>
              </div>
              <div>
                <dt>TDP</dt>
                <dd>{organizationNameById.get(post.organizationId) ?? 'Chưa có TDP'}</dd>
              </div>
              <div>
                <dt>Ngày tạo</dt>
                <dd>{formatDateTime(post.createdAt)}</dd>
              </div>
              <div>
                <dt>Ảnh</dt>
                <dd>{post.images?.length ?? 0}</dd>
              </div>
            </dl>
            <div className="table-actions">
              <Link className="text-action" to={`/posts/${post.id}`}>
                <Eye size={16} aria-hidden="true" />
                Xem
              </Link>
              {canManage && (
                <>
                  <Link className="text-action" to={`/posts/${post.id}?mode=edit`}>
                    <Pencil size={16} aria-hidden="true" />
                    Sửa
                  </Link>
                  <button className="danger-link" type="button" onClick={() => handleDelete(post.id)}>
                    Xóa
                  </button>
                </>
              )}
            </div>
          </article>
        ))}
      </section>

      <div className="pagination">
        <button
          className="secondary-button inline-button"
          type="button"
          disabled={page === 0}
          onClick={() => setPage((current) => Math.max(current - 1, 0))}
        >
          Trước
        </button>
        <span>
          Trang {totalPages === 0 ? 0 : page + 1} / {totalPages}
        </span>
        <button
          className="secondary-button inline-button"
          type="button"
          disabled={totalPages === 0 || page >= totalPages - 1}
          onClick={() => setPage((current) => current + 1)}
        >
          Sau
        </button>
      </div>
    </>
  );
};
