import api from './api.js';

const data = (res) => res.data;

// Issues the certificate for a finished course (asking twice returns the same one)
export const claimCertificate = (courseId, recipientName) =>
  api.post(`/courses/${courseId}/certificate`, { recipientName }).then(data);

// Download certificate PDF directly from the backend
export function downloadCertificate(certificate) {
  const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';

  const url = `${baseUrl}/api/certificates/${certificate._id}/pdf`;

  console.log('DOWNLOAD: direct download starting');
  console.log('DOWNLOAD URL:', url);

  const link = document.createElement('a');
  link.href = url;
  link.download = `Deenlearn-Certificate-${certificate.code}.pdf`;

  document.body.appendChild(link);
  link.click();
  link.remove();

  console.log('DOWNLOAD: direct download triggered');
}