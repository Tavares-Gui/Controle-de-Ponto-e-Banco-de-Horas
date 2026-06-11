import { Clock, LogOut, ShieldCheck, User } from 'lucide-react'
import { supabase } from '../../lib/supabase'

export default function Header({ profile, hasAdminAccess }) {
  const roleLabel = profile.role === 'gestor' ? 'Gestor' : profile.role === 'admin' ? 'Administrador' : 'Colaborador'

  return (
    <header>
      <div>
        <h1>
          <Clock /> Controle de Ponto
        </h1>
        <p className="header-subtitle">
          {hasAdminAccess ? 'Painel administrativo' : 'Painel do colaborador'} | {profile.full_name}
        </p>
      </div>
      <nav>
        {hasAdminAccess ? (
          <button className="active" type="button">
            <ShieldCheck size={16} />
            {roleLabel}
          </button>
        ) : (
          <button className="active" type="button">
            <User size={16} />
            Colaborador
          </button>
        )}
        <button onClick={() => supabase.auth.signOut()}>
          <LogOut size={16} />
          Sair
        </button>
      </nav>
    </header>
  )
}
