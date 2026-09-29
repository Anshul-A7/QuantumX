"""QuantumX Clinical ECG Preprocessing & Waveform Extraction Module
Overcomes the flat RGB raster trap by attenuating pink/red background paper grid lines
and enhancing black-ink electrical conduction tracings (QRS spikes and ST segments).
"""

import numpy as np
from PIL import Image, ImageEnhance, ImageOps

class ClinicalECGPreprocessor:
    """Clinical preprocessor that separates foreground cardiac ink from background grid."""
    def __init__(self, target_size=(224, 224), grid_suppression=True):
        self.target_size = target_size
        self.grid_suppression = grid_suppression

    def __call__(self, img):
        if img.mode != 'RGB':
            img = img.convert('RGB')
            
        img = img.resize(self.target_size, Image.Resampling.BILINEAR)
        
        if self.grid_suppression:
            # Convert to numpy for channel arithmetic
            arr = np.array(img, dtype=np.float32)
            R, G, B = arr[:, :, 0], arr[:, :, 1], arr[:, :, 2]
            
            # Pink/red grid lines have significantly higher Red than Green/Blue: (R - G) > threshold
            # Black ink has low intensity across all three channels: (R + G + B) / 3 is small
            intensity = (R + G + B) / 3.0
            red_excess = np.clip(R - (G + B) / 2.0, 0, 255)
            
            # Suppress pink grid by pushing red-dominant grid pixels towards clean white (255)
            grid_mask = (red_excess > 20) & (intensity > 120)
            arr[grid_mask] = 255.0
            
            # Enhance black ink contrast
            ink_mask = intensity < 100
            arr[ink_mask] = np.clip(arr[ink_mask] * 0.7, 0, 255)
            
            img = Image.fromarray(np.uint8(arr))
            
        # Boost local contrast so high-frequency spikes are sharp
        enhancer = ImageEnhance.Contrast(img)
        img = enhancer.enhance(1.25)
        
        return img
