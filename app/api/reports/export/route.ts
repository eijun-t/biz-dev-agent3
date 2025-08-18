/**
 * PDF/Excel Export API
 * MVP Worker3 - Document Generation
 * High-performance batch export support
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import jsPDF from 'jspdf';
import * as XLSX from 'xlsx';
import autoTable from 'jspdf-autotable';

// Export request schema
const ExportSchema = z.object({
  reportIds: z.array(z.string()).min(1).max(100),
  format: z.enum(['pdf', 'excel', 'csv', 'json']),
  options: z.object({
    includeCharts: z.boolean().optional(),
    includeMetadata: z.boolean().optional(),
    includeComments: z.boolean().optional(),
    template: z.enum(['standard', 'detailed', 'summary']).optional(),
    orientation: z.enum(['portrait', 'landscape']).optional(),
    pageSize: z.enum(['a4', 'letter', 'legal']).optional()
  }).optional(),
  batch: z.boolean().optional()
});

type ExportRequest = z.infer<typeof ExportSchema>;

// PDF Generator
class PDFGenerator {
  private doc: jsPDF;
  private currentY: number = 20;
  private pageHeight: number;
  private pageWidth: number;
  
  constructor(options: ExportRequest['options'] = {}) {
    this.doc = new jsPDF({
      orientation: options.orientation || 'portrait',
      unit: 'mm',
      format: options.pageSize || 'a4'
    });
    
    this.pageHeight = this.doc.internal.pageSize.height;
    this.pageWidth = this.doc.internal.pageSize.width;
  }

  /**
   * Generate PDF for reports
   */
  async generatePDF(reports: any[]): Promise<Uint8Array> {
    // Add title page
    this.addTitlePage(reports);
    
    // Add each report
    reports.forEach((report, index) => {
      if (index > 0) {
        this.doc.addPage();
        this.currentY = 20;
      }
      this.addReport(report);
    });
    
    // Add summary page
    this.addSummaryPage(reports);
    
    // Return as buffer
    return this.doc.output('arraybuffer') as Uint8Array;
  }

  /**
   * Add title page
   */
  private addTitlePage(reports: any[]): void {
    // Title
    this.doc.setFontSize(24);
    this.doc.text('Business Innovation Reports', this.pageWidth / 2, 40, { align: 'center' });
    
    // Subtitle
    this.doc.setFontSize(14);
    this.doc.text(`${reports.length} Reports Generated`, this.pageWidth / 2, 55, { align: 'center' });
    
    // Date
    this.doc.setFontSize(10);
    this.doc.text(
      `Generated on ${new Date().toLocaleDateString()}`,
      this.pageWidth / 2, 70,
      { align: 'center' }
    );
    
    // Report list
    this.doc.setFontSize(12);
    this.currentY = 90;
    
    reports.forEach((report, index) => {
      this.doc.text(
        `${index + 1}. ${report.title}`,
        20,
        this.currentY
      );
      this.currentY += 8;
      
      if (this.currentY > this.pageHeight - 20) {
        this.doc.addPage();
        this.currentY = 20;
      }
    });
  }

  /**
   * Add individual report
   */
  private addReport(report: any): void {
    // Title
    this.doc.setFontSize(18);
    this.doc.text(report.title, 20, this.currentY);
    this.currentY += 10;
    
    // Metadata
    this.doc.setFontSize(10);
    this.doc.setTextColor(100);
    this.doc.text(
      `Score: ${report.score} | Status: ${report.status} | Created: ${new Date(report.created_at).toLocaleDateString()}`,
      20,
      this.currentY
    );
    this.currentY += 10;
    this.doc.setTextColor(0);
    
    // Summary
    this.doc.setFontSize(12);
    this.doc.setFont(undefined, 'bold');
    this.doc.text('Summary', 20, this.currentY);
    this.currentY += 6;
    
    this.doc.setFont(undefined, 'normal');
    this.doc.setFontSize(10);
    const summaryLines = this.doc.splitTextToSize(report.summary, this.pageWidth - 40);
    summaryLines.forEach((line: string) => {
      this.doc.text(line, 20, this.currentY);
      this.currentY += 5;
      this.checkPageBreak();
    });
    
    this.currentY += 5;
    
    // Content
    this.doc.setFontSize(12);
    this.doc.setFont(undefined, 'bold');
    this.doc.text('Content', 20, this.currentY);
    this.currentY += 6;
    
    this.doc.setFont(undefined, 'normal');
    this.doc.setFontSize(10);
    const contentLines = this.doc.splitTextToSize(report.content, this.pageWidth - 40);
    contentLines.forEach((line: string) => {
      this.doc.text(line, 20, this.currentY);
      this.currentY += 5;
      this.checkPageBreak();
    });
    
    // Tags
    if (report.tags?.length) {
      this.currentY += 5;
      this.doc.setFontSize(10);
      this.doc.setFont(undefined, 'bold');
      this.doc.text('Tags:', 20, this.currentY);
      this.doc.setFont(undefined, 'normal');
      this.doc.text(report.tags.join(', '), 40, this.currentY);
      this.currentY += 8;
    }
    
    // Agents
    if (report.agents?.length) {
      this.doc.setFontSize(10);
      this.doc.setFont(undefined, 'bold');
      this.doc.text('Agents:', 20, this.currentY);
      this.doc.setFont(undefined, 'normal');
      this.doc.text(report.agents.join(', '), 40, this.currentY);
      this.currentY += 8;
    }
  }

  /**
   * Add summary page
   */
  private addSummaryPage(reports: any[]): void {
    this.doc.addPage();
    this.currentY = 20;
    
    // Title
    this.doc.setFontSize(18);
    this.doc.text('Summary Statistics', 20, this.currentY);
    this.currentY += 15;
    
    // Statistics table
    const tableData = [
      ['Metric', 'Value'],
      ['Total Reports', String(reports.length)],
      ['Average Score', String(Math.round(reports.reduce((sum, r) => sum + r.score, 0) / reports.length))],
      ['Completed', String(reports.filter(r => r.status === 'completed').length)],
      ['In Progress', String(reports.filter(r => r.status === 'in_progress').length)],
      ['Draft', String(reports.filter(r => r.status === 'draft').length)]
    ];
    
    autoTable(this.doc, {
      startY: this.currentY,
      head: [tableData[0]],
      body: tableData.slice(1),
      theme: 'striped',
      headStyles: { fillColor: [66, 139, 202] }
    });
  }

  /**
   * Check for page break
   */
  private checkPageBreak(): void {
    if (this.currentY > this.pageHeight - 30) {
      this.doc.addPage();
      this.currentY = 20;
    }
  }
}

