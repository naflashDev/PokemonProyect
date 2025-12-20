type MarkItem = {
  pokemonId: number
  pokedex: string
  captured?: boolean
  seen?: boolean
  shiny?: boolean
  complete?: boolean
}

let queue: MarkItem[] = []
let timer: number | null = null
const FLUSH_MS = 5000

function scheduleFlush() {
  if (timer) return
  timer = window.setTimeout(() => void flushQueue(), FLUSH_MS)
}

export function enqueueMark(item: MarkItem) {
  queue.push(item)
  try { localStorage.setItem('pending-marks', JSON.stringify(queue)) } catch (_) {}
  scheduleFlush()
}

export async function flushQueue() {
  if (timer) { clearTimeout(timer); timer = null }
  if (!queue.length) return
  const payload = queue.splice(0, queue.length)
  try { localStorage.removeItem('pending-marks') } catch (_) {}

  try {
    const res = await fetch('/api/pokemon/marks', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ items: payload })
    })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const j = await res.json().catch(() => null)
    // server returns progress per pokedex: [{ pokedex, percent, captured, total }]
    const progress = Array.isArray(j?.progress) ? j.progress : []
    for (const p of progress) {
      try { localStorage.setItem(`pokedex-progress:${p.pokedex}`, String(p.percent)) } catch (_) {}
      try { window.dispatchEvent(new CustomEvent('user-pokedex-changed', { detail: { pokedex: p.pokedex, percent: p.percent } })) } catch (_) {}
    }
    return j
  } catch (err) {
    // on failure, persist payload to localStorage for retry later
    try {
      const existing = JSON.parse(localStorage.getItem('pending-marks') || '[]') as MarkItem[]
      localStorage.setItem('pending-marks', JSON.stringify([...payload, ...existing]))
    } catch (_) {}
    console.error('flushQueue error', err)
    return null
  }
}

// try to restore pending on load
try {
  if (typeof window !== 'undefined') {
    const pending = JSON.parse(localStorage.getItem('pending-marks') || '[]') as MarkItem[]
    if (Array.isArray(pending) && pending.length) {
      queue.push(...pending)
      scheduleFlush()
    }
    window.addEventListener('beforeunload', () => {
      if (queue.length) {
        try { navigator.sendBeacon('/api/pokemon/marks', JSON.stringify({ items: queue })) } catch (_) {}
      }
    })
  }
} catch (_) {}

export default { enqueueMark, flushQueue }
