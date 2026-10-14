// Only http(s) links are ever put into href / src (blocks javascript: and data: URLs)
export function isHttpUrl(value = '') {
  try {
    const { protocol } = new URL(value);
    return protocol === 'https:' || protocol === 'http:';
  } catch {
    return false;
  }
}

const YOUTUBE_ID = /^[\w-]{6,20}$/;
const VIMEO_ID = /^\d{5,12}$/;

// YouTube / Vimeo page link -> iframe address. Anything else returns null (show a plain link instead).
export function toEmbedUrl(value = '') {
  if (!isHttpUrl(value)) return null;
  const url = new URL(value);
  const host = url.hostname.replace(/^www\./, '').replace(/^m\./, '');

  if (host === 'youtu.be') {
    const id = url.pathname.split('/')[1];
    return YOUTUBE_ID.test(id || '') ? `https://www.youtube-nocookie.com/embed/${id}` : null;
  }
  if (host === 'youtube.com' || host === 'youtube-nocookie.com') {
    const parts = url.pathname.split('/').filter(Boolean);
    const id = url.searchParams.get('v') || (['embed', 'shorts', 'live'].includes(parts[0]) ? parts[1] : '');
    return YOUTUBE_ID.test(id || '') ? `https://www.youtube-nocookie.com/embed/${id}` : null;
  }
  if (host === 'vimeo.com' || host === 'player.vimeo.com') {
    const id = url.pathname.split('/').filter(Boolean).find((p) => VIMEO_ID.test(p));
    return id ? `https://player.vimeo.com/video/${id}` : null;
  }
  return null;
}
