import api from './api.js';

const data = (res) => res.data;

// Issues the certificate for a finished course (asking twice returns the same one)
export function downloadCertificate(certificate) {
  const url = `/api/certificates/${certificate._id}/pdf`;

  const link = document.createElement('a');
  link.href = url;
  link.download = `Deenlearn-Certificate-${certificate.code}.pdf`;

  document.body.appendChild(link);
  link.click();
  link.remove();
}