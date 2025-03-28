import Attendance from '../models/attendance-model.js';
import Student from '../models/student-model.js';
import Teacher from '../models/teacher-model.js'; // Add this import
import PDFDocument from 'pdfkit';
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from 'date-fns';
import QRSession from '../models/qr-session-model.js';
import crypto from 'crypto';
import mongoose from 'mongoose';

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
    const { classId } = req.query;
    const teacherId = req.user._id;

    // Input validation - only require classId
    if (!classId) {
      return res.status(400).json({
        success: false,
        message: 'Class ID is required'
      });
    }

    // Get current month/year by default
    const currentDate = new Date();
    const startDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const endDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);

    // Get total students in class
    const totalStudents = await Student.countDocuments({ class: classId });

    // Get attendance records
    const attendanceRecords = await Attendance.find({
      class: classId,
      date: { $gte: startDate, $lte: endDate },
      markedBy: teacherId
    }).lean();

    // Initialize summary
    const summary = {
      totalStudents,
      totalDays: 0,
      present: 0,
      absent: 0,
      percentage: 0
    };

    // Process records
    if (attendanceRecords.length > 0) {
      summary.totalDays = attendanceRecords.length;
      attendanceRecords.forEach(record => {
        record.students?.forEach(student => {
          if (student.status === 'present') {
            summary.present++;
          } else {
            summary.absent++;
          }
        });
      });
    }

    // Calculate percentage
    const totalPossibleAttendance = totalStudents * summary.totalDays;
    summary.percentage = totalPossibleAttendance > 0 
      ? Math.round((summary.present / totalPossibleAttendance) * 100) 
      : 0;

    res.status(200).json({
      success: true,
      summary,
      dateRange: { startDate, endDate }
    });

  } catch (error) {
    console.error('Monthly report error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to generate monthly report'
    });
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
  // Add summary box with border
  const boxTop = doc.y;
  doc.rect(50, boxTop, 500, 100)
     .stroke('#cccccc');

  // Add summary title
  doc.fontSize(14)
     .fillColor('#000000')
     .text('Summary Statistics', 60, boxTop + 10)
     .moveDown(0.5);

  // Add summary content in two columns
  const leftColumn = [
    ['Total Students', summary.totalStudents],
    ['Total Present', summary.totalPresent],
    ['Total Absent', summary.totalAbsent]
  ];

  const rightColumn = [
    ['Average Attendance', `${summary.averageAttendance.toFixed(2)}%`],
    ['Total Classes', summary.totalClasses],
    ['Period Coverage', summary.periodCoverage]
  ];

  // Draw columns
  doc.fontSize(10);
  leftColumn.forEach((row, index) => {
    doc.text(row[0], 70, boxTop + 40 + (index * 20))
       .text(row[1].toString(), 180, boxTop + 40 + (index * 20));
  });

  rightColumn.forEach((row, index) => {
    doc.text(row[0], 300, boxTop + 40 + (index * 20))
       .text(row[1].toString(), 410, boxTop + 40 + (index * 20));
  });

  doc.moveDown(6);
};

const generateDetailedAttendanceTable = (doc, records) => {
    doc.fontSize(14)
       .fillColor('#000000')
       .text('Detailed Attendance Records', { underline: true })
       .moveDown();
  
    // Table headers
    const startY = doc.y;
    const columnWidths = [120, 80, 100, 100, 100];
    
    doc.fontSize(10)
       .fillColor('#666666')
       .text('Student Name', 50, startY, { width: columnWidths[0] })
       .text('Roll Number', 170, startY, { width: columnWidths[1] })
       .text('Status', 250, startY, { width: columnWidths[2] })
       .text('Date', 350, startY, { width: columnWidths[3] })
       .text('Time', 450, startY, { width: columnWidths[4] });
  
    doc.moveDown();
    let currentY = doc.y;
  
    // Draw horizontal line under headers
    doc.moveTo(50, currentY - 5)
       .lineTo(550, currentY - 5)
       .stroke('#cccccc');
  
    // Table rows with alternating background
    records.forEach((record, recordIndex) => {
      record.students.forEach((student, index) => {
        // Add new page if needed
        if (currentY > doc.page.height - 50) {
          doc.addPage();
          currentY = 50;
        }
  
        // Draw alternating row backgrounds
        if (index % 2 === 0) {
          doc.rect(50, currentY - 5, 500, 20)
             .fill('#f8f8f8');
        }
  
        // Add student data
        doc.fillColor('#000000')
           .text(student.student.name, 50, currentY, { width: columnWidths[0] })
           .text(student.student.rollNumber, 170, currentY, { width: columnWidths[1] })
           .fillColor(student.status === 'present' ? '#22c55e' : '#ef4444')
           .text(student.status.toUpperCase(), 250, currentY, { width: columnWidths[2] })
           .fillColor('#000000')
           .text(format(new Date(record.date), 'PPP'), 350, currentY, { width: columnWidths[3] })
           .text(format(new Date(record.timing?.startTime || record.date), 'p'), 450, currentY, { width: columnWidths[4] });
  
        currentY += 20;
      });
  
      if (recordIndex < records.length - 1) {
        doc.moveTo(50, currentY)
           .lineTo(550, currentY)
           .stroke('#cccccc');
        currentY += 10;
      }
    });
  };

