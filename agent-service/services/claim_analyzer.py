"""Claim analysis service - uses LLM or returns structured mock data.

To integrate with ArbitralAgent or an LLM API, replace the mock functions
with actual LLM calls. The mock data demonstrates the expected output structure.
"""

import json
import re


def analyze_claims(
    patent_number: str,
    patent_title: str,
    claims_text: str,
    accused_description: str,
    technical_field: str,
) -> dict:
    """Analyze patent claims and perform infringement comparison.

    TODO: Replace with actual LLM integration via ArbitralAgent or direct API call.
    For now returns structured mock analysis based on input parsing.
    """

    # Parse independent claims from text (simple heuristic)
    independent_claims = _parse_claims(claims_text)

    # Build claim interpretation
    claim_interpretation = {
        "independentClaims": independent_claims,
        "dependentClaims": [],
    }

    # Build infringement comparison
    if independent_claims:
        features = independent_claims[0].get("technicalFeatures", [])
        feature_comparisons = []
        for feat in features:
            feature_comparisons.append({
                "feature": feat,
                "claimElement": feat,
                "accusedElement": f"被控产品涉及{feat}的技术方案",
                "comparison": "identical",
                "reasoning": f"基于{accused_description}的技术描述，被控产品包含与'{feat}'相同或等同的技术特征",
            })

        infringement_comparison = {
            "featureComparisons": feature_comparisons,
            "overallConclusion": f"经分析，被控产品与{patent_title}的独立权利要求在核心技术特征上高度吻合，存在侵权可能性",
            "literalInfringement": len(feature_comparisons) > 0,
            "doctrineOfEquivalents": "即使部分技术特征存在细微差异，采用等同原则仍可能构成侵权",
        }
    else:
        infringement_comparison = {
            "featureComparisons": [],
            "overallConclusion": "无法从提供的权利要求文本中解析出独立权利要求",
            "literalInfringement": False,
            "doctrineOfEquivalents": "需要更完整的权利要求文本",
        }

    return {
        "claimInterpretation": claim_interpretation,
        "infringementComparison": infringement_comparison,
        "confidence": 0.75 if independent_claims else 0.3,
        "reasoning": f"基于{patent_number}({patent_title})的权利要求文本分析，技术领域：{technical_field}",
    }


def _parse_claims(claims_text: str) -> list[dict]:
    """Simple claim parser - extracts numbered claims and their features."""
    claims = []

    # Try to find numbered claims (e.g., "1.", "权利要求1", "Claim 1")
    claim_pattern = re.compile(
        r'(?:权利要求\s*)?(\d+)[.、:：]\s*(.+?)(?=(?:权利要求\s*)?\d+[.、:：]|$)',
        re.DOTALL
    )

    matches = claim_pattern.findall(claims_text)

    if not matches and claims_text.strip():
        # If no numbered claims found, treat entire text as one claim
        claims.append({
            "claimNumber": 1,
            "text": claims_text.strip()[:500],
            "technicalFeatures": _extract_features(claims_text),
            "interpretation": "独立权利要求，保护核心技术方案",
        })
    else:
        for num_str, text in matches[:3]:  # Limit to first 3 claims
            num = int(num_str)
            claim_text = text.strip()[:500]
            features = _extract_features(claim_text)
            claims.append({
                "claimNumber": num,
                "text": claim_text,
                "technicalFeatures": features,
                "interpretation": f"权利要求{num}的技术方案解读",
            })

    return claims


def _extract_features(text: str) -> list[str]:
    """Extract technical features from claim text using simple heuristics."""
    # Split by common Chinese delimiters
    features = re.split(r'[；;，,]', text)
    features = [f.strip() for f in features if len(f.strip()) > 4]
    return features[:6]  # Limit to 6 features
