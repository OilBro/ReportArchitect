import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ClipboardCheck, Plus, FileText, Calendar, User } from "lucide-react";
import { Link } from "wouter";

export default function Home() {
  const { data: reports = [], isLoading } = useQuery({
    queryKey: ["/api/reports"],
  });

  const recentReports = reports.slice(0, 5);

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
            <Button size="lg" variant="outline">
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
    </div>
  );
}
