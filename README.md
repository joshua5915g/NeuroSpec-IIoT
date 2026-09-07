# NeuroSpec IIoT: Enterprise Predictive Maintenance & Acoustic Anomaly Detection

## Overview
**NeuroSpec IIoT (EchoGuard)** is an industrial-grade Condition Monitoring & Predictive Maintenance (PdM) platform engineered according to international ISO 10816-3 standards and rotating machinery vibration analysis principles.

The system continuously samples high-frequency acoustic and vibrational signatures (10 kHz sampling rate), performs real-time windowed Fast Fourier Transforms (FFT) and Non-Destructive Testing (NDT) statistical moment extraction, runs deep spectral autoencoder inference, matches spectral peaks against exact kinematic bearing defect equations, and computes Remaining Useful Life (RUL) prognostics.

---

## Technical Highlights & Upgrades

### 1. Mechanical Kinematics & Bearing Fault Equations
Models a standard industrial rolling-element bearing (**SKF 6205**):
* **Pitch Diameter ($D_p$):** 39.04 mm
* **Ball Diameter ($d$):** 7.94 mm
* **Rolling Elements ($N$):** 9
* **Contact Angle ($\alpha$):** 0°

Real-time defect frequencies calculated as a function of rotational frequency ($f_r = \text{RPM} / 60$):
* **BPFO** (Ball Pass Frequency Outer Race): $\frac{N f_r}{2} \left(1 - \frac{d}{D_p}\cos\alpha\right) \approx 3.585 \cdot f_r$ ($179.2\text{ Hz}$ @ 3000 RPM)
* **BPFI** (Ball Pass Frequency Inner Race): $\frac{N f_r}{2} \left(1 + \frac{d}{D_p}\cos\alpha\right) \approx 5.415 \cdot f_r$ ($270.8\text{ Hz}$ @ 3000 RPM)
* **BSF** (Ball Spin Frequency): $\frac{D_p f_r}{2 d} \left(1 - \left(\frac{d}{D_p}\cos\alpha\right)^2\right) \approx 2.356 \cdot f_r$ ($117.8\text{ Hz}$ @ 3000 RPM)
* **1X / 2X Harmonics**: Rotational unbalance ($1X$) and coupling misalignment ($2X$).

### 2. Digital Signal Processing (DSP) & NDT Health Indicators
* **Hanning-Windowed Zero-Padded FFT**: Single-sided power spectrum up to 1000 Hz.
* **ISO 10816-3 Vibration Severity Zones** (Medium Industrial Machines, Rigid Foundation):
  * **Zone A** ($< 1.4\text{ mm/s}$ RMS): Good / Optimal
  * **Zone B** ($1.4 - 2.8\text{ mm/s}$ RMS): Acceptable / Unrestricted Run
  * **Zone C** ($2.8 - 4.5\text{ mm/s}$ RMS): Unsatisfactory / Maintenance Required
  * **Zone D** ($> 4.5\text{ mm/s}$ RMS): Unacceptable / Critical Shutdown
* **NDT Indicators**: Pearson Kurtosis (Gaussian baseline = 3.0; micro-spalls > 4.0), Crest Factor, Peak-to-Peak, Skewness, Shape Factor.

### 3. Deep Spectral Autoencoder
* **Input Vector (38 dimensions)**: 32 log-spaced spectral band energies (20 Hz - 4000 Hz) + 6 normalized NDT indicators.
* **Architecture**: Linear(38 $\to$ 24) $\to$ BatchNorm $\to$ LeakyReLU $\to$ Linear(24 $\to$ 8) bottleneck $\to$ Decoder.
* **Reconstruction Loss (MSE)**: Highly sensitive to acoustic spectral shifts (healthy baseline $\approx 0.15$; fault condition $\approx 10 - 20$).

### 4. Prognostics & RUL (Remaining Useful Life)
* Continuous running **Health Index ($HI$)** tracking based on ISO severity and anomaly score.
* Accelerated degradation trajectory projection predicting remaining operating hours until Zone D threshold breach.

### 5. Dual-View Oscilloscope & Scientific Spectrogram UI
* **Upper Oscilloscope**: Real-time acoustic time-domain waveform with 95% confidence bounds.
* **Lower Spectrum**: Real-time Fast Fourier Transform (FFT) Power Spectrum with interactive color-coded **Kinematic Defect Markers** (1X, 2X, BPFO, BPFI, BSF).
* **Scientific STFT Waterfall Spectrogram**: Real-time time-frequency waterfall using Turbo colormap.
* **Kinematic Fault Matrix**: Inject Outer Race Spall, Inner Race Flaking, Rotor Unbalance, Misalignment, or Cavitation at the click of a button.
* **CMMS Work Order Export**: Auto-generates SAP PM / IBM Maximo compliant dispatch sheets.

---

## Setup & Running Instructions

### Backend
```bash
cd echoguard/backend
# Activate virtual environment
.\venv\Scripts\activate   # Windows
# source venv/bin/activate # Linux/Mac

# Run automated verification suite
python test_dsp.py

# Launch FastAPI ASGI Server
uvicorn main:app --reload --port 8000
```
Backend API available at: `http://localhost:8000`

### Frontend
```bash
cd echoguard/frontend
npm install
npm run dev
```
Dashboard available at: `http://localhost:5173`
