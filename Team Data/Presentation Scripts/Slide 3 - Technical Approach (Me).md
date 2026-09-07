## *Slide 3: Technical Approach & Architecture (Anshul)*

Thank you, Kamran.

Kamran highlighted why critical diseases are still detected too late. While classical AI models are already powerful and widely used in healthcare, they hit a mathematical wall when subtle biological patterns overlap.

To solve this limitation and catch diseases early, let us look at our complete technical architecture shown on this slide.

Our end-to-end pipeline connects standard hospital lab reports directly into our hybrid quantum engine. Let me walk you through how data flows through this system.

---

In modern hospitals and diagnostic labs, standard tests produce detailed numerical reports. For example, an ECG records continuous electrical wave intervals, while a breast biopsy captures 30 microscopic nuclear geometries like cell radius, perimeter, and concavity.

Historically, diagnostic labs relied entirely on manual evaluation and rigid, single-cutoff thresholds on paper reports. But in early-stage disease, individual measurements almost always sit inside borderline-normal ranges, making single-parameter thresholds blind to developing illness. To solve this, modern healthcare began deploying classical machine learning—bringing in models like Random Forest, Support Vector Machines, and XGBoost to evaluate complex multi-parameter interactions simultaneously. This was a major leap forward, but it hit a mathematical ceiling: because classical models evaluate these features in flat Euclidean space, overlapping biological signals still cause the dangerous 15% to 20% false-negative rate that Kamran described.

QuantumX directly interfaces with these standard hospital lab outputs, taking those raw clinical numbers and processing them through our hybrid architecture.

---

Looking at the left side of our architecture diagram, the pipeline begins with **Diagnostic Cases and Data Ingestion**. When a clinician or hospital lab accesses QuantumX, they select the diagnostic use case—for example, breast cancer screening—and enter the patient's clinical tabular data. This can be an uploaded lab report or direct numerical inputs, such as 30 fine-needle biopsy measurements capturing cell radius, perimeter, and concavity.

Once entered, our platform immediately checks the data for errors, protects patient privacy, and cleans up real-world hospital noise. In real clinics, lab data is messy—machines produce occasional extreme glitches, missing readings, or skewed scales. Our preprocessing pipeline automatically handles missing values, filters out lab errors, and scales the numbers cleanly, ensuring our models learn genuine disease patterns without any data leakage.

From there, we move to Dimensionality Reduction—and here, we have to be completely realistic about how quantum computers actually work. A quantum computer cannot read a spreadsheet of numbers like a classical PC. A quantum circuit operates on quantum bits, or qubits, and the only way to feed patient data into a qubit is to translate those numerical values into physical rotation angles. 

Today's physical quantum processors are noisy and fragile. If we took all 30 raw biopsy numbers and tried to build a 30-qubit circuit with hundreds of quantum operations, physical hardware noise would drown out the entire biological signal before we got a result. 

To solve this real-world hardware bottleneck, our classical pipeline first trains a non-linear Autoencoder. It compresses those 30 continuous clinical measurements down into the 8 most critical biological patterns, scaled cleanly into 8 rotation angles between $[-\pi, \pi]$. This preserves the true non-linear geometry of the tumor cells while keeping the circuit compact and noise-resilient for an 8-qubit quantum register.

---

From here, our architecture splits into two parallel tracks: an honest classical benchmark, and our hybrid quantum pipeline.

On the classical side (Box 8A), we train fully tuned baseline models—including XGBoost, Random Forest, Support Vector Machines, and a feed-forward neural network—using the exact same patient data splits. We use these identical splits to ensure a strictly fair, controlled benchmark. Before running quantum circuits, our platform calculates the Huang Geometric Advantage score ($s_K$): if $s_K \ge 0.5$, meaning the dataset shows no quantum geometric advantage, the system automatically routes the sample to our classical models.

When quantum advantage is confirmed ($s_K < 0.5$), the sample enters our **8-Qubit Variational Quantum Circuit** (Box 8B). Here is how the encoded data is actually trained:

First, those 8 clinical rotation angles prepare our 8 qubits into a superposed, entangled state. This expands the patient's biological data into an exponential 256-dimensional Hilbert space ($2^8 = 256$), giving overlapping tumor profiles the mathematical room they need to separate cleanly.

Next, the data flows through variational quantum layers controlled by exactly **48 trainable parameter dials** ($\theta$). Between these layers, we implement **Data Re-Uploading**—meaning we re-inject the patient's original 8 clinical angles midway through the circuit. In quantum computing, as physical gates execute, the quantum state can drift away from the input data. By re-uploading the clinical angles, we reinforce the patient's biological identity, giving our shallow circuit universal expressive power without adding noisy gate depth.

Now, how does this hybrid system actually learn? You cannot perform standard calculus backpropagation inside a physical quantum processor. This is where our **Hybrid Optimization Loop** comes in. To train efficiently without wasting physical quantum credits, we first train this entire circuit on a high-speed **quantum simulator** using PennyLane's Lightning statevector engine. The circuit evaluates the patient's state, and a classical computer measures the output to calculate diagnostic loss. Then, using the **Parameter-Shift Rule**, the classical computer nudges each of the 48 quantum parameters slightly forward and backward ($\pm \pi/2$) to compute exact, analytical gradients. A classical Adam optimizer uses these gradients to update the 48 quantum dials, repeating this feedback loop until the circuit converges.

Because our hybrid model relies on just 48 parameters—instead of the tens of thousands of weights in deep neural networks—it physically cannot memorize noise. It learns the true underlying geometry of the disease, completely eliminating the overfitting trap that ruins classical models on small medical cohorts.

At this stage, we have two fully trained baseline models: our **trained classical champion**, and our **simulator-trained quantum model**.

---

From here, we take our simulator-trained model and move to **Real Quantum Hardware Fine-Tuning** (Box 9B). 

Instead of wasting expensive hardware time training from scratch, we use our dedicated 10-minute access windows—scaling across 60 minutes of total allocated IBM Quantum QPU access—to fine-tune our 48 parameters directly on physical 127-qubit IBM Quantum Eagle and Heron processors. To remove physical hardware noise, our pipeline deploys Zero-Noise Extrapolation (ZNE) and M3 readout error mitigation, producing our final, hardware-calibrated quantum model.

With our models ready, the platform delivers the **Final Diagnostic Prediction** (Box 12). A doctor receives an instant, calibrated risk score—showing the exact percentage probability of whether a tumor is benign or malignant, along with statistical confidence intervals.

To eliminate the AI black-box, our **QXplain Engine** (Box 11) shows clinicians exactly which biological features and quantum gates drove that decision, complete with a verifiable clinical receipt and IBM Quantum Job ID.

Finally, we validate our platform through **Unified Benchmarking** (Box 10). On the exact same patient data splits, we rigorously compare all three: our classical baselines, our quantum simulator, and physical IBM quantum hardware. This statistically proves our hybrid model's superior accuracy and sensitivity on identical medical cohorts.

---

### Passes to Jeevan (Slide 4: Feasibility) ->
Now, let us see how this entire architecture moves from design into practical clinical feasibility and hardware readiness. For that, I hand over to **Jeevan**.
