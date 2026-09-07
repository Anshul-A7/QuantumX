## *FEASIBILITY SPEECH*     
     
Now, I would like to explain the feasibility of our project.    

"Feasibility means whether our solution can actually be built and implemented with the available technology and resources."    
    
Our feasibility is divided into four main areas:    
    
### *First, Hardware Feasibility.*     
The proposed solution can be developed using PennyLane and Qiskit simulators, so we do not always need real quantum hardware. For real execution, we can use IBM Quantum Eagle and Heron QPUs. Our core model uses an 8-qubit circuit, making the hardware requirement practical within the current development in Quantum Computing. 
    
### *Second, Training Feasibility.*     
We use a hybrid quantum-classical approach, where quantum circuits work together with classical machine learning. Our 8-qubit VQC keeps the model compact, while classical models like XGBoost, SVM, Random Forest, and MLP provide strong baselines for comparison.    
    
### *Third, functional Feasibility.*      
QuantumX is designed to support multiple diseases, including Breast Cancer, Heart Disease, and Neurological Disease. Each disease has its own feature set, preprocessing pipeline and Model Architecture, so the system can handle different complex medical data properly.    
     
### *Finally, Noise Feasibility.*       
Since real quantum computers are affected by noise, project includes noise simulation and error mitigation techniques, such as Zero-Noise Extrapolation and readout error mitigation. We also use geometric filtering to study the difference between classical and quantum approaches, as Quantum Computing is actively researching on ways to improve.    
    
So, overall, project is feasible because we can develop it using simulators and finetune on real quantum computer, deploy it through a web platform, and validate it on real quantum hardware, while benchmarking between both classical and hybrid models. 

Let us see how our solution can be practically useful and valuable in the real world.

## Pass to Prem (Slide 4) -->
