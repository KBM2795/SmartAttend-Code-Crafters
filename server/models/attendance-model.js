import mongoose from 'mongoose';

const attendanceSchema = new mongoose.Schema({
  date: {
    type: Date,
    required: true
  },
  class: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Class',
    required: true
  },
  markedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  subjectTeacher: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Teacher'
  },
  timing: {
    startTime: Date,
    endTime: Date
  },
  students: [{
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student',
      required: true
    },
    status: {
      type: String,
      enum: ['present', 'absent'],
      required: true
    },
    subjects: [{
      name: String,
      status: {
        type: String,
        enum: ['present', 'absent']
      }
    }]
  }],
  remarks: String
}, { timestamps: true });

// Add indexes for better query performance
attendanceSchema.index({ class: 1, date: 1, markedBy: 1 });
attendanceSchema.index({ 'students.student': 1 });

const Attendance = mongoose.model('Attendance', attendanceSchema);
export default Attendance;
