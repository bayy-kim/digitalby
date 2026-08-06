import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { History, ShieldAlert, UserCheck } from 'lucide-react'

export const revalidate = 0

export default async function AuditLogPage() {
  const session = await auth()
  if (!session) {
    redirect('/admin/login')
  }

  const logs = await prisma.auditLog.findMany({
    orderBy: { createdAt: 'desc' },
    take: 100,
  })

  return (
    <div className="space-y-6">
      <div className="border-b-3 border-[#121212] pb-4">
        <h1 className="font-comic text-3xl text-[#121212]">AUDIT LOG KEAMANAN & AKSI</h1>
        <p className="text-xs text-gray-600 font-body">
          Rekaman semua aksi sensitif admin (login, perubahan produk, verifikasi manual order) untuk akuntabilitas.
        </p>
      </div>

      <div className="comic-panel bg-white p-4 overflow-x-auto">
        <table className="w-full text-left text-xs font-body border-collapse">
          <thead>
            <tr className="border-b-3 border-[#121212] bg-[#FFEE00] font-comic text-sm">
              <th className="p-3">Waktu</th>
              <th className="p-3">Aktor (Admin)</th>
              <th className="p-3">Aksi</th>
              <th className="p-3">Detail</th>
              <th className="p-3">IP Address</th>
            </tr>
          </thead>
          <tbody>
            {logs.length === 0 ? (
              <tr>
                <td colSpan={5} className="p-6 text-center text-gray-500 font-bold">
                  Belum ada log audit tercatat.
                </td>
              </tr>
            ) : (
              logs.map((log) => (
                <tr key={log.id} className="border-b border-gray-200 hover:bg-gray-50">
                  <td className="p-3 font-mono text-[11px] text-gray-500">
                    {new Date(log.createdAt).toLocaleString('id-ID')}
                  </td>
                  <td className="p-3 font-bold text-[#121212]">{log.actor}</td>
                  <td className="p-3">
                    <span className="comic-badge bg-[#121212] text-[#FFEE00]">
                      {log.action}
                    </span>
                  </td>
                  <td className="p-3 font-mono text-gray-700 text-[11px]">{log.detail || '-'}</td>
                  <td className="p-3 font-mono text-gray-500 text-[11px]">{log.ipAddress || '-'}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
