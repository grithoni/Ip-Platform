"""Patent valuation router."""
from fastapi import APIRouter
from pydantic import BaseModel
from typing import Optional
from services.patent_valuator import valuate_patent

router = APIRouter()


class ValuationRequest(BaseModel):
    patentNumber: str
    patentTitle: str
    technicalField: str
    remainingLife: int
    claimScope: str
    marketData: Optional[str] = None
    comparableLicenses: Optional[str] = None


class ValuationResponse(BaseModel):
    methods: dict
    recommendedRange: dict
    currency: str
    assumptions: list[str]
    sensitivityAnalysis: list[dict]


@router.post("/valuate-patent", response_model=ValuationResponse)
async def valuate_patent_endpoint(req: ValuationRequest):
    """Evaluate patent value using multiple methods."""
    result = valuate_patent(
        patent_number=req.patentNumber,
        patent_title=req.patentTitle,
        technical_field=req.technicalField,
        remaining_life=req.remainingLife,
        claim_scope=req.claimScope,
        market_data=req.marketData,
        comparable_licenses=req.comparableLicenses,
    )
    return result
