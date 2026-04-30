import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatINR(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount)
}

export function formatDate(dateStr: string): string {
  try {
    return new Date(dateStr).toLocaleDateString('en-IN', {
      day: '2-digit', month: 'short', year: 'numeric',
    })
  } catch {
    return dateStr
  }
}

export function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  return `${days}d ago`
}

export function generateToken(len = 24): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789'
  return Array.from({ length: len }, () =>
    chars[Math.floor(Math.random() * chars.length)]
  ).join('')
}

export function creditPercent(used: number, total: number): number {
  if (total === 0) return 0
  return Math.round((used / total) * 100)
}

export const PLANS = {
  free:    { id: 'free',    name: 'Free Trial', price: 0,    credits: 50   },
  starter: { id: 'starter', name: 'Starter',    price: 999,  credits: 300  },
  growth:  { id: 'growth',  name: 'Growth',     price: 1999, credits: 800  },
  pro:     { id: 'pro',     name: 'Pro',         price: 2999, credits: 1500 },
  firm:    { id: 'firm',    name: 'Firm',        price: 4999, credits: 3000 },
} as const
