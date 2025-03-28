import React, { useState } from 'react';
import { QrCode, User, Calendar, Award, Clock, CheckCircle, XCircle } from 'lucide-react';

const StudentDashboard = () => {
  const [activeTab, setActiveTab] = useState('attendance');
  const [showQRModal, setShowQRModal] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState(null);

  const attendanceRecords = [
    { date: 'March 27, 2025', time: '12:00 am', status: 'Present' },
    { date: 'March 26, 2025', time: '12:00 am', status: 'Absent' },
    { date: 'March 25, 2025', time: '12:00 am', status: 'Present' },
    { date: 'March 24, 2025', time: '12:00 am', status: 'Present' },
    { date: 'March 23, 2025', time: '12:00 am', status: 'Absent' },
  ];

  const QRAttendanceModal = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-900 p-8 rounded-2xl shadow-2xl text-center transform transition-all duration-300 hover:scale-[1.02]">
        <h2 className="text-2xl font-bold mb-6 text-green-500">Scan QR for Attendance</h2>
        <div className="flex justify-center mb-6">
          <div className="w-72 h-72 bg-gray-800 flex items-center justify-center rounded-2xl shadow-2xl">
            <QrCode size={250} className="text-green-500 animate-pulse" />
          </div>
        </div>
        <p className="text-gray-400 mb-6">
          Position the QR code within the camera frame to mark your attendance
        </p>
        <div className="flex justify-center space-x-4">
          <button 
            onClick={() => setShowQRModal(false)} 
            className="px-6 py-3 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition-colors duration-300"
          >
            Cancel
          </button>
          <button 
            className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all duration-300 transform hover:scale-105"
          >
            Confirm Attendance
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="bg-black text-white min-h-screen p-6 font-sans">
      {showQRModal && <QRAttendanceModal />}
      
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">CheckIn Buddy</h1>
        <button 
          onClick={() => setShowQRModal(true)}
          className="bg-green-600 text-white px-6 py-3 rounded-lg flex items-center 
                     hover:bg-green-700 transition-all duration-300 
                     transform hover:scale-105 active:scale-95 shadow-lg"
        >
          <QrCode className="mr-3" size={24} /> 
          QR Attendance
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
        {/* Profile Card */}
        <div className="bg-gray-900 p-8 rounded-2xl 
                        shadow-2xl 
                        transform transition-all duration-300 
                        hover:scale-[1.02] hover:shadow-2xl">
          <div className="flex items-center mb-6">
            <div className="w-20 h-20 bg-gray-800 rounded-full 
                            flex items-center justify-center mr-6 
                            shadow-2xl 
                            transform transition-transform duration-500 
                            hover:rotate-6">
              <User size={40} className="text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-green-500">Alex Johnson</h2>
              <p className="text-gray-400">STU02023042</p>
            </div>
          </div>
          <div className="space-y-4 text-gray-300">
            <div className="flex items-center">
              <Award className="mr-3 text-green-500" size={20} />
              <p>Department: Computer Science</p>
            </div>
            <div className="flex items-center">
              <Clock className="mr-3 text-green-500" size={20} />
              <p>Semester: 4th Semester</p>
            </div>
            <div className="flex items-center">
              <Calendar className="mr-3 text-green-500" size={20} />
              <p>Academic Year: 2023-2024</p>
            </div>
            <div className="flex items-center">
              <CheckCircle className="mr-3 text-green-500" size={20} />
              <p>Student Status: <span className="text-green-500 font-bold">Active</span></p>
            </div>
          </div>
        </div>

        {/* Attendance Summary */}
        <div className="bg-gray-900 p-8 rounded-2xl 
                        shadow-2xl 
                        transform transition-all duration-300 
                        hover:scale-[1.02] hover:shadow-2xl">
          <h3 className="text-2xl font-bold mb-6 text-green-500">Attendance Summary</h3>
          <div className="grid grid-cols-2 gap-6">
            {[
              { label: 'Total Days', value: '19', color: 'text-white', icon: Clock },
              { label: 'Present', value: '12', color: 'text-green-500', icon: CheckCircle },
              { label: 'Absent', value: '7', color: 'text-red-500', icon: XCircle },
              { label: 'Percentage', value: '63%', color: 'text-yellow-500', icon: Award }
            ].map((item, index) => (
              <div 
                key={index} 
                className="bg-gray-800 p-6 rounded-2xl 
                            transform transition-all duration-300 
                            hover:scale-110 hover:shadow-2xl"
              >
                <div className="flex justify-between items-center mb-3">
                  <p className="text-gray-400">{item.label}</p>
                  <item.icon className={`${item.color}`} size={24} />
                </div>
                <p className={`text-3xl font-bold ${item.color}`}>{item.value}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Attendance Records */}
      <div className="bg-gray-900 p-8 rounded-2xl shadow-2xl">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-2xl font-bold text-green-500">Attendance Records</h3>
          <select className="bg-gray-800 
                             text-white px-4 py-2 rounded-lg 
                             hover:bg-gray-700 
                             transition-all duration-300">
            <option>March</option>
            <option>February</option>
            <option>January</option>
          </select>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="border-b border-gray-700">
              <tr>
                <th className="text-left py-4 text-gray-400">Date</th>
                <th className="text-left py-4 text-gray-400">Time</th>
                <th className="text-left py-4 text-gray-400">Status</th>
              </tr>
            </thead>
            <tbody>
              {attendanceRecords.map((record, index) => (
                <tr 
                  key={index} 
                  className="border-b border-gray-700 
                             hover:bg-gray-800 transition-colors duration-300 
                             cursor-pointer"
                  onClick={() => setSelectedRecord(record)}
                >
                  <td className="py-4">{record.date}</td>
                  <td className="py-4">{record.time}</td>
                  <td className="py-4">
                    <span className={`
                      px-3 py-1 rounded-full text-sm font-semibold
                      ${record.status === 'Present' 
                        ? 'bg-green-600 text-white' 
                        : 'bg-red-600 text-white'}
                      hover:opacity-80 transition-opacity duration-300
                    `}>
                      {record.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default StudentDashboard;