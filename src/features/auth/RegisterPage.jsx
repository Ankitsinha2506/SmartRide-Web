import { zodResolver } from '@hookform/resolvers/zod'
import { ArrowRight, CarFront } from 'lucide-react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link, useNavigate } from 'react-router-dom'
import { z } from 'zod'
import { api } from '../../services/api'
import { useAuthStore } from '../../store/authStore'

const schema = z.object({
  name: z.string().min(2, 'Enter your name'),
  email: z.string().email('Enter a valid email'),
  phone: z.string().min(10, 'Enter a valid phone number'),
  password: z.string().min(8, 'Minimum 8 characters'),
})

export function RegisterPage() {
  const [serverError, setServerError] = useState('')
  const setSession = useAuthStore(s => s.setSession)
  const navigate = useNavigate()
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({ resolver: zodResolver(schema) })
  const submit = async values => {
    setServerError('')
    try {
      const session = await api.post('/auth/register', { ...values, role: 'VENDOR' })
      setSession(session)
      navigate('/')
    } catch (error) {
      setServerError(error.message)
    }
  }
  return <main className="login-page"><section className="login-visual"><div className="brand brand--light"><span><CarFront/></span><div>SmartRide<small>Vendor network</small></div></div><div className="login-copy"><span className="eyebrow">Partner onboarding</span><h1>Grow your fleet.<br/>Drive your business.</h1><p>Create your vendor workspace, complete your profile, and submit it for administrator approval.</p></div></section><section className="login-panel"><form onSubmit={handleSubmit(submit)}><span className="eyebrow">New vendor</span><h2>Create vendor account</h2><p>You can sign in immediately. Vehicle publishing requires administrator approval.</p>{[['name','Full name','text'],['email','Email address','email'],['phone','Phone number','tel'],['password','Password','password']].map(([name,label,type])=><label key={name}>{label}<input {...register(name)} type={type} placeholder={label}/>{errors[name]&&<small className="field-error">{errors[name].message}</small>}</label>)}{serverError&&<div className="form-error">{serverError}</div>}<button className="primary-button" disabled={isSubmitting}>{isSubmitting?'Creating…':<>Create account <ArrowRight size={18}/></>}</button><small className="login-help">Already registered? <Link to="/login">Sign in</Link></small></form></section></main>
}
