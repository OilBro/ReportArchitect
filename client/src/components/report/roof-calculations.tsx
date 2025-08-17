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
import { Calculator, Save, Printer } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

const roofCalculationSchema = z.object({
  roofType: z.string().optional(),
  roofPlateThickness: z.string().optional(),
  roofPlateActual: z.string().optional(),
  roofAge: z.string().optional(),
  roofCorrosionAllowance: z.string().optional(),
  deckPlateThickness: z.string().optional(),
  deckPlateActual: z.string().optional(),
  supportedByRafters: z.string().optional(),
  rafterSpacing: z.string().optional(),
  supportedByColumns: z.string().optional(),
  columnSpacing: z.string().optional(),
  liveLoad: z.string().optional(),
  snowLoad: z.string().optional(),
  attachmentLoad: z.string().optional(),
  designPressure: z.string().optional(),
  designVacuum: z.string().optional(),
  tMinDeck: z.string().optional(),
  tMinRoof: z.string().optional(),
  corrosionRateDeck: z.string().optional(),
  corrosionRateRoof: z.string().optional(),
  remainingLifeDeck: z.string().optional(),
  remainingLifeRoof: z.string().optional(),
  notes: z.string().optional(),
});

type RoofCalculationData = z.infer<typeof roofCalculationSchema>;

interface RoofCalculationsFormProps {
  reportId: string;
}

const roofTypes = [
  { value: "cone", label: "Cone Roof" },
  { value: "dome", label: "Dome Roof" },
  { value: "umbrella", label: "Umbrella Roof" },
  { value: "floating", label: "Floating Roof" },
  { value: "open", label: "Open Top" },
];

