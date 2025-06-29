"use client"

import React from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import type { SimulationResult } from "@/app/page"
import { Download, FileText, ImageIcon, Table, FileSpreadsheet, Share } from "lucide-react"

interface UIGameScenario {
  id: string
  name: string
  description: string
  playerCount: number
  strategies: string[]
  category: string
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced'
  payoffMatrix: number[][][]
  realWorldApplications: string[]
  educationalFocus: string[]
  learningObjectives: string[]
  nashEquilibria: any[]
  dominantStrategies: any[]
}

interface ExportResultsProps {
  results: SimulationResult
  game: UIGameScenario
}

export function ExportResults({ results, game }: ExportResultsProps) {
  const exportToCSV = () => {
    const csvData = [
      ["Metric", "Value"],
      ["Game", game.name],
      ["Iterations", results.iterations.toString()],
      ["Total Outcomes", Object.keys(results.outcomes).length.toString()],
      ...Object.entries(results.outcomes).map(([outcome, frequency]) => [`Outcome: ${outcome}`, frequency.toString()]),
      ...results.expectedPayoffs.map((payoff, index) => [`Player ${index + 1} Expected Payoff`, payoff.toString()]),
    ]

    const csvContent = csvData.map((row) => row.join(",")).join("\n")
    const blob = new Blob([csvContent], { type: "text/csv" })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `${game.id}-simulation-results.csv`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  const exportToJSON = () => {
    const jsonData = {
      game: {
        id: game.id,
        name: game.name,
        description: game.description,
      },
      simulation: {
        iterations: results.iterations,
        timestamp: new Date().toISOString(),
      },
      results: {
        outcomes: results.outcomes,
        strategyFrequencies: results.strategyFrequencies,
        expectedPayoffs: results.expectedPayoffs,
        nashEquilibrium: results.nashEquilibrium,
        dominantStrategies: results.dominantStrategies,
      },
    }

    const blob = new Blob([JSON.stringify(jsonData, null, 2)], { type: "application/json" })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `${game.id}-simulation-results.json`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  const generateReport = () => {
    const report = `
# Monte Carlo Game Theory Simulation Report

## Game: ${game.name}
**Description:** ${game.description}
**Date:** ${new Date().toLocaleDateString()}

## Simulation Parameters
- **Iterations:** ${results.iterations.toLocaleString()}
- **Players:** ${game.playerCount}
- **Strategies:** ${game.strategies.join(", ")}

## Results Summary

### Outcome Distribution
${Object.entries(results.outcomes)
  .sort(([, a], [, b]) => b - a)
  .map(
    ([outcome, frequency]) =>
      `- **${outcome}:** ${frequency} times (${((frequency / results.iterations) * 100).toFixed(1)}%)`,
  )
  .join("\n")}

### Expected Payoffs
${results.expectedPayoffs.map((payoff, index) => `- **Player ${index + 1}:** ${payoff.toFixed(3)}`).join("\n")}

### Strategic Analysis
${
  results.nashEquilibrium
    ? `**Nash Equilibrium Found:**\n${results.nashEquilibrium.strategies
        .map(
          (strategyIndex, playerIndex) =>
            `- Player ${playerIndex + 1}: ${game.strategies[strategyIndex]} (Payoff: ${results.nashEquilibrium!.payoffs[playerIndex].toFixed(2)})`,
        )
        .join("\n")}`
    : "**Nash Equilibrium:** No pure strategy equilibrium found."
}

${
  results.dominantStrategies && results.dominantStrategies.length > 0
    ? `**Dominant Strategies:** ${results.dominantStrategies.join(", ")}`
    : "**Dominant Strategies:** None identified."
}

## Conclusions
This simulation provides insights into strategic decision-making in the ${game.name} scenario. 
The results can help understand optimal play and equilibrium concepts in game theory.

---
*Generated by Game Theory Studio*
    `.trim()

    const blob = new Blob([report], { type: "text/markdown" })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `${game.id}-simulation-report.md`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  const copyToClipboard = async () => {
    const summary = `
Game: ${game.name}
Iterations: ${results.iterations.toLocaleString()}
Most Common Outcome: ${Object.entries(results.outcomes).sort(([, a], [, b]) => b - a)[0]?.[0] || "N/A"}
Average Payoffs: ${results.expectedPayoffs.map((p) => p.toFixed(2)).join(", ")}
Nash Equilibrium: ${results.nashEquilibrium ? "Found" : "Not found"}
    `.trim()

    try {
      await navigator.clipboard.writeText(summary)
      // You could add a toast notification here
    } catch (err) {
      console.error("Failed to copy to clipboard:", err)
    }
  }

  const exportToExcel = async () => {
    // Create Excel-compatible CSV with enhanced formatting
    const headers = ["Metric", "Value", "Category", "Description"]
    const csvData = [
      headers,
      ["Game ID", game.id, "Game Info", "Unique identifier for the game scenario"],
      ["Game Name", game.name, "Game Info", "Display name of the game"],
      ["Date", new Date().toLocaleDateString(), "Simulation Info", "Date when simulation was run"],
      ["Iterations", results.iterations.toString(), "Simulation Info", "Number of Monte Carlo iterations performed"],
      ["Total Outcomes", Object.keys(results.outcomes).length.toString(), "Results", "Number of unique outcomes observed"],
      [],
      ["OUTCOME FREQUENCIES", "", "", ""],
      ...Object.entries(results.outcomes).map(([outcome, frequency]) => [
        `Outcome: ${outcome}`,
        frequency.toString(),
        "Outcomes",
        `Frequency: ${((frequency / results.iterations) * 100).toFixed(2)}%`
      ]),
      [],
      ["EXPECTED PAYOFFS", "", "", ""],
      ...results.expectedPayoffs.map((payoff, index) => [
        `Player ${index + 1} Expected Payoff`,
        payoff.toFixed(4),
        "Payoffs",
        `Average payoff for player ${index + 1}`
      ]),
      [],
      ["STRATEGIC ANALYSIS", "", "", ""],
      ["Nash Equilibrium", results.nashEquilibrium ? "Found" : "Not Found", "Analysis", "Pure strategy Nash equilibrium"],
      ["Dominant Strategies", results.dominantStrategies?.join("; ") || "None", "Analysis", "Strategies that dominate others"]
    ]

    const csvContent = csvData.map((row) => row.map(cell => `"${cell}"`).join(",")).join("\n")
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `${game.id}-simulation-results.xlsx.csv`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  const createShareableURL = () => {
    const shareData = {
      gameId: game.id,
      gameName: game.name,
      iterations: results.iterations,
      timestamp: new Date().toISOString(),
      summary: {
        totalOutcomes: Object.keys(results.outcomes).length,
        topOutcome: Object.entries(results.outcomes).sort(([,a], [,b]) => b - a)[0],
        expectedPayoffs: results.expectedPayoffs,
        hasNashEquilibrium: !!results.nashEquilibrium
      }
    }
    
    // Encode data for URL
    const encodedData = btoa(JSON.stringify(shareData))
    const shareableURL = `${window.location.origin}${window.location.pathname}?share=${encodedData}`
    
    // Copy to clipboard
    navigator.clipboard.writeText(shareableURL).then(() => {
      // You could add a toast notification here
      console.log('Shareable URL copied to clipboard:', shareableURL)
    }).catch(err => {
      console.error('Failed to copy URL:', err)
      // Fallback: create a temporary text area
      const textArea = document.createElement('textarea')
      textArea.value = shareableURL
      document.body.appendChild(textArea)
      textArea.select()
      document.execCommand('copy')
      document.body.removeChild(textArea)
    })
    
    return shareableURL
  }

  const exportChartsAsImages = async (format: 'png' | 'jpeg' = 'png') => {
    // This function will trigger export of all visible charts
    const charts = document.querySelectorAll('[data-chart-type]')
    const exportPromises: Promise<void>[] = []
    
    charts.forEach((chartElement, index) => {
      const chartType = chartElement.getAttribute('data-chart-type') || `chart-${index}`
      const svgElement = chartElement.querySelector('svg')
      
      if (svgElement) {
        const promise = exportSVGAsImage(svgElement, format, `${game.id}-${chartType}`)
        exportPromises.push(promise)
      }
    })
    
    try {
      await Promise.all(exportPromises)
      console.log(`All charts exported as ${format.toUpperCase()}`)
    } catch (error) {
      console.error('Failed to export charts:', error)
    }
  }

  const exportSVGAsImage = (svgElement: SVGSVGElement, format: 'png' | 'jpeg', filename: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      const svgData = new XMLSerializer().serializeToString(svgElement)
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')!
      const img = new Image()
      
      // Get SVG dimensions
      const svgRect = svgElement.getBoundingClientRect()
      canvas.width = svgRect.width || 800
      canvas.height = svgRect.height || 600
      
      const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' })
      const url = URL.createObjectURL(svgBlob)
      
      img.onload = () => {
        // White background for JPEG
        if (format === 'jpeg') {
          ctx.fillStyle = '#ffffff'
          ctx.fillRect(0, 0, canvas.width, canvas.height)
        }
        
        ctx.drawImage(img, 0, 0)
        
        canvas.toBlob((blob) => {
          if (blob) {
            const downloadUrl = URL.createObjectURL(blob)
            const link = document.createElement('a')
            link.href = downloadUrl
            link.download = `${filename}.${format}`
            link.click()
            URL.revokeObjectURL(downloadUrl)
            resolve()
          } else {
            reject(new Error('Failed to create blob'))
          }
        }, `image/${format}`, format === 'jpeg' ? 0.9 : 1.0)
        
        URL.revokeObjectURL(url)
      }
      
      img.onerror = () => {
        URL.revokeObjectURL(url)
        reject(new Error('Failed to load SVG'))
      }
      
      img.src = url
    })
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Download className="w-5 h-5" />
          Export Simulation Results
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Primary Export Options */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          <Button onClick={exportToCSV} variant="outline" className="flex items-center gap-2">
            <Table className="w-4 h-4" />
            Export CSV
          </Button>

          <Button onClick={exportToExcel} variant="outline" className="flex items-center gap-2">
            <FileSpreadsheet className="w-4 h-4" />
            Export Excel
          </Button>

          <Button onClick={exportToJSON} variant="outline" className="flex items-center gap-2">
            <FileText className="w-4 h-4" />
            Export JSON
          </Button>

          <Button onClick={generateReport} variant="outline" className="flex items-center gap-2">
            <FileText className="w-4 h-4" />
            Generate Report
          </Button>

          <Button onClick={copyToClipboard} variant="outline" className="flex items-center gap-2">
            <ImageIcon className="w-4 h-4" />
            Copy Summary
          </Button>

          <Button onClick={createShareableURL} variant="outline" className="flex items-center gap-2">
            <Share className="w-4 h-4" />
            Share Results
          </Button>
        </div>

        {/* Chart Export Options */}
        <div className="pt-4 border-t">
          <h4 className="font-semibold mb-3 flex items-center gap-2">
            <ImageIcon className="w-4 h-4" />
            Export Charts
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <Button 
              onClick={() => exportChartsAsImages('png')} 
              variant="outline" 
              size="sm"
              className="flex items-center gap-2"
            >
              <ImageIcon className="w-4 h-4" />
              PNG Images
            </Button>
            <Button 
              onClick={() => exportChartsAsImages('jpeg')} 
              variant="outline" 
              size="sm"
              className="flex items-center gap-2"
            >
              <ImageIcon className="w-4 h-4" />
              JPEG Images
            </Button>
            <Button 
              onClick={() => {/* SVG export will be handled by individual charts */}} 
              variant="outline" 
              size="sm"
              className="flex items-center gap-2"
            >
              <FileText className="w-4 h-4" />
              SVG Vector
            </Button>
          </div>
        </div>

        {/* Format Descriptions */}
        <div className="pt-4 border-t">
          <h4 className="font-semibold mb-2">Export Formats</h4>
          <div className="text-sm text-gray-600 space-y-1">
            <div>
              <strong>CSV/Excel:</strong> Spreadsheet-compatible data for statistical analysis
            </div>
            <div>
              <strong>JSON:</strong> Structured data for programmatic use and data exchange
            </div>
            <div>
              <strong>Report:</strong> Human-readable markdown summary with insights
            </div>
            <div>
              <strong>Share:</strong> Generate a shareable URL with simulation summary
            </div>
            <div>
              <strong>Charts:</strong> Export visualizations as PNG, JPEG, or SVG images
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
