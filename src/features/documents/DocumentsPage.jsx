import { FileText } from 'lucide-react'

export function DocumentsPage() {
  return (
    <>
      <div className="page-heading">
        <div>
          <span className="eyebrow">Compliance</span>
          <h1>Documents</h1>
          <p>Upload and manage your compliance documents for verification.</p>
        </div>
      </div>

      <div className="panel" style={{ textAlign: 'center', padding: '60px 24px' }}>
        <FileText size={48} color="var(--lime)" style={{ margin: '0 auto 16px' }} />
        <h3>Documents coming soon</h3>
        <p className="muted">Document upload and verification will be available in a future update.</p>
      </div>
    </>
  )
}
