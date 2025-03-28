import axios from 'axios';

const API_URL = 'http://localhost:3000/api';

const axiosInstance = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add response interceptor
axiosInstance.interceptors.response.use(
  response => response.data,
  error => {
    console.error('API Error:', error.response?.data || error.message);
    throw error;
  }
);

// Add request interceptor
axiosInstance.interceptors.request.use(
  config => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  error => {
    return Promise.reject(error);
  }
);

export const api = {
  getClasses: async () => {
    try {
      const response = await axiosInstance.get('/classes');
      return response;
    } catch (error) {
      console.error('Error fetching classes:', error);
      throw error;
    }
  },

  getStudentsByClass: async (classId) => {
    try {
      if (!classId) {
        throw new Error('Class ID is required');
      }
      const response = await axiosInstance.get(`/classes/${classId}/students`);
      return response;
    } catch (error) {
      console.error('Error fetching students:', error);
      throw error;
    }
  },

  saveAttendance: async (attendanceData) => {
    try {
      const response = await axiosInstance.post('/attendance/save', attendanceData);
      return response;
    } catch (error) {
      console.error('Error saving attendance:', error);
      throw error;
    }
  },

  getTeacherProfile: async () => {
    try {
      const response = await axiosInstance.get('/teacher/profile');
      return response;
    } catch (error) {
      console.error('Error fetching teacher profile:', error.response?.data?.message || error.message);
      throw error;
    }
  },

  updateTeacherProfile: async (profileData) => {
    try {
      const response = await axiosInstance.put('/teacher/profile', profileData);
      return response;
    } catch (error) {
      console.error('Error updating teacher profile:', error.response?.data?.message || error.message);
      throw error;
    }
  },

  getDashboardSummary: async () => {
    try {
      const response = await axiosInstance.get('/attendance/dashboard-summary');
      return response;
    } catch (error) {
      console.error('Error fetching dashboard summary:', error);
      throw error;
    }
  },

  generateAttendanceReport: async (data) => {
    try {
      const response = await axiosInstance.post('/attendance/report', data, {
        responseType: 'arraybuffer', // Important for PDF download
        headers: {
          'Accept': 'application/pdf'
        }
      });
      return response;
    } catch (error) {
      if (error.response?.data) {
        const decodedError = new TextDecoder().decode(error.response.data);
        throw new Error(decodedError);
      }
      throw error;
    }
  },

  getDailyReport: async (classId, date) => {
    try {
      const response = await axiosInstance.get('/attendance/daily-report', {
        params: { 
          classId, 
          date: new Date(date).toISOString() 
        }
      });
      return response;
    } catch (error) {
      console.error('Error fetching daily report:', error);
      throw error;
    }
  },

  getTodayClassReport: async (classId, subjectId) => {
    try {
      const response = await axiosInstance.get('/attendance/today-class-report', {
        params: { classId, subjectId }
      });
      return response;
    } catch (error) {
      console.error('Error fetching today class report:', error);
      throw error;
    }
  },

  getStudentProfile: async () => {
    try {
      const response = await axiosInstance.get('/student/complete-profile');
      return response;
    } catch (error) {
      console.error('Error fetching student profile:', error);
      throw error;
    }
  },

  markAttendanceByQR: async (qrData) => {
    try {
      const response = await axiosInstance.post('/attendance/mark-by-qr', qrData);
      return response;
    } catch (error) {
      console.error('Error marking attendance:', error);
      throw error;
    }
  },

  getQRCode: async () => {
    try {
      const response = await axiosInstance.get('/student/qr-code');
      return response;
    } catch (error) {
      console.error('Error fetching QR code:', error);
      throw error;
    }
  },

  verifyQRAttendance: async (qrData) => {
    try {
      const response = await axiosInstance.post('/attendance/verify-qr', qrData);
      return response;
    } catch (error) {
      console.error('Error verifying QR attendance:', error);
      throw error;
    }
  },

  createQRSession: async (sessionData) => {
    try {
      const response = await axiosInstance.post('/attendance/qr-session', sessionData);
      return response;
    } catch (error) {
      console.error('Error creating QR session:', error);
      throw error;
    }
  },

  verifyQRLocation: async (data) => {
    try {
      const response = await axiosInstance.post('/attendance/verify-location', data);
      return response;
    } catch (error) {
      console.error('Error verifying location:', error);
      throw error;
    }
  },

  triggerAbsentNotification: async (data) => {
    try {
      const response = await axios.post('https://ub05.app.n8n.cloud/webhook/student-absence', data);
      return response;
    } catch (error) {
      console.error('Error triggering notification:', error);
      throw error;
    }
  }
};
