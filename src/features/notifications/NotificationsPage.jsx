import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Bell, CheckCheck } from 'lucide-react'
import { useSearchParams } from 'react-router-dom'
import { api } from '../../services/api'
import { PageState } from '../../components/ui/PageState'

export function NotificationsPage() {
  const queryClient = useQueryClient()
  const [searchParams] = useSearchParams()
  const searchTerm = (searchParams.get('q') || '').trim().toLowerCase()
  const query = useQuery({
    queryKey: ['notifications'],
    queryFn: () => api.get('/notifications/me'),
  })
  const readAll = useMutation({
    mutationFn: () => api.patch('/notifications/read-all'),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
  })
  const notifications = Array.isArray(query.data) ? query.data : []
  const visibleNotifications = notifications.filter(notification =>
    !searchTerm || `${notification.title} ${notification.body}`.toLowerCase().includes(searchTerm),
  )

  return (
    <>
      <div className="page-heading">
        <div>
          <span className="eyebrow">Updates</span>
          <h1>Notifications</h1>
          <p>Important activity from across your workspace.</p>
        </div>
        <button className="secondary-button" onClick={() => readAll.mutate()} disabled={readAll.isPending || !notifications.some(item => !item.isRead)}>
          <CheckCheck size={17} /> {readAll.isPending ? 'Marking…' : 'Mark all read'}
        </button>
      </div>
      {readAll.error && <div className="form-error" role="alert">{readAll.error.message}</div>}
      <article className="panel">
        <PageState loading={query.isLoading} error={query.error}>
          {visibleNotifications.length ? (
            <div className="notification-list">
              {visibleNotifications.map(notification => (
                <div key={notification.id || notification._id} className={notification.isRead ? '' : 'unread'}>
                  <span><Bell size={18} /></span>
                  <div>
                    <strong>{notification.title}</strong>
                    <p>{notification.body}</p>
                    <small>{new Date(notification.createdAt).toLocaleString()}</small>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="dashboard-empty">
              {searchTerm ? 'No notifications match your search.' : 'No notifications yet.'}
            </div>
          )}
        </PageState>
      </article>
    </>
  )
}
