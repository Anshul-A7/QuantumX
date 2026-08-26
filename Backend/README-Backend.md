# Backend — QuantumX

[![Status](https://img.shields.io/badge/status-active%20development-yellow)]()
[![SIH](https://img.shields.io/badge/SIH%202026-SIH26139-blue)]()
[![Python](https://img.shields.io/badge/backend-Python%203.12%2B-3776AB?logo=python&logoColor=white)]()
[![Next.js](https://img.shields.io/badge/frontend-Next.js%2016-black?logo=next.js&logoColor=white)]()
[![Qiskit](https://img.shields.io/badge/quantum-Qiskit%20%7C%20PennyLane-6929C4)]()
[![License](https://img.shields.io/badge/license-TBD-lightgrey)]()

This folder owns everything that isn't the UI: data ingestion, classical ML, the quantum layer, explainability, benchmarking, and the API the frontend talks to.

## Language & Framework: Python, FastAPI — and why not something else

**Recommendation: Python 3.12+ end to end, with FastAPI as the API layer. No second backend language.**

You asked specifically whether to use Python alone, a different language entirely, or a hybrid combination — worth answering properly rather than just asserting it.

**Why Python is close to non-negotiable here:** every mature quantum computing SDK is Python-first — Qiskit, PennyLane, the Amazon Braket SDK, Cirq. There's no competing ecosystem in another language for hybrid quantum-classical ML. This isn't a close call the way "Node vs. Django" might be for a generic web app; it's closer to "you need Python for the quantum part, full stop."

**Given that, why not Python for *just* the quantum part, and something else for the API layer?** Some teams do split it that way — e.g. a Node/TypeScript API gateway calling out to a separate Python quantum microservice. It's a legitimate architecture, but it buys you very little here and costs real time: two runtimes to run and deploy, a network hop between "the API" and "the ML," and serialization overhead for what would otherwise be a direct function call. FastAPI already gives you a modern, async, auto-documented (OpenAPI/Swagger out of the box) API layer *in the same language* as the ML/quantum code — so the API layer and the ML core can share types, import each other directly, and avoid an entire class of integration bugs. For a hackathon timeline, that matters more than any theoretical scaling benefit of splitting services now. If the platform outgrows this later, splitting a monolith into services is a well-understood refactor — much easier to do once than to maintain speculatively from day one.

One clarification worth having explicit, since it's an easy thing to conflate: this project is a **hybrid quantum-classical machine learning platform** — "hybrid" describes the *algorithms* (part of the computation is a quantum circuit, part is classical), not the *codebase*. A single-language Python backend is completely consistent with — in fact, is the natural way to implement — a hybrid quantum-classical model.

## Quantum Layer: PennyLane (primary) + Qiskit (hardware & kernels)

- **[PennyLane](https://pennylane.ai/)** (Xanadu) is the primary framework for the hybrid training loop. It's built specifically for differentiable, hardware-agnostic hybrid quantum-classical programs — the same circuit code can target a local simulator or a real QPU by changing the configured "device," and it integrates directly with PyTorch's autodiff, which matters for training variational quantum circuits with standard gradient-based optimizers. Requires **Python 3.12+**.
- **[Qiskit](https://www.ibm.com/quantum/qiskit)** (IBM), currently on the 2.x line, is used alongside PennyLane specifically for: (a) executing on real IBM Quantum hardware via Qiskit Runtime, and (b) quantum kernel methods (QSVM), where Qiskit's tooling is more mature. Requires Python 3.10+; **Python 3.12+ satisfies both libraries**, so that's the project-wide baseline.
- The two connect via the `pennylane-qiskit` plugin, so PennyLane-authored circuits can be dispatched to IBM backends without being rewritten in Qiskit.
- **Simulators for development:** Qiskit Aer (`statevector_simulator`, and a noisy `qasm_simulator` for NISQ-realism testing) and PennyLane's `default.qubit`. Both comfortably handle the qubit counts (roughly up to the low-to-mid twenties) this project needs on a laptop.

## Real Quantum Hardware Access

Per `README.md`'s hardware strategy: simulators for the fast development/demo loop, real QPU runs as a documented part of the benchmarking pipeline.

- **[IBM Quantum Open Plan](https://quantum.cloud.ibm.com/)** — free, no credit card required, real superconducting QPU access (systems currently ranging up to 127+ qubits), with a monthly runtime allowance. This is the default path — sign-up steps are in `../SETUP.md`.
- **IBM Quantum Classroom Accounts** — free, coordinated access for a team of students (up to 100 seats) with built-in oversight, and generally a better fit than everyone on the team signing up individually. Worth applying for as a team early, since approval isn't always instant.
- **Amazon Braket** — access to a wider hardware variety (trapped-ion, neutral-atom, in addition to superconducting) through one API, but it's generally **pay-per-shot**, not free, outside of research credit programs. Only worth adding if IBM's qubit topology or gate set becomes a real constraint — not needed for the MVP.
- Quantum cloud access programs change their terms over time. Whatever is written above and in `SETUP.md`, double-check current limits at the provider's site before depending on a specific number.

## Classical ML

- **scikit-learn** — SVM (RBF kernel), Random Forest, and the general preprocessing/pipeline tooling. This is what the quantum models are benchmarked *against*, so it needs to be genuinely well-tuned, not a token baseline.
- **XGBoost** — a strong, standard gradient-boosted baseline; on many published tabular medical benchmarks this is the model to beat.
- **PyTorch** — for any classical neural network components (a feed-forward baseline, and the classical backbone in any hybrid CNN→quantum-head model), and because it's the autodiff framework PennyLane integrates with most directly.

## Explainability

- **SHAP** (`shap`) — model-agnostic, works as a classical explainability layer over both the classical baselines and, via kernel-based explainers, the quantum models treated as black-box functions.
- **Quantum-native explainability** is one of this platform's real differentiators and doesn't have an off-the-shelf library — it's something to design and build: attributing a prediction to specific gates or qubit interactions rather than only to input features. Worth scoping carefully; see `Plan/` for the current design thinking on this rather than treating it as settled here.

## A Practical Note on Data and Qubit Counts

Near-term quantum hardware has a limited number of usable qubits, and every additional feature you encode into a circuit costs you (in qubits, circuit depth, or both). That pushes strongly toward **starting with lower-dimensional, tabular biomedical data** rather than raw medical imaging: datasets like UCI's Wisconsin Breast Cancer (30 features), Heart Disease (13+ features), or a curated genomic feature panel are far more tractable for real near-term quantum encoding than a raw MRI. Imaging is a reasonable stretch goal once the pipeline works end-to-end on tabular data (almost certainly via a classical CNN feature extractor feeding a much smaller quantum head, not raw pixels into a circuit) — not a good starting point.

Also worth being deliberate about: classical dimensionality reduction done carelessly (a blind PCA down to 4–8 components, for instance) can strip out exactly the non-linear structure a quantum model would otherwise have a chance to exploit. Whatever preprocessing pipeline gets built, this is worth actively guarding against, not defaulting into.

## Recommended Folder Structure

```
Backend/
├── app/
│   ├── api/              # FastAPI route handlers
│   ├── core/              # Settings, config, security
│   ├── quantum/            # Circuit definitions, encodings, QK-SVM / VQC / hybrid models
│   ├── classical/           # Classical baseline models
│   ├── pipelines/            # Data ingestion, feature engineering, training orchestration
│   ├── explainability/        # SHAP wrappers + quantum-native attribution
│   ├── schemas/             # Pydantic request/response models (NOT "models/" — see STRUCTURE_REVIEW.md)
│   ├── services/            # Business logic tying layers together
│   └── main.py             # FastAPI app entrypoint
├── tests/                 # pytest — see testing note below
├── requirements.txt (or pyproject.toml)
├── .env.example             # Documents required env vars, no real secrets
└── .env                    # Real secrets — gitignored, never committed
```

## API Surface (starting point)

Exact routes will firm up as the pipeline gets built (track this in `Plan/`), but the shape is roughly:

- `POST /datasets` — upload/select a dataset
- `POST /training/runs` — kick off a training run (classical baselines + quantum models, same split)
- `GET /training/runs/{id}` — status/results of a run
- `GET /benchmarks/{id}` — comparative metrics, statistical significance
- `POST /predict` — single-record inference with explainability output
- `GET /quantum/backends` — available quantum backends (simulators + connected real hardware) and their current status

## Testing

`pytest`, with particular attention to quantum-specific cases that a generic "did it run" test won't catch:

- **Unit tests** per module (ingestion, encoding, training, explainability, benchmarking).
- **Quantum correctness tests** — verify small (2–4 qubit) circuit outputs against hand-calculated statevectors. A circuit that runs without error can still be computing the wrong thing.
- **Noise-model tests** — compare noiseless vs. noisy simulation to confirm NISQ noise modeling behaves as expected before trusting it as a proxy for real hardware.

## Secrets

IBM Quantum tokens (and any other credentials) go in `.env`, which is gitignored. `.env.example` documents every variable the backend needs, with placeholder values, so a new contributor knows what to fill in without ever seeing a real secret. Full setup steps: `../SETUP.md`.
