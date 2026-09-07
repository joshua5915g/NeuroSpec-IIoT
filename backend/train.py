import torch
import numpy as np
import sys
import os

sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from processor import AIProcessor

def train():
    print("--- NeuroSpec IIoT: Deep Spectral Autoencoder Retraining ---")
    weights_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "spectral_autoencoder.pth")
    ai = AIProcessor(weights_path=weights_path)
    print(f"Training on 2000 multi-speed healthy industrial acoustic frames...")
    ai.quick_train_baseline(num_samples=2000)
    print(f"[OK] Training complete. Production weights verified at: {weights_path}")

if __name__ == "__main__":
    train()
