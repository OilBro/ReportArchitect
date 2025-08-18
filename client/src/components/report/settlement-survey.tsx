import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Calculator, Plus, Trash2, Save, ChartBar } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from "recharts";

interface ElevationPoint {
  id: string;
  position: number; // 0, 45, 90, 135, 180, 225, 270, 315 degrees or custom
  previousElevation: number;
  currentElevation: number;
  settlement: number; // calculated: previous - current
  distance?: number; // distance from reference point
}

interface SettlementSurveyData {
  id?: string;
  reportId: string;
  surveyDate: string;
  previousSurveyDate: string;
  datum: string; // reference datum
  numberOfPoints: number; // 8, 12, 16, or custom
  elevationPoints: ElevationPoint[];
  maxSettlement: number;
  minSettlement: number;
  differentialSettlement: number;
  tiltPercentage: number;
  planarTilt: number;
  uniformSettlement: number;
  outOfPlaneSettlement: number;
  notes: string;
}

interface SettlementSurveyFormProps {
  reportId: string;
}

export function SettlementSurveyForm({ reportId }: SettlementSurveyFormProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState<SettlementSurveyData>({
    reportId,
    surveyDate: new Date().toISOString().split('T')[0],
    previousSurveyDate: '',
    datum: 'MSL', // Mean Sea Level
    numberOfPoints: 8,
    elevationPoints: [],
    maxSettlement: 0,
    minSettlement: 0,
    differentialSettlement: 0,
    tiltPercentage: 0,
    planarTilt: 0,
    uniformSettlement: 0,
    outOfPlaneSettlement: 0,
    notes: '',
  });

  // Query to fetch existing data
  const { data: existingData } = useQuery<SettlementSurveyData>({
    queryKey: ['/api/settlement-survey', reportId],
    enabled: !!reportId,
  });

  useEffect(() => {
    if (existingData) {
      setFormData(existingData);
    } else {
      // Initialize with default elevation points based on numberOfPoints
      initializeElevationPoints(formData.numberOfPoints);
    }
  }, [existingData]);

  const initializeElevationPoints = (numPoints: number) => {
    const points: ElevationPoint[] = [];
    const angleIncrement = 360 / numPoints;
    
    for (let i = 0; i < numPoints; i++) {
      points.push({
        id: `point-${i}`,
        position: i * angleIncrement,
        previousElevation: 100.00, // Default starting elevation
        currentElevation: 100.00,
        settlement: 0,
        distance: 0,
      });
    }
    
    setFormData(prev => ({ ...prev, elevationPoints: points }));
  };

  const updateElevationPoint = (index: number, field: keyof ElevationPoint, value: number) => {
    const updatedPoints = [...formData.elevationPoints];
    updatedPoints[index] = {
      ...updatedPoints[index],
      [field]: value,
    };
    
    // Calculate settlement for this point
    if (field === 'previousElevation' || field === 'currentElevation') {
      updatedPoints[index].settlement = 
        updatedPoints[index].previousElevation - updatedPoints[index].currentElevation;
    }
    
    setFormData(prev => ({ ...prev, elevationPoints: updatedPoints }));
  };

  const addCustomPoint = () => {
    const newPoint: ElevationPoint = {
      id: `point-${formData.elevationPoints.length}`,
      position: 0,
      previousElevation: 100.00,
      currentElevation: 100.00,
      settlement: 0,
      distance: 0,
    };
    
    setFormData(prev => ({
      ...prev,
      elevationPoints: [...prev.elevationPoints, newPoint],
    }));
  };

  const removePoint = (index: number) => {
    const updatedPoints = formData.elevationPoints.filter((_, i) => i !== index);
    setFormData(prev => ({ ...prev, elevationPoints: updatedPoints }));
  };

  const calculateSettlementMetrics = () => {
    if (formData.elevationPoints.length === 0) return;

    const settlements = formData.elevationPoints.map(p => p.settlement);
    const maxSettlement = Math.max(...settlements);
    const minSettlement = Math.min(...settlements);
    const differentialSettlement = maxSettlement - minSettlement;
    
    // Calculate uniform settlement (average)
    const uniformSettlement = settlements.reduce((a, b) => a + b, 0) / settlements.length;
    
    // Calculate tilt - maximum differential settlement divided by tank diameter
    // Assuming tank diameter is available from base data
    const tankDiameter = 100; // This should come from base data
    const tiltPercentage = (differentialSettlement / tankDiameter) * 100;
    
    // Calculate planar tilt using least squares fit
    const planarTilt = calculatePlanarTilt(formData.elevationPoints);
    
    // Calculate out-of-plane settlement (deviation from planar fit)
    const outOfPlaneSettlement = calculateOutOfPlaneSettlement(formData.elevationPoints, planarTilt);
    
    setFormData(prev => ({
      ...prev,
      maxSettlement,
      minSettlement,
      differentialSettlement,
      tiltPercentage,
      planarTilt,
      uniformSettlement,
      outOfPlaneSettlement,
    }));
    
    toast({
      title: "Calculations Complete",
      description: `Differential Settlement: ${differentialSettlement.toFixed(3)} inches`,
    });
  };

  const calculatePlanarTilt = (points: ElevationPoint[]): number => {
    // Simplified planar tilt calculation
    // In a real implementation, this would use least squares fitting
    const n = points.length;
    if (n < 3) return 0;
    
    // Calculate the best-fit plane using least squares
    let sumX = 0, sumY = 0, sumZ = 0;
    let sumXX = 0, sumYY = 0, sumXY = 0;
    let sumXZ = 0, sumYZ = 0;
    
    points.forEach(point => {
      const angle = (point.position * Math.PI) / 180;
      const x = Math.cos(angle);
      const y = Math.sin(angle);
      const z = point.settlement;
      
      sumX += x;
      sumY += y;
      sumZ += z;
      sumXX += x * x;
      sumYY += y * y;
      sumXY += x * y;
      sumXZ += x * z;
      sumYZ += y * z;
    });
    
    // Solve for plane coefficients
    const denominator = n * (sumXX * sumYY - sumXY * sumXY) - sumX * (sumX * sumYY - sumY * sumXY) + sumY * (sumX * sumXY - sumY * sumXX);
    
    if (denominator === 0) return 0;
    
    const a = (sumXZ * (n * sumYY - sumY * sumY) - sumYZ * (n * sumXY - sumX * sumY) + sumZ * (sumX * sumY - sumY * sumXY)) / denominator;
    const b = (sumYZ * (n * sumXX - sumX * sumX) - sumXZ * (n * sumXY - sumX * sumY) + sumZ * (sumX * sumY - sumX * sumXY)) / denominator;
    
    // Calculate tilt angle in degrees
    const tiltAngle = Math.atan(Math.sqrt(a * a + b * b)) * (180 / Math.PI);
    
    return tiltAngle;
  };

  const calculateOutOfPlaneSettlement = (points: ElevationPoint[], planarTilt: number): number => {
    // Calculate deviation from the best-fit plane
    // Simplified calculation for demonstration
    const settlements = points.map(p => p.settlement);
    const mean = settlements.reduce((a, b) => a + b, 0) / settlements.length;
    const variance = settlements.reduce((sum, s) => sum + Math.pow(s - mean, 2), 0) / settlements.length;
    return Math.sqrt(variance);
  };

  // Prepare data for charts
  const getChartData = () => {
    return formData.elevationPoints.map(point => ({
      position: `${point.position}°`,
      previous: point.previousElevation,
      current: point.currentElevation,
      settlement: point.settlement,
      angle: point.position,
    }));
  };

  const getRadarData = () => {
    return formData.elevationPoints.map(point => ({
      position: `${point.position}°`,
      settlement: Math.abs(point.settlement),
    }));
  };

  // Save mutation
  const saveMutation = useMutation({
    mutationFn: async (data: SettlementSurveyData) => {
      if (data.id) {
        return apiRequest("PATCH", `/api/settlement-survey/${data.id}`, data);
      } else {
        return apiRequest("POST", "/api/settlement-survey", data);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/settlement-survey', reportId] });
      toast({ title: "Settlement survey data saved successfully" });
    },
    onError: (error) => {
      toast({ 
        title: "Error saving data", 
        description: error.message,
        variant: "destructive" 
      });
    },
  });

  const handleSave = () => {
    saveMutation.mutate(formData);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Settlement Survey Analysis</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="surveyDate">Current Survey Date</Label>
              <Input
                id="surveyDate"
                type="date"
                value={formData.surveyDate}
                onChange={(e) => setFormData(prev => ({ ...prev, surveyDate: e.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="previousSurveyDate">Previous Survey Date</Label>
              <Input
                id="previousSurveyDate"
                type="date"
                value={formData.previousSurveyDate}
                onChange={(e) => setFormData(prev => ({ ...prev, previousSurveyDate: e.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="datum">Reference Datum</Label>
              <Select
                value={formData.datum}
                onValueChange={(value) => setFormData(prev => ({ ...prev, datum: value }))}
              >
                <SelectTrigger id="datum">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="MSL">Mean Sea Level (MSL)</SelectItem>
                  <SelectItem value="NAVD88">NAVD88</SelectItem>
                  <SelectItem value="NGVD29">NGVD29</SelectItem>
                  <SelectItem value="Local">Local Datum</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label htmlFor="numberOfPoints">Number of Measurement Points</Label>
            <Select
              value={formData.numberOfPoints.toString()}
              onValueChange={(value) => {
                const num = parseInt(value);
                setFormData(prev => ({ ...prev, numberOfPoints: num }));
                initializeElevationPoints(num);
              }}
            >
              <SelectTrigger id="numberOfPoints">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="8">8 Points (45° intervals)</SelectItem>
                <SelectItem value="12">12 Points (30° intervals)</SelectItem>
                <SelectItem value="16">16 Points (22.5° intervals)</SelectItem>
                <SelectItem value="24">24 Points (15° intervals)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="data" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="data">Elevation Data</TabsTrigger>
          <TabsTrigger value="results">Calculated Results</TabsTrigger>
          <TabsTrigger value="charts">Visual Analysis</TabsTrigger>
        </TabsList>

        <TabsContent value="data">
          <Card>
            <CardHeader>
              <CardTitle>Elevation Points</CardTitle>
              <div className="flex gap-2">
                <Button onClick={addCustomPoint} size="sm">
                  <Plus className="h-4 w-4 mr-1" />
                  Add Point
                </Button>
                <Button onClick={calculateSettlementMetrics} variant="secondary" size="sm">
                  <Calculator className="h-4 w-4 mr-1" />
                  Calculate
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Position (°)</TableHead>
                    <TableHead>Previous Elev. (ft)</TableHead>
                    <TableHead>Current Elev. (ft)</TableHead>
                    <TableHead>Settlement (in)</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {formData.elevationPoints.map((point, index) => (
                    <TableRow key={point.id}>
                      <TableCell>
                        <Input
                          type="number"
                          value={point.position}
                          onChange={(e) => updateElevationPoint(index, 'position', parseFloat(e.target.value) || 0)}
                          className="w-20"
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          step="0.001"
                          value={point.previousElevation}
                          onChange={(e) => updateElevationPoint(index, 'previousElevation', parseFloat(e.target.value) || 0)}
                          className="w-24"
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          step="0.001"
                          value={point.currentElevation}
                          onChange={(e) => updateElevationPoint(index, 'currentElevation', parseFloat(e.target.value) || 0)}
                          className="w-24"
                        />
                      </TableCell>
                      <TableCell>
                        <span className={`font-semibold ${point.settlement > 0 ? 'text-red-600' : point.settlement < 0 ? 'text-green-600' : ''}`}>
                          {(point.settlement * 12).toFixed(3)}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Button
                          onClick={() => removePoint(index)}
                          size="sm"
                          variant="ghost"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="results">
          <Card>
            <CardHeader>
              <CardTitle>Settlement Analysis Results</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <div className="flex justify-between p-3 bg-gray-50 rounded">
                    <span className="font-medium">Maximum Settlement:</span>
                    <span className="font-bold text-red-600">
                      {(formData.maxSettlement * 12).toFixed(3)} inches
                    </span>
                  </div>
                  <div className="flex justify-between p-3 bg-gray-50 rounded">
                    <span className="font-medium">Minimum Settlement:</span>
                    <span className="font-bold text-green-600">
                      {(formData.minSettlement * 12).toFixed(3)} inches
                    </span>
                  </div>
                  <div className="flex justify-between p-3 bg-gray-50 rounded">
                    <span className="font-medium">Differential Settlement:</span>
                    <span className="font-bold">
                      {(formData.differentialSettlement * 12).toFixed(3)} inches
                    </span>
                  </div>
                  <div className="flex justify-between p-3 bg-gray-50 rounded">
                    <span className="font-medium">Uniform Settlement:</span>
                    <span className="font-bold">
                      {(formData.uniformSettlement * 12).toFixed(3)} inches
                    </span>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <div className="flex justify-between p-3 bg-gray-50 rounded">
                    <span className="font-medium">Tilt Percentage:</span>
                    <span className="font-bold">
                      {formData.tiltPercentage.toFixed(3)}%
                    </span>
                  </div>
                  <div className="flex justify-between p-3 bg-gray-50 rounded">
                    <span className="font-medium">Planar Tilt Angle:</span>
                    <span className="font-bold">
                      {formData.planarTilt.toFixed(3)}°
                    </span>
                  </div>
                  <div className="flex justify-between p-3 bg-gray-50 rounded">
                    <span className="font-medium">Out-of-Plane Settlement:</span>
                    <span className="font-bold">
                      {(formData.outOfPlaneSettlement * 12).toFixed(3)} inches
                    </span>
                  </div>
                  <div className="flex justify-between p-3 bg-blue-50 rounded">
                    <span className="font-medium">API 653 Limit (1%):</span>
                    <span className="font-bold text-blue-600">
                      {formData.tiltPercentage <= 1 ? 'PASS ✓' : 'FAIL ✗'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-6">
                <Label htmlFor="notes">Notes / Observations</Label>
                <textarea
                  id="notes"
                  className="w-full mt-1 p-2 border rounded-md"
                  rows={4}
                  value={formData.notes}
                  onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="Enter any observations or notes about the settlement survey..."
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="charts">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Settlement Profile</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  <LineChart data={getChartData()}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="position" />
                    <YAxis label={{ value: 'Elevation (ft)', angle: -90, position: 'insideLeft' }} />
                    <Tooltip />
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey="previous" 
                      stroke="#8884d8" 
                      name="Previous Survey"
                      strokeWidth={2}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="current" 
                      stroke="#82ca9d" 
                      name="Current Survey"
                      strokeWidth={2}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Settlement Distribution (Polar View)</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  <RadarChart data={getRadarData()}>
                    <PolarGrid />
                    <PolarAngleAxis dataKey="position" />
                    <PolarRadiusAxis />
                    <Radar 
                      name="Settlement (inches)" 
                      dataKey="settlement" 
                      stroke="#ff7300" 
                      fill="#ff7300" 
                      fillOpacity={0.6} 
                    />
                    <Tooltip />
                    <Legend />
                  </RadarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      <div className="flex justify-end">
        <Button onClick={handleSave} className="bg-green-600 hover:bg-green-700">
          <Save className="h-4 w-4 mr-2" />
          Save Settlement Survey Data
        </Button>
      </div>
    </div>
  );
}