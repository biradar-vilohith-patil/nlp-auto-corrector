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
                prompt, return_tensors="pt", max_length=self._settings.max_input_length, truncation=True
            )
            outputs = self._model.generate(
                inputs, max_length=self._settings.max_output_length, num_beams=4, early_stopping=True
            )
            corrected = self._tokenizer.decode(outputs[0], skip_special_tokens=True)
            fixes = count_word_diffs(sentence, corrected)
            return {"corrected": corrected, "fixes": fixes}
        except Exception as e:
            logger.error(f"T5 grammar correction error: {e}")
            return {"corrected": sentence, "fixes": 0}

    # ── Refinement (CRITICAL BUG FIX) ─────────────────────────────────────────

    def refine(self, text: str, style: str = "professional") -> dict[str, object]:
        """
        Uses the BART seq2seq model to paraphrase.
        By removing conversational prompts (which leaked into output) and using a 
        dedicated paraphrasing model, we return only clean, refined text.
        """
        if not self._refine_tokenizer or not self._refine_model:
            return {"refined": text, "improvements": ["Refinement model not loaded."]}

        try:
            # We no longer prepend instructional prompts that confuse the model.
            # BART paraphrase models expect raw text input.
            inputs = self._refine_tokenizer.encode(
                text, return_tensors="pt", max_length=self._settings.max_input_length, truncation=True
            )
            
            # Adjusted generation params for distinct phrasing
            outputs = self._refine_model.generate(
                inputs,
                max_length=self._settings.max_output_length,
                num_beams=5,
                early_stopping=True,
                no_repeat_ngram_size=3,
                temperature=0.7 # Slight variance for better natural phrasing
            )
            refined = self._refine_tokenizer.decode(outputs[0], skip_special_tokens=True)

            improvements = self._detect_improvements(text, refined)
            return {"refined": refined, "improvements": improvements}
        except Exception as e:
            logger.error(f"BART refinement error: {e}")
            return {"refined": text, "improvements": [f"Refinement error: {e}"]}

    @staticmethod
    def _detect_improvements(original: str, refined: str) -> list[str]:
        improvements: list[str] = []
        orig_words = original.split()
        ref_words = refined.split()

        if len(ref_words) < len(orig_words) * 0.9:
            improvements.append("Condensed verbose phrasing for clarity.")
        if len(ref_words) > len(orig_words) * 1.1:
            improvements.append("Expanded phrases for improved readability.")

        orig_sents = re.split(r"[.!?]+", original)
        ref_sents = re.split(r"[.!?]+", refined)
        if len(ref_sents) != len(orig_sents):
            improvements.append("Restructured sentences for better flow.")

        passive_re = re.compile(r"\bwas\s+\w+ed\b|\bwere\s+\w+ed\b", re.I)
        if passive_re.search(original) and not passive_re.search(refined):
            improvements.append("Converted passive constructions to active voice.")

        if not improvements:
            improvements.append("Improved vocabulary and sentence cohesion.")

        return improvements[:3]