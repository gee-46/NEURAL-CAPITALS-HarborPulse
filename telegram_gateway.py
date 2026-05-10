"""
HarborPulse Telegram Gateway v2
================================
Handles: PING [FISH_TYPE] [DISTANCE]
Example: PING PRAWNS 4

Perishability Index (Pi):
  Prawns   → 10
  Tuna     → 9
  Mackerel → 6
  Dry Fish → 1
"""

import telebot
import firebase_admin
from firebase_admin import credentials, firestore
import os
from datetime import datetime, timezone

# ─────────────────────────────────────────────────────
#  CONFIG
# ─────────────────────────────────────────────────────
BOT_TOKEN  = "8767693922:AAGNrnJsY8lgAXBWAglv35VhVVH20a_SDT0"
VESSEL_ID  = "MV_RAJAN"   # The Firebase document ID to update
VESSEL_NAME = "MV Rajan"

# Perishability Index (Pi) — as specified
PERISHABILITY = {
    "PRAWNS":    10,
    "TUNA":       9,
    "MACKEREL":   6,
    "DRY FISH":   1,
    "DRYFISH":    1,  # alias
}

ETA_PER_RANK = 15  # minutes per rank position

# ─────────────────────────────────────────────────────
#  FIREBASE INIT
# ─────────────────────────────────────────────────────
if not firebase_admin._apps:
    cred = credentials.Certificate(
        os.path.join(os.path.dirname(os.path.abspath(__file__)), 'serviceAccountKey.json')
    )
    firebase_admin.initialize_app(cred)

db = firestore.client()

# ─────────────────────────────────────────────────────
#  PRIORITY CALCULATOR  (DWQ formula)
# ─────────────────────────────────────────────────────
def calculate_priority(wait_time: float, pi: int, distance: float) -> float:
    """
    Dynamic Weighted Queueing:
    S = (T_w × 0.5) + (P_i × 10) − (D × 2)
    """
    return round((wait_time * 0.5) + (pi * 10) - (distance * 2), 2)


def get_current_rank(new_score: float, exclude_id: str) -> int:
    """
    Count how many active vessels have a higher score.
    Rank = count + 1.
    """
    docs = db.collection('vessels') \
             .where('status', '==', 'active') \
             .stream()

    higher = sum(
        1 for d in docs
        if d.id != exclude_id and d.to_dict().get('priority_score', 0) > new_score
    )
    return higher + 1


# ─────────────────────────────────────────────────────
#  BOT
# ─────────────────────────────────────────────────────
bot = telebot.TeleBot(BOT_TOKEN, parse_mode=None)


@bot.message_handler(func=lambda m: m.text.strip().upper().startswith("PING"))
def handle_ping(message):
    raw   = message.text.strip().upper()
    parts = raw.split()

    if len(parts) < 3:
        return  # silently ignore bad format

    fish_type_raw = parts[1]
    distance_raw  = parts[2]

    pi = PERISHABILITY.get(fish_type_raw)
    if pi is None:
        return  # silently ignore unknown fish

    try:
        distance = float(distance_raw.replace("KM", ""))
    except ValueError:
        return  # silently ignore bad distance

    score = calculate_priority(wait_time=0.0, pi=pi, distance=distance)

    vessel_ref = db.collection('vessels').document(VESSEL_ID)
    vessel_ref.set({
        'name':                VESSEL_NAME,
        'cargo_type':          fish_type_raw.capitalize(),
        'perishability_index': pi,
        'distance':            distance,
        'priority_score':      score,
        'status':              'active',
        'is_emergency':        False,
        'manual_override':     False,
        'wait_time':           0.0,
        'cargo_capacity':      250.0,
        'imo':                 VESSEL_ID,
        'last_ping_time':      firestore.SERVER_TIMESTAMP,
        'ping_timestamp':      datetime.now(timezone.utc).isoformat(),
    }, merge=True)

    rank = get_current_rank(score, exclude_id=VESSEL_ID)
    vessel_ref.update({'current_rank': rank})

    db.collection('audit_logs').add({
        'vessel_id':   VESSEL_ID,
        'vessel_name': VESSEL_NAME,
        'timestamp':   firestore.SERVER_TIMESTAMP,
        'action':      'TELEGRAM_PING',
        'reason':      f"{fish_type_raw.capitalize()} | {distance}km | Score: {score}"
    })

    print(f"[PING RECEIVED] {VESSEL_NAME} | {fish_type_raw} | {distance}km | Score:{score} | Rank:#{rank}")


@bot.message_handler(func=lambda _: True)
def catch_all(message):
    pass  # silently ignore everything else



# ─────────────────────────────────────────────────────
#  ENTRY POINT  (long-polling — no Ngrok needed)
# ─────────────────────────────────────────────────────
if __name__ == '__main__':
    print("=" * 52)
    print("  HARBORPULSE TELEGRAM GATEWAY  |  v2")
    print("  Listening for PING messages...")
    print("  No Ngrok or public URL required.")
    print("=" * 52)
    bot.infinity_polling(timeout=10, long_polling_timeout=5)
