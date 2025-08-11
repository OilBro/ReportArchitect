import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { ClipboardCheck, Book, UserCircle } from "lucide-react";

interface AppHeaderProps {
  unitSet: string;
  onUnitSetChange: (value: string) => void;
  userName?: string;
}

export function AppHeader({ unitSet, onUnitSetChange, userName = "John Inspector" }: AppHeaderProps) {
  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <ClipboardCheck className="text-white text-sm h-4 w-4" />
              </div>
              <h1 className="text-xl font-semibold text-gray-900">API 653 Report Builder</h1>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <Select value={unitSet} onValueChange={onUnitSetChange}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Unit Set" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="US">US Units</SelectItem>
                <SelectItem value="Metric">Metric</SelectItem>
                <SelectItem value="Other">Other</SelectItem>
              </SelectContent>
            </Select>
            
            <Button variant="outline" size="sm" className="hidden sm:flex">
              <Book className="h-4 w-4 mr-2 text-primary" />
              Codes & Standards
            </Button>
            
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <UserCircle className="h-5 w-5" />
              <span>{userName}</span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
