"""
app/models/model_loader.py
───────────────────────────
Loads and caches:
  • spaCy en_core_web_sm  — for tokenisation, POS tagging, NER
  • HuggingFace T5        — for grammar correction
  • HuggingFace BART      — for stylistic text refinement (paraphrasing)
"""

from __future__ import annotations
from loguru import logger
from app.config import Settings

class ModelLoader:
    def __init__(self, settings: Settings):
        self._settings = settings

    def load(self) -> tuple:
        """
        Returns (nlp, tokenizer_t5, model_t5, tokenizer_bart, model_bart).
        """
        nlp = self._load_spacy()
        t5_tok, t5_mod = self._load_hf_model(self._settings.model_name, "Grammar (T5)")
        bart_tok, bart_mod = self._load_hf_model(self._settings.refine_model_name, "Refine (BART)")
        return nlp, t5_tok, t5_mod, bart_tok, bart_mod

    def _load_spacy(self):
        try:
            import spacy
            logger.info(f"Loading spaCy model: {self._settings.spacy_model}")
            nlp = spacy.load(
                self._settings.spacy_model,
                disable=["ner"] if self._settings.skip_spell_for_proper_nouns else [],
            )
            return nlp
        except Exception as e:
            logger.error(f"spaCy load error: {e}")
            return None

    def _load_hf_model(self, model_name: str, label: str) -> tuple:
        try:
            from transformers import AutoTokenizer, AutoModelForSeq2SeqLM
            device = self._settings.model_device

            logger.info(f"Loading {label} model: {model_name} on {device}")
            tokenizer = AutoTokenizer.from_pretrained(model_name)
            model = AutoModelForSeq2SeqLM.from_pretrained(model_name)

            if device == "cuda":
                try:
                    model = model.to("cuda")
                except Exception:
                    logger.warning("CUDA unavailable, using CPU.")

            model.eval()
            logger.info(f"{label} model loaded successfully.")
            return tokenizer, model

        except Exception as e:
            logger.error(f"{label} load error: {e}")
            return None, None