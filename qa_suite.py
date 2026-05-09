import sys
from priority_engine import Boat, sort_boats_by_priority, PERISHABILITY_INDEX

def test_engine():
    print("--- 1. Engine Validation ---")
    # Setup missing Salted Fish per QA requirement
    PERISHABILITY_INDEX["Salted Fish"] = 1
    
    # Boat A (Distance 2km, Catch: Salted Fish, Wait: 5 mins)
    boat_a = Boat("Boat A", wait_time=5.0, cargo_type="Salted Fish", distance=2.0, cargo_capacity=500.0)
    # Boat B (Distance 5km, Catch: Tuna, Wait: 1 min)
    boat_b = Boat("Boat B", wait_time=1.0, cargo_type="Tuna", distance=5.0, cargo_capacity=500.0)
    
    # S = (T_w * 0.5) + (P_i * 10) - (D * 2)
    # Boat A: (5 * 0.5) + (1 * 10) - (2 * 2) = 2.5 + 10 - 4 = 8.5
    # Boat B: (1 * 0.5) + (10 * 10) - (5 * 2) = 0.5 + 100 - 10 = 90.5
    
    sorted_boats = sort_boats_by_priority([boat_a, boat_b])
    
    if sorted_boats[0].name == "Boat B":
        print("PASS: Boat B ranked higher than Boat A.")
    else:
        print("FAIL: Boat B is NOT ranked higher.")
        
    print(f"Details -> Boat B Score: {boat_b.priority_score} | Boat A Score: {boat_a.priority_score}\n")

if __name__ == "__main__":
    test_engine()
