import uuid
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import delete, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.dependencies import get_current_user
from app.core.database import get_db
from app.models.screening import Screening
from app.models.user import User
from app.schemas.screening import ScreeningCreate, ScreeningResponse

router = APIRouter(
    prefix="/screenings",
    tags=["Screenings"],
)


@router.get("", response_model=List[ScreeningResponse])
async def get_user_screenings(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    query = (
        select(Screening)
        .where(Screening.user_id == current_user.id)
        .order_by(Screening.created_at.desc())
        .limit(100)
    )
    result = await db.execute(query)
    records = result.scalars().all()
    return records


@router.post("", response_model=ScreeningResponse, status_code=status.HTTP_201_CREATED)
async def create_screening(
    payload: ScreeningCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    record_id = payload.id or f"QX-{uuid.uuid4().hex[:8].upper()}"
    patient_id = payload.patientId or record_id

    new_screening = Screening(
        id=record_id,
        user_id=current_user.id,
        patient_id=patient_id,
        patient_name=payload.patientName or patient_id,
        patient_age=payload.patientAge,
        patient_gender=payload.patientGender,
        disease_type=payload.diseaseType or "Breast Cytology (Fine Needle Aspirate)",
        model_family=payload.modelFamily or "aegis_classical_v1",
        execution_mode=payload.executionMode or "simulator",
        quantum_prediction=payload.quantumPrediction,
        quantum_confidence=payload.quantumConfidence,
        classical_prediction=payload.classicalPrediction,
        classical_confidence=payload.classicalConfidence,
        risk_level=payload.riskLevel,
        risk_score=payload.riskScore,
        morphometric_index=payload.morphometricIndex,
        top_driver=payload.topDriver,
        quantum_execution_time_ms=payload.quantumExecutionTimeMs,
        classical_execution_time_ms=payload.classicalExecutionTimeMs,
        input_features=payload.inputFeatures,
        gate_attributions=payload.gateAttributions,
        shap_attributions=payload.shapAttributions,
        hardware_receipt=payload.hardwareReceipt,
        ai_synthesis=payload.aiSynthesis,
        clinical_note=payload.clinicalNote,
    )
    db.add(new_screening)
    await db.commit()
    await db.refresh(new_screening)
    return new_screening


@router.delete("/{screening_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_screening(
    screening_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    query = (
        delete(Screening)
        .where(Screening.id == screening_id, Screening.user_id == current_user.id)
    )
    result = await db.execute(query)
    await db.commit()
    if result.rowcount == 0:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Screening record not found",
        )
    return None


@router.delete("", status_code=status.HTTP_204_NO_CONTENT)
async def clear_all_screenings(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    query = delete(Screening).where(Screening.user_id == current_user.id)
    await db.execute(query)
    await db.commit()
    return None
