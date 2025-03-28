import React, { useState, useEffect } from 'react';
import { QrReader } from 'react-qr-reader';
import { isWithinRange } from '../../utils/locationUtils';

const QRScanner = ({ onSuccess }) => {
  const [error, setError] = useState(null);
  const [userLocation, setUserLocation] = useState(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [decodedText, setDecodedText] = useState(null);
  const [locationVerified, setLocationVerified] = useState(false);

  useEffect(() => {
    // Get user's current location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          });
        },
        (error) => {
          setError('Please enable location services to mark attendance');
        }
      );
    } else {
      setError('Geolocation is not supported by your browser');
    }
  }, []);

  const handleScan = async (data) => {
    if (data && userLocation) {
      try {
        const qrData = JSON.parse(data?.text || data);
        setDecodedText(qrData);
        const qrLocation = qrData.location;

        if (isWithinRange(userLocation, qrLocation)) {
          setLocationVerified(true);
          setShowSuccess(true);
          setTimeout(() => {
            setShowSuccess(false);
            onSuccess(qrData);
          }, 3000);
        } else {
          setLocationVerified(false);
          setError('Location verification failed. You must be within 100 meters of the class.');
        }
      } catch (error) {
        setError('Invalid QR code format');
      }
    }
  };

  return (
    <div className="w-full max-w-md mx-auto p-4 relative">
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}
      
      {showSuccess && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50">
          <div className="bg-green-100 border border-green-400 text-green-700 px-8 py-6 rounded-lg shadow-xl text-center">
            <div className="text-3xl mb-2">✓</div>
            <h3 className="font-bold mb-2">Location Verified</h3>
            <p>Marking your attendance...</p>
          </div>
        </div>
      )}

      {!locationVerified && decodedText && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50">
          <div className="bg-red-100 border border-red-400 text-red-700 px-8 py-6 rounded-lg shadow-xl text-center">
            <div className="text-3xl mb-2">⚠️</div>
            <h3 className="font-bold mb-2">Location Mismatch</h3>
            <p>You are too far from the class location.</p>
            <p className="text-sm mt-2">Please ensure you are in the correct classroom.</p>
          </div>
        </div>
      )}
      
      <QrReader
        constraints={{ facingMode: 'environment' }}
        onResult={handleScan}
        className="w-full"
        videoStyle={{ borderRadius: '0.5rem' }}
      />
      
      {userLocation && decodedText && (
        <div className="mt-4 space-y-2 text-sm bg-gray-800 p-4 rounded-lg">
          <p className="text-gray-300">Your location: {userLocation.latitude.toFixed(6)}, {userLocation.longitude.toFixed(6)}</p>
          <p className="text-gray-300">Class: {decodedText.className}</p>
          <p className="text-gray-300">Subject: {decodedText.subject}</p>
          <p className="text-gray-300">Teacher: {decodedText.teacher}</p>
          <p className="text-gray-300">Status: {locationVerified ? 
            <span className="text-green-500">Location Verified</span> : 
            <span className="text-red-500">Location Mismatch</span>
          }</p>
        </div>
      )}
    </div>
  );
};

export default QRScanner;
