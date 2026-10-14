import api from './api.js';

// Questions & replies under a lesson. Used by students AND teachers (the server checks access).
const data = (res) => res.data;

export const askQuestion = (lessonId, body) => api.post(`/lessons/${lessonId}/questions`, body).then(data); // { title, body }
export const removeQuestion = (id) => api.delete(`/questions/${id}`).then(data);
export const postReply = (questionId, body) => api.post(`/questions/${questionId}/replies`, { body }).then(data);
export const removeReply = (id) => api.delete(`/replies/${id}`).then(data);
export const setReplyAccepted = (id, accepted) => api.patch(`/replies/${id}/accept`, { accepted }).then(data);
