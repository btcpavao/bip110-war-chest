import type { ReactNode } from 'react'
import { EditorialIllustration } from './EditorialIllustration'

type PlebClassCardProps = {
  imageSrc: string
  imageAlt: string
  imageWidth: number
  imageHeight: number
  classLabel: string
  recommended?: boolean
  className?: string
  heading: string
  children: ReactNode
  primaryAction: ReactNode
  secondaryAction?: ReactNode
  status?: ReactNode
}

export function PlebClassCard({
  imageSrc,
  imageAlt,
  imageWidth,
  imageHeight,
  classLabel,
  recommended = false,
  className = '',
  heading,
  children,
  primaryAction,
  secondaryAction,
  status,
}: PlebClassCardProps) {
  return (
    <article className={`pleb-path ${className}`.trim()}>
      {recommended ? <span className="recommended-badge">RECOMMENDED</span> : null}
      <EditorialIllustration
        className="pleb-class-illustration"
        src={imageSrc}
        alt={imageAlt}
        width={imageWidth}
        height={imageHeight}
        fallbackLabel={classLabel}
      />
      <div className="pleb-path-copy">
        <p className="pleb-path-label">{classLabel}</p>
        <h3>{heading}</h3>
        {children}
        <div className="pleb-card-actions">
          {primaryAction}
          {secondaryAction}
          {status}
        </div>
      </div>
    </article>
  )
}
