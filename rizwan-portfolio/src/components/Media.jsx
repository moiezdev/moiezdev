import { useState } from 'react'

// Image with a quiet gradient placeholder underneath, so layout stays
// intact while loading, when the source is missing, or if it fails.
export default function Media({ src, alt = '', label, className = '', eager = false }) {
  const [state, setState] = useState(src ? 'loading' : 'empty')

  return (
    <div className={`media ${className}`} data-state={state}>
      {state !== 'loaded' && label && <span className="media-label">{label}</span>}
      {src && state !== 'error' && (
        <img
          src={src}
          alt={alt}
          loading={eager ? 'eager' : 'lazy'}
          decoding="async"
          onLoad={() => setState('loaded')}
          onError={() => setState('error')}
        />
      )}
    </div>
  )
}
