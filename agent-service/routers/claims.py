"""Claim interpretation and infringement comparison router."""
import json
from fastapi import APIRouter
from routers import ClaimAnalysisRequest, ClaimAnalysisResponse
from services.claim_analyzer import analyze_claims

router = APIRouter()


@router.post("/analyze-claims", response_model=ClaimAnalysisResponse)
async def analyze_claims_endpoint(req: ClaimAnalysisRequest):
    """Analyze patent claims and compare with accused product."""
    result = analyze_claims(
        patent_number=req.patentNumber,
        patent_title=req.patentTitle,
        claims_text=req.claimsText,
        accused_description=req.accusedProductDescription,
        technical_field=req.technicalField,
    )
    return result
