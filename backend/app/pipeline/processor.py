"""
app/pipeline/processor.py
──────────────────────────
Orchestrates the full NLP correction pipeline:
  Pre-process → Spell → Homophones → Grammar → Score → Diff
"""

from __future__ import annotations
import asyncio
from loguru import logger

from app.config import Settings
from app.pipeline.spell_checker import SpellChecker
from app.pipeline.homophone_resolver import HomophoneResolver
from app.pipeline.grammar_corrector import GrammarCorrector
from app.pipeline.scorer import Scorer
from app.models.model_loader import ModelLoader
from app.utils.text_utils import split_into_sentences, normalise_whitespace, build_word_diffs

class NLPProcessor:
    def __init__(self, settings: Settings):
        self._settings = settings
        self.spacy_ready: bool = False
        self.symspell_ready: bool = False
        self.t5_ready: bool = False

        self._spell_checker: SpellChecker | None = None
        self._homophone_resolver: HomophoneResolver | None = None
        self._grammar_corrector: GrammarCorrector | None = None
        self._scorer: Scorer | None = None
        self._model_loader: ModelLoader | None = None

    async def initialise(self) -> None:
        logger.info("Initialising NLP pipeline…")
        loop = asyncio.get_event_loop()
        await loop.run_in_executor(None, self._load_all)
        logger.info(f"Pipeline ready | spaCy={self.spacy_ready} SymSpell={self.symspell_ready} T5={self.t5_ready}")

    def _load_all(self) -> None:
        s = self._settings
        self._model_loader = ModelLoader(s)
        
        # Unpack both models
        nlp, t5_tok, t5_mod, bart_tok, bart_mod = self._model_loader.load()

        if nlp: self.spacy_ready = True

        self._spell_checker = SpellChecker(s)
        if self._spell_checker.load(): self.symspell_ready = True

        self._homophone_resolver = HomophoneResolver(s)
        self._homophone_resolver.load()

        # Inject both models into the corrector
        self._grammar_corrector = GrammarCorrector(s, t5_tok, t5_mod, bart_tok, bart_mod)
        if t5_tok and t5_mod: self.t5_ready = True

        self._scorer = Scorer(nlp)

    async def correct(self, text: str, run_spell: bool = True, run_grammar: bool = True, run_homophones: bool = True) -> dict:
        loop = asyncio.get_event_loop()
        return await loop.run_in_executor(None, self._correct_sync, text, run_spell, run_grammar, run_homophones)

    def _correct_sync(self, text: str, run_spell: bool, run_grammar: bool, run_homophones: bool) -> dict:
        original = text
        spell_fixed = grammar_fixed = homophone_fixed = 0
        all_diffs: list[dict] = []

        current = normalise_whitespace(text)

        if run_spell and self._spell_checker and self.symspell_ready:
            spell_result = self._spell_checker.correct(current)
            if spell_result["corrected"] != current:
                diffs = build_word_diffs(current, spell_result["corrected"], "spell")
                all_diffs.extend(diffs)
                spell_fixed = spell_result["fixes"]
                current = spell_result["corrected"]

        if run_homophones and self._homophone_resolver:
            hom_result = self._homophone_resolver.resolve(current)
            if hom_result["corrected"] != current:
                diffs = build_word_diffs(current, hom_result["corrected"], "homophone")
                all_diffs.extend(diffs)
                homophone_fixed = hom_result["fixes"]
                current = hom_result["corrected"]

        if run_grammar and self._grammar_corrector:
            sentences = split_into_sentences(current)
            corrected_sentences = []
            for sent in sentences:
                gram_result = self._grammar_corrector.correct(sent)
                corrected_sentences.append(gram_result["corrected"])
                grammar_fixed += gram_result["fixes"]

            grammar_text = " ".join(corrected_sentences)
            if grammar_text != current:
                diffs = build_word_diffs(current, grammar_text, "grammar")
                all_diffs.extend(diffs)
                current = grammar_text

        confidence = 1.0
        if self._scorer:
            confidence = self._scorer.score(original, current)

        return {
            "corrected": current,
            "spell_fixed": spell_fixed,
            "grammar_fixed": grammar_fixed,
            "homophone_fixed": homophone_fixed,
            "confidence": round(confidence, 3),
            "diffs": all_diffs,
        }

    async def refine(self, text: str, style: str = "professional") -> dict:
        loop = asyncio.get_event_loop()
        return await loop.run_in_executor(None, self._refine_sync, text, style)

    def _refine_sync(self, text: str, style: str) -> dict:
        if self._grammar_corrector:
            return self._grammar_corrector.refine(text, style)
        return {"refined": text, "improvements": ["Model not loaded; no refinement applied."]}