import os
import ast
import numpy as np
import pandas as pd
import wfdb
import pywt

class PTBXLDataLoader:
    """
    PTB-XL 12-Lead ECG Data Ingestion, SCP Label Mapping & Wavelet Feature Extractor.
    Implements the official PhysioNet benchmark protocol (Strodthoff et al., IEEE JBHI 2021).
    """

    def __init__(self, data_dir: str, sampling_rate: int = 100):
        self.data_dir = data_dir
        self.sampling_rate = sampling_rate
        self.df_db = None
        self.df_scp = None
        self.diagnostic_classes = ['NORM', 'MI', 'STTC', 'CD', 'HYP']
        self._load_metadata()

    def _load_metadata(self):
        db_path = os.path.join(self.data_dir, 'ptbxl_database.csv')
        scp_path = os.path.join(self.data_dir, 'scp_statements.csv')
        
        if not os.path.exists(db_path) or not os.path.exists(scp_path):
            raise FileNotFoundError(f"Metadata files missing in {self.data_dir}. Run download script first.")

        # Load Database & parse SCP string dicts
        self.df_db = pd.read_csv(db_path, index_col='ecg_id')
        self.df_db['scp_codes'] = self.df_db['scp_codes'].apply(lambda x: ast.literal_eval(x) if isinstance(x, str) else x)
        
        # Load SCP Statement mapping
        self.df_scp = pd.read_csv(scp_path, index_col=0)
        self.df_scp = self.df_scp[self.df_scp.diagnostic == 1]

        # Map diagnostic superclasses
        self._map_superclasses()

    def _map_superclasses(self):
        """Map granular SCP-ECG statements to 5 diagnostic superclasses (NORM, MI, STTC, CD, HYP)."""
        def aggregate_diagnostic(scp_dict):
            classes = set()
            for key in scp_dict.keys():
                if key in self.df_scp.index:
                    diag_class = self.df_scp.loc[key, 'diagnostic_class']
                    if pd.notna(diag_class):
                        classes.add(diag_class)
            return list(classes)

        self.df_db['diagnostic_superclass'] = self.df_db['scp_codes'].apply(aggregate_diagnostic)
        
        # Binary one-hot encoding for the 5 superclasses
        for c in self.diagnostic_classes:
            self.df_db[c] = self.df_db['diagnostic_superclass'].apply(lambda x: 1 if c in x else 0)

    def get_split(self, fold_test: int = 10, fold_val: int = 9):
        """Returns standard train, val, and test dataframes."""
        test_df = self.df_db[self.df_db.strat_fold == fold_test]
        val_df = self.df_db[self.df_db.strat_fold == fold_val]
        train_df = self.df_db[(self.df_db.strat_fold != fold_test) & (self.df_db.strat_fold != fold_val)]
        return train_df, val_df, test_df

    def load_raw_waveform(self, ecg_id: int):
        """Load 12-lead raw signal (timepoints x 12 leads)."""
        row = self.df_db.loc[ecg_id]
        rel_path = row['filename_lr'] if self.sampling_rate == 100 else row['filename_hr']
        record_path = os.path.join(self.data_dir, rel_path)
        data, meta = wfdb.rdsamp(record_path)
        return data, meta

    def compute_cwt_spectrogram(self, signal_12lead: np.ndarray, num_scales: int = 32):
        """
        Transforms 12-Lead ECG signal into Morlet Continuous Wavelet Transform (CWT) Scalograms.
        Output Shape: (12, num_scales, timepoints)
        """
        scales = np.arange(1, num_scales + 1)
        scalograms = []
        for lead_idx in range(12):
            coefs, _ = pywt.cwt(signal_12lead[:, lead_idx], scales, 'morl')
            scalograms.append(coefs)
        return np.array(scalograms, dtype=np.float32)  # (12, scales, timepoints)
