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
        responseType: 'blob', // Change to blob
        headers: {
          'Accept': 'application/pdf',
          'Content-Type': 'application/json'
        }
      });
      return new Blob([response], { type: 'application/pdf' });
    } catch (error) {
      if (error.response?.data) {
        // Handle error response as blob
        const text = await new Response(error.response.data).text();
        throw new Error(text || 'Failed to generate report');
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
      // For teacher role, use teacher profile endpoint
      const token = localStorage.getItem('token');
      const userRole = localStorage.getItem('role') || 'teacher'; // Default to teacher if no role
      
      if (userRole === 'teacher') {
        const response = await axiosInstance.get('/teacher/profile');
        return response;
      } else if (userRole === 'student') {
        const response = await axiosInstance.get('/student/profile');
        return response;
      }
      throw new Error('Invalid user role: ' + userRole);
    } catch (error) {
      console.error('Error fetching profile:', error);
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
  },

  getStudentReport: async (classId, subjectId) => {
    try {
      if (!classId || !subjectId) {
        throw new Error('Class ID and Subject ID are required');
      }
  
      const response = await axiosInstance.get('/attendance/student-report', {
        params: {
          classId,
          subjectName: subjectId // Change subjectId to subjectName to match backend
        }
      });
      
      // Handle null/undefined response
      if (!response || !response.data) {
        return {
          success: true,
          data: []
        };
      }
  
      return {
        success: true,
        data: response.data.map(student => ({
          name: student?.name || 'N/A',
          rollNumber: student?.rollNumber || 'N/A',
          totalLectures: student?.totalLectures || 0,
          present: student?.present || 0,
          absent: student?.absent || 0,
          percentage: student?.percentage || 0
        }))
      };
    } catch (error) {
      console.error('Error fetching student report:', error);
      throw error;
    }
  },

  getMonthlyReport: async (classId) => {
    try {
      if (!classId) {
        throw new Error('Class ID is required');
      }

      const response = await axiosInstance.get('/attendance/monthly-report', {
        params: { classId }
      });

      if (!response.success || !response.summary) {
        return {
          success: false,
          summary: {
            totalStudents: 0,
            present: 0,
            absent: 0,
            percentage: 0
          }
        };
      }

      return {
        success: true,
        summary: response.summary,
        dateRange: response.dateRange
      };

    } catch (error) {
      console.error('Error fetching monthly report:', error);
      return {
        success: false,
        message: error.response?.data?.message || error.message,
        summary: {
          totalStudents: 0,
          present: 0,
          absent: 0,
          percentage: 0
        }
      };
    }
  }
};
