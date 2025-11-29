from flask import Flask, request, jsonify
from flask_cors import CORS
import json
import os
import base64
from io import BytesIO
from PIL import Image
import face_recognition
import numpy as np
from datetime import datetime
from fingerprint_service import FingerprintScanner

app = Flask(__name__)
CORS(app)

VOTERS_FILE = 'voters_db.json'
FACE_IMAGES_DIR = 'voter_faces'

os.makedirs(FACE_IMAGES_DIR, exist_ok=True)

# ==================== FINGERPRINT SCANNER ====================
fp_scanner = None

def init_fingerprint():
    """Initialize fingerprint scanner"""
    global fp_scanner
    try:
        fp_scanner = FingerprintScanner('COM4')
        if fp_scanner.is_connected():
            return True
        return False
    except Exception as e:
        print(f"❌ Fingerprint init error: {e}")
        return False

print("\n" + "="*70)
print("🚀 INITIALIZING FINGERPRINT SCANNER...")
print("="*70)
fp_connected = init_fingerprint()
print(f"👆 Fingerprint Scanner: {'✅ Connected' if fp_connected else '❌ Not Connected'}")
print("="*70 + "\n")

# ==================== DATABASE FUNCTIONS ====================
def load_voters():
    if os.path.exists(VOTERS_FILE):
        try:
            with open(VOTERS_FILE, 'r') as f:
                return json.load(f)
        except json.JSONDecodeError:
            return {}
    return {}

def save_voters(voters):
    with open(VOTERS_FILE, 'w') as f:
        json.dump(voters, f, indent=2)

def base64_to_image_file(base64_string, voter_id):
    try:
        if 'base64,' in base64_string:
            base64_string = base64_string.split('base64,')[1]
        
        image_data = base64.b64decode(base64_string)
        image = Image.open(BytesIO(image_data))
        
        if image.mode != 'RGB':
            image = image.convert('RGB')
        
        image_path = os.path.join(FACE_IMAGES_DIR, f"{voter_id}.jpg")
        image.save(image_path, 'JPEG', quality=95)
        
        print(f"✅ Saved image: {image_path}")
        return image_path
    except Exception as e:
        print(f"❌ Error saving image: {e}")
        return None

def get_face_encodings(image_path):
    """Extract face encodings from image"""
    try:
        print(f"🔍 Loading image: {image_path}")
        image = face_recognition.load_image_file(image_path)
        
        face_locations = face_recognition.face_locations(image, model='hog')
        
        if not face_locations:
            print("❌ No face detected")
            return None, 0
        
        face_encodings = face_recognition.face_encodings(image, face_locations)
        
        print(f"✅ Found {len(face_encodings)} face(s)")
        return face_encodings[0], len(face_encodings)
    except Exception as e:
        print(f"❌ Error: {e}")
        return None, 0

# ==================== FINGERPRINT ENDPOINTS ====================

@app.route('/api/fingerprint/status', methods=['GET'])
def fingerprint_status():
    """Check fingerprint scanner status"""
    if fp_scanner and fp_scanner.is_connected():
        return jsonify({'connected': True, 'message': 'Scanner ready'})
    return jsonify({'connected': False, 'message': 'Scanner not connected'}), 503

@app.route('/api/fingerprint/start_enroll', methods=['POST'])
def start_fingerprint_enrollment():
    """Start fingerprint enrollment"""
    if not fp_scanner or not fp_scanner.is_connected():
        return jsonify({'success': False, 'error': 'Scanner not connected'})
    
    result = fp_scanner.start_enrollment()
    return jsonify(result)

@app.route('/api/fingerprint/enroll_status', methods=['GET'])
def fingerprint_enroll_status():
    """Check enrollment progress"""
    if not fp_scanner or not fp_scanner.is_connected():
        return jsonify({'success': False, 'error': 'Scanner not connected'})
    
    result = fp_scanner.get_enrollment_status()
    return jsonify(result)

@app.route('/api/fingerprint/cancel_enroll', methods=['POST'])
def cancel_fingerprint_enrollment():
    """Cancel ongoing enrollment"""
    if not fp_scanner:
        return jsonify({'success': False, 'error': 'Scanner not available'})
    
    result = fp_scanner.cancel_enrollment()
    return jsonify(result)

@app.route('/api/fingerprint/scan', methods=['GET'])
def get_fingerprint_scan():
    """Scan existing fingerprint for authentication"""
    if not fp_scanner or not fp_scanner.is_connected():
        return jsonify({'scanned': False, 'error': 'Scanner not connected'}), 503
    
    scan_result = fp_scanner.scan_fingerprint()
    return jsonify(scan_result)

@app.route('/api/fingerprint/clear', methods=['POST'])
def clear_fingerprint():
    """Clear the stored fingerprint scan"""
    if fp_scanner:
        fp_scanner.clear_last_scan()
    return jsonify({'success': True})

