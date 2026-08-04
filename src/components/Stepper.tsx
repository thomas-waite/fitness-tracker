import { useEffect, useRef, useState } from 'react'

const ITEM_H = 44

function WheelPicker({
  value,
  step,
  min,
  max,
  unit,
  onDone,
  onCancel,
}: {
  value: number
  step: number
  min: number
  max: number
  unit: string
  onDone: (v: number) => void
  onCancel: () => void
}) {
  const values: number[] = []
  for (let v = min; v <= max; v += step) values.push(v)

  const listRef = useRef<HTMLDivElement>(null)
  const clamped = Math.min(max, Math.max(min, value))
  const [selected, setSelected] = useState(clamped)

  useEffect(() => {
    const idx = Math.round((clamped - min) / step)
    listRef.current?.scrollTo({ top: idx * ITEM_H })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const onScroll = () => {
    const el = listRef.current
    if (!el) return
    const idx = Math.min(
      values.length - 1,
      Math.max(0, Math.round(el.scrollTop / ITEM_H)),
    )
    setSelected(values[idx])
  }

  const scrollToValue = (v: number) => {
    setSelected(v)
    listRef.current?.scrollTo({ top: ((v - min) / step) * ITEM_H, behavior: 'smooth' })
  }

  return (
    <div className="picker-overlay" onClick={onCancel}>
      <div className="picker-sheet" onClick={(e) => e.stopPropagation()}>
        <div className="picker-head">
          <button className="link-btn" onClick={onCancel}>
            Cancel
          </button>
          <span className="picker-current">
            {selected}
            {unit && <span className="step-unit">{unit}</span>}
          </span>
          <button className="link-btn picker-done" onClick={() => onDone(selected)}>
            Done
          </button>
        </div>
        <div className="picker-wheel-wrap">
          <div className="picker-highlight" />
          <div className="picker-wheel" ref={listRef} onScroll={onScroll}>
            <div className="picker-pad" />
            {values.map((v) => (
              <button
                key={v}
                className={'picker-item' + (v === selected ? ' selected' : '')}
                onClick={() => scrollToValue(v)}
              >
                {v}
              </button>
            ))}
            <div className="picker-pad" />
          </div>
        </div>
      </div>
    </div>
  )
}

export default function Stepper({
  value,
  step,
  min,
  max,
  unit,
  onChange,
}: {
  value: number
  step: number
  min: number
  /** Upper bound of the wheel picker (the +/- buttons are not capped). */
  max: number
  unit: string
  onChange: (v: number) => void
}) {
  const [open, setOpen] = useState(false)

  return (
    <div className="stepper">
      <button className="step-btn" onClick={() => onChange(Math.max(min, value - step))}>
        −
      </button>
      <button className="step-value" onClick={() => setOpen(true)}>
        {value}
        <span className="step-unit">{unit}</span>
      </button>
      <button className="step-btn" onClick={() => onChange(value + step)}>
        +
      </button>
      {open && (
        <WheelPicker
          value={value}
          step={step}
          min={min}
          max={max}
          unit={unit}
          onDone={(v) => {
            onChange(v)
            setOpen(false)
          }}
          onCancel={() => setOpen(false)}
        />
      )}
    </div>
  )
}
