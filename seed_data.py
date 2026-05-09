import firebase_admin
from firebase_admin import credentials, firestore

# Initialize Firebase Admin
try:
    firebase_admin.get_app()
    db = firestore.client()
except ValueError:
    cred = credentials.Certificate('serviceAccountKey.json')
    firebase_admin.initialize_app(cred)
    db = firestore.client()

def seed_database():
    vessels_ref = db.collection('vessels')
    
    # 1. Clean up existing active vessels to ensure a fresh demo state
    print("Cleaning up old vessels...")
    docs = vessels_ref.where('status', '==', 'active').stream()
    batch = db.batch()
    for doc in docs:
        batch.delete(doc.reference)
    batch.commit()

    # 2. Define our 10 dummy boats
    print("Generating 10 dummy vessels...")
    dummy_boats = [
        # Emergency vessel - huge wait time, close distance
        {
            "name": "MV Rescue One",
            "wait_time": 240.0,  # Very high wait time to ensure it spikes to top rank
            "cargo_type": "Medical/Emergency",
            "distance": 1.0,
            "cargo_capacity": 50.0,
            "phone_number": "+15559110000",
            "status": "active",
            "imo": "9999999"
        },
        # Regular fleet
        {
            "name": "MV Rajan",
            "wait_time": 12.0,
            "cargo_type": "Empty", # Start empty to show the SMS update
            "distance": 5.0,
            "cargo_capacity": 500.0,
            "phone_number": "+15551234567",
            "status": "active",
            "imo": "9845532"
        },
        {
            "name": "The Sea Wolf",
            "wait_time": 8.0,
            "cargo_type": "Tuna",
            "distance": 8.5,
            "cargo_capacity": 300.0,
            "phone_number": "+15552223333",
            "status": "active",
            "imo": "8221049"
        },
        {
            "name": "Blue Horizon",
            "wait_time": 24.0,
            "cargo_type": "Crabs",
            "distance": 14.0,
            "cargo_capacity": 800.0,
            "phone_number": "+15554445555",
            "status": "active",
            "imo": "9114772"
        },
        {
            "name": "Ocean Pearl",
            "wait_time": 4.0,
            "cargo_type": "Prawns",
            "distance": 2.5,
            "cargo_capacity": 150.0,
            "phone_number": "+15556667777",
            "status": "active",
            "imo": "8881234"
        },
        {
            "name": "Pacific Star",
            "wait_time": 36.0,
            "cargo_type": "Tuna",
            "distance": 10.0,
            "cargo_capacity": 1200.0,
            "phone_number": "+15558889999",
            "status": "active",
            "imo": "7774567"
        },
        {
            "name": "Nordic Fisher",
            "wait_time": 18.0,
            "cargo_type": "Crabs",
            "distance": 6.0,
            "cargo_capacity": 450.0,
            "phone_number": "+15550001111",
            "status": "active",
            "imo": "6668901"
        },
        {
            "name": "Silver Crest",
            "wait_time": 2.0,
            "cargo_type": "Default",
            "distance": 15.0,
            "cargo_capacity": 1500.0,
            "phone_number": "+15552224444",
            "status": "active",
            "imo": "5552345"
        },
        {
            "name": "Aqua Voyager",
            "wait_time": 15.0,
            "cargo_type": "Prawns",
            "distance": 3.0,
            "cargo_capacity": 200.0,
            "phone_number": "+15553336666",
            "status": "active",
            "imo": "4446789"
        },
        {
            "name": "Deep Sea King",
            "wait_time": 48.0,
            "cargo_type": "Tuna",
            "distance": 12.0,
            "cargo_capacity": 2500.0,
            "phone_number": "+15559998888",
            "status": "active",
            "imo": "3339012"
        }
    ]

    # 3. Commit to Firestore
    batch = db.batch()
    for boat in dummy_boats:
        # Use IMO as the document ID for clear targeting
        doc_ref = vessels_ref.document(boat["imo"])
        
        # Base ranking initialization
        boat["current_rank"] = 0
        boat["priority_score"] = 0.0
        boat["manual_override"] = False
        
        batch.set(doc_ref, boat)

    batch.commit()
    print("✅ Successfully seeded 10 vessels into Firebase.")
    print("👉 Next Step: Hit your '/api/update-queue' endpoint or run test_sms_gateway.py to calculate their ranks!")

if __name__ == "__main__":
    seed_database()
