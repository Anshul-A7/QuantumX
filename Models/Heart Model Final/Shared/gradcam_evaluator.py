"""QuantumX Cohort-Wide Grad-CAM++ & Anatomical Explainability Evaluator
Implements Grad-CAM++ for 12-lead ECG convolutional backbones.
Quantifies Lead Waveform Energy Ratio (LWER) to evaluate whether model attention
focuses on clinical waveforms vs. spurious background borders and grid lines (Paper 2 protocol).
"""

import numpy as np
import torch
import torch.nn.functional as F
from PIL import Image

class GradCAMPlusPlus:
    """Grad-CAM++ implementation for CNN feature maps."""
    def __init__(self, model, target_layer):
        self.model = model
        self.target_layer = target_layer
        self.gradients = None
        self.activations = None
        
        # Register hooks
        self.target_layer.register_forward_hook(self._save_activations)
        self.target_layer.register_full_backward_hook(self._save_gradients)

    def _save_activations(self, module, input, output):
        self.activations = output.detach()

    def _save_gradients(self, module, grad_input, grad_output):
        self.gradients = grad_output[0].detach()

    def generate(self, input_tensor, class_idx=None):
        self.model.eval()
        logits = self.model(input_tensor)
        
        if class_idx is None:
            class_idx = logits.argmax(dim=-1).item()
            
        score = logits[0, class_idx]
        self.model.zero_grad()
        score.backward(retain_graph=True)
        
        # Gradients & activations: (1, C, H, W)
        grads = self.gradients[0]
        acts = self.activations[0]
        
        # Grad-CAM++ higher-order weights
        g2 = grads ** 2
        g3 = grads ** 3
        spatial_sum = acts.sum(dim=(1, 2), keepdim=True)
        denom = 2.0 * g2 + spatial_sum * g3
        denom = torch.where(denom != 0.0, denom, torch.ones_like(denom))
        alpha = g2 / denom
        
        weights = (alpha * F.relu(grads)).sum(dim=(1, 2), keepdim=True)
        cam = (weights * acts).sum(dim=0)
        cam = F.relu(cam)
        
        # Normalize to [0, 1]
        cam_min, cam_max = cam.min(), cam.max()
        if cam_max > cam_min:
            cam = (cam - cam_min) / (cam_max - cam_min)
        else:
            cam = torch.zeros_like(cam)
            
        return cam.cpu().numpy()

def compute_waveform_energy_ratio(cam_heatmap, margin_percent=0.10):
    """
    Computes Lead Waveform Energy Ratio (LWER):
    Ratio of heatmap activation inside the central active ECG waveform box
    compared to the outer borders and margins.
    Higher ratio = model focuses on true cardiac waveforms, not borders/labels.
    """
    H, W = cam_heatmap.shape
    top_m = int(H * margin_percent)
    bot_m = int(H * (1.0 - margin_percent))
    left_m = int(W * margin_percent)
    right_m = int(W * (1.0 - margin_percent))
    
    total_energy = np.sum(cam_heatmap) + 1e-8
    waveform_box_energy = np.sum(cam_heatmap[top_m:bot_m, left_m:right_m])
    
    return float(waveform_box_energy / total_energy)
