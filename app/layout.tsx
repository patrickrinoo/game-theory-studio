import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Game Theory Studio',
  description: 'Interactive Monte Carlo simulations for game theory with real-time visualizations and strategic analysis',
  authors: [{ name: 'Patrick Rino' }],
  keywords: ['game theory', 'monte carlo', 'simulation', 'visualization', 'strategy', 'nash equilibrium'],
  openGraph: {
    title: 'Game Theory Studio',
    description: 'Interactive Monte Carlo simulations for game theory with real-time visualizations and strategic analysis',
    type: 'website',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
