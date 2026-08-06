import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import { LoginForm } from './LoginForm'
import { ShieldCheck, Lock } from 'lucide-react'

export const revalidate = 0

export default async function AdminLoginPage() {
  const session = await auth()
  if (session) {
    redirect('/admin')
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center py-12 px-4">
      <div className="comic-panel bg-white p-8 max-w-md w-full space-y-6">
        <div className="text-center space-y-2">
          <div className="inline-block p-3 bg-[#121212] text-[#FFEE00] border-2 border-[#121212] rounded-full shadow-[3px_3px_0_#E63946]">
            <Lock className="w-8 h-8" />
          </div>
          <h1 className="font-comic text-3xl text-[#121212]">ADMIN LOGIN</h1>
          <p className="text-xs text-gray-600 font-body">
            Akses khusus pemilik toko. Memerlukan autentikasi 2FA TOTP (Google Authenticator / Authy).
          </p>
        </div>

        <LoginForm />
      </div>
    </div>
  )
}
