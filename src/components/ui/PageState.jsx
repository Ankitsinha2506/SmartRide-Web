import { LoaderCircle } from 'lucide-react'
export function PageState({ loading, error, empty, children }) { if (loading) return <div className="page-state"><LoaderCircle className="spin" /> Loading data…</div>; if (error) return <div className="page-state page-state--error">{error.message}</div>; if (empty) return <div className="page-state">No records found yet.</div>; return children }
