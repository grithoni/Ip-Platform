"""Patent Dispute Neutral Evaluation Platform - AI Agent Service"""
import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers import claims, valuation

app = FastAPI(
    title="专利评估 AI 服务",
    description="专利纠纷中立评估平台 - AI 分析服务",
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(claims.router, prefix="/api", tags=["claims"])
app.include_router(valuation.router, prefix="/api", tags=["valuation"])


@app.get("/api/health")
async def health_check():
    return {"status": "ok", "service": "patent-evaluation-agent"}


if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("API_PORT", "8100"))
    uvicorn.run(app, host="0.0.0.0", port=port)
