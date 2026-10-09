export function StatCard({ icon: Icon, label, value, hint, tone = 'mint', badge }) {
  return (
    <article className={`stat-card${tone === 'dark' ? ' stat-card--dark' : ''}`}>
      <div className={`stat-card__icon stat-card__icon--${tone}`}>
        <Icon size={20} />
      </div>
      <div>
        <p>{label}</p>
        <strong>
          {value}
          {badge && <span className="stat-card__badge">{badge}</span>}
        </strong>
        <small>{hint}</small>
      </div>
    </article>
  );
}
