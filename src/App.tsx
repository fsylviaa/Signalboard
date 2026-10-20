import { useEffect, useMemo, useState } from 'react'
import './App.css'

type Status = 'backlog' | 'planned' | 'progress' | 'released'
type Theme = 'Automation' | 'Collaboration' | 'Analytics' | 'Integrations' | 'Experience'

type Request = {
  id: string
  title: string
  description: string
  feedback: string
  theme: Theme
  votes: number
  status: Status
  createdAt: string
  rice: { reach: number; impact: number; confidence: number; effort: number }
  reason: string
}

const seed: Request[] = [
  { id: 'r1', title: 'CSV bulk import', description: 'Import thousands of records without manual entry.', feedback: 'We lose a full day when migrating a new workspace. A simple CSV import would get us live much faster.', theme: 'Experience', votes: 128, status: 'planned', createdAt: '2 days ago', rice: { reach: 800, impact: 3, confidence: 0.9, effort: 2 }, reason: 'High reach and a clear activation benefit make this the strongest near-term bet. The effort is contained enough to ship within one cycle.' },
  { id: 'r2', title: 'Slack workflow alerts', description: 'Send real-time updates to a team channel.', feedback: 'Our team lives in Slack. We miss important updates when we have to keep another tab open.', theme: 'Integrations', votes: 94, status: 'backlog', createdAt: '4 days ago', rice: { reach: 620, impact: 2, confidence: 0.8, effort: 3 }, reason: 'A meaningful workflow improvement for collaborative teams, with a moderate integration cost and strong customer pull.' },
  { id: 'r3', title: 'Custom dashboard widgets', description: 'Build a personal view from reusable analytics blocks.', feedback: 'The same dashboard does not work for our CS and ops teams. We need to choose the metrics that matter to each role.', theme: 'Analytics', votes: 86, status: 'progress', createdAt: '1 week ago', rice: { reach: 450, impact: 3, confidence: 0.75, effort: 5 }, reason: 'This unlocks role-specific value and supports expansion, but the broader surface area keeps the score below smaller wins.' },
  { id: 'r4', title: 'Assign feedback to teammates', description: 'Route a request to an owner with a due date.', feedback: 'It is hard to tell who is following up on customer requests. Ownership would make our feedback loop much more reliable.', theme: 'Collaboration', votes: 71, status: 'backlog', createdAt: '1 week ago', rice: { reach: 390, impact: 2, confidence: 0.85, effort: 2 }, reason: 'A small, high-confidence workflow improvement that reduces handoff friction for every product team.' },
  { id: 'r5', title: 'Saved filter views', description: 'Save and share frequently used board filters.', feedback: 'I rebuild the same filter every morning to see feedback from our enterprise segment.', theme: 'Experience', votes: 63, status: 'released', createdAt: '2 weeks ago', rice: { reach: 280, impact: 2, confidence: 0.9, effort: 1 }, reason: 'Very low effort with repeat usage across the team made this an obvious quality-of-life release.' },
  { id: 'r6', title: 'Automated weekly digest', description: 'Get a concise summary of feedback and roadmap changes.', feedback: 'A weekly summary would help leadership stay close to customer signals without another meeting.', theme: 'Automation', votes: 58, status: 'planned', createdAt: '2 weeks ago', rice: { reach: 530, impact: 2, confidence: 0.7, effort: 3 }, reason: 'The digest creates a lightweight feedback habit and extends the value of the roadmap beyond its core users.' },
  { id: 'r7', title: 'Public roadmap link', description: 'Share a read-only roadmap with customers.', feedback: 'We want to close the loop with customers without exposing our internal prioritization notes.', theme: 'Collaboration', votes: 44, status: 'released', createdAt: '3 weeks ago', rice: { reach: 340, impact: 2, confidence: 0.95, effort: 2 }, reason: 'Strong confidence and a direct trust-building benefit made this an important foundation feature.' },
  { id: 'r8', title: 'Webhook event library', description: 'Trigger automations from feedback and status changes.', feedback: 'Our internal tooling needs a reliable event when a request moves into development.', theme: 'Automation', votes: 37, status: 'backlog', createdAt: '3 weeks ago', rice: { reach: 180, impact: 3, confidence: 0.65, effort: 4 }, reason: 'Powerful for advanced teams, but lower reach and higher implementation effort make it a second-wave investment.' },
]

const statusConfig: { key: Status; label: string; helper: string; color: string }[] = [
  { key: 'backlog', label: 'Needs review', helper: 'Unscored ideas', color: '#8a94a6' },
  { key: 'planned', label: 'Planned', helper: 'Committed next', color: '#5b6ee1' },
  { key: 'progress', label: 'In progress', helper: 'Being built', color: '#e28a45' },
  { key: 'released', label: 'Released', helper: 'Shipped wins', color: '#4aaf86' },
]

