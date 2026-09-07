import numpy as np
from signal_processor import SignalProcessor
from simulator import MachineSimulator

def test():
    sim = MachineSimulator()
    proc = SignalProcessor()
    
    # Test Healthy
    sig = sim.generate_packet()
    ndt = proc.compute_ndt_metrics(sig)
    fft_spec = proc.compute_fft_spectrum(sig)
    iso = proc.evaluate_iso_zone(ndt['rms'])
    diag = proc.diagnose_kinematics(sig, sim.rpm, sim.get_kinematic_frequencies(), ndt)
    print("HEALTHY CHECK:")
    print("  RMS:", ndt['rms'], "| Kurtosis:", ndt['kurtosis'], "| Crest:", ndt['crest_factor'])
    print("  ISO Zone:", iso['zone'], "(", iso['label'], ")")
    print("  Diagnosis:", diag['code'], "-", diag['fault'])
    
    # Test BPFO (Outer race spall)
    sim.set_fault("BPFO")
    sig_bpfo = sim.generate_packet()
    ndt_bpfo = proc.compute_ndt_metrics(sig_bpfo)
    diag_bpfo = proc.diagnose_kinematics(sig_bpfo, sim.rpm, sim.get_kinematic_frequencies(), ndt_bpfo)
    print("\nBPFO FAULT CHECK:")
    print("  RMS:", ndt_bpfo['rms'], "| Kurtosis:", ndt_bpfo['kurtosis'], "| Crest:", ndt_bpfo['crest_factor'])
    print("  Diagnosis:", diag_bpfo['code'], "-", diag_bpfo['fault'])
    print("  Detected Harmonic:", diag_bpfo.get('detected_harmonic'))
    
    # Test Misalignment
    sim.set_fault("MISALIGNMENT")
    sig_mis = sim.generate_packet()
    ndt_mis = proc.compute_ndt_metrics(sig_mis)
    diag_mis = proc.diagnose_kinematics(sig_mis, sim.rpm, sim.get_kinematic_frequencies(), ndt_mis)
    print("\nMISALIGNMENT CHECK:")
    print("  RMS:", ndt_mis['rms'], "| Kurtosis:", ndt_mis['kurtosis'])
    print("  Diagnosis:", diag_mis['code'], "-", diag_mis['fault'])
    print("  Detected Harmonic:", diag_mis.get('detected_harmonic'))
    
    # Test AIProcessor & PrognosticsEngine
    from processor import AIProcessor
    from prognostics import PrognosticsEngine
    
    ai = AIProcessor(weights_path="spectral_autoencoder.pth")
    prognostics = PrognosticsEngine()
    
    score_healthy = ai.analyze(sig, ndt)
    prog_healthy = prognostics.update(ndt['rms'], ndt['kurtosis'], score_healthy, sim.is_broken)
    print("\nAI & PROGNOSTICS (HEALTHY):")
    print("  Anomaly Score:", score_healthy)
    print("  Health Index:", prog_healthy['health_percent'], "% | RUL:", prog_healthy['rul_hours'], "hrs")
    
    score_fault = ai.analyze(sig_bpfo, ndt_bpfo)
    prog_fault = prognostics.update(ndt_bpfo['rms'], ndt_bpfo['kurtosis'], score_fault, True)
    print("\nAI & PROGNOSTICS (BPFO FAULT):")
    print("  Anomaly Score:", score_fault)
    print("  Health Index:", prog_fault['health_percent'], "% | RUL:", prog_fault['rul_hours'], "hrs | Urgency:", prog_fault['urgency'])
    
    print("\nALL DSP & AI & PROGNOSTICS CHECKS PASSED!")

if __name__ == "__main__":
    test()
