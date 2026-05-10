import firebase_admin
from firebase_admin import credentials, firestore
import os
from datetime import datetime, timezone

# Init Firebase
cred_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'serviceAccountKey.json')
if not firebase_admin._apps:
    cred = credentials.Certificate(cred_path)
    firebase_admin.initialize_app(cred)

db = firestore.client()

vessels = [
    {
        "imo": "9845532",
        "name": "MV Rajan",
        "cargo_type": "Tuna",
        "perishability_index": 10,
        "distance": 4.2,
        "priority_score": 98.5,
        "status": "active",
        "current_rank": 1,
        "cargo_capacity": 450,
        "wait_time": 0.5,
        "is_emergency": False
    },
    {
        "imo": "8221049",
        "name": "The Sea Wolf",
        "cargo_type": "Prawns",
        "perishability_index": 9,
        "distance": 8.1,
        "priority_score": 82.4,
        "status": "active",
        "current_rank": 2,
        "cargo_capacity": 280,
        "wait_time": 1.2,
        "is_emergency": False
    },
    {
        "imo": "9114772",
        "name": "Blue Horizon",
        "cargo_type": "Mackerel",
        "perishability_index": 6,
        "distance": 12.5,
        "priority_score": 64.1,
        "status": "active",
        "current_rank": 3,
        "cargo_capacity": 620,
        "wait_time": 2.4,
        "is_emergency": False
    }
]

print("Injecting Hero Vessels into HarborPulse...")
for v in vessels:
    v['last_ping_time'] = firestore.SERVER_TIMESTAMP
    db.collection('vessels').document(v['imo']).set(v)
    print(f" - {v['name']} INJECTED")

print("\nDone! Refresh your dashboard now.")