const generateAttendanceCharts = (doc, summary) => {
  doc.addPage();
  doc.fontSize(14)
     .fillColor('#000000')
     .text('Attendance Analysis', { align: 'center' })
     .moveDown(2);

  // Draw attendance pie chart
  const centerX = doc.page.width / 2;
  const centerY = doc.y + 100;
  const radius = 80;

  const total = summary.totalPresent + summary.totalAbsent;
  const presentAngle = (summary.totalPresent / total) * 2 * Math.PI;

  // Draw present portion (green)
  doc.path([
    `M ${centerX} ${centerY}`,
    `L ${centerX + radius} ${centerY}`,
    `A ${radius} ${radius} 0 ${presentAngle > Math.PI ? 1 : 0} 1 ${
      centerX + radius * Math.cos(presentAngle)
    } ${centerY + radius * Math.sin(presentAngle)}`,
    'Z'
  ])
  .fill('#22c55e');

  // Draw absent portion (red)
  doc.path([
    `M ${centerX} ${centerY}`,
    `L ${centerX + radius * Math.cos(presentAngle)} ${
      centerY + radius * Math.sin(presentAngle)
    }`,
    `A ${radius} ${radius} 0 ${presentAngle <= Math.PI ? 1 : 0} 1 ${
      centerX + radius
    } ${centerY}`,
    'Z'
  ])
  .fill('#ef4444');

  // Add legend
  doc.fontSize(10)
     .fillColor('#000000')
     .text(
       `Present: ${summary.totalPresent} (${((summary.totalPresent / total) * 100).toFixed(1)}%)`,
       centerX - 100,
       centerY + radius + 30
     )
     .text(
       `Absent: ${summary.totalAbsent} (${((summary.totalAbsent / total) * 100).toFixed(1)}%)`,
       centerX + 20,
       centerY + radius + 30
     );
};

const generatePDFContent = (doc, data) => {
  try {
    // Set document metadata
    doc.info.Title = `Attendance Report - ${data.className} ${data.section}`;
    doc.info.Author = 'SmartAttend System';

    // Add header with styling
    doc.fontSize(24)
       .fillColor('#000000')
       .text('SmartAttend', { align: 'center' })
       .fontSize(18)
       .text('Attendance Report', { align: 'center' })
       .moveDown();

    // Add report details
    doc.fontSize(12)
       .text(`Class: ${data.className} ${data.section}`)
       .text(`Subject: ${data.subject}`)
       .text(`Period: ${format(data.startDate, 'PPP')} to ${format(data.endDate, 'PPP')}`)
       .text(`Report Type: ${data.reportType.charAt(0).toUpperCase() + data.reportType.slice(1)}`)
       .moveDown();

    // Calculate and add summary
    const summary = calculateAttendanceSummary(data.records);
    generateSummarySection(doc, summary);
    doc.moveDown();

    // Add attendance details
    generateDetailedAttendanceTable(doc, data.records);
    
    // Add visual charts
    generateAttendanceCharts(doc, summary);

    // Add footer
    doc.fontSize(8)
       .text(
         `Generated on ${format(new Date(), 'PPpp')}`,
         50,
         doc.page.height - 50,
         { align: 'center' }
       );

  } catch (error) {
    console.error('PDF generation error:', error);
    throw error;
  }
};

const calculateAttendanceSummary = (records) => {
  const summary = {
    totalStudents: 0,
    totalPresent: 0,
    totalAbsent: 0,
    totalClasses: records.length,
    averageAttendance: 0,
    periodCoverage: '',
  };

  if (records.length > 0) {
    summary.totalStudents = records[0].students.length;
    
    records.forEach(record => {
      record.students.forEach(student => {
        if (student.status === 'present') {
          summary.totalPresent++;
        } else {
          summary.totalAbsent++;
        }
      });
    });

    const totalEntries = summary.totalPresent + summary.totalAbsent;
    summary.averageAttendance = totalEntries > 0 
      ? (summary.totalPresent / totalEntries) * 100 
      : 0;

    // Calculate period coverage
    const startDate = new Date(Math.min(...records.map(r => new Date(r.date))));
    const endDate = new Date(Math.max(...records.map(r => new Date(r.date))));
    summary.periodCoverage = `${format(startDate, 'PP')} - ${format(endDate, 'PP')}`;
  }

  return summary;
};

