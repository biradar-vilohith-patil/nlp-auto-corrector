"""
app/api/routes.py
─────────────────
All REST endpoints for the WriteRight API.
"""

from __future__ import annotations
from fastapi import APIRouter, Request, HTTPException
from pydantic import BaseModel, Field, field_validator
from loguru import logger
import time

from app.config import get_settings

router = APIRouter()
settings = get_settings()

# ── Request / Response schemas ────────────────────────────────────────────────

class CorrectionRequest(BaseModel):
    text: str = Field(..., min_length=1, max_length=4096)
    run_spell: bool = Field(True)
    run_grammar: bool = Field(True)
    run_homophones: bool = Field(True)

    @field_validator("text")
    @classmethod
    def strip_and_validate(cls, v: str) -> str:
        v = v.strip()
        if not v: raise ValueError("text must not be blank")
        return v

class DiffEntry(BaseModel):
    original: str
    corrected: str
    type: str
    position: int

class CorrectionResponse(BaseModel):
    original: str
    corrected: str
    spell_fixed: int
    grammar_fixed: int
    homophone_fixed: int
    confidence: float
    diffs: list[DiffEntry]
    processing_ms: float

class RefineRequest(BaseModel):
    text: str = Field(..., min_length=1, max_length=4096)
    style: str = Field("professional")

class RefineResponse(BaseModel):
    original: str
    refined: str
    improvements: list[str]
    processing_ms: float

# ── Endpoints ─────────────────────────────────────────────────────────────────

@router.post("/correct", response_model=CorrectionResponse, tags=["NLP"])
async def correct_text(body: CorrectionRequest, request: Request):
    proc = request.app.state.processor
    t0 = time.perf_counter()

    try:
        result = await proc.correct(
            text=body.text,
            run_spell=body.run_spell,
            run_grammar=body.run_grammar,
            run_homophones=body.run_homophones,
        )
    except Exception as e:
        logger.error(f"/correct error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

    elapsed_ms = (time.perf_counter() - t0) * 1000

    return CorrectionResponse(
        original=body.text,
        corrected=result["corrected"],
        spell_fixed=result["spell_fixed"],
        grammar_fixed=result["grammar_fixed"],
        homophone_fixed=result["homophone_fixed"],
        confidence=result["confidence"],
        diffs=[DiffEntry(**d) for d in result["diffs"]],
        processing_ms=round(elapsed_ms, 1),
    )

@router.post("/refine", response_model=RefineResponse, tags=["NLP"])
async def refine_text(body: RefineRequest, request: Request):
    proc = request.app.state.processor
    t0 = time.perf_counter()

    try:
        result = await proc.refine(text=body.text, style=body.style)
    except Exception as e:
        logger.error(f"/refine error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

    elapsed_ms = (time.perf_counter() - t0) * 1000

    return RefineResponse(
        original=body.text,
        refined=result["refined"],
        improvements=result["improvements"],
        processing_ms=round(elapsed_ms, 1),
    )