# ==================== REGISTRATION ====================

@app.route('/api/register', methods=['POST'])
def register_voter():
    try:
        data = request.json
        voters = load_voters()
        
        voter_id = str(data.get('voter_id', '')).strip().upper()
        name = data.get('name', '')
        constituency = data.get('constituency', '')
        face_data = data.get('face_data', '')
        fingerprint_template = data.get('fingerprint_template', '')
        
        if not all([voter_id, name, constituency, face_data, fingerprint_template]):
            return jsonify({'success': False, 'error': 'All fields required'}), 400
        
        if voter_id in voters:
            return jsonify({'success': False, 'error': 'Voter already registered'}), 400
        
        # Extract fingerprint ID from template
        try:
            fingerprint_id = fingerprint_template.split('_')[2]
        except IndexError:
            return jsonify({'success': False, 'error': 'Invalid fingerprint template format'}), 400

        # Check if fingerprint ID already used
        for v_id, v_data in voters.items():
            if v_data.get('fingerprint_id') == fingerprint_id:
                print(f"⚠️ Fingerprint ID {fingerprint_id} already registered to {v_id}")
                return jsonify({'success': False, 'error': 'Fingerprint already registered'}), 400
        
        print(f"📸 Registering: {voter_id} with Fingerprint ID: {fingerprint_id}")
        
        # Save face image
        image_path = base64_to_image_file(face_data, voter_id)
        if not image_path:
            return jsonify({'success': False, 'error': 'Failed to save image'}), 400
        
        # Get face encoding
        encoding, count = get_face_encodings(image_path)
        if encoding is None:
            os.remove(image_path)
            return jsonify({'success': False, 'error': 'No face detected'}), 400
        
        # Store voter with fingerprint ID
        voters[voter_id] = {
            'name': name,
            'constituency': constituency.lower(),
            'image_path': image_path,
            'face_encoding': encoding.tolist(),
            'fingerprint_id': fingerprint_id,
            'has_voted': False,
            'registered_at': datetime.now().strftime('%Y-%m-%d %H:%M:%S')
        }
        
        save_voters(voters)
        print(f"✅ Registered: {voter_id} ({name}) - FP ID: {fingerprint_id}")
        
        return jsonify({'success': True, 'message': 'Registration successful'})
    
    except Exception as e:
        print(f"❌ Registration error: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({'success': False, 'error': str(e)}), 500

# ==================== FACE AUTHENTICATION ====================

@app.route('/api/authenticate/face', methods=['POST'])
def authenticate_face():
    try:
        data = request.json
        voters = load_voters()
        
        voter_id = str(data.get('voter_id', '')).strip().upper()
        captured_face = data.get('face_data', '')
        
        if not voter_id or not captured_face:
            return jsonify({'success': False, 'error': 'Voter ID and face required'}), 400
        
        if voter_id not in voters:
            return jsonify({'success': False, 'error': 'Voter ID not found'}), 404
        
        voter = voters[voter_id]
        
        if voter.get('has_voted', False):
            return jsonify({'success': False, 'error': 'You have already voted!'}), 403
        
        print(f"🔍 Face auth: {voter_id}")
        
        temp_path = base64_to_image_file(captured_face, 'temp_auth')
        if not temp_path:
            return jsonify({'success': False, 'error': 'Failed to process image'}), 400
        
        captured_encoding, _ = get_face_encodings(temp_path)
        if captured_encoding is None:
            os.remove(temp_path)
            return jsonify({'success': False, 'error': 'No face detected'}), 400
        
        stored_enc = np.array(voter.get('face_encoding', []))
        distance = face_recognition.face_distance([stored_enc], captured_encoding)[0]
        confidence = max(0, min(100, (1 - distance) * 100))
        
        if os.path.exists(temp_path):
            os.remove(temp_path)
        
        if distance < 0.4:
            print(f"✅ Face auth SUCCESS: {voter_id} (distance={distance:.3f}, confidence={confidence:.2f}%)")
            return jsonify({
                'success': True,
                'confidence': round(confidence, 2),
                'voter': {
                    'name': voter['name'],
                    'voter_id': voter_id,
                    'constituency': voter['constituency'],
                    'has_voted': False
                }
            }), 200
        else:
            print(f"❌ Face MISMATCH: {voter_id} (distance={distance:.3f})")
            return jsonify({'success': False, 'error': 'Face verification failed'}), 403
    
    except Exception as e:
        print(f"❌ Face auth error: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/authenticate', methods=['POST'])
def authenticate_voter():
    """Legacy endpoint"""
    return authenticate_face()

# ==================== FINGERPRINT AUTHENTICATION ====================

@app.route('/api/authenticate/fingerprint', methods=['POST'])
def authenticate_fingerprint():
    """Authenticate by comparing fingerprint IDs - ✅ FIXED: Reject NO_MATCH"""
    try:
        data = request.json
        voter_id = data.get('voter_id', '').upper()
        fingerprint_template = data.get('fingerprint_template', '')
        
        if not voter_id or not fingerprint_template:
            return jsonify({'success': False, 'error': 'Missing voter_id or fingerprint'}), 400
        
        # ✅ CRITICAL FIX: Check if fingerprint was actually matched
        if not fingerprint_template or fingerprint_template == 'None' or 'NO_MATCH' in str(fingerprint_template).upper():
            print(f"❌ Fingerprint not recognized in scanner database")
            return jsonify({'success': False, 'error': 'Fingerprint not recognized. Please use registered finger.'}), 403
        
        # Extract fingerprint ID from template
        try:
            fp_id_from_scan = fingerprint_template.split('_')[2]
        except (IndexError, AttributeError):
            print(f"❌ Invalid fingerprint template format: {fingerprint_template}")
            return jsonify({'success': False, 'error': 'Invalid fingerprint format'}), 400
        
        voters = load_voters()
        voter = voters.get(voter_id)
        
        if not voter:
            return jsonify({'success': False, 'error': 'Voter ID not found'}), 404
        
        if voter.get('has_voted', False):
            return jsonify({'success': False, 'error': 'You have already voted!'}), 403
            
        fp_id_from_db = voter.get('fingerprint_id')
        if not fp_id_from_db:
            return jsonify({'success': False, 'error': 'No fingerprint enrolled for this voter'}), 400
        
        print(f"🔍 FP AUTH: Voter={voter_id}, DB_Slot={fp_id_from_db}, Scanned_Slot={fp_id_from_scan}")
        
        # Compare fingerprint slot IDs
        if str(fp_id_from_scan) == str(fp_id_from_db):
            print(f"✅ FP MATCH: {voter_id} - Slot {fp_id_from_scan}")
            return jsonify({
                'success': True,
                'voter': {
                    'name': voter['name'],
                    'voter_id': voter_id,
                    'constituency': voter['constituency'],
                    'has_voted': False
                }
            }), 200
        else:
            print(f"❌ FP MISMATCH: Expected slot {fp_id_from_db}, got slot {fp_id_from_scan}")
            return jsonify({'success': False, 'error': 'Fingerprint does not match registered fingerprint'}), 403
            
    except Exception as e:
        print(f"❌ FP auth error: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({'success': False, 'error': str(e)}), 500

# ==================== OTHER ENDPOINTS ====================

@app.route('/api/check_voter_id', methods=['POST'])
def check_voter_id():
    try:
        data = request.json
        voters = load_voters()
        voter_id = str(data.get('voter_id', '')).strip().upper()
        
        if not voter_id:
            return jsonify({'exists': False, 'error': 'Voter ID required'}), 400
        
        voter = voters.get(voter_id)
        if voter:
            return jsonify({
                'exists': True,
                'has_voted': voter.get('has_voted', False),
                'name': voter.get('name', ''),
                'constituency': voter.get('constituency', '')
            })
        
        return jsonify({'exists': False})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/check_voted', methods=['POST'])
def check_voted():
    try:
        data = request.json
        voters = load_voters()
        voter_id = str(data.get('voter_id', '')).strip().upper()
        
        if voter_id in voters:
            return jsonify({'has_voted': voters[voter_id].get('has_voted', False)})
        return jsonify({'has_voted': False})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/mark_voted', methods=['POST'])
def mark_voted():
    try:
        data = request.json
        voters = load_voters()
        voter_id = str(data.get('voter_id', '')).strip().upper()
        
        if voter_id in voters:
            voters[voter_id]['has_voted'] = True
            voters[voter_id]['voted_at'] = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
            save_voters(voters)
            print(f"✅ Marked voted: {voter_id}")
            return jsonify({'success': True})
        
        return jsonify({'success': False, 'error': 'Voter not found'}), 404
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/health', methods=['GET'])
def health():
    voters = load_voters()
    return jsonify({
        'status': 'running',
        'fingerprint_connected': fp_scanner.is_connected() if fp_scanner else False,
        'total_voters': len(voters),
        'voted_count': sum(1 for v in voters.values() if v.get('has_voted')),
        'pending_count': sum(1 for v in voters.values() if not v.get('has_voted'))
    })

if __name__ == '__main__':
    print("\n" + "="*70)
    print("🚀 BLOCKCHAIN VOTING API SERVER")
    print("="*70)
    print("📍 Server: http://localhost:5000")
    print(f"👆 Fingerprint: {'✅ Connected' if fp_connected else '❌ Not Connected'}")
    print("🔐 Face Auth Threshold: 0.4 (Strict)")
    print("🔐 Fingerprint: Slot-based matching with NO_MATCH rejection")
    print("🚫 Duplicate Check: Hardware + Database validation")
    print("="*70 + "\n")
    
    app.run(debug=False, port=5000, host='0.0.0.0')
