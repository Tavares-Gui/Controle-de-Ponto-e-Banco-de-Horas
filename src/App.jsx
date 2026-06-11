import { useEffect, useState } from 'react'
import Header from './components/common/Header'
import { supabase } from './lib/supabase'
import AdminPage from './pages/AdminPage'
import AuthPage from './pages/AuthPage'
import EmployeePage from './pages/EmployeePage'

export default function App() {
  const [session, setSession] = useState(null)
  const [profile, setProfile] = useState(null)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession)
    })

    return () => subscription.unsubscribe()
  }, [])

  useEffect(() => {
    if (!session) {
      setProfile(null)
      return
    }

    supabase
      .from('profiles')
      .select('*')
      .eq('id', session.user.id)
      .single()
      .then(({ data }) => setProfile(data))
  }, [session])

  if (!session) return <AuthPage />
  if (!profile) return <div className="loading">Carregando...</div>

  const hasAdminAccess = profile.role === 'admin' || profile.role === 'gestor'

  return (
    <>
      <Header profile={profile} hasAdminAccess={hasAdminAccess} />
      <main>
        {hasAdminAccess ? (
          <AdminPage currentUserId={session.user.id} currentRole={profile.role} />
        ) : (
          <EmployeePage session={session} profile={profile} />
        )}
      </main>
    </>
  )
}
