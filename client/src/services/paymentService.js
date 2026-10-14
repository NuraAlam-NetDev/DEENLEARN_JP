import api from './api.js';

const data = (res) => res.data;

export const createCheckout = (courseId, provider) =>
  api.post('/payments/checkout', { courseId, provider }).then(data);
export const completeDevPayment = (paymentId, outcome) =>
  api.post(`/payments/dev/${paymentId}/complete`, { outcome }).then(data);
