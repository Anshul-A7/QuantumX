# Judge Defense Questions: Machine Learning & Slide 2 (Problems & Proposed Solution)

### 👤 Profile & Assignment
* **Team Member:** Kamran
* **Technical Role:** `R3-ML` (Classical Machine Learning Pipeline, Preprocessing, Baseline Models & SHAP)
* **Assigned Presentation Slide:** **Slide 2: Problems & Proposed Solution**
* **Slide Source Images:** `Slide 2 - Problems.png` & `Slide 2 - Proposed Solutions.png` (*from `Team Data/No Github Push/PPT/Images/`*)

---

## 🔬 Part 1: Machine Learning & Preprocessing Questions (Technical Pipeline)

1. What dataset did you use for breast cancer benchmarking, and what is its sample size ($N=569$) and feature count (30 features)?
2. What are the three feature groups in the Wisconsin Diagnostic Breast Cancer dataset (mean, standard error, and "worst" values of nuclear geometry)?
3. Why did you use 1st–99th percentile Winsorization on training folds rather than deleting extreme outlier values?
4. How does deleting outlier rows in a cancer biopsy dataset distort the model's ability to identify severe malignant tumors?
5. How did you normalize and standardize features without allowing test split statistics to leak into training splits?
6. How did you structure your Repeated Stratified 5-Fold Cross-Validation across 10 random seeds (50 folds total) to guarantee zero data leakage?
7. What classical machine learning baseline models did you build (XGBoost, LightGBM, Random Forest, SVM-RBF, and MLP)?
8. How did you use Optuna Bayesian Optimization (100+ trials per fold) to tune the hyperparameters of classical baselines?
9. Why did you include a parameter-matched Multi-Layer Perceptron (MLP) as a direct neural baseline against QuantumX?
10. How does TreeSHAP compute Shapley values from cooperative game theory on classical models?
11. Which specific cytological features (e.g., concave points worst, perimeter worst, radius mean) emerged as top risk drivers?
12. What primary statistical metrics did you track across all 50 folds (Sensitivity/Recall, Specificity, F1-Score, and ROC-AUC)?
13. How did you handle class imbalance (62.7% Benign vs. 37.3% Malignant) across your stratified folds?
14. What is the Brier score, and why did you track calibration quality alongside raw classification accuracy?
15. How do you format and feed the processed tabular feature vectors into the non-linear autoencoder for compression?

---

## 🎯 Part 2: Slide 2 Image Defense (Problems & Proposed Solution)

16. What is the cellular morphology challenge shown in `Slide 2 - Problems.png` regarding Fine-Needle Aspiration (FNA) biopsies?
17. What do "subtle nuclear pleomorphism" and "indistinct chromatin clumping" mean, and why do they cause severe phenotypic similarity?
18. What is the "Euclidean Distance Trap" illustrated in the 3D feature space diagram on Slide 2?
19. Why do classical linear/RBF decision boundaries fail when non-linear 30-D clinical features form a tangled, inseparable knot?
20. Why do classical models produce a dangerous 15–20% false negative rate in early borderline cancer detection?
21. What is the "Overfitting Dilemma" on Slide 2 regarding deep classical neural networks on small clinical cohorts?
22. What is the clinical consequence of missed early cancers shown at the bottom of Slide 2 (delayed diagnosis leading to late-stage progression)?
23. How does the 8-qubit $ZZ$ feature map map classical features into a high-dimensional quantum Hilbert space ($\mathcal{H}_{256}$)?
24. How does quantum entanglement on the 8-qubit lattice capture non-linear feature interactions that classical Euclidean metrics miss?
25. How does the emerald green decision boundary in Hilbert space separate overlapping cells without adding thousands of weights?
26. How does quantum measurement convert the entangled quantum state back into classical observables for final classification?
27. What are the core pillars of the Proposed Solution listed in `Slide 2 - Proposed Solutions.png`?
28. How does QuantumX support end-to-end data ingestion, feature selection, hybrid training, explainability, and benchmarking?
29. How does the hybrid architecture ensure full compatibility with both fast quantum simulators and near-term physical QPUs?
30. How does QuantumX benchmark hybrid models against classical baselines across accuracy, sensitivity, efficiency, and generalization?
