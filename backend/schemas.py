from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from enum import Enum
from datetime import datetime

class ConfidenceLevel(str, Enum):
    high = "high"
    medium = "medium"
    low = "low"

class ExtractedField(BaseModel):
    value: Optional[str] = Field(description="The extracted string value. If a required field is missing, return null.")
    confidence: Optional[ConfidenceLevel] = Field(description="Confidence flag: high, medium, or low based on how clearly it appears in the source.")
    note: Optional[str] = Field(None, description="If returning null, include a note explaining why.")

# We can enforce specific types via Pydantic schema
class InvoiceExtraction(BaseModel):
    vendor: ExtractedField
    date: ExtractedField
    total: ExtractedField
    line_items: List[ExtractedField] = Field(description="Extracted line items from the invoice.")

class ResumeExtraction(BaseModel):
    name: ExtractedField
    skills: List[ExtractedField] = Field(description="List of skills.")
    experience: ExtractedField
    education: ExtractedField

class ExtractionResponse(BaseModel):
    id: int
    filename: str
    document_type: str
    timestamp: datetime
    data: Dict[str, Any]

class ErrorResponse(BaseModel):
    detail: str
