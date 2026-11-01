/* One beaver on screen at a time. While the guide beaver is up (peeking in, hanging, or the offline buddy), every beaver that is
   part of a screen's own drawing (a layer named "Beaver / ...") is hidden, so he is never seen twice in one frame. It stays
   mounted and only turns invisible, so its one-time animation does not play again when it comes back. */
let up = 0
const style = () => {
  if (typeof document === 'undefined' || document.getElementById('mascot-up-css')) return
  const s = document.createElement('style'); s.id = 'mascot-up-css'
  s.textContent = '[data-beaver]{transition:opacity .18s ease} .mascot-up [data-beaver]{opacity:0!important;pointer-events:none!important}'
  document.head.appendChild(s)
}
/** The guide beaver appears (+1) or goes (-1). */
export function mascotUp(d: 1 | -1) {
  up = Math.max(0, up + d); style()
  if (typeof document !== 'undefined') document.documentElement.classList.toggle('mascot-up', up > 0)
}
style()
