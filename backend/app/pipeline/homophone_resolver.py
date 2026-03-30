from __future__ import annotations
import re
from loguru import logger
from app.config import Settings

_RULES = [
    (re.compile(r"\bthier\b", re.I), "thier", "their"),
    (re.compile(r"\btheir\s+is\b", re.I), "their is", "there is"),
    (re.compile(r"\byour\s+(?:going|coming|doing|being)\b", re.I), "your", "you're"),
    (re.compile(r"\byoure\b", re.I), "youre", "you're"),
    (re.compile(r"\bits\s+(?:a|an|the|not|been|going)\b", re.I), "its", "it's"),
    (re.compile(r"\b(?:more|less|better|worse)\s+then\b", re.I), "then", "than"),
    (re.compile(r"\bto\s+(?:much|many|late|soon)\b", re.I), "to much", "too much"),
    (re.compile(r"\bweather\s+or\s+not\b", re.I), "weather", "whether"),
]

class HomophoneResolver:
    def __init__(self, settings: Settings):
        self._settings = settings

    def load(self) -> bool:
        return True # Relying on heuristic rules for speed

    def resolve(self, text: str) -> dict[str, object]:
        fixes = 0
        result = text
        for pattern, wrong, correct in _RULES:
            if pattern.search(result):
                old = result
                result = self._replace_preserving_case(result, wrong, correct)
                if result != old: fixes += 1
        return {"corrected": result, "fixes": fixes}

    @staticmethod
    def _replace_preserving_case(text: str, wrong: str, correct: str) -> str:
        def replacer(m: re.Match) -> str:
            original = m.group(0)
            if original.isupper(): return correct.upper()
            if original[0].isupper(): return correct.capitalize()
            return correct
        return re.sub(re.escape(wrong), replacer, text, flags=re.IGNORECASE)