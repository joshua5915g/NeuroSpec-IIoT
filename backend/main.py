from fastapi import FastAPI, WebSocket, WebSocketDisconnect, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import asyncio
import time
import sys
import os
from typing import Optional, Dict, Any

sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from simulator import MachineSimulator
from signal_processor import SignalProcessor
from processor import AIProcessor
from prognostics import PrognosticsEngine

app = FastAPI(title="NeuroSpec IIoT Acoustic Anomaly Detection Engine")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Core Industrial Engines ---
print("[INIT] Initializing Machine Simulator (10 kHz continuous physics)...")
simulator = MachineSimulator()

print("[INIT] Initializing Signal Processor (Windowed FFT & NDT Engine)...")
signal_processor = SignalProcessor()

print("[INIT] Initializing AI Deep Spectral Autoencoder...")
ai_processor = AIProcessor(weights_path=os.path.join(os.path.dirname(os.path.abspath(__file__)), "spectral_autoencoder.pth"))

print("[INIT] Initializing Prognostics & RUL Engine...")
prognostics_engine = PrognosticsEngine()

# --- Pydantic Models ---
class RPMRequest(BaseModel):
    rpm: int

class FaultRequest(BaseModel):
    fault: str # 'HEALTHY', 'BPFO', 'BPFI', 'UNBALANCE', 'MISALIGNMENT', 'CAVITATION'

class BearingRequest(BaseModel):
    name: Optional[str] = "SKF 6205"
    dp: float
    d: float
    n: int
    alpha: Optional[float] = 0.0


# --- REST API Endpoints ---

@app.get("/")
def read_root():
    return {
        "system": "NeuroSpec IIoT Predictive Maintenance Core",
        "status": "ONLINE",
        "sampling_rate_hz": simulator.sample_rate,
        "rpm": simulator.rpm,
        "active_fault": simulator.fault_mode,
        "bearing": simulator.bearing_name
    }

@app.get("/api/kinematics")
def get_kinematics():
    """Returns theoretical bearing & rotational kinematic defect frequencies."""
    return {
        "rpm": simulator.rpm,
        "bearing_model": simulator.bearing_name,
        "frequencies_hz": simulator.get_kinematic_frequencies()
    }

@app.post("/api/set-bearing")
def set_bearing(req: BearingRequest):
    """Dynamically reconfigures bearing geometry constants."""
    simulator.set_bearing(dp=req.dp, d=req.d, n=req.n, alpha_deg=req.alpha or 0.0, name=req.name or "")
    return {
        "success": True,
        "bearing_model": simulator.bearing_name,
        "kinematics": simulator.get_kinematic_frequencies()
    }

@app.post("/api/set-fault")
def set_fault(req: FaultRequest):
    """Injects a specific physical fault mode."""
    simulator.set_fault(req.fault)
    return {
        "success": True,
        "fault_mode": simulator.fault_mode,
        "is_broken": simulator.is_broken,
        "rpm": simulator.rpm
    }

@app.post("/api/toggle-break")
def toggle_break():
    """Toggles between HEALTHY and default critical bearing fault (BPFO)."""
    state = simulator.toggle_status()
    return {
        "status": "BROKEN" if state else "HEALTHY",
        "fault_mode": simulator.fault_mode,
        "rpm": simulator.rpm
    }

@app.post("/api/set-rpm")
def set_rpm(request: RPMRequest):
    """Dynamic speed control for VFD simulation."""
    simulator.set_rpm(request.rpm)
    return {
        "success": True,
        "rpm": simulator.rpm,
        "kinematics": simulator.get_kinematic_frequencies()
    }

@app.get("/api/diagnose")
def diagnose():
    """
    Deterministic Kinematic Diagnostic Endpoint.
    Analyzes current acoustic stream and identifies root mechanical cause backed by physics.
    """
    raw_signal = simulator.generate_packet()
    ndt = signal_processor.compute_ndt_metrics(raw_signal)
    kinematics = simulator.get_kinematic_frequencies()
    diag = signal_processor.diagnose_kinematics(raw_signal, simulator.rpm, kinematics, ndt)
    iso = signal_processor.evaluate_iso_zone(ndt["rms"])
    
    if simulator.is_broken or diag["code"] != "SYS-NOMINAL":
        return {
            "status": "FAULT_DETECTED",
            "diagnosis": diag,
            "iso_zone": iso,
            "ndt_metrics": ndt,
            "kinematics": kinematics
        }
    return {
        "status": "CLEAN",
        "diagnosis": diag,
        "iso_zone": iso,
        "ndt_metrics": ndt,
        "recommendation": "Maintain online condition monitoring schedule."
    }

