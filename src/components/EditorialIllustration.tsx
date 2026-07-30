import { Maximize2, X } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

type EditorialIllustrationProps = {
  src: string
  alt: string
  width: number
  height: number
  caption?: string
  priority?: boolean
  className?: string
  fallbackLabel?: string
}

export function EditorialIllustration({
  src,
  alt,
  width,
  height,
  caption,
  priority = false,
  className = '',
  fallbackLabel = 'Editorial illustration',
}: EditorialIllustrationProps) {
  const [imageMissing, setImageMissing] = useState(false)
  const [isExpanded, setIsExpanded] = useState(false)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const dialogRef = useRef<HTMLDialogElement>(null)
  const closeButtonRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    setImageMissing(false)
    setIsExpanded(false)
  }, [src])

  useEffect(() => {
    if (!isExpanded) return

    const previousOverflow = document.body.style.overflow
    const trigger = triggerRef.current
    const dialog = dialogRef.current
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsExpanded(false)
    }

    if (dialog && typeof dialog.showModal === 'function') dialog.showModal()
    else dialog?.setAttribute('open', '')
    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', closeOnEscape)
    closeButtonRef.current?.focus()

    return () => {
      if (dialog?.open && typeof dialog.close === 'function') dialog.close()
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', closeOnEscape)
      if (trigger?.isConnected) trigger.focus()
    }
  }, [isExpanded])

  return (
    <figure className={`editorial-illustration ${className}`.trim()}>
      <button
        ref={triggerRef}
        className="editorial-illustration__open"
        type="button"
        onClick={() => setIsExpanded(true)}
        disabled={imageMissing}
        aria-label={`Open full-size illustration: ${alt}`}
      >
        {imageMissing ? (
          <span
            className="editorial-illustration__fallback"
            role="img"
            aria-label={`${alt} Image unavailable.`}
            style={{ aspectRatio: `${width} / ${height}` }}
          >
            <span>Illustration unavailable</span>
            <strong>{fallbackLabel}</strong>
          </span>
        ) : (
          <>
            <img
              src={src}
              alt={alt}
              width={width}
              height={height}
              loading={priority ? 'eager' : 'lazy'}
              fetchPriority={priority ? 'high' : 'auto'}
              decoding="async"
              onError={() => setImageMissing(true)}
            />
            <span className="editorial-illustration__zoom" aria-hidden="true">
              <Maximize2 size={15} />
            </span>
          </>
        )}
      </button>
      {caption ? <figcaption>{caption}</figcaption> : null}

      {isExpanded && !imageMissing ? (
        <dialog
          ref={dialogRef}
          className="editorial-lightbox"
          aria-modal="true"
          aria-label={`Full-size illustration: ${alt}`}
          onCancel={(event) => {
            event.preventDefault()
            setIsExpanded(false)
          }}
          onClose={() => setIsExpanded(false)}
          onClick={(event) => {
            if (event.target === event.currentTarget) setIsExpanded(false)
          }}
        >
          <button
            ref={closeButtonRef}
            className="editorial-lightbox__close"
            type="button"
            onClick={() => setIsExpanded(false)}
            aria-label="Close full-size illustration"
          >
            <X size={22} aria-hidden="true" />
          </button>
          <img src={src} alt={alt} width={width} height={height} />
        </dialog>
      ) : null}
    </figure>
  )
}
