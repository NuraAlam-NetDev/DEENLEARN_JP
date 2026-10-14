import { useCallback, useEffect, useRef, useState } from 'react';
import api, { getErrorMessage } from '../services/api.js';

// GET helper: const { data, loading, error, status, reload } = useFetch('/courses?limit=6')
// - Pass null to skip the request.
// - reload() fetches the same URL again and keeps the old data on screen meanwhile.
export function useFetch(url) {
  const [state, setState] = useState({ data: null, error: '', status: null, loading: !!url });
  const [tick, setTick] = useState(0);
  const lastUrl = useRef(null);

  useEffect(() => {
    if (!url) {
      setState({ data: null, error: '', status: null, loading: false });
      return undefined;
    }

    let cancelled = false;
    const sameUrl = lastUrl.current === url; // a reload, not a new request
    lastUrl.current = url;
    setState((s) => ({ data: sameUrl ? s.data : null, error: '', status: null, loading: true }));

    api
      .get(url)
      .then((res) => {
        if (!cancelled) setState({ data: res.data, error: '', status: res.status, loading: false });
      })
      .catch((err) => {
        if (!cancelled) {
          setState({
            data: null,
            error: getErrorMessage(err),
            status: err.response?.status ?? 0,
            loading: false,
          });
        }
      });

    return () => {
      cancelled = true;
    };
  }, [url, tick]);

  const reload = useCallback(() => setTick((t) => t + 1), []);
  return { ...state, reload };
}
