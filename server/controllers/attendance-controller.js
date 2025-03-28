import Attendance from '../models/attendance-model.js';
import Student from '../models/student-model.js';
import Teacher from '../models/teacher-model.js'; // Add this import
import PDFDocument from 'pdfkit';
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from 'date-fns';
import QRSession from '../models/qr-session-model.js';
import crypto from 'crypto';

// Dynamic import for axios to handle potential missing module
let axios;
try {
  const axiosModule = await import('axios');
  axios = axiosModule.default;
} catch (error) {
  console.error('Failed to load axios:', error);
}

export const saveAttendance = async (req, res) => {
  try {
    const { classId, date, students, subjectTeacherId, startTime, endTime, subject } = req.body;
    const markedBy = req.user._id;

    // Validate inputs
    if (!classId || !date || !students || !Array.isArray(students)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid input data'
      });
    }

    // Create attendance record
    const attendance = new Attendance({
      date: new Date(date),
      class: classId,
      markedBy,
      subjectTeacher: subjectTeacherId,
      timing: {
        startTime: startTime ? new Date(startTime) : null,
        endTime: endTime ? new Date(endTime) : null
      },
      students: students.map(s => ({
        student: s.id,
        status: s.status,
        subjects: [{
          name: subject || 'General',
          status: s.status
        }]
      }))
    });

    const savedAttendance = await attendance.save();

    // Update student references in parallel
    await Promise.all(students.map(s => 
      Student.findByIdAndUpdate(s.id, {
        $push: { attendance: savedAttendance._id }
      })
    ));

    // Process absent students
    const absentStudents = students.filter(s => s.status === 'absent');
    
    if (absentStudents.length > 0) {
      const absentDetails = await Student.find({
        '_id': { $in: absentStudents.map(s => s.id) }
      }).populate('class');

      // Send notifications
      for (const student of absentDetails) {
        try {
          await axios.post('https://ub05.app.n8n.cloud/webhook/student-absence', {
            studentId: student._id,
            studentName: student.name,
            parentPhone: student.parentDetails?.phone,
            class: `${student.class.name}${student.class.section}`,
            reason: "Absent",
            date: date
          });
          await new Promise(resolve => setTimeout(resolve, 500));
        } catch (error) {
          console.error(`Notification failed for student ${student.name}:`, error.message);
        }
      }
    }

    res.status(200).json({
      success: true,
      message: 'Attendance saved successfully',
      data: savedAttendance
    });

  } catch (error) {
    console.error('Save attendance error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to save attendance'
    });
  }
};

export const getDashboardSummary = async (req, res) => {
  try {
    const teacherId = req.user._id;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Get teacher details first
    const teacher = await Teacher.findOne({ userId: teacherId })
      .populate('assignedClasses');

    if (!teacher) {
      return res.status(404).json({ message: 'Teacher profile not found' });
    }

    const classIds = teacher.assignedClasses.map(c => c._id);

    // Get students count
    const totalStudents = await Student.countDocuments({ 
      class: { $in: classIds } 
    });

    // Get today's attendance
    const todayAttendance = await Attendance.find({
      date: { 
        $gte: today,
        $lt: new Date(today.getTime() + 24 * 60 * 60 * 1000)
      },
      class: { $in: classIds },
      markedBy: teacherId
    }).populate('class');

    const presentToday = todayAttendance.reduce((acc, curr) => 
      acc + curr.students.filter(s => s.status === 'present').length, 0);
    
    const absentToday = todayAttendance.reduce((acc, curr) => 
      acc + curr.students.filter(s => s.status === 'absent').length, 0);

    // Get monthly stats
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
    const monthlyAttendance = await Attendance.find({
      date: { $gte: monthStart },
      class: { $in: classIds },
      markedBy: teacherId
    });

    const monthlyPresent = monthlyAttendance.reduce((acc, curr) => 
      acc + curr.students.filter(s => s.status === 'present').length, 0);
    
    const monthlyTotal = monthlyAttendance.reduce((acc, curr) => 
      acc + curr.students.length, 0);

    // Get recent activity
    const recentActivity = await Attendance.find({ 
      markedBy: teacherId,
      class: { $in: classIds }
    })
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('class');

    res.status(200).json({
      totalStudents,
      presentToday,
      absentToday,
      attendanceRate: totalStudents > 0 ? (presentToday / totalStudents) * 100 : 0,
      monthlyAverage: monthlyTotal > 0 ? (monthlyPresent / monthlyTotal) * 100 : 0,
      recentActivity: recentActivity.map(activity => ({
        class: activity.class,
        date: activity.date,
        createdAt: activity.createdAt,
        presentCount: activity.students.filter(s => s.status === 'present').length,
        totalCount: activity.students.length
      }))
    });

  } catch (error) {
    console.error('Dashboard summary error:', error);
    res.status(500).json({ message: error.message });
  }
};