// Excel Generator
class ExcelGenerator {
  /**
   * Generate Excel file for reports
   */
  async generateExcel(reports: any[]): Promise<Uint8Array> {
    const workbook = XLSX.utils.book_new();
    
    // Create summary sheet
    const summaryData = this.createSummarySheet(reports);
    const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(workbook, summarySheet, 'Summary');
    
    // Create reports sheet
    const reportsData = this.createReportsSheet(reports);
    const reportsSheet = XLSX.utils.json_to_sheet(reportsData);
    XLSX.utils.book_append_sheet(workbook, reportsSheet, 'Reports');
    
    // Create detailed sheets for each report
    reports.slice(0, 10).forEach((report, index) => {
      const detailSheet = this.createDetailSheet(report);
      const sheet = XLSX.utils.aoa_to_sheet(detailSheet);
      XLSX.utils.book_append_sheet(workbook, sheet, `Report_${index + 1}`);
    });
    
    // Generate buffer
    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
    return new Uint8Array(buffer);
  }

  /**
   * Create summary sheet
   */
  private createSummarySheet(reports: any[]): any[][] {
    return [
      ['Business Innovation Reports Summary'],
      [],
      ['Generated Date', new Date().toLocaleDateString()],
      ['Total Reports', reports.length],
      ['Average Score', Math.round(reports.reduce((sum, r) => sum + r.score, 0) / reports.length)],
      [],
      ['Status Distribution'],
      ['Completed', reports.filter(r => r.status === 'completed').length],
      ['In Progress', reports.filter(r => r.status === 'in_progress').length],
      ['Draft', reports.filter(r => r.status === 'draft').length],
      [],
      ['Top Tags'],
      ...this.getTopTags(reports).map(([tag, count]) => [tag, count])
    ];
  }

  /**
   * Create reports sheet
   */
  private createReportsSheet(reports: any[]): any[] {
    return reports.map(report => ({
      ID: report.id,
      Title: report.title,
      Summary: report.summary,
      Score: report.score,
      Status: report.status,
      Tags: report.tags?.join(', ') || '',
      Agents: report.agents?.join(', ') || '',
      Created: new Date(report.created_at).toLocaleDateString(),
      Updated: new Date(report.updated_at).toLocaleDateString()
    }));
  }

