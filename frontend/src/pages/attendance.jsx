import React, { useState, useEffect } from 'react';
import { Calendar, Search, ChevronDown, User } from 'lucide-react';
import { toast } from 'react-hot-toast';
import api from '../api/api';

const Attendance = () => {
  const [classes, setClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState(null);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchClasses();
  }, []);

  useEffect(() => {
    if (selectedClass) {
      fetchStudents(selectedClass);
    }
  }, [selectedClass]);

  const fetchClasses = async () => {
    try {
      const response = await api.get('/classes');
      setClasses(response.data);
      setLoading(false);
    } catch (error) {
      toast.error('Failed to fetch classes');
      setLoading(false);
    }
  };

  const fetchStudents = async (classId) => {
    try {
      const response = await api.get(`/classes/${classId}/students`);
      setStudents(response.data);
    } catch (error) {
      toast.error('Failed to fetch students');
    }
  };

  const filteredStudents = students.filter(student =>
    student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    student.rollNumber.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="bg-black min-h-screen p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-white mb-8">
          Attendance Management
        </h1>

        {/* Filters Section */}
        <div className="bg-gray-900 p-6 rounded-xl mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Class Selection */}
            <div>
              <label className="block text-gray-400 mb-2">Select Class</label>
              <select
                className="w-full bg-gray-800 text-white px-4 py-2 rounded-lg"
                onChange={(e) => setSelectedClass(e.target.value)}
                value={selectedClass || ''}
              >
                <option value="">All Classes</option>
                {classes.map(cls => (
                  <option key={cls._id} value={cls._id}>
                    {cls.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Search Bar */}
            <div>
              <label className="block text-gray-400 mb-2">Search Students</label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search by name or roll number..."
                  className="w-full bg-gray-800 text-white px-4 py-2 rounded-lg pl-10"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                <Search className="absolute left-3 top-2.5 text-gray-400" size={20} />
              </div>
            </div>
          </div>
        </div>

        {/* Students Table */}
        <div className="bg-gray-900 rounded-xl overflow-hidden">
          {loading ? (
            <div className="text-center py-8 text-gray-400">Loading...</div>
          ) : (
            <table className="w-full">
              <thead className="bg-gray-800">
                <tr>
                  <th className="px-6 py-4 text-left text-gray-400">Roll No.</th>
                  <th className="px-6 py-4 text-left text-gray-400">Name</th>
                  <th className="px-6 py-4 text-left text-gray-400">Department</th>
                  <th className="px-6 py-4 text-left text-gray-400">Present Today</th>
                  <th className="px-6 py-4 text-left text-gray-400">Total Attendance</th>
                </tr>
              </thead>
              <tbody>
                {filteredStudents.map((student) => (
                  <tr key={student._id} className="border-t border-gray-800 hover:bg-gray-800">
                    <td className="px-6 py-4 text-white">{student.rollNumber}</td>
                    <td className="px-6 py-4 text-white">{student.name}</td>
                    <td className="px-6 py-4 text-white">{student.department}</td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-sm ${
                        student.presentToday ? 'bg-green-500' : 'bg-red-500'
                      }`}>
                        {student.presentToday ? 'Present' : 'Absent'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-white">
                      {student.attendancePercentage}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {!loading && filteredStudents.length === 0 && (
            <div className="text-center py-8 text-gray-400">
              No students found
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Attendance;
