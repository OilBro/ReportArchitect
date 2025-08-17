import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Calculator, Save, Printer, Plus, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

const floorScanSchema = z.object({
  scanId: z.string(),
  component: z.string(),
  location: z.string(),
  scanType: z.string(),
  thickness: z.string(),
  topSide: z.string().optional(),
  underside: z.string().optional(),
  corrosionRate: z.string().optional(),
  remainingLife: z.string().optional(),
});

const floorMRTCalculationSchema = z.object({
  floorType: z.string().optional(),
  originalThickness: z.string().optional(),
  minimumThickness: z.string().optional(),
  corrosionAllowance: z.string().optional(),
  age: z.string().optional(),
  examMethod: z.string().optional(),
  threshold: z.string().optional(),
  scanCoverage: z.string().optional(),
  soilSide: z.string().optional(),
  productSide: z.string().optional(),
  criticalZone: z.string().optional(),
  scans: z.array(floorScanSchema),
  averageThickness: z.string().optional(),
  minimumRecorded: z.string().optional(),
  averageCorrosionRate: z.string().optional(),
  maximumCorrosionRate: z.string().optional(),
  averageRemainingLife: z.string().optional(),
  minimumRemainingLife: z.string().optional(),
  notes: z.string().optional(),
});

type FloorMRTCalculationData = z.infer<typeof floorMRTCalculationSchema>;

interface FloorMRTCalculationsFormProps {
  reportId: string;
}

const examMethods = [
  { value: "mfl", label: "MFL (Magnetic Flux Leakage)" },
  { value: "ut", label: "UT (Ultrasonic Testing)" },
  { value: "visual", label: "Visual Inspection" },
  { value: "combined", label: "Combined Methods" },
];

const floorTypes = [
  { value: "lap-welded", label: "Lap-Welded" },
  { value: "butt-welded", label: "Butt-Welded" },
  { value: "double-bottom", label: "Double Bottom" },
];