  /**
   * Create detail sheet for individual report
   */
  private createDetailSheet(report: any): any[][] {
    return [
      ['Report Details'],
      [],
      ['ID', report.id],
      ['Title', report.title],
      ['Score', report.score],
      ['Status', report.status],
      ['Created', new Date(report.created_at).toLocaleDateString()],
      ['Updated', new Date(report.updated_at).toLocaleDateString()],
      [],
      ['Summary'],
      [report.summary],
      [],
      ['Content'],
      [report.content],
      [],
      ['Tags', report.tags?.join(', ') || ''],
      ['Agents', report.agents?.join(', ') || '']
    ];
  }

  /**
   * Get top tags from reports
   */
  private getTopTags(reports: any[]): Array<[string, number]> {
    const tagCounts: Record<string, number> = {};
    
    reports.forEach(report => {
      report.tags?.forEach((tag: string) => {
        tagCounts[tag] = (tagCounts[tag] || 0) + 1;
      });
    });
    
    return Object.entries(tagCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10);
  }
}

// Mock data fetcher
async function fetchReports(ids: string[]): Promise<any[]> {
  // In production, fetch from database
  // For demo, return mock data
  return ids.map((id, index) => ({
    id,
    title: `Innovation Report ${id}`,
    summary: `Executive summary for report ${id} covering key insights and recommendations.`,
    content: `Detailed analysis and findings for report ${id}. This includes market research, competitive analysis, and strategic recommendations for business innovation.`,
    score: 80 + (index % 20),
    status: ['completed', 'in_progress', 'draft'][index % 3],
    tags: ['innovation', 'ai', 'strategy', 'market-analysis'].slice(0, 2 + (index % 3)),
    agents: ['researcher', 'analyst', 'writer'].slice(0, 2 + (index % 2)),
    created_at: new Date(Date.now() - index * 86400000).toISOString(),
    updated_at: new Date(Date.now() - index * 43200000).toISOString()
  }));
}

// Main API handler
export async function POST(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    // Parse request
    const body = await request.json();
    const params = ExportSchema.parse(body);
    
    // Fetch reports
    const reports = await fetchReports(params.reportIds);
    
    if (reports.length === 0) {
      return NextResponse.json(
        { error: 'No reports found' },
        { status: 404 }
      );
    }
    
    let fileBuffer: Uint8Array;
    let mimeType: string;
    let filename: string;
    
    // Generate based on format
    switch (params.format) {
      case 'pdf':
        const pdfGenerator = new PDFGenerator(params.options);
        fileBuffer = await pdfGenerator.generatePDF(reports);
        mimeType = 'application/pdf';
        filename = `reports_${Date.now()}.pdf`;
        break;
        
      case 'excel':
        const excelGenerator = new ExcelGenerator();
        fileBuffer = await excelGenerator.generateExcel(reports);
        mimeType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
        filename = `reports_${Date.now()}.xlsx`;
        break;
        
      case 'csv':
        // Simple CSV generation
        const csv = [
          ['ID', 'Title', 'Score', 'Status', 'Tags', 'Created'],
          ...reports.map(r => [
            r.id,
            r.title,
            r.score,
            r.status,
            r.tags?.join(';') || '',
            new Date(r.created_at).toLocaleDateString()
          ])
        ].map(row => row.join(',')).join('\n');
        
        fileBuffer = new TextEncoder().encode(csv);
        mimeType = 'text/csv';
        filename = `reports_${Date.now()}.csv`;
        break;
        
      case 'json':
        fileBuffer = new TextEncoder().encode(JSON.stringify(reports, null, 2));
        mimeType = 'application/json';
        filename = `reports_${Date.now()}.json`;
        break;
        
      default:
        throw new Error('Unsupported format');
    }
    
    // Return file
    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        'Content-Type': mimeType,
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': String(fileBuffer.length),
        'X-Response-Time': `${Date.now() - startTime}ms`
      }
    });
    
  } catch (error) {
    console.error('Export error:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: error instanceof z.ZodError
          ? 'Invalid export parameters'
          : 'Export failed',
        details: error instanceof z.ZodError ? error.errors : undefined,
        responseTime: Date.now() - startTime
      },
      { status: 400 }
    );
  }
}

// Export for testing
export { PDFGenerator, ExcelGenerator };