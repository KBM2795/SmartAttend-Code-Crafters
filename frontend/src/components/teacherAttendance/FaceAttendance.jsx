import React, { useRef, useEffect, useState } from 'react';
import Webcam from 'react-webcam';
import * as faceapi from '@vladmandic/face-api';
import { loadModels, getImageDescriptor, compareFaces } from '../../services/faceRecognition';

const FaceAttendance = ({ students, onAttendanceMarked }) => {
  const webcamRef = useRef(null);
  const [isModelLoaded, setIsModelLoaded] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [matchStatus, setMatchStatus] = useState('');

  useEffect(() => {
    const initFaceApi = async () => {
      await loadModels();
      setIsModelLoaded(true);
    };
    initFaceApi();
  }, []);

  const captureAndCompare = async () => {
    if (!webcamRef.current || !isModelLoaded) return;

    setScanning(true);
    setMatchStatus('Scanning...');
    
    try {
      // Capture image as base64
      const imageSrc = webcamRef.current.getScreenshot();
      console.log('Captured image base64');
      
      const capturedFaceDescriptor = await getImageDescriptor(imageSrc);
      if (!capturedFaceDescriptor) {
        setMatchStatus('No face detected in captured image');
        return;
      }

      let matchFound = false;
      
      for (const student of students) {
        if (student.photo) {
          try {
            const photoUrl = `http://localhost:3000/uploads/${student.photo}`;
            console.log('Comparing with student photo:', student.name);
            
            const storedDescriptor = await getImageDescriptor(photoUrl);
            if (!storedDescriptor) {
              console.log('No face detected in stored photo for:', student.name);
              continue;
            }

            const distance = faceapi.euclideanDistance(capturedFaceDescriptor, storedDescriptor);
            console.log('Match distance:', distance, 'for student:', student.name);
            
            if (distance < 0.6) {
              onAttendanceMarked(student.id, 'present');
              setMatchStatus(`Match found! ${student.name} marked present`);
              matchFound = true;
              break;
            }
          } catch (error) {
            console.error('Error processing student photo:', error);
          }
        }
      }

      if (!matchFound) {
        setMatchStatus('No matching student found. Please try again.');
      }

    } catch (error) {
      console.error('Face recognition error:', error);
      setMatchStatus('Error processing face. Please try again.');
    } finally {
      setScanning(false);
    }
  };

  return (
    <div className="relative">
      <Webcam
        ref={webcamRef}
        screenshotFormat="image/jpeg"
        className="rounded-lg w-full"
        mirrored={true}
      />
      <div className="mt-4 space-y-4">
        <button
          onClick={captureAndCompare}
          disabled={!isModelLoaded || scanning}
          className={`w-full px-4 py-2 rounded-lg ${
            scanning 
              ? 'bg-gray-500' 
              : 'bg-green-500 hover:bg-green-600'
          } text-white transition-colors`}
        >
          {scanning ? 'Scanning...' : 'Capture Face'}
        </button>
        {matchStatus && (
          <div className={`text-center p-2 rounded ${
            matchStatus.includes('Match found')
              ? 'bg-green-500/20 text-green-400'
              : matchStatus.includes('No') || matchStatus.includes('Error')
                ? 'bg-red-500/20 text-red-400'
                : 'bg-blue-500/20 text-blue-400'
          }`}>
            {matchStatus}
          </div>
        )}
      </div>
    </div>
  );
};

export default FaceAttendance;
