import serial
import time
import threading

class FingerprintScanner:
    def __init__(self, port='COM4', baud=9600):
        self.port = port
        self.baud = baud
        self.ser = None
        self.enrolling = False
        self.enrolled_data = None
        self.scan_result = None
        self.enroll_message = ""
        self.last_scan_id = None
        self.connect()

    def connect(self):
        """Connect to Arduino"""
        try:
            self.ser = serial.Serial(self.port, self.baud, timeout=2)
            time.sleep(3)
            
            self.ser.reset_input_buffer()
            self.ser.reset_output_buffer()
            
            for _ in range(10):
                if self.ser.in_waiting > 0:
                    response = self.ser.readline().decode('utf-8', errors='ignore').strip()
                    print(f"📡 Arduino says: {response}")
                    if "READY" in response or "Waiting" in response:
                        print(f"✅ R307 connected on {self.port}")
                        return True
                time.sleep(0.3)
            
            print(f"⚠️ Connected on {self.port} (no READY message)")
            return True
            
        except Exception as e:
            print(f"❌ Connection failed: {e}")
            self.ser = None
            return False

    def is_connected(self):
        """Check connection"""
        return self.ser is not None and self.ser.is_open

    def start_enrollment(self, security_level=5):
        """Start enrollment"""
        if not self.is_connected():
            return {'success': False, 'error': 'Scanner not connected'}
        
        try:
            self.enrolling = True
            self.enrolled_data = None
            self.enroll_message = "Starting..."
            
            self.ser.reset_input_buffer()
            self.ser.reset_output_buffer()
            
            self.ser.write(b'ENROLL\n')
            self.ser.flush()
            time.sleep(0.1)
            
            print("📤 ENROLL command sent")
            
            threading.Thread(target=self._enrollment_listener, daemon=True).start()
            
            return {'success': True, 'message': 'Enrollment started'}
        except Exception as e:
            print(f"❌ Enrollment start error: {e}")
            return {'success': False, 'error': str(e)}

    def _enrollment_listener(self):
        """Listen for enrollment updates"""
        print("🎧 Enrollment listener active")
        
        while self.enrolling:
            try:
                if self.ser.in_waiting > 0:
                    line = self.ser.readline().decode('utf-8', errors='ignore').strip()
                    
                    if not line:
                        continue
                    
                    print(f"📡 Arduino: {line}")
                    
                    if "place" in line.lower() and "again" in line.lower():
                        self.enroll_message = "👆 Step 3/3: Place same finger again..."
                    elif "remove" in line.lower():
                        self.enroll_message = "✋ Step 2/3: Remove finger..."
                    elif "place" in line.lower():
                        self.enroll_message = "👆 Step 1/3: Place finger on sensor..."
                    else:
                        self.enroll_message = line
                    
                    if line.startswith("ENROLL:SUCCESS:"):
                        parts = line.split(':')
                        if len(parts) >= 3:
                            fp_id = parts[2]
                            template = f"FP_TEMPLATE_{fp_id}_{int(time.time())}"
                            
                            self.enrolled_data = {
                                'fingerprint_id': fp_id,
                                'template_data': template
                            }
                            self.enroll_message = f"✅ Enrollment complete! ID: {fp_id}"
                            self.enrolling = False
                            print(f"✅ SUCCESS: ID {fp_id}")
                            break
                    
                    elif line.startswith("ERROR:"):
                        self.enroll_message = line
                        self.enrolling = False
                        print(f"❌ ERROR: {line}")
                        break
                        
            except Exception as e:
                print(f"❌ Listener error: {e}")
                break
            
            time.sleep(0.05)
        
        print("🎧 Listener stopped")

    def get_enrollment_status(self):
        """Get enrollment status"""
        if self.enrolled_data:
            data = self.enrolled_data
            self.enrolled_data = None
            return {
                'success': True,
                'enrolled': True,
                'fingerprint_id': data['fingerprint_id'],
                'template_data': data['template_data'],
                'message': 'Complete!'
            }
        elif self.enrolling:
            return {
                'success': True,
                'enrolled': False,
                'waiting': True,
                'message': self.enroll_message or 'Processing...'
            }
        else:
            return {
                'success': False,
                'enrolled': False,
                'waiting': False,
                'error': 'Not enrolling'
            }

    def scan_fingerprint(self):
        """Scan fingerprint - ✅ FIXED: Don't cache NO_MATCH results"""
        if not self.is_connected():
            return {'scanned': False, 'error': 'Not connected'}
        
        # ✅ REMOVED: Cache check - always scan fresh
        
        try:
            self.ser.reset_input_buffer()
            self.ser.reset_output_buffer()
            
            self.ser.write(b'SCAN\n')
            self.ser.flush()
            
            print("📤 SCAN command sent")
            
            timeout = time.time() + 8
            
            while time.time() < timeout:
                if self.ser.in_waiting > 0:
                    response = self.ser.readline().decode('utf-8', errors='ignore').strip()
                    print(f"📡 Scan response: {response}")
                    
                    if response.startswith("SCAN:MATCH:"):
                        fp_id = response.split(':')[2]
                        template = f"FP_TEMPLATE_{fp_id}_{int(time.time())}"
                        
                        # ✅ ONLY cache MATCHED fingerprints
                        self.last_scan_id = fp_id
                        self._scan_time = time.time()
                        
                        print(f"✅ MATCH: Slot {fp_id}")
                        return {
                            'scanned': True,
                            'fingerprint_id': fp_id,
                            'template_data': template
                        }
                    
                    elif "SCAN:NO_MATCH" in response or "no match" in response.lower():
                        # ✅ CRITICAL FIX: Don't cache unmatched scans
                        self.last_scan_id = None
                        print("❌ NO MATCH - fingerprint not in database")
                        return {
                            'scanned': True,
                            'fingerprint_id': None,
                            'message': 'No match'
                        }
                    
                    elif response.startswith("ERROR:"):
                        return {'scanned': False, 'error': response}
                
                time.sleep(0.1)
            
            return {'scanned': False, 'message': 'Timeout - no finger detected'}
            
        except Exception as e:
            print(f"❌ Scan error: {e}")
            return {'scanned': False, 'error': str(e)}

    def cancel_enrollment(self):
        """Cancel enrollment"""
        self.enrolling = False
        self.enrolled_data = None
        self.enroll_message = ""
        return {'success': True}

    def clear_last_scan(self):
        """Clear scan cache"""
        self.last_scan_id = None
        self._scan_time = 0
        return {'success': True}
