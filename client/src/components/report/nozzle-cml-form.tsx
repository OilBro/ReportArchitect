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
import { Plus, Trash2, Save, Calculator, Upload, Download } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import * as XLSX from 'xlsx';

interface NozzleCMLRecord {
  id: string;
  nozzleId: string;
  nozzleDescription: string;
  nozzleSize: string;
  nozzleSchedule: string;
  service: string;
  orientation: number; // degrees from North
  elevation: number; // feet from bottom
  previousThickness: number;
  currentThickness: number;
  nominalThickness: number;
  tMin: number; // minimum required thickness
  corrosionRate: number; // calculated mpy
  remainingLife: number; // calculated years
  nextInspectionDate: string;
  inspectionMethod: string;
  notes: string;
}

interface NozzleCMLData {
  id?: string;
  reportId: string;
  records: NozzleCMLRecord[];
  inspectionDate: string;
  previousInspectionDate: string;
  inspectorName: string;
  ndeCompany: string;
}

interface NozzleCMLFormProps {
  reportId: string;
}

export function NozzleCMLForm({ reportId }: NozzleCMLFormProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState<NozzleCMLData>({
    reportId,
    records: [],
    inspectionDate: new Date().toISOString().split('T')[0],
    previousInspectionDate: '',
    inspectorName: '',
    ndeCompany: '',
  });

  // Query to fetch existing data
  const { data: existingData } = useQuery<NozzleCMLData>({
    queryKey: ['/api/nozzle-cml', reportId],
    enabled: !!reportId,
  });

  useEffect(() => {
    if (existingData) {
      setFormData(existingData);
    }
  }, [existingData]);

  const addNozzleRecord = () => {
    const newRecord: NozzleCMLRecord = {
      id: `nozzle-${Date.now()}`,
      nozzleId: '',
      nozzleDescription: '',
      nozzleSize: '',
      nozzleSchedule: '40',
      service: '',
      orientation: 0,
      elevation: 0,
      previousThickness: 0,
      currentThickness: 0,
      nominalThickness: 0,
      tMin: 0,
      corrosionRate: 0,
      remainingLife: 0,
      nextInspectionDate: '',
      inspectionMethod: 'UT',
      notes: '',
    };
    
    setFormData(prev => ({
      ...prev,
      records: [...prev.records, newRecord],
    }));
  };

  const updateRecord = (index: number, field: keyof NozzleCMLRecord, value: any) => {
    const updatedRecords = [...formData.records];
    updatedRecords[index] = {
      ...updatedRecords[index],
      [field]: value,
    };
    setFormData(prev => ({ ...prev, records: updatedRecords }));
  };

  const removeRecord = (index: number) => {
    const updatedRecords = formData.records.filter((_, i) => i !== index);
    setFormData(prev => ({ ...prev, records: updatedRecords }));
  };

  const calculateNozzleMetrics = () => {
    if (!formData.previousInspectionDate || !formData.inspectionDate) {
      toast({
        title: "Missing Dates",
        description: "Please enter both inspection dates to calculate corrosion rates",
        variant: "destructive",
      });
      return;
    }

    const yearsBetween = (new Date(formData.inspectionDate).getTime() - 
                          new Date(formData.previousInspectionDate).getTime()) / 
                         (365.25 * 24 * 60 * 60 * 1000);

    const updatedRecords = formData.records.map(record => {
      // Calculate corrosion rate (mpy - mils per year)
      const thicknessLoss = (record.previousThickness - record.currentThickness) * 1000; // convert to mils
      const corrosionRate = yearsBetween > 0 ? thicknessLoss / yearsBetween : 0;
      
      // Calculate minimum thickness based on nozzle size and schedule
      const tMin = calculateNozzleTmin(record.nozzleSize, record.nozzleSchedule);
      
      // Calculate remaining life
      const remainingThickness = record.currentThickness - tMin;
      const remainingLife = corrosionRate > 0 ? remainingThickness * 1000 / corrosionRate : 999;
      
      // Calculate next inspection date
      const halfLife = remainingLife / 2;
      const nextInspectionYears = Math.min(halfLife, 10); // API 653 max interval
      const nextDate = new Date(formData.inspectionDate);
      nextDate.setFullYear(nextDate.getFullYear() + Math.floor(nextInspectionYears));
      
      return {
        ...record,
        tMin,
        corrosionRate: Math.round(corrosionRate * 100) / 100,
        remainingLife: Math.round(remainingLife * 10) / 10,
        nextInspectionDate: nextDate.toISOString().split('T')[0],
      };
    });

    setFormData(prev => ({ ...prev, records: updatedRecords }));
    
    toast({
      title: "Calculations Complete",
      description: `Updated ${updatedRecords.length} nozzle records with corrosion rates and remaining life`,
    });
  };

  const calculateNozzleTmin = (size: string, schedule: string): number => {
    // Simplified tMin calculation based on nozzle size and schedule
    // In a real implementation, this would use ASME B31.3 or similar standards
    const sizeInches = parseFloat(size) || 0;
    
    const scheduleFactors: { [key: string]: number } = {
      '10': 0.065,
      '20': 0.075,
      '30': 0.085,
      '40': 0.095,
      'STD': 0.095,
      '60': 0.110,
      '80': 0.125,
      'XS': 0.125,
      '120': 0.150,
      '160': 0.175,
      'XXS': 0.200,
    };
    
    const factor = scheduleFactors[schedule] || 0.095;
    return Math.round(sizeInches * factor * 1000) / 1000;
  };

  // Excel import function
  const handleExcelImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = event.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);
        
        const importedRecords: NozzleCMLRecord[] = jsonData.map((row: any, index) => ({
          id: `nozzle-${Date.now()}-${index}`,
          nozzleId: row['Nozzle ID'] || row['ID'] || '',
          nozzleDescription: row['Description'] || '',
          nozzleSize: String(row['Size'] || ''),
          nozzleSchedule: row['Schedule'] || '40',
          service: row['Service'] || '',
          orientation: parseFloat(row['Orientation'] || 0),
          elevation: parseFloat(row['Elevation'] || 0),
          previousThickness: parseFloat(row['Previous Thickness'] || 0),
          currentThickness: parseFloat(row['Current Thickness'] || 0),
          nominalThickness: parseFloat(row['Nominal Thickness'] || 0),
          tMin: parseFloat(row['tMin'] || 0),
          corrosionRate: parseFloat(row['Corrosion Rate'] || 0),
          remainingLife: parseFloat(row['Remaining Life'] || 0),
          nextInspectionDate: row['Next Inspection'] || '',
          inspectionMethod: row['Method'] || 'UT',
          notes: row['Notes'] || '',
        }));
        
        setFormData(prev => ({
          ...prev,
          records: [...prev.records, ...importedRecords],
        }));
        
        toast({
          title: "Import Successful",
          description: `Imported ${importedRecords.length} nozzle records from Excel`,
        });
      } catch (error) {
        toast({
          title: "Import Failed",
          description: "Failed to parse Excel file. Please check the format.",
          variant: "destructive",
        });
      }
    };
    reader.readAsBinaryString(file);
  };

  // Excel export function
  const handleExcelExport = () => {
    const exportData = formData.records.map(record => ({
      'Nozzle ID': record.nozzleId,
      'Description': record.nozzleDescription,
      'Size': record.nozzleSize,
      'Schedule': record.nozzleSchedule,
      'Service': record.service,
      'Orientation (°)': record.orientation,
      'Elevation (ft)': record.elevation,
      'Previous Thickness': record.previousThickness,
      'Current Thickness': record.currentThickness,
      'Nominal Thickness': record.nominalThickness,
      'tMin': record.tMin,
      'Corrosion Rate (mpy)': record.corrosionRate,
      'Remaining Life (years)': record.remainingLife,
      'Next Inspection': record.nextInspectionDate,
      'Method': record.inspectionMethod,
      'Notes': record.notes,
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Nozzle CML Records');
    
    // Generate filename with report ID and date
    const filename = `nozzle-cml-${reportId}-${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(wb, filename);
    
    toast({
      title: "Export Successful",
      description: `Exported ${formData.records.length} nozzle records to Excel`,
    });
  };

  // Save mutation
  const saveMutation = useMutation({
    mutationFn: async (data: NozzleCMLData) => {
      if (data.id) {
        return apiRequest("PATCH", `/api/nozzle-cml/${data.id}`, data);
      } else {
        return apiRequest("POST", "/api/nozzle-cml", data);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/nozzle-cml', reportId] });
      toast({ title: "Nozzle CML data saved successfully" });
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

  // Group records by elevation for summary
  const getElevationSummary = () => {
    const elevationGroups = formData.records.reduce((acc, record) => {
      const elevationRange = Math.floor(record.elevation / 10) * 10;
      const key = `${elevationRange}-${elevationRange + 10}ft`;
      if (!acc[key]) {
        acc[key] = {
          count: 0,
          avgCorrosionRate: 0,
          minRemaining: Infinity,
        };
      }
      acc[key].count++;
      acc[key].avgCorrosionRate += record.corrosionRate;
      acc[key].minRemaining = Math.min(acc[key].minRemaining, record.remainingLife);
      return acc;
    }, {} as Record<string, any>);

    return Object.entries(elevationGroups).map(([range, data]) => ({
      range,
      count: data.count,
      avgCorrosionRate: (data.avgCorrosionRate / data.count).toFixed(2),
      minRemaining: data.minRemaining === Infinity ? 'N/A' : data.minRemaining.toFixed(1),
    }));
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Nozzle CML Records</CardTitle>
          <div className="flex gap-2 mt-2">
            <Button onClick={addNozzleRecord} size="sm">
              <Plus className="h-4 w-4 mr-1" />
              Add Nozzle
            </Button>
            <Button onClick={calculateNozzleMetrics} variant="secondary" size="sm">
              <Calculator className="h-4 w-4 mr-1" />
              Calculate All
            </Button>
            <div className="flex-1" />
            <input
              type="file"
              accept=".xlsx,.xls"
              onChange={handleExcelImport}
              style={{ display: 'none' }}
              id="excel-import"
            />
            <label htmlFor="excel-import">
              <Button variant="outline" size="sm" asChild>
                <span>
                  <Upload className="h-4 w-4 mr-1" />
                  Import Excel
                </span>
              </Button>
            </label>
            <Button onClick={handleExcelExport} variant="outline" size="sm">
              <Download className="h-4 w-4 mr-1" />
              Export Excel
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Label htmlFor="inspectionDate">Current Inspection Date</Label>
              <Input
                id="inspectionDate"
                type="date"
                value={formData.inspectionDate}
                onChange={(e) => setFormData(prev => ({ ...prev, inspectionDate: e.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="previousInspectionDate">Previous Inspection Date</Label>
              <Input
                id="previousInspectionDate"
                type="date"
                value={formData.previousInspectionDate}
                onChange={(e) => setFormData(prev => ({ ...prev, previousInspectionDate: e.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="inspectorName">Inspector Name</Label>
              <Input
                id="inspectorName"
                value={formData.inspectorName}
                onChange={(e) => setFormData(prev => ({ ...prev, inspectorName: e.target.value }))}
                placeholder="Enter inspector name"
              />
            </div>
            <div>
              <Label htmlFor="ndeCompany">NDE Company</Label>
              <Input
                id="ndeCompany"
                value={formData.ndeCompany}
                onChange={(e) => setFormData(prev => ({ ...prev, ndeCompany: e.target.value }))}
                placeholder="Enter NDE company"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="records" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="records">Nozzle Records</TabsTrigger>
          <TabsTrigger value="summary">Summary Analysis</TabsTrigger>
        </TabsList>

        <TabsContent value="records">
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nozzle ID</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Size</TableHead>
                      <TableHead>Schedule</TableHead>
                      <TableHead>Service</TableHead>
                      <TableHead>Orientation (°)</TableHead>
                      <TableHead>Elevation (ft)</TableHead>
                      <TableHead>Previous (in)</TableHead>
                      <TableHead>Current (in)</TableHead>
                      <TableHead>Nominal (in)</TableHead>
                      <TableHead>tMin (in)</TableHead>
                      <TableHead>CR (mpy)</TableHead>
                      <TableHead>RL (years)</TableHead>
                      <TableHead>Next Insp.</TableHead>
                      <TableHead>Method</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {formData.records.map((record, index) => (
                      <TableRow key={record.id}>
                        <TableCell>
                          <Input
                            value={record.nozzleId}
                            onChange={(e) => updateRecord(index, 'nozzleId', e.target.value)}
                            className="w-20"
                            placeholder="N1"
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            value={record.nozzleDescription}
                            onChange={(e) => updateRecord(index, 'nozzleDescription', e.target.value)}
                            className="w-32"
                            placeholder="Description"
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            value={record.nozzleSize}
                            onChange={(e) => updateRecord(index, 'nozzleSize', e.target.value)}
                            className="w-16"
                            placeholder="6"
                          />
                        </TableCell>
                        <TableCell>
                          <Select
                            value={record.nozzleSchedule}
                            onValueChange={(value) => updateRecord(index, 'nozzleSchedule', value)}
                          >
                            <SelectTrigger className="w-20">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="10">10</SelectItem>
                              <SelectItem value="20">20</SelectItem>
                              <SelectItem value="30">30</SelectItem>
                              <SelectItem value="40">40/STD</SelectItem>
                              <SelectItem value="80">80/XS</SelectItem>
                              <SelectItem value="160">160/XXS</SelectItem>
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell>
                          <Input
                            value={record.service}
                            onChange={(e) => updateRecord(index, 'service', e.target.value)}
                            className="w-24"
                            placeholder="Service"
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            value={record.orientation}
                            onChange={(e) => updateRecord(index, 'orientation', parseFloat(e.target.value) || 0)}
                            className="w-16"
                            min="0"
                            max="360"
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            value={record.elevation}
                            onChange={(e) => updateRecord(index, 'elevation', parseFloat(e.target.value) || 0)}
                            className="w-16"
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            step="0.001"
                            value={record.previousThickness}
                            onChange={(e) => updateRecord(index, 'previousThickness', parseFloat(e.target.value) || 0)}
                            className="w-20"
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            step="0.001"
                            value={record.currentThickness}
                            onChange={(e) => updateRecord(index, 'currentThickness', parseFloat(e.target.value) || 0)}
                            className="w-20"
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            step="0.001"
                            value={record.nominalThickness}
                            onChange={(e) => updateRecord(index, 'nominalThickness', parseFloat(e.target.value) || 0)}
                            className="w-20"
                          />
                        </TableCell>
                        <TableCell>
                          <span className="font-medium">{record.tMin.toFixed(3)}</span>
                        </TableCell>
                        <TableCell>
                          <span className={`font-medium ${record.corrosionRate > 5 ? 'text-red-600' : ''}`}>
                            {record.corrosionRate}
                          </span>
                        </TableCell>
                        <TableCell>
                          <span className={`font-medium ${record.remainingLife < 10 ? 'text-orange-600' : 'text-green-600'}`}>
                            {record.remainingLife}
                          </span>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm">{record.nextInspectionDate}</span>
                        </TableCell>
                        <TableCell>
                          <Select
                            value={record.inspectionMethod}
                            onValueChange={(value) => updateRecord(index, 'inspectionMethod', value)}
                          >
                            <SelectTrigger className="w-16">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="UT">UT</SelectItem>
                              <SelectItem value="RT">RT</SelectItem>
                              <SelectItem value="MT">MT</SelectItem>
                              <SelectItem value="PT">PT</SelectItem>
                              <SelectItem value="VT">VT</SelectItem>
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell>
                          <Button
                            onClick={() => removeRecord(index)}
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
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="summary">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Statistics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between p-3 bg-gray-50 rounded">
                    <span className="font-medium">Total Nozzles:</span>
                    <span className="font-bold">{formData.records.length}</span>
                  </div>
                  <div className="flex justify-between p-3 bg-gray-50 rounded">
                    <span className="font-medium">Average Corrosion Rate:</span>
                    <span className="font-bold">
                      {formData.records.length > 0
                        ? (formData.records.reduce((sum, r) => sum + r.corrosionRate, 0) / formData.records.length).toFixed(2)
                        : 0} mpy
                    </span>
                  </div>
                  <div className="flex justify-between p-3 bg-gray-50 rounded">
                    <span className="font-medium">Minimum Remaining Life:</span>
                    <span className="font-bold text-orange-600">
                      {formData.records.length > 0
                        ? Math.min(...formData.records.map(r => r.remainingLife)).toFixed(1)
                        : 'N/A'} years
                    </span>
                  </div>
                  <div className="flex justify-between p-3 bg-gray-50 rounded">
                    <span className="font-medium">Nozzles &lt; 10 Years RL:</span>
                    <span className="font-bold text-red-600">
                      {formData.records.filter(r => r.remainingLife < 10).length}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Elevation Analysis</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Elevation Range</TableHead>
                      <TableHead>Count</TableHead>
                      <TableHead>Avg CR (mpy)</TableHead>
                      <TableHead>Min RL (years)</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {getElevationSummary().map((summary) => (
                      <TableRow key={summary.range}>
                        <TableCell>{summary.range}</TableCell>
                        <TableCell>{summary.count}</TableCell>
                        <TableCell>{summary.avgCorrosionRate}</TableCell>
                        <TableCell>{summary.minRemaining}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      <div className="flex justify-end">
        <Button onClick={handleSave} className="bg-green-600 hover:bg-green-700">
          <Save className="h-4 w-4 mr-2" />
          Save Nozzle CML Data
        </Button>
      </div>
    </div>
  );
}