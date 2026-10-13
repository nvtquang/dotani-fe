import { useId, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { FilePlus } from 'lucide-react';
import { useInfiniteQuery } from '@tanstack/react-query';
import { ForbiddenMessage } from '../../components/ForbiddenMessage';
import { Alert, Button, Card, Dialog, EmptyState, Input, PageHeader, Select, Skeleton, useToast } from '../../components/ui';
import { PostCard } from '../../features/posts/PostCard';
import { PostForm, PostFormFooter } from '../../features/posts/PostForm';
import { useInfiniteScroll } from '../../hooks/useInfiniteScroll';
import { useOrganizations } from '../../hooks/useOrganizations';
import { usePostEngagementMap } from '../../hooks/useEngagement';
import { postKeys, useCreatePost } from '../../hooks/usePosts';
import { isManager, isWardRole } from '../../routes/navigation';
import { postService } from '../../services/postService';
import { useAuth } from '../../stores/AuthContext';
import type { PostFormValues, PostType } from '../../types/post';
import { toApiError } from '../../utils/apiError';
import { postTypeLabel } from '../../utils/labels';

export const PostListPage = () => {
  const { role } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();
  const formId = useId();
  const [searchParams, setSearchParams] = useSearchParams();
  const canCreate = isWardRole(role);
  const isCreateOpen = canCreate && searchParams.get('create') === '1';
  const [type, setType] = useState<PostType | ''>('');
  const [organization, setOrganization] = useState('');
  const [date, setDate] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  const organizationsQuery = useOrganizations(isManager(role));
  const organizations = organizationsQuery.data ?? [];
  const createPost = useCreatePost();

  const filters = { type, organization: organization || undefined, date, size: 10 };
  const postsQuery = useInfiniteQuery({
    queryKey: [...postKeys.all, 'infinite', filters],
    queryFn: ({ pageParam }) => postService.list({ ...filters, page: pageParam }),
    initialPageParam: 0,
    getNextPageParam: (last) => (last.number + 1 < last.totalPages ? last.number + 1 : undefined),
  });
  const posts = postsQuery.data?.pages.flatMap((page) => page.content) ?? [];
  const engagement = usePostEngagementMap(posts.filter((post) => post.status === 'PUBLISHED').map((post) => post.id));
  const sentinelRef = useInfiniteScroll(() => {
    if (postsQuery.hasNextPage && !postsQuery.isFetchingNextPage) void postsQuery.fetchNextPage();
  }, Boolean(postsQuery.hasNextPage));

  const closeCreate = () => {
    setFormError(null);
    setSearchParams({}, { replace: true });
  };

  const handleCreate = async (values: PostFormValues, organizationIds: string[]) => {
    setFormError(null);
    let created = null;
    for (const organizationId of organizationIds) {
      created = await createPost.mutateAsync({ ...values, organizationId });
    }
    toast.success(organizationIds.length > 1 ? `Đã đăng ${organizationIds.length} bài viết` : 'Đã đăng bài viết');
    closeCreate();
    if (created && organizationIds.length === 1) navigate(`/posts/${created.id}`);
  };

  if (postsQuery.error && toApiError(postsQuery.error).status === 403) {
    return <ForbiddenMessage />;
  }

  return (
    <>
      <PageHeader
        title="Bài viết"
        description="Tin tức, thông báo và báo cáo hoạt động"
        actions={
          canCreate && (
            <Button onClick={() => setSearchParams({ create: '1' })}>
              <FilePlus size={17} aria-hidden="true" />
              Tạo bài viết
            </Button>
          )
        }
      />

      <div className="mb-4 grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
        <Select aria-label="Loại bài" className="sm:w-auto! sm:min-w-36" value={type} onChange={(event) => setType(event.target.value as PostType | '')}>
          <option value="">Mọi loại bài</option>
          {(Object.keys(postTypeLabel) as PostType[]).map((item) => (
            <option key={item} value={item}>
              {postTypeLabel[item]}
            </option>
          ))}
        </Select>
        {isWardRole(role) && (
          <Select aria-label="Đơn vị" className="sm:w-auto! sm:min-w-40" value={organization} onChange={(event) => setOrganization(event.target.value)}>
            <option value="">Mọi đơn vị</option>
            {organizations.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </Select>
        )}
        <Input type="date" aria-label="Ngày đăng" className="sm:w-auto!" value={date} onChange={(event) => setDate(event.target.value)} />
      </div>

      <section aria-busy={postsQuery.isLoading} className="mx-auto flex max-w-2xl flex-col gap-3">
        {postsQuery.isLoading &&
          Array.from({ length: 3 }).map((_, index) => (
            <Card key={index} className="space-y-2 p-4">
              <Skeleton className="h-4 w-1/3" />
              <Skeleton className="h-5 w-3/4" />
              <Skeleton className="h-4 w-full" />
            </Card>
          ))}
        {postsQuery.isError && <Alert>Không thể tải bài viết.</Alert>}
        {!postsQuery.isLoading && !postsQuery.isError && posts.length === 0 && (
          <Card>
            <EmptyState title="Không có bài viết" description="Thử đổi bộ lọc hoặc ngày đăng." />
          </Card>
        )}
        {posts.map((post) => (
          <PostCard key={post.id} post={post} showStatus={isManager(role)} engagement={engagement[post.id]} />
        ))}
        <div ref={sentinelRef} aria-hidden="true" />
        {postsQuery.hasNextPage && (
          <Button variant="secondary" className="self-center" loading={postsQuery.isFetchingNextPage} onClick={() => void postsQuery.fetchNextPage()}>
            Xem thêm
          </Button>
        )}
      </section>

      {canCreate && (
        <Dialog
          open={isCreateOpen}
          onClose={closeCreate}
          title="Tạo bài viết"
          size="lg"
          footer={<PostFormFooter formId={formId} onCancel={closeCreate} submitLabel="Đăng bài" isSubmitting={createPost.isPending} />}
        >
          {formError && <Alert className="mb-4">{formError}</Alert>}
          {organizationsQuery.isLoading ? <Skeleton className="h-64" /> : <PostForm formId={formId} organizations={organizations} onSubmit={handleCreate} onError={setFormError} />}
        </Dialog>
      )}
    </>
  );
};
