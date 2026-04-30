'use client'
export default function AdminSignOut() {
  return (
    <button
      onClick={async () => {
        await fetch('/api/admin/auth', { method: 'DELETE' })
        window.location.href = '/admin/login'
      }}
      className="w-full text-left text-xs text-gray-500 hover:text-gray-300 px-3 py-2 rounded-lg hover:bg-gray-800 transition-colors"
    >
      🚪 Sign Out
    </button>
  )
}
