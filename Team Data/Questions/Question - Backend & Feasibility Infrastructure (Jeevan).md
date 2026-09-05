# Judge Defense Questions: Backend & Slide 5 (Feasibility)

### 👤 Profile & Assignment
* **Team Member:** Jeevan
* **Technical Role:** `R2-BACKEND` (FastAPI, Hardware Execution Pipelines, Compute Infrastructure & Latency)
* **Assigned Presentation Slide:** **Slide 5: Feasibility**
* **Slide Source Image:** `Slide 5 - Feasibility.png` (*from `Team Data/No Github Push/PPT/Images/`*)

---

## ⚙️ Part 1: Backend Architecture & API Questions (Technical Pipeline)

1. What backend framework and programming language did you use to build the high-throughput inference API?
2. Why did you choose FastAPI over traditional WSGI frameworks like Flask or Django for this platform?
3. How does FastAPI use Pydantic v2 schemas to validate incoming patient biomedical data in under 2ms?
4. What happens on the backend if a request contains missing fields, NaN floats, or out-of-range clinical numbers?
5. How does the backend communicate with the Next.js frontend in real time during a diagnostic run?
6. How do you handle long-running physical quantum jobs without blocking or freezing the web server?
7. How does the backend use asynchronous task workers (Celery/Redis or BackgroundTasks) to process concurrent patient requests?
8. How do you securely store and rotate IBM Quantum API tokens and backend credentials on the server?
9. What happens if the IBM Quantum cloud service experiences network timeouts or rate limits (HTTP 429)?
10. How does the backend implement an automated circuit breaker to smoothly fall back to the local simulator?
11. What automated testing (e.g., PyTest and mock QPU responses) did you perform to verify API reliability?
12. What is the average response time for an end-to-end prediction when running locally on PennyLane statevector?
13. How does the backend maintain low latency when multiple hospital clinics submit requests simultaneously?
14. How are model probabilities, risk levels, and explainability attributions packaged into clean JSON responses?
15. What security measures did you implement to protect the API endpoints against unauthorized access?

---

## 🎯 Part 2: Slide 5 Image Defense (Feasibility: Hardware, Training, Deployment, Noise)

16. What is the 4-part feasibility structure shown in `Slide 5 - Feasibility.png` (Hardware, Training, Deployment, Noise)?
17. Under **Hardware Feasibility**, how does QuantumX run on IBM Quantum Eagle (127 qubits) and Heron (133 qubits) processors?
18. How do Qiskit Runtime Primitives (Sampler V2 and Estimator V2) manage physical quantum execution?
19. Why does our 8-qubit variational circuit execute today with **zero fault-tolerance requirement** on NISQ hardware?
20. Under **Training Feasibility**, what is the RealAmplitudes variational ansatz ($R_Y, R_Z$) shown in the circuit diagram?
21. Why does having exactly 48 trainable parameters ($\theta$) with an 11:1 sample ratio eliminate barren plateaus and overfitting?
22. Under **Deployment Feasibility**, what are the comparative speeds shown for physical QPU (<1.18s) vs. simulator fallback (42ms)?
23. How does the FastAPI asynchronous architecture support a throughput of **500+ inferences per minute** over time?
24. Under **Noise Feasibility**, what physical noise factors affect superconducting qubits in dilution refrigerators?
25. How did you test noise resilience, and why does prediction deviation stay under `<1.2%` under thermal noise?
26. What digital error mitigation techniques (Zero-Noise Extrapolation and M3 readout mitigation) are applied on physical QPUs?
27. What is the Huang geometric difference filter ($s_K$) shown in the decision flow on Slide 5?
28. How does the Huang filter pre-screen whether a patient sample has genuine quantum advantage before dispatching to hardware?
29. What happens if a sample does not meet the $s_K$ threshold (does it route to the fast classical fallback path)?
30. Can you summarize why QuantumX is technically, computationally, and operationally feasible today in 3 simple sentences?
