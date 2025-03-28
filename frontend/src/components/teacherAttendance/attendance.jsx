import React, { useState, useEffect } from 'react';
import { QrCode, Camera, Check, X, Filter, Users, Clock, Book, Calendar } from 'lucide-react';
import { api } from '../../services/api';
import { format } from 'date-fns';

const AttendanceDashboard = () => {
  const [students, setStudents] = useState([]);
  const [activeModal, setActiveModal] = useState(null);
  const [filters, setFilters] = useState({
    class: '',
    date: format(new Date(), 'yyyy-MM-dd')
  });
  const [teacherClasses, setTeacherClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [attendanceTime, setAttendanceTime] = useState({
    startTime: format(new Date(), 'HH:mm'),
    endTime: format(new Date(Date.now() + 3600000), 'HH:mm')
  });
  const [selectedSubject, setSelectedSubject] = useState('');
  const [subjects, setSubjects] = useState([]);

  useEffect(() => {
    fetchTeacherData();
  }, []);

  useEffect(() => {
    if (filters.class) {
      fetchStudents(filters.class);
    }
  }, [filters.class]);

  const fetchTeacherData = async () => {
    try {
      const profile = await api.getTeacherProfile();
      setTeacherClasses(profile.assignedClasses || []);
      setSubjects(profile.subjects || []);
      if (profile.assignedClasses?.length > 0) {
        setFilters(prev => ({ ...prev, class: profile.assignedClasses[0]._id }));
      }
      if (profile.subjects?.length > 0) {
        setSelectedSubject(profile.subjects[0].name);
      }
    } catch (error) {
      console.error('Error fetching teacher data:', error);
    }
  };

  const fetchStudents = async (classId) => {
    try {
      setLoading(true);
      const studentsData = await api.getStudentsByClass(classId);
      
      // Get today's attendance if exists
      const today = new Date();
      const todayReport = await api.getTodayClassReport(classId);
      
      const studentsWithAttendance = studentsData.map(student => ({
        ...student,
        status: todayReport?.records?.find(r => r.student._id === student._id)?.status || 'present'
      }));

      setStudents(studentsWithAttendance);
    } catch (error) {
      console.error('Error fetching students:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateStudentStatus = (id, status) => {
    setStudents(students.map(student => 
      student._id === id ? { ...student, status } : student
    ));
  };

  const handleSaveAttendance = async () => {
    try {
      if (!filters.class || !attendanceTime.startTime || !attendanceTime.endTime || !selectedSubject) {
        alert('Please select class, subject, and time');
        return;
      }

      const selectedClass = teacherClasses.find(c => c._id === filters.class);
      const absentStudents = students.filter(s => s.status === 'absent');

      const attendanceData = {
        classId: filters.class,
        date: new Date(filters.date),
        students: students.map(s => ({
          id: s._id,
          status: s.status
        })),
        startTime: new Date(`${filters.date} ${attendanceTime.startTime}`),
        endTime: new Date(`${filters.date} ${attendanceTime.endTime}`),
        subject: selectedSubject,
      };

      await api.saveAttendance(attendanceData);

      // Trigger n8n webhook for absent students
      if (absentStudents.length > 0) {
        await Promise.all(absentStudents.map(student => 
          api.triggerAbsentNotification({
            studentId: student._id,
            studentName: student.name,
            parentPhone: student.parentDetails?.phone,
            class: `${selectedClass.name}${selectedClass.section}`,
            date: filters.date
          })
        ));
      }

      alert('Attendance saved successfully!');
    } catch (error) {
      console.error('Error saving attendance:', error);
      alert('Failed to save attendance');
    }
  };

  return (
    <div className="bg-gradient-to-br from-[#121212] to-[#1e1e1e] min-h-screen text-white p-6 font-sans">
      {/* Header Section */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-500 mb-2">
            Attendance Dashboard
          </h1>
          <p className="text-gray-400 flex items-center">
            <Calendar className="mr-2 text-blue-400" size={18} />
            {format(new Date(filters.date), 'EEEE, MMMM d, yyyy')}
          </p>
        </div>
        <div className="flex space-x-4">
          <button 
            onClick={() => setActiveModal('qr')}
            className="bg-gradient-to-r from-green-500 to-green-600 text-white px-5 py-2.5 rounded-lg flex items-center hover:scale-105 transition-transform shadow-lg"
          >
            <QrCode className="mr-2" size={20} /> QR Scan
          </button>
          <button 
            onClick={handleSaveAttendance}
            className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white px-5 py-2.5 rounded-lg hover:scale-105 transition-transform shadow-lg flex items-center"
          >
            <Check className="mr-2" size={20} />
            Save Attendance
          </button>
        </div>
      </div>

      {/* Filters Section */}
      <div className="bg-[#1f1f1f] rounded-2xl shadow-xl p-6 mb-6 border border-[#2a2a2a]">
        <div className="grid grid-cols-4 gap-4">
          <div className="col-span-4 mb-4">
            <h2 className="text-xl font-bold flex items-center text-gray-200">
              <Filter className="mr-3 text-blue-400" size={24} /> 
              Attendance Details
            </h2>
          </div>
          
          <div className="space-y-2">
            <label className="text-sm text-gray-400">Class</label>
            <select 
              value={filters.class}
              onChange={(e) => setFilters(prev => ({ ...prev, class: e.target.value }))}
              className="w-full bg-[#2a2a2a] text-white p-2 rounded-lg border border-[#3a3a3a]"
            >
              <option value="">Select Class</option>
              {teacherClasses.map(cls => (
                <option key={cls._id} value={cls._id}>
                  {cls.name} - {cls.section}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-sm text-gray-400">Subject</label>
            <select
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
              className="w-full bg-[#2a2a2a] text-white p-2 rounded-lg border border-[#3a3a3a]"
            >
              <option value="">Select Subject</option>
              {subjects.map(subject => (
                <option key={subject.code} value={subject.name}>
                  {subject.name}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-sm text-gray-400">Start Time</label>
            <input
              type="time"
              value={attendanceTime.startTime}
              onChange={(e) => setAttendanceTime(prev => ({ ...prev, startTime: e.target.value }))}
              className="w-full bg-[#2a2a2a] text-white p-2 rounded-lg border border-[#3a3a3a]"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm text-gray-400">End Time</label>
            <input
              type="time"
              value={attendanceTime.endTime}
              onChange={(e) => setAttendanceTime(prev => ({ ...prev, endTime: e.target.value }))}
              className="w-full bg-[#2a2a2a] text-white p-2 rounded-lg border border-[#3a3a3a]"
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-[1fr_350px] gap-6">
        {/* Student List */}
        <div className="bg-[#1f1f1f] rounded-2xl p-6 shadow-xl border border-[#2a2a2a]">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-gray-200 flex items-center">
              <Users className="mr-3 text-blue-400" size={24} />
              {filters.class} • {new Date(filters.date).toLocaleDateString('en-US', { 
                month: 'long', 
                day: 'numeric', 
                year: 'numeric' 
              })}
            </h2>
            <div className="space-x-2 flex">
              <button 
                onClick={() => setStudents(students.map(student => ({ ...student, status: 'present' })))}
                className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-green-700 transition-colors"
              >
                Mark All Present
              </button>
              <button 
                onClick={() => setStudents(students.map(student => ({ ...student, status: 'absent' })))}
                className="bg-red-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-red-700 transition-colors"
              >
                Mark All Absent
              </button>
            </div>
          </div>

          <div className="space-y-3">
            {loading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
              </div>
            ) : (
              students.map((student) => (
                <div 
                  key={student._id} 
                  className="flex justify-between items-center bg-[#2a2a2a] p-4 rounded-xl hover:bg-[#3a3a3a] transition-colors group"
                >
                  <div className="flex items-center space-x-4">
                    <div className="w-10 h-10 rounded-full overflow-hidden">
                      <img
                        src={student.photo 
                          ? `http://localhost:3000/${student.photo}` 
                          : '/default-avatar.png'
                        }
                        alt={student.name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.target.src = '/default-avatar.png';
                          e.target.onerror = null;
                        }}
                      />
                    </div>
                    <div>
                      <span className="font-medium group-hover:text-blue-400 transition-colors">
                        {student.name}
                      </span>
                      <p className="text-sm text-gray-400">Roll: {student.rollNumber}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => updateStudentStatus(student._id, 'present')}
                      className={`px-4 py-2 rounded-lg flex items-center transition-all
                        ${student.status === 'present' 
                          ? 'bg-green-600 text-white scale-105' 
                          : 'bg-gray-700 text-gray-400 hover:bg-green-700 hover:text-white'}`}
                    >
                      <Check className="mr-1" size={16} /> Present
                    </button>
                    <button
                      onClick={() => updateStudentStatus(student._id, 'absent')}
                      className={`px-4 py-2 rounded-lg flex items-center transition-all
                        ${student.status === 'absent' 
                          ? 'bg-red-600 text-white scale-105' 
                          : 'bg-gray-700 text-gray-400 hover:bg-red-700 hover:text-white'}`}
                    >
                      <X className="mr-1" size={16} /> Absent
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Summary Sidebar */}
        <div className="space-y-6">
          <div className="bg-[#1f1f1f] rounded-2xl p-6 shadow-xl border border-[#2a2a2a]">
            <h3 className="text-lg font-bold mb-5 text-gray-200 flex items-center">
              <Users className="mr-3 text-blue-400" size={20} /> 
              Attendance Summary
            </h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <div className="flex items-center space-x-3">
                  <Users className="text-gray-400" size={18} />
                  <span>Total Students</span>
                </div>
                <span className="font-semibold">{students.length}</span>
              </div>
              <div className="flex justify-between items-center">
                <div className="flex items-center space-x-3 text-green-500">
                  <Check className="text-green-500" size={18} />
                  <span>Present</span>
                </div>
                <span className="font-semibold text-green-500">{students.filter(s => s.status === 'present').length}</span>
              </div>
              <div className="flex justify-between items-center">
                <div className="flex items-center space-x-3 text-red-500">
                  <X className="text-red-500" size={18} />
                  <span>Absent</span>
                </div>
                <span className="font-semibold text-red-500">{students.filter(s => s.status === 'absent').length}</span>
              </div>
              <div className="flex justify-between items-center">
                <div className="flex items-center space-x-3">
                  <Clock className="text-gray-400" size={18} />
                  <span>Attendance Rate</span>
                </div>
                <span className="font-semibold text-blue-400">
                  {Math.round((students.filter(s => s.status === 'present').length / students.length) * 100)}%
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AttendanceDashboard;