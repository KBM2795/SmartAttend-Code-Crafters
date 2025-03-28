import {BrowserRouter as Router, Routes, Route, Navigate} from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext';
import Home from "./pages/home"
import Login from "./pages/login"
import Register from "./pages/register"
import TeacherDashboard from './pages/teacherDashboard'
import PrivateRoutes from './utils/PrivateRoutes'
import RoleBaseRoutes from './utils/RoleBaseRoutes'
import  TeacherSummary from './components/teacherSummary'
import Student from './components/teacherStudents/student'
import AttendanceTracker from './components/teacherAttendance/attendance'
import Report from "./components/teacherReport/report"
import Setting from './components/teacherSetting'
import StudentDashboard from './pages/studentDashboard'
import TeacherAttendancePage from './components/teacherAttendance/TeacherAttendancePage'

function App() {
  

  return (
    <AuthProvider>
      <Router>
        <Routes>

          <Route path="/" element={<Home />} />
          <Route path='/login' element={<Login />}></Route>
          <Route path='/register' element={<Register/>}></Route>
          <Route path='/teacher-dashboard' element={
          <PrivateRoutes>
            <RoleBaseRoutes requiredRole={["admin"]}>
              <TeacherDashboard />
            </RoleBaseRoutes>
            </PrivateRoutes>
            }>
              <Route index element={<TeacherSummary />}></Route>
              <Route path='/teacher-dashboard/student' element={<Student />}></Route>
              <Route path='/teacher-dashboard/attendance' element={<AttendanceTracker />} ></Route>
              <Route path='/teacher-dashboard/report' element={<Report />} ></Route>
              <Route path='/teacher-dashboard/setting' element={<Setting />} ></Route>
              </Route>
              <Route path='/student-dashboard' element={
            <PrivateRoutes>
            <RoleBaseRoutes requiredRole={["student"]}>
              <StudentDashboard />
            </RoleBaseRoutes>
            </PrivateRoutes>
          }>
              <Route index element={<StudentDashboard />}></Route>
              
          </Route>
        </Routes>
      </Router>
    </AuthProvider>
  )
}

export default App
