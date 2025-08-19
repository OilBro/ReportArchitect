import { useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Plus, Edit, Trash2, Save, Copy, FileDown, Printer, Upload, Download } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { COMPONENT_OPTIONS, CMLRecord } from "@/types/report";
import { calculateCorrosionRate, formatThickness, formatCorrosionRate, formatRemainingLife, getRemainingLifeBadgeColor } from "@/lib/calculations";
import * as XLSX from 'xlsx';

interface ComponentCMLFormProps {
  reportId?: string;
}

export function ComponentCMLForm({ reportId }: ComponentCMLFormProps) {
  const [newCml, setNewCml] = useState({
    component: '',
    location: '',
    cmlId: '',
  });
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: report } = useQuery({
    queryKey: ["/api/reports", reportId],
    enabled: !!reportId,
  });

  const { data: cmlRecords = [] } = useQuery({
    queryKey: ["/api/reports", reportId, "cml-records"],
    enabled: !!reportId,
  });

  const createCmlMutation = useMutation({
    mutationFn: async (data: Partial<CMLRecord>) => {
      if (!reportId) throw new Error("No report ID");
      return apiRequest("POST", `/api/reports/${reportId}/cml-records`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/reports", reportId, "cml-records"] });
      toast({ title: "CML record created successfully" });
      setNewCml({ component: '', location: '', cmlId: '' });
    },
  });

  const updateCmlMutation = useMutation({
    mutationFn: async ({ id, ...data }: { id: string } & Partial<CMLRecord>) => {
      return apiRequest("PUT", `/api/cml-records/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/reports", reportId, "cml-records"] });
      toast({ title: "CML record updated successfully" });
    },
  });

  const deleteCmlMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest("DELETE", `/api/cml-records/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/reports", reportId, "cml-records"] });
      toast({ title: "CML record deleted successfully" });
    },
  });

  const handleCreateCml = () => {
    if (!newCml.component || !newCml.location) {
      toast({ 
        title: "Missing required fields", 
        description: "Component and location are required",
        variant: "destructive" 
      });
      return;
    }

    const nextCmlNumber = (cmlRecords.length + 1).toString().padStart(3, '0');
    const cmlId = `CML-${nextCmlNumber}`;

    createCmlMutation.mutate({
      ...newCml,
      cmlId,
    });
  };

  const handleUpdateReading = (id: string, field: string, value: string) => {
    const numValue = value ? parseFloat(value) : undefined;
    const cml = cmlRecords.find((c: any) => c.id === id);
    
    if (!cml) return;

    // Calculate corrosion rate and remaining life if we have enough data
    let updates: any = { [field]: numValue };
    
    if (field === 'currentReading' && numValue && report?.originalThickness && report?.age) {
      const calculation = calculateCorrosionRate({
        originalThickness: parseFloat(report.originalThickness),
        currentThickness: numValue,
        serviceYears: report.age,
        practicalTmin: 0.125, // Default practical tmin - should be configurable
      });
      
      updates.corrosionRate = calculation.corrosionRate;
      updates.remainingLife = calculation.remainingLife;
    }

    updateCmlMutation.mutate({ id, ...updates });
  };

  const generateAutoId = () => {
    const nextNumber = (cmlRecords.length + 1).toString().padStart(3, '0');
    return `CML-${nextNumber}`;
  };

  // Excel import function
  const handleExcelImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const data = event.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);
        
        // Process each row from Excel
        for (const row of jsonData) {
          const cmlData = {
            cmlId: row['CML ID'] || generateAutoId(),
            component: row['Component'] || '',
            location: row['Location'] || '',
            previousReading: parseFloat(row['Previous Reading'] || 0),
            currentReading: parseFloat(row['Current Reading'] || 0),
            practicalTmin: parseFloat(row['Practical tMin'] || 0.125),
            corrosionRate: parseFloat(row['Corrosion Rate'] || 0),
            remainingLife: parseFloat(row['Remaining Life'] || 0),
            notes: row['Notes'] || '',
          };
          
          if (cmlData.component && cmlData.location) {
            await createCmlMutation.mutateAsync(cmlData);
          }
        }
        
        toast({
          title: "Import Successful",
          description: `Imported ${jsonData.length} CML records from Excel`,
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
    const exportData = cmlRecords.map((record: any) => ({
      'CML ID': record.cmlId,
      'Component': record.component,
      'Location': record.location,
      'Previous Reading': record.previousReading || '',
      'Current Reading': record.currentReading || '',
      'Practical tMin': record.practicalTmin || 0.125,
      'Corrosion Rate': record.corrosionRate || '',
      'Remaining Life': record.remainingLife || '',
      'Notes': record.notes || '',
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Component CML Records');
    
    // Generate filename with report ID and date
    const filename = `component-cml-${reportId}-${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(wb, filename);
    
    toast({
      title: "Export Successful",
      description: `Exported ${cmlRecords.length} CML records to Excel`,
    });
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Component Corrosion Monitoring Locations</h2>
            <p className="text-sm text-gray-600 mt-1">Manage thickness measurement locations and data</p>
          </div>
          <div className="flex gap-2">
            <input
              type="file"
              accept=".xlsx,.xls"
              onChange={handleExcelImport}
              style={{ display: 'none' }}
              id="cml-excel-import"
            />
            <label htmlFor="cml-excel-import">
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
            <Button onClick={handleCreateCml} className="bg-primary hover:bg-primary/90">
              <Plus className="h-4 w-4 mr-2" />
              Add CML
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* CML Data Entry Form */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 p-4 bg-gray-50 rounded-lg">
          <div>
            <Label className="block text-sm font-medium text-gray-700 mb-2">Component</Label>
            <Select value={newCml.component} onValueChange={(value) => setNewCml({ ...newCml, component: value })}>
              <SelectTrigger>
                <SelectValue placeholder="Select component..." />
              </SelectTrigger>
              <SelectContent>
                {COMPONENT_OPTIONS.map((component) => (
                  <SelectItem key={component} value={component}>
                    {component}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <Label className="block text-sm font-medium text-gray-700 mb-2">Location</Label>
            <Input
              placeholder="Chime Q1-Q2"
              value={newCml.location}
              onChange={(e) => setNewCml({ ...newCml, location: e.target.value })}
            />
          </div>
          
          <div>
            <Label className="block text-sm font-medium text-gray-700 mb-2">CML ID</Label>
            <Input
              placeholder="Auto-generated"
              value={generateAutoId()}
              readOnly
              className="bg-gray-100"
            />
          </div>
        </div>

        {/* CML Records Table */}
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>CML ID</TableHead>
                <TableHead>Component</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Current Reading (in)</TableHead>
                <TableHead>Previous Reading (in)</TableHead>
                <TableHead>Corrosion Rate (mpy)</TableHead>
                <TableHead>Remaining Life (yrs)</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {cmlRecords.map((cml: any) => (
                <TableRow key={cml.id}>
                  <TableCell className="font-mono text-sm">{cml.cmlId}</TableCell>
                  <TableCell>{cml.component}</TableCell>
                  <TableCell>{cml.location}</TableCell>
                  <TableCell>
                    <Input
                      type="number"
                      step="0.001"
                      className="w-24"
                      value={cml.currentReading ? formatThickness(parseFloat(cml.currentReading)) : ""}
                      onChange={(e) => handleUpdateReading(cml.id, 'currentReading', e.target.value)}
                    />
                  </TableCell>
                  <TableCell className="text-sm">
                    {cml.previousReading ? formatThickness(parseFloat(cml.previousReading)) : "-"}
                  </TableCell>
                  <TableCell className="text-sm font-medium">
                    {cml.corrosionRate ? formatCorrosionRate(parseFloat(cml.corrosionRate)) : "-"}
                  </TableCell>
                  <TableCell>
                    {cml.remainingLife ? (
                      <Badge className={getRemainingLifeBadgeColor(parseFloat(cml.remainingLife))}>
                        {formatRemainingLife(parseFloat(cml.remainingLife))}
                      </Badge>
                    ) : (
                      "-"
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <Button variant="ghost" size="sm" className="text-primary hover:text-primary/80">
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="text-red-500 hover:text-red-600"
                        onClick={() => deleteCmlMutation.mutate(cml.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-between pt-4 border-t border-gray-200">
          <div className="flex items-center space-x-4">
            <Button className="bg-primary hover:bg-primary/90">
              <Save className="h-4 w-4 mr-2" />
              Save CML Data
            </Button>
            <Button variant="outline">
              <Copy className="h-4 w-4 mr-2" />
              Duplicate CML
            </Button>
          </div>
          <div className="flex items-center space-x-4">
            <Button variant="outline">
              <FileDown className="h-4 w-4 mr-2" />
              Export Data
            </Button>
            <Button variant="outline">
              <Printer className="h-4 w-4 mr-2" />
              Print CML
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
