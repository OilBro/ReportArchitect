import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import { FileText, Download, Loader2 } from "lucide-react";
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, AlignmentType, HeadingLevel, PageBreak, WidthType } from 'docx';
import { saveAs } from 'file-saver';

interface ReportGeneratorProps {
  reportId: string;
}

export function ReportGenerator({ reportId }: ReportGeneratorProps) {
  const { toast } = useToast();
  const [generating, setGenerating] = useState(false);
  const [generatingWord, setGeneratingWord] = useState(false);

  // Fetch all report data
  const { data: report } = useQuery<any>({
    queryKey: ["/api/reports", reportId],
    enabled: !!reportId,
  });

  const { data: cmlRecords = [] } = useQuery<any[]>({
    queryKey: ["/api/reports", reportId, "cml-records"],
    enabled: !!reportId,
  });

  const { data: nozzleCML } = useQuery<any>({
    queryKey: ['/api/nozzle-cml', reportId],
    enabled: !!reportId,
  });

  const { data: appendices = [] } = useQuery<any[]>({
    queryKey: ["/api/reports", reportId, "appendices"],
    enabled: !!reportId,
  });

  const { data: writeup } = useQuery<any>({
    queryKey: ["/api/reports", reportId, "writeup"],
    enabled: !!reportId,
  });

  const { data: tankHistory } = useQuery<any>({
    queryKey: ["/api/reports", reportId, "tank-history"],
    enabled: !!reportId,
  });

  const { data: shellCalcs } = useQuery<any>({
    queryKey: ["/api/reports", reportId, "shell-calculations"],
    enabled: !!reportId,
  });

  const { data: roofCalcs } = useQuery<any>({
    queryKey: ["/api/reports", reportId, "roof-calculations"],
    enabled: !!reportId,
  });

  const { data: floorCalcs } = useQuery<any>({
    queryKey: ["/api/reports", reportId, "floor-mrt-calculations"],
    enabled: !!reportId,
  });

  const { data: settlementData } = useQuery<any>({
    queryKey: ['/api/settlement-survey', reportId],
    enabled: !!reportId,
  });

  const generatePDF = async () => {
    if (!report) {
      toast({ 
        title: "Error", 
        description: "No report data available",
        variant: "destructive" 
      });
      return;
    }

    setGenerating(true);
    
    try {
      // Create new PDF document
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      let yPosition = 20;

      // Title Page
      pdf.setFontSize(24);
      pdf.setFont('helvetica', 'bold');
      pdf.text('API 653 INSPECTION REPORT', pageWidth / 2, yPosition, { align: 'center' });
      
      yPosition += 15;
      pdf.setFontSize(18);
      pdf.text(`Tank ${report.tankId || 'N/A'}`, pageWidth / 2, yPosition, { align: 'center' });
      
      yPosition += 10;
      pdf.setFontSize(14);
      pdf.setFont('helvetica', 'normal');
      pdf.text(`Report Number: ${report.reportNumber || 'N/A'}`, pageWidth / 2, yPosition, { align: 'center' });
      
      yPosition += 10;
      pdf.text(`Inspection Date: ${report.inspectionDate || new Date().toLocaleDateString()}`, pageWidth / 2, yPosition, { align: 'center' });
      
      // Company info
      yPosition += 20;
      pdf.setFontSize(12);
      pdf.text(`Owner: ${report.owner || 'N/A'}`, pageWidth / 2, yPosition, { align: 'center' });
      pdf.text(`Facility: ${report.facility || 'N/A'}`, pageWidth / 2, yPosition + 7, { align: 'center' });

      // Table of Contents
      pdf.addPage();
      yPosition = 20;
      pdf.setFontSize(18);
      pdf.setFont('helvetica', 'bold');
      pdf.text('TABLE OF CONTENTS', 20, yPosition);
      
      yPosition += 15;
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'normal');
      const contents = [
        '1. Executive Summary',
        '2. Tank Information',
        '3. Tank History',
        '4. Shell Thickness Data',
        '5. Roof Thickness Data',
        '6. Floor Thickness Data',
        '7. Settlement Survey',
        '8. Component CML Records',
        '9. Nozzle CML Records',
        '10. Calculations',
        '11. Recommendations',
        '12. Appendices'
      ];
      
      contents.forEach((item, index) => {
        pdf.text(item, 30, yPosition + (index * 8));
      });

      // 1. Executive Summary
      pdf.addPage();
      yPosition = 20;
      pdf.setFontSize(16);
      pdf.setFont('helvetica', 'bold');
      pdf.text('1. EXECUTIVE SUMMARY', 20, yPosition);
      
      yPosition += 10;
      pdf.setFontSize(11);
      pdf.setFont('helvetica', 'normal');
      
      if (writeup?.summary) {
        const summaryLines = pdf.splitTextToSize(writeup.summary, pageWidth - 40);
        pdf.text(summaryLines, 20, yPosition);
        yPosition += summaryLines.length * 5;
      } else {
        pdf.text('No summary available.', 20, yPosition);
        yPosition += 5;
      }

      // 2. Tank Information
      pdf.addPage();
      yPosition = 20;
      pdf.setFontSize(16);
      pdf.setFont('helvetica', 'bold');
      pdf.text('2. TANK INFORMATION', 20, yPosition);
      
      yPosition += 10;
      
      // Tank details table
      const tankInfo = [
        ['Tank ID', report.tankId || 'N/A'],
        ['Owner', report.owner || 'N/A'],
        ['Facility', report.facility || 'N/A'],
        ['Location', report.location || 'N/A'],
        ['Product', report.product || 'N/A'],
        ['Capacity', report.capacity ? `${report.capacity} bbls` : 'N/A'],
        ['Diameter', report.diameter ? `${report.diameter} ft` : 'N/A'],
        ['Height', report.height ? `${report.height} ft` : 'N/A'],
        ['Construction Year', report.constructionYear || 'N/A'],
        ['Design Code', report.designCode || 'N/A'],
      ];
      
      autoTable(pdf, {
        startY: yPosition,
        head: [['Parameter', 'Value']],
        body: tankInfo,
        theme: 'striped',
        headStyles: { fillColor: [41, 128, 185] },
      });

      // 3. Tank History
      if (tankHistory) {
        pdf.addPage();
        yPosition = 20;
        pdf.setFontSize(16);
        pdf.setFont('helvetica', 'bold');
        pdf.text('3. TANK HISTORY', 20, yPosition);
        
        yPosition += 10;
        pdf.setFontSize(11);
        pdf.setFont('helvetica', 'normal');
        
        const historyData = [
          ['Construction Date', tankHistory.constructionDate || 'N/A'],
          ['Last Internal Inspection', tankHistory.lastInternalInspection || 'N/A'],
          ['Last External Inspection', tankHistory.lastExternalInspection || 'N/A'],
          ['Last Hydrostatic Test', tankHistory.lastHydrostaticTest || 'N/A'],
          ['Next Inspection Due', tankHistory.nextInspectionDue || 'N/A'],
        ];
        
        autoTable(pdf, {
          startY: yPosition,
          head: [['Item', 'Date']],
          body: historyData,
          theme: 'striped',
          headStyles: { fillColor: [41, 128, 185] },
        });
      }

      // 4. Shell Thickness Data
      if (shellCalcs?.courses && shellCalcs.courses.length > 0) {
        pdf.addPage();
        yPosition = 20;
        pdf.setFontSize(16);
        pdf.setFont('helvetica', 'bold');
        pdf.text('4. SHELL THICKNESS DATA', 20, yPosition);
        
        yPosition += 10;
        
        const shellData = shellCalcs.courses.map((course: any) => [
          course.courseNumber,
          course.previousThickness?.toFixed(3) || 'N/A',
          course.currentThickness?.toFixed(3) || 'N/A',
          course.tMin?.toFixed(3) || 'N/A',
          course.corrosionRate?.toFixed(2) || 'N/A',
          course.remainingLife?.toFixed(1) || 'N/A',
        ]);
        
        autoTable(pdf, {
          startY: yPosition,
          head: [['Course', 'Previous (in)', 'Current (in)', 'tMin (in)', 'CR (mpy)', 'RL (years)']],
          body: shellData,
          theme: 'striped',
          headStyles: { fillColor: [41, 128, 185] },
        });
      }

      // 5. Component CML Records
      if (cmlRecords.length > 0) {
        pdf.addPage();
        yPosition = 20;
        pdf.setFontSize(16);
        pdf.setFont('helvetica', 'bold');
        pdf.text('5. COMPONENT CML RECORDS', 20, yPosition);
        
        yPosition += 10;
        
        const cmlData = cmlRecords.map((record: any) => [
          record.cmlId || 'N/A',
          record.component || 'N/A',
          record.location || 'N/A',
          record.currentReading?.toFixed(3) || 'N/A',
          record.corrosionRate?.toFixed(2) || 'N/A',
          record.remainingLife?.toFixed(1) || 'N/A',
        ]);
        
        autoTable(pdf, {
          startY: yPosition,
          head: [['CML ID', 'Component', 'Location', 'Current (in)', 'CR (mpy)', 'RL (years)']],
          body: cmlData,
          theme: 'striped',
          headStyles: { fillColor: [41, 128, 185] },
          styles: { fontSize: 9 },
        });
      }

      // 6. Nozzle CML Records
      if (nozzleCML?.records && nozzleCML.records.length > 0) {
        pdf.addPage();
        yPosition = 20;
        pdf.setFontSize(16);
        pdf.setFont('helvetica', 'bold');
        pdf.text('6. NOZZLE CML RECORDS', 20, yPosition);
        
        yPosition += 10;
        
        const nozzleData = nozzleCML.records.map((record: any) => [
          record.nozzleId || 'N/A',
          record.nozzleDescription || 'N/A',
          record.nozzleSize || 'N/A',
          record.currentThickness?.toFixed(3) || 'N/A',
          record.tMin?.toFixed(3) || 'N/A',
          record.corrosionRate?.toFixed(2) || 'N/A',
          record.remainingLife?.toFixed(1) || 'N/A',
        ]);
        
        autoTable(pdf, {
          startY: yPosition,
          head: [['Nozzle ID', 'Description', 'Size', 'Current (in)', 'tMin (in)', 'CR (mpy)', 'RL (years)']],
          body: nozzleData,
          theme: 'striped',
          headStyles: { fillColor: [41, 128, 185] },
          styles: { fontSize: 9 },
        });
      }

      // 7. Settlement Survey
      if (settlementData?.elevationPoints && settlementData.elevationPoints.length > 0) {
        pdf.addPage();
        yPosition = 20;
        pdf.setFontSize(16);
        pdf.setFont('helvetica', 'bold');
        pdf.text('7. SETTLEMENT SURVEY', 20, yPosition);
        
        yPosition += 10;
        pdf.setFontSize(11);
        pdf.setFont('helvetica', 'normal');
        
        // Summary data
        pdf.text(`Survey Date: ${settlementData.surveyDate || 'N/A'}`, 20, yPosition);
        yPosition += 6;
        pdf.text(`Maximum Settlement: ${(settlementData.maxSettlement * 12).toFixed(3)} inches`, 20, yPosition);
        yPosition += 6;
        pdf.text(`Differential Settlement: ${(settlementData.differentialSettlement * 12).toFixed(3)} inches`, 20, yPosition);
        yPosition += 6;
        pdf.text(`Tilt Percentage: ${settlementData.tiltPercentage?.toFixed(3)}%`, 20, yPosition);
        yPosition += 6;
        pdf.text(`API 653 Compliance (1% limit): ${settlementData.tiltPercentage <= 1 ? 'PASS' : 'FAIL'}`, 20, yPosition);
        
        yPosition += 10;
        
        const settlementPoints = settlementData.elevationPoints.map((point: any) => [
          point.position?.toFixed(0) || 'N/A',
          point.previousElevation?.toFixed(3) || 'N/A',
          point.currentElevation?.toFixed(3) || 'N/A',
          (point.settlement * 12).toFixed(3) || 'N/A',
        ]);
        
        autoTable(pdf, {
          startY: yPosition,
          head: [['Position (°)', 'Previous Elev (ft)', 'Current Elev (ft)', 'Settlement (in)']],
          body: settlementPoints,
          theme: 'striped',
          headStyles: { fillColor: [41, 128, 185] },
        });
      }

      // 8. Recommendations
      if (writeup?.recommendations) {
        pdf.addPage();
        yPosition = 20;
        pdf.setFontSize(16);
        pdf.setFont('helvetica', 'bold');
        pdf.text('8. RECOMMENDATIONS', 20, yPosition);
        
        yPosition += 10;
        pdf.setFontSize(11);
        pdf.setFont('helvetica', 'normal');
        
        const recommendationLines = pdf.splitTextToSize(writeup.recommendations, pageWidth - 40);
        pdf.text(recommendationLines, 20, yPosition);
      }

      // 9. Conclusions
      if (writeup?.conclusions) {
        pdf.addPage();
        yPosition = 20;
        pdf.setFontSize(16);
        pdf.setFont('helvetica', 'bold');
        pdf.text('9. CONCLUSIONS', 20, yPosition);
        
        yPosition += 10;
        pdf.setFontSize(11);
        pdf.setFont('helvetica', 'normal');
        
        const conclusionLines = pdf.splitTextToSize(writeup.conclusions, pageWidth - 40);
        pdf.text(conclusionLines, 20, yPosition);
      }

      // 10. Appendices
      if (appendices.length > 0) {
        pdf.addPage();
        yPosition = 20;
        pdf.setFontSize(16);
        pdf.setFont(undefined, 'bold');
        pdf.text('10. APPENDICES', 20, yPosition);
        
        yPosition += 10;
        pdf.setFontSize(11);
        pdf.setFont(undefined, 'normal');
        
        appendices.forEach((appendix: any, index: number) => {
          pdf.text(`${index + 1}. ${appendix.title || 'Untitled'}`, 20, yPosition);
          yPosition += 6;
          if (appendix.description) {
            const descLines = pdf.splitTextToSize(appendix.description, pageWidth - 40);
            pdf.text(descLines, 30, yPosition);
            yPosition += descLines.length * 5 + 5;
          }
        });
      }

      // Save the PDF
      const filename = `API-653-Report-${report.tankId}-${new Date().toISOString().split('T')[0]}.pdf`;
      pdf.save(filename);
      
      toast({ 
        title: "PDF Generated", 
        description: `Report saved as ${filename}` 
      });
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast({ 
        title: "Error", 
        description: "Failed to generate PDF report",
        variant: "destructive" 
      });
    } finally {
      setGenerating(false);
    }
  };

  const generateWord = async () => {
    if (!report) {
      toast({ 
        title: "Error", 
        description: "No report data available",
        variant: "destructive" 
      });
      return;
    }

    setGeneratingWord(true);
    
    try {
      const doc = new Document({
        sections: [{
          properties: {},
          children: [
            // Title Page
            new Paragraph({
              text: "API 653 INSPECTION REPORT",
              heading: HeadingLevel.TITLE,
              alignment: AlignmentType.CENTER,
            }),
            new Paragraph({
              text: `Tank ${report.tankId || 'N/A'}`,
              heading: HeadingLevel.HEADING_1,
              alignment: AlignmentType.CENTER,
              spacing: { before: 200 },
            }),
            new Paragraph({
              text: `Report Number: ${report.reportNumber || 'N/A'}`,
              alignment: AlignmentType.CENTER,
              spacing: { before: 200 },
            }),
            new Paragraph({
              text: `Inspection Date: ${report.inspectionDate || new Date().toLocaleDateString()}`,
              alignment: AlignmentType.CENTER,
              spacing: { before: 200 },
            }),
            new PageBreak(),
            
            // Executive Summary
            new Paragraph({
              text: "1. EXECUTIVE SUMMARY",
              heading: HeadingLevel.HEADING_1,
            }),
            new Paragraph({
              text: writeup?.summary || "No summary available.",
              spacing: { before: 200 },
            }),
            new PageBreak(),
            
            // Tank Information
            new Paragraph({
              text: "2. TANK INFORMATION",
              heading: HeadingLevel.HEADING_1,
            }),
            new Table({
              width: { size: 100, type: WidthType.PERCENTAGE },
              rows: [
                new TableRow({
                  children: [
                    new TableCell({ children: [new Paragraph("Parameter")] }),
                    new TableCell({ children: [new Paragraph("Value")] }),
                  ],
                }),
                new TableRow({
                  children: [
                    new TableCell({ children: [new Paragraph("Tank ID")] }),
                    new TableCell({ children: [new Paragraph(report.tankId || 'N/A')] }),
                  ],
                }),
                new TableRow({
                  children: [
                    new TableCell({ children: [new Paragraph("Owner")] }),
                    new TableCell({ children: [new Paragraph(report.owner || 'N/A')] }),
                  ],
                }),
                new TableRow({
                  children: [
                    new TableCell({ children: [new Paragraph("Facility")] }),
                    new TableCell({ children: [new Paragraph(report.facility || 'N/A')] }),
                  ],
                }),
                new TableRow({
                  children: [
                    new TableCell({ children: [new Paragraph("Product")] }),
                    new TableCell({ children: [new Paragraph(report.product || 'N/A')] }),
                  ],
                }),
                new TableRow({
                  children: [
                    new TableCell({ children: [new Paragraph("Capacity")] }),
                    new TableCell({ children: [new Paragraph(report.capacity ? `${report.capacity} bbls` : 'N/A')] }),
                  ],
                }),
              ],
            }),
            new PageBreak(),
            
            // Recommendations
            new Paragraph({
              text: "3. RECOMMENDATIONS",
              heading: HeadingLevel.HEADING_1,
            }),
            new Paragraph({
              text: writeup?.recommendations || "No recommendations available.",
              spacing: { before: 200 },
            }),
            new PageBreak(),
            
            // Conclusions
            new Paragraph({
              text: "4. CONCLUSIONS",
              heading: HeadingLevel.HEADING_1,
            }),
            new Paragraph({
              text: writeup?.conclusions || "No conclusions available.",
              spacing: { before: 200 },
            }),
          ],
        }],
      });

      // Generate and save the document
      const buffer = await Packer.toBlob(doc);
      const filename = `API-653-Report-${report.tankId}-${new Date().toISOString().split('T')[0]}.docx`;
      saveAs(buffer, filename);
      
      toast({ 
        title: "Word Document Generated", 
        description: `Report saved as ${filename}` 
      });
    } catch (error) {
      console.error('Error generating Word document:', error);
      toast({ 
        title: "Error", 
        description: "Failed to generate Word document",
        variant: "destructive" 
      });
    } finally {
      setGeneratingWord(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Report Generation</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-gray-600">
          Generate comprehensive API 653 inspection reports in PDF or Word format. 
          The report will include all data entered in the system including tank information, 
          inspection data, calculations, and recommendations.
        </p>
        
        <div className="flex gap-4">
          <Button 
            onClick={generatePDF} 
            disabled={generating || !report}
            className="bg-red-600 hover:bg-red-700"
          >
            {generating ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Generating PDF...
              </>
            ) : (
              <>
                <FileText className="h-4 w-4 mr-2" />
                Generate PDF Report
              </>
            )}
          </Button>
          
          <Button 
            onClick={generateWord} 
            disabled={generatingWord || !report}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {generatingWord ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Generating Word...
              </>
            ) : (
              <>
                <Download className="h-4 w-4 mr-2" />
                Generate Word Document
              </>
            )}
          </Button>
        </div>
        
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="font-semibold text-blue-900 mb-2">Report Contents</h4>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Executive Summary</li>
            <li>• Tank Information & Specifications</li>
            <li>• Tank History & Previous Inspections</li>
            <li>• Shell, Roof & Floor Thickness Data</li>
            <li>• Settlement Survey Results</li>
            <li>• Component & Nozzle CML Records</li>
            <li>• Corrosion Rate Calculations</li>
            <li>• Remaining Life Assessments</li>
            <li>• API 653 Compliance Status</li>
            <li>• Recommendations & Conclusions</li>
            <li>• Supporting Appendices</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}