export function FloorMRTCalculationsForm({ reportId }: FloorMRTCalculationsFormProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isCalculating, setIsCalculating] = useState(false);

  const form = useForm<FloorMRTCalculationData>({
    resolver: zodResolver(floorMRTCalculationSchema),
    defaultValues: {
      floorType: "lap-welded",
      originalThickness: "0.250",
      minimumThickness: "0.100",
      corrosionAllowance: "0.000",
      age: "20",
      examMethod: "mfl",
      threshold: "0.180",
      scanCoverage: "20",
      soilSide: "0.020",
      productSide: "0.010",
      criticalZone: "6",
      scans: [],
      averageThickness: "",
      minimumRecorded: "",
      averageCorrosionRate: "",
      maximumCorrosionRate: "",
      averageRemainingLife: "",
      minimumRemainingLife: "",
      notes: "",
    },
  });

  // Load existing data
  const { data: savedData } = useQuery({
    queryKey: [`/api/reports/${reportId}/floor-mrt-calculations`],
    enabled: !!reportId,
  });

  useEffect(() => {
    if (savedData) {
      form.reset(savedData);
    }
  }, [savedData, form]);

  // Save mutation
  const saveMutation = useMutation({
    mutationFn: async (data: FloorMRTCalculationData) => {
      return apiRequest(`/api/reports/${reportId}/floor-mrt-calculations`, "PUT", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/reports/${reportId}/floor-mrt-calculations`] });
      toast({
        title: "Success",
        description: "Floor MRT calculations saved successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to save floor MRT calculations",
        variant: "destructive",
      });
    },
  });

  const calculateFloorMRT = () => {
    setIsCalculating(true);
    const values = form.getValues();
    
    // Parse input values
    const originalThickness = parseFloat(values.originalThickness || "0.250");
    const minimumThickness = parseFloat(values.minimumThickness || "0.100");
    const age = parseFloat(values.age || "20");
    const soilSide = parseFloat(values.soilSide || "0.020");
    const productSide = parseFloat(values.productSide || "0.010");
    
    // Calculate average and minimum thickness from scans
    const scans = values.scans || [];
    let totalThickness = 0;
    let minThickness = 999;
    let maxCorrosionRate = 0;
    
    if (scans.length > 0) {
      scans.forEach(scan => {
        const thickness = parseFloat(scan.thickness || "0");
        totalThickness += thickness;
        if (thickness < minThickness) minThickness = thickness;
        
        // Calculate corrosion rate for each scan
        const corrosionRate = age > 0 ? ((originalThickness - thickness) / age) * 1000 : 0;
        if (corrosionRate > maxCorrosionRate) maxCorrosionRate = corrosionRate;
        
        // Update scan with calculated values
        scan.corrosionRate = (Math.round(corrosionRate * 100) / 100).toFixed(2);
        const remainingLife = corrosionRate > 0 ? (thickness - minimumThickness) / (corrosionRate / 1000) : 999;
        scan.remainingLife = Math.min(999, Math.round(remainingLife)).toString();
      });
      
      const averageThickness = totalThickness / scans.length;
      const avgCorrosionRate = age > 0 ? ((originalThickness - averageThickness) / age) * 1000 : 0;
      const avgRemainingLife = avgCorrosionRate > 0 ? (averageThickness - minimumThickness) / (avgCorrosionRate / 1000) : 999;
      const minRemainingLife = maxCorrosionRate > 0 ? (minThickness - minimumThickness) / (maxCorrosionRate / 1000) : 999;
      
      form.setValue("averageThickness", averageThickness.toFixed(3));
      form.setValue("minimumRecorded", minThickness.toFixed(3));
      form.setValue("averageCorrosionRate", (Math.round(avgCorrosionRate * 100) / 100).toFixed(2));
      form.setValue("maximumCorrosionRate", (Math.round(maxCorrosionRate * 100) / 100).toFixed(2));
      form.setValue("averageRemainingLife", Math.min(999, Math.round(avgRemainingLife)).toString());
      form.setValue("minimumRemainingLife", Math.min(999, Math.round(minRemainingLife)).toString());
      form.setValue("scans", scans);
    }
    
    setIsCalculating(false);
    toast({
      title: "Calculations Complete",
      description: "Floor MRT calculations have been updated",
    });
  };

  const addScan = () => {
    const scans = form.getValues("scans");
    form.setValue("scans", [
      ...scans,
      {
        scanId: `S${scans.length + 1}`,
        component: "Floor Plate",
        location: "",
        scanType: "MFL",
        thickness: "",
        topSide: "",
        underside: "",
        corrosionRate: "",
        remainingLife: "",
      },
    ]);
  };

  const removeScan = (index: number) => {
    const scans = form.getValues("scans");
    form.setValue("scans", scans.filter((_, i) => i !== index));
  };

  const onSubmit = (data: FloorMRTCalculationData) => {
    saveMutation.mutate(data);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Floor MRT Calculations (API 653 Section 4.4)</span>
          <div className="flex gap-2">
            <Button onClick={calculateFloorMRT} disabled={isCalculating} variant="outline">
              <Calculator className="mr-2 h-4 w-4" />
              Calculate
            </Button>
            <Button onClick={() => onSubmit(form.getValues())} disabled={saveMutation.isPending}>
              <Save className="mr-2 h-4 w-4" />
              Save
            </Button>
            <Button variant="outline">
              <Printer className="mr-2 h-4 w-4" />
              Print
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Floor Configuration */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Floor Configuration</h3>
              <div className="grid grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="floorType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Floor Type</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select floor type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {floorTypes.map((type) => (
                            <SelectItem key={type.value} value={type.value}>
                              {type.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="originalThickness"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Original Thickness (in)</FormLabel>
                      <FormControl>
                        <Input placeholder="0.250" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="minimumThickness"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Minimum Required Thickness (in)</FormLabel>
                      <FormControl>
                        <Input placeholder="0.100" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Examination Parameters */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Examination Parameters</h3>
              <div className="grid grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="examMethod"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Examination Method</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select method" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {examMethods.map((method) => (
                            <SelectItem key={method.value} value={method.value}>
                              {method.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="threshold"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>MFL Threshold (in)</FormLabel>
                      <FormControl>
                        <Input placeholder="0.180" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="scanCoverage"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Scan Coverage (%)</FormLabel>
                      <FormControl>
                        <Input placeholder="20" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Corrosion Rates */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Corrosion Rates</h3>
              <div className="grid grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="soilSide"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Soil Side Corrosion (in/yr)</FormLabel>
                      <FormControl>
                        <Input placeholder="0.020" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="productSide"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Product Side Corrosion (in/yr)</FormLabel>
                      <FormControl>
                        <Input placeholder="0.010" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="criticalZone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Critical Zone (in from shell)</FormLabel>
                      <FormControl>
                        <Input placeholder="6" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Scan Data */}
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">Floor Scan Data</h3>
                <Button type="button" onClick={addScan} size="sm">
                  <Plus className="mr-2 h-4 w-4" />
                  Add Scan
                </Button>
              </div>
              
              {form.watch("scans").length > 0 && (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Scan ID</TableHead>
                        <TableHead>Component</TableHead>
                        <TableHead>Location</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Thickness (in)</TableHead>
                        <TableHead>CR (mpy)</TableHead>
                        <TableHead>RL (yrs)</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {form.watch("scans").map((scan, index) => (
                        <TableRow key={index}>
                          <TableCell>{scan.scanId}</TableCell>
                          <TableCell>
                            <Input
                              value={scan.component}
                              onChange={(e) => {
                                const scans = form.getValues("scans");
                                scans[index].component = e.target.value;
                                form.setValue("scans", scans);
                              }}
                              className="w-32"
                            />
                          </TableCell>
                          <TableCell>
                            <Input
                              value={scan.location}
                              onChange={(e) => {
                                const scans = form.getValues("scans");
                                scans[index].location = e.target.value;
                                form.setValue("scans", scans);
                              }}
                              className="w-24"
                            />
                          </TableCell>
                          <TableCell>
                            <Select
                              value={scan.scanType}
                              onValueChange={(value) => {
                                const scans = form.getValues("scans");
                                scans[index].scanType = value;
                                form.setValue("scans", scans);
                              }}
                            >
                              <SelectTrigger className="w-20">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="MFL">MFL</SelectItem>
                                <SelectItem value="UT">UT</SelectItem>
                                <SelectItem value="Visual">Visual</SelectItem>
                              </SelectContent>
                            </Select>
                          </TableCell>
                          <TableCell>
                            <Input
                              value={scan.thickness}
                              onChange={(e) => {
                                const scans = form.getValues("scans");
                                scans[index].thickness = e.target.value;
                                form.setValue("scans", scans);
                              }}
                              placeholder="0.225"
                              className="w-20"
                            />
                          </TableCell>
                          <TableCell>{scan.corrosionRate || "-"}</TableCell>
                          <TableCell>{scan.remainingLife || "-"}</TableCell>
                          <TableCell>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => removeScan(index)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </div>

            {/* Calculated Results */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Calculated Results</h3>
              <div className="grid grid-cols-2 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Thickness Summary</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex justify-between">
                      <span>Average Thickness:</span>
                      <span className="font-mono">{form.watch("averageThickness") || "-"} in</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Minimum Recorded:</span>
                      <span className="font-mono">{form.watch("minimumRecorded") || "-"} in</span>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Corrosion & Life Summary</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex justify-between">
                      <span>Avg Corrosion Rate:</span>
                      <span className="font-mono">{form.watch("averageCorrosionRate") || "-"} mpy</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Max Corrosion Rate:</span>
                      <span className="font-mono">{form.watch("maximumCorrosionRate") || "-"} mpy</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Avg Remaining Life:</span>
                      <span className="font-mono">{form.watch("averageRemainingLife") || "-"} yrs</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Min Remaining Life:</span>
                      <span className="font-mono">{form.watch("minimumRemainingLife") || "-"} yrs</span>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Notes */}
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Enter any additional notes or observations..."
                      className="min-h-[100px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}