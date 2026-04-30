import Link from 'next/link'
import AdminSignOut from './AdminSignOut'

const navItems = [
  { href: '/admin',          label: 'Dashboard',       icon: '⊞' },
  { href: '/admin/requests', label: 'Access Requests', icon: '📋' },
  { href: '/admin/firms',    label: 'CA Firms',        icon: '🏢' },
  { href: '/admin/revenue',  label: 'Revenue',         icon: '₹'  },
]

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      <aside className="w-56 flex-shrink-0 bg-gray-900 flex flex-col">
        <div className="p-5 border-b border-gray-800">
          <div className="font-bold text-white">Run<span className="text-blue-400">Agent</span></div>
          <div className="text-xs text-gray-500 mt-0.5">Admin Panel</div>
        </div>
        <nav className="flex-1 p-3 space-y-0.5">
          {navItems.map(item => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-gray-400 hover:text-white hover:bg-gray-800 transition-colors"
            >
              <span>{item.icon}</span>{item.label}
            </Link>
          ))}
        </nav>
        <div className="p-3 border-t border-gray-800 space-y-1">
          <AdminSignOut />
          <Link href="/" className="block text-xs text-gray-600 hover:text-gray-400 px-3 py-2 transition-colors">
            ← Back to site
          </Link>
        </div>
      </aside>
      <main className="flex-1 overflow-y-auto">
        <div className="p-6">{children}</div>
      </main>
    </div>
  )
}