@app.get("/api/cmms-work-order")
def generate_work_order():
    """Generates an exportable CMMS / SAP PM maintenance work order payload."""
    raw_signal = simulator.generate_packet()
    ndt = signal_processor.compute_ndt_metrics(raw_signal)
    kinematics = simulator.get_kinematic_frequencies()
    diag = signal_processor.diagnose_kinematics(raw_signal, simulator.rpm, kinematics, ndt)
    iso = signal_processor.evaluate_iso_zone(ndt["rms"])
    score = ai_processor.analyze(raw_signal, ndt)
    prog = prognostics_engine.update(ndt["rms"], ndt["kurtosis"], score, simulator.is_broken)
    
    return {
        "work_order_id": f"WO-{int(time.time())}",
        "asset_id": "PUMP-MOT-4401B",
        "asset_description": "Boiler Feedwater Centrifugal Pump 45kW",
        "timestamp": time.strftime("%Y-%m-%d %H:%M:%S UTC", time.gmtime()),
        "iso_severity": iso,
        "diagnostic_summary": diag,
        "ndt_telemetry": ndt,
        "prognostics": prog,
        "technician_instructions": [
            "Lockout/Tagout (LOTO) primary 480V VFD breaker.",
            "Verify dynamic alignment using dual-laser alignment tool.",
            f"Inspect {diag.get('component', 'Assembly')} for thermal discoloration and raceway spalling.",
            "Replenish with synthetic polyurea grease (NLGI Grade 2) to manufacturer torque specification.",
            "Retest vibration baseline post-reassembly against ISO 10816 Zone A limits."
        ]
    }

@app.post("/api/auto-heal")
async def auto_heal(background_tasks: BackgroundTasks):
    """Trigger autonomous stabilization control loop."""
    if simulator.is_auto_healing:
        return {"status": "already_running", "message": "Autonomous stabilization already active."}
    
    background_tasks.add_task(simulator.auto_heal)
    return {"status": "started", "message": "VFD harmonic avoidance & stabilization initiated."}


# --- High-Frequency Telemetry WebSocket ---

@app.websocket("/ws/live")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    print("[WS] Telemetry client connected.")
    try:
        while True:
            # 1. Physics frame generation (512 points @ 10kHz)
            raw_wave = simulator.generate_packet()
            
            # 2. Digital Signal Processing & NDT Metrics
            ndt = signal_processor.compute_ndt_metrics(raw_wave)
            fft_spectrum = signal_processor.compute_fft_spectrum(raw_wave, max_freq=1000.0)
            iso_zone = signal_processor.evaluate_iso_zone(ndt["rms"])
            kinematics = simulator.get_kinematic_frequencies()
            
            # 3. AI Deep Spectral Autoencoder Inference
            anomaly_score = ai_processor.analyze(raw_wave, ndt)
            
            # 4. Prognostics & RUL Tracking
            prognostics = prognostics_engine.update(
                rms=ndt["rms"],
                kurtosis=ndt["kurtosis"],
                anomaly_score=anomaly_score,
                is_broken=simulator.is_broken
            )
            
            # 5. Status determination
            is_critical = (
                simulator.is_broken or 
                iso_zone["zone"] in ["C", "D"] or 
                anomaly_score > 0.8
            )
            status_label = "CRITICAL FAILURE" if is_critical else "SYSTEM OPTIMAL"
            
            # 6. Downsample raw waveform for smooth 60fps frontend oscilloscope display
            # 512 points downsampled to 128 points
            downsample_step = 4
            display_wave = raw_wave[::downsample_step].tolist()
            
            payload = {
                "waveform": display_wave,
                "fft_spectrum": fft_spectrum,
                "kinematic_markers": kinematics,
                "ndt_metrics": ndt,
                "iso_zone": iso_zone,
                "prognostics": prognostics,
                "anomaly_score": anomaly_score,
                "status": status_label,
                "timestamp": time.time(),
                "rpm": int(simulator.rpm),
                "fault_mode": simulator.fault_mode,
                "vibration_factor": round(float(simulator.vibration_factor), 3),
                "is_healing": simulator.is_auto_healing
            }
            
            await websocket.send_json(payload)
            await asyncio.sleep(0.05) # ~20 Hz streaming
            
    except WebSocketDisconnect:
        print("[WS] Telemetry client disconnected.")
    except Exception as e:
        print(f"[WS] WebSocket error: {e}")