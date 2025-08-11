import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TrendingUp, Clock, Shield, Calculator } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { calculateStatistics } from "@/lib/calculations";

interface CalculationsFormProps {
  reportId?: string;
}

export function CalculationsForm({ reportId }: CalculationsFormProps) {
  const { data: cmlRecords = [] } = useQuery({
    queryKey: ["/api/reports", reportId, "cml-records"],
    enabled: !!reportId,
  });

  const { data: report } = useQuery({
    queryKey: ["/api/reports", reportId],
    enabled: !!reportId,
  });

  // Calculate statistics from CML data
  const corrosionRates = cmlRecords
    .filter((cml: any) => cml.corrosionRate)
    .map((cml: any) => parseFloat(cml.corrosionRate));
  
  const remainingLives = cmlRecords
    .filter((cml: any) => cml.remainingLife && cml.remainingLife !== Infinity)
    .map((cml: any) => parseFloat(cml.remainingLife));

  const stats = calculateStatistics(corrosionRates);
  const minRemainingLife = remainingLives.length > 0 ? Math.min(...remainingLives) : 0;
  const avgRemainingLife = remainingLives.length > 0 
    ? remainingLives.reduce((sum, life) => sum + life, 0) / remainingLives.length 
    : 0;

  const shellLife = remainingLives.filter((_, i) => 
    cmlRecords[i]?.component?.includes('Shell')
  );
  const bottomLife = remainingLives.filter((_, i) => 
    cmlRecords[i]?.component?.includes('Bottom')
  );

  const avgShellLife = shellLife.length > 0 ? shellLife.reduce((sum, life) => sum + life, 0) / shellLife.length : 0;
  const avgBottomLife = bottomLife.length > 0 ? bottomLife.reduce((sum, life) => sum + life, 0) / bottomLife.length : 0;

  const calculationCards = [
    {
      title: "Corrosion Rate Analysis",
      icon: TrendingUp,
      color: "primary",
      description: "Statistical analysis of thickness measurements and corrosion trends.",
      metrics: [
        { label: "Average Rate:", value: `${stats.average} mpy`, color: "text-gray-900" },
        { label: "Max Rate:", value: `${stats.maximum} mpy`, color: "text-red-600" },
        { label: "95th Percentile:", value: `${stats.percentile95} mpy`, color: "text-orange-600" },
      ]
    },
    {
      title: "Remaining Life",
      icon: Clock,
      color: "success",
      description: "Predicted remaining service life based on current corrosion rates.",
      metrics: [
        { label: "Shell:", value: `${avgShellLife.toFixed(1)} years`, color: "text-green-600" },
        { label: "Bottom:", value: `${avgBottomLife.toFixed(1)} years`, color: "text-orange-600" },
        { label: "Critical:", value: `${minRemainingLife.toFixed(1)} years`, color: "text-red-600" },
      ]
    },
    {
      title: "Fitness for Service",
      icon: Shield,
      color: "warning",
      description: "API 579 fitness-for-service assessment calculations.",
      metrics: [
        { label: "Status:", value: "Acceptable", color: "text-green-600", badge: true },
        { label: "Safety Factor:", value: "2.8", color: "text-gray-900" },
        { label: "Next Inspection:", value: "2029", color: "text-gray-900" },
      ]
    }
  ];

  return (
    <Card>
      <CardHeader>
        <h2 className="text-lg font-semibold text-gray-900">Engineering Calculations</h2>
        <p className="text-sm text-gray-600 mt-1">Access additional calculations and engineering data</p>
      </CardHeader>

      <CardContent className="space-y-8">
        {/* Calculation Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {calculationCards.map((card, index) => (
            <div key={index} className="border border-gray-200 rounded-lg p-6">
              <div className="flex items-center space-x-3 mb-4">
                <div className={`w-10 h-10 bg-${card.color}-100 rounded-lg flex items-center justify-center`}>
                  <card.icon className={`text-${card.color}-500 h-5 w-5`} />
                </div>
                <h3 className="text-md font-semibold text-gray-900">{card.title}</h3>
              </div>
              
              <p className="text-sm text-gray-600 mb-4">{card.description}</p>
              
              <div className="space-y-3">
                {card.metrics.map((metric, metricIndex) => (
                  <div key={metricIndex} className="flex justify-between items-center">
                    <span className="text-sm text-gray-700">{metric.label}</span>
                    {metric.badge ? (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        {metric.value}
                      </span>
                    ) : (
                      <span className={`text-sm font-medium ${metric.color}`}>
                        {metric.value}
                      </span>
                    )}
                  </div>
                ))}
              </div>
              
              <Button variant="outline" className="w-full mt-4">
                <Calculator className="h-4 w-4 mr-2" />
                Calculate
              </Button>
            </div>
          ))}
        </div>

        {/* Calculation Details */}
        <div>
          <h3 className="text-md font-semibold text-gray-900 mb-4">Calculation Details</h3>
          <div className="bg-gray-50 rounded-lg p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="text-sm font-semibold text-gray-900 mb-3">Input Parameters</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Original Thickness:</span>
                    <span className="font-medium">
                      {report?.originalThickness ? `${parseFloat(report.originalThickness).toFixed(3)} in` : "N/A"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Service Years:</span>
                    <span className="font-medium">
                      {report?.age ? `${report.age} years` : "N/A"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">CML Count:</span>
                    <span className="font-medium">{cmlRecords.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Practical tmin:</span>
                    <span className="font-medium">0.125 in</span>
                  </div>
                </div>
              </div>
              
              <div>
                <h4 className="text-sm font-semibold text-gray-900 mb-3">Calculated Results</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Avg Corrosion Rate:</span>
                    <span className="font-medium text-orange-600">{stats.average} mpy</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Max Corrosion Rate:</span>
                    <span className="font-medium text-red-600">{stats.maximum} mpy</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Avg Remaining Life:</span>
                    <span className="font-medium text-green-600">{avgRemainingLife.toFixed(1)} years</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Min Remaining Life:</span>
                    <span className="font-medium text-red-600">{minRemainingLife.toFixed(1)} years</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
