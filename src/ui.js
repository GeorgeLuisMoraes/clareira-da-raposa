const KEYS = {
  1: 'survey',
  2: 'walk',
  3: 'run',
}

export function bindUI(fox) {
  const buttons = [...document.querySelectorAll('[data-clip]')]

  function select(name, fromFox = false) {
    const current = fromFox ? name : fox.play(name)
    for (const button of buttons) {
      const active = button.dataset.clip === current
      button.classList.toggle('is-active', active)
      button.setAttribute('aria-pressed', active ? 'true' : 'false')
    }
  }

  for (const button of buttons) {
    button.addEventListener('click', () => select(button.dataset.clip))
  }

  window.addEventListener('keydown', (event) => {
    const clip = KEYS[event.key]
    if (!clip) return
    event.preventDefault()
    select(clip)
  })

  select(fox.current, true)
}

export function setLoading(message, hidden = false) {
  const loading = document.querySelector('#loading')
  loading.textContent = message
  loading.classList.toggle('is-hidden', hidden)
}
