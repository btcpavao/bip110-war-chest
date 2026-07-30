import { assetUrl } from '../lib/paths'

export function BrandMark() {
  return (
    <img
      className="wordmark-logo"
      src={assetUrl('assets/brand/bitcoin-knots.svg')}
      alt=""
      width={42}
      height={42}
      aria-hidden="true"
    />
  )
}
