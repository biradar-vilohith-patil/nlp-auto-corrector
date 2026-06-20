/**
 * hooks/useTextRefinement.js
 * ───────────────────────────
 * React Query mutation for the /api/refine endpoint.
 */

import { useMutation } from '@tanstack/react-query'
import { refineText } from '../services/api'
import toast from 'react-hot-toast'

export function useTextRefinement() {
  return useMutation({
    mutationFn: ({ text, style = 'professional' }) => refineText(text, style),
    onError: (err) => {
      toast.error(err.message || 'Refinement failed.', {
        style: {
          background: 'var(--red-soft)',
          color: 'var(--red)',
          border: '1px solid var(--red)',
          fontFamily: "'DM Sans', sans-serif",
          fontSize: '13px',
        },
      })
    },
  })
}
