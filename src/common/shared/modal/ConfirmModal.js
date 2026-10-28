'use client'

import { useEffect } from 'react'
import { createPortal } from 'react-dom'
import Button from '@/common/shared/button/Button'
import T from '@/common/shared/i18n/T'

export default function ConfirmModal({
  open,
  title = 'Confirm',
  message = '',
  confirmLabel = 'Delete',
  cancelLabel = 'Cancel',
  danger = true,
  busy = false,
  onConfirm,
  onCancel,
}) {
  useEffect(() => {
    if (!open) return undefined

    const onKey = (e) => {
      if (e.key === 'Escape' && !busy) onCancel?.()
    }

    document.addEventListener('keydown', onKey)
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = prevOverflow
    }
  }, [open, busy, onCancel])

  if (!open || typeof document === 'undefined') return null

  return createPortal(
    <div className="modal-backdrop" role="presentation" onClick={() => !busy && onCancel?.()}>
      <div
        className="modal modal--sm"
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-modal-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal__header">
          <h2 id="confirm-modal-title" className="modal__title">
            <T caseMode="sentence">{title}</T>
          </h2>
        </div>

        <div className="modal__body">
          <p className="confirm-modal__message">{message}</p>
        </div>

        <div className="modal__footer modal__footer--right">
          <Button
            type="button"
            variant="secondary"
            height="36px"
            onClick={onCancel}
            disabled={busy}
          >
            <T>{cancelLabel}</T>
          </Button>

          <Button
            type="button"
            variant={danger ? 'danger' : 'primary'}
            height="36px"
            onClick={onConfirm}
            disabled={busy}
          >
            <T>{busy ? 'Deleting…' : confirmLabel}</T>
          </Button>
        </div>
      </div>
    </div>,
    document.body
  )
}
