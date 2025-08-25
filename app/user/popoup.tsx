'use client'

import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'

export default function Popup({ open, onClose, title, children }: { open: boolean; onClose: () => void; title: string; children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false)
  const [portalEl, setPortalEl] = useState<HTMLElement | null>(null)

  useEffect(() => {
    setMounted(true)

    // Create a dedicated modal root container
    const existing = document.getElementById('modal-root') as HTMLElement | null
    const el = existing ?? Object.assign(document.createElement('div'), { id: 'modal-root' })
    if (!existing) {
      document.body.appendChild(el)
    }
    setPortalEl(el)

    return () => {
      setMounted(false)
      if (el && el.childElementCount === 0 && el.parentNode) {
        el.parentNode.removeChild(el)
      }
    }
  }, [])

  // Lock body scroll when modal is open
  useEffect(() => {
    if (!mounted) return
    if (open) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [open, mounted])

  if (!open || !mounted) return null;

  const modalContent = (
    <div
      className="fixed inset-0 flex items-center justify-center z-[1000]"
      style={{ position: 'fixed', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}
    >
      {/* Dark background overlay */}
      <div
        className="absolute inset-0 bg-black/40"
        style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.4)' }}
        onClick={onClose}
      />

      {/* Modal box */}
      <div
        className="relative bg-white rounded-2xl shadow-xl w-full max-w-md p-6 z-[1001]"
        style={{ position: 'relative', background: '#fff', borderRadius: 16, boxShadow: '0 10px 25px rgba(0,0,0,0.15)', width: '100%', maxWidth: 480, padding: 24, zIndex: 1001 }}
      >
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          {title}
        </h3>
        <div>{children}</div>

        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-gray-400 hover:text-gray-600"
          style={{ position: 'absolute', top: 12, right: 12 }}
        >
          ✕
        </button>
      </div>
    </div>
  );

  return createPortal(modalContent, portalEl ?? document.body)
}