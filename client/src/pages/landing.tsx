import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, FileCheck, Calculator, BarChart3 } from "lucide-react";

export function Landing() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-gray-100">
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-6xl mx-auto">
          {/* Hero Section */}
          <div className="text-center mb-16">
            <h1 className="text-5xl font-bold text-gray-900 mb-6">
              API 653 Inspection Report Builder
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
              Professional tank inspection reporting system with comprehensive API 653 compliance tools, 
              automated calculations, and detailed report generation
            </p>
            <Button 
              size="lg" 
              className="text-lg px-8 py-6"
              onClick={() => window.location.href = "/api/login"}
            >
              Sign In to Get Started
            </Button>
          </div>

          {/* Features Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
            <Card>
              <CardHeader>
                <Shield className="h-10 w-10 text-blue-600 mb-3" />
                <CardTitle>API 653 Compliant</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Full compliance with API 653 standards for atmospheric storage tank inspections
                </CardDescription>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <Calculator className="h-10 w-10 text-green-600 mb-3" />
                <CardTitle>Automated Calculations</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Shell thickness, corrosion rates, and remaining life calculations with accuracy
                </CardDescription>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <BarChart3 className="h-10 w-10 text-purple-600 mb-3" />
                <CardTitle>Settlement Analysis</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Professional settlement survey tools with visual charts and API 653 compliance checks
                </CardDescription>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <FileCheck className="h-10 w-10 text-orange-600 mb-3" />
                <CardTitle>Report Generation</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Generate professional PDF and Word reports ready for regulatory submission
                </CardDescription>
              </CardContent>
            </Card>
          </div>

          {/* Additional Info */}
          <Card className="mb-12">
            <CardHeader>
              <CardTitle className="text-2xl">Comprehensive Inspection Management</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-semibold mb-2">Core Features</h3>
                  <ul className="space-y-2 text-gray-600">
                    <li>• Complete tank data management</li>
                    <li>• Shell, roof, and floor calculations</li>
                    <li>• CML and nozzle tracking</li>
                    <li>• Historical inspection records</li>
                  </ul>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">Professional Tools</h3>
                  <ul className="space-y-2 text-gray-600">
                    <li>• Corrosion rate analysis</li>
                    <li>• Remaining life assessments</li>
                    <li>• Inspection recommendations</li>
                    <li>• Regulatory compliance tracking</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Sign In CTA */}
          <div className="text-center">
            <Card className="max-w-2xl mx-auto">
              <CardHeader>
                <CardTitle className="text-2xl">Ready to Start?</CardTitle>
                <CardDescription className="text-lg">
                  Sign in with your account to access the full inspection report builder
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button 
                  size="lg" 
                  className="w-full md:w-auto"
                  onClick={() => window.location.href = "/api/login"}
                >
                  Sign In Now
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}