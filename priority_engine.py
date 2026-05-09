from dataclasses import dataclass
from typing import List

# Perishability Index lookup
PERISHABILITY_INDEX = {
    "Tuna": 10,
    "Prawns": 10,
    "Crabs": 4,
    "Default": 0
}

@dataclass
class Boat:
    name: str
    wait_time: float      # T_w
    cargo_type: str       # Determines P_i
    distance: float       # D
    cargo_capacity: float # Used for tiebreaker

    @property
    def perishability_index(self) -> int:
        return PERISHABILITY_INDEX.get(self.cargo_type, PERISHABILITY_INDEX["Default"])

    @property
    def priority_score(self) -> float:
        """
        Calculates Priority Score S:
        S = (T_w * 0.5) + (P_i * 10) - (D * 2)
        """
        t_w = self.wait_time
        p_i = self.perishability_index
        d = self.distance
        
        return (t_w * 0.5) + (p_i * 10) - (d * 2)

def sort_boats_by_priority(boats: List[Boat]) -> List[Boat]:
    """
    Sorts a list of boats based on their priority score (highest first).
    Tiebreaker: If scores are equal, the boat with the smaller cargo capacity wins.
    """
    # Sort key:
    # 1. -b.priority_score (Descending order for score)
    # 2. b.cargo_capacity  (Ascending order for tiebreaker: smaller capacity clears dock faster)
    return sorted(boats, key=lambda b: (-b.priority_score, b.cargo_capacity))

# Example usage
if __name__ == "__main__":
    test_boats = [
        Boat(name="MV Rajan", wait_time=12.0, cargo_type="Tuna", distance=5.0, cargo_capacity=500.0),
        # 'The Sea Wolf' has the exact same score variables as 'MV Rajan' but smaller capacity
        Boat(name="The Sea Wolf", wait_time=12.0, cargo_type="Tuna", distance=5.0, cargo_capacity=200.0),
        Boat(name="Blue Horizon", wait_time=48.0, cargo_type="Crabs", distance=12.0, cargo_capacity=800.0),
    ]

    print("--- Live Priority Queue Calculation ---")
    sorted_queue = sort_boats_by_priority(test_boats)
    
    for rank, boat in enumerate(sorted_queue, 1):
        print(f"{rank}. {boat.name:<15} | Score: {boat.priority_score:>5.1f} | Capacity: {boat.cargo_capacity:>5.1f} | Cargo: {boat.cargo_type}")
