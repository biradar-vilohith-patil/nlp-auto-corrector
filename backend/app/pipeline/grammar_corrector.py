"""
app/pipeline/grammar_corrector.py
───────────────────────────────────
Handles two independent tasks:
1. Grammar Correction (T5)
2. Text Refinement & Style Paraphrasing (BART)
"""

from __future__ import annotations
import re
from loguru import logger
from app.config import Settings
from app.utils.text_utils import count_word_diffs


# ── Style-specific generation configs ─────────────────────────────────────────
# Each style uses distinct beam/length/sampling params so BART produces
# genuinely different output for each selection.

_STYLE_PARAMS: dict[str, dict] = {
    "professional": {
        # Formal, complete, polished — moderate length, conservative beams
        "num_beams": 6,
        "length_penalty": 1.4,
        "no_repeat_ngram_size": 3,
        "early_stopping": True,
    },
    "casual": {
        # Relaxed, conversational — sampling adds natural variation,
        # shorter length penalty keeps it breezy
        "num_beams": 4,
        "length_penalty": 0.7,
        "no_repeat_ngram_size": 2,
        "early_stopping": True,
        "do_sample": True,
        "temperature": 1.25,
        "top_p": 0.92,
    },
    "academic": {
        # Elaborate, formal, thorough — high beams, strong length bonus
        # forces BART to explore longer, more structured paraphrases
        "num_beams": 8,
        "length_penalty": 2.8,
        "no_repeat_ngram_size": 4,
        "early_stopping": True,
    },
    "concise": {
        # Brevity first — negative length penalty penalises long outputs,
        # hard max_length cap ensures the output is noticeably shorter
        "num_beams": 4,
        "length_penalty": -2.0,
        "no_repeat_ngram_size": 3,
        "early_stopping": True,
        "max_length": 80,   # hard cap; overrides settings.max_output_length
    },
}

# Style-specific input prefixes.  BART paraphrase models were trained on raw
# text, but a short instruction prefix shifts the output distribution enough
# to reinforce the generation-param differences above.
_STYLE_PREFIXES: dict[str, str] = {
    "professional": "Rewrite formally and professionally: ",
    "casual":       "Rewrite in a friendly, conversational way: ",
    "academic":     "Rewrite in formal academic language: ",
    "concise":      "Rewrite as briefly as possible: ",
}

# Human-readable improvement labels shown in the UI chip
_STYLE_LABELS: dict[str, str] = {
    "professional": "Rewritten in a clear, professional tone.",
    "casual":       "Rewritten in a friendly, conversational style.",
    "academic":     "Rewritten in formal academic language with precise vocabulary.",
    "concise":      "Condensed to essential information only.",
}


