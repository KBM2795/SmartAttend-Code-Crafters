import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import QRAttendance from './QRAttendance';
import { QrCode, Users, RefreshCw, Clock } from 'lucide-react';

const TeacherAttendancePage = () => {
  const [selectedClass, setSelectedClass] = useState(null);
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [showQR, setShowQR] = useState(false);
  const [teacherClasses, setTeacherClasses] = useState([]);
  const [attendanceData, setAttendanceData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [students, setStudents] = useState([]);
  const [attendanceTime, setAttendanceTime] = useState({
    startTime: '',
    endTime: ''
  });

  useEffect(() => {
    fetchTeacherData();
  }, []);

  useEffect(() => {
    if (selectedClass?._id) {
      fetchStudents(selectedClass._id);
    }
  }, [selectedClass]);

  const fetchTeacherData = async () => {
    try {
      const profile = await api.getTeacherProfile();
      setTeacherClasses(profile.assignedClasses || []);
      if (profile.subjects) {
        setSelectedSubject(profile.subjects[0]);
      }
    } catch (error) {
      console.error('Error fetching teacher data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStudents = async (classId) => {
    try {
      const data = await api.getStudentsByClass(classId);
      setStudents(data.map(student => ({
        ...student,
        status: 'present' // Default status
      })));
    } catch (error) {
      console.error('Error fetching students:', error);
    }
  };

  const handleCreateSession = async () => {
    if (!selectedClass || !selectedSubject) {
      alert('Please select class and subject');
      return;
    }

    try {
      // Get current location
      const position = await new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject);
      });

      const sessionData = {
        classId: selectedClass._id,
        subject: selectedSubject.name,
        location: {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          radius: 100 // meters
        },
        startTime: new Date(),
        endTime: new Date(Date.now() + 3600000) // 1 hour session
      };

      const response = await api.createQRSession(sessionData);
      setShowQR(true);
      startAttendancePolling(selectedClass._id);
    } catch (error) {
      console.error('Error creating session:', error);
      alert('Failed to create QR session');
    }
  };

  const startAttendancePolling = (classId) => {
    const pollInterval = setInterval(async () => {
      try {
        const report = await api.getTodayClassReport(classId);
        setAttendanceData(report.records || []);
      } catch (error) {
        console.error('Error polling attendance:', error);
      }
    }, 5000); // Poll every 5 seconds

    return () => clearInterval(pollInterval);
  };

  const handleStatusChange = (studentId, newStatus) => {
    setStudents(students.map(student =>
      student._id === studentId ? { ...student, status: newStatus } : student
    ));
  };

  const handleSaveAttendance = async () => {
    try {
      if (!selectedClass || !selectedSubject || !attendanceTime.startTime || !attendanceTime.endTime) {
        alert('Please fill in all required fields');
        return;
      }

      const attendanceData = {
        classId: selectedClass._id,
        date: new Date(),
        subject: selectedSubject.name,
        startTime: new Date(`${new Date().toDateString()} ${attendanceTime.startTime}`),
        endTime: new Date(`${new Date().toDateString()} ${attendanceTime.endTime}`),
        students: students.map(student => ({
          id: student._id,
          status: student.status
        }))
      };

      const response = await api.saveAttendance(attendanceData);
      alert('Attendance saved successfully!');
      
    } catch (error) {
      console.error('Error saving attendance:', error);
      alert('Failed to save attendance');
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Mark Attendance</h1>
        <button
          onClick={() => handleCreateSession()}
          className="bg-green-500 text-white px-4 py-2 rounded flex items-center gap-2"
        >
          <QrCode size={20} />
          Generate QR Code
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <select
          value={selectedClass?._id || ''}
          onChange={(e) => setSelectedClass(teacherClasses.find(c => c._id === e.target.value))}
          className="bg-gray-800 rounded p-2"
        >
          <option value="">Select Class</option>
          {teacherClasses.map(cls => (
            <option key={cls._id} value={cls._id}>
              {cls.name} - {cls.section}
            </option>
          ))}
        </select>

        <select
          value={selectedSubject?.name || ''}
          onChange={(e) => setSelectedSubject({ name: e.target.value })}
          className="bg-gray-800 rounded p-2"
        >
          <option value="">Select Subject</option>
          {teacherClasses.length > 0 && teacherClasses[0].subjects?.map(subject => (
            <option key={subject.code} value={subject.name}>
              {subject.name} ({subject.code})
            </option>
          ))}
        </select>

        <div className="col-span-2 grid grid-cols-2 gap-4">
          <input
            type="time"
            value={attendanceTime.startTime}
            onChange={(e) => setAttendanceTime(prev => ({ ...prev, startTime: e.target.value }))}
            className="bg-gray-800 rounded p-2"
            placeholder="Start Time"
          />
          <input
            type="time"
            value={attendanceTime.endTime}
            onChange={(e) => setAttendanceTime(prev => ({ ...prev, endTime: e.target.value }))}
            className="bg-gray-800 rounded p-2"
            placeholder="End Time"
          />
        </div>
      </div>

      <div className="bg-gray-800 rounded-lg p-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Mark Attendance</h2>
          <div className="flex gap-2">
            <button
              onClick={() => setStudents(s => s.map(student => ({ ...student, status: 'present' })))}
              className="bg-green-500/20 text-green-500 px-3 py-1 rounded"
            >
              Mark All Present
            </button>
            <button
              onClick={handleSaveAttendance}
              className="bg-blue-500 text-white px-3 py-1 rounded"
            >
              Save Attendance
            </button>
          </div>
        </div>

        <div className="space-y-2">
          {students.map((student) => (
            <div
              key={student._id}
              className={`flex justify-between items-center p-3 rounded-lg ${
                student.status === 'present'
                  ? 'bg-green-500/10 border border-green-500/20'
                  : 'bg-red-500/10 border border-red-500/20'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-gray-700 overflow-hidden">
                  {student.photo && (
                    <img
                      src={`${import.meta.env.VITE_API_URL}/uploads/photos/${student.photo}`}
                      alt={student.name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.target.src = '/default-avatar.png';
                        e.target.onerror = null;
                      }}
                    />
                  )}
                </div>
                <div>
                  <p className="font-semibold">{student.name}</p>
                  <p className="text-sm text-gray-400">{student.rollNumber}</p>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handleStatusChange(student._id, 'present')}
                  className={`px-3 py-1 rounded ${
                    student.status === 'present'
                      ? 'bg-green-500 text-white'
                      : 'bg-green-500/20 text-green-500'
                  }`}
                >
                  Present
                </button>
                <button
                  onClick={() => handleStatusChange(student._id, 'absent')}
                  className={`px-3 py-1 rounded ${
                    student.status === 'absent'
                      ? 'bg-red-500 text-white'
                      : 'bg-red-500/20 text-red-500'
                  }`}
                >
                  Absent
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* QR Code Modal */}
      {showQR && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4">
          <div className="bg-gray-800 rounded-lg p-6 max-w-md w-full">
            <QRAttendance
              classId={selectedClass._id}
              subject={selectedSubject.name}
              onClose={() => setShowQR(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default TeacherAttendancePage;
