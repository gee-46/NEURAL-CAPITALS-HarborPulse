import sys
import requests
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

API_URL = "http://127.0.0.1:5000/api/update-queue"

def simulate_sms(phone_number: str, message: str):
    """
    Simulates an incoming SMS from a vessel captain.
    """
    print(f"--- SIMULATING SMS INGEST ---")
    print(f"From: {phone_number}")
    print(f"Message: {message}\n")

    # 1. Parse the message (e.g., "PING PRAWNS")
    parts = message.strip().upper().split()
    if len(parts) >= 2 and parts[0] == "PING":
        new_cargo = parts[1].capitalize()  # e.g., "Prawns"
    else:
        print("Error: Invalid SMS format. Expected 'PING <CARGO_TYPE>'.")
        return

    # 2. Match the number to a vessel
    vessels_ref = db.collection('vessels').where('phone_number', '==', phone_number)
    docs = list(vessels_ref.stream())

    if not docs:
        print(f"Error: No active vessel found for phone number {phone_number}.")
        return

    # Assuming 1 match for simplicity
    vessel_doc = docs[0]
    vessel_data = vessel_doc.to_dict()
    boat_name = vessel_data.get('name', 'Unknown Vessel')
    boat_id = vessel_doc.id

    print(f"Match Found: {boat_name} (ID: {boat_id})")
    print(f"Updating cargo type to: {new_cargo}...")

    # 3. Assign the new cargo (which updates Perishability Index downstream)
    vessel_doc.reference.update({
        'cargo_type': new_cargo
    })

    # 4. Trigger the /api/update-queue endpoint
    print("\nTriggering Live Queue recalculation...")
    try:
        response = requests.post(API_URL)
        if response.status_code == 200:
            print("Queue recalculation successful.")
        else:
            print(f"Failed to recalculate queue. Server responded with {response.status_code}: {response.text}")
            return
    except requests.exceptions.ConnectionError:
        print("Error: Could not connect to the Flask API. Is it running on http://127.0.0.1:5000 ?")
        return

    # 5. Fetch the updated vessel to get its new rank
    updated_doc = vessel_doc.reference.get()
    updated_data = updated_doc.to_dict()
    new_rank = updated_data.get('current_rank', 'N/A')
    new_score = updated_data.get('priority_score', 'N/A')

    print("\n--- DEMO SUCCESS ---")
    print(f"Vessel: {boat_name}")
    print(f"New Cargo: {new_cargo}")
    print(f"New Priority Score: {new_score}")
    print(f"New Queue Rank: {new_rank}")
    print("----------------------------\n")

if __name__ == "__main__":
    # If run via command line arguments: python test_sms_gateway.py "+15551234567" "PING PRAWNS"
    if len(sys.argv) == 3:
        input_phone = sys.argv[1]
        input_message = sys.argv[2]
    else:
        # Default mock values for the "Rajan" persona demo
        input_phone = "+15551234567"
        input_message = "PING PRAWNS"
    
    simulate_sms(input_phone, input_message)
