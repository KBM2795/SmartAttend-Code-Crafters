import mongoose from 'mongoose';

const qrSessionSchema = new mongoose.Schema({
  teacher: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Teacher',
    required: true
  },
  class: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Class',
    required: true
  },
  subject: {
    type: String,
    required: true
  },
  location: {
    type: {
      type: String,
      default: 'Point'
    },
    coordinates: {
      type: [Number],
      required: true
    },
    radius: {
      type: Number,
      default: 100 // meters
    }
  },
  timing: {
    startTime: {
      type: Date,
      required: true
    },
    endTime: {
      type: Date,
      required: true
    }
  },
  sessionToken: {
    type: String,
    required: true,
    unique: true
  },
  active: {
    type: Boolean,
    default: true
  },
  markedAttendance: [{
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student'
    },
    timestamp: Date,
    location: {
      type: {
        type: String,
        default: 'Point'
      },
      coordinates: [Number]
    }
  }]
}, { timestamps: true });

qrSessionSchema.index({ location: '2dsphere' });
const QRSession = mongoose.model('QRSession', qrSessionSchema);
export default QRSession;
