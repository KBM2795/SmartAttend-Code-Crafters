import mongoose from 'mongoose';

const attendanceSummarySchema = new mongoose.Schema({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student',
    required: true
  },
  academicYear: {
    type: String,
    required: true
  },
  summaryType: {
    type: String,
    enum: ['monthly', 'quarterly', 'yearly'],
    required: true
  },
  totalClasses: {
    type: Number,
    required: true
  },
  presentClasses: {
    type: Number,
    required: true
  },
  attendancePercentage: {
    type: Number,
    required: true,
    min: 0,
    max: 100
  },
  subjectWiseAttendance: [
    {
      subject: {
        type: String,
        required: true
      },
      totalClasses: {
        type: Number,
        required: true
      },
      presentClasses: {
        type: Number,
        required: true
      },
      attendancePercentage: {
        type: Number,
        required: true,
        min: 0,
        max: 100
      }
    }
  ],
  period: {
    start: {
      type: Date,
      required: true
    },
    end: {
      type: Date,
      required: true
    }
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const AttendanceSummary = mongoose.model('AttendanceSummary', attendanceSummarySchema);
export default AttendanceSummary;
