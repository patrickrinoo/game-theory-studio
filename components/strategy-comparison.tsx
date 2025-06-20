"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import type { SimulationResult } from "@/app/page"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"
import { TrendingUp, Clock } from "lucide-react"

interface StrategyComparisonProps {
  history: SimulationResult[]
}

export function StrategyComparison({ history }: StrategyComparisonProps) {
  if (history.length === 0) return null

  const recentResults = history.slice(0, 3)

  const comparisonData = recentResults.map((result, index) => ({
    simulation: `Sim ${index + 1}`,
    avgPayoff: result.expectedPayoffs.reduce((a, b) => a + b, 0) / result.expectedPayoffs.length,
    iterations: result.iterations,
    timestamp: new Date(result.timestamp).toLocaleTimeString(),
  }))

  return (
    <Card className="bg-white/70 backdrop-blur-xl border-white/20 shadow-xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-purple-500" />
          Recent Simulations
        </CardTitle>
        <CardDescription>Compare your last few simulation results</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={comparisonData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="simulation" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="avgPayoff" fill="#8b5cf6" />
          </BarChart>
        </ResponsiveContainer>

        <div className="space-y-2">
          {recentResults.map((result, index) => (
            <div key={result.timestamp} className="flex items-center justify-between p-2 bg-white/50 rounded-lg">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-gray-400" />
                <span className="text-sm">{new Date(result.timestamp).toLocaleTimeString()}</span>
              </div>
              <div className="flex gap-2">
                <Badge variant="outline" className="text-xs">
                  {result.iterations.toLocaleString()} iterations
                </Badge>
                <Badge variant="secondary" className="text-xs">
                  Avg: {(result.expectedPayoffs.reduce((a, b) => a + b, 0) / result.expectedPayoffs.length).toFixed(2)}
                </Badge>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
