
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, FileText, Calculator, BarChart3, Shield, Download } from "lucide-react";

export default function Landing() {
  const handleSignIn = () => {
    window.location.href = "/api/login";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <Shield className="h-8 w-8 text-blue-600 mr-3" />
              <h1 className="text-2xl font-bold text-gray-900">API 653 Report Builder</h1>
            </div>
            <Button onClick={handleSignIn} size="lg" className="bg-blue-600 hover:bg-blue-700">
              Sign In with Replit
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-900 mb-6">
            Professional API 653 Tank Inspection Reports
          </h2>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            Create comprehensive, compliant inspection reports for aboveground storage tanks. 
            Built for API 653 certified inspectors with accurate calculations and professional formatting.
          </p>
          <Button onClick={handleSignIn} size="lg" className="bg-blue-600 hover:bg-blue-700 text-lg px-8 py-3">
            Get Started - Sign In
          </Button>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <Calculator className="h-12 w-12 text-blue-600 mb-4" />
              <CardTitle>Engineering Calculations</CardTitle>
              <CardDescription>
                Accurate API 653 compliant calculations for shell thickness, corrosion rates, and remaining life assessments
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="border-0 shadow-lg">
            <CardHeader>
              <FileText className="h-12 w-12 text-green-600 mb-4" />
              <CardTitle>Complete Documentation</CardTitle>
              <CardDescription>
                Track CML records, settlement surveys, tank history, and all inspection findings in one place
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="border-0 shadow-lg">
            <CardHeader>
              <BarChart3 className="h-12 w-12 text-purple-600 mb-4" />
              <CardTitle>Data Analysis</CardTitle>
              <CardDescription>
                Statistical analysis of thickness measurements with trend analysis and predictive assessments
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="border-0 shadow-lg">
            <CardHeader>
              <Download className="h-12 w-12 text-orange-600 mb-4" />
              <CardTitle>Export Options</CardTitle>
              <CardDescription>
                Generate professional PDF and Word reports ready for submission to regulatory authorities
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="border-0 shadow-lg">
            <CardHeader>
              <Shield className="h-12 w-12 text-red-600 mb-4" />
              <CardTitle>Compliance Assured</CardTitle>
              <CardDescription>
                Built following API 653 standards with verified calculations and proper documentation requirements
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CheckCircle className="h-12 w-12 text-teal-600 mb-4" />
              <CardTitle>Quality Control</CardTitle>
              <CardDescription>
                Built-in validation and error checking to ensure data integrity and calculation accuracy
              </CardDescription>
            </CardHeader>
          </Card>
        </div>

        {/* Call to Action */}
        <div className="text-center bg-white rounded-lg shadow-lg p-8">
          <h3 className="text-2xl font-bold text-gray-900 mb-4">
            Ready to Create Professional Inspection Reports?
          </h3>
          <p className="text-gray-600 mb-6">
            Sign in with your Replit account to start building comprehensive API 653 inspection reports
          </p>
          <Button onClick={handleSignIn} size="lg" className="bg-blue-600 hover:bg-blue-700 text-lg px-8 py-3">
            Sign In to Get Started
          </Button>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-gray-800 text-white py-8 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p>&copy; 2025 API 653 Report Builder. Built for professional tank inspectors.</p>
        </div>
      </footer>
    </div>
  );
}
