import { SimulationResult } from './game-theory-types'

export interface ExportManagerConfig {
  includeTimestamp?: boolean
  includeMetadata?: boolean
  quality?: number
  scale?: number
}

export interface ShareableResultData {
  gameId: string
  gameName: string
  iterations: number
  timestamp: string
  summary: {
    totalOutcomes: number
    topOutcome: [string, number]
    expectedPayoffs: number[]
    hasNashEquilibrium: boolean
  }
  results?: Partial<SimulationResult>
}

export class ExportManager {
  private static instance: ExportManager | null = null

  static getInstance(): ExportManager {
    if (!ExportManager.instance) {
      ExportManager.instance = new ExportManager()
    }
    return ExportManager.instance
  }

  /**
   * Export simulation results as CSV
   */
  async exportCSV(results: SimulationResult, game: any, config: ExportManagerConfig = {}): Promise<void> {
    const csvData = [
      ["Metric", "Value"],
      ["Game", game.name],
      ["Iterations", results.iterations.toString()],
      ["Total Outcomes", Object.keys(results.outcomes).length.toString()],
      ...Object.entries(results.outcomes).map(([outcome, frequency]) => 
        [`Outcome: ${outcome}`, frequency.toString()]
      ),
      ...results.expectedPayoffs.map((payoff, index) => 
        [`Player ${index + 1} Expected Payoff`, payoff.toString()]
      ),
    ]

    if (config.includeTimestamp) {
      csvData.splice(2, 0, ["Export Date", new Date().toISOString()])
    }

    const csvContent = csvData.map((row) => row.join(",")).join("\n")
    this.downloadFile(csvContent, `${game.id}-simulation-results.csv`, "text/csv")
  }

  /**
   * Export simulation results as Excel-compatible CSV
   */
  async exportExcel(results: SimulationResult, game: any, config: ExportManagerConfig = {}): Promise<void> {
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
    this.downloadFile(csvContent, `${game.id}-simulation-results.xlsx.csv`, "text/csv")
  }

  /**
   * Export simulation results as JSON
   */
  async exportJSON(results: SimulationResult, game: any, config: ExportManagerConfig = {}): Promise<void> {
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

    if (config.includeMetadata) {
      jsonData.simulation = {
        ...jsonData.simulation,
        exportedAt: new Date().toISOString(),
        exportVersion: "1.0",
        source: "Game Theory Studio"
      }
    }

    this.downloadFile(
      JSON.stringify(jsonData, null, 2), 
      `${game.id}-simulation-results.json`, 
      "application/json"
    )
  }

  /**
   * Generate a comprehensive markdown report
   */
  async generateReport(results: SimulationResult, game: any, config: ExportManagerConfig = {}): Promise<void> {
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

${config.includeTimestamp ? `\n---\n*Generated on ${new Date().toISOString()} by Game Theory Studio*` : "---\n*Generated by Game Theory Studio*"}
    `.trim()

    this.downloadFile(report, `${game.id}-simulation-report.md`, "text/markdown")
  }

  /**
   * Create a shareable URL with simulation summary
   */
  createShareableURL(results: SimulationResult, game: any): string {
    const shareData: ShareableResultData = {
      gameId: game.id,
      gameName: game.name,
      iterations: results.iterations,
      timestamp: new Date().toISOString(),
      summary: {
        totalOutcomes: Object.keys(results.outcomes).length,
        topOutcome: Object.entries(results.outcomes).sort(([,a], [,b]) => b - a)[0] as [string, number],
        expectedPayoffs: results.expectedPayoffs,
        hasNashEquilibrium: !!results.nashEquilibrium
      }
    }
    
    // Encode data for URL
    const encodedData = btoa(JSON.stringify(shareData))
    const shareableURL = `${window.location.origin}${window.location.pathname}?share=${encodedData}`
    
    // Copy to clipboard
    this.copyToClipboard(shareableURL)
    
    return shareableURL
  }

  /**
   * Parse shared result data from URL
   */
  parseSharedResult(shareParam: string): ShareableResultData | null {
    try {
      const decodedData = atob(shareParam)
      return JSON.parse(decodedData) as ShareableResultData
    } catch (error) {
      console.error('Failed to parse shared result data:', error)
      return null
    }
  }

  /**
   * Export SVG element as image
   */
  async exportSVGAsImage(
    svgElement: SVGSVGElement, 
    format: 'png' | 'jpeg' | 'webp', 
    filename: string,
    config: ExportManagerConfig = {}
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      const svgData = new XMLSerializer().serializeToString(svgElement)
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')!
      const img = new Image()
      
      // Get SVG dimensions with scaling
      const svgRect = svgElement.getBoundingClientRect()
      const scale = config.scale || 1
      canvas.width = (svgRect.width || 800) * scale
      canvas.height = (svgRect.height || 600) * scale
      
      const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' })
      const url = URL.createObjectURL(svgBlob)
      
      img.onload = () => {
        // Add background for JPEG/WebP
        if (format === 'jpeg' || format === 'webp') {
          ctx.fillStyle = '#ffffff'
          ctx.fillRect(0, 0, canvas.width, canvas.height)
        }
        
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
        
        const quality = config.quality || (format === 'jpeg' ? 0.9 : 1.0)
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
        }, `image/${format}`, quality)
        
        URL.revokeObjectURL(url)
      }
      
      img.onerror = () => {
        URL.revokeObjectURL(url)
        reject(new Error('Failed to load SVG'))
      }
      
      img.src = url
    })
  }

  /**
   * Export multiple charts as a zip file (simulation)
   */
  async exportChartsAsZip(
    charts: { element: SVGSVGElement; name: string }[], 
    format: 'png' | 'jpeg' | 'svg',
    zipFilename: string,
    config: ExportManagerConfig = {}
  ): Promise<void> {
    // This is a simplified implementation
    // In a real application, you'd use a library like JSZip
    
    const exportPromises = charts.map(({ element, name }) => 
      this.exportSVGAsImage(element, format as any, name, config)
    )
    
    try {
      await Promise.all(exportPromises)
      console.log(`All charts exported as ${format.toUpperCase()}`)
    } catch (error) {
      console.error('Failed to export charts:', error)
      throw error
    }
  }

  /**
   * Utility method to download a file
   */
  private downloadFile(content: string, filename: string, mimeType: string): void {
    const blob = new Blob([content], { type: mimeType })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = filename
    a.click()
    window.URL.revokeObjectURL(url)
  }

  /**
   * Utility method to copy text to clipboard
   */
  private async copyToClipboard(text: string): Promise<void> {
    try {
      await navigator.clipboard.writeText(text)
      console.log('Copied to clipboard:', text)
    } catch (err) {
      console.error('Failed to copy to clipboard:', err)
      // Fallback for older browsers
      const textArea = document.createElement('textarea')
      textArea.value = text
      document.body.appendChild(textArea)
      textArea.select()
      document.execCommand('copy')
      document.body.removeChild(textArea)
    }
  }
}

export default ExportManager
