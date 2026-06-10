from pydantic import BaseModel
from typing import Optional


class ChatMessage(BaseModel):
    role: str
    content: str


class ClaimAnalysisRequest(BaseModel):
    patentNumber: str
    patentTitle: str
    claimsText: str
    accusedProductDescription: str
    technicalField: str


class ClaimInterpretationItem(BaseModel):
    claimNumber: int
    text: str
    technicalFeatures: list[str]
    interpretation: str


class FeatureComparison(BaseModel):
    feature: str
    claimElement: str
    accusedElement: str
    comparison: str  # identical | equivalent | different | missing
    reasoning: str


class ClaimAnalysisResponse(BaseModel):
    claimInterpretation: dict
    infringementComparison: dict
    confidence: float
    reasoning: str
