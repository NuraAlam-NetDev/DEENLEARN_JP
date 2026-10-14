// Detects the real file type from the first bytes (magic numbers), because the
// MIME type and extension sent by the browser can be faked.
// SVG/HTML are deliberately NOT supported (they can carry scripts).
const PNG = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
const WEBM = [0x1a, 0x45, 0xdf, 0xa3];

export function detectFileType(buf) {
  if (!buf || buf.length < 12) return null;
  const ascii = (start, end) => buf.toString('latin1', start, end);

  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) {
    return { kind: 'image', mime: 'image/jpeg', ext: 'jpg' };
  }
  if (PNG.every((b, i) => buf[i] === b)) return { kind: 'image', mime: 'image/png', ext: 'png' };
  if (ascii(0, 4) === 'GIF8') return { kind: 'image', mime: 'image/gif', ext: 'gif' };
  if (ascii(0, 4) === 'RIFF' && ascii(8, 12) === 'WEBP') {
    return { kind: 'image', mime: 'image/webp', ext: 'webp' };
  }

  if (ascii(0, 5) === '%PDF-') return { kind: 'pdf', mime: 'application/pdf', ext: 'pdf' };

  if (ascii(0, 4) === 'RIFF' && ascii(8, 12) === 'WAVE') {
    return { kind: 'audio', mime: 'audio/wav', ext: 'wav' };
  }
  if (ascii(0, 4) === 'OggS') return { kind: 'audio', mime: 'audio/ogg', ext: 'ogg' };

  // MP4 family: "ftyp" box. M4A is audio, everything else (MP4, MOV) is video.
  if (ascii(4, 8) === 'ftyp') {
    const brand = ascii(8, 12);
    if (['M4A ', 'M4B ', 'M4P '].includes(brand)) {
      return { kind: 'audio', mime: 'audio/mp4', ext: 'm4a' };
    }
    if (brand === 'qt  ') {
      return { kind: 'video', mime: 'video/quicktime', ext: 'mov' };
    }
    return { kind: 'video', mime: 'video/mp4', ext: 'mp4' };
  }

  // WebM: EBML header
  if (WEBM.every((b, i) => buf[i] === b)) {
    return { kind: 'video', mime: 'video/webm', ext: 'webm' };
  }

  // MP3: ID3 tag, or an MPEG frame sync
  if (ascii(0, 3) === 'ID3' || (buf[0] === 0xff && (buf[1] & 0xe0) === 0xe0)) {
    return { kind: 'audio', mime: 'audio/mpeg', ext: 'mp3' };
  }
  return null;
}