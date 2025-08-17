import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Home, FolderOpen, Table, Calculator, Edit, Save, Eye, Printer, FileText, Layers, CircleCheck } from "lucide-react";

export type TabType = 'base-data' | 'tank-history' | 'appendices' | 'component-cml' | 'nozzle-cml' | 'shell-calculations' | 'roof-calculations' | 'floor-calculations' | 'settlement-survey' | 'shell-inspection' | 'bottom-inspection' | 'calculations' | 'writeup';

interface NavigationSidebarProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
  onSave: () => void;
  onPreview: () => void;
  onPrint: () => void;
}

export function NavigationSidebar({ 
  activeTab, 
  onTabChange, 
  onSave, 
  onPreview, 
  onPrint 
}: NavigationSidebarProps) {
  const tabs = [
    { id: 'base-data' as TabType, label: 'Base Data', icon: Home },
    { id: 'tank-history' as TabType, label: 'Tank History', icon: FileText },
    { id: 'appendices' as TabType, label: 'Appendices', icon: FolderOpen },
    { id: 'component-cml' as TabType, label: 'Component CML', icon: Table },
    { id: 'nozzle-cml' as TabType, label: 'Nozzle CML', icon: CircleCheck },
    { id: 'shell-calculations' as TabType, label: 'Shell Calc', icon: Calculator },
    { id: 'roof-calculations' as TabType, label: 'Roof Calc', icon: Layers },
    { id: 'floor-calculations' as TabType, label: 'Floor MRT', icon: Layers },
    { id: 'settlement-survey' as TabType, label: 'Settlement', icon: CircleCheck },
    { id: 'shell-inspection' as TabType, label: 'Shell Insp', icon: Layers },
    { id: 'bottom-inspection' as TabType, label: 'Bottom Insp', icon: CircleCheck },
    { id: 'calculations' as TabType, label: 'Other Calc', icon: Calculator },
    { id: 'writeup' as TabType, label: 'Write-up', icon: Edit },
  ];

  return (
    <Card className="sticky top-4">
      <CardHeader className="pb-4">
        <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">
          Report Sections
        </h3>
      </CardHeader>
      
      <CardContent className="px-2 py-2">
        <nav className="space-y-1">
          {tabs.map(({ id, label, icon: Icon }) => (
            <Button
              key={id}
              variant={activeTab === id ? "default" : "ghost"}
              className="w-full justify-start"
              onClick={() => onTabChange(id)}
            >
              <Icon className="h-4 w-4 mr-2" />
              {label}
            </Button>
          ))}
        </nav>
        
        <div className="mt-6 pt-4 border-t border-gray-200 space-y-2">
          <Button onClick={onSave} className="w-full bg-success-500 hover:bg-success-600">
            <Save className="h-4 w-4 mr-2" />
            Save
          </Button>
          <Button onClick={onPreview} variant="outline" className="w-full">
            <Eye className="h-4 w-4 mr-2" />
            Preview
          </Button>
          <Button onClick={onPrint} variant="outline" className="w-full">
            <Printer className="h-4 w-4 mr-2" />
            Print Full
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
