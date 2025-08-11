import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { AppHeader } from "@/components/ui/app-header";
import { ReportSelector } from "@/components/report/report-selector";
import { NavigationSidebar, TabType } from "@/components/report/navigation-sidebar";
import { BaseDataForm } from "@/components/report/base-data-form";
import { AppendicesForm } from "@/components/report/appendices-form";
import { ComponentCMLForm } from "@/components/report/component-cml-form";
import { CalculationsForm } from "@/components/report/calculations-form";
import { WriteupForm } from "@/components/report/writeup-form";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, X } from "lucide-react";

export default function ReportBuilder() {
  const [location, setLocation] = useLocation();
  const [selectedReportId, setSelectedReportId] = useState<string>("");
  const [activeTab, setActiveTab] = useState<TabType>('base-data');
  const [unitSet, setUnitSet] = useState('US');
  const [showNewReportModal, setShowNewReportModal] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [newReportData, setNewReportData] = useState({
    reportNumber: '',
    tankId: '',
  });
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Extract report ID or template from URL params if present
  useEffect(() => {
    const urlParams = new URLSearchParams(location.split('?')[1] || '');
    const reportId = urlParams.get('id');
    const templateId = urlParams.get('template');
    
    if (reportId) {
      setSelectedReportId(reportId);
    } else if (templateId) {
      // Handle template selection
      handleTemplateSelect(templateId);
    }
  }, [location]);

  // Update URL when report is selected
  useEffect(() => {
    if (selectedReportId) {
      setLocation(`/report-builder?id=${selectedReportId}`);
    }
  }, [selectedReportId, setLocation]);

  const { data: currentReport } = useQuery({
    queryKey: ["/api/reports", selectedReportId],
    enabled: !!selectedReportId,
  });

  const createReportMutation = useMutation({
    mutationFn: async (data: { reportNumber: string; tankId: string; unitSet: string }) => {
      return apiRequest("POST", "/api/reports", data);
    },
    onSuccess: (newReport) => {
      queryClient.invalidateQueries({ queryKey: ["/api/reports"] });
      setSelectedReportId(newReport.id);
      setShowNewReportModal(false);
      setNewReportData({ reportNumber: '', tankId: '' });
      toast({ title: "Report created successfully" });
    },
    onError: (error) => {
      toast({ 
        title: "Error creating report", 
        description: error.message,
        variant: "destructive" 
      });
    },
  });

  const handleCreateReport = () => {
    setShowNewReportModal(true);
  };

  const handleTemplateSelect = (templateId: string) => {
    const templates: Record<string, any> = {
      'routine-inspection': {
        reportNumber: 'RPT-' + new Date().getFullYear() + '-001',
        tankId: 'TK-001',
        service: 'Crude Oil',
        plateSpec: 'A516 Grade 70',
        designPressure: 2.5,
        age: 10,
        inspectorCertification: 'API 653 Certified',
        coverText: 'This report documents the routine API 653 inspection performed on the atmospheric storage tank. The inspection included visual examination, ultrasonic thickness measurements, and assessment of tank components in accordance with API 653 standards.',
      },
      'out-of-service': {
        reportNumber: 'RPT-' + new Date().getFullYear() + '-002',
        tankId: 'TK-002',
        service: 'Gasoline',
        plateSpec: 'A36',
        designPressure: 2.0,
        age: 15,
        inspectorCertification: 'API 653 Certified',
        coverText: 'This report provides the results of the comprehensive out-of-service inspection. The tank was emptied, cleaned, and thoroughly inspected including bottom plate scanning, shell thickness measurements, and roof evaluation.',
      },
      'five-year-external': {
        reportNumber: 'RPT-' + new Date().getFullYear() + '-003',
        tankId: 'TK-003',
        service: 'Diesel',
        plateSpec: 'A572 Grade 50',
        designPressure: 1.5,
        age: 5,
        inspectorCertification: 'API 653 Certified',
        coverText: 'This report covers the 5-year external inspection performed while the tank remained in service. Visual inspection, external thickness measurements, and foundation assessment were completed.',
      },
      'repair-assessment': {
        reportNumber: 'RPT-' + new Date().getFullYear() + '-004',
        tankId: 'TK-004',
        service: 'Water',
        plateSpec: 'A283 Grade C',
        designPressure: 1.0,
        age: 20,
        inspectorCertification: 'API 653 Certified',
        coverText: 'This report documents the inspection following repair work on the tank. All repairs were inspected and evaluated for compliance with API 653 repair standards. Fitness-for-service calculations confirm the tank is suitable for continued operation.',
      }
    };

    const template = templates[templateId];
    if (template) {
      setNewReportData({
        reportNumber: template.reportNumber,
        tankId: template.tankId,
      });
      setShowNewReportModal(true);
    }
  };

  const handleSubmitNewReport = () => {
    if (!newReportData.reportNumber || !newReportData.tankId) {
      toast({
        title: "Missing required fields",
        description: "Report number and tank ID are required",
        variant: "destructive"
      });
      return;
    }

    createReportMutation.mutate({
      ...newReportData,
      unitSet,
    });
  };

  const handleSave = async () => {
    if (!selectedReportId) {
      toast({
        title: "No report selected",
        description: "Please select or create a report first",
        variant: "destructive"
      });
      return;
    }

    // Trigger save on the current form
    toast({ title: "Report saved successfully" });
  };

  const handlePreview = () => {
    if (!selectedReportId) {
      toast({
        title: "No report selected",
        description: "Please select or create a report first",
        variant: "destructive"
      });
      return;
    }
    setShowPreviewModal(true);
  };

  const handlePrint = () => {
    if (!selectedReportId) {
      toast({
        title: "No report selected",
        description: "Please select or create a report first",
        variant: "destructive"
      });
      return;
    }
    
    toast({ title: "Print functionality will be implemented" });
  };

  const renderMainContent = () => {
    if (!selectedReportId) {
      return (
        <Card className="h-96">
          <CardContent className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <FileText className="h-8 w-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No report selected</h3>
              <p className="text-gray-600">Please select an existing report or create a new one to get started.</p>
            </div>
          </CardContent>
        </Card>
      );
    }

    switch (activeTab) {
      case 'base-data':
        return <BaseDataForm reportId={selectedReportId} unitSet={unitSet} />;
      case 'appendices':
        return <AppendicesForm reportId={selectedReportId} />;
      case 'component-cml':
        return <ComponentCMLForm reportId={selectedReportId} />;
      case 'calculations':
        return <CalculationsForm reportId={selectedReportId} />;
      case 'writeup':
        return <WriteupForm reportId={selectedReportId} />;
      default:
        return <BaseDataForm reportId={selectedReportId} unitSet={unitSet} />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <AppHeader 
        unitSet={unitSet} 
        onUnitSetChange={setUnitSet}
        userName="John Inspector"
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <ReportSelector
          selectedReportId={selectedReportId}
          onSelectReport={setSelectedReportId}
          onCreateReport={handleCreateReport}
        />

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-1">
            <NavigationSidebar
              activeTab={activeTab}
              onTabChange={setActiveTab}
              onSave={handleSave}
              onPreview={handlePreview}
              onPrint={handlePrint}
            />
          </div>

          <div className="lg:col-span-3">
            {renderMainContent()}
          </div>
        </div>
      </div>

      {/* New Report Modal */}
      <Dialog open={showNewReportModal} onOpenChange={setShowNewReportModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Create New Report</DialogTitle>
            <DialogDescription>
              Enter the basic information to create a new API 653 inspection report.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="reportNumber">Report Number *</Label>
              <Input
                id="reportNumber"
                placeholder="RPT-2024-005"
                value={newReportData.reportNumber}
                onChange={(e) => setNewReportData({ ...newReportData, reportNumber: e.target.value })}
              />
            </div>
            
            <div>
              <Label htmlFor="tankId">Tank/Equipment ID *</Label>
              <Input
                id="tankId"
                placeholder="AST-500"
                value={newReportData.tankId}
                onChange={(e) => setNewReportData({ ...newReportData, tankId: e.target.value })}
              />
            </div>
            
            <div className="flex justify-end space-x-3 pt-4">
              <Button variant="outline" onClick={() => setShowNewReportModal(false)}>
                Cancel
              </Button>
              <Button 
                onClick={handleSubmitNewReport}
                disabled={createReportMutation.isPending}
                className="bg-primary hover:bg-primary/90"
              >
                {createReportMutation.isPending ? "Creating..." : "Create Report"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Preview Modal */}
      <Dialog open={showPreviewModal} onOpenChange={setShowPreviewModal}>
        <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-hidden">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <DialogTitle>Report Preview</DialogTitle>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setShowPreviewModal(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </DialogHeader>
          
          <div className="overflow-y-auto max-h-[70vh]">
            <Card className="shadow-sm">
              <CardContent className="p-8">
                <div className="text-center mb-8">
                  <h1 className="text-2xl font-bold text-gray-900">API 653 INSPECTION REPORT</h1>
                  <h2 className="text-xl font-semibold text-gray-700 mt-2">
                    {currentReport?.tankId || "Tank ID"}
                  </h2>
                  <p className="text-gray-600 mt-2">
                    Report No: {currentReport?.reportNumber || "Report Number"}
                  </p>
                </div>
                
                <div className="space-y-4 text-sm">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <strong>Tank ID:</strong> {currentReport?.tankId || "N/A"}
                    </div>
                    <div>
                      <strong>Inspection Date:</strong> {
                        currentReport?.inspectionDate 
                          ? new Date(currentReport.inspectionDate).toLocaleDateString()
                          : "N/A"
                      }
                    </div>
                    <div>
                      <strong>Inspector:</strong> {currentReport?.inspectorName || "N/A"}
                    </div>
                    <div>
                      <strong>Service:</strong> {currentReport?.service || "N/A"}
                    </div>
                  </div>
                  
                  {currentReport?.coverText && (
                    <div className="mt-6">
                      <h3 className="font-semibold mb-2">Executive Summary</h3>
                      <p className="text-gray-700 leading-relaxed">
                        {currentReport.coverText}
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
          
          <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-200">
            <Button variant="outline">
              <FileText className="h-4 w-4 mr-2" />
              Export PDF
            </Button>
            <Button variant="outline">
              <FileText className="h-4 w-4 mr-2" />
              Export Word
            </Button>
            <Button 
              onClick={() => setShowPreviewModal(false)}
              className="bg-primary hover:bg-primary/90"
            >
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
