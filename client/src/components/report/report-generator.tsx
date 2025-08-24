import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import { FileText, Download, Loader2 } from "lucide-react";

interface ReportGeneratorProps {
  reportId: string;
}

export function ReportGenerator({ reportId }: ReportGeneratorProps) {
  const { toast } = useToast();
  const [generating, setGenerating] = useState(false);
  const [generatingWord, setGeneratingWord] = useState(false);

  // Fetch report data
  const { data: report } = useQuery({
    queryKey: [`/api/reports/${reportId}`],
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
      // Use server-side PDF generation
      const response = await fetch(`/api/reports/${reportId}/export/pdf`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to generate PDF');
      }

      // Get the PDF blob
      const blob = await response.blob();
      
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      const filename = `API653-Report-${(report as any).reportNumber || reportId}-${new Date().toISOString().split('T')[0]}.pdf`;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      toast({ 
        title: "PDF Generated", 
        description: `Report saved as ${filename}` 
      });
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast({ 
        title: "Error", 
        description: "Failed to generate PDF report. Please ensure all data is saved.",
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
      // Use server-side Word generation
      const response = await fetch(`/api/reports/${reportId}/export/word`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to generate Word document');
      }

      // Get the Word blob
      const blob = await response.blob();
      
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      const filename = `API653-Report-${(report as any).reportNumber || reportId}-${new Date().toISOString().split('T')[0]}.docx`;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      toast({ 
        title: "Word Document Generated", 
        description: `Report saved as ${filename}` 
      });
    } catch (error) {
      console.error('Error generating Word document:', error);
      toast({ 
        title: "Error", 
        description: "Failed to generate Word document. Please ensure all data is saved.",
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
        
        {!report && (
          <div className="text-amber-600 text-sm">
            Please save all report data before generating exports.
          </div>
        )}
      </CardContent>
    </Card>
  );
}