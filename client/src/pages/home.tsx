import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { ClipboardCheck, Plus, FileText, Calendar, User, Check } from "lucide-react";
import { Link, useLocation } from "wouter";

export default function Home() {
  const [location, setLocation] = useLocation();
  const [showTemplatesModal, setShowTemplatesModal] = useState(false);
  const { data: reports = [], isLoading } = useQuery({
    queryKey: ["/api/reports"],
  });

  const recentReports = reports.slice(0, 5);

  const reportTemplates = [
    {
      id: 'routine-inspection',
      name: 'Routine Inspection',
      description: 'Standard API 653 routine inspection for atmospheric storage tanks',
      fields: {
        service: 'Crude Oil',
        plateSpec: 'A516 Grade 70',
        designPressure: 2.5,
        age: 10,
        inspectorCertification: 'API 653 Certified',
        coverText: 'This report documents the routine API 653 inspection performed on the atmospheric storage tank. The inspection included visual examination, ultrasonic thickness measurements, and assessment of tank components in accordance with API 653 standards.',
      }
    },
    {
      id: 'out-of-service',
      name: 'Out-of-Service Inspection',
      description: 'Comprehensive internal inspection with tank out of service',
      fields: {
        service: 'Gasoline',
        plateSpec: 'A36',
        designPressure: 2.0,
        age: 15,
        inspectorCertification: 'API 653 Certified',
        coverText: 'This report provides the results of the comprehensive out-of-service inspection. The tank was emptied, cleaned, and thoroughly inspected including bottom plate scanning, shell thickness measurements, and roof evaluation.',
      }
    },
    {
      id: 'five-year-external',
      name: '5-Year External Inspection',
      description: 'External inspection as per API 653 5-year requirement',
      fields: {
        service: 'Diesel',
        plateSpec: 'A572 Grade 50',
        designPressure: 1.5,
        age: 5,
        inspectorCertification: 'API 653 Certified',
        coverText: 'This report covers the 5-year external inspection performed while the tank remained in service. Visual inspection, external thickness measurements, and foundation assessment were completed.',
      }
    },
    {
      id: 'repair-assessment',
      name: 'Repair Assessment',
      description: 'Post-repair inspection and fitness-for-service evaluation',
      fields: {
        service: 'Water',
        plateSpec: 'A283 Grade C',
        designPressure: 1.0,
        age: 20,
        inspectorCertification: 'API 653 Certified',
        coverText: 'This report documents the inspection following repair work on the tank. All repairs were inspected and evaluated for compliance with API 653 repair standards. Fitness-for-service calculations confirm the tank is suitable for continued operation.',
      }
    }
  ];

  const handleSelectTemplate = (template: any) => {
    // Navigate to report builder with template data
    setLocation(`/report-builder?template=${template.id}`);
    setShowTemplatesModal(false);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center mb-4">
            <div className="w-16 h-16 bg-primary rounded-xl flex items-center justify-center">
              <ClipboardCheck className="text-white h-8 w-8" />
            </div>
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            API 653 Inspection Report Builder
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
            Professional atmospheric storage tank inspection reporting software compliant with API 653 standards. 
            Generate comprehensive reports with corrosion monitoring, calculations, and documentation.
          </p>
          <div className="flex items-center justify-center space-x-4">
            <Link href="/report-builder">
              <Button size="lg" className="bg-primary hover:bg-primary/90">
                <Plus className="h-5 w-5 mr-2" />
                Create New Report
              </Button>
            </Link>
            <Button size="lg" variant="outline" onClick={() => setShowTemplatesModal(true)}>
              <FileText className="h-5 w-5 mr-2" />
              View Templates
            </Button>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <FileText className="h-5 w-5 text-blue-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">Report Generation</h3>
              </div>
              <p className="text-gray-600">
                Generate professional API 653 inspection reports with automated calculations and formatting.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                  <ClipboardCheck className="h-5 w-5 text-green-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">CML Tracking</h3>
              </div>
              <p className="text-gray-600">
                Monitor corrosion rates and remaining life calculations for all critical measurement locations.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                  <Calendar className="h-5 w-5 text-purple-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">Compliance</h3>
              </div>
              <p className="text-gray-600">
                Ensure full compliance with API 653 standards and documentation requirements.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Recent Reports */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-semibold text-gray-900">Recent Reports</CardTitle>
              <Link href="/report-builder">
                <Button variant="outline" size="sm">
                  View All Reports
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="animate-pulse bg-gray-200 h-16 rounded-lg"></div>
                ))}
              </div>
            ) : recentReports.length === 0 ? (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <FileText className="h-8 w-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No reports yet</h3>
                <p className="text-gray-600 mb-4">Create your first API 653 inspection report to get started.</p>
                <Link href="/report-builder">
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Create First Report
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {recentReports.map((report: any) => (
                  <div key={report.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50">
                    <div className="flex items-center space-x-4">
                      <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                        <FileText className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900">
                          {report.reportNumber} - {report.tankId}
                        </h4>
                        <div className="flex items-center space-x-4 text-sm text-gray-600">
                          <span className="flex items-center">
                            <Calendar className="h-4 w-4 mr-1" />
                            {report.inspectionDate ? new Date(report.inspectionDate).toLocaleDateString() : "No date"}
                          </span>
                          <span className="flex items-center">
                            <User className="h-4 w-4 mr-1" />
                            {report.inspectorName || "No inspector"}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <Badge variant={report.status === 'draft' ? 'secondary' : 'default'}>
                        {report.status || 'draft'}
                      </Badge>
                      <Link href={`/report-builder?id=${report.id}`}>
                        <Button variant="outline" size="sm">
                          Open
                        </Button>
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Templates Modal */}
      <Dialog open={showTemplatesModal} onOpenChange={setShowTemplatesModal}>
        <DialogContent className="sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle>Report Templates</DialogTitle>
            <DialogDescription>
              Select a template to quickly start a new inspection report with pre-configured settings
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
            {reportTemplates.map((template) => (
              <Card 
                key={template.id} 
                className="cursor-pointer hover:shadow-lg transition-shadow border-gray-200 hover:border-primary"
                onClick={() => handleSelectTemplate(template)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-semibold text-gray-900">{template.name}</h3>
                    <FileText className="h-5 w-5 text-primary" />
                  </div>
                  <p className="text-sm text-gray-600 mb-3">{template.description}</p>
                  <div className="space-y-1 text-xs text-gray-500">
                    <div className="flex items-center">
                      <Check className="h-3 w-3 mr-1 text-green-500" />
                      Service: {template.fields.service}
                    </div>
                    <div className="flex items-center">
                      <Check className="h-3 w-3 mr-1 text-green-500" />
                      Material: {template.fields.plateSpec}
                    </div>
                    <div className="flex items-center">
                      <Check className="h-3 w-3 mr-1 text-green-500" />
                      Age: {template.fields.age} years
                    </div>
                  </div>
                  <Button 
                    variant="outline" 
                    className="w-full mt-3 hover:bg-primary hover:text-white"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSelectTemplate(template);
                    }}
                  >
                    Use This Template
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
