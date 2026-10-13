import { useEffect, useState } from 'react';
import { httpClient } from '../api/httpClient';

/** The QR image is served behind auth, so it is fetched as a blob instead of a plain <img src>. */
export const useProtectedImage = (path?: string | null) => {
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => {
    let objectUrl: string | null = null;
    let active = true;
    setUrl(null);
    if (!path) return undefined;
    httpClient
      .get<Blob>(path, { responseType: 'blob' })
      .then((response) => {
        if (!active) return;
        objectUrl = URL.createObjectURL(response.data);
        setUrl(objectUrl);
      })
      .catch(() => active && setUrl(null));
    return () => {
      active = false;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [path]);
  return url;
};
