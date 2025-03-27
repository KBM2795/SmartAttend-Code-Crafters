import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';

const ReportSummary = ({ data }) => {
  const chartData = data.map(item => ({
    date: format(new Date(item.date), 'PP'),
    present: item.presentCount,
    absent: item.totalCount - item.presentCount,
  }));

  return (
    <div className="bg-gray-900 p-6 rounded-lg">
      <h3 className="text-lg font-semibold mb-4">Attendance Summary</h3>
      
      {/* Summary Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-gray-800 p-4 rounded">
          <p className="text-gray-400">Average Attendance</p>
          <p className="text-2xl font-bold text-green-500">
            {data.averageAttendance?.toFixed(1)}%
          </p>
        </div>
        <div className="bg-gray-800 p-4 rounded">
          <p className="text-gray-400">Total Sessions</p>
          <p className="text-2xl font-bold">{data.totalSessions}</p>
        </div>
        <div className="bg-gray-800 p-4 rounded">
          <p className="text-gray-400">Total Students</p>
          <p className="text-2xl font-bold">{data.totalStudents}</p>
        </div>
      </div>

      {/* Attendance Chart */}
      <div className="h-64">
        <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Bar dataKey="present" stackId="a" fill="#059669" />
          <Bar dataKey="absent" stackId="a" fill="#DC2626" />
        </BarChart>
      </div>
    </div>
  );
};

export default ReportSummary;
