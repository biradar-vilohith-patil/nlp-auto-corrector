from __future__ import annotations
import re
from pathlib import Path
from loguru import logger
from app.config import Settings

try:
    from symspellpy import SymSpell, Verbosity
    SYMSPELL_AVAILABLE = True
except ImportError:
    SYMSPELL_AVAILABLE = False
    logger.warning("symspellpy not installed.")

_SKIP_PATTERNS = re.compile(r"^https?://|^www\.\d|^[A-Z]{2,}$|^[A-Z][a-z]+[A-Z]", re.VERBOSE)

class SpellChecker:
    def __init__(self, settings: Settings):
        self._settings = settings
        self._sym: SymSpell | None = None

    def load(self) -> bool:
        if not SYMSPELL_AVAILABLE: return False
        self._sym = SymSpell(
            max_dictionary_edit_distance=self._settings.spell_max_edit_distance,
            prefix_length=self._settings.spell_prefix_length,
        )
        try:
            import pkg_resources
            freq_dict = pkg_resources.resource_filename("symspellpy", "frequency_dictionary_en_82_765.txt")
            self._sym.load_dictionary(freq_dict, term_index=0, count_index=1)
            return True
        except Exception as e:
            logger.error(f"Could not load dictionary: {e}")
            return False

    def correct(self, text: str) -> dict[str, object]:
        if not self._sym: return {"corrected": text, "fixes": 0}
        tokens = re.split(r"(\s+)", text)
        fixes = 0
        out_tokens = []
        for token in tokens:
            if re.match(r"^\s+$", token):
                out_tokens.append(token)
                continue
            corrected_token = self._correct_token(token)
            if corrected_token.lower() != token.lower(): fixes += 1
            out_tokens.append(corrected_token)
        return {"corrected": "".join(out_tokens), "fixes": fixes}

    def _correct_token(self, token: str) -> str:
        m = re.match(r"^([^a-zA-Z']*)([a-zA-Z']+)([^a-zA-Z']*)$", token)
        if not m: return token
        pre, word, post = m.group(1), m.group(2), m.group(3)
        if len(word) <= self._settings.min_word_length_for_spell or _SKIP_PATTERNS.match(token):
            return token
        suggestions = self._sym.lookup(word.lower(), Verbosity.CLOSEST, max_edit_distance=self._settings.spell_max_edit_distance, include_unknown=True)
        if not suggestions: return token
        best = suggestions[0].term
        if word.isupper(): best = best.upper()
        elif word[0].isupper(): best = best.capitalize()
        return pre + best + post