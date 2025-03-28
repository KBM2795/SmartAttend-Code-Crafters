import React, { useEffect, useState, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';

const QrScanner = ({ onScan, onClose }) => {
  const [isStarting, setIsStarting] = useState(true);
  const [error, setError] = useState(null);
  const scannerRef = useRef(null);
  const [isScanning, setIsScanning] = useState(false);

  useEffect(() => {
    let scanner = null;
    
    const startScanner = async () => {
      try {
        scanner = new Html5Qrcode("qr-reader");
        scannerRef.current = scanner;

        const cameras = await Html5Qrcode.getCameras();
        if (!cameras || cameras.length === 0) {
          throw new Error('No cameras found');
        }

        const cameraConfig = { facingMode: "environment" };
        const scanConfig = {
          fps: 10,
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1,
        };

        await scanner.start(
          cameraConfig,
          scanConfig,
          (decodedText) => {
            if (scanner) {
              scanner.stop().then(() => {
                setIsScanning(false);
                onScan(decodedText);
              }).catch(console.error);
            }
          },
          () => {}
        );

        setIsScanning(true);
        setIsStarting(false);
      } catch (initialError) {
        // Fallback to user camera if environment camera fails
        try {
          if (scanner) {
            await scanner.start(
              { facingMode: "user" },
              {
                fps: 10,
                qrbox: { width: 250, height: 250 },
                aspectRatio: 1,
              },
              (decodedText) => {
                if (scanner) {
                  scanner.stop().then(() => {
                    setIsScanning(false);
                    onScan(decodedText);
                  }).catch(console.error);
                }
              },
              () => {}
            );
            setIsScanning(true);
            setIsStarting(false);
          }
        } catch (error) {
          setError('Camera access failed. Please check permissions.');
          setIsStarting(false);
        }
      }
    };

    startScanner();

    return () => {
      if (scannerRef.current && isScanning) {
        scannerRef.current.stop()
          .catch(() => {})
          .finally(() => {
            scannerRef.current = null;
            setIsScanning(false);
          });
      }
    };
  }, [onScan]);

  const handleClose = () => {
    if (scannerRef.current && isScanning) {
      scannerRef.current.stop()
        .catch(() => {})
        .finally(() => {
          onClose();
        });
    } else {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
      <div className="bg-gray-900 p-6 rounded-2xl max-w-md w-full mx-4">
        <h3 className="text-xl font-bold mb-4 text-green-500">Scan QR Code</h3>
        {error ? (
          <div className="text-red-500 mb-4">{error}</div>
        ) : (
          isStarting && (
            <div className="text-green-500 mb-4">Starting camera...</div>
          )
        )}
        <div 
          id="qr-reader" 
          className="w-full bg-black rounded-lg overflow-hidden"
          style={{ maxWidth: '100%', height: '350px' }}
        />
        <button
          onClick={handleClose}
          className="mt-4 w-full bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg"
        >
          Cancel
        </button>
      </div>
    </div>
  );
};

export default QrScanner;
