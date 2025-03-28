import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:3000/api',
});

api.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  const userData = JSON.parse(localStorage.getItem('user') || '{}');
  
  console.log('User Data:', userData); // Debug log

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
    config.headers['X-User-Id'] = userData._id; // Add user ID to headers
  }

  console.log('API Request:', {
    method: config.method,
    url: config.url,
    headers: config.headers
  });
  
  return config;
});

api.interceptors.response.use(
  response => response,
  error => {
    console.error('API Error:', {
      url: error.config?.url,
      method: error.config?.method,
      status: error.response?.status,
      data: error.response?.data
    });
    return Promise.reject(error);
  }
);

export default api;
