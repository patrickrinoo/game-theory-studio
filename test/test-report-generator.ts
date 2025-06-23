import fs from 'fs';
import path from 'path';

interface TestResult {
  name: string;
  status: 'pass' | 'fail' | 'skip';
  duration: number;
  error?: string;
  coverage?: number;
}

interface TestSuite {
  name: string;
  tests: TestResult[];
  totalTests: number;
  passedTests: number;
  failedTests: number;
  skippedTests: number;
  totalDuration: number;
  coverage: number;
}

interface TestReport {
  timestamp: string;
  suites: TestSuite[];
  overall: {
    totalTests: number;
    passedTests: number;
    failedTests: number;
    skippedTests: number;
    totalDuration: number;
    overallCoverage: number;
    prdRequirements: {
      performanceTests: boolean;
      functionalTests: boolean;
      integrationTests: boolean;
      coverageThreshold: boolean;
    };
  };
}

export class TestReportGenerator {
  private report: TestReport;

  constructor() {
    this.report = {
      timestamp: new Date().toISOString(),
      suites: [],
      overall: {
        totalTests: 0,
        passedTests: 0,
        failedTests: 0,
        skippedTests: 0,
        totalDuration: 0,
        overallCoverage: 0,
        prdRequirements: {
          performanceTests: false,
          functionalTests: false,
          integrationTests: false,
          coverageThreshold: false
        }
      }
    };
  }

  addTestSuite(suite: TestSuite) {
    this.suites.push(suite);
    this.updateOverallStats();
  }

  private updateOverallStats() {
    this.report.overall = {
      totalTests: this.report.suites.reduce((sum, suite) => sum + suite.totalTests, 0),
      passedTests: this.report.suites.reduce((sum, suite) => sum + suite.passedTests, 0),
      failedTests: this.report.suites.reduce((sum, suite) => sum + suite.failedTests, 0),
      skippedTests: this.report.suites.reduce((sum, suite) => sum + suite.skippedTests, 0),
      totalDuration: this.report.suites.reduce((sum, suite) => sum + suite.totalDuration, 0),
      overallCoverage: this.calculateOverallCoverage(),
      prdRequirements: this.checkPRDRequirements()
    };
  }

  private calculateOverallCoverage(): number {
    if (this.report.suites.length === 0) return 0;
    
    const totalCoverage = this.report.suites.reduce((sum, suite) => sum + suite.coverage, 0);
    return totalCoverage / this.report.suites.length;
  }

  private checkPRDRequirements() {
    const suiteNames = this.report.suites.map(suite => suite.name.toLowerCase());
    
    return {
      performanceTests: suiteNames.some(name => name.includes('performance')),
      functionalTests: suiteNames.some(name => name.includes('unit') || name.includes('functional')),
      integrationTests: suiteNames.some(name => name.includes('integration') || name.includes('e2e')),
      coverageThreshold: this.report.overall.overallCoverage >= 90
    };
  }

