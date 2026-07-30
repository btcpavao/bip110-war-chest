import { useState } from 'react'
import { appPath } from '../lib/paths'

export function FabiansTooltip({ pagePath }: { pagePath: '/fabians' }) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <span
      className={`fabians-briefing${isOpen ? ' is-open' : ''}`}
      onMouseEnter={() => setIsOpen(true)}
      onMouseLeave={() => setIsOpen(false)}
      onFocusCapture={() => setIsOpen(true)}
      onBlurCapture={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setIsOpen(false)
      }}
      onKeyDown={(event) => {
        if (event.key === 'Escape') {
          event.preventDefault()
          setIsOpen(false)
        }
      }}
    >
      <a
        href={appPath(pagePath)}
        aria-describedby="fabians-tooltip"
        aria-controls="fabians-tooltip"
        aria-expanded={isOpen}
      >
        Fabians
      </a>
      <sup aria-hidden="true">?</sup>
      <span
        id="fabians-tooltip"
        role="tooltip"
        aria-hidden={!isOpen}
      >
        <strong>Fabians?</strong>
        <span>Apparently, they are attacking Bitcoin extremely slowly.</span>
        <em>Meet the minister who discovered them →</em>
      </span>
    </span>
  )
}
