import React, { useState, useRef } from 'react';

const FaceCapture = ({ onFaceCaptured }) => {
  const [cameraState, setCameraState] = useState('idle'); // idle, scanning, captured
  const [capturedImage, setCapturedImage] = useState(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);

  const startCamera = async () => {
    try {
      setCameraState('scanning');
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
    } catch (err) {
      alert("Error accessing webcam: " + err.message);
      setCameraState('idle');
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
  };

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0);

    const imageData = canvas.toDataURL('image/jpeg', 0.85);
    setCapturedImage(imageData);
    
    stopCamera();
    setCameraState('captured');
  };

  const retakePhoto = () => {
    setCapturedImage(null);
    setCameraState('idle');
  };

  const approvePhoto = () => {
    if (capturedImage && onFaceCaptured) {
      onFaceCaptured(capturedImage);
    }
  };

  return (
    <div style={{ margin: '20px 0', padding: '20px', border: '2px solid #667eea', borderRadius: '10px', background: '#f6f9fc' }}>
      <h3 style={{ margin: '0 0 16px 0', color: '#2d3748', fontSize: '16px', fontWeight: '600' }}>
        📸 FACE REGISTRATION
      </h3>

      {/* IDLE STATE - Show Start Button */}
      {cameraState === 'idle' && (
        <button
          type="button"
          onClick={startCamera}
          style={{
            width: '100%',
            padding: '16px',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            fontSize: '16px',
            fontWeight: '600',
            cursor: 'pointer'
          }}
        >
          📷 Start Camera
        </button>
      )}

      {/* SCANNING STATE - Show Video */}
      {cameraState === 'scanning' && (
        <>
          <div style={{ textAlign: 'center', marginBottom: '16px' }}>
            <video 
              ref={videoRef} 
              autoPlay 
              playsInline 
              style={{ 
                width: '100%', 
                maxWidth: '400px', 
                borderRadius: '10px', 
                background: '#000',
                transform: 'scaleX(-1)'
              }} 
            />
          </div>

          <canvas ref={canvasRef} style={{ display: 'none' }} />

          <div style={{ display: 'flex', gap: '12px' }}>
            <button
              type="button"
              onClick={() => {
                stopCamera();
                setCameraState('idle');
              }}
              style={{
                flex: 1,
                padding: '14px',
                background: '#ef4444',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '15px',
                fontWeight: '600',
                cursor: 'pointer'
              }}
            >
              ✕ Cancel
            </button>

            <button
              type="button"
              onClick={capturePhoto}
              style={{
                flex: 2,
                padding: '14px',
                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '16px',
                fontWeight: '700',
                cursor: 'pointer'
              }}
            >
              📸 Capture Photo
            </button>
          </div>
        </>
      )}

      {/* CAPTURED STATE - Show Preview */}
      {cameraState === 'captured' && capturedImage && (
        <>
          <div style={{ textAlign: 'center', marginBottom: '16px' }}>
            <img 
              src={capturedImage} 
              alt="Captured face" 
              style={{ 
                width: '100%', 
                maxWidth: '400px', 
                borderRadius: '10px',
                transform: 'scaleX(-1)'
              }} 
            />
          </div>

          <div style={{
            padding: '12px',
            background: '#d1fae5',
            border: '2px solid #10b981',
            borderRadius: '8px',
            color: '#065f46',
            marginBottom: '12px',
            textAlign: 'center',
            fontSize: '15px',
            fontWeight: '600'
          }}>
            ✅ Face captured successfully!
          </div>

          <div style={{ display: 'flex', gap: '12px' }}>
            <button
              type="button"
              onClick={retakePhoto}
              style={{
                flex: 1,
                padding: '14px',
                background: '#f59e0b',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '15px',
                fontWeight: '600',
                cursor: 'pointer'
              }}
            >
              🔄 Retake
            </button>

            <button
              type="button"
              onClick={approvePhoto}
              style={{
                flex: 1,
                padding: '14px',
                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '15px',
                fontWeight: '700',
                cursor: 'pointer'
              }}
            >
              ✓ Approve
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default FaceCapture;