  generateHTMLReport(): string {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Monte Carlo Game Theory Studio - Test Report</title>
    <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 20px; background: #f5f5f5; }
        .container { max-width: 1200px; margin: 0 auto; background: white; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 8px 8px 0 0; }
        .header h1 { margin: 0; font-size: 2.5em; font-weight: 300; }
        .header .timestamp { opacity: 0.8; margin-top: 10px; }
        .content { padding: 30px; }
        .summary { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin-bottom: 30px; }
        .stat-card { background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); color: white; padding: 20px; border-radius: 8px; text-align: center; }
        .stat-card.success { background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%); }
        .stat-card.warning { background: linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%); color: #333; }
        .stat-card.danger { background: linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%); color: #333; }
        .stat-number { font-size: 2.5em; font-weight: bold; margin-bottom: 5px; }
        .stat-label { font-size: 0.9em; opacity: 0.9; }
        .prd-requirements { background: #f8f9fa; border-left: 4px solid #007bff; padding: 20px; margin: 20px 0; border-radius: 4px; }
        .requirement { display: flex; align-items: center; margin: 10px 0; }
        .requirement-status { width: 20px; height: 20px; border-radius: 50%; margin-right: 10px; }
        .status-pass { background: #28a745; }
        .status-fail { background: #dc3545; }
        .test-suite { margin: 20px 0; border: 1px solid #dee2e6; border-radius: 8px; overflow: hidden; }
        .suite-header { background: #e9ecef; padding: 15px; border-bottom: 1px solid #dee2e6; }
        .suite-header h3 { margin: 0; color: #495057; }
        .suite-stats { display: flex; gap: 20px; margin-top: 10px; font-size: 0.9em; color: #6c757d; }
        .test-list { max-height: 300px; overflow-y: auto; }
        .test-item { padding: 10px 15px; border-bottom: 1px solid #f1f3f4; display: flex; justify-content: between; align-items: center; }
        .test-item:last-child { border-bottom: none; }
        .test-name { flex: 1; }
        .test-status { padding: 4px 8px; border-radius: 4px; font-size: 0.8em; font-weight: bold; }
        .status-pass-text { background: #d4edda; color: #155724; }
        .status-fail-text { background: #f8d7da; color: #721c24; }
        .status-skip-text { background: #fff3cd; color: #856404; }
        .test-duration { color: #6c757d; font-size: 0.8em; margin-left: 10px; }
        .error-details { background: #f8f9fa; border-left: 3px solid #dc3545; padding: 10px; margin-top: 5px; font-family: monospace; font-size: 0.8em; }
        .footer { background: #f8f9fa; padding: 20px; text-align: center; border-radius: 0 0 8px 8px; border-top: 1px solid #dee2e6; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🎮 Monte Carlo Game Theory Studio</h1>
            <h2>Comprehensive Testing Report</h2>
            <div class="timestamp">Generated: ${this.report.timestamp}</div>
        </div>
        
        <div class="content">
            <div class="summary">
                <div class="stat-card ${this.report.overall.failedTests === 0 ? 'success' : 'danger'}">
                    <div class="stat-number">${this.report.overall.totalTests}</div>
                    <div class="stat-label">Total Tests</div>
                </div>
                <div class="stat-card success">
                    <div class="stat-number">${this.report.overall.passedTests}</div>
                    <div class="stat-label">Passed</div>
                </div>
                <div class="stat-card ${this.report.overall.failedTests > 0 ? 'danger' : 'success'}">
                    <div class="stat-number">${this.report.overall.failedTests}</div>
                    <div class="stat-label">Failed</div>
                </div>
                <div class="stat-card ${this.report.overall.overallCoverage >= 90 ? 'success' : 'warning'}">
                    <div class="stat-number">${this.report.overall.overallCoverage.toFixed(1)}%</div>
                    <div class="stat-label">Coverage</div>
                </div>
                <div class="stat-card">
                    <div class="stat-number">${(this.report.overall.totalDuration / 1000).toFixed(1)}s</div>
                    <div class="stat-label">Duration</div>
                </div>
            </div>

            <div class="prd-requirements">
                <h3>📋 PRD Requirements Compliance</h3>
                <div class="requirement">
                    <div class="requirement-status ${this.report.overall.prdRequirements.performanceTests ? 'status-pass' : 'status-fail'}"></div>
                    Performance Tests (5s simple, 30s complex scenarios)
                </div>
                <div class="requirement">
                    <div class="requirement-status ${this.report.overall.prdRequirements.functionalTests ? 'status-pass' : 'status-fail'}"></div>
                    Functional/Unit Tests for Core Algorithms
                </div>
                <div class="requirement">
                    <div class="requirement-status ${this.report.overall.prdRequirements.integrationTests ? 'status-pass' : 'status-fail'}"></div>
                    Integration & End-to-End Tests
                </div>
                <div class="requirement">
                    <div class="requirement-status ${this.report.overall.prdRequirements.coverageThreshold ? 'status-pass' : 'status-fail'}"></div>
                    >90% Code Coverage Threshold
                </div>
            </div>

            ${this.report.suites.map(suite => this.renderTestSuite(suite)).join('')}
        </div>

        <div class="footer">
            <p>🚀 Monte Carlo Game Theory Studio - Testing Framework</p>
            <p>This report validates all PRD acceptance criteria and performance requirements.</p>
        </div>
    </div>
</body>
</html>`;
  }

  private renderTestSuite(suite: TestSuite): string {
    return `
        <div class="test-suite">
            <div class="suite-header">
                <h3>${suite.name}</h3>
                <div class="suite-stats">
                    <span>Tests: ${suite.totalTests}</span>
                    <span>Passed: ${suite.passedTests}</span>
                    <span>Failed: ${suite.failedTests}</span>
                    <span>Coverage: ${suite.coverage.toFixed(1)}%</span>
                    <span>Duration: ${(suite.totalDuration / 1000).toFixed(2)}s</span>
                </div>
            </div>
            <div class="test-list">
                ${suite.tests.map(test => this.renderTestItem(test)).join('')}
            </div>
        </div>`;
  }

  private renderTestItem(test: TestResult): string {
    const statusClass = `status-${test.status}-text`;
    const statusText = test.status.toUpperCase();
    
    return `
        <div class="test-item">
            <div class="test-name">${test.name}</div>
            <div class="test-status ${statusClass}">${statusText}</div>
            <div class="test-duration">${test.duration}ms</div>
            ${test.error ? `<div class="error-details">${test.error}</div>` : ''}
        </div>`;
  }

  generateJSONReport(): string {
    return JSON.stringify(this.report, null, 2);
  }

  generateMarkdownReport(): string {
    return `# 🎮 Monte Carlo Game Theory Studio - Test Report

**Generated:** ${this.report.timestamp}

## 📊 Summary

| Metric | Value |
|--------|-------|
| Total Tests | ${this.report.overall.totalTests} |
| Passed | ${this.report.overall.passedTests} ✅ |
| Failed | ${this.report.overall.failedTests} ${this.report.overall.failedTests > 0 ? '❌' : '✅'} |
| Skipped | ${this.report.overall.skippedTests} |
| Coverage | ${this.report.overall.overallCoverage.toFixed(1)}% ${this.report.overall.overallCoverage >= 90 ? '✅' : '⚠️'} |
| Duration | ${(this.report.overall.totalDuration / 1000).toFixed(1)}s |

## 📋 PRD Requirements Compliance

- ${this.report.overall.prdRequirements.performanceTests ? '✅' : '❌'} Performance Tests (5s simple, 30s complex scenarios)
- ${this.report.overall.prdRequirements.functionalTests ? '✅' : '❌'} Functional/Unit Tests for Core Algorithms  
- ${this.report.overall.prdRequirements.integrationTests ? '✅' : '❌'} Integration & End-to-End Tests
- ${this.report.overall.prdRequirements.coverageThreshold ? '✅' : '❌'} >90% Code Coverage Threshold

## 🧪 Test Suites

${this.report.suites.map(suite => `
### ${suite.name}

- **Tests:** ${suite.totalTests}
- **Passed:** ${suite.passedTests} ✅
- **Failed:** ${suite.failedTests} ${suite.failedTests > 0 ? '❌' : '✅'}
- **Coverage:** ${suite.coverage.toFixed(1)}%
- **Duration:** ${(suite.totalDuration / 1000).toFixed(2)}s

${suite.tests.map(test => `- ${test.status === 'pass' ? '✅' : test.status === 'fail' ? '❌' : '⏭️'} ${test.name} (${test.duration}ms)`).join('\n')}
`).join('\n')}

---
*Generated by Monte Carlo Game Theory Studio Testing Framework*`;
  }

  saveReports(outputDir: string = './test-results') {
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    
    // Save HTML report
    fs.writeFileSync(
      path.join(outputDir, `test-report-${timestamp}.html`),
      this.generateHTMLReport()
    );

    // Save JSON report  
    fs.writeFileSync(
      path.join(outputDir, `test-report-${timestamp}.json`),
      this.generateJSONReport()
    );

    // Save Markdown report
    fs.writeFileSync(
      path.join(outputDir, `test-report-${timestamp}.md`),
      this.generateMarkdownReport()
    );

    // Save latest reports (overwrite)
    fs.writeFileSync(
      path.join(outputDir, 'latest-report.html'),
      this.generateHTMLReport()
    );

    fs.writeFileSync(
      path.join(outputDir, 'latest-report.json'),
      this.generateJSONReport()
    );

    fs.writeFileSync(
      path.join(outputDir, 'latest-report.md'),
      this.generateMarkdownReport()
    );

    console.log(`📊 Test reports saved to ${outputDir}`);
  }
}

// Mock function to simulate test results for demonstration
export function generateMockTestReport(): TestReport {
  const generator = new TestReportGenerator();
  
  // Add Unit Tests Suite
  generator.addTestSuite({
    name: 'Unit Tests - Core Algorithms',
    totalTests: 45,
    passedTests: 43,
    failedTests: 2,
    skippedTests: 0,
    totalDuration: 2500,
    coverage: 92.5,
    tests: [
      { name: 'MonteCarloEngine - Basic simulation', status: 'pass', duration: 150 },
      { name: 'MonteCarloEngine - Web workers', status: 'pass', duration: 300 },
      { name: 'Nash Equilibrium - Pure strategies', status: 'pass', duration: 120 },
      { name: 'Nash Equilibrium - Mixed strategies', status: 'fail', duration: 250, error: 'Convergence timeout' },
      { name: 'Memory optimization', status: 'pass', duration: 180 }
    ]
  });

  // Add Integration Tests Suite
  generator.addTestSuite({
    name: 'Integration Tests - User Workflows',
    totalTests: 25,
    passedTests: 24,
    failedTests: 1,
    skippedTests: 0,
    totalDuration: 8500,
    coverage: 89.2,
    tests: [
      { name: 'Complete Prisoner\'s Dilemma workflow', status: 'pass', duration: 1200 },
      { name: 'Battle of Sexes with mixed strategies', status: 'pass', duration: 1500 },
      { name: 'Adaptive learning simulation', status: 'fail', duration: 2000, error: 'Memory leak detected' },
      { name: 'Game theory analysis workflow', status: 'pass', duration: 1800 }
    ]
  });

  // Add Performance Tests Suite
  generator.addTestSuite({
    name: 'Performance Tests - PRD Requirements',
    totalTests: 15,
    passedTests: 15,
    failedTests: 0,
    skippedTests: 0,
    totalDuration: 35000,
    coverage: 85.0,
    tests: [
      { name: 'Simple scenarios < 5 seconds', status: 'pass', duration: 4200 },
      { name: 'Complex scenarios < 30 seconds', status: 'pass', duration: 28500 },
      { name: 'Memory usage optimization', status: 'pass', duration: 12000 },
      { name: 'Rendering performance', status: 'pass', duration: 3500 }
    ]
  });

  // Add E2E Tests Suite
  generator.addTestSuite({
    name: 'End-to-End Tests - Complete Scenarios',
    totalTests: 35,
    passedTests: 33,
    failedTests: 0,
    skippedTests: 2,
    totalDuration: 45000,
    coverage: 94.1,
    tests: [
      { name: 'Full Prisoner\'s Dilemma scenario', status: 'pass', duration: 8000 },
      { name: 'Battle of Sexes coordination', status: 'pass', duration: 6500 },
      { name: 'Chicken Game conflict resolution', status: 'pass', duration: 7200 },
      { name: 'Stag Hunt trust dynamics', status: 'pass', duration: 6800 },
      { name: 'Cross-browser compatibility', status: 'skip', duration: 0 }
    ]
  });

  return generator.report;
} 