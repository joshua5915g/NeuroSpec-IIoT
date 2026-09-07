import numpy as np
import torch
import torch.nn as nn
import os
from typing import Dict, Any, Tuple

class SpectralAutoencoder(nn.Module):
    """
    Deep Spectral & NDT Feature Autoencoder.
    Input Dimension: 38
      - 32 Log-spaced Spectral Energy Bands (0 to 4000 Hz)
      - 6 Statistical NDT Metrics (RMS, Kurtosis/10, Crest/10, Pk-Pk, Skewness, Shape/10)
    Bottleneck Latent Dimension: 8
    """
    def __init__(self, input_dim: int = 38, latent_dim: int = 8):
        super(SpectralAutoencoder, self).__init__()
        
        # Encoder
        self.encoder = nn.Sequential(
            nn.Linear(input_dim, 24),
            nn.BatchNorm1d(24),
            nn.LeakyReLU(0.2),
            nn.Linear(24, latent_dim),
            nn.LeakyReLU(0.2)
        )
        
        # Decoder
        self.decoder = nn.Sequential(
            nn.Linear(latent_dim, 24),
            nn.BatchNorm1d(24),
            nn.LeakyReLU(0.2),
            nn.Linear(24, input_dim),
            nn.Identity()
        )

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        latent = self.encoder(x)
        reconstruction = self.decoder(latent)
        return reconstruction


class AIProcessor:
    """
    Production-grade AI inference engine for acoustic anomaly detection.
    """
    def __init__(self, weights_path: str = "spectral_autoencoder.pth"):
        self.device = torch.device("cpu")
        self.model = SpectralAutoencoder(input_dim=38, latent_dim=8).to(self.device)
        self.weights_path = weights_path
        self.is_trained = False
        
        # Try loading weights, or auto-train baseline if not found
        if os.path.exists(self.weights_path):
            try:
                self.model.load_state_dict(torch.load(self.weights_path, map_location=self.device))
                self.model.eval()
                self.is_trained = True
                print("[OK] Spectral Autoencoder loaded successfully from", self.weights_path)
            except Exception as e:
                print("[WARN] Error loading weights:", e)
        
        if not self.is_trained:
            print("[INFO] Initializing and training Spectral Autoencoder baseline...")
            self.quick_train_baseline()

    def extract_features(self, signal: np.ndarray, sample_rate: int = 10000, ndt_metrics: Dict[str, float] = None) -> np.ndarray:
        """
        Extracts 38-dimensional feature vector from 512-point acoustic waveform.
        - 32 spectral band energies (0 - 4000 Hz)
        - 6 normalized NDT indicators
        """
        signal_clean = signal - np.mean(signal)
        n = len(signal_clean)
        
        # FFT power spectrum
        fft_vals = np.fft.rfft(signal_clean * np.hanning(n), n=1024)
        freqs = np.fft.rfftfreq(1024, d=1.0 / sample_rate)
        power_spec = np.abs(fft_vals) ** 2
        
        # 32 log-spaced frequency bands up to 4000 Hz
        band_edges = np.logspace(np.log10(20), np.log10(4000), 33)
        band_energies = np.zeros(32)
        
        for i in range(32):
            idx = np.where((freqs >= band_edges[i]) & (freqs < band_edges[i+1]))[0]
            if len(idx) > 0:
                band_energies[i] = np.mean(power_spec[idx])
            else:
                band_energies[i] = 1e-6
                
        # Log-transform spectral energies for numerical stability
        log_energies = np.log1p(band_energies * 100.0)
        
        # NDT metrics
        if ndt_metrics is None:
            rms = float(np.sqrt(np.mean(signal_clean ** 2)))
            kurt = 3.0
            crest = 2.0
            pk_pk = float(np.ptp(signal_clean))
            skew = 0.0
            shape = 1.2
        else:
            rms = ndt_metrics.get("rms", 0.3)
            kurt = ndt_metrics.get("kurtosis", 3.0)
            crest = ndt_metrics.get("crest_factor", 2.0)
            pk_pk = ndt_metrics.get("pk_pk", 1.0)
            skew = ndt_metrics.get("skewness", 0.0)
            shape = ndt_metrics.get("shape_factor", 1.2)
            
        ndt_vec = np.array([
            rms,
            kurt / 10.0,
            crest / 10.0,
            pk_pk / 2.0,
            skew,
            shape / 10.0
        ])
        
        feature_vector = np.concatenate([log_energies, ndt_vec])
        return feature_vector.astype(np.float32)

    def analyze(self, signal: np.ndarray, ndt_metrics: Dict[str, float] = None) -> float:
        """
        Inference: passes feature vector through Autoencoder and calculates MSE reconstruction error.
        Returns Anomaly Score in range [0.0, 1.0+].
        """
        features = self.extract_features(signal, ndt_metrics=ndt_metrics)
        tensor = torch.tensor(features, dtype=torch.float32).unsqueeze(0).to(self.device)
        
        self.model.eval()
        with torch.no_grad():
            reconstruction = self.model(tensor)
            # Weighted MSE loss
            loss = nn.MSELoss()(reconstruction, tensor)
            
        anomaly_score = float(loss.item())
        return round(anomaly_score, 4)

    def quick_train_baseline(self, num_samples: int = 1500):
        """
        Trains the autoencoder on synthetic healthy machine signatures.
        """
        from simulator import MachineSimulator
        sim = MachineSimulator()
        sim.set_fault("HEALTHY")
        
        dataset = []
        for _ in range(num_samples):
            # Vary RPM slightly around 3000 to generalize healthy baseline
            sim.rpm = 3000.0 + np.random.uniform(-150.0, 150.0)
            sig = sim.generate_packet()
            feat = self.extract_features(sig)
            dataset.append(feat)
            
        train_tensor = torch.tensor(np.array(dataset), dtype=torch.float32).to(self.device)
        
        optimizer = torch.optim.Adam(self.model.parameters(), lr=0.005, weight_decay=1e-5)
        criterion = nn.MSELoss()
        
        self.model.train()
        batch_size = 64
        epochs = 15
        
        for epoch in range(epochs):
            perm = torch.randperm(train_tensor.size(0))
            epoch_loss = 0.0
            batches = 0
            for i in range(0, train_tensor.size(0), batch_size):
                batch_x = train_tensor[perm[i:i+batch_size]]
                optimizer.zero_grad()
                out = self.model(batch_x)
                loss = criterion(out, batch_x)
                loss.backward()
                optimizer.step()
                epoch_loss += loss.item()
                batches += 1
                
        self.model.eval()
        self.is_trained = True
        torch.save(self.model.state_dict(), self.weights_path)
        print(f"[OK] Spectral Autoencoder trained & saved to {self.weights_path} (Final Loss: {epoch_loss/batches:.5f})")
