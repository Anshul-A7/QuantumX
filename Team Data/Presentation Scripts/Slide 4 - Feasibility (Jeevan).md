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
Quantum computers are highly sensitive to physical disturbances, which can introduce calculation errors known as "noise." To tackle this, we plan to use error mitigation techniques (such as Zero-Noise Extrapolation) in the future to ensure reliable results on real hardware.

In short, QuantumX is fully feasible today because we can develop on simulators without expensive infrastructure, validate on real quantum processors, and deploy easily through a web platform.

Let us see how our solution can be practically useful and valuable in the real world.

## Pass to Prem (Slide 4) -->


---


FEASIBILITY SPEECH (Jeevan)
“अब बात करते हैं हमारे project की Feasibility की।
Feasibility का simple मतलब है: क्या यह solution आज की technology और resources से actually बनाया और implement किया जा सकता है?

हमारी feasibility चार main areas में divided है:

1. Hardware Feasibility:
हमें हर समय real quantum hardware की जरूरत नहीं है। हम development PennyLane और Qiskit simulators पर कर सकते हैं, और real-world execution के लिए IBM Quantum Eagle और Heron QPUs use करते हैं। हमारा core model सिर्फ 8-qubit circuit use करता है, जो आज के hardware पर perfectly practical है।

2. Training Feasibility:
हम Classical AI और Quantum computing को combine करके train करते हैं। Classical part heavy data संभालता है और Quantum part patterns सीखता है—जिससे model fast train होता है और system पर भारी load नहीं पड़ता।

3. Functional Feasibility:
QuantumX multiple diseases को support करता है—Breast Cancer, Heart Disease, और Dementia। हर disease के लिए dedicated preprocessing pipeline और architecture है, जो complex medical data को smoothly handle करती है।

4. Noise Feasibility:
Quantum computers बहुत sensitive होते हैं, जिसकी वजह से minor disturbance या errors आ सकते हैं—इसे 'noise' कहते हैं। इसे tackle करने के लिए हम future में error mitigation techniques use करने का plan कर रहे हैं, ताकि real hardware पर results reliable रहें।

In short: बिना expensive setup के simulators पर build करना, real quantum processors पर test करना, और web के through use करना—QuantumX को आज के resources में fully feasible बनाता है।

अब देखते हैं कि यह solution commercially और practically कितना viable है।
Over to Prem.”