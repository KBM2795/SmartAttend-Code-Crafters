import React from 'react';
import { format } from 'date-fns';
import { ArrowDown, ArrowUp } from 'lucide-react';

const DailyReport = ({ data, date, className, subject }) => {
  // Early return if no data
  if (!data || !data.records || !Array.isArray(data.records)) {
    return (
      <div className="text-center py-8 text-gray-400">
        No attendance data available.
      </div>
    );
  }

  // Group records by subject with error handling
  const recordsBySubject = data.records.reduce((acc, record) => {
    if (!record.students) return acc;

    record.students.forEach(student => {
      if (!student.subjects) return;

      student.subjects.forEach(subj => {
        if (!subj || !subj.name) return;

        if (!acc[subj.name]) {
          acc[subj.name] = {
            present: 0,
            absent: 0,
            students: []
          };
        }

        const studentData = {
          ...student.student,
          status: subj.status,
          time: record.timing?.startTime
        };

        acc[subj.name].students.push(studentData);
        
        if (subj.status === 'present') {
          acc[subj.name].present++;
        } else {
          acc[subj.name].absent++;
        }
      });
    });
    return acc;
  }, {});

  // Calculate summary with safe access
  const summary = {
    totalStudents: data.summary?.totalStudents || 0,
    present: data.summary?.present || 0,
    absent: data.summary?.absent || 0,
    timeWise: data.summary?.timeWise || []
  };

  return (
    <div className="space-y-6">
      <div className="mb-4">
        <h3 className="text-xl font-semibold">{className || 'Class'} - {subject || 'Subject'}</h3>
        <p className="text-gray-400">Date: {format(new Date(date), 'PP')}</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-gray-800 p-4 rounded-lg">
          <h4 className="text-gray-400">Total Students</h4>
          <p className="text-2xl font-bold">{summary.totalStudents}</p>
        </div>
        <div className="bg-gray-800 p-4 rounded-lg">
          <h4 className="text-green-400">Present</h4>
          <p className="text-2xl font-bold text-green-500">{summary.present}</p>
        </div>
        <div className="bg-gray-800 p-4 rounded-lg">
          <h4 className="text-red-400">Absent</h4>
          <p className="text-2xl font-bold text-red-500">{summary.absent}</p>
        </div>
        <div className="bg-gray-800 p-4 rounded-lg">
          <h4 className="text-gray-400">Attendance Rate</h4>
          <p className="text-2xl font-bold">
            {summary.totalStudents > 0 
              ? ((summary.present / summary.totalStudents) * 100).toFixed(1)
              : '0'}%
          </p>
        </div>
      </div>

      {/* Detailed List */}
      {Object.entries(recordsBySubject).map(([subjectName, subjectData]) => (
        <div key={subjectName} className="bg-gray-800 rounded-lg p-4">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">{subjectName}</h3>
            <div className="flex items-center space-x-4">
              <span className="text-green-500 flex items-center">
                <ArrowUp size={16} className="mr-1" />
                Present: {subjectData.present}
              </span>
              <span className="text-red-500 flex items-center">
                <ArrowDown size={16} className="mr-1" />
                Absent: {subjectData.absent}
              </span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-gray-400 border-b border-gray-700">
                  <th className="text-left py-2">Student</th>
                  <th className="text-left py-2">Roll Number</th>
                  <th className="text-left py-2">Status</th>
                  <th className="text-left py-2">Time</th>
                </tr>
              </thead>
              <tbody>
                {subjectData.students.map((student, idx) => (
                  <tr key={idx} className="border-b border-gray-700">
                    <td className="py-2">{student?.name || 'N/A'}</td>
                    <td className="py-2">{student?.rollNumber || 'N/A'}</td>
                    <td className={`py-2 ${
                      student?.status === 'present' ? 'text-green-500' : 'text-red-500'
                    }`}>
                      {(student?.status || 'N/A').toUpperCase()}
                    </td>
                    <td className="py-2">
                      {student?.time ? format(new Date(student.time), 'hh:mm a') : 'N/A'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ))}
    </div>
  );
};

export default DailyReport;
