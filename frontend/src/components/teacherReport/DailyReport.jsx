import React from 'react';
import { format } from 'date-fns';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';

const DailyReport = ({ data, date, className, subject }) => {
  if (!data?.summary) return null;

  const subjectChartData = Object.entries(data.summary.subjectWise).map(([subject, counts]) => ({
    subject,
    Present: counts.present,
    Absent: counts.absent,
    Rate: ((counts.present / (counts.present + counts.absent)) * 100).toFixed(1)
  }));
   console.log(subjectChartData);
   
  // Process time-wise data
  const timeChartData = data.summary.timeWise
    .filter(slot => slot.startTime) // Filter out slots without time
    .map(slot => ({
      time: format(new Date(slot.startTime), 'hh:mm a'),
      Present: slot.present,
      Absent: slot.absent,
      Rate: ((slot.present / slot.total) * 100).toFixed(1)
    }));

  // Calculate overall attendance rate
  const attendanceRate = data.summary.totalStudents > 0
    ? ((data.summary.present / data.summary.totalStudents) * 100).toFixed(1)
    : 0;

  return (
    <div className="space-y-6">
      <div className="mb-4">
        <h3 className="text-xl font-semibold">{className} - {subject}</h3>
        <p className="text-gray-400">Date: {format(new Date(date), 'PP')}</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-gray-800 p-4 rounded-lg">
          <h4 className="text-gray-400">Total Students</h4>
          <p className="text-2xl font-bold">{data.summary.totalStudents}</p>
        </div>
        <div className="bg-gray-800 p-4 rounded-lg">
          <h4 className="text-green-400">Present</h4>
          <p className="text-2xl font-bold text-green-500">{data.summary.present}</p>
        </div>
        <div className="bg-gray-800 p-4 rounded-lg">
          <h4 className="text-red-400">Absent</h4>
          <p className="text-2xl font-bold text-red-500">{data.summary.absent}</p>
        </div>
        <div className="bg-gray-800 p-4 rounded-lg">
          <h4 className="text-gray-400">Attendance Rate</h4>
          <p className="text-2xl font-bold">
            {((data.summary.present / data.summary.totalStudents) * 100).toFixed(1)}%
          </p>
        </div>
      </div>

      {/* Time-wise Attendance Chart */}
      {timeChartData.length > 0 && (
        <div className="bg-gray-800 p-4 rounded-lg">
          <h3 className="text-lg font-semibold mb-4">Attendance by Time Slot</h3>
          <div className="h-64">
            <BarChart data={timeChartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="time" stroke="#9CA3AF" />
              <YAxis stroke="#9CA3AF" />
              <Tooltip 
                contentStyle={{ backgroundColor: '#1F2937', border: 'none' }}
                labelStyle={{ color: '#9CA3AF' }}
              />
              <Legend />
              <Bar dataKey="Present" fill="#059669" />
              <Bar dataKey="Absent" fill="#DC2626" />
            </BarChart>
          </div>
        </div>
      )}

      {/* Subject-wise Chart */}
      <div className="bg-gray-800 p-4 rounded-lg">
        <h3 className="text-lg font-semibold mb-4">Subject-wise Attendance</h3>
        <div className="h-64">
          <BarChart data={subjectChartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis dataKey="subject" stroke="#9CA3AF" />
            <YAxis stroke="#9CA3AF" />
            <Tooltip 
              contentStyle={{ backgroundColor: '#1F2937', border: 'none' }}
              labelStyle={{ color: '#9CA3AF' }}
            />
            <Legend />
            <Bar dataKey="Present" fill="#059669" />
            <Bar dataKey="Absent" fill="#DC2626" />
          </BarChart>
        </div>
      </div>

      {/* Detailed List */}
      <div className="bg-gray-800 p-4 rounded-lg">
        <h3 className="text-lg font-semibold mb-4">Student Details</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-gray-400 border-b border-gray-700">
                <th className="text-left p-2">Roll Number</th>
                <th className="text-left p-2">Name</th>
                <th className="text-left p-2">Status</th>
                <th className="text-left p-2">Time</th>
              </tr>
            </thead>
            <tbody>
              {data.records.map(record =>
                record.students.map(student => (
                  <tr key={`${student.student._id}-${record._id}`} className="border-b border-gray-700">
                    <td className="p-2">{student.student.rollNumber}</td>
                    <td className="p-2">{student.student.name}</td>
                    <td className={`p-2 ${
                      student.subjects[0]?.status === 'present' 
                        ? 'text-green-500' 
                        : 'text-red-500'
                    }`}>
                      {student.subjects[0]?.status.toUpperCase() || 'N/A'}
                    </td>
                    <td className="p-2">
                      {record.timing?.startTime 
                        ? format(new Date(record.timing.startTime), 'hh:mm a')
                        : 'N/A'
                      }
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default DailyReport;
