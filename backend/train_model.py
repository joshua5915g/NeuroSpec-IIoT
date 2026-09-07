import torch
import torch.nn as nn
import torch.optim as optim
import numpy as np
import sys
import os

# Ensure imports work
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from simulator import MachineSimulator
from processor import Autoencoder

def train():
    print("--- 🧠 NeuroSpec AI Training Sequence ---")
    
    # 1. Initialize Components
    sim = MachineSimulator()
    model = Autoencoder(input_dim=50)
    
    # 2. Data Generation
    print("[1/4] Generating 5,000 Healthy Samples...")
    sim.is_broken = False # FORCE HEALTHY
    
    training_data = []
    for _ in range(5000):
        # generate_packet returns list of floats (the waveform)
        wave = sim.generate_packet() 
        training_data.append(wave)
        
    # Convert to Tensor
    inputs = torch.tensor(training_data, dtype=torch.float32)
    
    # 3. Training Setup
    criterion = nn.MSELoss()
    optimizer = optim.Adam(model.parameters(), lr=0.01)
    epochs = 20
    batch_size = 64
    
    # 4. Training Loop
    print(f"[2/4] Training Model ({epochs} Epochs)...")
    model.train()
    
    for epoch in range(epochs):
        permutation = torch.randperm(inputs.size()[0])
        epoch_loss = 0
        
        for i in range(0, inputs.size()[0], batch_size):
            indices = permutation[i:i+batch_size]
            batch_x = inputs[indices]
            
            optimizer.zero_grad()
            outputs = model(batch_x)
            loss = criterion(outputs, batch_x)
            loss.backward()
            optimizer.step()
            
            epoch_loss += loss.item()
            
        print(f"      Epoch {epoch+1}: Loss = {epoch_loss / (len(inputs)/batch_size):.6f}")

    # 5. Validation Check
    print("[3/4] Validating Model...")
    model.eval()
    
    # Test Healthy
    healthy_wave = torch.tensor([sim.generate_packet()], dtype=torch.float32)
    h_score = nn.MSELoss()(model(healthy_wave), healthy_wave).item()
    
    # Test Broken
    sim.is_broken = True
    broken_wave = torch.tensor([sim.generate_packet()], dtype=torch.float32)
    b_score = nn.MSELoss()(model(broken_wave), broken_wave).item()
    
    print(f"      Healthy Reconstruction Error: {h_score:.6f}")
    print(f"      Broken Reconstruction Error:  {b_score:.6f}")
    
    if b_score > h_score * 5:
        print("      ✅ PASS: Anomaly clearly detected.")
    else:
        print("      ⚠️ WARNING: Distinction is weak.")

    # 6. Save
    print("[4/4] Saving Weights...")
    torch.save(model.state_dict(), "neurospec_model.pth")
    print("      DONE. Saved to backend/neurospec_model.pth")

if __name__ == "__main__":
    train()
