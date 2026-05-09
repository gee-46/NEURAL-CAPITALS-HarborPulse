import os
import random
import datetime
import firebase_admin
from firebase_admin import credentials, firestore
from flask import Flask, request, jsonify
from priority_engine import Boat, sort_boats_by_priority

# Ensure clean Firebase initialization using environment variables
try:
    firebase_admin.get_app()
    db = firestore.client()
except ValueError:
    cred_path = os.environ.get('GOOGLE_APPLICATION_CREDENTIALS')
    if cred_path:
        cred = credentials.Certificate(cred_path)
        firebase_admin.initialize_app(cred)
    else:
        # Fallback to default behavior if env var isn't set
        firebase_admin.initialize_app()
    db = firestore.client()

app = Flask(__name__)

def update_queue():
    """
    Core functional logic: Fetches active boats, calculates scores, sorts them, and updates ranks in Firebase.
    """
    try:
        vessels_ref = db.collection('vessels').where('status', '==', 'active')
        docs = vessels_ref.stream()

        boats = []
        doc_map = {}

        for doc in docs:
            data = doc.to_dict()
            boat = Boat(
                name=data.get('name', 'Unknown'),
                wait_time=float(data.get('wait_time', 0.0)),
                cargo_type=data.get('cargo_type', 'Default'),
                distance=float(data.get('distance', 0.0)),
                cargo_weight=float(data.get('cargo_capacity', 0.0)),
                is_emergency=bool(data.get('is_emergency', False))
            )
            boats.append(boat)
            doc_map[id(boat)] = doc.reference
            
        sorted_boats = sort_boats_by_priority(boats)

        batch = db.batch()
        for rank, boat in enumerate(sorted_boats, start=1):
            doc_ref = doc_map[id(boat)]
            batch.update(doc_ref, {
                'priority_score': boat.priority_score,
                'current_rank': rank
            })
        batch.commit()
        return True
    except Exception as e:
        print(f"Queue update error: {e}")
        return False

@app.route('/', methods=['GET'])
def home():
    """Home route (/) for the Dashboard."""
    return jsonify({
        "status": "success",
        "message": "HarborPulse Dashboard API is active."
    }), 200

@app.route('/ping', methods=['GET'])
def ping_interface():
    """Ping route (/ping) for the mobile fisherman interface."""
    return jsonify({
        "status": "success",
        "message": "Mobile fisherman interface ready. Use POST /api/ping to transmit telemetry."
    }), 200

@app.route('/api/ping', methods=['POST'])
def api_ping():
    """API Ping route (/api/ping) to handle POST requests with JSON data (catch_type, lat, lon)."""
    data = request.get_json() or {}
    
    catch_type = data.get('catch_type', 'Default')
    lat = data.get('lat', 0.0)
    lon = data.get('lon', 0.0)
    
    # We create or update a ping vessel
    distance = random.uniform(2.0, 5.0)
    
    vessel_name = data.get('vessel_name', f"Mobile Vessel {random.randint(100, 999)}")
    
    new_doc_data = {
        'name': vessel_name,
        'contact_phone': 'MobileApp',
        'wait_time': 0.0,
        'cargo_type': catch_type,
        'distance': distance,
        'cargo_capacity': 250.0,
        'status': 'active',
        'isPrimary': False,
        'eta': 'Pending',
        'imo': f"MOB-{random.randint(1000, 9999)}",
        'last_ping_time': firestore.SERVER_TIMESTAMP,
        'priority_score': 0,
        'current_rank': 999
    }
    db.collection('vessels').add(new_doc_data)
    update_queue()
    
    return jsonify({
        "status": "success",
        "message": f"Ping registered. Catch: {catch_type}, Distance: {distance:.2f}km"
    }), 200

@app.route('/api/manual', methods=['POST'])
def manual_dispatch():
    """Radio Dispatch route (/api/manual) for the Harbor Master to manually enter vessels."""
    data = request.get_json() or {}
        
    vessel_name = data.get('vessel_name', 'Unknown')
    catch_type = data.get('catch_type', 'Default')
    is_emergency = bool(data.get('is_emergency', False))
    
    # Create the doc in Firestore
    new_doc_data = {
        'name': vessel_name,
        'wait_time': 0.0,
        'cargo_type': catch_type,
        'distance': random.uniform(5.0, 15.0),
        'cargo_capacity': 250.0,
        'status': 'active',
        'isPrimary': False,
        'is_emergency': is_emergency,
        'eta': 'Pending',
        'imo': f"RADIO-{random.randint(1000, 9999)}",
        'last_ping_time': firestore.SERVER_TIMESTAMP,
        'priority_score': 0,
        'current_rank': 999
    }
    db.collection('vessels').add(new_doc_data)
    update_queue()
    
    return jsonify({
        "status": "success",
        "message": f"Manual dispatch registered for {vessel_name} with catch {catch_type}"
    }), 200

# --------------------------------------------------------------------------------
# ESSENTIAL DASHBOARD DATA ROUTES (Kept for functional core of the React Frontend)
# --------------------------------------------------------------------------------

@app.route('/api/vessels', methods=['GET'])
def get_vessels():
    """Fetches all active vessels for the real-time UI."""
    try:
        vessels_ref = db.collection('vessels').where('status', '==', 'active')
        docs = vessels_ref.stream()
        boats = []
        for doc in docs:
            data = doc.to_dict()
            data['id'] = doc.id
            boats.append(data)
        return jsonify(boats), 200
    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)}), 500

@app.route('/api/manual-override', methods=['POST'])
def manual_override():
    """Handles a manual bump of a vessel by the Harbor Master."""
    data = request.json or {}
    boat_id = data.get('boat_id')
    reason_code = data.get('reason_code')
    new_rank = data.get('new_rank')

    if not all([boat_id, reason_code, new_rank]):
        return jsonify({'status': 'error', 'message': 'Missing fields'}), 400

    try:
        audit_ref = db.collection('override_audit_logs').document()
        audit_ref.set({
            'boat_id': boat_id,
            'reason_code': reason_code,
            'new_rank': new_rank,
            'timestamp': datetime.datetime.now(datetime.timezone.utc),
            'action': 'MANUAL_BUMP'
        })

        vessel_ref = db.collection('vessels').document(boat_id)
        vessel_ref.update({
            'current_rank': new_rank,
            'manual_override': True
        })

        return jsonify({
            'status': 'success',
            'message': f'Manual override for {boat_id} logged.'
        }), 200
    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True, port=5000)
