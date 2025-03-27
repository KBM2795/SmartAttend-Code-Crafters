import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/authContext';

const LandingPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth()
  

  const handleLoginClick = () => {
    navigate('/login');
  };

  const handleRegisterClick = () => {
    navigate('/register');
  };

  const handleGetStartedClick = () => {
    if (user === "teacher"){
      navigate('/teacher-dashboard');
    }else{
      navigate('/student-dashboard');
    }
  };

  const attendanceData = [
    { name: 'John Doe', status: 'Present' },
    { name: 'Jane Smith', status: 'Present' },
    { name: 'Mike Johnson', status: 'Absent' },
    { name: 'Sarah Williams', status: 'Present' },
    { name: 'David Brown', status: 'Absent' }
  ];

  const features = [
    {
      title: 'Easy Marking',
      description: 'Mark attendance with a single click using intuitive present/absent indicators'
    },
    {
      title: 'Real-time Updates',
      description: 'See attendance updates in real-time across all connected devices'
    },
    {
      title: 'Detailed Reports',
      description: 'Generate comprehensive attendance reports with just a few clicks'
    }
  ];

  return (
    <div className="bg-black text-white min-h-screen">
      {/* Navbar */}
      <nav className="flex justify-between items-center p-6">
        <div className="text-2xl font-bold">
          Smart<span className="text-green-500">Attend</span>
        </div>
        <div className="space-x-4">
          <button 
            onClick={handleLoginClick} 
            className="text-white px-4 py-2 hover:text-green-500 transition-colors"
          >
            Login
          </button>
          <button 
            onClick={handleRegisterClick} 
            className="bg-green-500 text-black px-4 py-2 rounded-lg hover:bg-green-600 transition-colors"
          >
            Register
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="container mx-auto px-6 py-16 flex flex-col md:flex-row items-center">
        {/* Left Content */}
        <div className="md:w-1/2 space-y-6">
          <h1 className="text-5xl font-bold">Track Attendance with Ease</h1>
          <p className="text-gray-400 text-lg">
            Smart Attend makes attendance tracking simple and efficient. 
            Mark students present with <span className="neon-green"> neon green</span> or absent with <span className='neon-red'> neon red </span>indicators.
          </p>
          <div className="space-x-4">
            <button 
              onClick={handleGetStartedClick} 
              className="bg-green-500 text-black px-6 py-3 rounded-lg hover:bg-green-600 transition-colors"
            >
              Get Started
            </button>
            <button 
              className="border border-green-500 text-green-500 px-6 py-3 rounded-lg hover:bg-green-500 hover:text-black transition-colors"
            >
              View Demo
            </button>
          </div>
        </div>

        {/* Right Content - Attendance Demo */}
        <div className="md:w-1/2 mt-10 md:mt-0 flex justify-end">
          <div className="bg-gray-900 rounded-lg p-6 w-full max-w-md">
            <div className="flex justify-between mb-4">
              <h2 className="text-xl font-semibold">Attendance Demo</h2>
              <span className="text-gray-400">Today</span>
            </div>
            {attendanceData.map((student, index) => (
              <div 
                key={index} 
                className="flex justify-between items-center py-3 border-b border-gray-800 last:border-b-0 hover:bg-gray-800 transition-colors"
              >
                <span>{student.name}</span>
                <span 
                  className={`px-3 py-1 rounded-full text-sm ${
                    student.status === 'Present' 
                      ? 'bg-green-500/20 text-green-400 hover:bg-green-500/30' 
                      : 'bg-red-500/20 text-red-400 hover:bg-red-500/30'
                  } transition-colors`}
                >
                  {student.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="container mx-auto px-6 py-16">
        <h2 className="text-3xl font-bold text-center mb-12 hover:text-green-500 transition-colors">Key Features</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <div
              key={index}
              className="bg-black p-6 rounded-lg border border-gray-800 hover:border-green-500 hover:shadow-lg hover:shadow-green-500/20 transform hover:-translate-y-1 transition-all duration-300"
            >
              <h3 className="text-xl font-semibold mb-4 hover:text-green-500 transition-colors">{feature.title}</h3>
              <p className="text-gray-400 hover:text-gray-200 transition-colors">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-black py-6 border-t border-gray-800">
        <div className="container mx-auto px-6 flex justify-between items-center">
          <div>
            © 2025 Smart Attend. All rights reserved.
          </div>
          <div className="space-x-4">
            <a href="#" className="text-gray-400 hover:text-white transition-colors">Terms</a>
            <a href="#" className="text-gray-400 hover:text-white transition-colors">Privacy</a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;