import numpy as np
import asyncio
from typing import Optional, Dict, Any, List

class MachineSimulator:
    """
    Industrial Rotating Machinery Acoustic & Vibration Simulator.
    Models an induction motor coupled to a rolling-element bearing (SKF 6205) and load.
    
    Physics parameters:
    - Sampling rate: fs = 10,000 Hz
    - Buffer size: 512 points (51.2 ms per telemetry packet at ~20 Hz)
    - SKF 6205 Bearing Geometry:
        - Pitch Diameter (Dp): 39.04 mm
        - Ball Diameter (d): 7.94 mm
        - Number of Rolling Elements (N): 9
        - Contact Angle (alpha): 0 rad (0 deg)
    """
    
    # Bearing Kinematic Multipliers (relative to rotational frequency fr)
    # fr = RPM / 60
    # BPFO multiplier: (N / 2) * (1 - (d / Dp) * cos(alpha))
    # BPFI multiplier: (N / 2) * (1 + (d / Dp) * cos(alpha))
    # BSF multiplier:  (Dp / (2*d)) * (1 - (d/Dp * cos(alpha))**2)
    # FTF multiplier:  (1 / 2) * (1 - (d / Dp) * cos(alpha))
    DP = 39.04
    D = 7.94
    N = 9
    ALPHA = 0.0
    
    BPFO_MULT = (N / 2.0) * (1.0 - (D / DP) * np.cos(ALPHA))        # ~ 3.5848
    BPFI_MULT = (N / 2.0) * (1.0 + (D / DP) * np.cos(ALPHA))        # ~ 5.4152
    BSF_MULT  = (DP / (2.0 * D)) * (1.0 - ((D / DP) * np.cos(ALPHA))**2) # ~ 2.3559
    FTF_MULT  = 0.5 * (1.0 - (D / DP) * np.cos(ALPHA))             # ~ 0.3983

    def __init__(self, sample_rate: int = 10000, buffer_size: int = 512):
        self.sample_rate = sample_rate
        self.buffer_size = buffer_size
        self.dt = 1.0 / sample_rate
        
        # Operational State
        self.rpm = 3000.0  # Nominal running speed
        self.fault_mode = "HEALTHY" # 'HEALTHY', 'BPFO', 'BPFI', 'UNBALANCE', 'MISALIGNMENT', 'CAVITATION'
        self.is_broken = False
        self.vibration_factor = 0.0
        self.is_auto_healing = False
        
        # Continuous phase accumulators to prevent phase jumps between packets
        self.phase_shaft = 0.0
        self.phase_bearing = 0.0
        self.time_offset = 0.0

    @property
    def shaft_freq(self) -> float:
        """Rotational speed in Hz (1X frequency)."""
        return self.rpm / 60.0

    @property
    def bpfo_freq(self) -> float:
        """Ball Pass Frequency Outer Race in Hz."""
        return self.shaft_freq * self.BPFO_MULT

    @property
    def bpfi_freq(self) -> float:
        """Ball Pass Frequency Inner Race in Hz."""
        return self.shaft_freq * self.BPFI_MULT

    @property
    def bsf_freq(self) -> float:
        """Ball Spin Frequency in Hz."""
        return self.shaft_freq * self.BSF_MULT

    def get_kinematic_frequencies(self) -> Dict[str, float]:
        """Returns kinematic defect frequencies for current RPM."""
        fr = self.shaft_freq
        return {
            "1X": round(fr, 2),
            "2X": round(2.0 * fr, 2),
            "BPFO": round(self.bpfo_freq, 2),
            "BPFI": round(self.bpfi_freq, 2),
            "BSF": round(self.bsf_freq, 2),
            "FTF": round(fr * self.FTF_MULT, 2)
        }

    def set_rpm(self, new_rpm: float):
        """Set machine speed in RPM (clamped 0 - 6000)."""
        self.rpm = float(max(0.0, min(6000.0, new_rpm)))

    def set_fault(self, fault_type: str):
        """Inject specific kinematic failure mode."""
        valid_modes = ["HEALTHY", "BPFO", "BPFI", "UNBALANCE", "MISALIGNMENT", "CAVITATION"]
        if fault_type not in valid_modes:
            fault_type = "BPFO"
        
        self.fault_mode = fault_type
        if fault_type == "HEALTHY":
            self.is_broken = False
            self.vibration_factor = 0.0
        else:
            self.is_broken = True
            self.vibration_factor = 0.65

    def toggle_status(self) -> bool:
        """Toggle between HEALTHY and default critical fault (BPFO)."""
        if self.is_broken:
            self.set_fault("HEALTHY")
        else:
            self.set_fault("BPFO")
        return self.is_broken

    def generate_packet(self) -> np.ndarray:
        """
        Generates 512 points of continuous, physics-modeled acoustic/vibration signal.
        Emits realistic time-domain data with spectral peaks matching physical faults.
        """
        t = np.arange(self.buffer_size) * self.dt + self.time_offset
        self.time_offset += self.buffer_size * self.dt
        
        fr = self.shaft_freq
        
        # Baseline healthy machine sound:
        # 1X shaft rotation + small 2X harmonic + low white noise floor
        # Amplitude normalized ~ 0.5 mm/s baseline
        base_signal = (
            0.4 * np.sin(2.0 * np.pi * fr * t) +
            0.08 * np.sin(2.0 * np.pi * (2.0 * fr) * t + 0.5) +
            0.03 * np.sin(2.0 * np.pi * (3.0 * fr) * t + 1.2)
        )
        
        # Add baseline Gaussian sensor noise
        noise_level = 0.04 + (abs(self.rpm - 3000.0) / 6000.0) * 0.05
        sensor_noise = np.random.normal(0, noise_level, self.buffer_size)
        signal = base_signal + sensor_noise

        # Fault injections based on actual mechanical kinematics
        if self.fault_mode == "BPFO":
            # Outer race spall: Impulsive shocks at BPFO rate
            # Natural structural ringing frequency ~ 2150 Hz, plus explicit BPFO carrier harmonic
            f_bpfo = self.bpfo_freq
            period_samples = int(self.sample_rate / max(1.0, f_bpfo))
            
            impacts = np.zeros(self.buffer_size)
            ringing_freq = 2150.0  # Structural natural frequency (Hz)
            decay_rate = 900.0     # Damping factor
            
            # Periodic impact train
            for i in range(0, self.buffer_size, max(8, period_samples)):
                decay_len = min(self.buffer_size - i, 80)
                t_decay = np.arange(decay_len) * self.dt
                # Shock impulse
                impact_wave = np.exp(-decay_rate * t_decay) * np.sin(2.0 * np.pi * ringing_freq * t_decay)
                shock_amp = 4.2 * self.vibration_factor
                impacts[i : i + decay_len] += shock_amp * impact_wave
                
            # Add spectral peak at BPFO frequency (envelope demodulated response)
            bpfo_spectral = (1.4 * self.vibration_factor) * np.sin(2.0 * np.pi * f_bpfo * t)
            signal += impacts + bpfo_spectral

        elif self.fault_mode == "BPFI":
            # Inner race spall: Impulsive shocks at BPFI rate,
            # amplitude-modulated by 1X shaft rotation
            f_bpfi = self.bpfi_freq
            period_samples = int(self.sample_rate / max(1.0, f_bpfi))
            
            impacts = np.zeros(self.buffer_size)
            ringing_freq = 2800.0
            decay_rate = 1000.0
            
            load_zone_mod = 0.5 * (1.0 + np.cos(2.0 * np.pi * fr * t))
            
            for i in range(0, self.buffer_size, max(8, period_samples)):
                decay_len = min(self.buffer_size - i, 70)
                t_decay = np.arange(decay_len) * self.dt
                impact_wave = np.exp(-decay_rate * t_decay) * np.sin(2.0 * np.pi * ringing_freq * t_decay)
                shock_amp = 4.5 * self.vibration_factor
                impacts[i : i + decay_len] += shock_amp * impact_wave
                
            # Add spectral peak at BPFI frequency with 1X rotational sidebands
            bpfi_spectral = (1.2 * self.vibration_factor) * np.sin(2.0 * np.pi * f_bpfi * t) * (1.0 + 0.5 * np.cos(2.0 * np.pi * fr * t))
            signal += impacts * load_zone_mod + bpfi_spectral

        elif self.fault_mode == "UNBALANCE":
            # Severe 1X rotational speed unbalance
            signal += (2.2 * self.vibration_factor) * np.sin(2.0 * np.pi * fr * t)

        elif self.fault_mode == "MISALIGNMENT":
            # Angular/Parallel misalignment: High 2X harmonic and 3X harmonic
            signal += (1.8 * self.vibration_factor) * np.sin(2.0 * np.pi * (2.0 * fr) * t + 0.8)
            signal += (0.9 * self.vibration_factor) * np.sin(2.0 * np.pi * (3.0 * fr) * t + 1.6)

        elif self.fault_mode == "CAVITATION":
            # Fluid turbulence / cavitation: High frequency broadband hiss (2500 - 4500 Hz)
            cav_noise = np.random.normal(0, 1.4 * self.vibration_factor, self.buffer_size)
            # Simple high-pass filtering
            t_hp = np.arange(self.buffer_size) * self.dt
            high_freq_carrier = np.sin(2.0 * np.pi * 3200.0 * t_hp)
            signal += cav_noise * high_freq_carrier

        return signal

    async def auto_heal(self):
        """
        Autonomous stabilization control loop.
        Adjusts VFD speed away from resonance, gradually derates vibration to nominal.
        """
        self.is_auto_healing = True
        steps = 20
        
        for _ in range(steps):
            # Target nominal RPM = 3000
            diff = 3000.0 - self.rpm
            if abs(diff) > 25:
                self.rpm += np.sign(diff) * min(75.0, abs(diff))
            else:
                self.rpm = 3000.0
                
            # Gradually reduce vibration factor
            self.vibration_factor = max(0.0, self.vibration_factor - 0.04)
            await asyncio.sleep(0.2)
            
        self.rpm = 3000.0
        self.vibration_factor = 0.0
        self.fault_mode = "HEALTHY"
        self.is_broken = False
        self.is_auto_healing = False
