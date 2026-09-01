from datetime import datetime
from pydantic import BaseModel, Field


class ScreeningCreate(BaseModel):
    id: str | None = None
    patientId: str = Field(..., alias="patient_id")
    diseaseType: str = Field(..., alias="disease_type")
    quantumPrediction: str = Field(..., alias="quantum_prediction")
    quantumConfidence: float = Field(..., alias="quantum_confidence")
    classicalPrediction: str = Field(..., alias="classical_prediction")
    classicalConfidence: float = Field(..., alias="classical_confidence")
    riskLevel: str = Field(..., alias="risk_level")
    topDriver: str | None = Field(None, alias="top_driver")
    quantumExecutionTimeMs: int = Field(16, alias="quantum_execution_time_ms")
    classicalExecutionTimeMs: int = Field(3, alias="classical_execution_time_ms")
    inputFeatures: dict | None = Field(None, alias="input_features")
    gateAttributions: list | None = Field(None, alias="gate_attributions")
    clinicalNote: str | None = Field(None, alias="clinical_note")

    model_config = {
        "populate_by_name": True,
    }


class ScreeningResponse(BaseModel):
    id: str
    patientId: str = Field(..., serialization_alias="patientId", validation_alias="patient_id")
    diseaseType: str = Field(..., serialization_alias="diseaseType", validation_alias="disease_type")
    quantumPrediction: str = Field(..., serialization_alias="quantumPrediction", validation_alias="quantum_prediction")
    quantumConfidence: float = Field(..., serialization_alias="quantumConfidence", validation_alias="quantum_confidence")
    classicalPrediction: str = Field(..., serialization_alias="classicalPrediction", validation_alias="classical_prediction")
    classicalConfidence: float = Field(..., serialization_alias="classicalConfidence", validation_alias="classical_confidence")
    riskLevel: str = Field(..., serialization_alias="riskLevel", validation_alias="risk_level")
    topDriver: str | None = Field(None, serialization_alias="topDriver", validation_alias="top_driver")
    quantumExecutionTimeMs: int = Field(16, serialization_alias="quantumExecutionTimeMs", validation_alias="quantum_execution_time_ms")
    classicalExecutionTimeMs: int = Field(3, serialization_alias="classicalExecutionTimeMs", validation_alias="classical_execution_time_ms")
    inputFeatures: dict | None = Field(None, serialization_alias="inputFeatures", validation_alias="input_features")
    gateAttributions: list | None = Field(None, serialization_alias="gateAttributions", validation_alias="gate_attributions")
    clinicalNote: str | None = Field(None, serialization_alias="clinicalNote", validation_alias="clinical_note")
    createdAt: datetime = Field(..., serialization_alias="createdAt", validation_alias="created_at")

    model_config = {
        "populate_by_name": True,
        "from_attributes": True,
    }