export const createQRSession = async (req, res) => {
  try {
    const { classId, teacherId, duration } = req.body;
    
    const session = new QRSession({
      classId,
      teacherId,
      duration: duration || 300, // 5 minutes default
      location: req.body.location,
      expiresAt: new Date(Date.now() + (duration || 300) * 1000)
    });

    await session.save();
    res.json({ 
      success: true, 
      sessionId: session._id,
      expiresAt: session.expiresAt 
    });
  } catch (error) {
    console.error('Create QR Session Error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const verifyQRLocation = async (req, res) => {
  try {
    const { sessionId, location, studentId } = req.body;
    
    const session = await QRSession.findById(sessionId);
    if (!session || session.expiresAt < new Date()) {
      return res.json({ 
        isValid: false, 
        message: 'QR session expired or invalid' 
      });
    }

    // Calculate distance between points
    const distance = calculateDistance(
      location.latitude,
      location.longitude,
      session.location.latitude,
      session.location.longitude
    );

    const isWithinRange = distance <= 50; // 50 meters radius
    res.json({ 
      isValid: isWithinRange,
      message: isWithinRange ? 'Location verified' : 'You are too far from class location'
    });
  } catch (error) {
    console.error('Verify Location Error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const markAttendanceByQR = async (req, res) => {
  try {
    const { sessionId, studentId, classId, subject } = req.body;

    // Validate session
    const session = await QRSession.findById(sessionId);
    if (!session) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired QR session'
      });
    }

    // Check for existing attendance
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const existingAttendance = await Attendance.findOne({
      class: classId,
      date: { $gte: today, $lt: tomorrow },
      'students.student': studentId,
      'students.subjects.name': subject
    });

    if (existingAttendance) {
      return res.status(400).json({
        success: false,
        message: 'Attendance already marked for today'
      });
    }

    // Create or update attendance record
    await Attendance.findOneAndUpdate(
      {
        class: classId,
        date: today
      },
      {
        $push: {
          students: {
            student: studentId,
            status: 'present',
            subjects: [{ name: subject, status: 'present' }]
          }
        }
      },
      { upsert: true }
    );

    res.json({
      success: true,
      message: 'Attendance marked successfully'
    });

  } catch (error) {
    console.error('Mark Attendance Error:', error);
    res.status(500).json({
      success: false,
      message: error.message
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

export const getStudentWiseReport = async (req, res) => {
  try {
    const { classId, subjectName } = req.query;
    
    if (!classId || !subjectName) {
      return res.status(400).json({
        success: false,
        message: 'Class ID and Subject Name are required'
      });
    }

    // Get students in the class first
    const students = await Student.find({ class: classId })
      .select('name rollNumber')
      .lean();

    if (!students || students.length === 0) {
      return res.json({
        success: true,
        data: []
      });
    }

    // Get attendance records for the class and subject
    const attendanceRecords = await Attendance.find({
      class: classId,
      'students.subjects.name': subjectName
    }).populate('students.student');

    // Process records to get student-wise summary
    const studentSummary = {};
    
    // Initialize summary for all students
    students.forEach(student => {
      studentSummary[student._id.toString()] = {
        name: student.name,
        rollNumber: student.rollNumber,
        totalLectures: 0,
        present: 0,
        absent: 0
      };
    });

    // Process attendance records
    attendanceRecords.forEach(record => {
      record.students.forEach(student => {
        if (!student?.student?._id) return;

        const subjectStatus = student.subjects?.find(s => s.name === subjectName);
        if (!subjectStatus) return;

        const studentId = student.student._id.toString();
        if (!studentSummary[studentId]) return;

        studentSummary[studentId].totalLectures++;
        if (subjectStatus.status === 'present') {
          studentSummary[studentId].present++;
        } else {
          studentSummary[studentId].absent++;
        }
      });
    });

    // Convert to array and calculate percentages
    const reportData = Object.values(studentSummary).map(student => ({
      ...student,
      percentage: student.totalLectures > 0 
        ? Math.round((student.present / student.totalLectures) * 100) 
        : 0
    }));

    res.json({
      success: true,
      data: reportData
    });

  } catch (error) {
    console.error('Student report error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
