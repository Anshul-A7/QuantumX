# Judge Defense Questions: Backend & Slide 5 (Viability)

### 👤 Profile & Assignment
* **Team Member:** Prem
* **Technical Role:** `R2-BACKEND` (FastAPI, PostgreSQL Database, Healthcare Data Protocols, Security & Economics)
* **Assigned Presentation Slide:** **Slide 5: Viability**
* **Slide Source Image:** `Slide 5 - Viability.png` (*from `Team Data/No Github Push/PPT/Images/`*)

---

## 🗄️ Part 1: Database, Security & Integration Questions (Technical Pipeline)

1. What database system did you use to manage patient demographic records, diagnostic runs, and model versions?
2. Why did you choose PostgreSQL with SQLModel/SQLAlchemy over NoSQL databases for this healthcare platform?
3. How is the database schema designed to strictly isolate Personally Identifiable Information (PII) from diagnostic vectors?
4. How are patient records and test histories protected against accidental deletion or database corruption?
5. What encryption standards (such as AES-256 at rest and TLS 1.3 in transit) protect patient health data?
6. How do you implement Role-Based Access Control (RBAC) to separate permissions between Doctors, Pathologists, and Admins?
7. How does the database record model predictions, calibrated confidence scores, and model version commit hashes?
8. How are verified IBM Quantum job receipts, execution timestamps, and OpenQASM circuit strings stored for clinical auditing?
9. How does a clinician retrieve and compare a patient's historical test results over time via the API?
10. How does the backend prevent SQL injection, cross-site request forgery, and unauthorized data queries?
11. How do you handle database connection pooling (`asyncpg`) to ensure zero slowdowns during peak clinic hours?
12. How are system audit logs and diagnostic traces recorded without exposing sensitive patient details in server logs?
13. What automated backup and point-in-time recovery (PITR) mechanisms are configured for PostgreSQL?
14. How does the backend support exporting structured patient diagnostic records in clinical JSON and PDF formats?
15. How does the API authenticate requests using JWT tokens and secure HTTP-only cookies?

---

## 🎯 Part 2: Slide 5 Image Defense (Viability: Deployment Path, Economics, Clinical Risks & Mitigations)

16. What is the 4-part viability framework presented in `Slide 5 - Viability.png` (Deployment Path, Economic, Clinical, Risks)?
17. Under **Viable Research & Deployment Path**, how does QuantumX progress from external datasets to classical baselines, simulator validation, and IBM QPU validation?
18. What three disease domains are shown in the deployment path table (Breast Cancer, Heart Diseases, and Lung Disorders)?
19. Under **Operational & Economic Viability**, what is the resource and cost profile that makes the platform viable for pilot clinic research?
20. Why does QuantumX have a "low hardware need and high deployment fit" for standard diagnostic laboratories?
21. Under **Clinical & Generalization Viability**, what key evaluation metrics are tracked (PR-AUC, ROC-AUC, Calibration, Multi-center validation)?
22. Why is clinical viability described as "promising, but conditional on multi-center external and prospective validation"?
23. Under **Key Risks & Mitigation Strategies**, what is the risk of **Overfitting / Data Imbalance**, and what is the mitigation (Stratified CV, SMOTE, Robust testing)?
24. What is the risk of **Quantum Optimization / Barren Plateaus**, and what is the mitigation (Shallow circuits, Coordinate depth, Parameter bounds)?
25. What is the risk of **QPU Access / Overhead**, and what is the mitigation (Simulator-first, Selective QPU validation, Efficient pre/post-processing)?
26. What is the risk of **Dataset Translation**, and what is the mitigation (Multi-dataset external cohorts and prospective validation)?
27. How does the "Simulator-first with selective QPU validation" strategy minimize expensive cloud quantum compute costs?
28. How does connecting via standard healthcare protocols (like HL7/FHIR and DICOM) ensure seamless hospital adoption?
29. Why does QuantumX offer zero learning curve for practicing doctors (translating quantum states into standard risk scores)?
30. Can you summarize why QuantumX has a viable path to clinical deployment in 3 simple sentences?
