import React, { useState, useRef, useEffect } from 'react';

const FaceAuth = ({ voterId, onAuthSuccess }) => {
  const [cameraState, setCameraState] = useState('idle');
  const [capturedImage, setCapturedImage] = useState(null);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);

  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const startCamera = async () => {
    try {
      setError('');
      setCameraState('scanning');
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
    } catch (err) {
      setError('Camera access denied: ' + err.message);
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
    setError('');
    setMessage('');
    setCameraState('idle');
  };

  const authenticateVoter = async () => {
    if (!capturedImage || !voterId) return;

    setCameraState('verifying');
    setMessage('🔍 Verifying your identity...');

    try {
      const response = await fetch('http://localhost:5000/api/authenticate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          voter_id: voterId,
          face_data: capturedImage 
        })
      });

      const result = await response.json();

      if (result.success) {
        setMessage(`✅ Authenticated: ${result.voter.name}`);
        setTimeout(() => {
          onAuthSuccess(result.voter);
        }, 1500);
      } else {
        setError(result.error || 'Authentication failed');
        setCameraState('captured');
      }
    } catch (err) {
      setError('Connection error: ' + err.message);
      setCameraState('captured');
    }
  };

  return (
    <div style={{ 
      maxWidth: '500px', 
      margin: '0 auto', 
      padding: '30px', 
      background: 'white', 
      borderRadius: '16px', 
      boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
      border: '2px solid #667eea'
    }}>
      <h2 style={{ 
        textAlign: 'center', 
        color: '#2d3748', 
        marginBottom: '24px',
        fontSize: '24px',
        fontWeight: '700'
      }}>
        🔐 Face Authentication
      </h2>

      {error && (
        <div style={{
          padding: '14px',
          background: '#fee2e2',
          border: '2px solid #fca5a5',
          borderRadius: '8px',
          color: '#991b1b',
          marginBottom: '16px',
          fontSize: '14px',
          fontWeight: '500'
        }}>
          ⚠️ {error}
        </div>
      )}

      {message && (
        <div style={{
          padding: '14px',
          background: '#dbeafe',
          border: '2px solid #93c5fd',
          borderRadius: '8px',
          color: '#1e40af',
          marginBottom: '16px',
          fontSize: '14px',
          fontWeight: '500',
          textAlign: 'center'
        }}>
          {message}
        </div>
      )}

      {/* Voter ID Display */}
      <div style={{
        background: '#e8f5e9',
        padding: '12px',
        borderRadius: '8px',
        marginBottom: '20px',
        textAlign: 'center'
      }}>
        <strong style={{ color: '#2d3748' }}>Voter ID:</strong>{' '}
        <span style={{ color: '#10b981', fontWeight: '700', fontSize: '20px' }}>
          {voterId}
        </span>
      </div>

      {/* IDLE STATE */}
      {cameraState === 'idle' && (
        <>
          <p style={{ textAlign: 'center', color: '#718096', marginBottom: '20px' }}>
            Position your face in front of the camera
          </p>
          <button
            onClick={startCamera}
            style={{
              width: '100%',
              padding: '16px',
              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              color: 'white',
              border: 'none',
              borderRadius: '10px',
              fontSize: '16px',
              fontWeight: '600',
              cursor: 'pointer'
            }}
          >
            📷 Start Camera
          </button>
        </>
      )}

      {/* SCANNING STATE */}
      {cameraState === 'scanning' && (
        <>
          <div style={{ 
            textAlign: 'center', 
            marginBottom: '16px',
            padding: '12px',
            background: '#dbeafe',
            borderRadius: '8px',
            color: '#1e40af',
            fontWeight: '600'
          }}>
            👤 Position your face in the frame
          </div>

          <div style={{ 
            position: 'relative',
            borderRadius: '12px', 
            overflow: 'hidden',
            marginBottom: '16px',
            border: '4px solid #10b981',
            background: '#000'
          }}>
            <video 
              ref={videoRef} 
              autoPlay 
              playsInline 
              style={{ 
                width: '100%', 
                display: 'block',
                transform: 'scaleX(-1)'
              }} 
            />
          </div>

          <canvas ref={canvasRef} style={{ display: 'none' }} />

          <div style={{ display: 'flex', gap: '12px' }}>
            <button
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
              📸 Capture
            </button>
          </div>
        </>
      )}

      {/* CAPTURED STATE */}
      {cameraState === 'captured' && capturedImage && (
        <>
          <div style={{ 
            borderRadius: '12px', 
            overflow: 'hidden',
            marginBottom: '16px',
            border: '4px solid #10b981'
          }}>
            <img 
              src={capturedImage} 
              alt="Captured" 
              style={{ 
                width: '100%',
                display: 'block',
                transform: 'scaleX(-1)'
              }} 
            />
          </div>

          <div style={{ display: 'flex', gap: '12px' }}>
            <button
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
              onClick={authenticateVoter}
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
              ✓ Verify Identity
            </button>
          </div>
        </>
      )}

      {/* VERIFYING STATE */}
      {cameraState === 'verifying' && (
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>⏳</div>
          <p style={{ fontSize: '16px', color: '#4a5568', fontWeight: '600' }}>
            Verifying Voter ID: {voterId}...
          </p>
        </div>
      )}
    </div>
  );
};

export default FaceAuth;