class GrammarCorrector:
    def __init__(self, settings: Settings, tokenizer_t5, model_t5, tokenizer_bart, model_bart):
        self._settings = settings

        # Grammar dependencies
        self._tokenizer = tokenizer_t5
        self._model = model_t5

        # Refinement dependencies
        self._refine_tokenizer = tokenizer_bart
        self._refine_model = model_bart

    # ── Grammar correction ────────────────────────────────────────────────────

    def correct(self, sentence: str) -> dict[str, object]:
        if not self._tokenizer or not self._model:
            return {"corrected": sentence, "fixes": 0}

        sentence = sentence.strip()
        if not sentence:
            return {"corrected": sentence, "fixes": 0}

        try:
            prompt = self._settings.model_prefix + sentence
            inputs = self._tokenizer.encode(
                prompt, return_tensors="pt",
                max_length=self._settings.max_input_length, truncation=True
            )
            outputs = self._model.generate(
                inputs, max_length=self._settings.max_output_length,
                num_beams=4, early_stopping=True
            )
            corrected = self._tokenizer.decode(outputs[0], skip_special_tokens=True)
            fixes = count_word_diffs(sentence, corrected)
            return {"corrected": corrected, "fixes": fixes}
        except Exception as e:
            logger.error(f"T5 grammar correction error: {e}")
            return {"corrected": sentence, "fixes": 0}

    # ── Refinement ────────────────────────────────────────────────────────────

    def refine(self, text: str, style: str = "professional") -> dict[str, object]:
        """
        Uses the BART paraphrase model to rewrite `text` in the requested
        `style`.  Each style uses a distinct instruction prefix AND distinct
        generation hyper-parameters so the four options produce genuinely
        different outputs.
        """
        if not self._refine_tokenizer or not self._refine_model:
            return {"refined": text, "improvements": ["Refinement model not loaded."]}

        # Normalise and validate style
        style = (style or "professional").lower().strip()
        if style not in _STYLE_PARAMS:
            style = "professional"

        try:
            # ── Build style-aware input ──────────────────────────────────────
            prefix = _STYLE_PREFIXES[style]
            prompted_text = prefix + text

            inputs = self._refine_tokenizer.encode(
                prompted_text,
                return_tensors="pt",
                max_length=self._settings.max_input_length,
                truncation=True,
            )

            # ── Compute style-aware min_length ───────────────────────────────
            # Forces BART to generate something substantively different from
            # the (already short) corrected text rather than echoing it back.
            word_count = len(text.split())
            if style == "concise":
                # Concise: allow output as short as 40 % of input words
                min_len = max(5, int(word_count * 0.4))
            elif style == "academic":
                # Academic: encourage elaboration — at least 80 % of input length
                min_len = max(20, int(word_count * 0.8))
            else:
                # Professional / casual: at least 60 % of input length
                min_len = max(10, int(word_count * 0.6))

            # ── Merge style params with dynamic values ────────────────────────
            gen_params = dict(_STYLE_PARAMS[style])  # shallow copy — do not mutate module-level dict

            # Use hard max_length from style if set, else fall back to settings
            if "max_length" not in gen_params:
                gen_params["max_length"] = self._settings.max_output_length

            # ── Generate ─────────────────────────────────────────────────────
            outputs = self._refine_model.generate(
                inputs,
                min_length=min_len,
                **gen_params,
            )
            refined = self._refine_tokenizer.decode(outputs[0], skip_special_tokens=True)

            # Strip the prefix if the model echoed it back into the output
            for pfx in _STYLE_PREFIXES.values():
                if refined.lower().startswith(pfx.lower()):
                    refined = refined[len(pfx):].strip()
                    break

            improvements = self._detect_improvements(text, refined, style)
            return {"refined": refined, "improvements": improvements}

        except Exception as e:
            logger.error(f"BART refinement error: {e}")
            return {"refined": text, "improvements": [f"Refinement error: {e}"]}

    # ── Improvement detection ─────────────────────────────────────────────────

    @staticmethod
    def _detect_improvements(original: str, refined: str, style: str = "professional") -> list[str]:
        improvements: list[str] = []

        # Always lead with the style label so the UI chip is informative
        if style in _STYLE_LABELS:
            improvements.append(_STYLE_LABELS[style])

        orig_words = original.split()
        ref_words  = refined.split()

        if len(ref_words) < len(orig_words) * 0.85:
            improvements.append("Condensed verbose phrasing for clarity.")
        elif len(ref_words) > len(orig_words) * 1.15:
            improvements.append("Expanded phrases for improved readability.")

        orig_sents = re.split(r"[.!?]+", original)
        ref_sents  = re.split(r"[.!?]+", refined)
        if len(ref_sents) != len(orig_sents):
            improvements.append("Restructured sentences for better flow.")

        passive_re = re.compile(r"\bwas\s+\w+ed\b|\bwere\s+\w+ed\b", re.I)
        if passive_re.search(original) and not passive_re.search(refined):
            improvements.append("Converted passive constructions to active voice.")

        # Keep at most 3 chips in the UI
        return improvements[:3]
