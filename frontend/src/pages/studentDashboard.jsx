import React, { useState, useEffect } from 'react';
import { User, Calendar, Award, Clock, CheckCircle, XCircle, QrCode, LogOut } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';
import api from '../api/api';
import QrScanner from '../components/QrScanner';
import { useNavigate } from 'react-router-dom';

const StudentDashboard = () => {
  const [studentData, setStudentData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showScanner, setShowScanner] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate()

  // Add default values for attendance stats
  const defaultStats = {
    totalDays: 0,
    present: 0,
    absent: 0,
    percentage: 0
  };

  const attendanceStats = studentData?.attendanceStats || defaultStats;

  const fetchStudentData = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Not authenticated');
      }

      const response = await api.get('/students/complete-profile');
      
      // Transform dates and format attendance data
      const transformedData = {
        ...response.data,
        recentAttendance: response.data.recentAttendance.map(record => ({
          ...record,
          date: new Date(record.date).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
          }),
          time: record.timing ? new Date(record.timing.startTime).toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit'
          }) : 'N/A'
        }))
      };
      
      setStudentData(transformedData);
      setLoading(false);
    } catch (error) {
      console.error('Failed to fetch student data:', error);
      toast.error('Failed to load profile data');
      setLoading(false);
    }
  };

  const handleScan = async (decodedText) => {
    try {
      const response = await api.post('/attendance/mark', { qrCode: decodedText });
      toast.success('Attendance marked successfully!');
      fetchStudentData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to mark attendance');
    } finally {
      setShowScanner(false);
    }
  };

  const handleLogout = () => {
    logout();
  };

  useEffect(() => {
    const fetchStudentData = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          throw new Error('Not authenticated');
        }

        const response = await api.get('/students/complete-profile');
        
        // Transform dates and format attendance data
        const transformedData = {
          ...response.data,
          recentAttendance: response.data.recentAttendance.map(record => ({
            ...record,
            date: new Date(record.date).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'short',
              day: 'numeric'
            }),
            time: record.timing ? new Date(record.timing.startTime).toLocaleTimeString('en-US', {
              hour: '2-digit',
              minute: '2-digit'
            }) : 'N/A'
          }))
        };
        
        setStudentData(transformedData);
        setLoading(false);
      } catch (error) {
        console.error('Failed to fetch student data:', error);
        toast.error('Failed to load profile data');
        setLoading(false);
      }
    };

    fetchStudentData();
  }, []);

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">
      <div className="text-green-500">Loading...</div>
    </div>;
  }

  return (
    <div className="bg-black text-white min-h-screen p-6 font-sans">
      <div className="flex justify-between items-center mb-8">
        <div className="text-3xl font-bold mb-10 text-white">
          Smart<span className="text-green-500">Attend</span>
        </div>
        <div className="flex gap-4">
          <button
            onClick={() => setShowScanner(true)}
            className="bg-green-500 hover:bg-green-600 text-white px-6 py-2 rounded-lg flex items-center gap-2 transition-all duration-300"
          >
            <QrCode size={20} />
            Scan QR
          </button>
          <button
            onClick={() => {
                localStorage.removeItem("token");
                navigate("/login")
            }}
            className="bg-red-500 hover:bg-red-600 text-white px-6 py-2 rounded-lg flex items-center gap-2 transition-all duration-300"
          >
            <LogOut size={20} />
            Logout
          </button>
        </div>
      </div>

      {showScanner && (
        <QrScanner
          onScan={handleScan}
          onClose={() => setShowScanner(false)}
        />
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
        {/* Profile Card */}
        <div className="bg-gray-900 p-8 rounded-2xl shadow-2xl hover:scale-[1.02] transition-all">
          <div className="flex items-center mb-6">
            <div className="w-20 h-20 bg-gray-800 rounded-full overflow-hidden">
              {studentData?.photo ? (
                <img 
                  src={studentData.photo} 
                  alt={studentData?.name || 'Student'}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = 'default-avatar.png';
                  }}
                />
              ) : (
                <User size={40} className="w-full h-full p-4 text-white" />
              )}
            </div>
            <div className="ml-6">
              <h2 className="text-2xl font-bold text-green-500">{studentData?.name || 'Loading...'}</h2>
              <p className="text-gray-400">{studentData?.rollNumber || 'Loading...'}</p>
            </div>
          </div>
          <div className="space-y-4 text-gray-300">
            <div className="flex items-center">
              <Award className="mr-3 text-green-500" size={20} />
              <p>Department: {studentData?.department || 'Loading...'}</p>
            </div>
            <div className="flex items-center">
              <Clock className="mr-3 text-green-500" size={20} />
              <p>Semester: {studentData?.semester || 'Loading...'}</p>
            </div>
            <div className="flex items-center">
              <Calendar className="mr-3 text-green-500" size={20} />
              <p>Class: {studentData?.class?.name || 'Loading...'}</p>
            </div>
          </div>
        </div>

        {/* Attendance Summary */}
        <div className="bg-gray-900 p-8 rounded-2xl shadow-2xl hover:scale-[1.02] transition-all">
          <h3 className="text-2xl font-bold mb-6 text-green-500">Attendance Summary</h3>
          <div className="grid grid-cols-2 gap-6">
            {[
              { label: 'Total Days', value: attendanceStats.totalDays, icon: Clock },
              { label: 'Present', value: attendanceStats.present, icon: CheckCircle },
              { label: 'Absent', value: attendanceStats.absent, icon: XCircle },
              { label: 'Percentage', value: `${attendanceStats.percentage}%`, icon: Award }
            ].map((item, index) => (
              <div 
                key={index} 
                className="bg-gray-800 p-6 rounded-2xl 
                            transform transition-all duration-300 
                            hover:scale-110 hover:shadow-2xl"
              >
                <div className="flex justify-between items-center mb-3">
                  <p className="text-gray-400">{item.label}</p>
                  <item.icon className="text-white" size={24} />
                </div>
                <p className="text-3xl font-bold text-white">{item.value}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Attendance Records */}
      <div className="bg-gray-900 p-8 rounded-2xl shadow-2xl">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-2xl font-bold text-green-500">Attendance Records</h3>
          <select className="bg-gray-800 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-all duration-300">
            <option>All Records</option>
            <option>This Month</option>
            <option>Previous Month</option>
          </select>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="border-b border-gray-700">
              <tr>
                <th className="text-left py-4 text-gray-400">Date</th>
                <th className="text-left py-4 text-gray-400">Time</th>
                <th className="text-left py-4 text-gray-400">Subject</th>
                <th className="text-left py-4 text-gray-400">Status</th>
              </tr>
            </thead>
            <tbody>
              {studentData?.recentAttendance?.length > 0 ? (
                studentData.recentAttendance.map((record, index) => (
                  <tr key={index} className="border-b border-gray-700 hover:bg-gray-800">
                    <td className="py-4">{record.date}</td>
                    <td className="py-4">{record.time}</td>
                    <td className="py-4">{record.subject}</td>
                    <td className="py-4">
                      <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                        record.status === 'present' ? 'bg-green-600' : 'bg-red-600'
                      } text-white`}>
                        {record.status.charAt(0).toUpperCase() + record.status.slice(1)}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="4" className="py-4 text-center text-gray-400">
                    No attendance records found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default StudentDashboard;