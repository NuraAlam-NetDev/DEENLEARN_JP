import { useEffect, useState } from 'react';
import QRCode from 'qrcode';

// QR code that opens the public verification page for a certificate
export default function CertificateQr({ code, size = 96 }) {
  const [src, setSrc] = useState('');
  useEffect(() => {
    if (!code) return;
    const url = `${window.location.origin}/verify/${encodeURIComponent(code)}`;
    QRCode.toDataURL(url, { width: size, margin: 1 }).then(setSrc).catch(() => setSrc(''));
  }, [code, size]);
  if (!src) return null;
  return (
    <figure className="flex shrink-0 flex-col items-center gap-1">
      <img src={src} alt="Scan to verify this certificate" width={size} height={size} className="rounded" />
      <figcaption className="text-[10px] text-slate-500">Scan to verify</figcaption>
    </figure>
  );
}
