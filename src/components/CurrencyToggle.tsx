import type { Currency } from '../lib/format'

const currencies: Currency[] = ['BTC', 'USD', 'EUR', 'PSU']

export function CurrencyToggle({
  value,
  onChange,
}: {
  value: Currency
  onChange: (currency: Currency) => void
}) {
  return (
    <div className="segmented" aria-label="Display currency">
      {currencies.map((currency) => (
        <button
          key={currency}
          type="button"
          className={value === currency ? 'is-active' : ''}
          aria-pressed={value === currency}
          onClick={() => onChange(currency)}
        >
          {currency}
        </button>
      ))}
    </div>
  )
}
