import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Image, FileSignature, Plus, Trash2, SpellCheck } from "lucide-react";
import { ReportFormData, MATERIAL_OPTIONS, SERVICE_OPTIONS, INSPECTOR_OPTIONS, PracticalTmin } from "@/types/report";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useEffect } from "react";

const baseDataSchema = z.object({
  reportNumber: z.string().min(1, "Report number is required"),
  tankId: z.string().min(1, "Tank/Equipment ID is required"),
  inspectionDate: z.string().optional(),
  nominalDiameter: z.number().optional(),
  shellHeight: z.number().optional(),
  designPressure: z.number().optional(),
  originalThickness: z.number().optional(),
  plateSpec: z.string().optional(),
  service: z.string().optional(),
  age: z.number().optional(),
  inspectorName: z.string().optional(),
  inspectorRecord: z.string().optional(),
  inspectorCertification: z.string().optional(),
  coverText: z.string().optional(),
  customFields: z.record(z.string()).optional(),
});

interface BaseDataFormProps {
  reportId?: string;
  unitSet: string;
}

export function BaseDataForm({ reportId, unitSet }: BaseDataFormProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: report, isLoading } = useQuery<any>({
    queryKey: ["/api/reports", reportId],
    enabled: !!reportId,
  });

  const { data: practicalTmins = [] } = useQuery<PracticalTmin[]>({
    queryKey: ["/api/reports", reportId, "practical-tmins"],
    enabled: !!reportId,
  });

  const form = useForm<ReportFormData>({
    resolver: zodResolver(baseDataSchema),
    defaultValues: {
      reportNumber: "",
      tankId: "",
      inspectionDate: "",
      customFields: {},
    },
  });

  // Update form when report data loads
  useEffect(() => {
    if (report) {
      form.reset({
        reportNumber: report.reportNumber || "",
        tankId: report.tankId || "",
        inspectionDate: report.inspectionDate ? new Date(report.inspectionDate).toISOString().split('T')[0] : "",
        nominalDiameter: report.nominalDiameter ? parseFloat(report.nominalDiameter) : undefined,
        shellHeight: report.shellHeight ? parseFloat(report.shellHeight) : undefined,
        designPressure: report.designPressure ? parseFloat(report.designPressure) : undefined,
        originalThickness: report.originalThickness ? parseFloat(report.originalThickness) : undefined,
        plateSpec: report.plateSpec || "",
        service: report.service || "",
        age: report.age || undefined,
        inspectorName: report.inspectorName || "",
        inspectorRecord: report.inspectorRecord || "",
        inspectorCertification: report.inspectorCertification || "",
        coverText: report.coverText || "",
        customFields: report.customFields || {},
      });
    }
  }, [report, form]);

  const updateReportMutation = useMutation({
    mutationFn: async (data: Partial<ReportFormData>) => {
      if (!reportId) throw new Error("No report ID");
      console.log("[BASE DATA] Saving report data:", data);
      const result = await apiRequest("POST", `/api/reports/${reportId}/save`, data);
      console.log("[BASE DATA] Save response:", result);
      return result;
    },
    onSuccess: (response) => {
      console.log("[BASE DATA] Save successful:", response);
      queryClient.invalidateQueries({ queryKey: ["/api/reports", reportId] });
      queryClient.invalidateQueries({ queryKey: ["/api/reports"] });
      toast({ title: "Report saved successfully" });
    },
    onError: (error) => {
      console.error("[BASE DATA] Save error:", error);
      toast({ 
        title: "Error saving report", 
        description: error.message,
        variant: "destructive" 
      });
    },
  });

  const addPracticalTminMutation = useMutation({
    mutationFn: async (data: { component: string; size?: string; practicalTmin: number }) => {
      if (!reportId) throw new Error("No report ID");
      return apiRequest("POST", `/api/reports/${reportId}/practical-tmins`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/reports", reportId, "practical-tmins"] });
      toast({ title: "Practical tmin added successfully" });
    },
  });

  const deletePracticalTminMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest("DELETE", `/api/practical-tmins/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/reports", reportId, "practical-tmins"] });
      toast({ title: "Practical tmin deleted successfully" });
    },
  });

  const onSubmit = (data: ReportFormData) => {
    console.log("[BASE DATA] Form submitted with data:", data);
    updateReportMutation.mutate(data);
  };

  if (isLoading) {
    return <div className="animate-pulse bg-gray-200 h-96 rounded-lg"></div>;
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Base Report Data</h2>
            <p className="text-sm text-gray-600 mt-1">Enter the basic tank and inspection information</p>
          </div>
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm">
              <Image className="h-4 w-4 mr-2" />
              Logo
            </Button>
            <Button variant="outline" size="sm">
              <FileSignature className="h-4 w-4 mr-2" />
              Signature
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-8">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            {/* Report Header Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <FormField
                control={form.control}
                name="reportNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Report No. <span className="text-red-500">*</span></FormLabel>
                    <FormControl>
                      <Input placeholder="RPT-2024-004" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="tankId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tank/Equipment ID <span className="text-red-500">*</span></FormLabel>
                    <FormControl>
                      <Input placeholder="AST-400" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="inspectionDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Inspection Date</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Tank Specifications */}
            <div>
              <h3 className="text-md font-semibold text-gray-900 mb-4">Tank Specifications</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <FormField
                  control={form.control}
                  name="nominalDiameter"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nominal Diameter</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          placeholder="25" 
                          {...field}
                          onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="shellHeight"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Shell Height</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          placeholder="32" 
                          {...field}
                          onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="designPressure"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Design Pressure</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          step="0.1" 
                          placeholder="2.5" 
                          {...field}
                          onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="originalThickness"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Original Plate Thickness</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          step="0.001" 
                          placeholder="0.500" 
                          {...field}
                          onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Material and Service */}
            <div>
              <h3 className="text-md font-semibold text-gray-900 mb-4">Material & Service Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="plateSpec"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Plate Spec (Crs 1)</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select Material..." />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {MATERIAL_OPTIONS.map((material) => (
                            <SelectItem key={material} value={material}>
                              {material}
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
                  name="service"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Service</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select Service..." />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {SERVICE_OPTIONS.map((service) => (
                            <SelectItem key={service} value={service}>
                              {service}
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
                  name="age"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Age/Prev Insp.</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          placeholder="15" 
                          {...field}
                          onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Inspector Information */}
            <div>
              <h3 className="text-md font-semibold text-gray-900 mb-4">Inspector Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="inspectorName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Inspector</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select Inspector..." />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {INSPECTOR_OPTIONS.map((inspector) => (
                            <SelectItem key={inspector} value={inspector}>
                              {inspector}
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
                  name="inspectorRecord"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Inspector of Record</FormLabel>
                      <FormControl>
                        <Input placeholder="John Smith" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="inspectorCertification"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Certification</FormLabel>
                      <FormControl>
                        <Input placeholder="API 653 #12345" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Pipe/Nozzle Practical tmins */}
            <div>
              <h3 className="text-md font-semibold text-gray-900 mb-4">Pipe/Nozzle Practical tmins</h3>
              <p className="text-sm text-gray-600 mb-4">
                These values default to program practical tmin values but can be overwritten.
              </p>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Component</TableHead>
                      <TableHead>Size</TableHead>
                      <TableHead>Practical tmin (in)</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {practicalTmins.map((item: PracticalTmin) => (
                      <TableRow key={item.id}>
                        <TableCell>{item.component}</TableCell>
                        <TableCell>{item.size || "-"}</TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            step="0.001"
                            className="w-20"
                            value={item.practicalTmin || ""}
                            onChange={(e) => {
                              // Handle inline editing
                            }}
                          />
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => item.id && deletePracticalTminMutation.mutate(item.id)}
                            className="text-red-500 hover:text-red-600"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              <Button
                type="button"
                variant="outline"
                className="mt-4"
                onClick={() => {
                  addPracticalTminMutation.mutate({
                    component: "Shell Nozzle",
                    size: "4\"",
                    practicalTmin: 0.125,
                  });
                }}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Component
              </Button>
            </div>

            {/* Cover Text */}
            <div>
              <h3 className="text-md font-semibold text-gray-900 mb-4">Cover Text</h3>
              <p className="text-sm text-gray-600 mb-3">
                Cover text will auto-update with input data until first save. Best practice: populate all cells before saving.
              </p>
              <FormField
                control={form.control}
                name="coverText"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Textarea
                        rows={6}
                        placeholder="Default cover text will appear here..."
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="mt-2 flex items-center justify-between">
                <Button type="button" variant="link" className="text-primary hover:text-primary/80 p-0 h-auto">
                  <SpellCheck className="h-4 w-4 mr-1" />
                  Spell Check
                </Button>
                <span className="text-xs text-gray-500">Auto-save enabled</span>
              </div>
            </div>

            {/* Additional User Data */}
            <div>
              <h3 className="text-md font-semibold text-gray-900 mb-4">Additional User Data</h3>
              <p className="text-sm text-gray-600 mb-4">Custom data fields that will appear on report page 4.</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[1, 2, 3, 4].map((i) => (
                  <FormField
                    key={i}
                    control={form.control}
                    name={`customFields.field${i}` as any}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Custom Field {i}</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter custom data..." {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                ))}
              </div>
            </div>

            <div className="flex justify-end">
              <Button type="submit" disabled={updateReportMutation.isPending}>
                {updateReportMutation.isPending ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
