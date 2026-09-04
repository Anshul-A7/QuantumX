from datetime import datetime
from typing import Any, Dict, List, Optional, Union
from pydantic import BaseModel, Field


class ScreeningCreate(BaseModel):
    id: Optional[str] = None
    patientId: Optional[str] = Field(None, alias="patient_id")
    patientName: Optional[str] = Field(None, alias="patient_name")
    patientAge: Optional[int] = Field(None, alias="patient_age")
    patientGender: Optional[str] = Field(None, alias="patient_gender")
    diseaseType: Optional[str] = Field("Breast Cytology (Fine Needle Aspirate)", alias="disease_type")
    modelFamily: Optional[str] = Field(None, alias="model_family")
    executionMode: Optional[str] = Field(None, alias="execution_mode")
    quantumPrediction: str = Field(..., alias="quantum_prediction")
    quantumConfidence: float = Field(..., alias="quantum_confidence")
    classicalPrediction: str = Field(..., alias="classical_prediction")
    classicalConfidence: float = Field(..., alias="classical_confidence")
    riskLevel: str = Field(..., alias="risk_level")
    riskScore: Optional[float] = Field(None, alias="risk_score")
    morphometricIndex: Optional[float] = Field(None, alias="morphometric_index")
    topDriver: Optional[str] = Field(None, alias="top_driver")
    quantumExecutionTimeMs: Optional[Union[float, int]] = Field(None, alias="quantum_execution_time_ms")
    classicalExecutionTimeMs: Optional[Union[float, int]] = Field(None, alias="classical_execution_time_ms")
    inputFeatures: Optional[Dict[str, Any]] = Field(None, alias="input_features")
    gateAttributions: Optional[List[Any]] = Field(None, alias="gate_attributions")
    shapAttributions: Optional[Union[List[Any], Dict[str, Any]]] = Field(None, alias="shap_attributions")
    hardwareReceipt: Optional[Dict[str, Any]] = Field(None, alias="hardware_receipt")
    aiSynthesis: Optional[Dict[str, Any]] = Field(None, alias="ai_synthesis")
    clinicalNote: Optional[str] = Field(None, alias="clinical_note")

    model_config = {
        "populate_by_name": True,
        "extra": "ignore",
    }


class ScreeningResponse(BaseModel):
    id: str
    patientId: Optional[str] = Field(None, serialization_alias="patientId", validation_alias="patient_id")
    patientName: Optional[str] = Field(None, serialization_alias="patientName", validation_alias="patient_name")
    patientAge: Optional[int] = Field(None, serialization_alias="patientAge", validation_alias="patient_age")
    patientGender: Optional[str] = Field(None, serialization_alias="patientGender", validation_alias="patient_gender")
    diseaseType: str = Field(..., serialization_alias="diseaseType", validation_alias="disease_type")
    modelFamily: Optional[str] = Field(None, serialization_alias="modelFamily", validation_alias="model_family")
    executionMode: Optional[str] = Field(None, serialization_alias="executionMode", validation_alias="execution_mode")
    quantumPrediction: str = Field(..., serialization_alias="quantumPrediction", validation_alias="quantum_prediction")
    quantumConfidence: float = Field(..., serialization_alias="quantumConfidence", validation_alias="quantum_confidence")
    classicalPrediction: str = Field(..., serialization_alias="classicalPrediction", validation_alias="classical_prediction")
    classicalConfidence: float = Field(..., serialization_alias="classicalConfidence", validation_alias="classical_confidence")
    riskLevel: str = Field(..., serialization_alias="riskLevel", validation_alias="risk_level")
    riskScore: Optional[float] = Field(None, serialization_alias="riskScore", validation_alias="risk_score")
    morphometricIndex: Optional[float] = Field(None, serialization_alias="morphometricIndex", validation_alias="morphometric_index")
    topDriver: Optional[str] = Field(None, serialization_alias="topDriver", validation_alias="top_driver")
    quantumExecutionTimeMs: Optional[float] = Field(None, serialization_alias="quantumExecutionTimeMs", validation_alias="quantum_execution_time_ms")
    classicalExecutionTimeMs: Optional[float] = Field(None, serialization_alias="classicalExecutionTimeMs", validation_alias="classical_execution_time_ms")
    inputFeatures: Optional[Dict[str, Any]] = Field(None, serialization_alias="inputFeatures", validation_alias="input_features")
    gateAttributions: Optional[List[Any]] = Field(None, serialization_alias="gateAttributions", validation_alias="gate_attributions")
    shapAttributions: Optional[Union[List[Any], Dict[str, Any]]] = Field(None, serialization_alias="shapAttributions", validation_alias="shap_attributions")
    hardwareReceipt: Optional[Dict[str, Any]] = Field(None, serialization_alias="hardwareReceipt", validation_alias="hardware_receipt")
    aiSynthesis: Optional[Dict[str, Any]] = Field(None, serialization_alias="aiSynthesis", validation_alias="ai_synthesis")
    clinicalNote: Optional[str] = Field(None, serialization_alias="clinicalNote", validation_alias="clinical_note")
    createdAt: datetime = Field(..., serialization_alias="createdAt", validation_alias="created_at")

    model_config = {
        "populate_by_name": True,
        "from_attributes": True,
        "extra": "ignore",
    }
