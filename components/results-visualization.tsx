"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import type { SimulationResult, GameScenario } from "@/app/page"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
} from "recharts"

interface ResultsVisualizationProps {
  results: SimulationResult
  game: GameScenario
}

const COLORS = ["#3b82f6", "#ef4444", "#10b981", "#f59e0b", "#8b5cf6", "#06b6d4"]

export function ResultsVisualization({ results, game }: ResultsVisualizationProps) {
  // Prepare data for charts
  const outcomeData = Object.entries(results.outcomes).map(([outcome, frequency]) => ({
    outcome,
    frequency,
    percentage: ((frequency / results.iterations) * 100).toFixed(1),
  }))

  const strategyData = Object.entries(results.strategyFrequencies).map(([strategy, frequency]) => ({
    strategy,
    frequency,
    percentage: ((frequency / results.iterations) * 100).toFixed(1),
  }))

  const convergenceData = results.convergenceData.slice(0, Math.min(100, results.convergenceData.length))

  const payoffData = results.expectedPayoffs.map((payoff, index) => ({
    player: `Player ${index + 1}`,
    payoff: payoff.toFixed(3),
  }))

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Total Iterations</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600">{results.iterations.toLocaleString()}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Unique Outcomes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">{Object.keys(results.outcomes).length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Average Payoff</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-purple-600">
              {(results.expectedPayoffs.reduce((a, b) => a + b, 0) / results.expectedPayoffs.length).toFixed(2)}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Outcome Frequencies</CardTitle>
            <CardDescription>Distribution of game outcomes across all iterations</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={outcomeData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="outcome" />
                <YAxis />
                <Tooltip
                  formatter={(value, name) => [
                    `${value} (${outcomeData.find((d) => d.frequency === value)?.percentage}%)`,
                    "Frequency",
                  ]}
                />
                <Bar dataKey="frequency" fill="#3b82f6" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Strategy Distribution</CardTitle>
            <CardDescription>How often each strategy combination was played</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={strategyData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ strategy, percentage }) => `${strategy}: ${percentage}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="frequency"
                >
                  {strategyData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Expected Payoffs</CardTitle>
            <CardDescription>Average payoff for each player</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={payoffData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="player" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="payoff" fill="#10b981" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Strategy Convergence</CardTitle>
            <CardDescription>How strategies evolved over time (sample of iterations)</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={convergenceData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="iteration" />
                <YAxis />
                <Tooltip />
                {game.strategies.map((strategy, index) => (
                  <Line
                    key={strategy}
                    type="monotone"
                    dataKey={`strategies.${index}`}
                    stroke={COLORS[index % COLORS.length]}
                    name={strategy}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Detailed Results</CardTitle>
          <CardDescription>Comprehensive breakdown of simulation outcomes</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold mb-3">Most Common Outcomes</h4>
              <div className="space-y-2">
                {outcomeData
                  .sort((a, b) => b.frequency - a.frequency)
                  .slice(0, 5)
                  .map((outcome, index) => (
                    <div key={index} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                      <span className="font-medium">{outcome.outcome}</span>
                      <Badge variant="secondary">
                        {outcome.frequency} ({outcome.percentage}%)
                      </Badge>
                    </div>
                  ))}
              </div>
            </div>

            <div>
              <h4 className="font-semibold mb-3">Player Performance</h4>
              <div className="space-y-2">
                {results.expectedPayoffs.map((payoff, index) => (
                  <div key={index} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                    <span className="font-medium">Player {index + 1}</span>
                    <Badge variant="outline">{payoff.toFixed(3)} avg payoff</Badge>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
