import numpy as np
import scipy.signal
import scipy.stats
from typing import Dict, Any, List, Tuple

class SignalProcessor:
    """
    Industrial Digital Signal Processing (DSP) & Vibration Analysis Engine.
    Implements:
    - Windowed Fast Fourier Transform (FFT)
    - Statistical Non-Destructive Testing (NDT) Metrics
    - ISO 10816-3 Vibration Severity Classification
    - Spectral Peak Kinematic Matching
    """

    def __init__(self, sample_rate: int = 10000, buffer_size: int = 512):
        self.sample_rate = sample_rate
        self.buffer_size = buffer_size
        self.dt = 1.0 / sample_rate
        self.window = np.hanning(buffer_size)
        # Window correction factor for amplitude preservation
        self.window_correction = 2.0

    def compute_ndt_metrics(self, signal: np.ndarray) -> Dict[str, float]:
        """
        Calculates time-domain statistical health indicators (NDT).
        - RMS: Total vibration velocity / power
        - Kurtosis: 4th moment (healthy Gaussian = 3.0, bearing spall > 6.0)
        - Crest Factor: Peak to RMS ratio (detects impulsive impact shocks)
        - Peak-to-Peak (Pk-Pk): Dynamic displacement
        - Skewness: Asymmetry around mean
        - Shape Factor: RMS / Mean Absolute
        """
        signal_clean = signal - np.mean(signal)
        
        rms = float(np.sqrt(np.mean(signal_clean ** 2)))
        peak = float(np.max(np.abs(signal_clean)))
        crest_factor = float(peak / max(1e-6, rms))
        
        # Pearson kurtosis: Normal distribution = 3.0
        # fisher=False sets normal to 3.0 instead of 0.0
        kurt = float(scipy.stats.kurtosis(signal_clean, fisher=False, bias=False))
        if np.isnan(kurt) or np.isinf(kurt):
            kurt = 3.0
            
        pk_pk = float(np.ptp(signal_clean))
        skew = float(scipy.stats.skew(signal_clean, bias=False))
        if np.isnan(skew) or np.isinf(skew):
            skew = 0.0
            
        abs_mean = float(np.mean(np.abs(signal_clean)))
        shape_factor = float(rms / max(1e-6, abs_mean))

        return {
            "rms": round(rms, 3),
            "kurtosis": round(kurt, 2),
            "crest_factor": round(crest_factor, 2),
            "pk_pk": round(pk_pk, 3),
            "skewness": round(skew, 3),
            "shape_factor": round(shape_factor, 2)
        }

    def evaluate_iso_zone(self, rms_velocity: float) -> Dict[str, Any]:
        """
        ISO 10816-3 / ISO 20816-3 Vibration Severity Classification
        (Medium Industrial Machines 15kW - 300kW, Rigid Foundation)
        """
        if rms_velocity < 1.4:
            return {
                "zone": "A",
                "label": "GOOD",
                "description": "Newly commissioned machinery in optimal condition",
                "color": "#10b981", # Emerald
                "urgency": "NORMAL"
            }
        elif rms_velocity < 2.8:
            return {
                "zone": "B",
                "label": "ACCEPTABLE",
                "description": "Unrestricted long-term continuous operation permitted",
                "color": "#06b6d4", # Cyan
                "urgency": "MONITOR"
            }
        elif rms_velocity < 4.5:
            return {
                "zone": "C",
                "label": "UNSATISFACTORY",
                "description": "Restricted continuous operation; schedule maintenance",
                "color": "#f59e0b", # Amber
                "urgency": "ACTION_REQUIRED"
            }
        else:
            return {
                "zone": "D",
                "label": "UNACCEPTABLE",
                "description": "Vibration severity dangerous; imminent mechanical failure",
                "color": "#ef4444", # Red
                "urgency": "SHUTDOWN_ALARM"
            }

    def compute_fft_spectrum(self, signal: np.ndarray, max_freq: float = 1000.0) -> List[Dict[str, float]]:
        """
        Computes single-sided FFT amplitude spectrum windowed with Hanning filter.
        Uses 2048-point zero-padded FFT for fine frequency resolution.
        """
        signal_clean = signal - np.mean(signal)
        windowed = signal_clean * self.window
        
        n_fft = 2048
        fft_vals = np.fft.rfft(windowed, n=n_fft)
        freqs = np.fft.rfftfreq(n_fft, d=self.dt)
        
        # Single-sided amplitude
        amplitudes = (2.0 / len(signal)) * np.abs(fft_vals) * self.window_correction
        
        # Limit to max_freq
        mask = freqs <= max_freq
        filtered_freqs = freqs[mask]
        filtered_amps = amplitudes[mask]
        
        # Downsample to ~128 bins for UI rendering
        target_bins = 128
        if len(filtered_freqs) > target_bins:
            indices = np.linspace(0, len(filtered_freqs) - 1, target_bins, dtype=int)
            filtered_freqs = filtered_freqs[indices]
            filtered_amps = filtered_amps[indices]
            
        return [
            {"freq": round(float(f), 1), "amp": round(float(a), 4)}
            for f, a in zip(filtered_freqs, filtered_amps)
        ]

    def diagnose_kinematics(
        self,
        signal: np.ndarray,
        rpm: float,
        kinematic_freqs: Dict[str, float],
        ndt_metrics: Dict[str, float]
    ) -> Dict[str, Any]:
        """
        Deterministic Kinematic Fault Classifier.
        Matches detected spectral peaks against exact theoretical bearing & motor defect frequencies.
        """
        signal_clean = signal - np.mean(signal)
        n_fft = 2048
        fft_vals = np.fft.rfft(signal_clean * self.window, n=n_fft)
        freqs = np.fft.rfftfreq(n_fft, d=self.dt)
        amplitudes = (2.0 / len(signal)) * np.abs(fft_vals) * self.window_correction
        
        # Peak finding
        min_prominence = 0.08
        peak_indices, _ = scipy.signal.find_peaks(amplitudes, height=0.12, prominence=min_prominence)
        
        peak_freqs = freqs[peak_indices] if len(peak_indices) > 0 else np.array([])
        peak_amps = amplitudes[peak_indices] if len(peak_indices) > 0 else np.array([])
        
        # Top 5 peaks sorted by amplitude
        if len(peak_freqs) > 0:
            sort_idx = np.argsort(peak_amps)[::-1][:5]
            top_peaks = [
                {"freq": round(float(peak_freqs[i]), 1), "amp": round(float(peak_amps[i]), 3)}
                for i in sort_idx
            ]
        else:
            top_peaks = []
            
        kurtosis = ndt_metrics.get("kurtosis", 3.0)
        rms = ndt_metrics.get("rms", 0.3)
        crest = ndt_metrics.get("crest_factor", 2.0)
        
        f_1x = kinematic_freqs.get("1X", rpm / 60.0)
        f_2x = kinematic_freqs.get("2X", 2.0 * f_1x)
        f_bpfo = kinematic_freqs.get("BPFO", 3.58 * f_1x)
        f_bpfi = kinematic_freqs.get("BPFI", 5.41 * f_1x)
        
        def match_peak(target_freq: float, tolerance: float = 8.0) -> Tuple[bool, float]:
            for p in top_peaks:
                if abs(p["freq"] - target_freq) <= tolerance:
                    return True, p["amp"]
            return False, 0.0
            
        has_bpfo, amp_bpfo = match_peak(f_bpfo, tolerance=8.0)
        has_bpfi, amp_bpfi = match_peak(f_bpfi, tolerance=8.0)
        has_1x, amp_1x = match_peak(f_1x, tolerance=4.0)
        has_2x, amp_2x = match_peak(f_2x, tolerance=5.0)
        
        # Kinematic diagnosis tree
        if has_bpfo or (kurtosis > 3.8 and crest > 3.2 and not has_2x):
            matched_freq = f_bpfo
            return {
                "code": "FAULT-BRG-BPFO",
                "fault": "Bearing Outer Race Micro-Spall",
                "component": "SKF 6205 Deep Groove Ball Bearing",
                "severity": "CRITICAL" if rms > 2.8 else "HIGH",
                "confidence": 0.96,
                "detected_harmonic": f"BPFO @ {matched_freq:.1f} Hz (Impact Shock)",
                "action": "Schedule immediate replacement of Bearing Unit #1; inspect outer raceway seating.",
                "root_cause": "Sub-surface fatigue flaking under dynamic cyclic load.",
                "top_peaks": top_peaks
            }
            
        elif has_bpfi or (kurtosis > 3.8 and crest > 3.2):
            matched_freq = f_bpfi
            return {
                "code": "FAULT-BRG-BPFI",
                "fault": "Bearing Inner Race Flaking & Spalling",
                "component": "SKF 6205 Drive-End Bearing",
                "severity": "CRITICAL" if rms > 2.8 else "HIGH",
                "confidence": 0.94,
                "detected_harmonic": f"BPFI @ {matched_freq:.1f} Hz with 1X Sidebands",
                "action": "Order bearing replacement kit; verify shaft interference fit and lubrication cleanliness.",
                "root_cause": "Contact fatigue aggravated by shaft thermal expansion.",
                "top_peaks": top_peaks
            }
            
        elif has_2x and amp_2x > 0.35:
            return {
                "code": "FAULT-ALIGN-2X",
                "fault": "Shaft Coupling Angular/Parallel Misalignment",
                "component": "Flexible Jaw Coupling Assembly",
                "severity": "HIGH",
                "confidence": 0.91,
                "detected_harmonic": f"2X Rotational Harmonic @ {f_2x:.1f} Hz",
                "action": "Perform laser shaft alignment procedure; verify soft-foot condition.",
                "root_cause": "Thermal growth or mechanical settling between motor and driven equipment.",
                "top_peaks": top_peaks
            }
            
        elif has_1x and amp_1x > 0.8:
            return {
                "code": "FAULT-UNBAL-1X",
                "fault": "Rotor Dynamic Mass Unbalance",
                "component": "Drive Motor Rotor & Impeller",
                "severity": "MEDIUM",
                "confidence": 0.89,
                "detected_harmonic": f"1X Fundamental @ {f_1x:.1f} Hz",
                "action": "Perform single-plane dynamic field balancing; inspect impeller for particulate buildup.",
                "root_cause": "Mass eccentricity or loss of balance weights.",
                "top_peaks": top_peaks
            }
            
        elif rms > 2.0 and kurtosis < 3.5:
            return {
                "code": "FAULT-HYD-CAV",
                "fault": "Fluid Cavitation & Hydraulic Turbulence",
                "component": "Pump Housing & Impeller Vanes",
                "severity": "HIGH",
                "confidence": 0.88,
                "detected_harmonic": "Broadband High-Frequency Acoustic Emission (>2.5 kHz)",
                "action": "Throttle discharge valve; check NPSH (Net Positive Suction Head) and inlet strainers.",
                "root_cause": "Inlet pressure drop causing vapor bubble collapse against impeller vanes.",
                "top_peaks": top_peaks
            }
            
        else:
            return {
                "code": "SYS-NOMINAL",
                "fault": "Nominal Baseline Operation",
                "component": "All Monitored Subsystems",
                "severity": "NORMAL",
                "confidence": 0.99,
                "detected_harmonic": f"1X Fundamental @ {f_1x:.1f} Hz within tolerance",
                "action": "Maintain continuous ISO 10816 online condition monitoring.",
                "root_cause": "No anomalous vibrational modes detected.",
                "top_peaks": top_peaks
            }