export function RoofCalculationsForm({ reportId }: RoofCalculationsFormProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isCalculating, setIsCalculating] = useState(false);

  const form = useForm<RoofCalculationData>({
    resolver: zodResolver(roofCalculationSchema),
    defaultValues: {
      roofType: "cone",
      roofPlateThickness: "0.250",
      roofPlateActual: "",
      roofAge: "20",
      roofCorrosionAllowance: "0.000",
      deckPlateThickness: "0.437",
      deckPlateActual: "",
      supportedByRafters: "yes",
      rafterSpacing: "5",
      supportedByColumns: "no",
      columnSpacing: "",
      liveLoad: "25",
      snowLoad: "0",
      attachmentLoad: "0",
      designPressure: "0",
      designVacuum: "0",
      tMinDeck: "",
      tMinRoof: "",
      corrosionRateDeck: "",
      corrosionRateRoof: "",
      remainingLifeDeck: "",
      remainingLifeRoof: "",
      notes: "",
    },
  });

  // Load existing data
  const { data: savedData } = useQuery({
    queryKey: [`/api/reports/${reportId}/roof-calculations`],
    enabled: !!reportId,
  });

  useEffect(() => {
    if (savedData) {
      form.reset(savedData);
    }
  }, [savedData, form]);

  // Save mutation
  const saveMutation = useMutation({
    mutationFn: async (data: RoofCalculationData) => {
      return apiRequest(`/api/reports/${reportId}/roof-calculations`, "PUT", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/reports/${reportId}/roof-calculations`] });
      toast({
        title: "Success",
        description: "Roof calculations saved successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to save roof calculations",
        variant: "destructive",
      });
    },
  });

  const calculateRoof = () => {
    setIsCalculating(true);
    const values = form.getValues();
    
    // Parse input values
    const roofPlateThickness = parseFloat(values.roofPlateThickness || "0.250");
    const roofPlateActual = parseFloat(values.roofPlateActual || "0.225");
    const deckPlateThickness = parseFloat(values.deckPlateThickness || "0.437");
    const deckPlateActual = parseFloat(values.deckPlateActual || "0.400");
    const roofAge = parseFloat(values.roofAge || "20");
    const liveLoad = parseFloat(values.liveLoad || "25");
    const snowLoad = parseFloat(values.snowLoad || "0");
    const rafterSpacing = parseFloat(values.rafterSpacing || "5");
    
    // Calculate minimum thickness for deck plates per API 653
    let tMinDeck = 0.094; // Default minimum for deck plates
    if (values.supportedByRafters === "yes") {
      // For raftered roofs, tMin depends on rafter spacing and loading
      const totalLoad = liveLoad + snowLoad;
      tMinDeck = Math.sqrt((totalLoad * Math.pow(rafterSpacing * 12, 2)) / (30000 * 4.8));
    }
    tMinDeck = Math.max(0.094, Math.round(tMinDeck * 1000) / 1000);
    
    // Calculate minimum thickness for roof plates
    const tMinRoof = 0.094; // API 653 minimum for roof plates
    
    // Calculate corrosion rates
    const corrosionRateDeck = roofAge > 0 ? ((deckPlateThickness - deckPlateActual) / roofAge) * 1000 : 0;
    const corrosionRateRoof = roofAge > 0 ? ((roofPlateThickness - roofPlateActual) / roofAge) * 1000 : 0;
    
    // Calculate remaining life
    const remainingLifeDeck = corrosionRateDeck > 0 ? (deckPlateActual - tMinDeck) / (corrosionRateDeck / 1000) : 999;
    const remainingLifeRoof = corrosionRateRoof > 0 ? (roofPlateActual - tMinRoof) / (corrosionRateRoof / 1000) : 999;
    
    // Update form with calculated values
    form.setValue("tMinDeck", tMinDeck.toFixed(3));
    form.setValue("tMinRoof", tMinRoof.toFixed(3));
    form.setValue("corrosionRateDeck", (Math.round(corrosionRateDeck * 100) / 100).toFixed(2));
    form.setValue("corrosionRateRoof", (Math.round(corrosionRateRoof * 100) / 100).toFixed(2));
    form.setValue("remainingLifeDeck", Math.min(999, Math.round(remainingLifeDeck)).toString());
    form.setValue("remainingLifeRoof", Math.min(999, Math.round(remainingLifeRoof)).toString());
    
    setIsCalculating(false);
    toast({
      title: "Calculations Complete",
      description: "Roof calculations have been updated",
    });
  };

  const onSubmit = (data: RoofCalculationData) => {
    saveMutation.mutate(data);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Roof Calculations (API 653)</span>
          <div className="flex gap-2">
            <Button onClick={calculateRoof} disabled={isCalculating} variant="outline">
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
            {/* Roof Configuration */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Roof Configuration</h3>
              <div className="grid grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="roofType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Roof Type</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select roof type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {roofTypes.map((type) => (
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
                  name="supportedByRafters"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Supported by Rafters?</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="yes">Yes</SelectItem>
                          <SelectItem value="no">No</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="rafterSpacing"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Rafter Spacing (ft)</FormLabel>
                      <FormControl>
                        <Input placeholder="5" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Thickness Data */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Thickness Data</h3>
              <div className="grid grid-cols-2 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Roof Plates</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <FormField
                      control={form.control}
                      name="roofPlateThickness"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nominal Thickness (in)</FormLabel>
                          <FormControl>
                            <Input placeholder="0.250" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="roofPlateActual"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Actual Thickness (in)</FormLabel>
                          <FormControl>
                            <Input placeholder="0.225" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Deck Plates</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <FormField
                      control={form.control}
                      name="deckPlateThickness"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nominal Thickness (in)</FormLabel>
                          <FormControl>
                            <Input placeholder="0.437" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="deckPlateActual"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Actual Thickness (in)</FormLabel>
                          <FormControl>
                            <Input placeholder="0.400" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Loading Data */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Loading Data</h3>
              <div className="grid grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="liveLoad"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Live Load (psf)</FormLabel>
                      <FormControl>
                        <Input placeholder="25" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="snowLoad"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Snow Load (psf)</FormLabel>
                      <FormControl>
                        <Input placeholder="0" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="attachmentLoad"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Attachment Load (psf)</FormLabel>
                      <FormControl>
                        <Input placeholder="0" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Calculated Results */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Calculated Results</h3>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Component</TableHead>
                    <TableHead>t Min (in)</TableHead>
                    <TableHead>Corrosion Rate (mpy)</TableHead>
                    <TableHead>Remaining Life (years)</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell>Roof Plates</TableCell>
                    <TableCell>{form.watch("tMinRoof") || "-"}</TableCell>
                    <TableCell>{form.watch("corrosionRateRoof") || "-"}</TableCell>
                    <TableCell>{form.watch("remainingLifeRoof") || "-"}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Deck Plates</TableCell>
                    <TableCell>{form.watch("tMinDeck") || "-"}</TableCell>
                    <TableCell>{form.watch("corrosionRateDeck") || "-"}</TableCell>
                    <TableCell>{form.watch("remainingLifeDeck") || "-"}</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
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