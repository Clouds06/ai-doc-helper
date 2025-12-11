import { useEffect, useRef, useState } from 'react'

export default function InlineTooltip({
  label,
  content,
  className = ''
}: {
  label: React.ReactNode
  content: string
  className?: string
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLSpanElement | null>(null)

  useEffect(() => {
    if (!open) return
    function onDocClick(e: MouseEvent) {
      if (!ref.current) return
      if (!ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onDocClick)
    return () => document.removeEventListener('mousedown', onDocClick)
  }, [open])

  return (
    <span ref={ref} className={`relative inline-flex items-center ${className}`}>
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((s) => !s)}
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        className="focus:outline-none"
      >
        <span className="rounded-smpx-1 inline-flex transform-gpu items-center justify-center py-0.5 align-super text-[10px] text-gray-400">
          {label}
        </span>
      </button>

      <div
        role="tooltip"
        aria-hidden={!open}
        className={`pointer-events-none absolute top-full left-1/2 z-50 mt-2 w-max max-w-[260px] -translate-x-1/2 transform-gpu rounded-md bg-gray-700/90 px-2 py-1 text-xs wrap-break-word whitespace-normal text-white opacity-0 shadow-lg transition-all duration-120 ${
          open ? 'pointer-events-auto scale-100 opacity-100' : 'scale-95'
        }`}
      >
        {content}
      </div>
    </span>
  )
}
