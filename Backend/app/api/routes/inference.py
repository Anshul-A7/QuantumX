from typing import Dict, Any, Optional
import io
import base64
from pathlib import Path
from fastapi import APIRouter, HTTPException, status, UploadFile, File, Form, Request
from pydantic import BaseModel, Field

from models_v1 import cx_01_pipeline, transfinite_1_pipeline, aleph_1_pipeline
from models_v1.heart_v1.cardiac_engine import get_cardiac_engine

router = APIRouter(
    prefix="/inference",
    tags=["Model Inference Pipelines"],
)

class BiomarkerInput(BaseModel):
    radius_mean: float = Field(default=12.20, description="Mean nuclear radius")
    texture_mean: float = Field(default=17.39, description="Standard deviation of gray-scale values")
    perimeter_mean: float = Field(default=78.18, description="Mean nuclear perimeter")
    area_mean: float = Field(default=458.70, description="Mean nuclear spatial area")
    smoothness_mean: float = Field(default=0.0908, description="Local variation in radius lengths")
    compactness_mean: float = Field(default=0.0645, description="Perimeter^2 / area - 1.0")
    concavity_mean: float = Field(default=0.0371, description="Severity of concave portions of contour")
    concave_points_mean: float = Field(default=0.0234, description="Number of concave portions of contour")

class InferenceRequest(BaseModel):
    model_name: str = Field(default="transfinite_1", description="Target model: 'cx_01' | 'transfinite_1' | 'aleph_1'")
    biomarkers: BiomarkerInput
    ibm_token: Optional[str] = Field(default=None, description="Optional IBM Quantum API token for Aleph-1")

@router.post("/breast-cancer", status_code=status.HTTP_200_OK)
async def run_breast_cancer_inference(payload: InferenceRequest):
    """
    Executes one of the three dedicated model pipelines:
      - CX-01: Classical Benchmark (SVM-RBF + XGBoost)
      - Transfinite-1: Hybrid Quantum Baseline Simulator (PennyLane statevector)
      - Aleph-1: Fine-Tuned Real IBM Hardware QPU Model
    """
    try:
        biomarker_dict = payload.biomarkers.model_dump()
        target = payload.model_name.lower().replace("-", "_")

        if target in ["cx_01", "classical"]:
            result = cx_01_pipeline.predict(biomarker_dict)
        elif target in ["aleph_1", "real_ibm_qpu", "ibm"]:
            result = aleph_1_pipeline.predict(biomarker_dict, ibm_token=payload.ibm_token)
        else:
            # Default to Transfinite-1 (Simulator)
            result = transfinite_1_pipeline.predict(biomarker_dict)

        return {"success": True, "telemetry": result}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Inference pipeline execution error: {str(e)}"
        )


class CardiacBase64Request(BaseModel):
    image_base64: str = Field(..., description="Base64 encoded ECG image data string")
    filename: Optional[str] = Field(default="ecg_upload.jpg")
    model_name: Optional[str] = Field(default="transfinite_1")


@router.post("/cardiac-ecg", status_code=status.HTTP_200_OK)
async def run_cardiac_ecg_inference(
    request: Request,
    file: Optional[UploadFile] = File(None),
):
    """
    Executes production Cardiac ECG Dual-Engine Inference:
      - Classical CX-01 ResNet-18 + Grad-CAM Heatmap
      - Hybrid Quantum Transfinite-1 8-Qubit VQC
      - Calibrated 0-100 Continuous Cardiac Risk Score
      - Anatomical Lead & ST Abnormality Pinpointing
    """
    try:
        engine = get_cardiac_engine()
        image_bytes = None
        filename = "ecg_image.jpg"

        content_type = request.headers.get("content-type", "")
        if "application/json" in content_type:
            data = await request.json()
            b64_str = data.get("image_base64", "")
            if "," in b64_str:
                b64_str = b64_str.split(",")[1]
            if b64_str:
                image_bytes = base64.b64decode(b64_str)
            filename = data.get("filename") or "ecg_image.jpg"
        elif file is not None:
            image_bytes = await file.read()
            filename = file.filename or "ecg_image.jpg"
        else:
            # Check form data fields
            try:
                form = await request.form()
                if "file" in form and hasattr(form["file"], "read"):
                    upload = form["file"]
                    image_bytes = await upload.read()
                    filename = getattr(upload, "filename", "ecg_image.jpg")
                elif "image_base64" in form:
                    b64_str = str(form["image_base64"])
                    if "," in b64_str:
                        b64_str = b64_str.split(",")[1]
                    image_bytes = base64.b64decode(b64_str)
                    filename = str(form.get("filename", "ecg_image.jpg"))
            except Exception:
                pass

        if not image_bytes:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Either an image file upload or image_base64 payload must be provided."
            )

        telemetry = engine.predict_image(image_bytes, filename=filename)
        return telemetry
    except HTTPException:
        raise
    except ValueError as ve:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=str(ve)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Cardiac ECG inference failed: {str(e)}"
        )


class CardiacDemoRequest(BaseModel):
    sample_type: str = Field(..., description="'mi' | 'normal' | 'history_mi' | 'arrhythmia'")


@router.post("/cardiac-demo", status_code=status.HTTP_200_OK)
async def run_cardiac_demo_inference(payload: CardiacDemoRequest):
    """
    Runs instant inference on verified clinical sample ECG cases.
    """
    try:
        sample_key = payload.sample_type.lower().strip()
        sample_map = {
            "mi": ("Frontend/public/samples/ecg/sample-mi.jpg", "Acute_MI_Lead_V2_V6.jpg"),
            "normal": ("Frontend/public/samples/ecg/sample-normal.jpg", "Normal_Sinus_Rhythm.jpg"),
            "history_mi": ("Frontend/public/samples/ecg/sample-history-mi.jpg", "Prior_Infarct_Lead_II.jpg"),
            "arrhythmia": ("Frontend/public/samples/ecg/sample-arrhythmia.jpg", "Conduction_Arrhythmia.jpg"),
        }

        if sample_key not in sample_map:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Unknown sample_type '{sample_key}'. Choose from: {list(sample_map.keys())}"
            )

        rel_path, display_name = sample_map[sample_key]
        filename = Path(rel_path).name

        possible_paths = [
            Path(__file__).resolve().parents[2] / "samples" / "ecg" / filename,
            Path(__file__).resolve().parents[3] / "samples" / "ecg" / filename,
            Path(__file__).resolve().parents[4] / rel_path,
            Path(__file__).resolve().parents[3] / rel_path,
            Path.cwd() / "Backend" / "samples" / "ecg" / filename,
            Path.cwd() / "samples" / "ecg" / filename,
            Path.cwd() / rel_path,
        ]

        img_path = None
        for p in possible_paths:
            if p.exists():
                img_path = p
                break

        if not img_path:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Sample file '{filename}' not found on server filesystem."
            )

        with open(img_path, "rb") as f:
            data = f.read()

        engine = get_cardiac_engine()
        telemetry = engine.predict_image(data, filename=display_name)
        return telemetry
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Cardiac demo inference failed: {str(e)}"
        )
