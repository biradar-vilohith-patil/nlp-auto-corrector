/**
 * hooks/useTextCorrection.js
 * ────────────────────────────
 * React Query mutation for the /api/correct endpoint.
 */

import { useMutation } from '@tanstack/react-query'
import { correctText } from '../services/api'
import toast from 'react-hot-toast'

export function useTextCorrection() {
  return useMutation({
    // Simplified payload: just the text
    mutationFn: ({ text }) => correctText(text),
    onSuccess: (data) => {
      const total = (data.spell_fixed || 0) + (data.grammar_fixed || 0) + (data.homophone_fixed || 0)
      if (total === 0) {
        toast('No errors found — your text looks great!', {
          icon: '✨',
          style: getToastStyle('green'),
        })
      }
    },
    onError: (err) => {
      toast.error(err.message || 'Correction failed.', {
        style: getToastStyle('red'),
      })
    },
  })
}

function getToastStyle(color) {
  const map = {
    green: { background: 'var(--green-soft)', color: 'var(--green)', border: '1px solid var(--green)' },
    red:   { background: 'var(--red-soft)',   color: 'var(--red)',   border: '1px solid var(--red)' },
  }
  return { ...map[color], fontFamily: "'DM Sans', sans-serif", fontSize: '13px' }
}