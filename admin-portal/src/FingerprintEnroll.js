import React, { useState, useEffect } from 'react';

const FingerprintEnroll = ({ onFingerprintCaptured, styles }) => {
  const [enrolling, setEnrolling] = useState(false);
  const [fingerprintData, setFingerprintData] = useState('');
  const [status, setStatus] = useState('');
  const [scannerStatus, setScannerStatus] = useState(null);
  const [checkingDuplicate, setCheckingDuplicate] = useState(false);

  useEffect(() => {
    checkScannerStatus();
  }, []);

  const checkScannerStatus = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/fingerprint/status');
      const result = await response.json();
      setScannerStatus(result.connected);
    } catch (error) {
      setScannerStatus(false);
    }
  };

  // ✅ NEW: Check for duplicate BEFORE enrollment
  const checkForDuplicate = async () => {
    setCheckingDuplicate(true);
    setStatus('👆 Place finger to check for duplicates...');
    
    try {
      // Wait 2 seconds for user to place finger
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const response = await fetch('http://localhost:5000/api/fingerprint/check_duplicate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      const result = await response.json();

      if (result.duplicate) {
        setStatus(result.message || '⚠️ Fingerprint already registered');
        setCheckingDuplicate(false);
        return false; // Block enrollment
      }

      console.log('✅ No duplicate found - proceeding to enrollment');
      return true; // Allow enrollment
      
    } catch (error) {
      console.error('Duplicate check error:', error);
      setStatus('⚠️ Could not check for duplicates - proceeding anyway');
      await new Promise(resolve => setTimeout(resolve, 1000));
      return true; // Allow on error
    } finally {
      setCheckingDuplicate(false);
    }
  };

  const handleEnroll = async () => {
    if (!scannerStatus) {
      setStatus('⚠️ Scanner not connected');
      return;
    }

    // ✅ STEP 1: Check for duplicate FIRST
    const canProceed = await checkForDuplicate();
    if (!canProceed) {
      console.log('❌ Duplicate detected - blocking enrollment');
      return; // Stop here if duplicate found
    }

    // ✅ STEP 2: Proceed with enrollment
    setEnrolling(true);
    setFingerprintData('');
    setStatus('🔄 Starting enrollment...');

    try {
      const startResponse = await fetch('http://localhost:5000/api/fingerprint/start_enroll', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      const startResult = await startResponse.json();

      if (!startResult.success) {
        setStatus(`❌ ${startResult.error}`);
        setEnrolling(false);
        return;
      }

      setStatus('👆 Step 1/3: Place finger...');

      let attempts = 0;
      const maxAttempts = 120;

      const pollInterval = setInterval(async () => {
        attempts++;

        try {
          const statusResponse = await fetch('http://localhost:5000/api/fingerprint/enroll_status');
          const statusResult = await statusResponse.json();

          if (statusResult.message && statusResult.message !== status) {
            setStatus(statusResult.message);
            console.log('Status:', statusResult.message);
          }

          if (statusResult.enrolled && statusResult.template_data) {
            clearInterval(pollInterval);
            setFingerprintData(statusResult.template_data);
            setStatus('✅ Fingerprint enrolled successfully!');
            setEnrolling(false);

            if (onFingerprintCaptured) {
              onFingerprintCaptured(statusResult.template_data);
            }
          } else if (!statusResult.success && !statusResult.waiting) {
            clearInterval(pollInterval);
            setStatus(`❌ ${statusResult.error || 'Enrollment failed'}`);
            setEnrolling(false);
          }

          if (attempts >= maxAttempts) {
            clearInterval(pollInterval);
            setStatus('⏱️ Timeout - restart enrollment');
            setEnrolling(false);
          }
        } catch (error) {
          clearInterval(pollInterval);
          setStatus('❌ Connection error');
          setEnrolling(false);
          console.error('Polling error:', error);
        }
      }, 500);

    } catch (error) {
      setStatus(`❌ ${error.message}`);
      setEnrolling(false);
    }
  };

  const isDisabled = enrolling || !scannerStatus || checkingDuplicate;

  return (
    <div style={{ marginBottom: '24px' }}>
      <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#2d3748', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
        👆 Fingerprint Biometric
      </h3>
      
      {scannerStatus !== null && (
        <div style={{
          ...styles.alert,
          ...(scannerStatus ? styles.alertSuccess : styles.alertWarning),
          marginBottom: '16px'
        }}>
          {scannerStatus ? '✅ Scanner Ready' : '⚠️ Scanner not connected'}
        </div>
      )}

      {status && (
        <div style={{
          padding: '12px 16px',
          background: fingerprintData ? '#d1fae5' : 
                      (status.includes('already registered') ? '#fffbeb' : 
                      (enrolling || checkingDuplicate) ? '#fffbeb' : '#fef2f2'),
          border: `2px solid ${fingerprintData ? '#10b981' : 
                               (status.includes('already registered') ? '#fcd34d' : 
                               (enrolling || checkingDuplicate) ? '#fcd34d' : '#fca5a5')}`,
          borderRadius: '8px',
          marginBottom: '16px',
          fontSize: '14px',
          fontWeight: '500'
        }}>
          {status}
        </div>
      )}

      <button
        type="button"
        onClick={handleEnroll}
        disabled={isDisabled}
        style={{
          ...styles.button,
          ...styles.buttonPrimary,
          opacity: isDisabled ? 0.5 : 1,
          cursor: isDisabled ? 'not-allowed' : 'pointer',
          width: '100%',
          padding: '16px 24px',
          fontSize: '16px'
        }}
      >
        {checkingDuplicate ? '🔍 Checking...' : 
         enrolling ? '⏳ Enrolling...' : 
         '👆 Enroll Fingerprint'}
      </button>

      {fingerprintData && (
        <div style={{ padding: '12px', background: '#d1fae5', borderRadius: '8px', marginTop: '12px', textAlign: 'center', color: '#065f46', fontSize: '14px', fontWeight: '600' }}>
          ✅ Template captured! ({fingerprintData.length} bytes)
        </div>
      )}

      <div style={{ marginTop: '16px', fontSize: '13px', color: '#718096', lineHeight: '1.6', padding: '12px', background: '#f7fafc', borderRadius: '8px' }}>
        <strong>Instructions:</strong><br/>
        1️⃣ Place finger <strong>firmly</strong><br/>
        2️⃣ <strong>Remove</strong> when told<br/>
        3️⃣ Place <strong>same finger again</strong>
      </div>
    </div>
  );
};

export default FingerprintEnroll;
