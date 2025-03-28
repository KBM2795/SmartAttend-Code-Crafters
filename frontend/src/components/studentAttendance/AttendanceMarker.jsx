import React, { useState } from 'react';
import QRScanner from './QRScanner';
import { api } from '../../services/api';

const AttendanceMarker = () => {
  const [status, setStatus] = useState('');

  const handleQRSuccess = async (qrData) => {
    try {
      const response = await api.markAttendance({
        classId: qrData.classId,
        subject: qrData.subject,
        timestamp: new Date(),
        location: qrData.location,
        verified: true // Adding location verification status
      });
      
      setStatus('success');
    } catch (error) {
      console.error('Attendance marking failed:', error);
      setStatus('error');
    }
  };

  return (
    <div className="container mx-auto p-4">
      <h2 className="text-2xl font-bold mb-4 text-white">Scan Attendance QR Code</h2>
      <div className="bg-gray-900 rounded-lg p-6">
        <QRScanner onSuccess={handleQRSuccess} />
        
        {status === 'error' && (
          <div className="mt-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            Failed to mark attendance. Please try again.
          </div>
        )}
      </div>
    </div>
  );
};

export default AttendanceMarker;
