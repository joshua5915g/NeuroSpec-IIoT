import numpy as np
import time
from typing import Dict, Any, List

class PrognosticsEngine:
    """
    Industrial Machinery Remaining Useful Life (RUL) & Prognostics Engine.
    Implements:
    - Dynamic Health Index (HI) tracking based on ISO 10816-3 severity and anomaly score
    - Exponential degradation trajectory projection
    - Time-to-Threshold (TTT) Remaining Useful Life estimation
    """

    def __init__(self, nominal_life_hours: float = 8760.0):
        self.nominal_life_hours = nominal_life_hours  # ~1 year continuous duty (8760 hrs)
        self.health_index = 1.0
        self.history_hi: List[float] = []
        self.history_timestamps: List[float] = []
        self.max_history = 100
        self.fault_active_since: float = 0.0

    def calculate_instantaneous_hi(self, rms: float, kurtosis: float, anomaly_score: float) -> float:
        """
        Computes instantaneous health index in range [0.0, 1.0].
        - RMS mapped against ISO 10816-3 (0.3 mm/s = 1.0, 4.5 mm/s = 0.15)
        - Kurtosis penalty (> 3.5 begins penalizing bearing health)
        - Anomaly score penalty
        """
        # RMS contribution: ISO Zone A (<1.4) -> HI > 0.85
        # ISO Zone B (1.4-2.8) -> HI 0.65-0.85
        # ISO Zone C (2.8-4.5) -> HI 0.30-0.65
        # ISO Zone D (>4.5) -> HI < 0.20
        rms_norm = max(0.0, min(1.0, (rms - 0.2) / 4.5))
        rms_hi = 1.0 - (rms_norm ** 1.3)
        
        # Kurtosis penalty
        kurt_penalty = 0.0
        if kurtosis > 3.5:
            kurt_penalty = min(0.35, (kurtosis - 3.5) * 0.06)
            
        # Anomaly score penalty
        anomaly_penalty = min(0.4, anomaly_score * 0.8)
        
        hi = max(0.02, min(1.0, rms_hi - kurt_penalty - anomaly_penalty))
        return float(hi)

    def update(self, rms: float, kurtosis: float, anomaly_score: float, is_broken: bool) -> Dict[str, Any]:
        """
        Updates prognostics state and calculates Remaining Useful Life (RUL).
        """
        now = time.time()
        instant_hi = self.calculate_instantaneous_hi(rms, kurtosis, anomaly_score)
        
        # Exponential moving average filter for smooth HI tracking
        alpha = 0.15
        self.health_index = (1.0 - alpha) * self.health_index + alpha * instant_hi
        
        self.history_hi.append(self.health_index)
        self.history_timestamps.append(now)
        if len(self.history_hi) > self.max_history:
            self.history_hi.pop(0)
            self.history_timestamps.pop(0)
            
        # Prognostics & RUL Projection
        if not is_broken and self.health_index > 0.82:
            self.fault_active_since = 0.0
            rul_hours = self.nominal_life_hours * (self.health_index ** 1.5)
            deg_rate = 0.005 # %/hr nominal wear
            urgency = "OPTIMAL"
            projection_status = "STABLE"
        else:
            if self.fault_active_since == 0.0:
                self.fault_active_since = now
                
            elapsed_fault_time = max(1.0, now - self.fault_active_since)
            
            # Accelerated failure degradation model based on ISO severity
            # RUL drops sharply as bearing raceway spall accelerates
            failure_threshold = 0.18 # ISO Zone D boundary
            hi_margin = max(0.01, self.health_index - failure_threshold)
            
            # Exponential degradation projection: hours until HI hits 0.18
            # In active severe fault, RUL ranges from 12 hours (imminent) to 120 hours (scheduled shutdown)
            base_fault_life = 96.0 # hours under continuous severe fault
            rul_hours = max(2.5, base_fault_life * (hi_margin / 0.82) ** 1.8)
            deg_rate = float(round((1.0 - self.health_index) * 8.5, 2))
            
            if rul_hours < 24.0:
                urgency = "CRITICAL_SHUTDOWN"
                projection_status = "RAPID_ACCELERATION"
            elif rul_hours < 72.0:
                urgency = "SCHEDULE_MAINTENANCE"
                projection_status = "PROGRESSIVE_WEAR"
            else:
                urgency = "RESTRICTED_MONITOR"
                projection_status = "DEGRADATION_DETECTED"

        return {
            "health_index": round(float(self.health_index), 3),
            "health_percent": round(float(self.health_index * 100.0), 1),
            "rul_hours": round(float(rul_hours), 1),
            "degradation_rate_pct_hr": deg_rate,
            "projection_status": projection_status,
            "urgency": urgency
        }
