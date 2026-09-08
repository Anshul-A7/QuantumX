## *Slide 2: Proposed Solution (Kamran)*

Thank you, Anshul. 

It happens because today’s medical AI is blind to the subtle, overlapping signals of developing disease. By the time it catches them, the damage is already done.

That is why we engineered QuantumX across three deadly health conditions:

- **First, Breast Cancer:** We made this our primary test case. Over 2.3 million women are diagnosed each year. If caught at Stage 1, the 5-year survival rate is **99%**. But if it reaches Stage 4, that chance crashes down to **31%**. Worse, routine needle biopsy tests still have an **18% to 20% false-negative rate** because early cancer cells look almost identical to healthy cells.
- **Second, Heart Attacks:** This is our second core focus because heart disease is the number one killer in the world, taking nearly **20 million lives every year**. What is alarming is that almost **50% of sudden heart attacks** happen in people whose routine resting tests looked completely normal. Standard hospital triage software still misses early warnings around **15% to 18% of the time**.
- **Third, Neurological Diseases like Dementia:** We chose this as our planned expansion. Over **57 million people** live with dementia worldwide. The disease actually starts developing **15 to 20 years** before memory loss shows up, but local clinics miss over **60% of early cases**, with standard software showing a **20% error rate**.

#### Why does this happen? Because in early stages, the disease signal is tiny, hidden inside dozens of complex medical numbers.

---

### First, the problem with classical ML
On the left side of this slide, we show the limitations of classical machine learning. Today, hospitals use models like Random Forest, Support Vector Machines, and XGBoost to assist doctors.

These models run on normal computers and are very useful. But when medical data becomes complex, they have a major limitation.

For example, in breast cancer detection, two cells can look almost identical. A tiny change in their shape, nucleus, or texture is the only clue separating a harmless benign cell from an aggressive malignant tumor.

### Second, why this problem becomes difficult
Now, look at the 3D feature-space graph on the left.

Classical algorithms look at data in flat, Euclidean space. As you can see, the benign and malignant data points overlap heavily. They form a tangled knot.
A classical model tries to draw a straight or curved line through this cluster, but it cannot separate them cleanly.

When this boundary fails, the model produces a False Negative.
A false negative means the disease is actually growing in the patient, but the model tells the doctor: "Everything is normal."

In early diagnosis, classical models can have a 15% to 20% false negative rate. When a model misses a disease, the patient goes home without treatment, losing the critical window when the disease could have been cured.

And if we try to make classical neural networks deeper to fix this, they fall into an overfitting trap—because medical datasets are small, deep models simply memorize the noise.

So the real challenge is not just training another AI model. The real challenge is: How can we separate these overlapping patterns accurately without overfitting?

### Third, our proposed solution: QuantumX
This is why we built QuantumX.

Instead of forcing classical models to draw impossible lines in flat space, QuantumX uses a **Hybrid Quantum-Classical approach**.

We take those complex clinical features and encode them into an 8-qubit quantum state. On a classical computer, 8 features are trapped in just 8 flat dimensions where data points crowd and collide. But in quantum computing, 8 qubits unlock an exponential **256-dimensional Hilbert space** ($2^8 = 256$). This vast mathematical space gives crowded, overlapping data points the room they need to separate.

Next comes the biggest difference: **Quantum Entanglement**. Classical models have a major weakness—they analyze features one by one or in rigid steps, completely missing how subtle changes across multiple markers connect together. But through entanglement, our qubits become interconnected, evaluating all clinical features and their hidden correlations simultaneously as a single connected system.

This naturally untangles overlapping benign and malignant points, making them cleanly separable. And because our quantum circuit uses only **48 simple parameters**, it stays lightweight and completely avoids the overfitting trap of deep neural networks.

### Fourth, our working prototype
On the right is our working prototype. 

Its core feature is the **Multi-Disease Screening Engine**. In one unified dashboard, doctors can switch between **Breast Cancer biopsy cells**, **Heart Attack vitals and ECGs**, and **Neurological dementia markers** to get instant, calibrated risk scores.

The platform also provides **visual AI explanations**, **classical model benchmarks**, and direct connections to **real IBM Quantum processors**.

Our goal is simple: stop missed diagnoses and catch serious diseases early when they can still be cured.

To explain our technical architecture and how our Hybrid Model Architecture works, I now hand back to **Anshul**.

### Passes to Anshul (Slide 3) -->