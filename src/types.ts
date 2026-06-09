import { LucideIcon } from 'lucide-react';

export interface ModuleInfo {
  id: string;
  name: string;
  icon: LucideIcon;
  description: string;
  badge: string;
  detailedItems: string[];
}