const themes: Theme[] = ['Automation', 'Collaboration', 'Analytics', 'Integrations', 'Experience']
const formatScore = (r: Request) => Math.round((r.rice.reach * r.rice.impact * r.rice.confidence) / Math.max(r.rice.effort, 0.1))

function Icon({ name, size = 18 }: { name: string; size?: number }) {
  const paths: Record<string, string> = {
    search: 'M11 19a8 8 0 1 1 5.66-2.34L22 22M16.5 16.5 22 22',
    filter: 'M4 5h16M7 12h10M10 19h4',
    plus: 'M12 5v14M5 12h14',
    chevron: 'm9 18 6-6-6-6',
    arrow: 'M5 12h14m-6-6 6 6-6 6',
    grip: 'M9 5h.01M15 5h.01M9 12h.01M15 12h.01M9 19h.01M15 19h.01',
    close: 'M6 6l12 12M18 6 6 18',
    reset: 'M3 12a9 9 0 1 0 3-6.7M3 4v5h5',
  }
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={paths[name]} /></svg>
}

function App() {
  const [requests, setRequests] = useState<Request[]>(() => {
    const saved = localStorage.getItem('signalboard-requests')
    return saved ? JSON.parse(saved) : seed
  })
  const [theme, setTheme] = useState<Theme | 'All'>('All')
  const [minVotes, setMinVotes] = useState('0')
  const [sort, setSort] = useState('rice')
  const [query, setQuery] = useState('')
  const [selected, setSelected] = useState<Request | null>(null)
  const [dragged, setDragged] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)

  useEffect(() => { localStorage.setItem('signalboard-requests', JSON.stringify(requests)) }, [requests])

  const visible = useMemo(() => requests.filter((r) => {
    return (theme === 'All' || r.theme === theme) && r.votes >= Number(minVotes) && (`${r.title} ${r.description}`).toLowerCase().includes(query.toLowerCase())
  }).sort((a, b) => sort === 'votes' ? b.votes - a.votes : sort === 'impact' ? b.rice.impact - a.rice.impact : formatScore(b) - formatScore(a)), [requests, theme, minVotes, sort, query])

  const updateRequest = (updated: Request) => setRequests((items) => items.map((item) => item.id === updated.id ? { ...updated, rice: { ...updated.rice }, } : item))
  const move = (status: Status) => { if (!dragged) return; setRequests((items) => items.map((item) => item.id === dragged ? { ...item, status } : item)); setDragged(null) }
  const reset = () => { setRequests(seed); setSelected(null); localStorage.removeItem('signalboard-requests') }
  const avg = Math.round(requests.reduce((sum, r) => sum + formatScore(r), 0) / requests.length)

  return <div className="app-shell">
    <header className="topbar">
      <div className="brand"><div className="brand-mark"><span /></div><span>signal<span className="brand-accent">board</span></span></div>
      <div className="breadcrumb"><span>Workspace</span><Icon name="chevron" size={14} /><strong>Product feedback</strong></div>
      <div className="top-actions"><button className="icon-btn" aria-label="Reset demo data" title="Reset demo data" onClick={reset}><Icon name="reset" /></button><div className="avatar">PM</div></div>
    </header>

    <main>
      <section className="page-intro"><div><div className="eyebrow">PRODUCT OPERATIONS <span className="live-dot" /> LIVE WORKSPACE</div><h1>Feedback, made <em>decidable.</em></h1><p>Turn customer signals into a roadmap your team can stand behind.</p></div><button className="primary-btn" onClick={() => setSelected(seed[0])}><Icon name="plus" size={17} /> Add feedback</button></section>

      <section className="metrics"><div className="metric"><span className="metric-label">TOTAL SIGNALS</span><strong>{requests.length}</strong><span className="metric-note positive">↑ 12% <small>vs last month</small></span></div><div className="metric"><span className="metric-label">HIGH PRIORITY</span><strong>{requests.filter((r) => formatScore(r) > 500).length}</strong><span className="metric-note">RICE score above 500</span></div><div className="metric"><span className="metric-label">AVG. RICE SCORE</span><strong>{avg}</strong><span className="metric-note">Across all requests</span></div><div className="metric metric-highlight"><div><span className="metric-label">NEXT UP</span><strong>CSV bulk import</strong><span className="metric-note">Highest ranked · {formatScore(requests[0])} RICE</span></div><Icon name="arrow" size={20} /></div></section>

      <section className="toolbar"><div className="search-wrap"><Icon name="search" size={17} /><input aria-label="Search feedback" placeholder="Search feedback..." value={query} onChange={(e) => setQuery(e.target.value)} /></div><div className="toolbar-divider" /><div className="filter-label"><Icon name="filter" size={16} /> FILTERS</div><select value={theme} onChange={(e) => setTheme(e.target.value as Theme | 'All')} aria-label="Filter by theme"><option value="All">All themes</option>{themes.map((item) => <option key={item}>{item}</option>)}</select><select value={minVotes} onChange={(e) => setMinVotes(e.target.value)} aria-label="Filter by votes"><option value="0">Any votes</option><option value="50">50+ votes</option><option value="80">80+ votes</option><option value="100">100+ votes</option></select><div className="sort-wrap"><span>Sort by</span><select value={sort} onChange={(e) => setSort(e.target.value)} aria-label="Sort requests"><option value="rice">RICE score</option><option value="votes">Most votes</option><option value="impact">Impact</option></select></div></section>

      <section className="board" aria-label="Feedback status board">{statusConfig.map((column) => { const cards = visible.filter((r) => r.status === column.key); return <div className="column" key={column.key} onDragOver={(e) => e.preventDefault()} onDrop={() => move(column.key)}><div className="column-heading"><div><h2><span className="status-dot" style={{ background: column.color }} />{column.label} <span className="count">{cards.length}</span></h2><p>{column.helper}</p></div><button className="column-menu" aria-label={`${column.label} options`}>•••</button></div><div className="cards">{cards.map((request) => <article className={`request-card ${dragged === request.id ? 'is-dragged' : ''}`} key={request.id} draggable onDragStart={() => setDragged(request.id)} onDragEnd={() => setDragged(null)} onClick={() => setSelected(request)}><div className="card-top"><span className={`theme-tag tag-${request.theme.toLowerCase()}`}>{request.theme}</span><span className="grip"><Icon name="grip" size={16} /></span></div><h3>{request.title}</h3><p>{request.description}</p><div className="card-bottom"><span className="votes"><span className="vote-icon">↑</span> {request.votes} votes</span><span className="score"><small>RICE</small>{formatScore(request)}</span></div><div className="card-footer"><span>{request.createdAt}</span><span className="impact-bars" title={`Impact ${request.rice.impact}/3`}>{[1, 2, 3].map((bar) => <i key={bar} className={bar <= request.rice.impact ? 'filled' : ''} />)}</span></div></article>)}</div>{cards.length === 0 && <div className="empty-column">Drop a request here</div>}</div> })}</section>
      {visible.length === 0 && <div className="no-results"><strong>No feedback matches these filters.</strong><button onClick={() => { setTheme('All'); setMinVotes('0'); setQuery('') }}>Clear filters</button></div>}
    </main>

    <footer className="footer"><span><i className="saved-dot" /> All changes saved locally</span><span>Signalboard · Product feedback workspace</span></footer>

    {selected && <div className="drawer-backdrop" onMouseDown={(e) => e.target === e.currentTarget && setSelected(null)}><aside className="drawer" aria-label="Feedback details"><div className="drawer-header"><div><span className={`theme-tag tag-${selected.theme.toLowerCase()}`}>{selected.theme}</span><span className="drawer-kicker">FEEDBACK DETAIL</span></div><button className="close-btn" onClick={() => setSelected(null)} aria-label="Close details"><Icon name="close" /></button></div><h2>{selected.title}</h2><p className="drawer-description">{selected.description}</p><div className="signal-row"><div><span>COMMUNITY SIGNAL</span><strong>↑ {selected.votes}</strong><small>votes from customers</small></div><div><span>STATUS</span><select value={selected.status} onChange={(e) => { const updated = { ...selected, status: e.target.value as Status }; setSelected(updated); updateRequest(updated) }} aria-label="Change status">{statusConfig.map((s) => <option value={s.key} key={s.key}>{s.label}</option>)}</select></div></div><blockquote>“{selected.feedback}”</blockquote><div className="section-title"><span>RICE PRIORITIZATION</span><b>{formatScore(selected)} <small>score</small></b></div><div className="rice-grid">{(['reach', 'impact', 'confidence', 'effort'] as const).map((field) => <label key={field}>{field}<input type="number" min="0" step={field === 'confidence' ? '0.05' : '1'} value={selected.rice[field]} onChange={(e) => { const updated = { ...selected, rice: { ...selected.rice, [field]: Number(e.target.value) } }; setSelected(updated); updateRequest(updated) }} /><span>{field === 'reach' ? 'people / month' : field === 'confidence' ? '0 to 1.0' : field === 'impact' ? '1 low · 3 high' : 'person-weeks'}</span></label>)}</div><div className="decision-box"><div className="decision-icon">✦</div><div><span>WHY THIS, WHY NOW</span><p>{selected.reason}</p></div></div><button className="drawer-save" onClick={() => { setSaved(true); setTimeout(() => setSaved(false), 1800) }}>{saved ? 'Saved to workspace' : 'Save prioritization'}</button></aside></div>}
  </div>
}

export default App
