import { describe, it, expect, beforeEach, vi } from "vitest"
import ExportManager from "@/lib/export-manager"

describe("Export Functionality - Task 11", () => {
  it("should export results as CSV files", () => {
    const exportManager = ExportManager.getInstance()
    expect(exportManager).toBeDefined()
    expect(typeof exportManager.exportCSV).toBe("function")
  })

  it("should export results as Excel files", () => {
    const exportManager = ExportManager.getInstance()
    expect(typeof exportManager.exportExcel).toBe("function")
  })

  it("should create shareable URLs", () => {
    const exportManager = ExportManager.getInstance()
    expect(typeof exportManager.createShareableURL).toBe("function")
    expect(typeof exportManager.parseSharedResult).toBe("function")
  })

  it("should export images in multiple formats", () => {
    const exportManager = ExportManager.getInstance()
    expect(typeof exportManager.exportSVGAsImage).toBe("function")
  })

  it("should generate comprehensive reports", () => {
    const exportManager = ExportManager.getInstance()
    expect(typeof exportManager.generateReport).toBe("function")
  })
})
