import { useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Plus, Star } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface AppendicesFormProps {
  reportId?: string;
}

export function AppendicesForm({ reportId }: AppendicesFormProps) {
  const [selectedAppendix, setSelectedAppendix] = useState('A');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: appendices = [] } = useQuery({
    queryKey: ["/api/reports", reportId, "appendices"],
    enabled: !!reportId,
  });

  const updateAppendixMutation = useMutation({
    mutationFn: async (data: { id?: string; appendixLetter: string; isApplicable: boolean; subject?: string; content?: string; order: number }) => {
      if (data.id) {
        return apiRequest("PUT", `/api/appendices/${data.id}`, data);
      } else {
        return apiRequest("POST", `/api/reports/${reportId}/appendices`, data);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/reports", reportId, "appendices"] });
      toast({ title: "Appendix updated successfully" });
    },
  });

  const appendixLetters = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
  
  const currentAppendix = appendices.find((a: any) => a.appendixLetter === selectedAppendix) || {
    appendixLetter: selectedAppendix,
    isApplicable: true,
    subject: '',
    content: '',
    order: appendixLetters.indexOf(selectedAppendix),
  };

  const handleAppendixUpdate = (field: string, value: any) => {
    updateAppendixMutation.mutate({
      ...currentAppendix,
      [field]: value,
    });
  };

  const subjectOptions = {
    A: ['Inspection Methods', 'Visual Inspection', 'Ultrasonic Testing', 'Magnetic Particle Testing'],
    B: ['Calculations', 'Shell Calculations', 'Roof Calculations', 'Bottom Calculations', 'Nozzle Calculations'],
    C: ['Photos', 'General Photos', 'Defect Photos', 'Repair Photos'],
    D: ['Drawings', 'Tank Layout', 'CML Location Plan', 'Isometric Drawings'],
    E: ['Procedures', 'Inspection Procedures', 'Repair Procedures', 'Testing Procedures'],
    F: ['Certificates', 'Material Certificates', 'Welding Certificates', 'Inspector Certificates'],
    G: ['Standards', 'API Standards', 'ASME Standards', 'Company Standards'],
    H: ['Miscellaneous', 'Correspondence', 'Previous Reports', 'Other Documents'],
  };

  return (
    <Card>
      <CardHeader>
        <h2 className="text-lg font-semibold text-gray-900">Report Appendices</h2>
        <p className="text-sm text-gray-600 mt-1">Configure and customize report appendix sections (A through H)</p>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Appendix Navigation */}
        <div className="flex flex-wrap gap-2 p-4 bg-gray-50 rounded-lg">
          {appendixLetters.map((letter) => (
            <Button
              key={letter}
              variant={selectedAppendix === letter ? "default" : "outline"}
              className={selectedAppendix === letter ? "bg-primary text-white" : ""}
              onClick={() => setSelectedAppendix(letter)}
            >
              Appendix {letter}
            </Button>
          ))}
        </div>

        {/* Current Appendix Content */}
        <div className="border border-gray-200 rounded-lg">
          <div className="flex items-center justify-between px-4 py-3 bg-gray-50 border-b border-gray-200">
            <div className="flex items-center space-x-3">
              <Checkbox
                checked={currentAppendix.isApplicable}
                onCheckedChange={(checked) => handleAppendixUpdate('isApplicable', checked)}
              />
              <Label className="text-md font-semibold text-gray-900">
                Appendix {selectedAppendix} - {getAppendixTitle(selectedAppendix)}
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <Button variant="link" className="text-primary hover:text-primary/80 text-sm p-0 h-auto">
                <Plus className="h-4 w-4 mr-1" />
                App. Subject
              </Button>
              <Button variant="link" className="text-primary hover:text-primary/80 text-sm p-0 h-auto">
                <Plus className="h-4 w-4 mr-1" />
                App. Text
              </Button>
            </div>
          </div>
          
          <div className="px-4 py-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label className="block text-sm font-medium text-gray-700 mb-2">Subject</Label>
                <Select
                  value={currentAppendix.subject || ""}
                  onValueChange={(value) => handleAppendixUpdate('subject', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select subject..." />
                  </SelectTrigger>
                  <SelectContent>
                    {subjectOptions[selectedAppendix as keyof typeof subjectOptions]?.map((subject) => (
                      <SelectItem key={subject} value={subject}>
                        {subject}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              {selectedAppendix === 'A' && (
                <div>
                  <Label className="block text-sm font-medium text-gray-700 mb-2">Component CML Record</Label>
                  <Button variant="outline">
                    <Star className="h-4 w-4 mr-2" />
                    Open CML Data
                  </Button>
                </div>
              )}
            </div>
            
            <div className="mt-4">
              <Label className="block text-sm font-medium text-gray-700 mb-2">Appendix Text</Label>
              <Textarea
                rows={4}
                value={currentAppendix.content || ""}
                onChange={(e) => handleAppendixUpdate('content', e.target.value)}
                placeholder={getDefaultText(selectedAppendix)}
              />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function getAppendixTitle(letter: string): string {
  const titles = {
    A: 'Inspection Data',
    B: 'Calculations',
    C: 'Photographs',
    D: 'Drawings',
    E: 'Procedures',
    F: 'Certificates',
    G: 'Standards & References',
    H: 'Miscellaneous',
  };
  return titles[letter as keyof typeof titles] || 'Unknown';
}

function getDefaultText(letter: string): string {
  const defaultTexts = {
    A: 'Default text for inspection methods and procedures used during the API 653 out-of-service inspection. This section details the visual inspection procedures, ultrasonic thickness testing methodology, and any additional non-destructive testing methods employed.',
    B: 'This appendix contains the engineering calculations performed as part of the inspection assessment, including corrosion rate analysis, remaining life calculations, and fitness-for-service evaluations.',
    C: 'Photographs taken during the inspection showing general conditions, specific defects, and areas of concern.',
    D: 'Tank drawings, layout plans, and isometric drawings referenced during the inspection.',
    E: 'Detailed procedures followed during the inspection process.',
    F: 'Relevant certificates including material test reports and inspector certifications.',
    G: 'Standards and codes referenced during the inspection and evaluation.',
    H: 'Additional documentation and miscellaneous items related to the inspection.',
  };
  return defaultTexts[letter as keyof typeof defaultTexts] || '';
}
