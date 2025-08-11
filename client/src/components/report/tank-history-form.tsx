import { useState, useEffect } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import { Save, Download, Upload } from "lucide-react";

const tankHistorySchema = z.object({
  // Section A - General Information
  inspectionDate: z.string().optional(),
  owner: z.string().optional(),
  location: z.string().optional(),
  contact: z.string().optional(),
  tankNo: z.string().optional(),
  oilProInspector: z.string().optional(),
  region: z.string().optional(),
  inspectionType: z.enum(['in-service-external', 'out-of-service-internal']).optional(),
  hasMSDS: z.boolean().optional(),
  canContactCustomer: z.boolean().optional(),
  requiresFieldReport: z.boolean().optional(),
  entryPermitRequired: z.boolean().optional(),
  hotWorkPermitRequired: z.boolean().optional(),
  photographsAllowed: z.boolean().optional(),
  hasLeadPaint: z.boolean().optional(),
  hasLeadDocumentation: z.boolean().optional(),
  tankCleaned: z.boolean().optional(),
  
  // Section B - Tank History
  namePlateInfo: z.string().optional(),
  originalManufacturer: z.string().optional(),
  yearOfConstruction: z.string().optional(),
  currentProduct: z.string().optional(),
  previousProducts: z.string().optional(),
  hasPreviousInspections: z.string().optional(),
  previousInspectionYear: z.string().optional(),
  previousReportsAvailable: z.boolean().optional(),
  unusualEvents: z.boolean().optional(),
  unusualEventsDescription: z.string().optional(),
  hasRepairs: z.boolean().optional(),
  repairsDescription: z.string().optional(),
  drawingsAvailable: z.boolean().optional(),
  hasBeenRelocated: z.boolean().optional(),
  relocationDetails: z.string().optional(),
  hasMajorModifications: z.boolean().optional(),
  elevationReadingsAvailable: z.boolean().optional(),
  hasBeenHotTapped: z.boolean().optional(),
  
  // Section C - Design
  tankDiameter: z.string().optional(),
  tankHeight: z.string().optional(),
  maxLiquidLevel: z.string().optional(),
  specificGravity: z.string().optional(),
  internalPressure: z.string().optional(),
  operatingTemp: z.string().optional(),
  designMetalTemp: z.string().optional(),
  shellMaterialSpec: z.string().optional(),
  isAnchored: z.boolean().optional(),
  hasStiffeningRing: z.boolean().optional(),
  constructionStandard: z.string().optional(),
  requiresRerate: z.boolean().optional(),
  rerateDetails: z.string().optional(),
  shellType: z.enum(['butt-welded', 'lap-welded', 'riveted']).optional(),
  rivetsSealed: z.boolean().optional(),
  sealMethod: z.enum(['seal-welded', 'epoxy-sealed', 'none']).optional(),
  
  // Section D - Foundation
  baseKeptDry: z.boolean().optional(),
  foundationType: z.enum(['gravel-berm', 'ringwall', 'sand-berm', 'oiled-sand-pad', 'other']).optional(),
  foundationOther: z.string().optional(),
  unusualSettlement: z.boolean().optional(),
  foundationProblems: z.boolean().optional(),
  excessiveVegetation: z.boolean().optional(),
  
  // Section E - Details
  cathodicallyProtected: z.boolean().optional(),
  hasLeakDetection: z.boolean().optional(),
  internallyLined: z.boolean().optional(),
  externallyInsulated: z.boolean().optional(),
  bottomType: z.enum(['welded', 'riveted', 'other']).optional(),
  originalBottomThickness: z.string().optional(),
  hasAnnularRing: z.boolean().optional(),
  annularRingSize: z.string().optional(),
  annularRingThickness: z.string().optional(),
  bottomPlateSize: z.string().optional(),
  bottomCoatingType: z.enum(['thin-film-epoxy', 'thick-film', 'none', 'other']).optional(),
  bottomDesignType: z.enum(['cone-up', 'cone-down', 'shovel', 'flat', 'drain-dry', 'concrete']).optional(),
  
  // Roof Data
  tankType: z.enum(['fixed-roof', 'open-top', 'floating-roof']).optional(),
  fixedRoofType: z.string().optional(),
  floatingRoofType: z.string().optional(),
  roofMaterial: z.enum(['steel', 'aluminum', 'other']).optional(),
});

type TankHistoryFormData = z.infer<typeof tankHistorySchema>;

interface TankHistoryFormProps {
  reportId: string;
}

