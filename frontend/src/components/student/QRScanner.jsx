import React, { useState, useEffect } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { api } from '../../services/api';
import { MapPin, X } from 'lucide-react';

const QRScanner = ({ onClose }) => {
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState(null);
  const [location, setLocation] = useState(null);

  useEffect(() => {
    // Initialize Scanner
    const scanner = new Html5QrcodeScanner('qr-reader', {
      fps: 10,
      qrbox: { width: 250, height: 250 },
      rememberLastUsedCamera: true,
    });

    // Success Callback
    const onScanSuccess = async (decodedText) => {
      try {
        setScanning(true);
        setError(null);

        if (!location) {
          throw new Error('Location not available');
        }

        const qrData = JSON.parse(decodedText);
        console.log('Decoded QR data:', qrData);

        // Verify location first
        const locationVerification = await api.verifyQRLocation({
          sessionToken: qrData.token,
          location
        });

        if (!locationVerification.isWithinRange) {
          throw new Error(`You are ${locationVerification.distance}m away from class. Must be within ${locationVerification.maxRadius}m`);
        }

        // Mark attendance
        await api.markAttendanceByQR({
          token: qrData.token,
          location
        });

        alert('Attendance marked successfully!');
        scanner.clear();
        onClose();
      } catch (err) {
        console.error('QR processing error:', err);
        setError(err.message || 'Failed to process QR code');
      } finally {
        setScanning(false);
      }
    };

    // Error Callback
    const onScanError = (err) => {
      console.warn(`QR Scan error: ${err}`);
    };

    // Get location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          });
        },
        (err) => {
          setError('Please enable location services to mark attendance');
        }
      );
    }

    // Render scanner
    scanner.render(onScanSuccess, onScanError);

    // Cleanup
    return () => {
      scanner.clear();
    };
  }, [location, onClose]);

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
      <div className="bg-gray-900 rounded-lg max-w-md w-full p-4">
        <div className="mb-4 flex justify-between items-center">
          <h2 className="text-lg font-semibold text-white">Scan QR Code</h2>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-white"
          >
            <X size={20} />
          </button>
        </div>

        {location ? (
          <div className="text-sm text-green-400 flex items-center mb-4">
            <MapPin size={16} className="mr-2" />
            Location ready
          </div>
        ) : (
          <div className="text-sm text-yellow-400 flex items-center mb-4">
            <MapPin size={16} className="mr-2" />
            Getting location...
          </div>
        )}

        {error && (
          <div className="bg-red-500/20 text-red-400 p-3 rounded mb-4">
            {error}
          </div>
        )}

        <div className="relative rounded-lg overflow-hidden bg-black">
          <div id="qr-reader" style={{ width: '100%' }}></div>
          
          {scanning && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
            </div>
          )}
        </div>

        <p className="text-gray-400 text-sm mt-4 text-center">
          Position the QR code within the frame to scan
        </p>
      </div>
    </div>
  );
};

export default QRScanner;
