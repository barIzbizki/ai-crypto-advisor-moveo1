import { useEffect, useState } from 'react'
import { apiFetch } from '../../api/client'

function VoteControl({ target }) {
  const [value, setValue] = useState(null)
  const [pending, setPending] = useState(false)

  useEffect(() => {
    let cancelled = false

    apiFetch(`/votes?targets=${encodeURIComponent(target)}`)
      .then(({ votes }) => {
        if (!cancelled) {
          setValue(votes[target] ?? null)
        }
      })
      .catch(() => {})

    return () => {
      cancelled = true
    }
  }, [target])

  function castVote(nextValue) {
    if (pending) {
      return
    }
    setPending(true)
    apiFetch('/votes', { method: 'POST', body: JSON.stringify({ target, value: nextValue }) })
      .then(({ value: resultValue }) => {
        setValue(resultValue)
      })
      .catch(() => {})
      .finally(() => setPending(false))
  }

  return (
    <div className="vote-control">
      <button
        type="button"
        className={`vote-button${value === 1 ? ' vote-active' : ''}`}
        onClick={() => castVote(1)}
        disabled={pending}
        aria-pressed={value === 1}
        aria-label="Thumbs up"
      >
        👍
      </button>
      <button
        type="button"
        className={`vote-button${value === -1 ? ' vote-active' : ''}`}
        onClick={() => castVote(-1)}
        disabled={pending}
        aria-pressed={value === -1}
        aria-label="Thumbs down"
      >
        👎
      </button>
    </div>
  )
}

export default VoteControl
