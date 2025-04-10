import React, { useState, useEffect } from 'react';
import { ChevronDown, Download, Calendar } from 'lucide-react';
import { api } from '../../services/api';
import { format } from 'date-fns';
import FileSaver from 'file-saver';
import DailyReport from './DailyReport';

const AttendanceReports = () => {
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [reportType, setReportType] = useState('weekly');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [classes, setClasses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [showExportModal, setShowExportModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('Daily Report');
  const [attendanceData, setAttendanceData] = useState([
    {
      class: 'FE - A',
      totalStudents: 60,
      present: 55,
      absent: 5,
      percentage: 91.67
    },
    // Add more sample data or fetch from API
  ]);
  const [dailyReportData, setDailyReportData] = useState(null);

  useEffect(() => {
    fetchClasses();
    fetchTeacherSubjects();
  }, []);

  const fetchClasses = async () => {
    try {
      const data = await api.getClasses();
      setClasses(data);
    } catch (error) {
      console.error('Error fetching classes:', error);
    }
  };

  const fetchTeacherSubjects = async () => {
    try {
      const profile = await api.getTeacherProfile();
      setSubjects(profile.subjects || []);
    } catch (error) {
      console.error('Error fetching subjects:', error);
    }
  };

  const fetchDailyReport = async () => {
    try {
      if (!selectedClass) {
        alert('Please select a class');
        return;
      }

      setLoading(true);
      const response = await api.getDailyReport(selectedClass, startDate);

      if (response.success) {
        // Process the data for selected subject if one is selected
        if (selectedSubject && response.records) {
          const filteredData = {
            ...response,
            records: response.records.map(record => ({
              ...record,
              students: record.students.map(student => ({
                ...student,
                subjects: student.subjects?.filter(s => s.name === selectedSubject) || []
              }))
            }))
          };
          setDailyReportData(filteredData);
        } else {
          setDailyReportData(response);
        }
      } else {
        setDailyReportData(null);
        alert(response.message || 'No attendance records found');
      }
    } catch (error) {
      console.error('Error fetching daily report:', error);
      setDailyReportData(null);
      alert('Failed to fetch daily report. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Add useEffect to fetch report when date changes
  useEffect(() => {
    if (activeTab === 'Daily Report' && selectedClass && selectedSubject) {
      fetchDailyReport();
    }
  }, [startDate, selectedClass, selectedSubject]);

  const handleExportReport = async () => {
    try {
      if (!selectedClass || !selectedSubject) {
        alert('Please select both class and subject');
        return;
      }

      setLoading(true);
      const response = await api.generateAttendanceReport({
        classId: selectedClass,
        subjectId: selectedSubject,
        reportType,
        startDate: new Date(startDate).toISOString()
      });

      // Convert the response data to a blob
      const blob = new Blob([response], { type: 'application/pdf' });
      const fileName = `attendance-report-${reportType}-${format(new Date(), 'yyyy-MM-dd')}.pdf`;
      FileSaver.saveAs(blob, fileName);
      setShowExportModal(false);

    } catch (error) {
      console.error('Error generating report:', error);
      alert(error.response?.data?.message || 'Failed to generate report');
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    if (tab === 'Daily Report') {
      fetchDailyReport();
    }
    switch (tab) {
      case 'Daily Report':
        fetchDailyReport();
        break;
      case 'Monthly Report':
        // Fetch monthly report data
        break;
      case 'Student Report':
        // Fetch student-wise report data
        break;
      default:
        break;
    }
  };

  return (
    <div className="bg-black text-white min-h-screen p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-2xl font-bold">Reports</h1>
            <p className="text-sm text-gray-400">Generate and view attendance reports</p>
          </div>
          <button 
            onClick={() => setShowExportModal(true)}
            className="bg-green-500 text-white px-4 py-2 rounded flex items-center hover:bg-green-600 transition"
          >
            <Download className="mr-2" size={18} />
            Export Report
          </button>
        </div>

        <div className="bg-[#1A1A1A] p-6 rounded-lg">
          <h2 className="text-xl font-semibold mb-4">Attendance Reports</h2>
          <p className="text-gray-400 mb-6">View attendance statistics and generate reports</p>

          <div className="flex space-x-4 mb-6">
            <div className="relative w-full">
              <select 
                value={selectedClass}
                onChange={(e) => setSelectedClass(e.target.value)}
                className="w-full bg-gray-800 text-white p-2 rounded appearance-none"
              >
                <option value="">Select Class</option>
                {classes.map(cls => (
                  <option key={cls._id} value={cls._id}>
                    {cls.name} - {cls.section}
                  </option>
                ))}
              </select>
              <ChevronDown 
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" 
                size={20} 
              />
            </div>

            <div className="relative w-full">
              <select 
                value={selectedSubject}
                onChange={(e) => setSelectedSubject(e.target.value)}
                className="w-full bg-gray-800 text-white p-2 rounded appearance-none"
              >
                <option value="">Select Subject</option>
                {subjects.map((subject, index) => (
                  <option key={`${subject.code}-${index}`} value={subject.name}>
                    {subject.name} ({subject.code})
                  </option>
                ))}
              </select>
              <ChevronDown 
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" 
                size={20} 
              />
            </div>
          </div>

          <div className="flex border-b border-gray-800 mb-4">
            {['Daily Report', 'Monthly Report', 'Student Report'].map(tab => (
              <button
                key={tab}
                onClick={() => handleTabChange(tab)}
                className={`px-4 py-2 border-b-2 transition ${activeTab === tab ? 'border-green-500 text-green-500' : 'border-transparent text-gray-400 hover:text-gray-200'}`}
              >
                {tab}
              </button>
            ))}
          </div>

          <div className="overflow-x-auto">
            {loading ? (
              <div className="flex justify-center items-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500"></div>
              </div>
            ) : activeTab === 'Daily Report' ? (
              dailyReportData ? (
                <DailyReport 
                  data={dailyReportData} 
                  date={startDate}
                  className={classes.find(c => c._id === selectedClass)?.name}
                  subject={selectedSubject}
                />
              ) : (
                <div className="text-center py-8 text-gray-400">
                  Select class and subject to view report
                </div>
              )
            ) : (
              <table className="w-full">
                <thead>
                  <tr className="text-gray-400 text-left border-b border-gray-800">
                    <th className="p-3">Class</th>
                    <th className="p-3">Total Students</th>
                    <th className="p-3">Present</th>
                    <th className="p-3">Absent</th>
                    <th className="p-3">Percentage</th>
                  </tr>
                </thead>
                <tbody>
                  {attendanceData.map((data) => (
                    <tr key={data.class} className="border-b border-gray-800">
                      <td className="p-3">{data.class}</td>
                      <td className="p-3">{data.totalStudents}</td>
                      <td className="p-3 text-green-500">{data.present}</td>
                      <td className="p-3 text-red-500">{data.absent}</td>
                      <td className="p-3">{data.percentage}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>

      {showExportModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-gray-900 p-6 rounded-lg w-96">
            <h3 className="text-lg font-bold mb-4">Export Report</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm mb-2">Report Type</label>
                <select
                  value={reportType}
                  onChange={(e) => setReportType(e.target.value)}
                  className="w-full bg-gray-800 rounded p-2"
                >
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                </select>
              </div>

              <div>
                <label className="block text-sm mb-2">Start Date</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full bg-gray-800 rounded p-2"
                />
              </div>
            </div>

            <div className="mt-6 flex justify-end space-x-3">
              <button
                onClick={() => setShowExportModal(false)}
                className="px-4 py-2 bg-gray-700 rounded"
              >
                Cancel
              </button>
              <button
                onClick={handleExportReport}
                disabled={loading}
                className="px-4 py-2 bg-green-500 rounded flex items-center"
              >
                {loading ? (
                  <span>Generating...</span>
                ) : (
                  <>
                    <Download className="mr-2" size={16} />
                    Export
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AttendanceReports;