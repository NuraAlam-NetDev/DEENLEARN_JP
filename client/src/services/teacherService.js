import api from './api.js';

// Thin wrappers around /api/teacher/*. Each returns the response body (res.data).
const data = (res) => res.data;

// ---- Courses ----
export const getCourse = (id) => api.get(`/teacher/courses/${id}`).then(data);
export const createCourse = (body) => api.post('/teacher/courses', body).then(data);
export const updateCourse = (id, body) => api.patch(`/teacher/courses/${id}`, body).then(data);
export const deleteCourse = (id) => api.delete(`/teacher/courses/${id}`).then(data);
export const setCoursePublished = (id, published) =>
  api.patch(`/teacher/courses/${id}/${published ? 'publish' : 'unpublish'}`).then(data);

// ---- Lessons ----
export const getLesson = (id) => api.get(`/teacher/lessons/${id}`).then(data);
export const createLesson = (courseId, body) =>
  api.post(`/teacher/courses/${courseId}/lessons`, body).then(data);
export const updateLesson = (id, body) => api.patch(`/teacher/lessons/${id}`, body).then(data);
export const deleteLesson = (id) => api.delete(`/teacher/lessons/${id}`).then(data);
export const reorderLessons = (courseId, lessonIds) =>
  api.put(`/teacher/courses/${courseId}/lessons/reorder`, { lessonIds }).then(data);

// ---- Uploads (multipart, with progress) ----
// options: { onProgress(percent 0-100), signal (AbortSignal) }
function upload(url, file, { onProgress, signal, fields = {} } = {}) {
  const form = new FormData();
  form.append('file', file);
  // extra form fields, e.g. { language: 'bn' }
  for (const [key, value] of Object.entries(fields)) form.append(key, value);
  return api
    .post(url, form, {
      signal,
      onUploadProgress: (e) => {
        if (e.total) onProgress?.(Math.round((e.loaded * 100) / e.total));
      },
    })
    .then(data);
}

export const uploadAttachment = (lessonId, file, options) =>
  upload(`/teacher/lessons/${lessonId}/attachments`, file, options);
export const deleteAttachment = (lessonId, attachmentId) =>
  api.delete(`/teacher/lessons/${lessonId}/attachments/${attachmentId}`).then(data);
export const uploadThumbnail = (courseId, file, options) =>
  upload(`/teacher/courses/${courseId}/thumbnail`, file, options);
export const deleteThumbnail = (courseId) =>
  api.delete(`/teacher/courses/${courseId}/thumbnail`).then(data);

// ---- Quiz (one per lesson; the whole quiz is saved at once) ----
export const saveQuiz = (lessonId, body) => api.put(`/teacher/lessons/${lessonId}/quiz`, body).then(data);
export const deleteQuiz = (lessonId) => api.delete(`/teacher/lessons/${lessonId}/quiz`).then(data);
