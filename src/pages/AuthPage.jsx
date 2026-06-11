import { useState } from 'react'
import FeedbackMessage from '../components/common/FeedbackMessage'
import useFeedback from '../hooks/useFeedback'
import { supabase } from '../lib/supabase'
import { formatPhone, onlyDigits } from '../utils/formatters'

export default function AuthPage() {
  const [mode, setMode] = useState('login')
  const [loginForm, setLoginForm] = useState({ email: '', password: '' })
  const [registerForm, setRegisterForm] = useState({
    full_name: '',
    phone: '',
    email: '',
    password: '',
  })
  const [loading, setLoading] = useState(false)
  const { feedback, showError, showSuccess, clearFeedback } = useFeedback()

  async function signUp() {
    if (!registerForm.full_name.trim()) {
      showError('Informe o nome completo.')
      return
    }

    if (onlyDigits(registerForm.phone).length < 10) {
      showError('Informe um telefone valido com DDD.')
      return
    }

    if (!registerForm.email.trim() || !registerForm.password.trim()) {
      showError('Preencha e-mail e senha para realizar o cadastro.')
      return
    }

    setLoading(true)
    clearFeedback()

    const { error } = await supabase.auth.signUp({
      email: registerForm.email,
      password: registerForm.password,
      options: {
        data: {
          full_name: registerForm.full_name.trim(),
          phone: formatPhone(registerForm.phone),
        },
      },
    })

    if (error) {
      showError(error.message)
    } else {
      showSuccess('Cadastro realizado com sucesso. Agora voce ja pode entrar com seu e-mail e senha.')
      setMode('login')
      setLoginForm({ email: registerForm.email, password: '' })
      setRegisterForm({
        full_name: '',
        phone: '',
        email: '',
        password: '',
      })
    }

    setLoading(false)
  }

  async function login() {
    if (!loginForm.email.trim() || !loginForm.password.trim()) {
      showError('Informe e-mail e senha para entrar.')
      return
    }

    setLoading(true)
    clearFeedback()

    const { error } = await supabase.auth.signInWithPassword({
      email: loginForm.email,
      password: loginForm.password,
    })

    if (error) {
      showError(error.message)
    } else {
      showSuccess('Login realizado com sucesso.')
    }

    setLoading(false)
  }

  return (
    <main className="auth-page">
      <section className="auth-card">
        <h1>Controle de Ponto e Banco de Horas</h1>

        <div className="auth-switch">
          <button
            type="button"
            className={mode === 'login' ? 'active' : 'secondary'}
            onClick={() => {
              setMode('login')
              clearFeedback()
            }}
          >
            Entrar
          </button>
          <button
            type="button"
            className={mode === 'register' ? 'active' : 'secondary'}
            onClick={() => {
              setMode('register')
              clearFeedback()
            }}
          >
            Cadastrar
          </button>
        </div>

        {mode === 'login' ? (
          <div className="auth-form">
            <input
              placeholder="E-mail"
              value={loginForm.email}
              onChange={(event) => setLoginForm({ ...loginForm, email: event.target.value })}
            />
            <input
              placeholder="Senha"
              type="password"
              value={loginForm.password}
              onChange={(event) => setLoginForm({ ...loginForm, password: event.target.value })}
            />
            <button disabled={loading} onClick={login}>
              Entrar
            </button>
          </div>
        ) : (
          <div className="auth-form">
            <input
              placeholder="Nome completo"
              value={registerForm.full_name}
              onChange={(event) => setRegisterForm({ ...registerForm, full_name: event.target.value })}
            />
            <input
              placeholder="Telefone"
              inputMode="tel"
              value={registerForm.phone}
              onChange={(event) =>
                setRegisterForm({ ...registerForm, phone: formatPhone(event.target.value) })
              }
            />
            <input
              placeholder="E-mail"
              value={registerForm.email}
              onChange={(event) => setRegisterForm({ ...registerForm, email: event.target.value })}
            />
            <input
              placeholder="Senha"
              type="password"
              value={registerForm.password}
              onChange={(event) => setRegisterForm({ ...registerForm, password: event.target.value })}
            />
            <button disabled={loading} onClick={signUp}>
              Cadastrar
            </button>
          </div>
        )}

        <FeedbackMessage feedback={feedback} />
      </section>
    </main>
  )
}
