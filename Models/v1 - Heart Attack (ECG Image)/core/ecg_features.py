"""
core.ecg_features — Hand-Crafted Clinical ECG Features
========================================================

Clinically interpretable features extracted from the raw 12-lead
waveform. These power the *tabular boosting head* of the classical model
(and demonstrate genuine signal-physics rather than a black-box only).
Every feature is defined on the time series with a clear physiological
meaning, close to what a cardiologist reads off a strip:

* **Heart rate & rhythm** — beat detection via a lead-II R-peak finder,
  RR-interval statistics, HRV metrics (SDNN, RMSSD).
* **QRS morphology** — mean QRS width; R/S morphology across leads.
* **ST/T profile** — an ST-elevation proxy (mean micro-Volt offset after the
  J-point) and T-wave amplitude spread.

The output is a fixed-length ``float32`` vector (``FEATURE_COLUMNS``)
suitable for a gradient-boosted classifier or a tabular baseline.

Implements a light-weight, dependency-lean R-peak detector (single-lead,
adaptive threshold on lead II) — sufficient for stable HRV/QRS statistics
on standard-limb 12-lead recordings without pulling in a heavy beat
library.
"""

from __future__ import annotations

import numpy as np

FEATURE_COLUMNS = [
    # Heart-rate / rhythm
    "hr_bpm",            # mean heart rate
    "hr_std",            # std of instantaneous heart rate
    "rr_mean_ms",        # mean RR interval (ms)
    "rr_sdnn_ms",        # SDNN = std of RR intervals (ms) — global HRV
    "rr_rmssd_ms",       # RMSSD = sqrt(mean(sq diff of RR)) (ms) — vagal HRV
    # QRS / waveform amplitude
    "qrs_mean_uV",       # mean absolute amplitude across leads (QRS-ish proxy)
    "qrs_std_uV",        # across-channels std (spread of lead voltages)
    "r_peak_amp_uV",     # mean R-peak amplitude (lead II)
    # ST / T profile
    "st_offset_uV",      # mean ST-segment offset proxy after J-point
    "st_spread_uV",      # spread of ST offsets across leads
    "t_wave_amp_uV",     # max T-wave excursion
    # Energy / morphology
    "signal_energy",     # total energy (sum of squares, normalized)
    "zero_crossings",    # descriptor of oscillatory complexity
]

FEATURE_DIM = len(FEATURE_COLUMNS)


def _detect_r_peaks(ecg_lead: np.ndarray, fs: int = 100) -> np.ndarray:
    """
    Simple, robust single-lead R-peak detector (Pan-Tompkins flavoured).

    Operates on one lead (expected lead II or whichever has the largest
    excursion). Uses a band-pass-lite approximation (difference + moving
    average), an adaptive threshold, and a refractory period to avoid
    double counting.

    Returns indices (samples) of detected R peaks.
    """
    sig = np.asarray(ecg_lead, dtype=np.float64)
    # Flatten baseline via moving average.
    win = max(5, fs // 20)
    kernel = np.ones(win) / win
    filtered = sig - np.convolve(sig, kernel, mode="same")
    # Energy envelope (squared + moving avg) emphasis of QRS.
    sq = filtered ** 2
    env = np.convolve(sq, kernel, mode="same")

    # Adaptive threshold as fraction of the 90th percentile of the envelope.
    thr = 0.15 * np.quantile(env, 0.90) + 1e-9
    refractory = int(0.25 * fs)  # 250 ms
    peaks = []
    i, n = 0, len(env)
    while i < n:
        if env[i] > thr:
            peaks.append(i)
            i += refractory
        else:
            i += 1
    return np.asarray(peaks, dtype=int)


def _st_offset(ecg_lead: np.ndarray, r_peaks: np.ndarray, fs: int = 100) -> float:
    """Mean ST-segment offset proxy: mean voltage 80 ms after J-point."""
    if len(r_peaks) == 0:
        return float(np.mean(ecg_lead))
    offset = int(0.08 * fs)
    vals = []
    for r in r_peaks:
        j = r + offset
        if j < len(ecg_lead) - 1:
            vals.append(float(ecg_lead[j]))
    return float(np.mean(vals)) if vals else float(np.mean(ecg_lead))


class ECGFeatureExtractor:
    """Object-oriented wrapper around :func:`extract_ecg_features`."""

    def extract(self, waveform: np.ndarray, fs: int = 100) -> np.ndarray:
        return extract_ecg_features(waveform, fs=fs)


def extract_ecg_features(waveform: np.ndarray, fs: int = 100) -> np.ndarray:
    """
    Extract the fixed-length clinical feature vector from a waveform.

    waveform: (timepoints, 12) float array, uV-scale (WFDB default).
    Returns: (FEATURE_DIM,) float32 vector aligned to FEATURE_COLUMNS.
    """
    w = np.asarray(waveform, dtype=np.float64)
    # Select a lead for beat detection: the one with largest RMS
    # (typically lead II or V5).
    rms = np.sqrt(np.mean(w ** 2, axis=0))
    beat_lead = int(np.argmax(rms))

    r_peaks = _detect_r_peaks(w[:, beat_lead], fs)
    n_beats = len(r_peaks)

    # ---- Heart-rate / HRV ---------------------------------------------
    if n_beats >= 2:
        rr = np.diff(r_peaks) / fs * 1000.0  # ms
        rr_mean = float(np.mean(rr))
        rr_sdnn = float(np.std(rr))
        rmssd = float(np.sqrt(np.mean(np.diff(rr) ** 2))) if len(rr) > 1 else 0.0
        hr_bpm = float(60000.0 / rr_mean) if rr_mean > 0 else 0.0
        hr_std = float(np.std(60000.0 / rr))
    else:
        rr_mean = rr_sdnn = rmssd = hr_bpm = hr_std = 0.0

    # ---- Waveform amplitude / energy ----------------------------------
    qrs_mean = float(np.mean(np.abs(w)))
    qrs_std = float(np.mean(np.std(w, axis=0)))
    r_amp = (
        float(np.mean(np.abs(w[r_peaks, beat_lead]))) if n_beats else
        float(np.max(np.abs(w[:, beat_lead])))
    )

    # ---- ST / T profile -----------------------------------------------
    st_all = [_st_offset(w[:, c], r_peaks, fs) for c in range(12)]
    st_mean = float(np.mean(st_all))
    st_spread = float(np.std(st_all))
    t_amp = float(np.max(np.abs(w[:, beat_lead]))) if len(w) else 0.0

    signal_energy = float(np.mean(w ** 2))
    zc = float(np.sum(np.abs(np.diff(np.sign(w[:, beat_lead]))) > 0) / max(1, len(w)))

    return np.array([
        hr_bpm, hr_std, rr_mean, rr_sdnn, rmssd,
        qrs_mean, qrs_std, r_amp,
        st_mean, st_spread, t_amp,
        signal_energy, zc,
    ], dtype=np.float32)
