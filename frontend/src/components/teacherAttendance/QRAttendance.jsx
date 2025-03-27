import React from 'react';
import { QRCodeSVG } from 'qrcode.react';

const QRAttendance = ({ classId, subject, onClose }) => {
  const qrData = JSON.stringify({
    classId,
    subject,
    timestamp: new Date().getTime(),
    sessionId: Math.random().toString(36).substring(7)
  });

  return (
    <div className="text-center">
      <h2 className="text-xl font-bold mb-4">Scan to Mark Attendance</h2>
      <div className="bg-white p-4 rounded-lg inline-block mb-4">
        <QRCodeSVG 
          value={qrData}
          size={256}
          level="H"
          includeMargin={true}
        />
      </div>
      <p className="text-sm text-gray-400 mb-4">
        Students can scan this QR code to mark their attendance
      </p>
      <button
        onClick={onClose}
        className="bg-red-500/20 text-red-500 px-4 py-2 rounded hover:bg-red-500/30"
      >
        Close
      </button>
    </div>
  );
};

export default QRAttendance;
