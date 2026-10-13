import { useEffect } from 'react';
import { useRouteError } from 'react-router-dom';
import { Alert, Button } from '../components/ui';

const isStaleChunk = (error: unknown) =>
  error instanceof Error && /dynamically imported module|Importing a module script failed|Failed to fetch/i.test(error.message);

/** Shown inside the layout when a page throws or its chunk cannot be loaded. */
export const RouteError = () => {
  const error = useRouteError();
  const stale = isStaleChunk(error);

  useEffect(() => {
    // a new deploy removed the chunk this tab was about to load: reload once to get the new build
    if (stale && !sessionStorage.getItem('chunk-reload')) {
      sessionStorage.setItem('chunk-reload', '1');
      window.location.reload();
    }
  }, [stale]);

  return (
    <Alert>
      <p className="font-semibold">{stale ? 'Đã có phiên bản mới của ứng dụng.' : 'Không thể hiển thị trang này.'}</p>
      <Button size="sm" variant="secondary" className="mt-3" onClick={() => window.location.reload()}>
        Tải lại trang
      </Button>
    </Alert>
  );
};
