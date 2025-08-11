import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Plus, Copy, Users, Download, Upload, ListChecks } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

interface ReportSelectorProps {
  selectedReportId?: string;
  onSelectReport: (reportId: string) => void;
  onCreateReport: () => void;
}

export function ReportSelector({ selectedReportId, onSelectReport, onCreateReport }: ReportSelectorProps) {
  const { data: reports = [] } = useQuery({
    queryKey: ["/api/reports"],
  });

  const selectedReport = reports.find((r: any) => r.id === selectedReportId);

  return (
    <Card className="mb-6">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">Report Management</h2>
          <div className="flex items-center space-x-2">
            <Button onClick={onCreateReport} className="bg-primary hover:bg-primary/90">
              <Plus className="h-4 w-4 mr-2" />
              New Report
            </Button>
            <Button variant="outline">
              <Copy className="h-4 w-4 mr-2" />
              Copy Report
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Existing Report
            </label>
            <Select value={selectedReportId || ""} onValueChange={onSelectReport}>
              <SelectTrigger>
                <SelectValue placeholder="Select Report..." />
              </SelectTrigger>
              <SelectContent>
                {reports.map((report: any) => (
                  <SelectItem key={report.id} value={report.id}>
                    {report.reportNumber} - {report.tankId}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Owner</label>
            <div className="flex items-center space-x-2 py-2">
              <Users className="h-4 w-4 text-gray-400" />
              <span className="text-sm text-gray-600">
                {selectedReport?.ownerId || "No report selected"}
              </span>
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Share Report</label>
            <Button variant="outline" className="w-full sm:w-auto">
              <Users className="h-4 w-4 mr-2" />
              Share Access
            </Button>
          </div>
        </div>
        
        <div className="mt-4 flex flex-wrap gap-4 text-sm">
          <Button variant="link" className="text-primary hover:text-primary/80 p-0 h-auto">
            <Download className="h-4 w-4 mr-1" />
            Download Template
          </Button>
          <Button variant="link" className="text-primary hover:text-primary/80 p-0 h-auto">
            <Upload className="h-4 w-4 mr-1" />
            Import Field Data
          </Button>
          <Button variant="link" className="text-primary hover:text-primary/80 p-0 h-auto">
            <ListChecks className="h-4 w-4 mr-1" />
            Checklist Template
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
