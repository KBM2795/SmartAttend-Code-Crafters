import React from 'react';
import { Navbar } from '../components/teacherBars';
import { Sidebar } from '../components/teacherBars';
import TeacherSummary from '../components/teacherSummary'; // Import TeacherSummary
import { Outlet } from 'react-router-dom';

const TeacherDashboard = () => {
  return (
    <div className="flex">
      <Sidebar />
      <div className="flex-1 bg-black text-white">
        <Navbar />
        <div className='m-10 overflow-auto h-[80vh] no-scrollbar'>
        <Outlet />
        </div>
      </div>
    </div>
  );
};

export default TeacherDashboard;