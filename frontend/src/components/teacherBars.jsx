import React from 'react';
import { useNavigate, NavLink } from "react-router-dom";
import { 
  LayoutGrid, 
  Users, 
  CalendarCheck, 
  BarChart3, 
  Settings, 
  LogOut 
} from 'lucide-react';
import {useAuth} from "../context/authContext"
// Sidebar Component
export const Sidebar = () => {
  const navigate = useNavigate();
  const menuItems = [
    { icon: <LayoutGrid />, label: 'Dashboard', path: "/teacher-dashboard" },
    { icon: <Users />, label: 'Students', path: "/teacher-dashboard/student"  },
    { icon: <CalendarCheck />, label: 'Attendance',   path: "/teacher-dashboard/attendance"},
    { icon: <BarChart3 />, label: 'Reports', path: "/teacher-dashboard/report" },
    { icon: <Settings />, label: 'Settings',  path: "/teacher-dashboard/setting" }
  ];

  return (
    <div className="w-64 bg-gray-900 h-screen p-5 flex flex-col">
      <div className="text-2xl font-bold mb-10 text-white">
        Smart<span className="text-green-500">Attend</span>
      </div>
      
      <nav className="flex-grow ">
        {menuItems.map((item, index) => (
          <NavLink
          key={index}
          to={item.path}
          className={({ isActive }) =>
            `flex items-center p-3  rounded-lg mb-2 cursor-pointer ${
            isActive ? 'bg-green-500/20 text-green-500' : 'text-gray-400 hover:bg-gray-800'
         
            }`
            }
          end
        >
          {item.icon}
          <span className='m-3'>{item.label}</span>
        </NavLink>
        ))}
      </nav>
      
      <div 
        className="flex items-center text-red-500 hover:text-red-300 p-3 rounded-lg cursor-pointer"
      >
        <LogOut />
        <button 
      onClick={() => {
        localStorage.removeItem("token");
        navigate("/login")
      }}
      className=" hover:text-red-300 text-red-600 px-4 py-2 rounded">
        Logout
      </button>
      </div>
    </div>
  );
};

// Navbar Component
export const Navbar = () => {
  const {user } = useAuth();
  console.log(user);
  
  return (
    <div className="bg-black p-4 flex justify-end items-center">
      <div className="text-white text-sm">{user.email}</div>
    </div>
  );
};

// Teacher Summary Component