export const generateAttendanceReport = async (req, res) => {
  try {
    const { classId, subjectId, reportType, startDate } = req.body;

    // Validate inputs
    if (!classId || !subjectId || !reportType || !startDate) {
      return res.status(400).json({
        success: false,
        message: 'Missing required parameters'
      });
    }

    // Parse dates
    let start, end;
    try {
      start = new Date(startDate);
      end = new Date(startDate);

      switch (reportType) {
        case 'daily':
          end.setHours(23, 59, 59, 999);
          break;
        case 'weekly':
          end.setDate(end.getDate() + 7);
          break;
        case 'monthly':
          end = new Date(end.getFullYear(), end.getMonth() + 1, 0);
          break;
        default:
          throw new Error('Invalid report type');
      }
    } catch (error) {
      return res.status(400).json({
        success: false,
        message: 'Invalid date format'
      });
    }

    // Get attendance records
    const records = await Attendance.find({
      class: classId,
      date: { $gte: start, $lte: end },
      'students.subjects.name': subjectId,
      markedBy: req.user._id
    })
    .populate('students.student', 'name rollNumber')
    .populate('class', 'name section')
    .sort({ date: 1 });

    if (!records || records.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No attendance records found'
      });
    }

    // Generate PDF
    const doc = new PDFDocument();
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=attendance-report-${reportType}-${format(start, 'yyyy-MM-dd')}.pdf`);

    doc.pipe(res);
    
    // Add content to PDF
    generatePDFContent(doc, {
      reportType,
      startDate: start,
      endDate: end,
      records,
      className: records[0].class.name,
      section: records[0].class.section,
      subject: subjectId
    });

    doc.end();

  } catch (error) {
    console.error('Report generation error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to generate report'
    });
  }
};

export const getDailyReport = async (req, res) => {
  try {
    const { classId, date } = req.query;
    const teacherId = req.user._id;

    // Validate required parameters
    if (!classId || !date) {
      return res.status(400).json({ message: 'Class ID and date are required' });
    }

    // Create date range for the query
    const startDate = new Date(date);
    startDate.setHours(0, 0, 0, 0);
    const endDate = new Date(date);
    endDate.setHours(23, 59, 59, 999);

    // Query attendance records with proper population
    const attendanceRecords = await Attendance.find({
      class: classId,
      markedBy: teacherId,
      date: { $gte: startDate, $lte: endDate }
    })
    .populate({
      path: 'students.student',
      select: 'name rollNumber'
    })
    .populate('class', 'name section')
    .lean();

    // Initialize summary object
    const summary = {
      totalStudents: 0,
      present: 0,
      absent: 0,
      subjectWise: {},
      timeWise: []
    };

    if (attendanceRecords.length > 0) {
      summary.totalStudents = attendanceRecords[0].students.length;

      // Process attendance records
      attendanceRecords.forEach(record => {
        const timeSlot = {
          startTime: record.timing?.startTime || null,
          endTime: record.timing?.endTime || null,
          present: 0,
          absent: 0,
          total: record.students.length
        };

        record.students.forEach(student => {
          if (student.status === 'present') {
            summary.present++;
            timeSlot.present++;
          } else {
            summary.absent++;
            timeSlot.absent++;
          }

          // Process subject-wise attendance
          (student.subjects || []).forEach(subj => {
            if (!summary.subjectWise[subj.name]) {
              summary.subjectWise[subj.name] = { present: 0, absent: 0 };
            }
            summary.subjectWise[subj.name][subj.status]++;
          });
        });

        if (timeSlot.startTime) {
          summary.timeWise.push(timeSlot);
        }
      });
    }

    res.status(200).json({
      success: true,
      date,
      summary,
      records: attendanceRecords
    });

  } catch (error) {
    console.error('Daily report error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate daily report',
      error: error.message
    });
  }
};

export const getMonthlyReport = async (req, res) => {
  try {
    const { classId, month, year } = req.query;
    const teacherId = req.user._id;

    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);

    const attendanceRecords = await Attendance.find({
      class: classId,
      date: { $gte: startDate, $lte: endDate },
      markedBy: teacherId
    })
    .populate('students.student', 'name rollNumber')
    .populate('class', 'name section')
    .sort({ date: 1, 'timing.startTime': 1 });

    // Process monthly summary
    const summary = {
      totalDays: 0,
      studentWise: {},
      subjectWise: {},
      dayWise: {}
    };

    attendanceRecords.forEach(record => {
      const dateKey = record.date.toISOString().split('T')[0];
      if (!summary.dayWise[dateKey]) {
        summary.dayWise[dateKey] = {
          present: 0,
          absent: 0,
          total: record.students.length
        };
        summary.totalDays++;
      }

      record.students.forEach(student => {
        // Initialize student record if not exists
        if (!summary.studentWise[student.student._id]) {
          summary.studentWise[student.student._id] = {
            name: student.student.name,
            rollNumber: student.student.rollNumber,
            present: 0,
            absent: 0,
            total: 0
          };
        }

        // Update student attendance
        summary.studentWise[student.student._id][student.status]++;
        summary.studentWise[student.student._id].total++;
        summary.dayWise[dateKey][student.status]++;

        // Update subject-wise attendance
        student.subjects.forEach(subj => {
          if (!summary.subjectWise[subj.name]) {
            summary.subjectWise[subj.name] = { present: 0, absent: 0 };
          }
          summary.subjectWise[subj.name][subj.status]++;
        });
      });
    });

    res.status(200).json({
      month,
      year,
      summary,
      records: attendanceRecords
    });

  } catch (error) {
    console.error('Monthly report error:', error);
    res.status(500).json({ message: error.message });
  }
};

export const getTodayClassReport = async (req, res) => {
  try {
    const { classId, subjectId } = req.query;
    const teacherId = req.user._id;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const attendanceRecord = await Attendance.find({
      class: classId,
      'students.subjects': { $elemMatch: { name: subjectId } },
      date: {
        $gte: today,
        $lt: new Date(today.getTime() + 24 * 60 * 60 * 1000)
      },
      markedBy: teacherId
    })
    .populate('students.student', 'name rollNumber')
    .populate('class', 'name section')
    .sort({ 'timing.startTime': 1 });

    if (!attendanceRecord) {
      return res.status(404).json({ message: 'No attendance record found for today' });
    }

    const summary = {
      totalStudents: 0,
      present: 0,
      absent: 0,
      timeSlots: []
    };

    attendanceRecord.forEach(record => {
      const timeSlot = {
        startTime: record.timing.startTime,
        endTime: record.timing.endTime,
        present: 0,
        absent: 0
      };

      record.students.forEach(student => {
        const subjectStatus = student.subjects.find(s => s.name === subjectId)?.status;
        if (subjectStatus === 'present') {
          timeSlot.present++;
          summary.present++;
        } else {
          timeSlot.absent++;
          summary.absent++;
        }
      });

      summary.timeSlots.push(timeSlot);
      summary.totalStudents = record.students.length;
    });

    res.status(200).json({
      date: today,
      summary,
      records: attendanceRecord
    });

  } catch (error) {
    console.error('Today class report error:', error);
    res.status(500).json({ message: error.message });
  }
};

const generateSummarySection = (doc, summary) => {
  doc.fontSize(14).text('Summary Statistics', { underline: true });
  doc.moveDown();
  doc.fontSize(10);
  doc.text(`Average Attendance Rate: ${summary.averageAttendance.toFixed(2)}%`);
  doc.text(`Total Students: ${summary.totalStudents}`);
  doc.text(`Total Present: ${summary.totalPresent}`);
  doc.moveDown();
};

const generateAttendanceTable = (doc, data) => {
  // ...implementation for detailed table...
};

const generateCharts = (doc, summary) => {
  // ...implementation for charts using PDFKit...
};

const generatePDFContent = (doc, data) => {
  try {
    // Add header
    doc.fontSize(20).text('Attendance Report', { align: 'center' });
    doc.moveDown();
    
    // Add report info
    doc.fontSize(12);
    doc.text(`Class: ${data.className} ${data.section}`);
    doc.text(`Subject: ${data.subject}`);
    doc.text(`Period: ${format(data.startDate, 'PP')} to ${format(data.endDate, 'PP')}`);
    doc.text(`Report Type: ${data.reportType}`);
    doc.moveDown();

    // Add attendance details
    doc.fontSize(14).text('Attendance Records', { underline: true });
    doc.moveDown();

    data.records.forEach(record => {
      doc.fontSize(12).text(format(new Date(record.date), 'PP'), { bold: true });
      doc.moveDown();

      // Create a table-like structure
      const tableTop = doc.y;
      let currentY = tableTop;

      // Headers
      doc.text('Name', 50, currentY);
      doc.text('Roll Number', 200, currentY);
      doc.text('Status', 350, currentY);
      currentY += 20;

      record.students.forEach(student => {
        if (currentY > doc.page.height - 50) {
          doc.addPage();
          currentY = 50;
        }

        doc.text(student.student.name, 50, currentY);
        doc.text(student.student.rollNumber, 200, currentY);
        doc.text(student.status.toUpperCase(), 350, currentY);
        currentY += 20;
      });

      doc.moveDown(2);
    });

  } catch (error) {
    console.error('PDF generation error:', error);
    throw error;
  }
};

export const createQRSession = async (req, res) => {
  try {
    const { classId, subject, location, startTime, endTime } = req.body;
    const teacherId = req.user.teacherId;

    const sessionToken = crypto.randomBytes(32).toString('hex');
    
    const qrSession = new QRSession({
      teacher: teacherId,
      class: classId,
      subject,
      location: {
        type: 'Point',
        coordinates: [location.longitude, location.latitude],
        radius: location.radius || 100
      },
      timing: {
        startTime: new Date(startTime),
        endTime: new Date(endTime)
      },
      sessionToken
    });

    await qrSession.save();

    // Generate encrypted QR data
    const qrData = {
      sessionToken,
      timestamp: Date.now(),
      expires: new Date(endTime).getTime()
    };

    const encryptedData = jwt.sign(qrData, process.env.JWT_SECRET, { expiresIn: '1h' });
    const qrCodeData = await toDataURL(JSON.stringify({ token: encryptedData }));

    res.status(201).json({
      success: true,
      qrCode: qrCodeData,
      session: qrSession
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const markAttendanceByQR = async (req, res) => {
  try {
    const { token, location } = req.body;
    const studentId = req.user.studentId;

    // Verify and decrypt token
    const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
    const { sessionToken } = JSON.parse(decodedToken.token);

    // Find active session
    const session = await QRSession.findOne({ 
      sessionToken,
      active: true,
      'timing.endTime': { $gt: new Date() }
    });

    if (!session) {
      return res.status(404).json({ message: 'Invalid or expired QR session' });
    }

    // Check if already marked
    if (session.markedAttendance.some(m => m.student.toString() === studentId)) {
      return res.status(400).json({ message: 'Attendance already marked' });
    }

    // Verify location
    const distance = calculateDistance(
      location.latitude,
      location.longitude,
      session.location.coordinates[1],
      session.location.coordinates[0]
    );

    if (distance > session.location.radius) {
      return res.status(400).json({ message: 'You are too far from the class location' });
    }

    // Mark attendance
    session.markedAttendance.push({
      student: studentId,
      timestamp: new Date(),
      location: {
        type: 'Point',
        coordinates: [location.longitude, location.latitude]
      }
    });

    await session.save();

    // Update attendance record
    await saveAttendance({
      classId: session.class,
      date: new Date(),
      students: [{ id: studentId, status: 'present' }],
      subject: session.subject,
      subjectTeacherId: session.teacher
    });

    res.status(200).json({ success: true, message: 'Attendance marked successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const verifyQRLocation = async (req, res) => {
  try {
    const { location, sessionToken } = req.body;

    const session = await QRSession.findOne({ 
      sessionToken,
      active: true,
      'timing.endTime': { $gt: new Date() }
    });

    if (!session) {
      return res.status(404).json({ 
        success: false, 
        message: 'Invalid or expired QR session' 
      });
    }

    // Calculate distance between student and class location
    const distance = calculateDistance(
      location.latitude,
      location.longitude,
      session.location.coordinates[1],
      session.location.coordinates[0]
    );

    const isWithinRange = distance <= session.location.radius;

    res.status(200).json({
      success: true,
      isWithinRange,
      distance: Math.round(distance),
      maxRadius: session.location.radius
    });

  } catch (error) {
    console.error('Location verification error:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message || 'Failed to verify location' 
    });
  }
};

// Helper function to calculate distance between coordinates
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371e3; // Earth's radius in meters
  const φ1 = lat1 * Math.PI/180;
  const φ2 = lat2 * Math.PI/180;
  const Δφ = (lat2-lat1) * Math.PI/180;
  const Δλ = (lon2-lon1) * Math.PI/180;

  const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
          Math.cos(φ1) * Math.cos(φ2) *
          Math.sin(Δλ/2) * Math.sin(Δλ/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

  return R * c; // Distance in meters
};
