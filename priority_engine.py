from dataclasses import dataclass
from typing import List

# Perishability Index lookup map
PERISHABILITY_INDEX = {
    "Tuna": 10,
    "Shrimp": 10,
    "Prawns": 10,
    "Crabs": 4,
    "Default": 0
}

def calculate_score(wait_time: float, perishability_index: int, distance: float) -> float:
    """
    Dynamic Weighted Queueing (DWQ) Core Formula.
    
    Calculates the Priority Score (S) based on:
    - wait_time (T_w): Time already spent waiting (in hours). Positive impact on score (+0.5 weight).
    - perishability_index (P_i): How quickly the cargo spoils (1-10 scale). High impact (+10 weight).
    - distance (D): Distance from the harbor (in km). Negative impact (-2 weight) as closer vessels get priority.
    
    Formula: S = (T_w * 0.5) + (P_i * 10) - (D * 2)
    """
    return (wait_time * 0.5) + (perishability_index * 10) - (distance * 2)

@dataclass
class Boat:
    """Data structure representing a vessel in the live harbor queue."""
    name: str
    wait_time: float      
    cargo_type: str       
    distance: float       
    cargo_weight: float   
    is_emergency: bool = False
    manual_override: bool = False

    @property
    def perishability_index(self) -> int:
        """Looks up the perishability integer based on the cargo string."""
        return PERISHABILITY_INDEX.get(self.cargo_type, PERISHABILITY_INDEX["Default"])

    @property
    def priority_score(self) -> float:
        """Invokes the core DWQ algorithm for this specific vessel. Overrides to 999.0 if emergency, 100.0 if manual bump."""
        if self.is_emergency:
            return 999.0
        if self.manual_override:
            return 100.0
        return calculate_score(self.wait_time, self.perishability_index, self.distance)

def sort_boats_by_priority(boats: List[Boat]) -> List[Boat]:
    """
    Sorts a list of boats based on their Dynamic Weighted Queueing priority score.
    
    Primary Sort: Highest Priority Score (S) first.
    Secondary Tie-breaker: If scores are identical, the vessel with the smaller cargo_weight 
                           is prioritized, as lighter vessels clear the unloading docks faster.
    """
    return sorted(boats, key=lambda b: (-b.priority_score, b.cargo_weight))
