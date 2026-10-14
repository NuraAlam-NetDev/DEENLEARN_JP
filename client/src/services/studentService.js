import api from './api.js';

// Thin wrappers around the student-side API. Each returns the response body (res.data).
const data = (res) => res.data;

// ---- Lessons ----
export const getLessonOutline = (courseId) => api.get(`/courses/${courseId}/lessons`).then(data);
export const getLesson = (id) => api.get(`/lessons/${id}`).then(data);

export const setLessonComplete = (id, completed) =>
  (completed ? api.post(`/lessons/${id}/complete`) : api.delete(`/lessons/${id}/complete`)).then(data);

// ---- Bookmarks ----
export const setLessonBookmark = (id, bookmarked) =>
  (bookmarked ? api.post(`/lessons/${id}/bookmark`) : api.delete(`/lessons/${id}/bookmark`)).then(data);

// ---- Profile ----
export const updateProfile = (body) => api.patch('/auth/me', body).then(data);
export const changePassword = (body) => api.put('/auth/password', body).then(data);

// ---- Quiz ----
// answers: [{ question, selected: [optionId, ...] }]
export const submitQuizAttempt = (lessonId, answers) =>
  api.post(`/lessons/${lessonId}/quiz/attempts`, { answers }).then(data);

// ---- Notes ----
// An empty string deletes the note
export const saveNote = (lessonId, content) => api.put(`/lessons/${lessonId}/note`, { content }).then(data);
