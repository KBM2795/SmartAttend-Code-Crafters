import pkg from 'qrcode';
const { toDataURL } = pkg;
import Student from '../models/student-model.js';
import User from '../models/user-model.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import Attendance from '../models/attendance-model.js';

// Get all students
export const getAllStudents = async (req, res) => {
  try {
    const students = await Student.find().populate('class');
    res.status(200).json(students);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get a single student by ID
export const getStudentById = async (req, res) => {
  try {
    const student = await Student.findById(req.params.id);
    if (!student) return res.status(404).json({ message: 'Student not found' });
    res.status(200).json(student);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Create a new student
export const createStudent = async (req, res) => {
  try {
    const { 
      name, 
      rollNumber, 
      class: className, 
      department, 
      semester, 
      section
    } = req.body;

    // Parse parent details from form data
    const parentDetails = JSON.parse(req.body.parentDetails);

    // Validate required fields
    if (!name || !rollNumber || !className || !department || !semester) {
      return res.status(400).json({ 
        success: false, 
        message: 'All required fields must be provided' 
      });
    }

    // Validate parent details
    if (!parentDetails?.name || !parentDetails?.phone) {
      return res.status(400).json({
        success: false,
        message: 'Parent name and phone number are required'
      });
    }

    // Create user account for student
    const email = `${name.toLowerCase().replace(/\s+/g, '')}${rollNumber}@test.com`;
    const password = `${name.toLowerCase().replace(/\s+/g, '')}${rollNumber}`;
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user first with name field
    const user = new User({
      name: name, // Add name field
      email: email,
      password: hashedPassword,
      role: 'student'
    });

    const savedUser = await user.save();

    // Create new student object
    const student = new Student({
      name,
      rollNumber,
      class: className,
      department,
      semester: Number(semester),
      section,
      parentDetails: {
        name: parentDetails.name,
        phone: parentDetails.phone,
        email: parentDetails.email || undefined // Make email optional
      },
      userId: savedUser._id
    });

    // Add photo if uploaded
    if (req.file) {
      student.photo = req.file.filename;
    }

    const savedStudent = await student.save();
    const populatedStudent = await Student.findById(savedStudent._id)
      .populate('class')
      .populate('userId', 'email');

    res.status(201).json({ 
      success: true, 
      student: populatedStudent,
      credentials: {
        email,
        password // Send plain password only once during creation
      },
      message: 'Student created successfully with login credentials'
    });

  } catch (error) {
    console.error('Create student error:', error);
    // Delete user if student creation fails
    if (error.user) {
      await User.findByIdAndDelete(error.user);
    }
    res.status(400).json({ 
      success: false, 
      message: error.code === 11000 
        ? 'Roll number or email already exists' 
        : error.message || 'Failed to create student'
    });
  }
};

export const updateStudent = async (req, res) => {
  try {
    const { 
      name, 
      rollNumber, 
      class: className, 
      department, 
      semester, 
      section,
      parentDetails 
    } = req.body;

    // Validate parent details for update
    if (parentDetails) {
      if (!parentDetails.name || !parentDetails.phone) {
        return res.status(400).json({
          success: false,
          message: 'Parent name and phone number are required'
        });
      }

      const phoneRegex = /^(\+91)?[0-9]{10}$/;
      if (!phoneRegex.test(parentDetails.phone)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid phone number format'
        });
      }
    }

    const updatedStudent = await Student.findByIdAndUpdate(
      req.params.id,
      {
        name,
        rollNumber,
        class: className,
        department,
        semester: Number(semester),
        section,
        parentDetails
      },
      { new: true }
    ).populate('class');

    if (!updatedStudent) {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }
    res.status(200).json(updatedStudent);
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const deleteStudent = async (req, res) => {
  try {
    const student = await Student.findByIdAndDelete(req.params.id);
    if (!student) {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }
    res.status(200).json({ success: true, message: 'Student deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getStudentPhoto = async (req, res) => {
  try {
    const student = await Student.findById(req.params.id);
    if (!student || !student.photo) {
      return res.status(404).json({ message: 'Photo not found' });
    }
    res.sendFile(student.photo, { root: 'public/uploads' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getCompleteProfile = async (req, res) => {
  try {
    const userId = req.user._id;
    console.log('Looking up complete profile for userId:', userId);

    // Get student details
    const student = await Student.findOne({ userId }).populate('class');
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    
    // Get attendance records for this student
    const attendanceRecords = await Attendance.find({
      'students.student': student._id
    })
    .sort({ date: 1 })
    .populate('class')
    .lean();

    
    

    // Process attendance statistics
    const studentAttendance = attendanceRecords.map(record => {
      const studentEntry = record.students.find(s => 
        s.student.toString() === student._id.toString()
      );
      
      return {
        date: record.date,
        status: studentEntry?.status || 'absent',
        subject: studentEntry?.subjects[0]?.name || 'N/A',
        timing: record.timing
      };
    });

    const attendanceStats = {
      totalDays: studentAttendance.length,
      present: studentAttendance.filter(a => a.status === 'present').length,
      absent: studentAttendance.filter(a => a.status === 'absent').length,
      percentage: 0
    };

    if (attendanceStats.totalDays > 0) {
      attendanceStats.percentage = Math.round(
        (attendanceStats.present / attendanceStats.totalDays) * 100
      );
    }

    const response = {
      id: student._id,
      name: student.name,
      rollNumber: student.rollNumber,
      department: student.department,
      semester: student.semester,
      class: student.class,
      photo: student.photo ? `http://localhost:3000/uploads/${student.photo}` : null,
      attendanceStats,
      recentAttendance: studentAttendance.slice(0, 5)
    };

    console.log('Sending response:', response);
    res.status(200).json(response);
  } catch (error) {
    console.error('Get complete profile error:', error);
    res.status(500).json({ message: error.message });
  }
};

export const generateQRCode = async (req, res) => {
  try {
    const studentId = req.user.studentId;
    
    // Generate QR data with timestamp and student ID
    const qrData = {
      studentId,
      timestamp: Date.now(),
      token: jwt.sign({ studentId }, process.env.JWT_SECRET, { expiresIn: '5m' })
    };

    // Generate QR code using the imported toDataURL function
    const qrCodeDataUrl = await toDataURL(JSON.stringify(qrData));
    
    res.status(200).json({ qrCode: qrCodeDataUrl });
  } catch (error) {
    console.error('QR Code generation error:', error);
    res.status(500).json({ message: error.message });
  }
};

export const getStudentProfile = async (req, res) => {
  try {
    const { id } = req.params;
    console.log('Looking up student with userId:', id);
    
    const student = await Student.findOne({ userId: id })
      .populate('class')
      .populate({
        path: 'attendance',
        select: 'date status subjects timing',
        options: { sort: { date: -1 } }
      });

    if (!student) {
      console.log('No student found for userId:', id);
      return res.status(404).json({ message: 'Student not found' });
    }

    console.log('Found student:', student.name);

    // Format the response
    const response = {
      id: student._id,
      name: student.name,
      rollNumber: student.rollNumber,
      department: student.department,
      semester: student.semester,
      class: student.class,
      photo: student.photo ? `/uploads/${student.photo}` : null,
      attendanceStats: {
        totalDays: student.attendance?.length || 0,
        present: student.attendance?.filter(a => a.status === 'present').length || 0,
        absent: student.attendance?.filter(a => a.status === 'absent').length || 0,
        percentage: student.attendance?.length 
          ? Math.round((student.attendance.filter(a => a.status === 'present').length / student.attendance.length) * 100)
          : 0
      },
      recentAttendance: student.attendance?.slice(0, 5) || []
    };

    res.status(200).json(response);
  } catch (error) {
    console.error('Get student profile error:', error);
    res.status(500).json({ message: error.message });
  }
};
