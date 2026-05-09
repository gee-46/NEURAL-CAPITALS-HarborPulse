import os
import datetime
import firebase_admin
from firebase_admin import credentials, firestore
from flask import Flask, request, jsonify
from priority_engine import Boat, sort_boats_by_priority

# Initialize Firebase Admin
try:
    firebase_admin.get_app()
    db = firestore.client()
except ValueError:
    cred = credentials.Certificate('serviceAccountKey.json')
    firebase_admin.initialize_app(cred)
    db = firestore.client()

app = Flask(__name__)

@app.route('/api/update-queue', methods=['POST'])
def update_queue():
    """
    Fetches active boats, calculates scores, sorts them, and updates ranks in Firebase.
    Triggered when a new 'Ping' is received.
    """
    try:
        # 1. Fetch all active boats from the 'vessels' Firebase collection
        vessels_ref = db.collection('vessels').where('status', '==', 'active')
        docs = vessels_ref.stream()

        boats = []
        doc_map = {} # Maps the Boat object's memory id to its Firestore document reference

        for doc in docs:
            data = doc.to_dict()
            
            # Map Firebase data to our Priority Engine Boat model
            boat = Boat(
                name=data.get('name', 'Unknown'),
                wait_time=float(data.get('wait_time', 0.0)),
                cargo_type=data.get('cargo_type', 'Default'),
                distance=float(data.get('distance', 0.0)),
                cargo_capacity=float(data.get('cargo_capacity', 0.0))
            )
            boats.append(boat)
            doc_map[id(boat)] = doc.reference
            
        # 2. Pass them through the calculate_score/sort function in priority_engine.py
        sorted_boats = sort_boats_by_priority(boats)

        # 3. Update each boat's current_rank and priority_score in Firebase
        batch = db.batch()
        
        for rank, boat in enumerate(sorted_boats, start=1):
            doc_ref = doc_map[id(boat)]
            
            # Add updates to the Firestore batch
            batch.update(doc_ref, {
                'priority_score': boat.priority_score,
                'current_rank': rank
            })

        # Commit all updates atomically to Firebase
        batch.commit()

        return jsonify({
            'status': 'success',
            'message': f'Successfully updated priority queue for {len(boats)} active vessels.'
        }), 200

    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': str(e)
        }), 500


@app.route('/api/ingest-ping', methods=['POST'])
def ingest_ping():
    """
    Webhook/endpoint to receive SMS or Mobile Web Pings.
    Once the ping is ingested, it natively triggers the priority queue update.
    """
    data = request.json
    
    # TODO: Log the ping, process SMS content, or update the specific vessel's wait_time/distance
    print(f"Received Ping: {data}")
    
    # After ingesting the data, trigger the queue recalculation exactly as requested
    return update_queue()

@app.route('/api/vessels', methods=['GET'])
def get_vessels():
    """
    Fetches all active vessels for the real-time UI.
    """
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
    """
    Handles a manual bump of a vessel by the Harbor Master.
    Writes to override_audit_logs first, then updates the live queue.
    """
    data = request.json
    boat_id = data.get('boat_id')
    reason_code = data.get('reason_code')
    new_rank = data.get('new_rank')

    if not all([boat_id, reason_code, new_rank]):
        return jsonify({'status': 'error', 'message': 'Missing required fields: boat_id, reason_code, new_rank'}), 400

    try:
        # 1. Write transaction to override_audit_logs FIRST
        audit_ref = db.collection('override_audit_logs').document()
        audit_ref.set({
            'boat_id': boat_id,
            'reason_code': reason_code,
            'new_rank': new_rank,
            'timestamp': datetime.datetime.now(datetime.timezone.utc),
            'action': 'MANUAL_BUMP'
        })

        # 2. Update the live queue (update specific vessel's rank)
        vessel_ref = db.collection('vessels').document(boat_id)
        vessel_ref.update({
            'current_rank': new_rank,
            'manual_override': True
        })

        return jsonify({
            'status': 'success',
            'message': f'Manual override for {boat_id} logged and queue updated to rank {new_rank}.'
        }), 200

    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': str(e)
        }), 500

if __name__ == '__main__':
    app.run(debug=True, port=5000)
