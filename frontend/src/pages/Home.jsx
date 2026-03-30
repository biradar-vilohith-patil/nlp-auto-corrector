/**
 * pages/Home.jsx
 * ──────────────
 * Split-panel layout. Left = TextEditor, Right = CorrectionPanel.
 * Hero title with scroll-based parallax inspired by Chrome's download UX.
 */

import { useState, useCallback, useEffect, useRef } from 'react'
import toast from 'react-hot-toast'
import { motion, useScroll, useTransform, useSpring, AnimatePresence } from 'framer-motion'
import TextEditor from '../components/TextEditor'
import CorrectionPanel from '../components/CorrectionPanel'
import { useTextCorrection } from '../hooks/useTextCorrection'
import { useTextRefinement } from '../hooks/useTextRefinement'

const HERO_TAGS = ['spaCy', 'SymSpell', 'T5 Transformer', 'FastAPI', 'React 18']

export default function Home() {
  const heroRef = useRef(null)
  const { scrollY } = useScroll()

  // Scroll parallax: title drifts up slightly and fades as user scrolls
  const rawY  = useTransform(scrollY, [0, 200], [0, -40])
  const rawOp = useTransform(scrollY, [0, 160], [1, 0])
  const heroY  = useSpring(rawY,  { stiffness: 120, damping: 22 })
  const heroOp = useSpring(rawOp, { stiffness: 120, damping: 22 })

  // RQ mutations
  const {
    mutate: correctMutate,
    data: correctionResult,
    isPending: correctionLoading,
    reset: resetCorrection,
  } = useTextCorrection()

  const {
    mutate: refineMutate,
    data: refineResult,
    isPending: refineLoading,
    reset: resetRefinement,
  } = useTextRefinement()

  // Listen for "back to correction" event from CorrectionPanel
  useEffect(() => {
    function handler() { resetRefinement() }
    window.addEventListener('wr:backToCorrection', handler)
    return () => window.removeEventListener('wr:backToCorrection', handler)
  }, [resetRefinement])

  const handleCorrect = useCallback((text, pipeline) => {
    resetRefinement()
    correctMutate({ text, pipeline })
  }, [correctMutate, resetRefinement])

  const handleRefine = useCallback((style) => {
    if (!correctionResult?.corrected) return
    refineMutate({ text: correctionResult.corrected, style })
  }, [correctionResult, refineMutate])

  const handleClear = useCallback(() => {
    resetCorrection()
    resetRefinement()
  }, [resetCorrection, resetRefinement])

  const isLoading = correctionLoading || refineLoading

  return (
    <div style={{ position: 'relative', zIndex: 1 }}>

      {/* ══════════ HERO ══════════ */}
      <motion.div
        ref={heroRef}
        style={{ y: heroY, opacity: heroOp }}
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
      >
        <div style={{ textAlign: 'center', padding: '48px 0 36px' }}>
          {/* Eyebrow */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              padding: '5px 14px', borderRadius: 100,
              border: '1px solid var(--border2)',
              background: 'var(--surface-alt)',
              fontSize: 11, fontWeight: 600, letterSpacing: '0.07em',
              color: 'var(--muted)', textTransform: 'uppercase',
              marginBottom: 20,
            }}
          >
            <span style={{ color: 'var(--accent)', fontSize: 13 }}>✦</span>
            AI Writing Assistant
          </motion.div>

          {/* Main title */}
          <motion.h1
            className="hero-display"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.18, duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
          >
            Write<em>Right</em>
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            className="hero-sub"
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.28, duration: 0.55 }}
          >
            Paste any text. Fix spelling, resolve grammar, and refine style —
            powered by spaCy, SymSpell, and a T5 transformer.
          </motion.p>

          {/* Tech stack tags */}
          <motion.div
            style={{ display: 'flex', gap: 6, justifyContent: 'center', flexWrap: 'wrap', marginTop: 20 }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            {HERO_TAGS.map((tag, i) => (
              <motion.span
                key={tag}
                style={{
                  padding: '3px 11px', borderRadius: 100,
                  border: '1px solid var(--border)',
                  background: 'var(--surface-alt)',
                  fontSize: 11, fontWeight: 500, color: 'var(--muted2)',
                  letterSpacing: '0.04em',
                }}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.42 + i * 0.06 }}
              >
                {tag}
              </motion.span>
            ))}
          </motion.div>
        </div>
      </motion.div>

      {/* ══════════ DIVIDER ══════════ */}
      <motion.div
        className="divider-text"
        style={{ marginBottom: 0, color: 'var(--muted2)', fontSize: 10.5 }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.55 }}
      >
        Start editing
      </motion.div>

      {/* ══════════ SPLIT GRID ══════════ */}
      <div className="split-grid" style={{ marginTop: 20 }}>

        {/* LEFT — Editor */}
        <TextEditor
          onCorrect={handleCorrect}
          onRefine={handleRefine}
          onClear={handleClear}
          loading={isLoading}
          hasResult={Boolean(correctionResult)}
        />

        {/* RIGHT — Results */}
        <CorrectionPanel
          correctionResult={correctionResult}
          refineResult={refineResult}
          correctionLoading={correctionLoading}
          refineLoading={refineLoading}
          onUseRefined={() => {}}
        />

      </div>
      {/* ══════════ ACADEMIC EVALUATION METRICS DASHBOARD ══════════ */}
      <AnimatePresence>
        {correctionResult && (
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.98 }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            style={{ marginTop: '32px' }}
          >
            <div className="card" style={{ padding: '32px', background: 'var(--surface)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: '24px', borderBottom: '1px solid var(--border)', paddingBottom: '16px' }}>
                <span className="label-dot" style={{ background: 'var(--purple)', width: 8, height: 8 }} />
                <h2 style={{ fontSize: '18px', fontWeight: 700, letterSpacing: '-0.01em', color: 'var(--text)' }}>
                  Text Evaluation Metrics
                </h2>
              </div>
              
              {/* Data Calculation (Handled inline for the UI) */}
              {(() => {
                const errors = (correctionResult.spell_fixed || 0) + (correctionResult.grammar_fixed || 0) + (correctionResult.homophone_fixed || 0);
                const words = correctionResult.original ? correctionResult.original.trim().split(/\s+/).length : 1;
                
                // NEW FORMULA: Accuracy Ratio (Words / (Words + Errors))
                const qualityScore = Math.round((words / (words + errors)) * 100);
const burdenScore = Math.round((words -errors) / words)*100;
                return (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>
                    
                    {/* Panel 1: User Text Quality Score */}
                    <div style={{ padding: '24px', background: 'var(--surface-alt)', borderRadius: '12px', border: '1px solid var(--border)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div>
                          <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-2)' }}>Accuracy Ratio Score</span>
                          <p style={{ fontSize: '12px', color: 'var(--muted)', marginTop: '4px' }}>Proportional evaluation of input validity.</p>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'baseline', gap: '2px' }}>
                          <span style={{ fontSize: '42px', fontWeight: 700, color: qualityScore > 80 ? 'var(--green)' : qualityScore > 50 ? 'var(--amber)' : 'var(--red)' }}>
                            {qualityScore}
                          </span>
                          <span style={{ fontSize: '16px', fontWeight: 600, color: 'var(--muted)' }}>/100</span>
                        </div>
                      </div>
                      
                      {/* Formula Display */}
                      <div style={{ marginTop: '20px', padding: '12px', background: 'var(--bg)', borderRadius: '8px', border: '1px dashed var(--border2)', fontFamily: "'JetBrains Mono', monospace", fontSize: '12px', color: 'var(--muted)' }}>
                        <div style={{ marginBottom: '6px', color: 'var(--text-2)', fontWeight: 500 }}>Applied Formula:</div>
                        <div>Score = (Words / (Words + Errors)) * 100</div>
                        <div style={{ marginTop: '6px', color: 'var(--accent)' }}>Calculation: ({words} / ({words} + {errors})) * 100</div>
                      </div>
                    </div>

                    {/* Panel 2: Error Density (Rho) */}
                    {/* Panel 2: Correction Burden */}
                    <div style={{ padding: '24px', background: 'var(--surface-alt)', borderRadius: '12px', border: '1px solid var(--border)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div>
                          <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-2)' }}>Correction Burden</span>
                          <p style={{ fontSize: '12px', color: 'var(--muted)', marginTop: '4px' }}>Projected number of errors per 100 words.</p>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'baseline', gap: '2px' }}>
                          <span style={{ fontSize: '42px', fontWeight: 700, color: 'var(--accent)' }}>
                            {burdenScore}
                          </span>
                          <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--muted)', marginLeft: '4px' }}>errors</span>
                        </div>
                      </div>
                      
                      {/* Formula Display */}
                      <div style={{ marginTop: '20px', padding: '12px', background: 'var(--bg)', borderRadius: '8px', border: '1px dashed var(--border2)', fontFamily: "'JetBrains Mono', monospace", fontSize: '12px', color: 'var(--muted)' }}>
                        <div style={{ marginBottom: '6px', color: 'var(--text-2)', fontWeight: 500 }}>Applied Formula:</div>
                        <div>Burden = (Total Errors / Total Words) * 100</div>
                        <div style={{ marginTop: '6px', color: 'var(--accent)' }}>Calculation: ({errors} / {words}) * 100</div>
                      </div>
                    </div>

                  </div>
                );
              })()}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Footer */}
      <motion.p
        style={{ textAlign: 'center', marginTop: 64, fontSize: 11.5, color: 'var(--muted2)' }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.2 }}
      >
        CVR College of Engineering · CSE(DS) · NLP Auto-Corrector
      </motion.p>
    </div>
  )
}