export function TankHistoryForm({ reportId }: TankHistoryFormProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const { data: tankHistory } = useQuery({
    queryKey: ["/api/reports", reportId, "tank-history"],
    enabled: !!reportId,
  });

  const form = useForm<TankHistoryFormData>({
    resolver: zodResolver(tankHistorySchema),
    defaultValues: tankHistory || {},
  });

  useEffect(() => {
    if (tankHistory) {
      form.reset(tankHistory);
    }
  }, [tankHistory, form]);

  const saveMutation = useMutation({
    mutationFn: async (data: TankHistoryFormData) => {
      return apiRequest("PUT", `/api/reports/${reportId}/tank-history`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/reports", reportId, "tank-history"] });
      toast({ title: "Tank history saved successfully" });
    },
    onError: (error) => {
      toast({ 
        title: "Error saving tank history", 
        description: error.message,
        variant: "destructive" 
      });
    },
  });

  const handleSave = (data: TankHistoryFormData) => {
    saveMutation.mutate(data);
  };

  const handleExport = () => {
    const data = form.getValues();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `tank-history-${reportId}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: "Tank history exported successfully" });
  };

  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string);
        form.reset(data);
        toast({ title: "Tank history imported successfully" });
      } catch (error) {
        toast({ 
          title: "Error importing tank history", 
          description: "Invalid file format",
          variant: "destructive" 
        });
      }
    };
    reader.readAsText(file);
  };

  return (
    <form onSubmit={form.handleSubmit(handleSave)} className="space-y-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Tank History Questionnaire</h2>
        <div className="flex gap-2">
          <Button type="button" variant="outline" onClick={handleExport}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Label htmlFor="import-file" className="cursor-pointer">
            <Button type="button" variant="outline" asChild>
              <span>
                <Upload className="h-4 w-4 mr-2" />
                Import
              </span>
            </Button>
            <Input
              id="import-file"
              type="file"
              accept=".json"
              className="hidden"
              onChange={handleImport}
            />
          </Label>
          <Button type="submit" disabled={saveMutation.isPending}>
            <Save className="h-4 w-4 mr-2" />
            Save
          </Button>
        </div>
      </div>

      {/* Section A - General Information */}
      <Card>
        <CardHeader>
          <CardTitle>Section A - General Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="inspectionDate">Date of Inspection</Label>
              <Input
                type="date"
                id="inspectionDate"
                {...form.register("inspectionDate")}
              />
            </div>
            <div>
              <Label htmlFor="owner">Owner</Label>
              <Input id="owner" {...form.register("owner")} />
            </div>
            <div>
              <Label htmlFor="location">Location</Label>
              <Input id="location" {...form.register("location")} />
            </div>
            <div>
              <Label htmlFor="contact">Contact</Label>
              <Input id="contact" {...form.register("contact")} />
            </div>
            <div>
              <Label htmlFor="tankNo">Tank No</Label>
              <Input id="tankNo" {...form.register("tankNo")} />
            </div>
            <div>
              <Label htmlFor="oilProInspector">OilPro Inspector</Label>
              <Input id="oilProInspector" {...form.register("oilProInspector")} />
            </div>
            <div>
              <Label htmlFor="region">Region</Label>
              <Input id="region" {...form.register("region")} />
            </div>
          </div>

          <div className="space-y-3">
            <div>
              <Label>Type of Inspection</Label>
              <RadioGroup
                value={form.watch("inspectionType")}
                onValueChange={(value) => form.setValue("inspectionType", value as any)}
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="in-service-external" id="in-service" />
                  <Label htmlFor="in-service">In-Service External Inspection</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="out-of-service-internal" id="out-of-service" />
                  <Label htmlFor="out-of-service">Out of Service Internal Inspection</Label>
                </div>
              </RadioGroup>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                { field: "hasMSDS", label: "Did you get MSDS on most recent product?" },
                { field: "canContactCustomer", label: "Can Engineer Contact Customer Direct?" },
                { field: "requiresFieldReport", label: "Does Customer Require a field report?" },
                { field: "entryPermitRequired", label: "Is an Entry permit Required?" },
                { field: "hotWorkPermitRequired", label: "Is a Hot Work permit required?" },
                { field: "photographsAllowed", label: "Are photographs allowed to be taken?" },
                { field: "hasLeadPaint", label: "Is the tank painted with lead paint?" },
                { field: "hasLeadDocumentation", label: "If no lead, can customer provide documentation?" },
                { field: "tankCleaned", label: "Has the tank been cleaned and gas free?" },
              ].map(({ field, label }) => (
                <div key={field} className="flex items-center space-x-2">
                  <Checkbox
                    id={field}
                    checked={form.watch(field as any)}
                    onCheckedChange={(checked) => form.setValue(field as any, checked as boolean)}
                  />
                  <Label htmlFor={field} className="text-sm">{label}</Label>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Section B - Tank History */}
      <Card>
        <CardHeader>
          <CardTitle>Section B - Tank History</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="namePlateInfo">Name Plate Information</Label>
            <Textarea id="namePlateInfo" {...form.register("namePlateInfo")} />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="originalManufacturer">Original Manufacturer</Label>
              <Input id="originalManufacturer" {...form.register("originalManufacturer")} />
            </div>
            <div>
              <Label htmlFor="yearOfConstruction">Year of Construction</Label>
              <Input id="yearOfConstruction" {...form.register("yearOfConstruction")} />
            </div>
            <div>
              <Label htmlFor="currentProduct">Product(s) Currently Stored</Label>
              <Input id="currentProduct" {...form.register("currentProduct")} />
            </div>
            <div>
              <Label htmlFor="previousProducts">Previously Stored Product(s)</Label>
              <Input id="previousProducts" {...form.register("previousProducts")} />
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="hasPreviousInspections"
                checked={form.watch("hasPreviousInspections") === "yes"}
                onCheckedChange={(checked) => form.setValue("hasPreviousInspections", checked ? "yes" : "no")}
              />
              <Label htmlFor="hasPreviousInspections">Has tank had previous inspections?</Label>
            </div>
            {form.watch("hasPreviousInspections") === "yes" && (
              <div>
                <Label htmlFor="previousInspectionYear">Year of Most Recent Inspection</Label>
                <Input id="previousInspectionYear" {...form.register("previousInspectionYear")} />
              </div>
            )}
          </div>

          <div>
            <div className="flex items-center space-x-2 mb-2">
              <Checkbox
                id="unusualEvents"
                checked={form.watch("unusualEvents")}
                onCheckedChange={(checked) => form.setValue("unusualEvents", checked as boolean)}
              />
              <Label htmlFor="unusualEvents">Has tank been subjected to unusual events?</Label>
            </div>
            {form.watch("unusualEvents") && (
              <Textarea 
                placeholder="Please describe the unusual events..."
                {...form.register("unusualEventsDescription")} 
              />
            )}
          </div>

          <div>
            <div className="flex items-center space-x-2 mb-2">
              <Checkbox
                id="hasRepairs"
                checked={form.watch("hasRepairs")}
                onCheckedChange={(checked) => form.setValue("hasRepairs", checked as boolean)}
              />
              <Label htmlFor="hasRepairs">Have repairs or alterations been performed?</Label>
            </div>
            {form.watch("hasRepairs") && (
              <Textarea 
                placeholder="Please describe repairs and year..."
                {...form.register("repairsDescription")} 
              />
            )}
          </div>
        </CardContent>
      </Card>

      {/* Section C - Design */}
      <Card>
        <CardHeader>
          <CardTitle>Section C - Design</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="tankDiameter">Tank Diameter</Label>
              <Input id="tankDiameter" {...form.register("tankDiameter")} />
            </div>
            <div>
              <Label htmlFor="tankHeight">Tank Height</Label>
              <Input id="tankHeight" {...form.register("tankHeight")} />
            </div>
            <div>
              <Label htmlFor="maxLiquidLevel">Max Liquid Level (FT)</Label>
              <Input id="maxLiquidLevel" {...form.register("maxLiquidLevel")} />
            </div>
            <div>
              <Label htmlFor="specificGravity">Specific Gravity</Label>
              <Input id="specificGravity" {...form.register("specificGravity")} />
            </div>
            <div>
              <Label htmlFor="internalPressure">Internal Pressure</Label>
              <Input id="internalPressure" {...form.register("internalPressure")} />
            </div>
            <div>
              <Label htmlFor="operatingTemp">Operating Temperature (°F)</Label>
              <Input id="operatingTemp" {...form.register("operatingTemp")} />
            </div>
            <div>
              <Label htmlFor="designMetalTemp">Design Metal Temperature (°F)</Label>
              <Input id="designMetalTemp" {...form.register("designMetalTemp")} />
            </div>
            <div>
              <Label htmlFor="shellMaterialSpec">Shell Material Specification</Label>
              <Input id="shellMaterialSpec" {...form.register("shellMaterialSpec")} />
            </div>
            <div>
              <Label htmlFor="constructionStandard">Construction Standard</Label>
              <Input id="constructionStandard" placeholder="API 650, API 12F, etc" {...form.register("constructionStandard")} />
            </div>
          </div>

          <div>
            <Label>Shell Type</Label>
            <RadioGroup
              value={form.watch("shellType")}
              onValueChange={(value) => form.setValue("shellType", value as any)}
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="butt-welded" id="butt-welded" />
                <Label htmlFor="butt-welded">Butt Welded</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="lap-welded" id="lap-welded" />
                <Label htmlFor="lap-welded">Lap Welded</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="riveted" id="riveted" />
                <Label htmlFor="riveted">Riveted</Label>
              </div>
            </RadioGroup>
          </div>
        </CardContent>
      </Card>

      {/* Section D - Foundation */}
      <Card>
        <CardHeader>
          <CardTitle>Section D - Foundation</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Foundation Type</Label>
            <RadioGroup
              value={form.watch("foundationType")}
              onValueChange={(value) => form.setValue("foundationType", value as any)}
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="gravel-berm" id="gravel-berm" />
                <Label htmlFor="gravel-berm">Gravel Berm</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="ringwall" id="ringwall" />
                <Label htmlFor="ringwall">Ringwall</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="sand-berm" id="sand-berm" />
                <Label htmlFor="sand-berm">Sand Berm</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="oiled-sand-pad" id="oiled-sand-pad" />
                <Label htmlFor="oiled-sand-pad">Oiled Sand Pad</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="other" id="foundation-other" />
                <Label htmlFor="foundation-other">Other</Label>
              </div>
            </RadioGroup>
            {form.watch("foundationType") === "other" && (
              <Input 
                className="mt-2"
                placeholder="Describe foundation type..."
                {...form.register("foundationOther")} 
              />
            )}
          </div>

          <div className="space-y-3">
            {[
              { field: "baseKeptDry", label: "Is the base of the tank kept dry?" },
              { field: "unusualSettlement", label: "Has any unusual settlement been noted?" },
              { field: "foundationProblems", label: "Have there been foundation problems on other tanks?" },
              { field: "excessiveVegetation", label: "Is there excessive vegetation around the tank?" },
            ].map(({ field, label }) => (
              <div key={field} className="flex items-center space-x-2">
                <Checkbox
                  id={field}
                  checked={form.watch(field as any)}
                  onCheckedChange={(checked) => form.setValue(field as any, checked as boolean)}
                />
                <Label htmlFor={field}>{label}</Label>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Section E - Details & Roof Data */}
      <Card>
        <CardHeader>
          <CardTitle>Section E - Details & Roof Data</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            {[
              { field: "cathodicallyProtected", label: "Is the tank bottom cathodically protected?" },
              { field: "hasLeakDetection", label: "Does the tank have a leak detection system?" },
              { field: "internallyLined", label: "Is the tank internally lined?" },
              { field: "externallyInsulated", label: "Is the tank externally insulated?" },
              { field: "hasAnnularRing", label: "Does tank have an annular ring?" },
            ].map(({ field, label }) => (
              <div key={field} className="flex items-center space-x-2">
                <Checkbox
                  id={field}
                  checked={form.watch(field as any)}
                  onCheckedChange={(checked) => form.setValue(field as any, checked as boolean)}
                />
                <Label htmlFor={field}>{label}</Label>
              </div>
            ))}
          </div>

          {form.watch("hasAnnularRing") && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="annularRingSize">Annular Ring Size</Label>
                <Input id="annularRingSize" {...form.register("annularRingSize")} />
              </div>
              <div>
                <Label htmlFor="annularRingThickness">Annular Ring Thickness</Label>
                <Input id="annularRingThickness" {...form.register("annularRingThickness")} />
              </div>
            </div>
          )}

          <div>
            <Label>Tank Type</Label>
            <RadioGroup
              value={form.watch("tankType")}
              onValueChange={(value) => form.setValue("tankType", value as any)}
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="fixed-roof" id="fixed-roof" />
                <Label htmlFor="fixed-roof">Fixed Roof</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="open-top" id="open-top" />
                <Label htmlFor="open-top">Open Top</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="floating-roof" id="floating-roof" />
                <Label htmlFor="floating-roof">Floating Roof</Label>
              </div>
            </RadioGroup>
          </div>

          {form.watch("tankType") === "floating-roof" && (
            <div>
              <Label>Roof Material</Label>
              <RadioGroup
                value={form.watch("roofMaterial")}
                onValueChange={(value) => form.setValue("roofMaterial", value as any)}
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="steel" id="steel" />
                  <Label htmlFor="steel">Steel</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="aluminum" id="aluminum" />
                  <Label htmlFor="aluminum">Aluminum</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="other" id="roof-other" />
                  <Label htmlFor="roof-other">Other</Label>
                </div>
              </RadioGroup>
            </div>
          )}
        </CardContent>
      </Card>
    </form>
  );
}