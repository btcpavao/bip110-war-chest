import { Check, Copy, ExternalLink, Share2, X } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'

type ShareMessageDialogProps = {
  open: boolean
  onClose: () => void
  title: string
  description: string
  defaultMessage: string
  optionalHandleLabel?: string
}

export function ShareMessageDialog({
  open,
  onClose,
  title,
  description,
  defaultMessage,
  optionalHandleLabel = 'Optional handle',
}: ShareMessageDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const closeButtonRef = useRef<HTMLButtonElement>(null)
  const [message, setMessage] = useState(defaultMessage)
  const [handle, setHandle] = useState('')
  const [status, setStatus] = useState('')

  useEffect(() => {
    if (!open) return

    const dialog = dialogRef.current
    const previousOverflow = document.body.style.overflow
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        onClose()
      }
    }

    setMessage(defaultMessage)
    setHandle('')
    setStatus('')
    if (dialog && typeof dialog.showModal === 'function') dialog.showModal()
    else dialog?.setAttribute('open', '')
    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', closeOnEscape)
    closeButtonRef.current?.focus()

    return () => {
      if (dialog?.open && typeof dialog.close === 'function') dialog.close()
      else dialog?.removeAttribute('open')
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', closeOnEscape)
    }
  }, [defaultMessage, onClose, open])

  const finalMessage = useMemo(() => {
    const normalizedHandle = handle.trim()
    if (!normalizedHandle) return message.trim()
    return `${message.trim()}\n\n${normalizedHandle.startsWith('@') ? normalizedHandle : `@${normalizedHandle}`}`
  }, [handle, message])

  const xIntentUrl = `https://x.com/intent/post?text=${encodeURIComponent(finalMessage)}`

  async function copyMessage() {
    try {
      await navigator.clipboard.writeText(finalMessage)
      setStatus('Briefing copied')
    } catch {
      setStatus('Copy failed. Select the message and copy it manually.')
    }
  }

  async function shareMessage() {
    if (!navigator.share) {
      setStatus('Native sharing is unavailable on this device.')
      return
    }
    try {
      await navigator.share({ title, text: finalMessage })
      setStatus('Briefing shared')
    } catch (reason) {
      if ((reason as { name?: string })?.name !== 'AbortError') {
        setStatus('Sharing failed. Copy the message or open X instead.')
      }
    }
  }

  if (!open) return null

  return (
    <dialog
      ref={dialogRef}
      className="share-message-dialog"
      aria-labelledby="share-dialog-title"
      aria-describedby="share-dialog-description"
      onCancel={(event) => {
        event.preventDefault()
        onClose()
      }}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose()
      }}
    >
      <div className="share-message-dialog__card">
        <button
          ref={closeButtonRef}
          className="share-message-dialog__close"
          type="button"
          onClick={onClose}
          aria-label="Close sharing dialog"
        >
          <X size={20} aria-hidden="true" />
        </button>

        <p className="eyebrow">User-controlled dispatch</p>
        <h2 id="share-dialog-title">{title}</h2>
        <p id="share-dialog-description">{description}</p>

        <label htmlFor="share-message">Message</label>
        <textarea
          id="share-message"
          value={message}
          rows={6}
          onChange={(event) => setMessage(event.target.value)}
        />

        <label htmlFor="share-handle">{optionalHandleLabel}</label>
        <input
          id="share-handle"
          value={handle}
          placeholder="@handle"
          onChange={(event) => setHandle(event.target.value)}
        />

        <div className="share-message-dialog__actions">
          <button type="button" onClick={shareMessage}>
            <Share2 size={17} aria-hidden="true" />
            NATIVE SHARE
          </button>
          <button type="button" onClick={copyMessage}>
            {status === 'Briefing copied'
              ? <Check size={17} aria-hidden="true" />
              : <Copy size={17} aria-hidden="true" />}
            COPY
          </button>
          <a href={xIntentUrl} target="_blank" rel="noreferrer">
            OPEN X <ExternalLink size={15} aria-hidden="true" />
          </a>
        </div>
        <p className="share-message-dialog__status" role="status" aria-live="polite">{status}</p>
        <small>Nothing is posted automatically. Review the message before dispatch.</small>
      </div>
    </dialog>
  )
}
