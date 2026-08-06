'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Loader2, KeyRound, Mail, Lock, ShieldCheck } from 'lucide-react'

export function LoginForm() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [totpCode, setTotpCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const res = await signIn('credentials', {
        email,
        password,
        totpCode,
        redirect: false,
      })

      if (res?.error) {
        setError('Login gagal. Periksa email, password, atau kode 2FA TOTP Anda.')
        setLoading(false)
      } else {
        router.push('/admin')
        router.refresh()
      }
    } catch (err: any) {
      setError(err.message || 'Terjadi kesalahan sistem saat mencoba login')
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="p-3 bg-red-100 border-2 border-[#121212] rounded text-xs text-red-800 font-bold">
          {error}
        </div>
      )}

      <div>
        <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
          Email Admin
        </label>
        <div className="relative">
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="admin@example.com"
            className="w-full pl-9 pr-3 py-2 text-xs border-2 border-[#121212] rounded font-body focus:outline-none focus:ring-2 focus:ring-[#FFEE00]"
          />
          <Mail className="w-4 h-4 text-gray-500 absolute left-3 top-2.5" />
        </div>
      </div>

      <div>
        <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
          Password (Argon2id)
        </label>
        <div className="relative">
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••••••"
            className="w-full pl-9 pr-3 py-2 text-xs border-2 border-[#121212] rounded font-body focus:outline-none focus:ring-2 focus:ring-[#FFEE00]"
          />
          <Lock className="w-4 h-4 text-gray-500 absolute left-3 top-2.5" />
        </div>
      </div>

      <div>
        <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
          Kode 2FA TOTP (6 Digit)
        </label>
        <div className="relative">
          <input
            type="text"
            required
            maxLength={6}
            value={totpCode}
            onChange={(e) => setTotpCode(e.target.value.replace(/\D/g, ''))}
            placeholder="123456"
            className="w-full pl-9 pr-3 py-2 text-xs border-2 border-[#121212] rounded font-body font-mono tracking-widest text-center text-base focus:outline-none focus:ring-2 focus:ring-[#FFEE00]"
          />
          <KeyRound className="w-4 h-4 text-gray-500 absolute left-3 top-2.5" />
        </div>
        <p className="text-[10px] text-gray-500 mt-1 font-body">
          Buka aplikasi Google Authenticator / Authy untuk mengambil kode 6 digit.
        </p>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="comic-btn-dark w-full py-2.5 text-sm"
      >
        {loading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>VERIFIKASI...</span>
          </>
        ) : (
          <>
            <ShieldCheck className="w-4 h-4 text-[#FFEE00]" />
            <span>MASUK KE DASHBOARD</span>
          </>
        )}
      </button>
    </form>
  )
}
