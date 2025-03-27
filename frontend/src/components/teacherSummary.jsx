import React, { useState, useEffect } from 'react';
import { Clock, Users, Calendar, BarChart2 } from 'lucide-react';
import { api } from '../services/api';
import { useNavigate } from 'react-router-dom';

const TeacherSummary = () => {
  const [summaryData, setSummaryData] = useState({
    totalStudents: 0,
    presentToday: 0,
    absentToday: 0,
    attendanceRate: 0,
    monthlyAverage: 0,
    recentActivity: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchSummaryData();
  }, []);

  const fetchSummaryData = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.getDashboardSummary();
      setSummaryData(data);
    } catch (error) {
      console.error('Error fetching summary:', error);
      setError('Failed to load dashboard data. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center h-screen bg-black text-white">
        <div className="bg-red-500/10 text-red-500 p-4 rounded-lg">
          {error}
          <button 
            onClick={fetchSummaryData}
            className="mt-2 bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-black text-white p-6 min-h-screen">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <button 
          onClick={() => navigate('/teacher-dashboard/attendance')}
          className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition-colors"
        >
          Mark Attendance
        </button>
      </div>

      <div className="grid grid-cols-4 gap-4 mb-6">
        {/* Stats cards */}
        <div className="bg-gray-800 p-4 rounded-lg hover:bg-gray-700 transition-colors">
          <div className="flex items-center mb-2">
            <Users className="mr-2 text-gray-400" />
            <span className="text-gray-400">Total Students</span>
          </div>
          <div className="text-2xl font-bold">{summaryData.totalStudents}</div>
        </div>

        <div className="bg-gray-800 p-4 rounded-lg hover:bg-green-900 transition-colors">
          <div className="flex items-center mb-2">
            <Calendar className="mr-2 text-green-400" />
            <span className="text-green-400">Present Today</span>
          </div>
          <div className="text-2xl font-bold text-green-500">{summaryData.presentToday}</div>
          <div className="text-sm text-green-600">
            {summaryData.attendanceRate.toFixed(1)}% attendance rate
          </div>
        </div>

        <div className="bg-gray-800 p-4 rounded-lg hover:bg-red-900 transition-colors">
          <div className="flex items-center mb-2">
            <Clock className="mr-2 text-red-400" />
            <span className="text-red-400">Absent Today</span>
          </div>
          <div className="text-2xl font-bold text-red-500">{summaryData.absentToday}</div>
        </div>

        <div className="bg-gray-800 p-4 rounded-lg hover:bg-gray-700 transition-colors">
          <div className="flex items-center mb-2">
            <BarChart2 className="mr-2 text-gray-400" />
            <span className="text-gray-400">Monthly Average</span>
          </div>
          <div className="text-2xl font-bold">{summaryData.monthlyAverage.toFixed(1)}%</div>
          <div className="text-sm text-gray-500">Last 30 days</div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-gray-800 p-4 rounded-lg">
        <h2 className="text-lg font-semibold mb-4">Recent Activity</h2>
        <div className="space-y-3">
          {summaryData.recentActivity.map((activity, index) => (
            <div 
              key={index} 
              className="flex justify-between items-center p-2 rounded-md hover:bg-gray-700 transition-colors"
            >
              <div>
                <div className="font-medium">
                  Marked attendance for {activity.class.name} - {activity.class.section}
                </div>
                <div className="text-sm text-gray-400">
                  {new Date(activity.createdAt).toLocaleString()}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default TeacherSummary;