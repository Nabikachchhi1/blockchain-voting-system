import React, { useState, useEffect } from 'react';

const FingerprintAuth = ({ voterId, onAuthSuccess }) => {
  const [scanning, setScanning] = useState(false);
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');
  const [scannerReady, setScannerReady] = useState(false);

  useEffect(() => {
    checkScannerStatus();
  }, []);

  const checkScannerStatus = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/fingerprint/status');
      const result = await response.json();
      setScannerReady(result.connected);
      
      if (!result.connected) {
        setError('Scanner not connected - check Arduino on COM4');
      }
    } catch (error) {
      setScannerReady(false);
      setError('Cannot connect to backend server');
    }
  };

  const startScan = async () => {
    if (!scannerReady) {
      setError('Scanner not ready');
      return;
    }

    setScanning(true);
    setError('');
    setStatus('👆 Place your finger on sensor...');

    try {
      const maxAttempts = 100;
      let attempts = 0;

      const pollInterval = setInterval(async () => {
        attempts++;

        try {
          const scanResponse = await fetch('http://localhost:5000/api/fingerprint/scan');
          const scanResult = await scanResponse.json();

          console.log(`Scan attempt ${attempts}:`, scanResult);

          if (scanResult.scanned && scanResult.template_data) {
            clearInterval(pollInterval);
            setStatus('🔍 Authenticating...');

            const authResponse = await fetch('http://localhost:5000/api/authenticate/fingerprint', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                voter_id: voterId,
                fingerprint_template: scanResult.template_data
              })
            });

            const authResult = await authResponse.json();

            if (authResult.success) {
              await fetch('http://localhost:5000/api/fingerprint/clear', { method: 'POST' });
              setStatus('✅ Authentication successful!');
              setTimeout(() => onAuthSuccess(authResult.voter), 500);
            } else {
              setError(authResult.error || 'Fingerprint does not match');
              setScanning(false);
            }
          } else if (scanResult.scanned && !scanResult.template_data) {
            clearInterval(pollInterval);
            setError('Fingerprint not recognized');
            setScanning(false);
          } else if (attempts >= maxAttempts) {
            clearInterval(pollInterval);
            setError('Scan timeout - try again');
            setScanning(false);
          } else if (attempts % 10 === 0) {
            setStatus(`👆 Scanning... (${Math.round(attempts / 10)}s)`);
          }

        } catch (err) {
          clearInterval(pollInterval);
          setError('Connection error - check backend');
          setScanning(false);
          console.error('Scan error:', err);
        }
      }, 100);

    } catch (error) {
      setError('Failed to start scan: ' + error.message);
      setScanning(false);
    }
  };

  return (
    <div style={{ textAlign: 'center', padding: '40px 0' }}>
      <div style={{ fontSize: '64px', marginBottom: '20px' }}>👆</div>
      
      <h2 style={{ fontSize: '28px', fontWeight: '700', color: '#2d3748', margin: '0 0 12px 0' }}>
        Fingerprint Authentication
      </h2>
      
      <p style={{ fontSize: '16px', color: '#718096', marginBottom: '32px' }}>
        Place your registered finger on the sensor
      </p>

      {!scannerReady && (
        <div style={{ background: '#fef2f2', border: '2px solid #fca5a5', padding: '16px', borderRadius: '12px', marginBottom: '24px', color: '#991b1b', fontWeight: '500' }}>
          ⚠️ Scanner not connected - check Arduino on COM4
        </div>
      )}

      {scannerReady && !scanning && !error && (
        <div style={{ background: '#f0fdf4', border: '2px solid #86efac', padding: '16px', borderRadius: '12px', marginBottom: '24px', color: '#166534', fontWeight: '500' }}>
          ✅ Scanner Ready
        </div>
      )}

      {status && (
        <div style={{ background: scanning ? '#fffbeb' : '#f0fdf4', border: `2px solid ${scanning ? '#fcd34d' : '#86efac'}`, padding: '16px', borderRadius: '12px', marginBottom: '24px', color: scanning ? '#92400e' : '#166534', fontWeight: '500' }}>
          {status}
        </div>
      )}

      {error && (
        <div style={{ background: '#fef2f2', border: '2px solid #fca5a5', padding: '16px', borderRadius: '12px', marginBottom: '24px', color: '#991b1b', fontWeight: '500' }}>
          ❌ {error}
        </div>
      )}

      <button
        onClick={startScan}
        disabled={scanning || !scannerReady}
        style={{
          padding: '16px 48px',
          fontSize: '18px',
          fontWeight: '600',
          background: (scanning || !scannerReady) ? '#94a3b8' : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
          border: 'none',
          borderRadius: '12px',
          cursor: (scanning || !scannerReady) ? 'not-allowed' : 'pointer',
          boxShadow: '0 4px 12px rgba(102, 126, 234, 0.4)',
          opacity: (scanning || !scannerReady) ? 0.6 : 1,
          transition: 'all 0.2s'
        }}
      >
        {scanning ? '⏳ Scanning...' : '🔐 Authenticate with Fingerprint'}
      </button>

      {error && !scanning && (
        <button
          onClick={() => { setError(''); setStatus(''); checkScannerStatus(); }}
          style={{ marginTop: '16px', padding: '12px 32px', fontSize: '16px', fontWeight: '600', background: 'transparent', color: '#667eea', border: '2px solid #667eea', borderRadius: '8px', cursor: 'pointer' }}
        >
          🔄 Retry
        </button>
      )}
    </div>
  );
};

export default FingerprintAuth;
