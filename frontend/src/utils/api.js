import axios from 'axios';

// Create axios instance with base URL
const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'https://task-management-alpha-peach-74.vercel.app/api',
  withCredentials: true, // Important for cookies
  headers: {
    'Content-Type': 'application/json'
  }
});

// Auth API calls
export const register = async (email, password) => {
  const response = await api.post('/auth/register', { email, password });
  return response.data;
};

export const login = async (email, password) => {
  const response = await api.post('/auth/login', { email, password });
  return response.data;
};

export const logout = async () => {
  const response = await api.post('/auth/logout');
  return response.data;
};

export const getCurrentUser = async () => {
  const response = await api.get('/auth/me');
  return response.data;
};

// Task API calls
export const getTasks = async (page = 1, limit = 10, status = '', search = '') => {
  const params = new URLSearchParams();
  params.append('page', page);
  params.append('limit', limit);
  if (status && status !== 'all') params.append('status', status);
  if (search) params.append('search', search);
  
  const response = await api.get(`/tasks?${params.toString()}`);
  return response.data;
};

export const createTask = async (taskData) => {
  const response = await api.post('/tasks', taskData);
  return response.data;
};

export const updateTask = async (id, taskData) => {
  const response = await api.put(`/tasks/${id}`, taskData);
  return response.data;
};

export const deleteTask = async (id) => {
  const response = await api.delete(`/tasks/${id}`);
  return response.data;
};

export default api;