*FEASIBILITY SPEECH* 

Now I would like to explain the feasibility of our proposed solution, QuantumX.

Feasibility means whether our solution can actually be built and implemented with the available technology and resources.

Our feasibility is divided into four main areas:

 *First, Hardware Feasibility.* 
QuantumX can be developed using PennyLane and Qiskit simulators, so we do not always need real quantum hardware. For real execution, we can use IBM Quantum Eagle and Heron QPUs. Our core model uses an 8-qubit circuit, making the hardware requirement practical.

 *Second, Training Feasibility.* 
We use a hybrid quantum-classical approach, where quantum circuits work together with classical machine learning. Our 8-qubit VQC keeps the model compact, while classical models like XGBoost, SVM, Random Forest, and MLP provide strong baselines for comparison.

 *Third, Deployment Feasibility.* 
QuantumX is designed to support multiple diseases, including Breast Cancer, Heart Disease, and Chronic Kidney Disease. Each disease has its own feature set and preprocessing pipeline, so the system can handle different medical datasets properly.

The platform can take patient-related input, process the data, and provide both quantum and classical predictions. This makes the solution suitable for expanding from a single disease to multiple disease-risk screening use cases.

 *Finally, Noise Feasibility.* 
Since real quantum computers are affected by noise, QuantumX includes noise simulation and error mitigation techniques, such as Zero-Noise Extrapolation and readout error mitigation. We also use geometric filtering to study the difference between classical and quantum approaches.

So, overall, QuantumX is feasible because we can develop it using simulators, train it using a hybrid approach, deploy it through a web platform, and validate it on real quantum hardware.
