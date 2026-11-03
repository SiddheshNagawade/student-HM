/* Safety net: if any screen crashes, show a calm "start again" page instead of a white screen. */
import { Component, ReactNode } from 'react'

export class Guard extends Component<{ children: ReactNode }, { err: Error | null }> {
  state = { err: null as Error | null }
  static getDerivedStateFromError(err: Error) { return { err } }
  componentDidCatch(err: Error) { console.error(err) }
  restart = () => {
    try { Object.keys(localStorage).filter(k => k.startsWith('align.')).forEach(k => localStorage.removeItem(k)) } catch { /* storage blocked */ }
    location.href = location.pathname
  }
  render() {
    if (!this.state.err) return this.props.children
    return (
      <div style={{ position: 'fixed', inset: 0, background: '#FFFBF3', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 18, padding: 24, textAlign: 'center', color: '#00224E', fontFamily: '"M PLUS Rounded 1c", sans-serif' }}>
        <img src={`${(import.meta as unknown as { env: { BASE_URL: string } }).env.BASE_URL}fig/226-910.svg`} alt="" width={120} onError={e => { (e.target as HTMLImageElement).style.display = 'none' }} />
        <div style={{ fontFamily: '"League Spartan", sans-serif', fontWeight: 800, fontSize: 28 }}>Something got stuck.</div>
        <button onClick={this.restart} style={{ height: 52, padding: '0 28px', borderRadius: 26, border: '2.5px solid #00224E', background: '#FFD265', boxShadow: '0 4px 0 #00224E', fontFamily: '"League Spartan", sans-serif', fontWeight: 800, fontSize: 18, color: '#00224E', cursor: 'pointer' }}>Start again</button>
        <div style={{ fontSize: 12, color: '#3E4F72', maxWidth: 320, wordBreak: 'break-word' }}>{String(this.state.err.message).slice(0, 160)}</div>
      </div>
    )
  }
}
