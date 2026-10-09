import { useEffect } from 'react'
import { X } from 'lucide-react'

export function Modal({ onClose, title, subtitle, eyebrow, children, wide }) {
  useEffect(() => {
    document.body.style.overflow = 'hidden'
    const onKey = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => { document.body.style.overflow = ''; window.removeEventListener('keydown', onKey) }
  }, [onClose])

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className={`modal${wide ? ' modal--wide' : ''}`} onClick={e => e.stopPropagation()}>
        <div className="modal__header">
          <div>
            {(eyebrow || subtitle) && <span className="eyebrow">{eyebrow || subtitle}</span>}
            <h2>{title}</h2>
          </div>
          <button type="button" onClick={onClose}><X /></button>
        </div>
        {children}
      </div>
    </div>
  )
}
