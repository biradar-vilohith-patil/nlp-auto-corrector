from __future__ import annotations
import re
from loguru import logger
from app.config import Settings


def _cap(correct: str):
    """
    Returns a regex sub-callable that replaces group(1) with `correct`,
    preserving the original word's casing (ALL-CAPS, Title, lowercase).
    """
    def _replacer(m: re.Match) -> str:
        orig = m.group(1)
        if orig.isupper():
            return correct.upper()
        if len(orig) > 0 and orig[0].isupper():
            return correct[0].upper() + correct[1:]
        return correct
    return _replacer


# ── Rules ──────────────────────────────────────────────────────────────────────
#
# Format: (compiled_pattern, replacer_callable)
#
# IMPORTANT DESIGN:
#   Every pattern MUST capture the wrong word in group(1) only.
#   Surrounding context uses zero-width lookaheads/lookbehinds so the rest of
#   the text is never consumed or replaced.  The replacer receives m.group(1)
#   (the wrong word) and returns the correct word with case preserved.
#
#   For the "then → than" rule Python forbids variable-length lookbehinds, so
#   the comparative word is captured in group(1) and reconstructed in the lambda.
#
_RULES: list[tuple[re.Pattern, object]] = [

    # ── Misspelling ─────────────────────────────────────────────────────────
    (re.compile(r'\b(thier)\b', re.I), _cap('their')),

    # ── their → there ────────────────────────────────────────────────────────
    # "their" before a be-verb / auxiliary is almost always "there"
    (re.compile(
        r'\b(their)\b(?=\s+(?:is|are|was|were|will|would|has|have|had|been'
        r'|might|could|should|shall|may|can|also|no|not|a\b|an\b|the\b))',
        re.I,
    ), _cap('there')),

    # ── your → you're ────────────────────────────────────────────────────────
    # "your" before a verb / adjective that implies "you are"
    (re.compile(
        r"\b(your)\b(?=\s+(?:going|coming|doing|being|welcome|right|wrong|late"
        r"|early|sure|correct|incorrect|amazing|awesome|great|good|bad|terrible"
        r"|wonderful|beautiful|not|probably|definitely|always|never|so|very|too"
        r"|just|still|already|really|clearly|obviously|kidding|joking|lying"
        r"|trying|working|helping|leaving|staying|running|talking|thinking"
        r"|making|taking|getting|giving|showing|telling|asking|looking|feeling"
        r"|seeing|hearing|knowing|wanting|needing|having|becoming|remaining"
        r"|seeming|appearing|turning))",
        re.I,
    ), _cap("you're")),

    # "youre" bare misspelling → "you're"
    (re.compile(r"\b(youre)\b", re.I), _cap("you're")),

    # ── its → it's ───────────────────────────────────────────────────────────
    # "its" before a predicate adjective / adverb → "it's" (= it is)
    (re.compile(
        r"\b(its)\b(?=\s+(?:been|going|not|also|important|possible|clear|true"
        r"|false|good|bad|easy|hard|difficult|necessary|obvious|likely|unlikely"
        r"|time|ok|okay|fine|great|nice|funny|interesting|amazing|incredible"
        r"|ridiculous|terrible|awful|wonderful|beautiful|strange|weird|odd"
        r"|unusual|rare|common|normal|natural|expected|surprising|shocking"
        r"|disappointing|frustrating|exciting|boring|worth|meant|about|part))",
        re.I,
    ), _cap("it's")),

    # ── then → than (comparative) ────────────────────────────────────────────
    # Python disallows variable-length lookbehinds, so we capture the
    # comparative word + trailing space as group(1) and append "than" in the lambda.
    (re.compile(
        r'\b((?:more|less|better|worse|rather|other|greater|smaller|higher|lower'
        r'|older|younger|faster|slower|bigger|larger|longer|shorter|later|earlier'
        r'|sooner|harder|easier|further|closer|different|stronger|weaker|louder'
        r'|quieter|smarter|richer|poorer|healthier)\s+)then\b',
        re.I,
    ), lambda m: m.group(1) + 'than'),

    # ── to → too ─────────────────────────────────────────────────────────────
    # "to" before a degree adverb → "too"
    (re.compile(
        r'\b(to)\b(?=\s+(?:much|many|late|soon|early|far|long|big|fast|slow'
        r'|hard|easy|bad|good|hot|cold|little|few|often|quickly|slowly|loudly'
        r'|softly|frequently|rarely|seldom|heavily|rapidly|deeply|strongly'
        r'|highly|greatly|seriously|severely|extremely|incredibly|amazingly'
        r'|surprisingly|remarkably|significantly|considerably))',
        re.I,
    ), _cap('too')),

    # ── weather → whether ────────────────────────────────────────────────────
    (re.compile(r'\b(weather)\b(?=\s+or\s+not\b)', re.I), _cap('whether')),
]


class HomophoneResolver:
    def __init__(self, settings: Settings):
        self._settings = settings

    def load(self) -> bool:
        return True  # Rules are compiled at module import time

    def resolve(self, text: str) -> dict[str, object]:
        fixes = 0
        result = text
        for pattern, replacer in _RULES:
            new_result = pattern.sub(replacer, result)
            if new_result != result:
                fixes += 1
                result = new_result
        return {'corrected': result, 'fixes': fixes}
