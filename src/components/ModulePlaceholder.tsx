import React, { useState, useMemo, useRef, useEffect } from 'react';
import { 
  TrendingUp, 
  Coffee, 
  ClipboardList, 
  ClipboardCheck, 
  BarChart3, 
  Wallet, 
  Users, 
  MapPin, 
  Wrench, 
  User, 
  Clock, 
  DollarSign, 
  CheckCircle2, 
  Truck, 
  Calendar,
  AlertTriangle,
  ArrowRight,
  TrendingDown,
  Percent,
  Plus,
  Minus,
  Sliders,
  Shield,
  Activity,
  Layers,
  Sparkles,
  Search,
  Trash2,
  Lock,
  Edit,
  Eye,
  Download,
  Check,
  X,
  FileSpreadsheet,
  FileText,
  Filter,
  Settings,
  ArrowUpDown,
  ChevronUp,
  ChevronDown,
  Box,
  Package,
  Boxes,
  GlassWater,
  Archive,
  CupSoda,
  Milk,
  UserCheck,
  Key,
  Share2,
  Send,
  EyeOff,
  MessageSquare,
  Phone,
  Copy,
  ExternalLink,
  RefreshCw,
  Mail
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { supabase } from '../lib/supabase';

const PRODUCT_FIELDS = [
  { key: 'codigo', label: 'Código / Ref ID' },
  { key: 'nombre', label: 'Nombre del Producto' },
  { key: 'proveedor', label: 'Proveedor / Marca' },
  { key: 'precio_venta', label: 'Precio de Venta Pública' },
  { key: 'margen_pct', label: 'Margen de Ganancia %' },
  { key: 'piezas_por_caja', label: 'Piezas por Caja' },
  { key: 'precio_caja', label: 'Costo por Caja' },
  { key: 'precio_unidad', label: 'Costo Unitario' },
  { key: 'precio_sugerido', label: 'Precio Sugerido' },
  { key: 'margen_ps_pct', label: 'Margen Sugerido %' },
  { key: 'forma_pago', label: 'Forma de Pago' },
  { key: 'notas', label: 'Notas / Detalles' },
  { key: 'resorte_usa', label: 'Tamaño de resorte' }
];

const cleanHeader = (h: string) => {
  return h.toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // remove accents
    .replace(/[^a-z0-9]/g, "") // alphanumeric only
    .trim();
};

const cleanHeaders = (headersList: string[]): string[] => {
  if (!headersList) return [];
  
  // 1. Map headers: "Precio sin acuerdo" -> "Precio regular", remove other special/unwanted ones
  let mapped = headersList.map(h => {
    const norm = h.toLowerCase().trim().replace(/_/g, ' ').replace(/\./g, '');
    if (norm === 'precio sin acuerdo' || norm === 'precios sin acuerdo') {
      return 'Precio regular';
    }
    return h;
  });

  // 2. Filter out unwanted "columna 1", "columna 10", "Busc", "Busc.", "Buscar" columns, or "id", "ID", "Id"
  let filtered = mapped.filter(h => {
    const norm = h.toLowerCase().trim().replace(/_/g, ' ').replace(/\./g, '');
    if (norm === 'columna 1' || norm === 'columna 10' || norm === 'columna_1' || norm === 'columna_10' || norm === 'columna1' || norm === 'columna10') return false;
    if (norm === 'busc' || norm === 'buscar' || norm === 'busc.') return false;
    if (norm === 'id') return false;
    return true;
  });

  // 3. Ensure "Notas" is present and placed after "POR CANAL LLEVA" (or at the end if not found)
  const canalIdx = filtered.findIndex(h => {
    const norm = h.toLowerCase().trim().replace(/_/g, ' ');
    return norm === 'por canal lleva' || norm.includes('canal lleva') || norm === 'por canal';
  });

  const notasIdx = filtered.findIndex(h => h.toLowerCase().trim() === 'notas');

  if (notasIdx !== -1) {
    filtered.splice(notasIdx, 1);
  }

  const targetHeaderName = 'Notas';
  const newCanalIdx = filtered.findIndex(h => {
    const norm = h.toLowerCase().trim().replace(/_/g, ' ');
    return norm === 'por canal lleva' || norm.includes('canal lleva') || norm === 'por canal';
  });

  if (newCanalIdx !== -1) {
    filtered.splice(newCanalIdx + 1, 0, targetHeaderName);
  } else {
    filtered.push(targetHeaderName);
  }

  // 4. Ensure "Fecha" is present after "Notas" if no date header exists
  const hasFecha = filtered.some(h => {
    const norm = h.toLowerCase().trim().replace(/_/g, ' ');
    return norm.startsWith('fecha');
  });

  if (!hasFecha) {
    const currentNotasIdx = filtered.findIndex(h => h.toLowerCase().trim() === 'notas');
    if (currentNotasIdx !== -1) {
      filtered.splice(currentNotasIdx + 1, 0, 'Fecha');
    } else {
      filtered.push('Fecha');
    }
  }

  return filtered;
};

const filterEmptyColumnaHeaders = (headersList: string[], rows: any[]): string[] => {
  if (!headersList) return [];
  if (!rows || rows.length === 0) return headersList;

  return headersList.filter(header => {
    const isColumnaRegex = /^(columna|column)[\s_]*\d+$/i;
    if (isColumnaRegex.test(header.trim())) {
      // Check if any row has a non-empty value for this header.
      const hasValue = rows.some(row => {
        if (!row) return false;
        let val = undefined;
        if (row.values && row.values[header] !== undefined) {
          val = row.values[header];
        } else if (row[header] !== undefined) {
          val = row[header];
        } else {
          // Fallback case-insensitive look up
          const keys = Object.keys(row);
          const foundKey = keys.find(k => k.toLowerCase() === header.toLowerCase());
          if (foundKey) {
            val = row[foundKey];
          } else if (row.values) {
            const valKeys = Object.keys(row.values);
            const foundValKey = valKeys.find(k => k.toLowerCase() === header.toLowerCase());
            if (foundValKey) {
              val = row.values[foundValKey];
            }
          }
        }
        
        if (val === null || val === undefined) return false;
        return String(val).trim() !== '';
      });

      if (!hasValue) {
        return false;
      }
    }
    return true;
  });
};

interface ModulePlaceholderProps {
  moduleId: string;
  products?: any[];
  onAddProduct?: (product: any) => Promise<void>;
  onAddProducts?: (productsList: any[]) => Promise<void>;
  onUpdateProduct?: (id: string, product: any) => Promise<void>;
  onDeleteProduct?: (id: string) => Promise<void>;
  onUpdateProductStatusBulk?: (ids: string[], status: 'Activo' | 'Inactivo') => Promise<void>;
  currentUser?: any;
  isPreviewSurtidor?: boolean;
  usersList?: any[];
  onAddUserAccount?: (user: any) => Promise<boolean>;
  onUpdateUserAccount?: (username: string, user: any) => Promise<boolean>;
  onDeleteUserAccount?: (username: string) => Promise<boolean>;
}

export default function ModulePlaceholder({ 
  moduleId,
  products = [],
  onAddProduct,
  onAddProducts,
  onUpdateProduct,
  onDeleteProduct,
  onUpdateProductStatusBulk,
  currentUser,
  isPreviewSurtidor = false,
  usersList = [],
  onAddUserAccount,
  onUpdateUserAccount,
  onDeleteUserAccount
}: ModulePlaceholderProps) {
  const isSurtidorOnly = currentUser?.rol === 'Surtidor' || currentUser?.rol === 'Operador' || (currentUser?.rol === 'Administrador' && isPreviewSurtidor);
  // Safe parsing helper helper for any numeric content loaded via DB/Sync to eliminate any NaN issues
  const safeVal = (val: any): number => {
    if (val === null || val === undefined) return 0;
    const parsed = Number(val);
    return isNaN(parsed) ? 0 : parsed;
  };

  const formatMXN = (val: any): string => {
    const num = safeVal(val);
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(num);
  };

  const isActivoStatus = (status: any): boolean => {
    const s = String(status || '').trim().toLowerCase();
    return s === 'activo' || s === 'active' || s === 'habilitado' || s === 'true';
  };

  // Product module state declarations
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [pagoFilter, setPagoFilter] = useState('all');

  // Surtido / Abastecimiento custom state with refill metrics
  const [surtidoCards, setSurtidoCards] = useState([
    { id: 'cg1', name: 'CG1', alias: 'Empaque de Cartón Tipo 1', icon: 'Layers', stock: 150, maxStock: 500, category: 'Empaques', unit: 'pzas', fillCount: 3, totalFilledAmount: 450, lastFilledDate: 'Ayer 18:22', loadedProduct: 'Café Molido Premium' },
    { id: 'cg2', name: 'CG2', alias: 'Empaque de Cartón Tipo 2', icon: 'Package', stock: 85, maxStock: 400, category: 'Empaques', unit: 'pzas', fillCount: 1, totalFilledAmount: 120, lastFilledDate: 'Hace 2 horas', loadedProduct: 'Vasos Térmicos 12oz' },
    { id: 'cg3', name: 'CG3', alias: 'Empaque de Cartón Tipo 3', icon: 'Boxes', stock: 18, maxStock: 300, category: 'Empaques', unit: 'pzas', fillCount: 2, totalFilledAmount: 200, lastFilledDate: 'Hace 5 horas', loadedProduct: 'Vasos Plásticos 16oz' },
    { id: 'art2alt', name: 'ART2ALT', alias: 'Artículo Alternativo Doble', icon: 'Sparkles', stock: 110, maxStock: 250, category: 'Insumos', unit: 'pzas', fillCount: 0, totalFilledAmount: 0, lastFilledDate: 'Nunca', loadedProduct: 'Sin Producto' },
    { id: 'vitrobb', name: 'VitroBB', alias: 'Frasco Vidrio Bebidas', icon: 'GlassWater', stock: 320, maxStock: 600, category: 'Vidrio', unit: 'pzas', fillCount: 4, totalFilledAmount: 850, lastFilledDate: 'Ayer 15:30', loadedProduct: 'Botella de Vidrio 500ml' },
    { id: 'artpk', name: 'ARTPK', alias: 'Artículo Empaque Pack', icon: 'Archive', stock: 140, maxStock: 350, category: 'Empaques', unit: 'pzas', fillCount: 1, totalFilledAmount: 140, lastFilledDate: '15 Jun 2026', loadedProduct: 'Bolsas Kraft Medianas' },
    { id: 'cer1', name: 'CER1', alias: 'Cerámica Especializada 1', icon: 'Coffee', stock: 68, maxStock: 150, category: 'Vajilla', unit: 'pzas', fillCount: 2, totalFilledAmount: 180, lastFilledDate: '14 Jun 2026', loadedProduct: 'Taza Cerámica 8oz' },
    { id: 'cer2', name: 'CER2', alias: 'Cerámica Especializada 2', icon: 'CupSoda', stock: 14, maxStock: 120, category: 'Vajilla', unit: 'pzas', fillCount: 0, totalFilledAmount: 0, lastFilledDate: 'Nunca', loadedProduct: 'Sin Producto' },
    { id: 'cerbb', name: 'CERBB', alias: 'Cerámica Bebé Bebidas', icon: 'Milk', stock: 45, maxStock: 100, category: 'Vajilla', unit: 'pzas', fillCount: 1, totalFilledAmount: 45, lastFilledDate: '10 Jun 2026', loadedProduct: 'Taza Espresso Mini' },
    { id: 'cafe', name: 'CAFÉ', alias: 'Grano de Café Seleccionado', icon: 'Coffee', stock: 35, maxStock: 80, category: 'Materia Prima', unit: 'kgs', fillCount: 5, totalFilledAmount: 120, lastFilledDate: 'Hace 30 min', loadedProduct: 'Grano Espresso Veracruz' },
  ]);

  // Surtido interactive log history (simplified)

  const getSurtidoIcon = (iconName: string) => {
    switch (iconName) {
      case 'Layers': return <Layers className="w-5 h-5 text-[#043077]" />;
      case 'Package': return <Package className="w-5 h-5 text-emerald-600" />;
      case 'Boxes': return <Boxes className="w-5 h-5 text-indigo-600" />;
      case 'Sparkles': return <Sparkles className="w-5 h-5 text-amber-600" />;
      case 'GlassWater': return <GlassWater className="w-5 h-5 text-teal-600" />;
      case 'Archive': return <Archive className="w-5 h-5 text-blue-600" />;
      case 'Coffee': return <Coffee className="w-5 h-5 text-[#043077]" />;
      case 'CupSoda': return <CupSoda className="w-5 h-5 text-cyan-600" />;
      case 'Milk': return <Milk className="w-5 h-5 text-purple-600" />;
      default: return <Box className="w-5 h-5 text-slate-600" />;
    }
  };

  const [surtidoSearch, setSurtidoSearch] = useState('');

  // Refill Machine specific states
  const [activeRefillMachineId, setActiveRefillMachineId] = useState<string | null>(null);
  const [sessionRefills, setSessionRefills] = useState<{ id: string; name: string; codigo: string; price: number; amount: number }[]>([]);
  const [productCounts, setProductCounts] = useState<Record<string, number>>({});
  const [refillSearch, setRefillSearch] = useState('');
  const [selectedRefillProduct, setSelectedRefillProduct] = useState<any | null>(null);
  const [refillAmount, setRefillAmount] = useState<number>(1);

  // Pagination state (only 5 products per page)
  const [currentPage, setCurrentPage] = useState(1);
  const [supplyPage, setSupplyPage] = useState(1);

  // Scroll synchronizer refs
  const topScrollRef = useRef<HTMLDivElement>(null);
  const tableContainerRef = useRef<HTMLDivElement>(null);
  const [tableScrollWidth, setTableScrollWidth] = useState<number>(0);

  // Employees / Repartidores Module States
  const [empNombre, setEmpNombre] = useState('');
  const [empUsername, setEmpUsername] = useState('');
  const [empCorreo, setEmpCorreo] = useState('');
  const [empContrasena, setEmpContrasena] = useState('');
  const [empWhatsapp, setEmpWhatsapp] = useState('');
  const [empRol, setEmpRol] = useState<'Surtidor' | 'Administrador'>('Surtidor');
  const [editingEmpUsername, setEditingEmpUsername] = useState<string | null>(null);
  const [showEmpPassword, setShowEmpPassword] = useState(false);
  const [empSearch, setEmpSearch] = useState('');
  const [showSqlGuide, setShowSqlGuide] = useState(false);
  const [sqlCopied, setSqlCopied] = useState(false);
  const [empFormMessage, setEmpFormMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const generateSecurePassword = () => {
    const charsUpper = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
    const charsLower = 'abcdefghijkmnpqrstuvwxyz';
    const charsNum = '23456789';
    const charsSym = '!@#$%&*';

    let pass = 'Surt!';
    for (let i = 0; i < 2; i++) pass += charsUpper.charAt(Math.floor(Math.random() * charsUpper.length));
    for (let i = 0; i < 2; i++) pass += charsLower.charAt(Math.floor(Math.random() * charsLower.length));
    for (let i = 0; i < 2; i++) pass += charsNum.charAt(Math.floor(Math.random() * charsNum.length));
    pass += charsSym.charAt(Math.floor(Math.random() * charsSym.length));

    setEmpContrasena(pass);
    setShowEmpPassword(true);
  };

  const handleSaveEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    setEmpFormMessage(null);

    const cleanUser = empUsername.trim().toLowerCase().replace(/[^a-z0-9_]/g, '');
    if (!cleanUser) {
      setEmpFormMessage({ type: 'error', text: 'Por favor ingresa un nombre de usuario válido (sólo letras, números y _).' });
      return;
    }

    if (!empNombre.trim()) {
      setEmpFormMessage({ type: 'error', text: 'El nombre del empleado o repartidor es obligatorio.' });
      return;
    }

    if (!empContrasena.trim()) {
      setEmpFormMessage({ type: 'error', text: 'Ingresa una contraseña para el usuario.' });
      return;
    }

    const newUserObj = {
      username: cleanUser,
      nombre_completo: empNombre.trim(),
      correo: empCorreo.trim(),
      whatsapp: empWhatsapp.trim().replace(/[^0-9]/g, ''),
      rol: empRol,
      contrasena: empContrasena.trim(),
      creado_en: new Date().toISOString()
    };

    let ok = false;
    if (editingEmpUsername && onUpdateUserAccount) {
      ok = await onUpdateUserAccount(editingEmpUsername, newUserObj);
    } else if (onAddUserAccount) {
      ok = await onAddUserAccount(newUserObj);
    } else {
      ok = true;
    }

    if (ok) {
      setEmpFormMessage({ 
        type: 'success', 
        text: editingEmpUsername 
          ? `¡Empleado @${cleanUser} actualizado con éxito!`
          : `¡Empleado / Repartidor @${cleanUser} registrado con éxito!`
      });
      setEmpNombre('');
      setEmpUsername('');
      setEmpCorreo('');
      setEmpContrasena('');
      setEmpWhatsapp('');
      setEmpRol('Surtidor');
      setEditingEmpUsername(null);
    } else {
      setEmpFormMessage({ type: 'error', text: 'Ocurrió un error al guardar el empleado en el sistema.' });
    }
  };

  const handleEditEmployee = (emp: any) => {
    setEditingEmpUsername(emp.username);
    setEmpNombre(emp.nombre_completo || '');
    setEmpUsername(emp.username || '');
    setEmpCorreo(emp.correo || '');
    setEmpContrasena(emp.contrasena || '');
    setEmpWhatsapp(emp.whatsapp || '');
    setEmpRol(emp.rol === 'Administrador' ? 'Administrador' : 'Surtidor');
    setEmpFormMessage(null);
  };

  const handleDeleteEmployee = async (username: string) => {
    if (window.confirm(`¿Estás seguro de eliminar al empleado @${username}?`)) {
      if (onDeleteUserAccount) {
        await onDeleteUserAccount(username);
      }
    }
  };

  const handleShareWhatsApp = (emp: any) => {
    let cleanPhone = (emp.whatsapp || emp.correo || '').replace(/[^0-9]/g, '');
    if (cleanPhone.length === 10) {
      cleanPhone = '52' + cleanPhone;
    }

    const textMsg = `¡Hola *${emp.nombre_completo}*! 👋\n\nTus credenciales de acceso para Surtiantojo son:\n\n👤 *Usuario:* ${emp.username}\n🔑 *Contraseña:* ${emp.contrasena}\n💼 *Rol:* ${emp.rol}\n🌐 *Enlace de acceso:* https://surtiantojo.com.mx/\n\nPor favor ingresa para gestionar tu ruta de surtido. ¡Mucho éxito en tus entregas!`;

    const url = cleanPhone 
      ? `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodeURIComponent(textMsg)}`
      : `https://api.whatsapp.com/send?text=${encodeURIComponent(textMsg)}`;

    window.open(url, '_blank');
  };

  // Scroll synchronizer refs for Submenus
  const submenuTopScrollRef = useRef<HTMLDivElement>(null);
  const submenuTableContainerRef = useRef<HTMLDivElement>(null);
  const [submenuScrollWidth, setSubmenuScrollWidth] = useState<number>(0);

  // Sorting state (Excel-like)
  const [sortField, setSortField] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  // Sorting state for supply/surtido table
  const [supplySortField, setSupplySortField] = useState<string>('SEL');
  const [supplySortDirection, setSupplySortDirection] = useState<'asc' | 'desc'>('asc');

  // Multi-selection state
  const [selectedItems, setSelectedItems] = useState<Record<string, boolean>>({});

  // Modals active status
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any | null>(null);
  const [viewingItem, setViewingItem] = useState<any | null>(null);

  // --- SUBMENU GENERAL SURTIDO & EXCEL EXPORT SYSTEM STATES ---
  const sortSubmenus = (list: any[]) => {
    if (!list || !Array.isArray(list)) return [];
    const others = list.filter(item => item && item.id && item.id !== 'vending_surtido');
    // Deduplicate by ID to prevent duplication error
    const unique: any[] = [];
    const seen = new Set<string>();
    others.forEach(item => {
      if (!seen.has(item.id)) {
        seen.add(item.id);
        unique.push(item);
      }
    });
    unique.sort((a, b) => a.name.localeCompare(b.name, 'es', { sensitivity: 'base' }));
    return unique;
  };

  const [supplySubmenuList, setSupplySubmenuList] = useState<any[]>(() => {
    const defaultSubmenus = [
      // Botanas
      { id: 'art_alt', name: 'ART ALT', title: 'Reporte ART ALT', desc: 'Surtido de artículos alternos y complementarios.' },
      { id: 'art_ct', name: 'ART CT', title: 'Reporte ART CT', desc: 'Surtido de artículos de cafetería y complementarios de té.' },
      { id: 'art_prk', name: 'ART PRK', title: 'Reporte ART PRK', desc: 'Surtido de artículos de botanas y confitería PRK.' },
      { id: 'cer1', name: 'CER 1', title: 'Reporte CER 1', desc: 'Surtido de la máquina CER 1 para botanas.' },
      { id: 'cer2', name: 'CER 2', title: 'Reporte CER 2', desc: 'Surtido de la máquina CER 2 para botanas.' },
      { id: 'cer3', name: 'CER 3', title: 'Reporte CER 3', desc: 'Surtido de la máquina CER 3 para botanas y snacks.' },
      { id: 'cg1', name: 'CG 1', title: 'Reporte CG 1', desc: 'Surtido de la máquina CG 1 para botanas.' },
      { id: 'cg2', name: 'CG 2', title: 'Reporte CG 2', desc: 'Surtido de la máquina CG 2 para botanas.' },
      { id: 'cg3', name: 'CG 3', title: 'Reporte CG 3', desc: 'Surtido de la máquina CG 3 para botanas.' },
      // Bebidas
      { id: 'cer_bb', name: 'CER BB', title: 'Reporte CER BB', desc: 'Surtido de la máquina de bebidas CER BB.' },
      { id: 'cont_bb', name: 'CONT. BB', title: 'Reporte CONT. BB', desc: 'Surtido de la máquina de bebidas CONT. BB.' },
      { id: 'vitro_bb', name: 'VITRO BB', title: 'Reporte VITRO BB', desc: 'Surtido de la máquina de bebidas VITRO BB.' }
    ];

    try {
      const stored = localStorage.getItem('surtiantojo_submenu_list');
      const deletedStored = localStorage.getItem('surtiantojo_deleted_submenu_ids');
      const deletedIds = deletedStored ? JSON.parse(deletedStored) : [];

      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          // Merge parsed submenus and defaults, making sure all default ones exist and are not deleted
          const merged = [...parsed];
          defaultSubmenus.forEach(def => {
            if (!merged.some(item => item.id === def.id) && !deletedIds.includes(def.id)) {
              merged.push(def);
            }
          });
          return sortSubmenus(merged);
        }
      } else if (deletedIds.length > 0) {
        // If stored doesn't exist but we have deleted IDs, filter them from defaultSubmenus
        const activeDefaults = defaultSubmenus.filter(def => !deletedIds.includes(def.id));
        return sortSubmenus(activeDefaults);
      }
    } catch (e) {}
    return sortSubmenus(defaultSubmenus);
  });

  const getSubmenuGroup = (id: string, name: string): 'botana' | 'bebidas' | 'cafe' => {
    const found = supplySubmenuList?.find(s => s.id === id);
    if (found && (found.group || found.grupo)) {
      return found.group || found.grupo;
    }

    const lowerId = id.toLowerCase();
    const lowerName = (name || '').toLowerCase();
    
    if (
      lowerId.includes('cer_bb') || 
      lowerId.includes('cont_bb') || 
      lowerId.includes('vitro_bb') ||
      lowerName.includes('bebida') ||
      lowerName.includes('bb') ||
      lowerId.includes('bebida') ||
      lowerId.includes('bb')
    ) {
      return 'bebidas';
    }
    
    if (
      lowerId.includes('cafe') || 
      lowerName.includes('café') || 
      lowerName.includes('cafe')
    ) {
      return 'cafe';
    }
    
    return 'botana';
  };

  const [activeSupplySubmenu, setActiveSupplySubmenu] = useState<string>(() => {
    try {
      const storedActive = localStorage.getItem('surtiantojo_active_submenu');
      if (storedActive) {
        return storedActive;
      }
    } catch (e) {}
    return supplySubmenuList[0]?.id || 'art_alt';
  });

  const [activeCategory, setActiveCategory] = useState<'botana' | 'bebidas' | 'cafe'>(() => {
    return getSubmenuGroup(activeSupplySubmenu, '');
  });

  useEffect(() => {
    try {
      localStorage.setItem('surtiantojo_active_submenu', activeSupplySubmenu);
    } catch (e) {}
  }, [activeSupplySubmenu]);

  useEffect(() => {
    if (activeSupplySubmenu) {
      const activeMeta = supplySubmenuList.find(s => s.id === activeSupplySubmenu);
      const category = getSubmenuGroup(activeSupplySubmenu, activeMeta?.name || '');
      setActiveCategory(category);
    }
  }, [activeSupplySubmenu, supplySubmenuList]);

  const handleSelectCategory = (category: 'botana' | 'bebidas' | 'cafe') => {
    setActiveCategory(category);
    const categorySubmenus = supplySubmenuList.filter(s => getSubmenuGroup(s.id, s.name) === category);
    if (categorySubmenus.length > 0) {
      // Prioritize active selection if already in that category, otherwise choose first
      const currentActiveBelongs = getSubmenuGroup(activeSupplySubmenu, '') === category;
      if (!currentActiveBelongs) {
        setActiveSupplySubmenu(categorySubmenus[0].id);
      }
    }
  };

  const [isEditSubmenuOpen, setIsEditSubmenuOpen] = useState(false);
  const [editSubmenuId, setEditSubmenuId] = useState('');
  const [editSubmenuName, setEditSubmenuName] = useState('');
  const [editSubmenuTitle, setEditSubmenuTitle] = useState('');
  const [editSubmenuCliente, setEditSubmenuCliente] = useState('');
  const [editSubmenuDesc, setEditSubmenuDesc] = useState('');
  const [editSubmenuGroup, setEditSubmenuGroup] = useState<'botana' | 'bebidas' | 'cafe'>('botana');
  const [editSubmenuConvenio, setEditSubmenuConvenio] = useState<'SI' | 'NO'>('NO');

  useEffect(() => {
    try {
      localStorage.setItem('surtiantojo_submenu_list', JSON.stringify(supplySubmenuList));
    } catch (e) {}
  }, [supplySubmenuList]);

  const normalizeRowListWithResorte = (list: any[]) => {
    if (!Array.isArray(list)) return [];
    return list.map(item => {
      if (item && item.values && typeof item.values === 'object') {
        const updatedValues = { ...item.values };
        let changed = false;
        Object.keys(updatedValues).forEach(k => {
          const lowerK = k.toLowerCase().trim();
          if (lowerK === 'resor' || lowerK === 'resort') {
            updatedValues['Resorte'] = updatedValues[k];
            delete updatedValues[k];
            changed = true;
          }
        });
        if (changed) {
          return { ...item, values: updatedValues };
        }
      }
      return item;
    });
  };

  const normalizeGenericSubmenuWithResorte = (obj: Record<string, any[]>) => {
    if (!obj || typeof obj !== 'object') return {};
    const updatedObj = { ...obj };
    Object.keys(updatedObj).forEach(k => {
      if (Array.isArray(updatedObj[k])) {
        updatedObj[k] = normalizeRowListWithResorte(updatedObj[k]);
      }
    });
    return updatedObj;
  };

  const [cerBBData, setCerBBData] = useState<any[]>(() => {
    try {
      const stored = localStorage.getItem('surtiantojo_cer_bb');
      return stored ? normalizeRowListWithResorte(JSON.parse(stored)) : [];
    } catch (e) {
      return [];
    }
  });

  const [artAltData, setArtAltData] = useState<any[]>(() => {
    try {
      const stored = localStorage.getItem('surtiantojo_art_alt');
      return stored ? normalizeRowListWithResorte(JSON.parse(stored)) : [];
    } catch (e) {
      return [];
    }
  });

  const [artCtData, setArtCtData] = useState<any[]>(() => {
    try {
      const stored = localStorage.getItem('surtiantojo_art_ct');
      return stored ? normalizeRowListWithResorte(JSON.parse(stored)) : [];
    } catch (e) {
      return [];
    }
  });

  // Dynamic content list map for custom added ones!
  const [genericSubmenuData, setGenericSubmenuData] = useState<Record<string, Array<any>>>(() => {
    try {
      const stored = localStorage.getItem('surtiantojo_generic_submenu');
      return stored ? normalizeGenericSubmenuWithResorte(JSON.parse(stored)) : {};
    } catch (e) {
      return {};
    }
  });

  // Save submenu headers for dynamic CSV import
  const [submenuHeaders, setSubmenuHeaders] = useState<Record<string, string[]>>(() => {
    try {
      const stored = localStorage.getItem('surtiantojo_submenu_headers');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed && typeof parsed === 'object') {
          Object.keys(parsed).forEach(tabId => {
            if (Array.isArray(parsed[tabId])) {
              const filteredList = parsed[tabId].filter((h: string) => {
                if (typeof h !== 'string') return true;
                const norm = h.toLowerCase().trim().replace(/_/g, ' ');
                // Filter out leftover Fecha 2, Fecha 3... on initial start so initially only ONE Fecha is present
                if (norm.startsWith('fecha') && norm !== 'fecha') return false;
                return true;
              }).map((h: string) => {
                const norm = h.toLowerCase().trim();
                if (norm === 'resor' || norm === 'resort') return 'Resorte';
                return h;
              });
              parsed[tabId] = cleanHeaders(filteredList);
            }
          });
        }
        return parsed;
      }
      return {};
    } catch (e) {
      return {};
    }
  });

  // Values for adding dynamic row
  const [addRowValues, setAddRowValues] = useState<Record<string, string>>({});

  // Values for editing dynamic row
  const [editRowValues, setEditRowValues] = useState<Record<string, string>>({});

  // Machine Maintenance Bitácora state (1 card group per registered machine)
  const [machineMaintenance, setMachineMaintenance] = useState<Record<string, Array<{
    id: string;
    visitLabel: string;
    mon_inicial: string;
    mon_final: string;
    pruebas: string;
    ventas_externas: string;
    limpieza_interna: string;
    limpieza_externa: string;
    falla_equipo: string;
    monedero: string;
    billetero: string;
    base_resorte: string;
    otro: string;
    notas: string;
    repartidor?: string;
    elaboro: string;
  }>>>(() => {
    try {
      const stored = localStorage.getItem('surtiantojo_machine_maintenance');
      return stored ? JSON.parse(stored) : {};
    } catch (e) {
      return {};
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('surtiantojo_machine_maintenance', JSON.stringify(machineMaintenance));
    } catch (e) {}
  }, [machineMaintenance]);

  const currentUserName = currentUser?.nombre_completo || currentUser?.nombre || currentUser?.username || 'Repartidor';

  const getMachineVisits = (tabId: string) => {
    let visits: any[] = [];
    if (machineMaintenance[tabId] && machineMaintenance[tabId].length > 0) {
      visits = machineMaintenance[tabId];
    } else {
      // Default initial 4 visits per machine matching Image
      visits = [
        { id: 'v1', visitLabel: '$ 2,540', mon_inicial: '$ 679', mon_final: '$ 1,349', pruebas: 'no', ventas_externas: 'no', limpieza_interna: 'si', limpieza_externa: 'si', falla_equipo: 'no', monedero: 'no', billetero: 'no', base_resorte: 'no', otro: 'no', notas: 'no', repartidor: currentUserName, elaboro: 'FC' },
        { id: 'v2', visitLabel: '$ 2,540', mon_inicial: '$ 51', mon_final: '$ 1,040', pruebas: 'no', ventas_externas: 'no', limpieza_interna: 'si', limpieza_externa: 'si', falla_equipo: 'no', monedero: 'no', billetero: 'no', base_resorte: 'no', otro: 'no', notas: 'no', repartidor: currentUserName, elaboro: 'FC' },
        { id: 'v3', visitLabel: '$ 2,280', mon_inicial: '$ 202', mon_final: '$ 1,208', pruebas: 'no', ventas_externas: 'no', limpieza_interna: 'si', limpieza_externa: 'si', falla_equipo: 'no', monedero: 'no', billetero: 'no', base_resorte: 'no', otro: 'no', notas: 'no', repartidor: currentUserName, elaboro: 'FC' },
        { id: 'v4', visitLabel: '$ 2,280', mon_inicial: '$ 21', mon_final: '$ 1,260', pruebas: 'no', ventas_externas: 'no', limpieza_interna: 'si', limpieza_externa: 'si', falla_equipo: 'no', monedero: 'no', billetero: 'no', base_resorte: 'no', otro: 'no', notas: 'no', repartidor: currentUserName, elaboro: 'Fc' },
      ];
    }
    return visits.map(v => ({
      ...v,
      repartidor: v.repartidor || currentUserName
    }));
  };

  const handleAddMaintenanceVisit = (tabId: string) => {
    const current = getMachineVisits(tabId);
    const newVisNum = current.length + 1;
    const newVisit = {
      id: `v_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      visitLabel: `Visita ${newVisNum}`,
      mon_inicial: '$ 0',
      mon_final: '$ 0',
      pruebas: 'no',
      ventas_externas: 'no',
      limpieza_interna: 'si',
      limpieza_externa: 'si',
      falla_equipo: 'no',
      monedero: 'no',
      billetero: 'no',
      base_resorte: 'no',
      otro: 'no',
      notas: 'no',
      repartidor: currentUserName,
      elaboro: 'FC'
    };
    const updated = [...current, newVisit];
    setMachineMaintenance(prev => ({ ...prev, [tabId]: updated }));
  };

  const handleUpdateMaintenanceVisit = (tabId: string, index: number, field: string, value: string) => {
    const current = [...getMachineVisits(tabId)];
    if (current[index]) {
      current[index] = { ...current[index], [field]: value };
      setMachineMaintenance(prev => ({ ...prev, [tabId]: current }));
    }
  };

  const handleRemoveMaintenanceVisit = (tabId: string, index: number) => {
    const current = getMachineVisits(tabId);
    if (current.length <= 1) {
      alert('Debe conservar al menos una columna de visita en la bitácora.');
      return;
    }
    const updated = current.filter((_, idx) => idx !== index);
    setMachineMaintenance(prev => ({ ...prev, [tabId]: updated }));
  };

  // Dynamic Date Column Management (+)
  const handleAddFechaColumn = (customTabId?: string) => {
    const tabId = customTabId || activeSupplySubmenu;
    const currentHeaders = cleanHeaders(submenuHeaders[tabId] || []);
    
    // Find all existing date headers
    const dateHeaders = currentHeaders.filter(h => {
      const norm = h.toLowerCase().trim().replace(/_/g, ' ');
      return norm.startsWith('fecha');
    });

    let newHeaderName = 'Fecha';
    if (dateHeaders.length > 0) {
      let nextNum = dateHeaders.length + 1;
      while (currentHeaders.some(h => h.toLowerCase().trim() === `fecha ${nextNum}`)) {
        nextNum++;
      }
      newHeaderName = `Fecha ${nextNum}`;
    }

    // Insert newHeaderName right after the last date header, or after 'Notas'
    const newHeaders = [...currentHeaders];
    let lastIndex = -1;
    for (let i = newHeaders.length - 1; i >= 0; i--) {
      const norm = newHeaders[i].toLowerCase().trim().replace(/_/g, ' ');
      if (norm.startsWith('fecha') || norm === 'notas') {
        lastIndex = i;
        break;
      }
    }

    if (lastIndex !== -1) {
      newHeaders.splice(lastIndex + 1, 0, newHeaderName);
    } else {
      newHeaders.push(newHeaderName);
    }

    const cleaned = cleanHeaders(newHeaders);
    setSubmenuHeaders(prev => {
      const updated = { ...prev, [tabId]: cleaned };
      try {
        localStorage.setItem('surtiantojo_submenu_headers', JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });
    
    // Auto-save to Supabase
    let currentData: any[] = [];
    if (tabId === 'cer_bb') currentData = cerBBData;
    else if (tabId === 'art_alt') currentData = artAltData;
    else if (tabId === 'art_ct') currentData = artCtData;
    else currentData = genericSubmenuData[tabId] || [];
    saveToSupabase(tabId, currentData, cleaned);
  };

  const handleRemoveColumn = (headerToRemove: string, customTabId?: string) => {
    const tabId = customTabId || activeSupplySubmenu;
    const currentHeaders = cleanHeaders(submenuHeaders[tabId] || []);
    const filtered = currentHeaders.filter(h => h !== headerToRemove);
    
    setSubmenuHeaders(prev => {
      const updated = { ...prev, [tabId]: filtered };
      try {
        localStorage.setItem('surtiantojo_submenu_headers', JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });

    let currentData: any[] = [];
    if (tabId === 'cer_bb') currentData = cerBBData;
    else if (tabId === 'art_alt') currentData = artAltData;
    else if (tabId === 'art_ct') currentData = artCtData;
    else currentData = genericSubmenuData[tabId] || [];
    saveToSupabase(tabId, currentData, filtered);
  };

  // Sync state with localStorage
  useEffect(() => {
    try {
      localStorage.setItem('surtiantojo_cer_bb', JSON.stringify(cerBBData));
    } catch (e) {}
  }, [cerBBData]);

  useEffect(() => {
    try {
      localStorage.setItem('surtiantojo_art_alt', JSON.stringify(artAltData));
    } catch (e) {}
  }, [artAltData]);

  useEffect(() => {
    try {
      localStorage.setItem('surtiantojo_art_ct', JSON.stringify(artCtData));
    } catch (e) {}
  }, [artCtData]);

  useEffect(() => {
    try {
      localStorage.setItem('surtiantojo_generic_submenu', JSON.stringify(genericSubmenuData));
    } catch (e) {}
  }, [genericSubmenuData]);

  useEffect(() => {
    try {
      localStorage.setItem('surtiantojo_submenu_headers', JSON.stringify(submenuHeaders));
    } catch (e) {}
  }, [submenuHeaders]);

  // Save Surtido rows to Supabase table
  const saveToSupabase = async (tabId: string, rows: any[], customHeaders?: string[]) => {
    try {
      const tableName = `surtido_${tabId}`;
      let headers = cleanHeaders(customHeaders || submenuHeaders[tabId] || []);
      
      // If there are no custom headers yet, let's use the default ones
      if (headers.length === 0) {
        headers = ['codigo', 'nombre_producto', 'unidad_surtida', 'costo_surtido', 'precio_venta', 'proveedor'];
      }

      // We split the rows into those to update (valid DB id) and those to insert (no valid DB id)
      const mappedRowsToInsert: any[] = [];
      const mappedRowsToUpdate: any[] = [];

      rows.forEach(row => {
        const obj: any = {};
        let hasValidId = false;
        
        // Only include ID if it is a valid database ID (not a large JS timestamp from Date.now() / Math.random())
        if (row.id && typeof row.id === 'number' && row.id < 1000000000) {
          obj.id = row.id;
          hasValidId = true;
        }

        const originalCols = dbColumnNamesRef.current[tabId] || [];

        headers.forEach(header => {
          const matchedDbColName = originalCols.find(col => {
            const cleanCol = col.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]/g, "").trim();
            const cleanH = header.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]/g, "").trim();
            if ((cleanH === 'resorte' || cleanH === 'resor' || cleanH === 'resort') && (cleanCol === 'resorte' || cleanCol === 'resor' || cleanCol === 'resort')) {
              return true;
            }
            return cleanCol === cleanH || col.replace(/_/g, '') === cleanH;
          });

          const sqlColName = matchedDbColName || header.toLowerCase()
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .replace(/[^a-z0-9]/g, "_")
            .replace(/^_+|_+$/g, "")
            .trim();
          
          // Try to get rawVal from row.values, or directly from row
          let rawVal = '';
          if (row.values && row.values[header] !== undefined) {
            rawVal = row.values[header];
          } else {
            // Find property in row direct keys
            const propKeys = [
              sqlColName,
              header,
              header.toLowerCase(),
              header.toUpperCase()
            ];
            // Also fall back to common property names
            const cleanH = header.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]/g, "").trim();
            if (cleanH.includes('codigo') || cleanH.includes('code')) {
              propKeys.push('codigo', 'code');
            } else if (cleanH.includes('nombre') || cleanH.includes('name') || cleanH.includes('articulo') || cleanH.includes('producto')) {
              propKeys.push('nombre_producto', 'nombre', 'name', 'articulo', 'producto');
            } else if (cleanH.includes('unidad') || cleanH.includes('cant') || cleanH.includes('surtir') || cleanH.includes('unidades') || cleanH.includes('cantidad')) {
              propKeys.push('unidad_surtida', 'unidades', 'cantidad', 'cant', 'surtir');
            } else if (cleanH.includes('costo') || cleanH.includes('cost')) {
              propKeys.push('costo_surtido', 'costo', 'cost');
            } else if (cleanH.includes('precio') || cleanH.includes('vta') || cleanH.includes('venta') || cleanH.includes('price')) {
              propKeys.push('precio_venta', 'precio', 'vta', 'venta', 'price');
            } else if (cleanH.includes('proveedor') || cleanH.includes('prov') || cleanH.includes('brand') || cleanH.includes('marca')) {
              propKeys.push('proveedor', 'prov', 'brand', 'marca');
            } else if (cleanH === 'resor' || cleanH === 'resort' || cleanH === 'resorte') {
              propKeys.push('resorte', 'resor', 'resort');
            } else if (cleanH === 'notas') {
              propKeys.push('notas', 'nota', 'detalles');
            }

            const foundKey = propKeys.find(k => row[k] !== undefined);
            if (foundKey !== undefined) {
              rawVal = row[foundKey];
            }
          }

          const cleanH = header.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]/g, "").trim();
          const isNum = cleanH.includes('precio') || cleanH.includes('vta') || cleanH.includes('costo') || cleanH.includes('surtir') || cleanH.includes('unidades') || cleanH.includes('cantidad') || cleanH.includes('cabe') || cleanH.includes('canal');
          if (isNum) {
            const numStr = String(rawVal).replace(/[^0-9.-]/g, '');
            obj[sqlColName] = parseFloat(numStr) || 0;
          } else {
            obj[sqlColName] = rawVal;
          }
        });

        obj.fecha_registro = row.fecha_registro || new Date().toISOString().split('T')[0];
        
        if (hasValidId) {
          mappedRowsToUpdate.push(obj);
        } else {
          mappedRowsToInsert.push(obj);
        }
      });

      let combinedData: any[] = [];
      let insertErrGlobal: any = null;
      let updateErrGlobal: any = null;

      if (mappedRowsToUpdate.length > 0) {
        const { data: updateRes, error: updateErr } = await supabase
          .from(tableName)
          .upsert(mappedRowsToUpdate, { onConflict: 'id' })
          .select();
        
        if (updateErr) {
          console.log(`Supabase update notice for ${tableName}:`, updateErr.message);
          updateErrGlobal = updateErr;
        } else if (updateRes) {
          combinedData = [...combinedData, ...updateRes];
        }
      }

      if (mappedRowsToInsert.length > 0) {
        const { data: insertRes, error: insertErr } = await supabase
          .from(tableName)
          .insert(mappedRowsToInsert)
          .select();
        
        if (insertErr) {
          console.log(`Supabase insert notice for ${tableName}:`, insertErr.message);
          insertErrGlobal = insertErr;
        } else if (insertRes) {
          combinedData = [...combinedData, ...insertRes];
        }
      }

      // FALLBACK TO STANDARD SCHEMA IF THERE WAS AN ERROR (like missing columns in Supabase)
      if (insertErrGlobal || updateErrGlobal) {
        console.log(`Attempting fallback to standard schema for table ${tableName} due to column/insert errors...`);
        const standardRowsToInsert: any[] = [];
        const standardRowsToUpdate: any[] = [];

        rows.forEach(row => {
          const standardObj: any = {
            codigo: String(row.codigo || '').toUpperCase(),
            nombre_producto: String(row.nombre_producto || ''),
            unidad_surtida: parseFloat(row.unidad_surtida) || 0,
            costo_surtido: parseFloat(row.costo_surtido) || 0,
            precio_venta: parseFloat(row.precio_venta) || 0,
            proveedor: String(row.proveedor || 'Proveedor General'),
            fecha_registro: row.fecha_registro || new Date().toISOString().split('T')[0]
          };
          
          let hasValidId = false;
          if (row.id && typeof row.id === 'number' && row.id < 1000000000) {
            standardObj.id = row.id;
            hasValidId = true;
          }

          if (hasValidId) {
            standardRowsToUpdate.push(standardObj);
          } else {
            standardRowsToInsert.push(standardObj);
          }
        });

        let fallbackCombined: any[] = [];
        let fallbackSucceeded = true;
        let fallbackUpdateErrObj: any = null;
        let fallbackInsertErrObj: any = null;

        if (standardRowsToUpdate.length > 0) {
          const { data: fallbackUpdateRes, error: fallbackUpdateErr } = await supabase
            .from(tableName)
            .upsert(standardRowsToUpdate, { onConflict: 'id' })
            .select();
          
          if (fallbackUpdateErr) {
            console.error(`Fallback standard update failed for ${tableName}:`, fallbackUpdateErr.message);
            fallbackUpdateErrObj = fallbackUpdateErr;
            fallbackSucceeded = false;
          } else if (fallbackUpdateRes) {
            fallbackCombined = [...fallbackCombined, ...fallbackUpdateRes];
          }
        }

        if (standardRowsToInsert.length > 0 && fallbackSucceeded) {
          const { data: fallbackInsertRes, error: fallbackInsertErr } = await supabase
            .from(tableName)
            .insert(standardRowsToInsert)
            .select();
          
          if (fallbackInsertErr) {
            console.error(`Fallback standard insert failed for ${tableName}:`, fallbackInsertErr.message);
            fallbackInsertErrObj = fallbackInsertErr;
            fallbackSucceeded = false;
          } else if (fallbackInsertRes) {
            fallbackCombined = [...fallbackCombined, ...fallbackInsertRes];
          }
        }

        if (fallbackSucceeded && fallbackCombined.length > 0) {
          console.log(`Fallback to standard schema succeeded for ${tableName}!`);
          combinedData = fallbackCombined;
          setSupabaseError(null);
          setMissingTables(prev => prev.filter(t => t !== tableName));
          // Set headers to the standard columns since we had to fallback
          headers = ['codigo', 'nombre_producto', 'unidad_surtida', 'costo_surtido', 'precio_venta', 'proveedor'];
          setSubmenuHeaders(prev => ({
            ...prev,
            [tabId]: ['codigo', 'nombre_producto', 'unidad_surtida', 'costo_surtido', 'precio_venta', 'proveedor']
          }));
        } else {
          // Both original insert and fallback failed
          const primaryErr = insertErrGlobal || updateErrGlobal;
          const fallbackErr = fallbackInsertErrObj || fallbackUpdateErrObj;
          const errMsg = fallbackErr?.message || primaryErr?.message || 'Error desconocido';
          const errCode = fallbackErr?.code || primaryErr?.code || '';
          
          if (errCode === '42P01' || errMsg.toLowerCase().includes('does not exist')) {
            setSupabaseError(`No se pudo guardar: La tabla '${tableName}' no existe en tu base de datos de Supabase. Haz clic en el botón '⚡ SQL' de abajo, copia el script y ejecútalo en Supabase.`);
            setMissingTables(prev => prev.includes(tableName) ? prev : [...prev, tableName]);
          } else if (errMsg.toLowerCase().includes('column') && errMsg.toLowerCase().includes('does not exist')) {
            setSupabaseError(`No se pudo guardar: Columnas incompatibles con la base de datos (${errMsg}). Debes volver a generar y ejecutar el script '⚡ SQL' en tu panel de Supabase.`);
          } else {
            setSupabaseError(`No se pudo guardar en Supabase: ${errMsg}`);
          }
        }
      } else {
        // Clear error if save succeeded on first try
        setSupabaseError(null);
        setMissingTables(prev => prev.filter(t => t !== tableName));
      }

      if (combinedData.length > 0) {
        const cleanHeaderHelper = (h: string) => {
          return h.toLowerCase()
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .replace(/[^a-z0-9]/g, "")
            .trim();
        };

        const headersCleaned = headers.map(cleanHeaderHelper);

        let colCodigo = -1;
        let colNombre = -1;
        let colUnidades = -1;
        let colCosto = -1;
        let colPrecio = -1;
        let colProveedor = -1;
        let colResorte = -1;

        headersCleaned.forEach((h, idx) => {
          if (h === 'codigo' || h === 'sku' || h === 'codig' || h === 'code') colCodigo = idx;
          else if (h === 'producto' || h === 'nombre' || h === 'articulo') colNombre = idx;
          else if (h === 'surtir' || h === 'cantidad' || h === 'unidades' || h === 'cant') colUnidades = idx;
          else if (h === 'costo') colCosto = idx;
          else if (h === 'precio' || h === 'preciovta' || h === 'precioventa' || h === 'preciodeventa' || h === 'precio_vta' || h === 'precioregular') colPrecio = idx;
          else if (h === 'proveedor') colProveedor = idx;
          else if (h === 'resor' || h === 'resort' || h === 'resorte') colResorte = idx;
        });

        headersCleaned.forEach((h, idx) => {
          if (colCodigo === -1 && (h.includes('codigo') || h.includes('sku') || h.includes('codig') || h === 'ref' || h === 'code') && h !== 'prodcodigo') {
            colCodigo = idx;
          }
          if (colNombre === -1 && (h.includes('producto') || h.includes('nombre') || h.includes('articulo') || h === 'item' || h.includes('descripcion'))) {
            colNombre = idx;
          }
          if (colUnidades === -1 && (h.includes('surtir') || h.includes('surtid') || h.includes('cantidad') || h.includes('unidad') || h.includes('piezas') || h === 'cant' || h === 'qty')) {
            colUnidades = idx;
          }
          if (colCosto === -1 && (h.includes('costo') || h.includes('compra') || h.includes('adquisicion'))) {
            colCosto = idx;
          }
          if (colPrecio === -1 && (h.includes('precio') || h.includes('venta') || h === 'pv' || h === 'p_venta' || h.includes('vta'))) {
            colPrecio = idx;
          }
          if (colProveedor === -1 && (h.includes('proveedor') || h.includes('marca') || h.includes('distribuidor'))) {
            colProveedor = idx;
          }
          if (colResorte === -1 && (h.includes('resor') || h.includes('resort') || h.includes('resorte'))) {
            colResorte = idx;
          }
        });

        const originalCols = dbColumnNamesRef.current[tabId] || [];

        const updatedRows = combinedData.map((item: any) => {
          const rowValues: Record<string, string> = {};
          headers.forEach(h => {
            const matchedDbColName = originalCols.find(col => {
              const cleanCol = col.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]/g, "").trim();
              const cleanH = h.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]/g, "").trim();
              if ((cleanH === 'resorte' || cleanH === 'resor' || cleanH === 'resort') && (cleanCol === 'resorte' || cleanCol === 'resor' || cleanCol === 'resort')) {
                return true;
              }
              return cleanCol === cleanH || col.replace(/_/g, '') === cleanH;
            });

            const sqlColName = matchedDbColName || h.toLowerCase()
              .normalize("NFD")
              .replace(/[\u0300-\u036f]/g, "")
              .replace(/[^a-z0-9]/g, "_")
              .replace(/^_+|_+$/g, "")
              .trim();
            rowValues[h] = String(item[sqlColName] !== null && item[sqlColName] !== undefined ? item[sqlColName] : '');
          });

          const getColVal = (idx: number, fallback: any = '') => {
            if (idx === -1) return fallback;
            const h = headers[idx];
            
            const matchedDbColName = originalCols.find(col => {
              const cleanCol = col.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]/g, "").trim();
              const cleanH = h.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]/g, "").trim();
              if ((cleanH === 'resorte' || cleanH === 'resor' || cleanH === 'resort') && (cleanCol === 'resorte' || cleanCol === 'resor' || cleanCol === 'resort')) {
                return true;
              }
              return cleanCol === cleanH || col.replace(/_/g, '') === cleanH;
            });

            const sqlColName = matchedDbColName || h.toLowerCase()
              .normalize("NFD")
              .replace(/[\u0300-\u036f]/g, "")
              .replace(/[^a-z0-9]/g, "_")
              .replace(/^_+|_+$/g, "")
              .trim();
            return item[sqlColName] !== undefined && item[sqlColName] !== null ? item[sqlColName] : fallback;
          };

          const codigoVal = String(getColVal(colCodigo, '')).trim();
          const nombreVal = String(getColVal(colNombre, '')).trim();
          const unidadesVal = parseFloat(getColVal(colUnidades, 0)) || 0;
          const costoVal = parseFloat(getColVal(colCosto, 0)) || 0;
          const precioVal = parseFloat(getColVal(colPrecio, 0)) || 0;
          const provVal = String(getColVal(colProveedor, 'Proveedor General')).trim();
          const resorteVal = String(getColVal(colResorte, '')).trim();

          return {
            id: item.id,
            codigo: (codigoVal || `PROD-S-${item.id}`).toUpperCase(),
            nombre_producto: nombreVal || `Producto ${item.id}`,
            unidad_surtida: unidadesVal,
            costo_surtido: costoVal,
            precio_venta: precioVal,
            proveedor: provVal,
            resorte: resorteVal,
            fecha_registro: item.fecha_registro || new Date().toISOString().split('T')[0],
            values: rowValues
          };
        });

        // Safely set states without infinite looping
        if (tabId === 'cer_bb') setCerBBData(updatedRows);
        else if (tabId === 'art_alt') setArtAltData(updatedRows);
        else if (tabId === 'art_ct') setArtCtData(updatedRows);
        else {
          setGenericSubmenuData(prev => ({
            ...prev,
            [tabId]: updatedRows
          }));
        }
      }
    } catch (err) {
      console.error("Error in saveToSupabase:", err);
    }
  };

  // Helper to delete rows from Supabase table
  const deleteFromSupabase = async (tabId: string, rowIdOrIds: number | number[]) => {
    try {
      const tableName = `surtido_${tabId}`;
      const idsToDelete = Array.isArray(rowIdOrIds) ? rowIdOrIds : [rowIdOrIds];
      
      // Filter out invalid/temporary frontend IDs
      const validDbIds = idsToDelete.filter(id => typeof id === 'number' && id < 1000000000);
      if (validDbIds.length === 0) return;

      const { error } = await supabase.from(tableName).delete().in('id', validDbIds);
      if (error) {
        console.log(`Supabase delete info for ${tableName}:`, error.message);
      } else {
        console.log(`Supabase delete success for ${tableName} on IDs:`, validDbIds);
      }
    } catch (err) {
      console.error("Error in deleteFromSupabase:", err);
    }
  };

  // Helper to clear a whole Supabase table
  const clearTableInSupabase = async (tabId: string) => {
    try {
      const tableName = `surtido_${tabId}`;
      const { error } = await supabase.from(tableName).delete().neq('id', 0);
      if (error) {
        console.log(`Supabase clear info for ${tableName}:`, error.message);
      } else {
        console.log(`Supabase clear success for ${tableName}`);
      }
    } catch (err) {
      console.error("Error in clearTableInSupabase:", err);
    }
  };

  // Load Surtido records on mount from Supabase
  useEffect(() => {
    const loadFromSupabase = async () => {
      try {
        // Try to load custom submenus list from Supabase first
        let currentMenuList = [...supplySubmenuList];
        const { data: menuData, error: menuError } = await supabase.from('surtido_submenus').select('*');
        if (!menuError && menuData) {
          if (menuData.length > 0) {
            const loadedMenus = menuData.map((m: any) => ({
              id: m.id,
              name: m.name,
              title: m.title || `Reporte Surtido ${m.name}`,
              desc: m.description || `Administración, adición y exportación de surtidos para el acceso ${m.name}.`,
              convenio: m.convenio || 'NO',
              cliente: m.cliente || '',
              grupo: m.grupo || ''
            }));
            const sortedMerged = sortSubmenus(loadedMenus);
            setSupplySubmenuList(sortedMerged);
            currentMenuList = sortedMerged;
            localStorage.setItem('surtiantojo_submenu_list', JSON.stringify(sortedMerged));
          } else {
            // Supabase is empty, so let's populate it with the default submenus
            const defaultSubmenus = [
              { id: 'art_alt', name: 'ART ALT', title: 'Reporte ART ALT', desc: 'Surtido de artículos alternos y complementarios.', convenio: 'NO', cliente: '' },
              { id: 'art_ct', name: 'ART CT', title: 'Reporte ART CT', desc: 'Surtido de artículos de cafetería y complementarios de té.', convenio: 'NO', cliente: '' },
              { id: 'art_prk', name: 'ART PRK', title: 'Reporte ART PRK', desc: 'Surtido de artículos de botanas y confitería PRK.', convenio: 'NO', cliente: '' },
              { id: 'cer1', name: 'CER 1', title: 'Reporte CER 1', desc: 'Surtido de la máquina CER 1 para botanas.', convenio: 'NO', cliente: '' },
              { id: 'cer2', name: 'CER 2', title: 'Reporte CER 2', desc: 'Surtido de la máquina CER 2 para botanas.', convenio: 'NO', cliente: '' },
              { id: 'cer3', name: 'CER 3', title: 'Reporte CER 3', desc: 'Surtido de la máquina CER 3 para botanas y snacks.', convenio: 'NO', cliente: '' },
              { id: 'cg1', name: 'CG 1', title: 'Reporte CG 1', desc: 'Surtido de la máquina CG 1 para botanas.', convenio: 'NO', cliente: '' },
              { id: 'cg2', name: 'CG 2', title: 'Reporte CG 2', desc: 'Surtido de la máquina CG 2 para botanas.', convenio: 'NO', cliente: '' },
              { id: 'cg3', name: 'CG 3', title: 'Reporte CG 3', desc: 'Surtido de la máquina CG 3 para botanas.', convenio: 'NO', cliente: '' },
              { id: 'cer_bb', name: 'CER BB', title: 'Reporte CER BB', desc: 'Surtido de la máquina de bebidas CER BB.', convenio: 'NO', cliente: '' },
              { id: 'cont_bb', name: 'CONT. BB', title: 'Reporte CONT. BB', desc: 'Surtido de la máquina de bebidas CONT. BB.', convenio: 'NO', cliente: '' },
              { id: 'vitro_bb', name: 'VITRO BB', title: 'Reporte VITRO BB', desc: 'Surtido de la máquina de bebidas VITRO BB.', convenio: 'NO', cliente: '' }
            ];
            
            let deletedIds: string[] = [];
            try {
              const deletedStored = localStorage.getItem('surtiantojo_deleted_submenu_ids');
              deletedIds = deletedStored ? JSON.parse(deletedStored) : [];
            } catch (e) {}
            
            const activeDefaults = defaultSubmenus.filter(def => !deletedIds.includes(def.id));
            if (activeDefaults.length > 0) {
              const toInsert = activeDefaults.map(s => ({
                id: s.id,
                name: s.name,
                title: s.title,
                description: s.desc,
                convenio: s.convenio,
                cliente: s.cliente
              }));
              await supabase.from('surtido_submenus').insert(toInsert);
              const sortedMerged = sortSubmenus(activeDefaults);
              setSupplySubmenuList(sortedMerged);
              currentMenuList = sortedMerged;
              localStorage.setItem('surtiantojo_submenu_list', JSON.stringify(sortedMerged));
            }
          }
        }

        const submenus = currentMenuList.map(s => s.id).filter(id => id !== 'vending_surtido');
        const missingTablesList: string[] = [];

        for (const tabId of submenus) {
          const tableName = `surtido_${tabId}`;
          const { data, error } = await supabase.from(tableName).select('*');
          if (error) {
            console.log(`Supabase table lookup info for ${tableName}:`, error.message);
            if (error.code === '42P01' || error.message.toLowerCase().includes('does not exist')) {
              missingTablesList.push(tableName);
            }
          } else if (data && data.length > 0) {
            // Find columns excluding standard auto IDs
            let cols = Object.keys(data[0]).filter(k => k !== 'id' && k !== 'fecha_registro');
            
            // Filter out extra date columns (fecha_2, fecha_3, etc.) if they have no values in any row, so by default only 1 Fecha is displayed
            cols = cols.filter(col => {
              const normCol = col.toLowerCase().trim().replace(/_/g, ' ');
              if (normCol.startsWith('fecha') && normCol !== 'fecha') {
                const hasData = data.some((item: any) => item[col] !== null && item[col] !== undefined && String(item[col]).trim() !== '');
                return hasData;
              }
              return true;
            });

            dbColumnNamesRef.current[tabId] = cols;
            
            // Reconstruct original-looking headers and correct "resor" or "resort" to "Resorte"
            const headers = cols.map(c => {
              let name = c.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
              const lowerName = name.toLowerCase().trim();
              if (lowerName === 'resor' || lowerName === 'resort') {
                return 'Resorte';
              }
              return name;
            });
            
            const rows = data.map((item: any, rIndex: number) => {
              const rowValues: Record<string, string> = {};
              cols.forEach((col, idx) => {
                rowValues[headers[idx]] = String(item[col] !== null && item[col] !== undefined ? item[col] : '');
              });

              // Direct column mappings if present
              let matchedCodigo = item.codigo !== undefined ? String(item.codigo) : '';
              let matchedNombre = item.nombre_producto !== undefined ? String(item.nombre_producto) : '';
              let matchedUnidades = item.unidad_surtida !== undefined ? parseFloat(item.unidad_surtida) || 0 : 0;
              let matchedCosto = item.costo_surtido !== undefined ? parseFloat(item.costo_surtido) || 0 : 0;
              let matchedPrecio = item.precio_venta !== undefined ? parseFloat(item.precio_venta) || 0 : 0;
              let matchedProveedor = item.proveedor !== undefined ? String(item.proveedor) : '';
              let matchedResorte = item.resorte !== undefined ? String(item.resorte) : '';

              // If any of them are missing, try to parse via headers
              headers.forEach(h => {
                const cleanH = h.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]/g, "").trim();
                const val = rowValues[h] || '';
                
                if (!matchedCodigo && (cleanH.includes('codigo') || cleanH.includes('sku') || cleanH.includes('codig'))) {
                  matchedCodigo = val;
                }
                if (!matchedNombre && (cleanH.includes('nombre') || cleanH.includes('producto') || cleanH.includes('articulo'))) {
                  matchedNombre = val;
                }
                if (!matchedUnidades && (cleanH.includes('unidad') || cleanH.includes('surtir') || cleanH.includes('cantidad') || cleanH.includes('unidades'))) {
                  matchedUnidades = parseFloat(val) || 0;
                }
                if (!matchedCosto && (cleanH.includes('costo') || cleanH.includes('cost'))) {
                  matchedCosto = parseFloat(val) || 0;
                }
                if (!matchedPrecio && (cleanH.includes('precio') || cleanH.includes('venta') || cleanH.includes('vta') || cleanH.includes('price'))) {
                  matchedPrecio = parseFloat(val) || 0;
                }
                if (!matchedProveedor && (cleanH.includes('proveedor') || cleanH.includes('prov') || cleanH.includes('brand'))) {
                  matchedProveedor = val;
                }
                if (!matchedResorte && (cleanH === 'resor' || cleanH === 'resort' || cleanH === 'resorte')) {
                  matchedResorte = val;
                }
              });

              if (!matchedProveedor) {
                matchedProveedor = 'Proveedor General';
              }

              return {
                id: item.id || Date.now() + rIndex + Math.random(),
                codigo: (matchedCodigo || `PROD-S-${rIndex}`).toUpperCase(),
                nombre_producto: matchedNombre || `Producto ${rIndex}`,
                unidad_surtida: matchedUnidades,
                costo_surtido: matchedCosto,
                precio_venta: matchedPrecio,
                proveedor: matchedProveedor,
                resorte: matchedResorte,
                fecha_registro: item.fecha_registro || new Date().toISOString().split('T')[0],
                values: rowValues
              };
            });

            setSubmenuHeaders(prev => ({ ...prev, [tabId]: cleanHeaders(headers) }));
            if (tabId === 'cer_bb') setCerBBData(rows);
            else if (tabId === 'art_alt') setArtAltData(rows);
            else if (tabId === 'art_ct') setArtCtData(rows);
            else {
              setGenericSubmenuData(prev => ({
                ...prev,
                [tabId]: rows
              }));
            }
          }
        }

        if (missingTablesList.length > 0) {
          setMissingTables(missingTablesList);
          const displayNames = missingTablesList.map(t => {
            const shortId = t.replace('surtido_', '');
            const m = currentMenuList.find(s => s.id === shortId);
            return m ? m.name : shortId.toUpperCase();
          });
          setSupabaseError(`Las tablas de Supabase para las secciones (${displayNames.join(', ')}) no existen en tu base de datos de Supabase. Los registros importados se muestran de forma temporal, pero NO se guardarán permanentemente hasta que ejecutes el script SQL en tu consola de Supabase.`);
        }
      } catch (e) {
        console.log("Supabase tables note:", e);
      }
    };

    loadFromSupabase();
  }, []);

  // Form states for adding items
  const [addSupplyRowOpen, setAddSupplyRowOpen] = useState(false);
  const [rowCodigo, setRowCodigo] = useState('');
  const [rowNombre, setRowNombre] = useState('');
  const [rowUnidades, setRowUnidades] = useState(1);
  const [rowCosto, setRowCosto] = useState(0);
  const [rowPrecio, setRowPrecio] = useState(0);
  const [rowProveedor, setRowProveedor] = useState('');
  const [rowResorte, setRowResorte] = useState('');
  const [rowNotas, setRowNotas] = useState('');
  const [rowSeleccion, setRowSeleccion] = useState('');

  const dbColumnNamesRef = useRef<Record<string, string[]>>({});
  const isManualSelRef = useRef(false);

  // Helper to get next vending slot/selection automatically
  const getNextSeleccion = (rows: any[]): string => {
    let maxVal = 0;
    rows.forEach(r => {
      let valStr = '';
      if (r.values) {
        const selKey = Object.keys(r.values).find(k => k.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]/g, "").trim() === 'sel');
        if (selKey) {
          valStr = r.values[selKey];
        }
      }
      if (!valStr) {
        valStr = r.sel || r.seleccion || '';
      }
      const num = parseInt(valStr);
      if (!isNaN(num) && num > maxVal) {
        maxVal = num;
      }
    });
    if (maxVal === 0) {
      return '15'; // Default start value matching the user screenshot first row
    }
    return String(maxVal + 2); // Standard dual vending machine slot selection increment
  };

  const getAssignedSeleccionForProduct = (prodCode: string, prodNombre: string): string => {
    if (!prodCode && !prodNombre) return '';
    const allSubmenuRows: any[] = [];
    if (cerBBData) allSubmenuRows.push(...cerBBData);
    if (artAltData) allSubmenuRows.push(...artAltData);
    if (artCtData) allSubmenuRows.push(...artCtData);
    if (genericSubmenuData) {
      Object.values(genericSubmenuData).forEach((rows: any) => {
        if (Array.isArray(rows)) {
          allSubmenuRows.push(...rows);
        }
      });
    }

    // 1. Try to match by product code (exact, case-insensitive)
    if (prodCode) {
      const codeStr = prodCode.trim().toLowerCase();
      const match = allSubmenuRows.find(r => {
        if (String(r.codigo || '').trim().toLowerCase() === codeStr) return true;
        if (r.values) {
          return Object.entries(r.values).some(([k, v]) => {
            const ck = k.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]/g, "").trim();
            return (ck === 'codigo' || ck === 'sku' || ck === 'code') && String(v).trim().toLowerCase() === codeStr;
          });
        }
        return false;
      });

      if (match) {
        let selVal = '';
        if (match.values) {
          const selKey = Object.keys(match.values).find(k => {
            const ck = k.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]/g, "").trim();
            return ck === 'sel' || ck === 'seleccion' || ck === 'slot' || ck === 'seleccionnum';
          });
          if (selKey) selVal = String(match.values[selKey] || '').trim();
        }
        if (!selVal) {
          selVal = String(match.sel || match.seleccion || '').trim();
        }
        if (selVal) return selVal;
      }
    }

    // 2. Try to match by product name (case-insensitive loose or partial match)
    if (prodNombre) {
      const nameStr = prodNombre.trim().toLowerCase();
      const match = allSubmenuRows.find(r => {
        const rName = String(r.nombre_producto || '').trim().toLowerCase();
        if (rName === nameStr || rName.includes(nameStr) || nameStr.includes(rName)) return true;
        
        if (r.values) {
          return Object.entries(r.values).some(([k, v]) => {
            const ck = k.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]/g, "").trim();
            if (ck === 'producto' || ck === 'nombre' || ck === 'articulo') {
              const rvStr = String(v).trim().toLowerCase();
              return rvStr === nameStr || rvStr.includes(nameStr) || nameStr.includes(rvStr);
            }
            return false;
          });
        }
        return false;
      });

      if (match) {
        let selVal = '';
        if (match.values) {
          const selKey = Object.keys(match.values).find(k => {
            const ck = k.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]/g, "").trim();
            return ck === 'sel' || ck === 'seleccion' || ck === 'slot' || ck === 'seleccionnum';
          });
          if (selKey) selVal = String(match.values[selKey] || '').trim();
        }
        if (!selVal) {
          selVal = String(match.sel || match.seleccion || '').trim();
        }
        if (selVal) return selVal;
      }
    }

    // 3. Fallback to catalog products `resorte_usa` or other selection fields
    const catalogProd = products.find(p => {
      const pCode = String(p.codigo || '').toLowerCase().trim();
      const pNombre = String(p.nombre || '').toLowerCase().trim();
      const searchCode = prodCode.toLowerCase().trim();
      const searchNombre = prodNombre.toLowerCase().trim();

      if (searchCode && (pCode === searchCode || pCode.includes(searchCode) || searchCode.includes(pCode))) {
        return true;
      }
      if (searchNombre && (pNombre === searchNombre || pNombre.includes(searchNombre) || searchNombre.includes(pNombre))) {
        return true;
      }
      return false;
    });

    if (catalogProd) {
      const resValue = String(catalogProd.sel || catalogProd.seleccion || catalogProd.slot || catalogProd.resorte_usa || '').trim();
      if (resValue) {
        return resValue;
      }
    }

    return '';
  };

  const getSelAssociations = (): any[] => {
    const associations: Record<string, any> = {};

    const allRows: any[] = [];
    if (cerBBData) allRows.push(...cerBBData);
    if (artAltData) allRows.push(...artAltData);
    if (artCtData) allRows.push(...artCtData);
    if (genericSubmenuData) {
      Object.values(genericSubmenuData).forEach((rows: any) => {
        if (Array.isArray(rows)) {
          allRows.push(...rows);
        }
      });
    }

    allRows.forEach(r => {
      let selVal = '';
      if (r.values) {
        const selKey = Object.keys(r.values).find(k => k.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]/g, "").trim() === 'sel');
        if (selKey) {
          selVal = String(r.values[selKey] || '').trim();
        }
      }
      if (!selVal) {
        selVal = String(r.sel || r.seleccion || '').trim();
      }

      if (selVal && (r.codigo || r.nombre_producto)) {
        const catProd = products.find(p => 
          (r.codigo && String(p.codigo || '').toLowerCase() === r.codigo.toLowerCase()) ||
          (r.nombre_producto && String(p.nombre || '').toLowerCase() === r.nombre_producto.toLowerCase())
        );

        if (!associations[selVal]) {
          associations[selVal] = {
            sel: selVal,
            codigo: r.codigo || (catProd ? catProd.codigo : ''),
            nombre: r.nombre_producto || (catProd ? catProd.nombre : ''),
            productRef: catProd
          };
        }
      }
    });

    products.forEach(p => {
      if (p.resorte_usa) {
        const resVal = String(p.resorte_usa).trim();
        if (resVal && resVal.length < 10) {
          if (!associations[resVal]) {
            associations[resVal] = {
              sel: resVal,
              codigo: p.codigo || '',
              nombre: p.nombre || '',
              productRef: p
            };
          }
        }
      }
    });

    return Object.values(associations);
  };

  // Intelligent search suggestion states for adding items
  const [codigoSuggestions, setCodigoSuggestions] = useState<any[]>([]);
  const [nombreSuggestions, setNombreSuggestions] = useState<any[]>([]);
  const [selSuggestions, setSelSuggestions] = useState<any[]>([]);
  const [showCodigoSuggestions, setShowCodigoSuggestions] = useState(false);
  const [showNombreSuggestions, setShowNombreSuggestions] = useState(false);
  const [showSelSuggestions, setShowSelSuggestions] = useState(false);

  // Inline Row Editing states for spreadsheet table rows
  const [editingRowId, setEditingRowId] = useState<number | null>(null);
  const [editRowCodigo, setEditRowCodigo] = useState('');
  const [editRowNombre, setEditRowNombre] = useState('');
  const [editRowUnidades, setEditRowUnidades] = useState(0);
  const [editRowCosto, setEditRowCosto] = useState(0);
  const [editRowPrecio, setEditRowPrecio] = useState(0);
  const [editRowProveedor, setEditRowProveedor] = useState('');
  const [editRowResorte, setEditRowResorte] = useState('');
  const [editRowNotas, setEditRowNotas] = useState('');

  // Bulk deletion selection state
  const [selectedRowIds, setSelectedRowIds] = useState<number[]>([]);

  useEffect(() => {
    setSelectedRowIds([]);
    setShowCodigoSuggestions(false);
    setShowNombreSuggestions(false);
    setShowSelSuggestions(false);
  }, [activeSupplySubmenu]);

  // Click away listener to close intelligent search suggestions
  useEffect(() => {
    const handleClickAway = () => {
      setShowCodigoSuggestions(false);
      setShowNombreSuggestions(false);
      setShowSelSuggestions(false);
    };
    document.addEventListener('click', handleClickAway);
    return () => {
      document.removeEventListener('click', handleClickAway);
    };
  }, []);

  // Sync / Auto-calculate selection when form opens or active submenu/data changes
  useEffect(() => {
    if (addSupplyRowOpen) {
      isManualSelRef.current = false; // Reset manual flag on form open
      let data: any[] = [];
      if (activeSupplySubmenu === 'cer_bb') data = cerBBData;
      else if (activeSupplySubmenu === 'art_alt') data = artAltData;
      else if (activeSupplySubmenu === 'art_ct') data = artCtData;
      else data = genericSubmenuData[activeSupplySubmenu] || [];
      
      setRowSeleccion(getNextSeleccion(data));
    }
  }, [addSupplyRowOpen, activeSupplySubmenu, cerBBData, artAltData, artCtData, genericSubmenuData]);

  // Auto-fill Selección (SEL) field dynamically when the user types or selects a product code/name
  useEffect(() => {
    if (addSupplyRowOpen && !isManualSelRef.current && (rowCodigo.trim() || rowNombre.trim())) {
      const foundSel = getAssignedSeleccionForProduct(rowCodigo, rowNombre);
      if (foundSel) {
        setRowSeleccion(foundSel);
      }
    }
  }, [rowCodigo, rowNombre, addSupplyRowOpen]);

  // Form states for creating custom submenus
  const [addSubmenuOpen, setAddSubmenuOpen] = useState(false);
  const [newSubmenuName, setNewSubmenuName] = useState('');
  const [newSubmenuTitle, setNewSubmenuTitle] = useState('');
  const [newSubmenuCliente, setNewSubmenuCliente] = useState('');
  const [newSubmenuDesc, setNewSubmenuDesc] = useState('');
  const [newSubmenuGroup, setNewSubmenuGroup] = useState('botana');
  const [newSubmenuConvenio, setNewSubmenuConvenio] = useState<'SI' | 'NO'>('NO');

  // Excel/CSV Import state
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importSummary, setImportSummary] = useState<{
    items: any[];
    fileName: string;
    rawLines: string[][];
    headers: string[];
    delimiter: string;
    colMap: Record<string, number>;
    finalHeaderIdx: number;
  } | null>(null);
  const [isImportingProgress, setIsImportingProgress] = useState(false);
  const [submenuSearchQuery, setSubmenuSearchQuery] = useState('');
  const [showSQLSchema, setShowSQLSchema] = useState(false);
  const [supabaseError, setSupabaseError] = useState<string | null>(null);
  const [missingTables, setMissingTables] = useState<string[]>([]);
  const [copiedSQL, setCopiedSQL] = useState(false);
  const cleanNumberStr = (str: string): string => {
    if (!str) return '0';
    let clean = str.trim();
    
    // Remove currency characters, blank spaces, % signs or any garbage text
    clean = clean.replace(/[^0-9.,-]/g, '').trim();
    if (!clean) return '0';
    
    if (clean.includes(',') && !clean.includes('.')) {
      // e.g. "20,50" -> "20.50"
      clean = clean.replace(',', '.');
    } else if (clean.includes(',') && clean.includes('.')) {
      // e.g. "1,234.50" -> remove comma -> "1234.50"
      clean = clean.replace(/,/g, '');
    }
    return clean;
  };

  const parseNumber = (str: string): number => {
    const val = parseFloat(cleanNumberStr(str));
    return isNaN(val) ? 0 : val;
  };

  const processRowsWithMap = (
    scoredLines: string[][], 
    colMap: Record<string, number>, 
    finalHeaderIdx: number
  ) => {
    const parsedItems: any[] = [];
    
    for (let i = finalHeaderIdx + 1; i < scoredLines.length; i++) {
      const rowData = scoredLines[i];
      if (!rowData || rowData.length <= 1) continue; // Skip empty rows
      
      const getVal = (key: string, defaultVal: any = '') => {
        const idx = colMap[key];
        if (idx !== undefined && rowData[idx] !== undefined) {
          let rawVal = rowData[idx].trim();
          if (rawVal.startsWith('"') && rawVal.endsWith('"')) {
            rawVal = rawVal.substring(1, rawVal.length - 1).trim();
          }
          return rawVal;
        }
        return defaultVal;
      };

      const nombre = getVal('nombre');
      // Skip if product has no name or if it matches header word literally
      if (!nombre || nombre.toLowerCase() === 'producto' || nombre.toLowerCase() === 'nombre') {
        continue; 
      }

      const piezas_por_caja = parseNumber(getVal('piezas_por_caja') || '0');
      const precio_caja = parseNumber(getVal('precio_caja') || '0');
      const precio_venta = parseNumber(getVal('precio_venta') || '0');
      const margen_pct = parseNumber(getVal('margen_pct') || '0');
      
      // Back-calculate unit cost if absent but margin & sale price are present:
      let precio_unidad = parseNumber(getVal('precio_unidad') || '0');
      if (precio_unidad === 0 && precio_venta > 0 && margen_pct > 0) {
        precio_unidad = Number((precio_venta * (1 - (margen_pct / 100))).toFixed(2));
      } else if (precio_unidad === 0 && precio_caja > 0 && piezas_por_caja > 0) {
        precio_unidad = Number((precio_caja / piezas_por_caja).toFixed(2));
      } else if (precio_unidad === 0 && precio_venta > 0) {
        precio_unidad = precio_venta; // Fallback to avoid division or zero metrics
      }

      // Complete box cost from pieces * unit cost if empty
      let final_precio_caja = precio_caja;
      if (final_precio_caja === 0 && precio_unidad > 0 && piezas_por_caja > 0) {
        final_precio_caja = Number((precio_unidad * piezas_por_caja).toFixed(2));
      }
      
      let final_margen_pct = margen_pct;
      if (final_margen_pct === 0 && precio_venta > 0 && precio_unidad > 0) {
        final_margen_pct = Number((((precio_venta - precio_unidad) / precio_venta) * 100).toFixed(2));
      }

      const precio_sugerido = parseNumber(getVal('precio_sugerido') || '') || precio_venta;
      
      let margen_ps_pct = parseNumber(getVal('margen_ps_pct') || '0');
      if (margen_ps_pct === 0 && precio_sugerido > 0 && precio_unidad > 0) {
        margen_ps_pct = Number((((precio_sugerido - precio_unidad) / precio_sugerido) * 100).toFixed(2));
      }

      const itemForm = {
        codigo: getVal('codigo', `REF-${Math.floor(Math.random() * 90000) + 10000}`),
        nombre: nombre,
        proveedor: getVal('proveedor', 'Genérico'),
        piezas_por_caja: piezas_por_caja,
        precio_caja: final_precio_caja,
        precio_unidad: precio_unidad,
        status: getVal('status', 'Activo'),
        forma_pago: getVal('forma_pago', 'Efectivo'),
        precio_venta: precio_venta,
        margen_pct: final_margen_pct,
        precio_sugerido: precio_sugerido,
        margen_ps_pct: margen_ps_pct,
        cambio_precio_fecha: getVal('cambio_precio_fecha', new Date().toISOString().split('T')[0]),
        notas: getVal('notas', ''),
        resorte_usa: getVal('resorte_usa', ''),
        filtro_especial: '',
        existencias: 0
      };

      parsedItems.push(itemForm);
    }
    return parsedItems;
  };

  const handleMapChange = (fieldKey: string, colIdx: number) => {
    if (!importSummary) return;
    
    const nextColMap = { ...importSummary.colMap };
    if (colIdx === -1) {
      delete nextColMap[fieldKey];
    } else {
      nextColMap[fieldKey] = colIdx;
    }
    
    // Re-process raw rows with updated map
    const nextItems = processRowsWithMap(
      importSummary.rawLines,
      nextColMap,
      importSummary.finalHeaderIdx
    );
    
    setImportSummary({
      ...importSummary,
      colMap: nextColMap,
      items: nextItems
    });
  };

  // Parse custom CSV format with automatic Excel-friendly detection, header scoring & margin reconstruction
  const handleImportCSV = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        if (!text) return;

        // 1. Detect delimiter (comma, semicolon or tab) neglecting inside quotes
        const detectDelimiter = (textStr: string): string => {
          let countComma = 0;
          let countSemi = 0;
          let countTab = 0;
          let inQuotes = false;
          const sample = textStr.slice(0, 2000);
          for (let i = 0; i < sample.length; i++) {
            const char = sample[i];
            if (char === '"') {
              inQuotes = !inQuotes;
            } else if (!inQuotes) {
              if (char === ',') countComma++;
              else if (char === ';') countSemi++;
              else if (char === '\t') countTab++;
            }
          }
          if (countSemi > countComma && countSemi > countTab) return ';';
          if (countTab > countComma && countTab > countSemi) return '\t';
          return ',';
        };
        
        const delimiter = detectDelimiter(text);

        // 2. CSV parser with dynamic delimiter & quote awareness (supporting newlines inside quotes!)
        const parseCSVToRowsAndCols = (textStr: string, delim: string): string[][] => {
          const result: string[][] = [];
          let currentRow: string[] = [];
          let currentVal = '';
          let inQuotes = false;
          
          for (let i = 0; i < textStr.length; i++) {
            const char = textStr[i];
            const nextChar = textStr[i + 1];
            
            if (char === '"') {
              if (inQuotes && nextChar === '"') {
                currentVal += '"';
                i++; // skip next escaped quote
              } else {
                inQuotes = !inQuotes;
              }
            } else if (char === delim && !inQuotes) {
              currentRow.push(currentVal.trim());
              currentVal = '';
            } else if ((char === '\r' || char === '\n') && !inQuotes) {
              // Handle CRLF or LF
              if (char === '\r' && nextChar === '\n') {
                i++;
              }
              currentRow.push(currentVal.trim());
              // Skip entirely empty parsed lines
              if (currentRow.length > 1 || (currentRow.length === 1 && currentRow[0] !== '')) {
                result.push(currentRow);
              }
              currentRow = [];
              currentVal = '';
            } else {
              currentVal += char;
            }
          }
          if (currentVal !== '' || currentRow.length > 0) {
            currentRow.push(currentVal.trim());
            if (currentRow.length > 1 || (currentRow.length === 1 && currentRow[0] !== '')) {
              result.push(currentRow);
            }
          }
          return result;
        };

        const scoredLines = parseCSVToRowsAndCols(text, delimiter);
        if (scoredLines.length < 2) {
          alert('El archivo no contiene suficientes registros o está vacío.');
          return;
        }

        const cleanHeader = (h: string) => {
          return h.toLowerCase()
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "") // remove accents
            .replace(/[^a-z0-9]/g, "") // remove symbols, spaces, newlines
            .trim();
        };

        // 3. Score first 15 lines to find where the actual header is (since Excel sheets can have notes/instructions at the top)
        let headerIdx = -1;
        let maxScore = -1;
        
        const headerKeywordsSearch = [
          'codigo', 'producto', 'nombre', 'venta', 'margen', 'sugerido', 'pago', 'notas', 'resorte'
        ];
        
        for (let i = 0; i < Math.min(scoredLines.length, 15); i++) {
          const parsedCols = scoredLines[i];
          let score = 0;
          for (const col of parsedCols) {
            const cleanCol = cleanHeader(col);
            for (const keyword of headerKeywordsSearch) {
              if (cleanCol.includes(keyword)) {
                score++;
                break;
              }
            }
          }
          if (score > maxScore && score >= 2) {
            maxScore = score;
            headerIdx = i;
          }
        }
        
        const finalHeaderIdx = headerIdx !== -1 ? headerIdx : 0;
        const rawHeaders = scoredLines[finalHeaderIdx];
        const headers = rawHeaders.map(cleanHeader);

        // Find match in column mapping index with a smart multi-pass algorithm
        const colMap: Record<string, number> = {};
        const headerKeywords: Record<string, string[]> = {
          codigo: ['codigo', 'codigo', 'cod', 'barcode', 'barras', 'ref', 'sku', 'id', 'code', 'idprod', 'codigobarras', 'codigos'],
          nombre: ['nombre', 'nombredelproducto', 'producto', 'name', 'item', 'descripcionproducto'],
          proveedor: ['proveedor', 'proveedores', 'provider', 'marca', 'brand', 'fabricante', 'distribuidor'],
          piezas_por_caja: ['piezasporcaja', 'pzascaja', 'piezas', 'piezas_por_caja', 'unidadesporcaja', 'pzasporcaja', 'pzas', 'caja_piezas'],
          precio_caja: ['preciocaja', 'precio_caja', 'costocaja', 'costo_caja', 'preciodebox', 'costo_por_caja'],
          precio_unidad: ['preciounitario', 'preciounidad', 'costounitario', 'precio_unidad', 'precio_unitario', 'costo_unitario'],
          precio_venta: ['precioventa', 'precio_venta', 'venta', 'precioalpublico', 'precio_de_venta'],
          margen_pct: ['margenpct', 'margen', 'margengana', 'margendeganancia', 'margen_ganancia'],
          precio_sugerido: ['preciosugerido', 'sugerido', 'precio_sugerido', 'precio_recom', 'sugerido_precio'],
          margen_ps_pct: ['margenpspct', 'margenps', 'margenpass', 'margen_ps_pct', 'margen_sugerido'],
          forma_pago: ['formadepago', 'formapago', 'metododepago', 'pago', 'forma_de_pago'],
          status: ['status', 'estado', 'disponible', 'habilitado'],
          notas: ['notas', 'descripcion', 'detalles', 'comentarios', 'observaciones'],
          resorte_usa: ['resorte', 'resorteusa', 'resortedeuso', 'resortedeusocafetera', 'resortedeusocafeteranotas', 'resorte_usa', 'resortequeusa', 'resortes'],
          cambio_precio_fecha: ['cambiodeprecio', 'cambiodepreciofecha', 'fechadecambio', 'cambioprecio']
        };

        // Pass 1: Exact matches or direct includes
        headers.forEach((h, idx) => {
          for (const [key, list] of Object.entries(headerKeywords)) {
            if (colMap[key] === undefined) {
              if (h === key || list.includes(h)) {
                colMap[key] = idx;
              }
            }
          }
        });

        // Pass 2: Fuzzy keyword matches
        headers.forEach((h, idx) => {
          for (const [key, list] of Object.entries(headerKeywords)) {
            if (colMap[key] === undefined) {
              const matchedKey = h.indexOf(key) !== -1 || list.some(k => h.indexOf(k) !== -1 || k.indexOf(h) !== -1);
              if (matchedKey) {
                colMap[key] = idx;
              }
            }
          }
        });

        // Pass 3: Smart fallbacks for crucial fields
        if (colMap['codigo'] === undefined && headers.length > 0) {
          // Look for any header that sounds like code
          const foundIdx = headers.findIndex(h => h.includes('cod') || h.includes('id') || h.includes('ref') || h.includes('sku') || h.includes('code'));
          if (foundIdx !== -1) {
            colMap['codigo'] = foundIdx;
          } else if (colMap['nombre'] !== 0) {
            // Default to first column if it's not the product name
            colMap['codigo'] = 0;
          }
        }

        const initialItems = processRowsWithMap(scoredLines, colMap, finalHeaderIdx);

        if (initialItems.length === 0) {
          alert('No se pudieron leer registros válidos del archivo. Asegúrate de que las columnas tengan nombres compatibles.');
          return;
        }

        setImportSummary({
          items: initialItems,
          fileName: file.name,
          rawLines: scoredLines,
          headers: rawHeaders,
          delimiter,
          colMap,
          finalHeaderIdx
        });

      } catch (err) {
        console.error("CSV parse error", err);
        alert('Error al analizar el archivo CSV.');
      }
    };

    reader.readAsText(file, "UTF-8"); // Direct UTF-8 loading
    e.target.value = '';
  };

  const handleConfirmImport = async () => {
    if (!importSummary) return;
    setIsImportingProgress(true);
    try {
      if (onAddProducts) {
        await onAddProducts(importSummary.items);
      } else if (onAddProduct) {
        for (const item of importSummary.items) {
          await onAddProduct(item);
        }
      }
      setImportSummary(null);
    } catch (err) {
      console.error(err);
      alert('Hubo un error al guardar los productos importados.');
    } finally {
      setIsImportingProgress(false);
    }
  };

  const handleImportSubmenuCSV = (e: React.ChangeEvent<HTMLInputElement>, tabId: string) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        if (!text) return;

        // Detect delimiter (semicolon for Spanish locales, comma for US, or tab)
        let delimiter = ',';
        let countComma = 0;
        let countSemi = 0;
        let countTab = 0;
        let inQuotes = false;
        const sample = text.slice(0, 2000);
        for (let i = 0; i < sample.length; i++) {
          const char = sample[i];
          if (char === '"') inQuotes = !inQuotes;
          else if (!inQuotes) {
            if (char === ',') countComma++;
            else if (char === ';') countSemi++;
            else if (char === '\t') countTab++;
          }
        }
        if (countSemi > countComma && countSemi > countTab) delimiter = ';';
        else if (countTab > countComma && countTab > countSemi) delimiter = '\t';

        // Custom parser supporting escaped quotes and line breaks
        const lines: string[][] = [];
        let currentRow: string[] = [];
        let currentVal = '';
        inQuotes = false;
        for (let i = 0; i < text.length; i++) {
          const char = text[i];
          const nextChar = text[i + 1];
          if (char === '"') {
            if (inQuotes && nextChar === '"') {
              currentVal += '"';
              i++;
            } else {
              inQuotes = !inQuotes;
            }
          } else if (char === delimiter && !inQuotes) {
            currentRow.push(currentVal.trim());
            currentVal = '';
          } else if ((char === '\r' || char === '\n') && !inQuotes) {
            if (char === '\r' && nextChar === '\n') i++;
            currentRow.push(currentVal.trim());
            if (currentRow.length > 1 || (currentRow.length === 1 && currentRow[0] !== '')) {
              lines.push(currentRow);
            }
            currentRow = [];
            currentVal = '';
          } else {
            currentVal += char;
          }
        }
        if (currentVal !== '' || currentRow.length > 0) {
          currentRow.push(currentVal.trim());
          if (currentRow.length > 1 || (currentRow.length === 1 && currentRow[0] !== '')) {
            lines.push(currentRow);
          }
        }

        if (lines.length < 2) {
          alert('El archivo no contiene suficientes registros o está vacío.');
          return;
        }

        // Normalize cleaner for column header scoring
        const cleanHeader = (h: string) => {
          return h.toLowerCase()
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "") // remove accents
            .replace(/[^a-z0-9]/g, "") // alphanumeric only
            .trim();
        };

        // Score first 15 lines to identify where headers reside
        let headerIdx = 0;
        let maxScore = -1;
        const targetKeywords = ['codigo', 'producto', 'nombre', 'unidades', 'cantidad', 'costo', 'precio', 'proveedor', 'fecha', 'surtir', 'vta'];
        
        for (let i = 0; i < Math.min(lines.length, 15); i++) {
          let score = 0;
          for (const col of lines[i]) {
            const val = cleanHeader(col);
            if (targetKeywords.some(k => val.includes(k))) score++;
          }
          if (score > maxScore && score >= 2) {
            maxScore = score;
            headerIdx = i;
          }
        }

        let detectedSupplier = 'Proveedor General';
        // Try to scan rows above headers to find a descriptive supplier/section name (e.g. "Bebidas Cerealto")
        for (let i = headerIdx - 1; i >= 0; i--) {
          const lObj = lines[i];
          if (lObj) {
            const possibleNames = lObj.filter(cell => cell && cell.trim() && cell.trim().length > 3 && !cell.includes('/') && !cell.includes('-'));
            if (possibleNames.length > 0) {
              const matchedWord = possibleNames.find(word => !/^[0-9]/.test(word) && word.toLowerCase() !== 'ok');
              if (matchedWord) {
                detectedSupplier = matchedWord.trim();
                break;
              }
            }
          }
        }

        const rawHeaders = lines[headerIdx];
        const originalHeaders = rawHeaders.map((h, i) => h.trim() || `Columna_${i + 1}`);
        const headersCleaned = rawHeaders.map(cleanHeader);

        let colCodigo = -1;
        let colNombre = -1;
        let colUnidades = -1;
        let colCosto = -1;
        let colPrecio = -1;
        let colProveedor = -1;
        let colFecha = -1;

        // 1st Priority: Exact / Close matches
        headersCleaned.forEach((h, idx) => {
          if (h === 'codigo' || h === 'sku' || h === 'codig' || h === 'code') colCodigo = idx;
          else if (h === 'producto' || h === 'nombre' || h === 'articulo') colNombre = idx;
          else if (h === 'surtir' || h === 'cantidad' || h === 'unidades' || h === 'cant') colUnidades = idx;
          else if (h === 'costo') colCosto = idx;
          else if (h === 'precio' || h === 'preciovta' || h === 'precioventa' || h === 'preciodeventa' || h === 'precio_vta' || h === 'precioregular') colPrecio = idx;
          else if (h === 'proveedor') colProveedor = idx;
          else if (h === 'fecha' || h === 'fechasurtido') colFecha = idx;
        });

        // 2nd Priority: Partial match fallback
        headersCleaned.forEach((h, idx) => {
          if (colCodigo === -1 && (h.includes('codigo') || h.includes('sku') || h.includes('codig') || h === 'ref' || h === 'code') && h !== 'prodcodigo') {
            colCodigo = idx;
          }
          if (colNombre === -1 && (h.includes('producto') || h.includes('nombre') || h.includes('articulo') || h === 'item' || h.includes('descripcion'))) {
            colNombre = idx;
          }
          if (colUnidades === -1 && (h.includes('surtir') || h.includes('surtid') || h.includes('cantidad') || h.includes('unidad') || h.includes('piezas') || h === 'cant' || h === 'qty')) {
            colUnidades = idx;
          }
          if (colCosto === -1 && (h.includes('costo') || h.includes('compra') || h.includes('adquisicion'))) {
            colCosto = idx;
          }
          if (colPrecio === -1 && (h.includes('precio') || h.includes('venta') || h === 'pv' || h === 'p_venta' || h.includes('vta'))) {
            colPrecio = idx;
          }
          if (colProveedor === -1 && (h.includes('proveedor') || h.includes('marca') || h.includes('distribuidor'))) {
            colProveedor = idx;
          }
          if (colFecha === -1 && (h.includes('fecha') || h.includes('registro'))) {
            colFecha = idx;
          }
        });

        // Build list of mapped indices to prevent overlap in fallback
        const occupied = new Set<number>();
        if (colCodigo !== -1) occupied.add(colCodigo);
        if (colNombre !== -1) occupied.add(colNombre);
        if (colUnidades !== -1) occupied.add(colUnidades);
        if (colCosto !== -1) occupied.add(colCosto);
        if (colPrecio !== -1) occupied.add(colPrecio);
        if (colProveedor !== -1) occupied.add(colProveedor);
        if (colFecha !== -1) occupied.add(colFecha);

        const findNextUnoccupied = (start: number): number => {
          let curr = start;
          while (curr < headersCleaned.length) {
            if (!occupied.has(curr) && headersCleaned[curr] !== '') {
              return curr;
            }
            curr++;
          }
          return -1;
        };

        // Highly safe position fallback for unmapped keys (ensuring NO overlap)
        if (colCodigo === -1) {
          const idx = findNextUnoccupied(0);
          if (idx !== -1) { colCodigo = idx; occupied.add(idx); }
        }
        if (colNombre === -1) {
          const idx = findNextUnoccupied(0);
          if (idx !== -1) { colNombre = idx; occupied.add(idx); }
        }
        if (colUnidades === -1) {
          const idx = findNextUnoccupied(0);
          if (idx !== -1) { colUnidades = idx; occupied.add(idx); }
        }

        const parsedRows: any[] = [];
        for (let r = headerIdx + 1; r < lines.length; r++) {
          const row = lines[r];
          if (!row || row.length === 0) continue;
          // Skip completely empty rows
          if (row.every(cell => !cell || cell.trim() === '')) continue;

          // Robust float parser
          const cleanNumVal = (str: string): number => {
            if (!str) return 0;
            const cleaned = str.replace(/[^0-9.,-]/g, '').trim();
            if (!cleaned) return 0;
            if (cleaned.includes(',') && !cleaned.includes('.')) {
              return parseFloat(cleaned.replace(',', '.')) || 0;
            }
            if (cleaned.includes(',') && cleaned.includes('.')) {
              return parseFloat(cleaned.replace(/,/g, '')) || 0;
            }
            return parseFloat(cleaned) || 0;
          };

          const codigoStr = colCodigo !== -1 && row[colCodigo] ? row[colCodigo].trim().toUpperCase() : `PROD-S-${r}`;
          const nombreStr = colNombre !== -1 && row[colNombre] ? row[colNombre].trim() : `Producto Importado ${r}`;
          const unidadesVal = colUnidades !== -1 && row[colUnidades] ? cleanNumVal(row[colUnidades]) : 0;
          const costoVal = colCosto !== -1 && row[colCosto] ? cleanNumVal(row[colCosto]) : 0;
          const precioVal = colPrecio !== -1 && row[colPrecio] ? cleanNumVal(row[colPrecio]) : 0;
          const provStr = colProveedor !== -1 && row[colProveedor] ? row[colProveedor].trim() : detectedSupplier;
          
          let dateStr = new Date().toISOString().split('T')[0];
          if (colFecha !== -1 && row[colFecha]) {
            const d = new Date(row[colFecha].trim());
            if (!isNaN(d.getTime())) {
              dateStr = d.toISOString().split('T')[0];
            }
          }

          // Map original dynamic columns
          const rowValues: Record<string, string> = {};
          originalHeaders.forEach((headerName, idx) => {
            rowValues[headerName] = row[idx] !== undefined ? row[idx].trim() : '';
          });

          parsedRows.push({
            id: Date.now() + r + Math.random(),
            codigo: codigoStr,
            nombre_producto: nombreStr,
            unidad_surtida: unidadesVal,
            costo_surtido: costoVal,
            precio_venta: precioVal,
            proveedor: provStr,
            fecha_registro: dateStr,
            values: rowValues
          });
        }

        if (parsedRows.length === 0) {
          alert('No se encontraron registros de surtido válidos para importar.');
          return;
        }

        // Apply headers first
        const cleanedOriginalHeaders = cleanHeaders(originalHeaders);
        setSubmenuHeaders(prev => ({
          ...prev,
          [tabId]: cleanedOriginalHeaders
        }));

        if (confirm(`Se detectaron ${parsedRows.length} registros en el archivo.\n\n¿Quieres REEMPLAZAR todos los registros actuales de esta sección con la nueva importación?\n(Aceptar = Reemplazar por completo, Cancelar = Agregar al final del listado)`)) {
          clearTableInSupabase(tabId).then(() => {
            if (tabId === 'cer_bb') {
              setCerBBData(parsedRows);
              setTimeout(() => saveToSupabase('cer_bb', parsedRows, cleanedOriginalHeaders), 10);
            }
            else if (tabId === 'art_alt') {
              setArtAltData(parsedRows);
              setTimeout(() => saveToSupabase('art_alt', parsedRows, cleanedOriginalHeaders), 10);
            }
            else if (tabId === 'art_ct') {
              setArtCtData(parsedRows);
              setTimeout(() => saveToSupabase('art_ct', parsedRows, cleanedOriginalHeaders), 10);
            }
            else {
              setGenericSubmenuData(prev => ({
                ...prev,
                [tabId]: parsedRows
              }));
              setTimeout(() => saveToSupabase(tabId, parsedRows, cleanedOriginalHeaders), 10);
            }
          });
        } else {
          if (tabId === 'cer_bb') {
            setCerBBData(prev => {
              const res = [...prev, ...parsedRows];
              setTimeout(() => saveToSupabase('cer_bb', res, cleanedOriginalHeaders), 10);
              return res;
            });
          }
          else if (tabId === 'art_alt') {
            setArtAltData(prev => {
              const res = [...prev, ...parsedRows];
              setTimeout(() => saveToSupabase('art_alt', res, cleanedOriginalHeaders), 10);
              return res;
            });
          }
          else if (tabId === 'art_ct') {
            setArtCtData(prev => {
              const res = [...prev, ...parsedRows];
              setTimeout(() => saveToSupabase('art_ct', res, cleanedOriginalHeaders), 10);
              return res;
            });
          }
          else {
            setGenericSubmenuData(prev => {
              const res = [...(prev[tabId] || []), ...parsedRows];
              setTimeout(() => saveToSupabase(tabId, res, cleanedOriginalHeaders), 10);
              return {
                ...prev,
                [tabId]: res
              };
            });
          }
        }

        alert(`¡Importación exitosa! Se han guardado ${parsedRows.length} registros en el submenú de surtido.`);
      } catch (err) {
        console.error("CSV upload parse error", err);
        alert('Ocurrió un error al procesar el archivo Excel/CSV.');
      }
    };

    reader.readAsText(file, "UTF-8");
    e.target.value = '';
  };

  // Form state
  const defaultFormState = {
    codigo: '',
    nombre: '',
    proveedor: '',
    piezas_por_caja: 0,
    precio_caja: 0,
    precio_unidad: 0,
    status: 'Activo',
    forma_pago: 'Efectivo',
    precio_venta: 0,
    margen_pct: 0,
    precio_sugerido: 0,
    margen_ps_pct: 0,
    cambio_precio_fecha: new Date().toISOString().split('T')[0],
    notas: '',
    resorte_usa: '',
    filtro_especial: '',
    existencias: 0
  };
  
  const [form, setForm] = useState(defaultFormState);

  // Helper to re-calculate margins automatically during input changes
  const calculateMargins = (unitPrice: number, sellPrice: number, suggestedPrice: number) => {
    const margin_pct = sellPrice > 0 ? ((sellPrice - unitPrice) / sellPrice) * 100 : 0;
    const margin_ps_pct = suggestedPrice > 0 ? ((suggestedPrice - unitPrice) / suggestedPrice) * 100 : 0;
    return { margin_pct, margin_ps_pct };
  };

  const handleFormChange = (field: string, value: any) => {
    setForm(prev => {
      const updated = { ...prev, [field]: value };
      
      // Auto-validate calculation if pieces or box price is changed
      if (['precio_caja', 'piezas_por_caja'].includes(field)) {
        const pCaja = Number(field === 'precio_caja' ? value : prev.precio_caja);
        const pPiezas = Number(field === 'piezas_por_caja' ? value : prev.piezas_por_caja);
        if (pCaja > 0 && pPiezas > 0) {
          const uPrice = Number((pCaja / pPiezas).toFixed(2));
          updated.precio_unidad = uPrice;
          
          const sPrice = Number(prev.precio_venta);
          const sugPrice = Number(prev.precio_sugerido);
          const { margin_pct, margin_ps_pct } = calculateMargins(uPrice, sPrice, sugPrice);
          updated.margen_pct = Number(margin_pct.toFixed(2));
          updated.margen_ps_pct = Number(margin_ps_pct.toFixed(2));
        }
      }
      
      // Auto-validate calculation if numeric prices are adjusted
      if (['precio_unidad', 'precio_venta', 'precio_sugerido'].includes(field)) {
        const uPrice = Number(field === 'precio_unidad' ? value : prev.precio_unidad);
        const sPrice = Number(field === 'precio_venta' ? value : prev.precio_venta);
        const sugPrice = Number(field === 'precio_sugerido' ? value : prev.precio_sugerido);
        
        const { margin_pct, margin_ps_pct } = calculateMargins(uPrice, sPrice, sugPrice);
        updated.margen_pct = Number(margin_pct.toFixed(2));
        updated.margen_ps_pct = Number(margin_ps_pct.toFixed(2));
      }
      return updated;
    });
  };

  const openAddForm = () => {
    setForm(defaultFormState);
    setEditingItem(null);
    setIsFormOpen(true);
  };

  const openEditForm = (item: any) => {
    setForm({
      codigo: item.codigo || '',
      nombre: item.nombre || '',
      proveedor: item.proveedor || '',
      piezas_por_caja: Number(item.piezas_por_caja || 0),
      precio_caja: Number(item.precio_caja || 0),
      precio_unidad: Number(item.precio_unitario || item.precio_unidad || 0),
      status: item.status || 'Activo',
      forma_pago: item.forma_pago || 'Efectivo',
      precio_venta: Number(item.precio_venta || 0),
      margen_pct: Number(item.margen_pct || 0),
      precio_sugerido: Number(item.precio_sugerido || 0),
      margen_ps_pct: Number(item.margen_ps_pct || 0),
      cambio_precio_fecha: item.cambio_precio_fecha || new Date().toISOString().split('T')[0],
      notas: item.notas || '',
      resorte_usa: item.resorte_usa || '',
      filtro_especial: item.filtro_especial || '',
      existencias: Number(item.existencias || 0)
    });
    setEditingItem(item);
    setIsFormOpen(true);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.nombre.trim()) return;

    if (editingItem) {
      if (onUpdateProduct) {
        await onUpdateProduct(editingItem.id, form);
      }
    } else {
      if (onAddProduct) {
        await onAddProduct(form);
      }
    }
    setIsFormOpen(false);
    setEditingItem(null);
    setForm(defaultFormState);
  };

  const handleDelete = async (id: string) => {
    if (confirm('¿Estás seguro de que deseas eliminar este producto?')) {
      if (onDeleteProduct) {
        await onDeleteProduct(id);
      }
      // Clean selected
      setSelectedItems(prev => {
        const copy = { ...prev };
        delete copy[id];
        return copy;
      });
    }
  };

  // Bulk selections hooks
  const toggleSelectItem = (id: string) => {
    setSelectedItems(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  // Sort handler
  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(prev => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // Filtered computed list + Excel-like Sorting
  const filteredProducts = useMemo(() => {
    const filtered = products.filter(p => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch = !q || (p.nombre || '').toLowerCase().includes(q);
      
      const matchesStatus = statusFilter === 'all' || 
                            (statusFilter === 'Activo' && isActivoStatus(p.status)) ||
                            (statusFilter === 'Inactivo' && !isActivoStatus(p.status));
      const matchesPago = pagoFilter === 'all' || p.forma_pago === pagoFilter;

      return matchesSearch && matchesStatus && matchesPago;
    });

    if (!sortField) return filtered;

    return [...filtered].sort((a, b) => {
      let aVal = a[sortField];
      let bVal = b[sortField];

      // Handle null / undefined
      if (aVal === undefined || aVal === null) aVal = '';
      if (bVal === undefined || bVal === null) bVal = '';

      // Numeric comparison
      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return sortDirection === 'asc' ? aVal - bVal : bVal - aVal;
      }

      // Try casting to numbers for fields that should be numbers
      const numericFields = [
        'precio_venta', 'precio_caja', 'precio_unidad', 'precio_sugerido', 
        'margen_pct', 'margen_ps_pct', 'piezas_por_caja'
      ];
      if (numericFields.includes(sortField)) {
        const numA = Number(aVal) || 0;
        const numB = Number(bVal) || 0;
        return sortDirection === 'asc' ? numA - numB : numB - numA;
      }

      if (sortField === 'created_at') {
        const timeA = aVal ? new Date(aVal).getTime() : 0;
        const timeB = bVal ? new Date(bVal).getTime() : 0;
        return sortDirection === 'asc' ? timeA - timeB : timeB - timeA;
      }

      // String comparison
      const strA = String(aVal).toLowerCase().trim();
      const strB = String(bVal).toLowerCase().trim();
      if (strA < strB) return sortDirection === 'asc' ? -1 : 1;
      if (strA > strB) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  }, [products, searchQuery, statusFilter, pagoFilter, sortField, sortDirection]);

  // Paginated items
  const paginatedProducts = useMemo(() => {
    const startIndex = (currentPage - 1) * 5;
    return filteredProducts.slice(startIndex, startIndex + 5);
  }, [filteredProducts, currentPage]);

  const totalPages = useMemo(() => {
    return Math.max(Math.ceil(filteredProducts.length / 5), 1);
  }, [filteredProducts]);

  // Reset page to 1 on filter/sort change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, statusFilter, pagoFilter, sortField, sortDirection]);

  // Reset supplyPage to 1 on submenu, search or sort change
  useEffect(() => {
    setSupplyPage(1);
  }, [activeSupplySubmenu, submenuSearchQuery, supplySortField, supplySortDirection]);

  // Measure and synchronize widths on content/pagination shift
  useEffect(() => {
    const updateWidth = () => {
      if (tableContainerRef.current) {
        setTableScrollWidth(tableContainerRef.current.scrollWidth);
      }
    };
    // Wait slightly for browser render cycle
    const timer = setTimeout(updateWidth, 50);
    // Observe size changes
    if (typeof ResizeObserver !== 'undefined' && tableContainerRef.current) {
      const observer = new ResizeObserver(() => {
        updateWidth();
      });
      observer.observe(tableContainerRef.current);
      return () => {
        clearTimeout(timer);
        observer.disconnect();
      };
    }
    return () => clearTimeout(timer);
  }, [paginatedProducts, filteredProducts]);

  // Synchronize scroll positions safely
  const handleTopScroll = () => {
    if (topScrollRef.current && tableContainerRef.current) {
      if (Math.abs(tableContainerRef.current.scrollLeft - topScrollRef.current.scrollLeft) > 1) {
        tableContainerRef.current.scrollLeft = topScrollRef.current.scrollLeft;
      }
    }
  };

  const handleTableScroll = () => {
    if (topScrollRef.current && tableContainerRef.current) {
      if (Math.abs(topScrollRef.current.scrollLeft - tableContainerRef.current.scrollLeft) > 1) {
        topScrollRef.current.scrollLeft = tableContainerRef.current.scrollLeft;
      }
    }
  };

  // Synchronize scroll positions for submenus safely
  const handleSubmenuTopScroll = () => {
    if (submenuTopScrollRef.current && submenuTableContainerRef.current) {
      if (Math.abs(submenuTableContainerRef.current.scrollLeft - submenuTopScrollRef.current.scrollLeft) > 1) {
        submenuTableContainerRef.current.scrollLeft = submenuTopScrollRef.current.scrollLeft;
      }
    }
  };

  const handleSubmenuTableScroll = () => {
    if (submenuTopScrollRef.current && submenuTableContainerRef.current) {
      if (Math.abs(submenuTopScrollRef.current.scrollLeft - submenuTableContainerRef.current.scrollLeft) > 1) {
        submenuTopScrollRef.current.scrollLeft = submenuTableContainerRef.current.scrollLeft;
      }
    }
  };

  // Measure and synchronize widths on content/pagination shift for submenus
  useEffect(() => {
    const updateWidth = () => {
      if (submenuTableContainerRef.current) {
        setSubmenuScrollWidth(submenuTableContainerRef.current.scrollWidth);
      }
    };
    // Wait slightly for browser render cycle
    const timer = setTimeout(updateWidth, 50);
    // Observe size changes
    if (typeof ResizeObserver !== 'undefined' && submenuTableContainerRef.current) {
      const observer = new ResizeObserver(() => {
        updateWidth();
      });
      observer.observe(submenuTableContainerRef.current);
      return () => {
        clearTimeout(timer);
        observer.disconnect();
      };
    }
    return () => clearTimeout(timer);
  }, [activeSupplySubmenu, genericSubmenuData, cerBBData, artAltData, artCtData, submenuHeaders]);

  const isAllSelected = useMemo(() => {
    if (filteredProducts.length === 0) return false;
    return filteredProducts.every(p => selectedItems[p.id]);
  }, [filteredProducts, selectedItems]);

  const toggleSelectAll = () => {
    if (isAllSelected) {
      // Deselect all filtered
      setSelectedItems(prev => {
        const copy = { ...prev };
        filteredProducts.forEach(p => {
          copy[p.id] = false;
        });
        return copy;
      });
    } else {
      // Select all filtered
      setSelectedItems(prev => {
        const copy = { ...prev };
        filteredProducts.forEach(p => {
          copy[p.id] = true;
        });
        return copy;
      });
    }
  };

  // Selection counts
  const selectedCount = useMemo(() => {
    return Object.keys(selectedItems).filter(id => selectedItems[id]).length;
  }, [selectedItems]);

  const selectedProductsList = useMemo(() => {
    return products.filter(p => selectedItems[p.id]);
  }, [products, selectedItems]);

  // Bulk deletes
  const handleBulkDelete = async () => {
    const list = selectedProductsList;
    if (list.length === 0) return;
    if (confirm(`¿Estás seguro de que deseas eliminar los ${list.length} productos seleccionados?`)) {
      if (onDeleteProduct) {
        for (const item of list) {
          await onDeleteProduct(item.id);
        }
      }
      // Reset selections
      setSelectedItems({});
    }
  };

  // Bulk status change
  const handleBulkToggleStatus = async (targetStatus: 'Activo' | 'Inactivo') => {
    const list = selectedProductsList;
    if (list.length === 0) return;
    const ids = list.map(item => item.id);
    if (onUpdateProductStatusBulk) {
      await onUpdateProductStatusBulk(ids, targetStatus);
    } else if (onUpdateProduct) {
      for (const item of list) {
        await onUpdateProduct(item.id, { status: targetStatus });
      }
    }
    setSelectedItems({});
  };

  // Global status change for all registered products
  const handleGlobalStatusChange = async (targetStatus: 'Activo' | 'Inactivo') => {
    if (products.length === 0) return;
    const confirmMsg = `¿Estás seguro de que deseas marcar los ${products.length} productos registrados como ${targetStatus.toUpperCase()} de forma GLOBAL?`;
    if (confirm(confirmMsg)) {
      const ids = products.map(p => p.id);
      if (onUpdateProductStatusBulk) {
        await onUpdateProductStatusBulk(ids, targetStatus);
      } else if (onUpdateProduct) {
        for (const id of ids) {
          await onUpdateProduct(id, { status: targetStatus });
        }
      }
      setSelectedItems({});
      alert(`Se han marcado todos los productos como ${targetStatus}.`);
    }
  };

  const renderSortableHeader = (label: string, field: string, textClass = "text-slate-500 font-extrabold") => {
    const isSorted = sortField === field;
    const isNameColumn = field === 'nombre';
    return (
      <th className={`py-4 px-3 select-none whitespace-nowrap ${isNameColumn ? 'w-full min-w-[240px]' : 'w-px'}`}>
        <button
          type="button"
          onClick={() => handleSort(field)}
          className={`flex items-center gap-1 hover:text-[#043077] transition-colors focus:outline-none cursor-pointer uppercase text-[10px] sm:text-[11px] ${textClass} ${
            isSorted ? 'text-[#043077] font-black' : ''
          }`}
          title={`Click para ordenar por ${label}`}
        >
          <span className="tracking-wider">{label}</span>
          <span className="inline-flex items-center justify-center">
            {isSorted ? (
              sortDirection === 'asc' ? (
                <ChevronUp className="w-3.5 h-3.5 text-[#043077]" />
              ) : (
                <ChevronDown className="w-3.5 h-3.5 text-[#043077]" />
              )
            ) : (
              <ArrowUpDown className="w-3 h-3 text-slate-300 hover:text-slate-400" />
            )}
          </span>
        </button>
      </th>
    );
  };

  // Handlers for premium outputs
  const handlePdfExport = (itemsList: any[]) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert("Por favor habilita las ventanas emergentes (popups) para exportar a PDF.");
      return;
    }
    
    // Dynamic real updated date
    const today = new Date().toLocaleDateString('es-ES', {
      year: 'numeric', month: 'long', day: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });

    const isFilteredOnly = itemsList.length !== products.length;

    const tableRows = itemsList.map(p => `
      <tr style="border-bottom: 1px solid #e2e8f0;">
        <td style="padding: 10px 8px; font-weight: 500; font-size: 13px; color: #1e293b;">
          ${p.codigo ? `<span style="font-size: 9px; font-family: monospace; color: #043077; background-color: #eff6ff; padding: 2px 5px; border-radius: 4px; font-weight: bold; margin-bottom: 3px; display: inline-block;">${p.codigo}</span><br>` : ''}
          <span style="font-weight: bold;">${p.nombre}</span>
          ${p.proveedor ? `<br><span style="font-size: 11px; color: #64748b; font-weight: 600;">Prov: ${p.proveedor}</span>` : ''}
          ${p.piezas_por_caja ? `<br><span style="font-size: 11px; color: #64748b; font-weight: 600;">Piezas/Caja: ${p.piezas_por_caja} pzas</span>` : ''}
        </td>
        <td style="padding: 10px 8px; font-size: 13px; color: #475569;">Caja: ${formatMXN(p.precio_caja)}<br><span style="font-size: 11px; color: #94a3b8;">Unitario: ${formatMXN(p.precio_unidad)}</span></td>
        <td style="padding: 10px 8px; font-size: 13px; font-weight: bold; color: #1e293b;">${formatMXN(p.precio_venta)}</td>
        <td style="padding: 10px 8px; font-size: 13px; font-weight: bold; color: #16a34a;">${safeVal(p.margen_pct).toFixed(1)}%</td>
        <td style="padding: 10px 8px; font-size: 13px; font-weight: bold; color: #1e293b;">${formatMXN(p.precio_sugerido)}</td>
        <td style="padding: 10px 8px; font-size: 13px; font-weight: bold; color: #043077;">${safeVal(p.margen_ps_pct).toFixed(1)}%</td>
        <td style="padding: 10px 8px; font-size: 13px; color: #475569;">${p.forma_pago}</td>
        <td style="padding: 10px 8px; font-size: 12px; font-weight: bold;"><span style="background-color: ${ (String(p.status || '').trim().toLowerCase() === 'activo' || String(p.status || '').trim().toLowerCase() === 'active') ? '#dcfce7' : '#fee2e2'}; color: ${ (String(p.status || '').trim().toLowerCase() === 'activo' || String(p.status || '').trim().toLowerCase() === 'active') ? '#166534' : '#991b1b'}; padding: 2px 8px; border-radius: 9999px;">${p.status}</span></td>
        <td style="padding: 10px 8px; font-size: 11px; font-family: monospace; color: #64748b;">${p.created_at ? new Date(p.created_at).toLocaleDateString('es-ES') : today}</td>
      </tr>
    `).join('');

    const htmlContent = `
      <!DOCTYPE html>
      <html lang="es">
      <head>
        <meta charset="UTF-8">
        <title>Surtiantojo - Reporte Catálogo</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; padding: 30px; color: #334155; }
          .header { text-align: center; border-bottom: 2px solid #e2e8f0; padding-bottom: 25px; margin-bottom: 25px; }
          .logo { height: 90px; object-fit: contain; margin-bottom: 15px; }
          .title { font-size: 26px; font-weight: 800; color: #0f172a; margin: 0; text-transform: uppercase; letter-spacing: -0.5px; }
          .subtitle { font-size: 12px; font-weight: 700; color: #043077; margin: 5px 0 0 0; letter-spacing: 2px; }
          .meta-info { display: flex; justify-content: space-between; font-size: 11px; color: #64748b; margin-top: 20px; font-weight: 600; }
          table { width: 100%; border-collapse: collapse; margin-top: 15px; }
          th { background-color: #f8fafc; padding: 12px 8px; text-align: left; font-size: 11px; font-weight: 700; text-transform: uppercase; color: #475569; border-bottom: 2px solid #cbd5e1; }
          .metric-cards { display: flex; gap: 15px; margin-top: 30px; border-top: 1px solid #e2e8f0; padding-top: 25px; }
          .metric-card { flex: 1; background-color: #f8fafc; border: 1px solid #f1f5f9; padding: 12px; border-radius: 8px; text-align: center; }
          .metric-title { font-size: 9px; font-weight: bold; text-transform: uppercase; color: #94a3b8; display: block; }
          .metric-value { font-size: 18px; font-weight: 800; color: #0f172a; margin-top: 3px; display: block; }
          .no-print-bar { display: flex; justify-content: space-between; align-items: center; background-color: #f1f5f9; border: 1px solid #e2e8f0; padding: 12px 20px; border-radius: 12px; margin-bottom: 25px; }
          .print-btn { background-color: #043077; color: white; border: none; padding: 8px 18px; font-weight: bold; border-radius: 6px; cursor: pointer; font-size: 12px; transition: opacity 0.2s; }
          .print-btn:hover { opacity: 0.9; }
          @media print {
            .no-print-bar { display: none; }
            body { padding: 0; }
          }
        </style>
      </head>
      <body>
        <div class="no-print-bar">
          <span style="font-size: 12px; font-weight: bold; color: #475569;">
            ${isFilteredOnly ? 'Exportando selección de productos' : 'Exportando catálogo completo'} (${itemsList.length} registros)
          </span>
          <button onclick="window.print()" class="print-btn">Imprimir / Guardar como PDF</button>
        </div>

        <div class="header">
          <img src="https://cotecam.com//surtiantojo.jpg" alt="Logo de Surtiantojo" class="logo" />
          <h1 class="title">Surtiantojo Café</h1>
          <p class="subtitle">Catálogo de Productos y Márgenes Oficiales</p>
          <div class="meta-info">
            <span>FECHA REPORTE: ${today}</span>
            <span>EMITIDO POR: Sistema Administrativo</span>
          </div>
        </div>

         <table>
          <thead>
            <tr>
              <th style="width: 31%">Producto</th>
              <th style="width: 15%">Costo Caja / Unid</th>
              <th style="width: 10%">Venta</th>
              <th style="width: 9%">Margen</th>
              <th style="width: 11%">Sugerido</th>
              <th style="width: 11%">Margen Ps</th>
              <th style="width: 11%">Pago</th>
              <th style="width: 11%">Status</th>
              <th style="text-align: right; width: 11%">Registro</th>
            </tr>
          </thead>
          <tbody>
            ${tableRows}
          </tbody>
        </table>

        <div class="metric-cards">
          <div class="metric-card">
            <span class="metric-title">Productos Registrados</span>
            <span class="metric-value">${itemsList.length} ítems</span>
          </div>
          <div class="metric-card">
            <span class="metric-title">Productos Activos</span>
            <span class="metric-value" style="color: #166534;">${itemsList.filter(p => {
              const s = String(p.status || '').trim().toLowerCase();
              return s === 'activo' || s === 'active';
            }).length} ítems</span>
          </div>
          <div class="metric-card">
            <span class="metric-title">Precio Promedio Venta</span>
            <span class="metric-value">${formatMXN(itemsList.reduce((acc, p) => acc + safeVal(p.precio_venta), 0) / (itemsList.length || 1))}</span>
          </div>
          <div class="metric-card">
            <span class="metric-title">Margen % Promedio</span>
            <span class="metric-value" style="color: #043077;">${(itemsList.reduce((acc, p) => acc + safeVal(p.margen_pct), 0) / (itemsList.length || 1)).toFixed(1)}%</span>
          </div>
        </div>

        <div style="margin-top: 50px; text-align: center; font-size: 10px; color: #94a3b8; font-style: italic;">
          Soporte Surtiantojo Café - Documento válido como inventariado oficial con registro histórico automatizado.
        </div>
      </body>
      </html>
    `;
    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

  const handleExcelExport = (itemsList: any[]) => {
    const headers = [
      'Código', 'Nombre del Producto', 'Proveedor', 'Piezas por Caja', 'Precio Caja', 'Precio Unitario', 'Precio Venta', 
      'Margen de ganancia %', 'Ganancia ($)', 'Precio Sugerido', 'Margen Ps %', 'Forma de Pago', 
      'Status', 'Fecha Cambio Precio', 'Notas',
      'Fecha Registro'
    ];
    
    // Dynamic real date
    const today = new Date().toLocaleDateString('es-ES');

    const csvRows = itemsList.map(p => {
      const profitMargin = safeVal(p.precio_venta) - safeVal(p.precio_unidad);
      return [
        `"${(p.codigo || '').replace(/"/g, '""')}"`,
        `"${p.nombre.replace(/"/g, '""')}"`,
        `"${(p.proveedor || '').replace(/"/g, '""')}"`,
        p.piezas_por_caja || 0,
        p.precio_caja,
        p.precio_unidad,
        p.precio_venta,
        p.margen_pct,
        profitMargin,
        p.precio_sugerido,
        p.margen_ps_pct,
        `"${p.forma_pago}"`,
        `"${p.status}"`,
        `"${p.cambio_precio_fecha}"`,
        `"${(p.notas || '').replace(/"/g, '""')}"`,
        p.created_at ? new Date(p.created_at).toLocaleDateString() : today
      ].join(',');
    });

    const csvContent = "\uFEFF" + [headers.join(','), ...csvRows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `inventario_surtiantojo_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Common animation setup
  const containerVariants = {
    hidden: { opacity: 0, y: 15 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.4, ease: "easeOut" }
    }
  };

  // Render metrics graphs/charts depending on the specific module selected
  const renderInteractiveMetrics = () => {
    switch (moduleId) {
      case 'metrics':
        return (
          <div className="space-y-6">
            {/* Top Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-5 rounded-2xl bg-white border border-slate-100 shadow-sm relative overflow-hidden group hover:shadow-md transition-shadow">
                <div className="absolute right-0 top-0 w-24 h-24 bg-blue-500/5 rounded-bl-full pointer-events-none transition-all group-hover:scale-110"></div>
                <span className="text-slate-400 text-xs font-black tracking-wider uppercase block">VENTAS TOTALES DEL MES</span>
                <div className="flex items-baseline gap-2 mt-2">
                  <span className="text-3xl font-extrabold font-display text-slate-900">$284,350</span>
                  <span className="text-sm font-bold text-emerald-600 flex items-center gap-0.5">
                    <TrendingUp className="w-3.5 h-3.5" /> +14.2%
                  </span>
                </div>
                <div className="w-full bg-slate-100 h-1.5 rounded-full mt-4 overflow-hidden">
                  <div className="bg-gradient-to-r from-blue-600 to-[#043077] h-full" style={{ width: '74%' }}></div>
                </div>
                <span className="text-xs text-slate-500 mt-2 block">Meta mensual: $380,000</span>
              </div>

              <div className="p-5 rounded-2xl bg-white border border-slate-100 shadow-sm relative overflow-hidden group hover:shadow-md transition-shadow">
                <div className="absolute right-0 top-0 w-24 h-24 bg-emerald-500/5 rounded-bl-full pointer-events-none transition-all group-hover:scale-110"></div>
                <span className="text-slate-400 text-xs font-black tracking-wider uppercase block">TICKET PROMEDIO</span>
                <div className="flex items-baseline gap-2 mt-2">
                  <span className="text-3xl font-extrabold font-display text-slate-900">$94.50</span>
                  <span className="text-sm font-bold text-emerald-600 flex items-center gap-0.5">
                    <TrendingUp className="w-3.5 h-3.5" /> +5.8%
                  </span>
                </div>
                <div className="w-full bg-slate-100 h-1.5 rounded-full mt-4 overflow-hidden">
                  <div className="bg-gradient-to-r from-emerald-500 to-teal-600 h-full" style={{ width: '85%' }}></div>
                </div>
                <span className="text-xs text-slate-500 mt-2 block">Mayor consumo: Capuchinos + Postres</span>
              </div>

              <div className="p-5 rounded-2xl bg-white border border-slate-100 shadow-sm relative overflow-hidden group hover:shadow-md transition-shadow">
                <div className="absolute right-0 top-0 w-24 h-24 bg-amber-500/5 rounded-bl-full pointer-events-none transition-all group-hover:scale-110"></div>
                <span className="text-slate-400 text-xs font-black tracking-wider uppercase block">MARGEN DE UTILIDAD</span>
                <div className="flex items-baseline gap-2 mt-2">
                  <span className="text-3xl font-extrabold font-display text-slate-900">
                    {products.length > 0 
                      ? `${(products.reduce((acc, p) => acc + safeVal(p.margen_pct), 0) / products.length).toFixed(1)}%` 
                      : '0.0%'
                    }
                  </span>
                  <span className="text-sm font-bold text-emerald-600 flex items-center gap-0.5">
                    Sincronizado
                  </span>
                </div>
                <div className="w-full bg-slate-100 h-1.5 rounded-full mt-4 overflow-hidden">
                  <div className="bg-gradient-to-r from-amber-500 to-[#043077] h-full" style={{ width: '82%' }}></div>
                </div>
                <span className="text-xs text-slate-400 mt-2 block">Cálculo en vivo sobre productos activos</span>
              </div>

              <div className="p-5 rounded-xl bg-gradient-to-tr from-[#043077] to-blue-800 text-white shadow-md relative overflow-hidden group">
                <span className="text-blue-200/90 text-xs font-black tracking-wider uppercase block">TRANSACCIONES</span>
                <div className="flex items-baseline gap-2 mt-2">
                  <span className="text-3xl font-extrabold font-display text-white">3,120</span>
                  <span className="text-sm font-bold text-blue-200 block">Este Mes</span>
                </div>
                <div className="mt-4 pt-1 flex items-center justify-between text-sm text-blue-100">
                  <span>96% Completadas</span>
                  <span>4% Crédito VIP</span>
                </div>
              </div>
            </div>

            {/* Main Sales Chart */}
            <div className="p-6 rounded-2xl bg-white border border-slate-150 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-slate-900">Fluidez de Ventas Diarias</h3>
                  <p className="text-xs text-slate-400">Distribución de ingresos por día de la semana actual con picos de desayuno</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="inline-flex items-center gap-1.5 text-xs text-slate-600">
                    <span className="w-3 h-3 rounded bg-[#043077]"></span> Semana Actual
                  </span>
                  <span className="inline-flex items-center gap-1.5 text-xs text-slate-400">
                    <span className="w-3 h-3 rounded bg-blue-200"></span> Semana Anterior
                  </span>
                </div>
              </div>

              {/* Dynamic SVG Line Graph with Gradients */}
              <div className="w-full h-80 relative mt-4">
                <svg viewBox="0 0 700 240" className="w-full h-full overflow-visible">
                  <defs>
                    <linearGradient id="gradient-blue-main" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#043077" stopOpacity="0.45" />
                      <stop offset="100%" stopColor="#043077" stopOpacity="0" />
                    </linearGradient>
                    <linearGradient id="gradient-blue-prev" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#93C5FD" stopOpacity="0.2" />
                      <stop offset="100%" stopColor="#93C5FD" stopOpacity="0" />
                    </linearGradient>
                  </defs>

                  {/* Horizontal Grid lines */}
                  <line x1="40" y1="40" x2="680" y2="40" stroke="#f1f5f9" strokeWidth="1" />
                  <line x1="40" y1="90" x2="680" y2="90" stroke="#f1f5f9" strokeWidth="1" />
                  <line x1="40" y1="140" x2="680" y2="140" stroke="#f1f5f9" strokeWidth="1" />
                  <line x1="40" y1="190" x2="680" y2="190" stroke="#f1f5f9" strokeWidth="1" />

                  {/* Week Anterior (Light Blue Line/Fill) */}
                  <path 
                    d="M 40,160 Q 146,140 253,100 T 466,130 T 680,80" 
                    fill="none" 
                    stroke="#93C5FD" 
                    strokeWidth="1.5" 
                    strokeDasharray="4 4"
                  />
                  <path 
                    d="M 40,160 Q 146,140 253,100 T 466,130 T 680,80 L 680,210 L 40,210 Z" 
                    fill="url(#gradient-blue-prev)" 
                  />

                  {/* Week Actual (Deep Blue Line/Fill) */}
                  <path 
                    d="M 40,180 C 146,120 253,50 360,90 C 466,130 573,30 680,45" 
                    fill="none" 
                    stroke="#043077" 
                    strokeWidth="3.5" 
                    strokeLinecap="round"
                  />
                  <path 
                    d="M 40,180 C 146,120 253,50 360,90 C 466,130 573,30 680,45 L 680,210 L 40,210 Z" 
                    fill="url(#gradient-blue-main)" 
                  />

                  {/* Custom Graph markers */}
                  <circle cx="360" cy="90" r="6" fill="#043077" stroke="#fff" strokeWidth="2.5" className="shadow-lg" />
                  <circle cx="680" cy="45" r="6" fill="#043077" stroke="#fff" strokeWidth="2.5" className="shadow-lg" />
                  
                  {/* Axis Labels */}
                  <text x="40" y="225" fill="#94a3b8" fontSize="10" fontWeight="bold">LUN</text>
                  <text x="146" y="225" fill="#94a3b8" fontSize="10" fontWeight="bold">MAR</text>
                  <text x="253" y="225" fill="#94a3b8" fontSize="10" fontWeight="bold">MIÉ</text>
                  <text x="360" y="225" fill="#94a3b8" fontSize="10" fontWeight="bold">JUE</text>
                  <text x="466" y="225" fill="#94a3b8" fontSize="10" fontWeight="bold">VIE</text>
                  <text x="573" y="225" fill="#94a3b8" fontSize="10" fontWeight="bold">SÁB</text>
                  <text x="680" y="225" fill="#94a3b8" fontSize="10" fontWeight="bold" textAnchor="end">DOM</text>
                </svg>

                {/* Simulated Floating Tooltip */}
                <div className="absolute top-10 left-[55%] -translate-x-1/2 bg-slate-900 text-white rounded-lg px-3 py-1.5 text-xs shadow-xl flex flex-col pointer-events-none">
                  <span className="font-semibold">Viernes pico (Fijo)</span>
                  <span className="font-mono text-emerald-300 font-bold">$18,432.00</span>
                </div>
              </div>
            </div>
          </div>
        );

      case 'products':
        return (
          <div className="space-y-6 text-left">
            
            {/* Header statistics grid for products catalog */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white p-4 rounded-xl border border-slate-200/60 shadow-xs flex flex-col justify-between">
                <span className="text-xs font-black text-[#043077] uppercase tracking-wider block">Menú Activo</span>
                <span className="text-2xl font-black text-slate-800 mt-1 block">{products.length} Items</span>
                <span className="text-xs text-slate-400 mt-1 block">Catálogo registrado</span>
              </div>
              <div className="bg-white p-4 rounded-xl border border-slate-200/60 shadow-xs flex flex-col justify-between">
                <span className="text-xs font-black text-[#043077] uppercase tracking-wider block">Productos Activos</span>
                <span className="text-2xl font-black text-slate-800 mt-1 block">
                  {products.filter(p => isActivoStatus(p.status)).length} Items
                </span>
                <span className="text-xs text-slate-400 mt-1 block">Disponibles al público</span>
              </div>
              <div className="bg-white p-4 rounded-xl border border-slate-200/60 shadow-xs flex flex-col justify-between">
                <span className="text-xs font-black text-[#043077] uppercase tracking-wider block">Margen Promedio</span>
                <span className="text-2xl font-black text-emerald-600 mt-1 block">
                  {products.length > 0 
                    ? `${(products.reduce((acc, p) => acc + safeVal(p.margen_pct), 0) / products.length).toFixed(1)}%` 
                    : '0.0%'
                  }
                </span>
                <span className="text-xs text-slate-400 mt-1 block">Sincronizado al dashboard</span>
              </div>
              <div className="bg-white p-4 rounded-xl border border-slate-200/60 shadow-xs flex flex-col justify-between">
                <span className="text-xs font-black text-[#043077] uppercase tracking-wider block">Precio Promedio</span>
                <span className="text-2xl font-black text-[#043077] mt-1 block">
                  {products.length > 0 
                    ? formatMXN(products.reduce((acc, p) => acc + safeVal(p.precio_venta), 0) / products.length)
                    : '$0.00'
                  }
                </span>
                <span className="text-xs text-slate-400 mt-1 block">Venta unitaria promedio</span>
              </div>
            </div>

            {/* Filter and controls bar */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col gap-4">
              
              {/* Row 1: Dropdowns (Full Width) */}
              <div className="flex flex-col sm:flex-row gap-3 w-full">
                
                {/* Status Dropdown filter */}
                <div className="relative flex-1 min-w-[160px]">
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#043077] text-slate-700 font-bold transition-all shadow-2xs"
                  >
                    <option value="all">🟢 Todos los Estados</option>
                    <option value="Activo">🟢 Habilitado / Activo</option>
                    <option value="Inactivo">🔴 Deshabilitado / F/O</option>
                  </select>
                </div>

                {/* Forma de pago filter */}
                <div className="relative flex-1 min-w-[165px]">
                  <select
                    value={pagoFilter}
                    onChange={(e) => setPagoFilter(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#043077] text-slate-700 font-bold transition-all shadow-2xs"
                  >
                    <option value="all">💵 Modos de Pago</option>
                    <option value="Efectivo">💵 Efectivo</option>
                    <option value="Tarjeta bancaria">💳 Tarjeta bancaria</option>
                  </select>
                </div>

              </div>

              {/* Acciones Rápidas Globales Banner */}
              <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-slate-50 border border-slate-100 rounded-xl">
                <div className="flex items-center gap-2">
                  <span className="flex h-2 w-2 rounded-full bg-blue-600 animate-pulse"></span>
                  <p className="text-xs font-black text-slate-700 tracking-wide uppercase">Controles Globales del Inventario:</p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleGlobalStatusChange('Activo')}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-xs font-bold rounded-lg cursor-pointer transition-all active:scale-95"
                    title="Marcar absolutamente todos los productos registrados como Estado: Activo"
                  >
                    🟢 Activar Todos los Productos ({products.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => handleGlobalStatusChange('Inactivo')}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-200 text-xs font-bold rounded-lg cursor-pointer transition-all active:scale-95"
                    title="Marcar absolutamente todos los productos registrados como Estado: Inactivo"
                  >
                    🔴 Desactivar Todos los Productos ({products.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedItems(prev => {
                        const copy = { ...prev };
                        products.forEach(p => {
                          copy[p.id] = true;
                        });
                        return copy;
                      });
                    }}
                    className="flex items-center gap-1 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-900 border border-blue-200 text-xs font-bold rounded-lg cursor-pointer transition-all active:scale-95"
                    title="Seleccionar la totalidad de los productos para realizar acciones masivas"
                  >
                    ☑️ Seleccionar Todo ({products.length})
                  </button>
                  {selectedCount > 0 && (
                    <button
                      type="button"
                      onClick={() => setSelectedItems({})}
                      className="flex items-center gap-1 px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-bold rounded-lg cursor-pointer transition-all"
                      title="Quitar la selección de todos los ítems marcados"
                    >
                      🧹 Desmarcar Todo ({selectedCount})
                    </button>
                  )}
                </div>
              </div>

              {/* Row 2: Metadata counters and exports/actions */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100">
                
                {/* Result count metadata */}
                <div className="text-xs font-black text-slate-400 uppercase tracking-wider">
                  Resultados: <span className="text-[#043077] bg-blue-50 px-2 py-0.5 rounded-lg border border-blue-100">{filteredProducts.length}</span> de <span className="text-slate-600">{products.length}</span> registrados
                </div>

                {/* PDF - Excel outputs and Add Product Button */}
                <div className="flex flex-wrap items-center gap-2">
                  <input
                    type="file"
                    ref={fileInputRef}
                    accept=".csv"
                    onChange={handleImportCSV}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl border border-blue-200 hover:bg-blue-50 text-blue-800 text-xs font-extrabold cursor-pointer transition-all uppercase tracking-wider"
                    title="Importar productos desde un archivo Excel (CSV)"
                  >
                    <Download className="w-4 h-4 rotate-180 text-blue-600" /> Importar Excel/CSV
                  </button>
                  <button
                    type="button"
                    onClick={() => handleExcelExport(filteredProducts)}
                    className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl border border-emerald-200 hover:bg-emerald-50 text-emerald-800 text-xs font-extrabold cursor-pointer transition-all uppercase tracking-wider"
                    title="Exportar registros actuales a archivo excel CSV"
                  >
                    <FileSpreadsheet className="w-4 h-4 animate-pulse" /> Excel
                  </button>
                  <button
                    type="button"
                    onClick={() => handlePdfExport(filteredProducts)}
                    className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl border border-red-200 hover:bg-red-50 text-red-800 text-xs font-extrabold cursor-pointer transition-all uppercase tracking-wider"
                    title="Exportar reporte de catálogo pdf oficial con logotipo"
                  >
                    <FileText className="w-4 h-4" /> PDF
                  </button>
                  <button
                    type="button"
                    onClick={openAddForm}
                    className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-700 to-[#043077] hover:opacity-90 active:scale-95 text-white text-xs font-black transition-all shadow-sm uppercase tracking-wider cursor-pointer"
                  >
                    <Plus className="w-4 h-4" /> Registrar Producto
                  </button>
                </div>

              </div>

              {/* Row 3: Product Search Bar (Moved below Registrar Producto) */}
              <div className="pt-4 border-t border-slate-100 flex flex-col gap-2">
                <label className="text-xs font-black text-[#043077] uppercase tracking-wider block">🔍 Buscar por producto:</label>
                <div className="relative w-full">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Escriba el nombre del producto para buscarlo..."
                    className="w-full pl-10 pr-24 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-[#043077] focus:ring-1 focus:ring-[#043077] transition-all text-slate-800 font-semibold shadow-2xs"
                  />
                  {searchQuery && (
                    <button 
                      onClick={() => setSearchQuery('')}
                      className="absolute right-3 top-2.5 text-xs bg-slate-200 hover:bg-slate-300 px-3 py-1.5 rounded-lg font-black text-slate-700 transition-all cursor-pointer"
                    >
                      Limpiar
                    </button>
                  )}
                </div>
              </div>

            </div>

            {/* List and table main responsive wrapper */}
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
              
              {/* Barra de scroll superior sincronizada */}
              <div 
                ref={topScrollRef}
                onScroll={handleTopScroll}
                className="w-full overflow-x-auto select-none bg-slate-50 border-b border-slate-100"
                style={{ height: '12px', scrollbarWidth: 'thin' }}
              >
                <div style={{ width: `${tableScrollWidth}px`, height: '1px' }}></div>
              </div>

              <div 
                ref={tableContainerRef}
                onScroll={handleTableScroll}
                className="overflow-x-auto"
              >
                <table className="w-full table-auto text-left border-collapse whitespace-nowrap">
                  <thead>
                    <tr className="bg-slate-50 text-[10px] font-black uppercase text-slate-400 border-b border-slate-100">
                      <th className="py-4 px-3 w-px text-center whitespace-nowrap">
                        <button 
                          type="button"
                          onClick={toggleSelectAll} 
                          className="p-1 rounded hover:bg-slate-200/60 focus:outline-none cursor-pointer"
                        >
                          <input 
                            type="checkbox" 
                            checked={isAllSelected} 
                            onChange={() => {}} // Controlled manually at button container level
                            className="w-4 h-4 rounded text-[#043077] focus:ring-[#043077] pointer-events-none" 
                          />
                        </button>
                      </th>
                      {renderSortableHeader("Código", "codigo")}
                      {renderSortableHeader("Producto", "nombre")}
                      {renderSortableHeader("Proveedor", "proveedor")}
                      {renderSortableHeader("Precios Costo", "precio_unidad")}
                      {renderSortableHeader("Precio Venta", "precio_venta")}
                      {renderSortableHeader("Margen %", "margen_pct")}
                      {renderSortableHeader("Pre. Sugerido", "precio_sugerido", "text-[#043077]/80 font-bold")}
                      {renderSortableHeader("Margen Ps%", "margen_ps_pct", "text-[#043077]/80 font-bold")}
                      {renderSortableHeader("Métodos de Pago", "forma_pago")}
                      {renderSortableHeader("Estado", "status")}
                      {renderSortableHeader("Fecha Registro", "created_at")}
                      <th className="py-4 px-3 text-center text-slate-500 font-extrabold uppercase text-[10px] whitespace-nowrap w-px">Acción</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredProducts.length === 0 ? (
                      <tr>
                        <td colSpan={13} className="py-12 text-center text-slate-500 font-medium">
                          No se encontraron productos registrados con los filtros aplicados.
                        </td>
                      </tr>
                    ) : (
                      paginatedProducts.map((p) => {
                        const isChecked = !!selectedItems[p.id];
                        const formattedRegisterDate = p.created_at 
                          ? new Date(p.created_at).toLocaleDateString() 
                          : new Date().toLocaleDateString();

                        return (
                          <tr 
                            key={p.id} 
                            className={`hover:bg-slate-50/50 transition-colors ${
                              isChecked ? 'bg-blue-50/20' : ''
                            }`}
                          >
                            <td className="py-3 px-3 text-center whitespace-nowrap">
                              <button 
                                type="button"
                                onClick={() => toggleSelectItem(p.id)}
                                className="p-1 rounded cursor-pointer"
                              >
                                <input 
                                  type="checkbox" 
                                  checked={isChecked}
                                  onChange={() => {}} // Controlled by outer button
                                  className="w-4 h-4 rounded text-[#043077] focus:ring-[#043077] pointer-events-none" 
                                />
                              </button>
                            </td>
                            <td className="py-3 px-3 whitespace-nowrap">
                              {p.codigo ? (
                                <span className="inline-block max-w-fit text-[11px] font-mono font-bold bg-[#043077]/10 text-[#043077] px-2 py-0.5 rounded uppercase select-all" title="Código de barras / SKU">
                                  {p.codigo}
                                </span>
                              ) : (
                                <span className="text-xs text-slate-400 font-bold italic block">Sin código</span>
                              )}
                            </td>
                            <td className="py-3 px-3 whitespace-nowrap">
                              <span className="font-extrabold text-slate-800 text-sm block">{p.nombre}</span>
                            </td>
                            <td className="py-3 px-3 whitespace-nowrap">
                              <span className="text-xs font-bold text-slate-600 block bg-slate-100/60 border border-slate-200/50 rounded-lg px-2.5 py-1.5 max-w-[155px] truncate" title={p.proveedor || "Genérico"}>
                                {p.proveedor || "Genérico"}
                              </span>
                            </td>
                            <td className="py-3 px-3 whitespace-nowrap">
                              <div className="text-xs text-slate-600 leading-tight">
                                <div>Caja: <span className="font-bold font-mono text-slate-800">{formatMXN(p.precio_caja)}</span></div>
                                <div>Unitario: <span className="font-bold font-mono text-slate-800">{formatMXN(p.precio_unidad)}</span></div>
                              </div>
                            </td>
                            <td className="py-3 px-3 whitespace-nowrap">
                              <span className="text-sm font-extrabold text-slate-900 font-mono">
                                {formatMXN(p.precio_venta)}
                              </span>
                            </td>
                            <td className="py-3 px-3 whitespace-nowrap">
                              <span className="inline-flex items-center gap-0.5 px-2.5 py-0.5 rounded-full text-xs font-black bg-emerald-50 text-emerald-700">
                                {safeVal(p.margen_pct).toFixed(1)}%
                              </span>
                            </td>
                            <td className="py-3 px-3 whitespace-nowrap">
                              <span className="text-sm font-extrabold text-slate-900 font-mono">
                                {formatMXN(p.precio_sugerido)}
                              </span>
                            </td>
                            <td className="py-3 px-3 whitespace-nowrap">
                              <span className="inline-flex items-center gap-0.5 px-2.5 py-0.5 rounded-full text-xs font-black bg-[#043077]/5 text-[#043077]">
                                {safeVal(p.margen_ps_pct).toFixed(1)}%
                              </span>
                            </td>
                            <td className="py-3 px-3 whitespace-nowrap">
                              <span className="text-xs text-slate-600 font-semibold bg-slate-100 px-2 py-0.5 rounded-md">
                                {p.forma_pago}
                              </span>
                            </td>
                            <td className="py-3 px-3 whitespace-nowrap">
                              <button
                                type="button"
                                onClick={() => onUpdateProduct && onUpdateProduct(p.id, { status: isActivoStatus(p.status) ? 'Inactivo' : 'Activo' })}
                                className="focus:outline-none cursor-pointer"
                                title="Haga clic para cambiar de estado rápidamente"
                              >
                                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                                  isActivoStatus(p.status) 
                                    ? 'bg-emerald-100 text-emerald-800' 
                                    : 'bg-rose-100 text-rose-800'
                                }`}>
                                  <span className={`w-1.5 h-1.5 rounded-full ${isActivoStatus(p.status) ? 'bg-emerald-600' : 'bg-rose-600'}`}></span>
                                  {p.status}
                                </span>
                              </button>
                            </td>
                            <td className="py-3 px-3 whitespace-nowrap">
                              <span className="text-xs text-slate-500 font-mono block">
                                {formattedRegisterDate}
                              </span>
                            </td>
                            <td className="py-3 px-3 text-center whitespace-nowrap">
                              <div className="flex items-center justify-center gap-1">
                                <button
                                  type="button"
                                  onClick={() => setViewingItem(p)}
                                  className="p-1 px-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 rounded-lg transition-all focus:outline-none cursor-pointer"
                                  title="Ver detalles completos del producto"
                                >
                                  <Eye className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => openEditForm(p)}
                                  className="p-1 px-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 hover:text-blue-900 rounded-lg transition-all focus:outline-none cursor-pointer"
                                  title="Editar registro del producto"
                                >
                                  <Edit className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDelete(p.id)}
                                  className="p-1 px-1.5 bg-red-50 hover:bg-red-100 text-red-600 hover:text-red-800 rounded-lg transition-all focus:outline-none cursor-pointer"
                                  title="Eliminar este producto"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-3 p-4 bg-white border border-slate-200/80 rounded-2xl shadow-xs">
                <div className="text-xs font-black text-slate-500 uppercase tracking-wide">
                  Mostrando <span className="text-[#043077] font-mono">{(currentPage - 1) * 5 + 1}</span> a <span className="text-[#043077] font-mono">{Math.min(currentPage * 5, filteredProducts.length)}</span> de <span className="text-slate-700 font-mono">{filteredProducts.length}</span> productos
                </div>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    className="px-3 py-1.5 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:hover:bg-white text-slate-700 text-xs font-black border border-slate-200 rounded-xl cursor-pointer transition-all focus:outline-none flex items-center gap-1"
                  >
                    ◀️ Anterior
                  </button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => {
                    const isSelected = page === currentPage;
                    const shouldShow = totalPages <= 6 || Math.abs(page - currentPage) <= 1 || page === 1 || page === totalPages;
                    
                    if (!shouldShow) {
                      if (page === 2 || page === totalPages - 1) {
                        return <span key={`dots-${page}`} className="text-slate-400 text-xs px-1 select-none">...</span>;
                      }
                      return null;
                    }

                    return (
                      <button
                        key={page}
                        type="button"
                        onClick={() => setCurrentPage(page)}
                        className={`w-8 h-8 flex items-center justify-center text-xs font-black rounded-xl cursor-pointer transition-all focus:outline-none ${
                          isSelected
                            ? 'bg-[#043077] text-white border border-[#043077]'
                            : 'bg-white hover:bg-slate-50 text-slate-700 border border-slate-200'
                        }`}
                      >
                        {page}
                      </button>
                    );
                  })}
                  <button
                    type="button"
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    className="px-3 py-1.5 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:hover:bg-white text-slate-700 text-xs font-black border border-slate-200 rounded-xl cursor-pointer transition-all focus:outline-none flex items-center gap-1"
                  >
                    Siguiente ▶️
                  </button>
                </div>
              </div>
            )}

            {/* Sticky multi-selection floating bar */}
            <AnimatePresence>
              {selectedCount > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 50 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 50 }}
                  className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 bg-slate-900 text-white rounded-2xl p-4 shadow-2xl border border-slate-700 flex flex-col sm:flex-row items-center gap-4 max-w-[calc(100vw-3rem)] w-full sm:w-auto"
                >
                  <div className="text-left">
                    <span className="text-xs text-slate-400 font-bold block uppercase tracking-wider">Acción en Lote</span>
                    <span className="text-sm font-black text-white">{selectedCount} productos seleccionados</span>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleExcelExport(selectedProductsList)}
                      className="px-3 py-2 bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-extrabold rounded-xl transition-all cursor-pointer flex items-center gap-1"
                    >
                      <FileSpreadsheet className="w-3.5 h-3.5" /> Descargar Excel
                    </button>
                    <button
                      type="button"
                      onClick={() => handlePdfExport(selectedProductsList)}
                      className="px-3 py-2 bg-red-700 hover:bg-red-600 text-white text-xs font-extrabold rounded-xl transition-all cursor-pointer flex items-center gap-1"
                    >
                      <FileText className="w-3.5 h-3.5" /> Descargar PDF
                    </button>
                    <button
                      type="button"
                      onClick={() => handleBulkToggleStatus('Activo')}
                      className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-emerald-400 text-xs font-extrabold rounded-xl transition-all cursor-pointer"
                    >
                      Activar
                    </button>
                    <button
                      type="button"
                      onClick={() => handleBulkToggleStatus('Inactivo')}
                      className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-rose-400 text-xs font-extrabold rounded-xl transition-all cursor-pointer"
                    >
                      Desactivar
                    </button>
                    <button
                      type="button"
                      onClick={handleBulkDelete}
                      className="px-3 py-2 bg-red-600 hover:bg-red-500 text-white text-xs font-extrabold rounded-xl transition-all cursor-pointer flex items-center gap-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> Borrar
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedItems({})}
                      className="p-2 text-slate-400 hover:text-white rounded-lg focus:outline-none cursor-pointer"
                      title="Limpiar selección actual"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* FORM MODAL ADD AND EDIT */}
            <AnimatePresence>
              {isFormOpen && (
                <div id="product-form-overlay" className="fixed inset-0 z-50 flex items-center justify-center p-4">
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 0.6 }}
                    exit={{ opacity: 0 }}
                    onClick={() => setIsFormOpen(false)}
                    className="absolute inset-0 bg-stone-900"
                  />
                  <motion.div
                    initial={{ scale: 0.95, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.95, opacity: 0 }}
                    className="bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden relative max-w-2xl w-full max-h-[90vh] flex flex-col"
                  >
                    {/* Header border line */}
                    <div className="h-1.5 w-full bg-[#043077]" />

                    <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                      <h4 className="text-lg font-black text-slate-900">
                        {editingItem ? 'Editar Producto Catálogo' : 'Registrar Nuevo Producto'}
                      </h4>
                      <button
                        type="button"
                        onClick={() => setIsFormOpen(false)}
                        className="p-1 px-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-500 cursor-pointer"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    <form onSubmit={handleFormSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
                      
                      {/* Código de barras / sku / identificador */}
                      <div>
                        <label className="text-xs font-black text-slate-600 block mb-1">Código</label>
                        <input
                          type="text"
                          value={form.codigo}
                          onChange={(e) => handleFormChange('codigo', e.target.value)}
                          placeholder="Ej: REF-7210928"
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#043077] text-slate-800 font-mono"
                        />
                      </div>

                      {/* Name row */}
                      <div>
                        <label className="text-xs font-black text-slate-600 block mb-1">Nombre del producto *</label>
                        <input
                          type="text"
                          required
                          value={form.nombre}
                          onChange={(e) => handleFormChange('nombre', e.target.value)}
                          placeholder="Ej: Café Latte Sabores Premium 16oz"
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#043077] text-slate-800"
                        />
                      </div>

                      {/* Proveedor */}
                      <div>
                        <label className="text-xs font-black text-slate-600 block mb-1">Proveedor</label>
                        <input
                          type="text"
                          value={form.proveedor}
                          onChange={(e) => handleFormChange('proveedor', e.target.value)}
                          placeholder="Ej: Distribuidora Central de Café"
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#043077] text-slate-800"
                        />
                      </div>

                      {/* Piezas por caja */}
                      <div>
                        <label className="text-xs font-black text-slate-600 block mb-1">Piezas por caja</label>
                        <input
                          type="number"
                          value={form.piezas_por_caja || ''}
                          onChange={(e) => handleFormChange('piezas_por_caja', Number(e.target.value))}
                          placeholder="Ej: 24"
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#043077] text-slate-800 font-mono"
                        />
                      </div>

                      {/* Split cost and status info */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="text-xs font-black text-slate-600 block mb-1">Precio caja (Costo)</label>
                          <input
                            type="number"
                            step="any"
                            value={form.precio_caja || ''}
                            onChange={(e) => handleFormChange('precio_caja', Number(e.target.value))}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#043077] text-slate-800 font-mono"
                          />
                        </div>
                        <div>
                          <label className="text-xs font-black text-slate-600 block mb-1">Precio unitario *</label>
                          <input
                            type="number"
                            step="any"
                            required
                            value={form.precio_unidad || ''}
                            onChange={(e) => handleFormChange('precio_unidad', Number(e.target.value))}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#043077] text-slate-800 font-mono"
                          />
                        </div>
                      </div>

                      {/* Dropdowns status y pago (Movidos después de Precio unitario) */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="text-xs font-black text-slate-600 block mb-1">Estado Catálogo</label>
                          <select
                            value={form.status}
                            onChange={(e) => handleFormChange('status', e.target.value)}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#043077] text-slate-800 font-bold"
                          >
                            <option value="Activo">🟢 Activo</option>
                            <option value="Inactivo">🔴 Inactivo</option>
                          </select>
                        </div>
                        <div>
                          <label className="text-xs font-black text-slate-600 block mb-1">Forma de Pago Asociada</label>
                          <select
                            value={form.forma_pago}
                            onChange={(e) => handleFormChange('forma_pago', e.target.value)}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#043077] text-slate-800 font-bold"
                          >
                            <option value="Efectivo">💵 Efectivo</option>
                            <option value="Tarjeta bancaria">💳 Tarjeta bancaria</option>
                          </select>
                        </div>
                      </div>

                      {/* Sell price and auto margins */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                        <div>
                          <label className="text-xs font-black text-slate-600 block mb-1">Precio Regular *</label>
                          <div className="relative">
                            <span className="absolute left-3.5 top-3.5 text-slate-400 text-xs font-bold">$</span>
                            <input
                              type="number"
                              required
                              step="any"
                              value={form.precio_venta}
                              onChange={(e) => handleFormChange('precio_venta', Number(e.target.value))}
                              className="w-full bg-white border border-slate-200 rounded-xl pl-8 pr-4 py-2.5 text-sm focus:outline-none focus:border-[#043077] text-slate-800 font-extrabold font-mono"
                            />
                          </div>
                          <span className="text-[10px] text-emerald-600 font-bold mt-1.5 block">
                            Precio regular actual
                          </span>
                        </div>

                        <div>
                          <label className="text-xs font-black text-slate-600 block mb-1">Margen de ganancia</label>
                          <div className="relative">
                            <input
                              type="text"
                              readOnly
                              disabled
                              value={`${form.margen_pct}%`}
                              className="w-full bg-slate-100/80 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-emerald-800 font-extrabold font-mono"
                            />
                          </div>
                          <span className="text-[10px] text-emerald-600 font-bold mt-1.5 block">
                            Porcentaje de ganancia calculado
                          </span>
                        </div>

                        <div>
                          <label className="text-xs font-black text-slate-600 block mb-1">Precio de venta</label>
                          <div className="relative">
                            <span className="absolute left-3.5 top-3.5 text-slate-400 text-xs font-bold">$</span>
                            <input
                              type="number"
                              step="any"
                              value={form.precio_sugerido}
                              onChange={(e) => handleFormChange('precio_sugerido', Number(e.target.value))}
                              className="w-full bg-white border border-slate-200 rounded-xl pl-8 pr-4 py-2.5 text-sm focus:outline-none focus:border-[#043077] text-slate-800 font-extrabold font-mono"
                            />
                          </div>
                          <span className="text-[10px] text-[#043077] font-black mt-1.5 block">
                            MARGEN PS: {form.margen_ps_pct}%
                          </span>
                        </div>
                      </div>

                      {/* Fecha de cambio de precio */}
                      <div>
                        <label className="text-xs font-black text-slate-600 block mb-1">Cambio de Precio (Fecha)</label>
                        <input
                          type="date"
                          value={form.cambio_precio_fecha}
                          onChange={(e) => handleFormChange('cambio_precio_fecha', e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#043077] text-slate-800 font-mono"
                        />
                      </div>

                      {/* Notes area */}
                      <div>
                        <label className="text-xs font-black text-slate-600 block mb-1">Notas</label>
                        <textarea
                          rows={3}
                          value={form.notas}
                          onChange={(e) => handleFormChange('notas', e.target.value)}
                          placeholder="Notas internas, detalles del producto o comentarios..."
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#043077] text-slate-800"
                        ></textarea>
                      </div>

                      {/* Resorte que usa (Movido después de Notas) */}
                      <div>
                        <label className="text-xs font-black text-slate-600 block mb-1">Tamaño de resorte</label>
                        <input
                          type="text"
                          value={form.resorte_usa}
                          onChange={(e) => handleFormChange('resorte_usa', e.target.value)}
                          placeholder="Ej: 58mm"
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#043077] text-slate-800"
                        />
                      </div>

                    </form>

                    <div className="p-6 border-t border-slate-100 flex items-center justify-end gap-3 bg-slate-50">
                      <button
                        type="button"
                        onClick={() => setIsFormOpen(false)}
                        className="px-5 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-600 text-sm font-extrabold cursor-pointer"
                      >
                        Cancelar
                      </button>
                      <button
                        type="button"
                        onClick={handleFormSubmit}
                        disabled={!form.nombre.trim()}
                        className="px-6 py-2.5 rounded-xl bg-[#043077] hover:opacity-90 disabled:opacity-50 text-white text-sm font-extrabold cursor-pointer"
                      >
                        {editingItem ? 'Guardar Cambios' : 'Confirmar Registro'}
                      </button>
                    </div>

                  </motion.div>
                </div>
              )}
            </AnimatePresence>

            {/* EXCEL IMPORT PREVIEW MODAL */}
            <AnimatePresence>
              {importSummary && (
                <div id="import-preview-overlay" className="fixed inset-0 z-50 flex items-center justify-center p-4">
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 0.6 }}
                    exit={{ opacity: 0 }}
                    onClick={() => { if (!isImportingProgress) setImportSummary(null); }}
                    className="absolute inset-0 bg-stone-900"
                  />
                  <motion.div
                    initial={{ scale: 0.95, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.95, opacity: 0 }}
                    className="bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden relative max-w-4xl w-full max-h-[90vh] flex flex-col z-10"
                  >
                    {/* Header line themed in corporate navy blue */}
                    <div className="h-1.5 w-full bg-[#043077]" />

                    <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                      <div>
                        <h4 className="text-lg font-black text-slate-950 flex items-center gap-2">
                          <FileSpreadsheet className="w-5 h-5 text-emerald-600" /> Previsualizar Importación de Excel
                        </h4>
                        <p className="text-xs text-slate-500 font-bold mt-1">
                          Archivo: <span className="font-mono text-[#043077]">{importSummary.fileName}</span> — {importSummary.items.length} productos detectados
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => { if (!isImportingProgress) setImportSummary(null); }}
                        className="p-1 px-2 hover:bg-slate-200 rounded-lg text-slate-500 font-bold transition focus:outline-none cursor-pointer"
                        disabled={isImportingProgress}
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                     {/* Explanatory banner */}
                    <div className="px-6 py-3 bg-blue-50 border-b border-blue-100 flex items-center gap-2.5 text-xs text-blue-800 font-extrabold">
                      <span className="flex h-2 w-2 rounded-full bg-blue-500 animate-pulse shrink-0"></span>
                      <span>Detección inteligente de columnas activada. Los márgenes y precios de venta se recalculan dinámicamente si cambias el mapeo.</span>
                    </div>

                    {/* Collapsible Column Settings with instant re-parsing feedback */}
                    <div className="px-6 py-4 bg-slate-50 border-b border-slate-100 max-h-[220px] overflow-y-auto">
                      <details className="group" open>
                        <summary className="flex items-center justify-between cursor-pointer text-xs font-black text-slate-800 select-none">
                          <span className="flex items-center gap-2">
                            <Settings className="w-4 h-4 text-[#043077] animate-spin-slow" />
                            AJUSTAR ASIGNACIÓN DE COLUMNAS (MODO MANUAL / INTELIGENTE)
                          </span>
                          <span className="text-[#043077] hover:underline text-[11px] font-bold">
                            Ver/Ocultar selectores
                          </span>
                        </summary>
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 mt-4 text-xs">
                          {PRODUCT_FIELDS.map(f => {
                            const currentIdx = importSummary.colMap[f.key];
                            return (
                              <div key={f.key} className="flex flex-col gap-1 p-2 bg-white border border-slate-200 rounded-xl shadow-2xs">
                                <span className="font-bold text-slate-800 truncate text-[11px]">{f.label}</span>
                                <select
                                  value={currentIdx !== undefined ? currentIdx : -1}
                                  onChange={(e) => handleMapChange(f.key, parseInt(e.target.value))}
                                  className="w-full text-[11px] font-semibold p-1.5 bg-slate-50 rounded-lg border border-slate-200 text-slate-800 focus:outline-none focus:ring-1 focus:ring-[#043077] cursor-pointer"
                                >
                                  <option value={-1}>-- No emparejado / Auto --</option>
                                  {importSummary.headers.map((h, hIdx) => (
                                    <option key={hIdx} value={hIdx}>
                                      Col {hIdx + 1}: {h || `(Vacía)`}
                                    </option>
                                  ))}
                                </select>
                              </div>
                            );
                          })}
                        </div>
                      </details>
                    </div>

                    <div className="flex-1 overflow-y-auto p-6 max-h-[50vh]">
                      <div className="overflow-x-auto rounded-xl border border-slate-200 shadow-xs">
                        <table className="min-w-full divide-y divide-slate-200 text-left">
                          <thead className="bg-slate-100">
                            <tr>
                              <th className="px-4 py-3 text-xs font-black text-slate-600 uppercase tracking-wider">Código</th>
                              <th className="px-4 py-3 text-xs font-black text-slate-600 uppercase tracking-wider">Nombre del Producto</th>
                              <th className="px-4 py-3 text-xs font-black text-slate-600 uppercase tracking-wider">Proveedor</th>
                              <th className="px-4 py-3 text-xs font-black text-slate-600 uppercase tracking-wider">Pzas/Caja</th>
                              <th className="px-4 py-3 text-xs font-black text-slate-600 uppercase tracking-wider text-right">Precio Caja</th>
                              <th className="px-4 py-3 text-xs font-black text-slate-600 uppercase tracking-wider text-right">Precio Unitario</th>
                              <th className="px-4 py-3 text-xs font-black text-slate-600 uppercase tracking-wider text-right text-indigo-905 bg-indigo-50/50">Venta Pública</th>
                              <th className="px-4 py-3 text-xs font-black text-slate-600 uppercase tracking-wider text-center text-emerald-905 bg-emerald-50/50">Margen Calculado</th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-slate-200 min-h-0">
                            {importSummary.items.slice(0, 50).map((p, idx) => (
                              <tr key={idx} className="hover:bg-slate-50/70 text-slate-700">
                                <td className="px-4 py-2.5 text-xs font-mono font-bold text-[#043077]">{p.codigo || 'AUTO'}</td>
                                <td className="px-4 py-2.5 text-xs font-black text-slate-900 truncate max-w-[180px]">{p.nombre}</td>
                                <td className="px-4 py-2.5 text-xs text-slate-500 font-bold">{p.proveedor}</td>
                                <td className="px-4 py-2.5 text-xs text-slate-500 font-medium font-mono text-center">{p.piezas_por_caja || '-'}</td>
                                <td className="px-4 py-2.5 text-xs font-mono text-right">{p.precio_caja > 0 ? `$${p.precio_caja.toFixed(2)}` : '-'}</td>
                                <td className="px-4 py-2.5 text-xs font-mono text-right font-semibold">${p.precio_unidad.toFixed(2)}</td>
                                <td className="px-4 py-2.5 text-xs font-mono text-right font-black text-indigo-700 bg-indigo-50/20">${p.precio_venta.toFixed(2)}</td>
                                <td className="px-4 py-2.5 text-xs font-mono text-center font-black text-emerald-700 bg-emerald-50/20">{p.margen_pct.toFixed(1)}%</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                      {importSummary.items.length > 50 && (
                        <div className="text-center text-xs text-slate-500 font-bold mt-3 italic">
                          * Mostrando los primeros 50 de {importSummary.items.length} productos detectados
                        </div>
                      )}
                    </div>

                    <div className="p-6 border-t border-slate-100 flex items-center justify-between bg-slate-50">
                      <span className="text-xs text-slate-500 font-bold shrink-0">
                        Total a procesar: <span className="text-slate-800 font-black text-sm">{importSummary.items.length} productos</span>
                      </span>
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={() => { if (!isImportingProgress) setImportSummary(null); }}
                          className="px-5 py-2.5 rounded-xl border border-slate-300 hover:bg-slate-100 text-slate-600 text-sm font-extrabold cursor-pointer transition focus:outline-none"
                          disabled={isImportingProgress}
                        >
                          Cancelar
                        </button>
                        <button
                          type="button"
                          onClick={handleConfirmImport}
                          disabled={isImportingProgress}
                          className="px-6 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white text-sm font-extrabold cursor-pointer flex items-center gap-2 transition focus:outline-none"
                        >
                          {isImportingProgress ? (
                            <>
                              <div className="w-4 h-4 border-2 border-white/50 border-t-white rounded-full animate-spin"></div>
                              Registrando en base de datos...
                            </>
                          ) : (
                            <>
                              <Check className="w-4 h-4" /> Importar {importSummary.items.length} Productos
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </motion.div>
                </div>
              )}
            </AnimatePresence>

            {/* VIEW DETAILS DIALOG MODEL */}
            <AnimatePresence>
              {viewingItem && (
                <div id="product-details-overlay" className="fixed inset-0 z-50 flex items-center justify-center p-4">
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 0.6 }}
                    exit={{ opacity: 0 }}
                    onClick={() => setViewingItem(null)}
                    className="absolute inset-0 bg-stone-900"
                  />
                  <motion.div
                    initial={{ scale: 0.95, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.95, opacity: 0 }}
                    className="bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden relative max-w-xl w-full p-6 text-left"
                  >
                    {/* Header line */}
                    <div className="h-1.5 w-full bg-[#043077] absolute top-0 left-0" />
                    
                    <div className="flex justify-between items-center border-b border-slate-100 pb-4 mb-4">
                      <div>
                        <div className="flex flex-wrap gap-1.5 items-center">
                          <span className="text-[9px] font-black uppercase text-[#043077] tracking-widest block">ID: {viewingItem.id.slice(0, 8)}</span>
                          {viewingItem.codigo && (
                            <span className="text-[9px] font-mono font-bold bg-[#043077]/10 text-[#043077] px-1.5 py-0.5 rounded uppercase font-bold">
                              Cód: {viewingItem.codigo}
                            </span>
                          )}
                        </div>
                        <h4 className="text-lg font-black text-slate-900 mt-1">{viewingItem.nombre}</h4>
                        {viewingItem.proveedor && (
                          <span className="text-xs font-semibold text-slate-500 block mt-0.5">
                            Proveedor: <span className="font-bold text-slate-700">{viewingItem.proveedor}</span>
                          </span>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => setViewingItem(null)}
                        className="p-1 px-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-400 cursor-pointer focus:outline-none"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="space-y-4 text-sm">
                      
                      {/* Cost values card block */}
                      <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl">
                        <span className="text-xs text-slate-400 font-extrabold block uppercase">Costo y Presentación</span>
                        <div className="flex flex-wrap justify-between items-center mt-1">
                          <div>
                            <span className="text-xs text-slate-500 font-bold block">Precio Unitario:</span>
                            <span className="text-base font-extrabold text-slate-800 font-mono">{formatMXN(viewingItem.precio_unidad)}</span>
                          </div>
                          <div>
                            <span className="text-xs text-slate-500 font-bold block">Precio Caja Costo:</span>
                            <span className="text-base font-extrabold text-slate-800 font-mono">{formatMXN(viewingItem.precio_caja)}</span>
                          </div>
                          {safeVal(viewingItem.piezas_por_caja) > 0 && (
                            <div>
                              <span className="text-xs text-slate-500 font-bold block">Piezas por caja:</span>
                              <span className="text-base font-extrabold text-slate-800 font-mono">{safeVal(viewingItem.piezas_por_caja)}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Pricing matrix block */}
                      <div className="grid grid-cols-2 gap-3 bg-blue-50/25 p-4 rounded-2xl border border-blue-100/30">
                        <div>
                          <span className="text-xs text-slate-500 font-extrabold block uppercase">Precio de Venta</span>
                          <span className="text-xl font-black text-slate-900 font-mono">{formatMXN(viewingItem.precio_venta)}</span>
                          <span className="inline-flex items-center gap-0.5 mt-1 px-2.5 py-0.5 rounded-full text-[11px] font-black bg-emerald-100 text-emerald-800 text-center">
                            Margen: {safeVal(viewingItem.margen_pct).toFixed(1)}%
                          </span>
                        </div>
                        <div>
                          <span className="text-xs text-slate-500 font-extrabold block uppercase">Precio Sugerido Alterno</span>
                          <span className="text-xl font-black text-[#043077] font-mono">{formatMXN(viewingItem.precio_sugerido)}</span>
                          <span className="inline-flex items-center gap-0.5 mt-1 px-2.5 py-0.5 rounded-full text-[11px] font-black bg-[#043077]/10 text-[#043077] text-center">
                            Margen: {safeVal(viewingItem.margen_ps_pct).toFixed(1)}%
                          </span>
                        </div>
                      </div>

                      {/* Margen de ganancia */}
                      <div className="pt-2">
                        <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-100">
                          <span className="text-xs text-emerald-700 font-extrabold block uppercase">Margen de ganancia</span>
                          <span className="text-lg font-black text-emerald-800 font-mono">
                            {safeVal(viewingItem.margen_pct).toFixed(1)}%
                          </span>
                          <span className="text-[10px] text-emerald-600 block mt-0.5">
                            Ganancia neta directa de {formatMXN(safeVal(viewingItem.precio_venta) - safeVal(viewingItem.precio_unidad))} por unidad.
                          </span>
                        </div>
                      </div>

                      {/* Payment, change status metrics */}
                      <div className="grid grid-cols-3 gap-2 border-t border-slate-100 pt-3 text-xs">
                        <div>
                          <span className="text-slate-400 font-extrabold block uppercase text-[9px]">Forma Pago</span>
                          <span className="font-bold text-slate-800">{viewingItem.forma_pago}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 font-extrabold block uppercase text-[9px]">Ult. Cambio de Pr.</span>
                          <span className="font-bold text-[#043077] font-mono">{viewingItem.cambio_precio_fecha || 'No registrado'}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 font-extrabold block uppercase text-[9px]">Fecha Registro</span>
                          <span className="font-bold text-slate-800 font-mono">
                            {viewingItem.created_at ? new Date(viewingItem.created_at).toLocaleDateString() : new Date().toLocaleDateString()}
                          </span>
                        </div>
                      </div>

                      {viewingItem.notas && (
                        <div className="border-t border-slate-100 pt-3">
                          <span className="text-xs text-slate-400 font-extrabold block">Comentarios / Notas Internas</span>
                          <p className="text-xs text-slate-600 bg-slate-50 p-2.5 rounded-lg border border-slate-100/50 mt-1 italic leading-relaxed">
                            "{viewingItem.notas}"
                          </p>
                        </div>
                      )}

                      {viewingItem.resorte_usa && (
                        <div className="border-t border-slate-100 pt-3">
                          <span className="text-xs text-slate-400 font-extrabold block">Tamaño de resorte</span>
                          <span className="font-extrabold text-slate-700 text-xs block mt-1">
                            {viewingItem.resorte_usa}
                          </span>
                        </div>
                      )}

                    </div>

                    <div className="mt-6 flex justify-end">
                      <button
                        type="button"
                        onClick={() => setViewingItem(null)}
                        className="px-5 py-2.5 rounded-xl bg-slate-900 border border-slate-900 hover:bg-slate-800 text-white text-xs font-black uppercase tracking-wider cursor-pointer"
                      >
                        Cerrar Ventana
                      </button>
                    </div>

                  </motion.div>
                </div>
              )}
            </AnimatePresence>

          </div>
        );

      case 'supply': {
        const filteredCards = surtidoCards;

        const defaultInventoryProducts = [
          { id: 'p_cg1', codigo: 'CG1-P', nombre: 'Cartones de Empaque CG1', proveedor: 'Proveedora General S.A.', precio_venta: 12.50 },
          { id: 'p_cg2', codigo: 'CG2-P', nombre: 'Cartones de Empaque CG2', proveedor: 'Proveedora General S.A.', precio_venta: 18.00 },
          { id: 'p_cg3', codigo: 'CG3-P', nombre: 'Cartones de Empaque CG3', proveedor: 'Proveedora General S.A.', precio_venta: 24.50 },
          { id: 'p_alt', codigo: 'ALT-INS', nombre: 'Insumo Alternativo Plus', proveedor: 'Distribuidora del Centro', precio_venta: 8.50 },
          { id: 'p_vit', codigo: 'VIT-BB', nombre: 'Botellas de Vidrio Bebidas 350ml', proveedor: 'Vitromex', precio_venta: 14.00 },
          { id: 'p_pk', codigo: 'PK-EMP', nombre: 'Artículos Empaque Combo-Pack', proveedor: 'Industrial Cajas', precio_venta: 32.00 },
          { id: 'p_cer1', codigo: 'CER-1', nombre: 'Taza Cerámica Artisan White 8oz', proveedor: 'Vajillas Oaxaca', precio_venta: 110.00 },
          { id: 'p_cer2', codigo: 'CER-2', nombre: 'Taza Cerámica Artisan Black 12oz', proveedor: 'Vajillas Oaxaca', precio_venta: 130.00 },
          { id: 'p_cerbb', codigo: 'CER-BB', nombre: 'Jarros Infantiles Petit', proveedor: 'Vajillas Oaxaca', precio_venta: 85.00 },
          { id: 'p_cafe', codigo: 'CAF-EXP', nombre: 'Grano de Café Veracruz (Espresso)', proveedor: 'Cafetalera Coatepec', precio_venta: 290.00 },
        ];

        const availableProducts = products.length > 0 ? products : defaultInventoryProducts;

        const handleStockChange = (id: string, delta: number) => {
          setSurtidoCards(prev => prev.map(c => {
            if (c.id === id) {
              const newStock = Math.max(0, Math.min(c.maxStock, c.stock + delta));
              return { ...c, stock: newStock };
            }
            return c;
          }));
        };

        const handleSetStockDirect = (id: string, val: number) => {
          setSurtidoCards(prev => prev.map(c => {
            if (c.id === id) {
              const cleanVal = Math.max(0, Math.min(c.maxStock, isNaN(val) ? 0 : val));
              return { ...c, stock: cleanVal };
            }
            return c;
          }));
        };

        const handleRestockToMax = (id: string) => {
          setSurtidoCards(prev => prev.map(c => {
            if (c.id === id) {
              return { ...c, stock: c.maxStock };
            }
            return c;
          }));
        };

        const handleAddSessionRefill = (product: any, amount: number) => {
          if (!product) return;
          setSessionRefills(prev => {
            const existingIndex = prev.findIndex(item => item.id === product.id || item.codigo === product.codigo);
            if (existingIndex > -1) {
              const updated = [...prev];
              updated[existingIndex] = {
                ...updated[existingIndex],
                amount: updated[existingIndex].amount + amount
              };
              return updated;
            } else {
              return [...prev, {
                id: product.id || product.codigo || String(Math.random()),
                name: product.nombre || product.name,
                codigo: product.codigo || 'N/D',
                price: product.precio_venta || 0,
                amount: amount
              }];
            }
          });
          setRefillAmount(1);
        };

        const handleDeleteSessionRefill = (id: string) => {
          setSessionRefills(prev => prev.filter(item => item.id !== id));
        };

        const handleSaveAllSessionRefills = (machineId: string) => {
          if (sessionRefills.length === 0) return;
          setSurtidoCards(prev => prev.map(c => {
            if (c.id === machineId) {
              const totalAmount = sessionRefills.reduce((sum, item) => sum + item.amount, 0);
              const newStock = Math.min(c.maxStock, c.stock + totalAmount);
              const now = new Date();
              const hours = String(now.getHours()).padStart(2, '0');
              const minutes = String(now.getMinutes()).padStart(2, '0');
              const timestamp = `Hoy ${hours}:${minutes}`;
              
              const productNames = sessionRefills.map(item => item.name).join(', ');
              
              return {
                ...c,
                stock: newStock,
                fillCount: (c.fillCount || 0) + 1,
                totalFilledAmount: (c.totalFilledAmount || 0) + totalAmount,
                lastFilledDate: timestamp,
                loadedProduct: productNames.length > 35 ? `${sessionRefills.length} productos` : productNames
              };
            }
            return c;
          }));
          setActiveRefillMachineId(null);
          setSelectedRefillProduct(null);
          setSessionRefills([]);
          setProductCounts({});
        };

        const activeMachine = surtidoCards.find(c => c.id === activeRefillMachineId);

        // Filter products list inside the modal/form
        const filteredProductsToSelect = availableProducts.filter(p => {
          const term = refillSearch.toLowerCase();
          return (p.nombre || p.name || '').toLowerCase().includes(term) ||
                 (p.codigo || p.id || '').toLowerCase().includes(term);
        });

        const findMatchingProduct = (r: any) => {
          if (!r) return null;
          let code = (r.codigo || '').trim().toLowerCase();
          let name = (r.nombre_producto || '').trim().toLowerCase();
          
          if (r.values) {
            const keys = Object.keys(r.values);
            const foundCodeKey = keys.find(k => {
              const cleanK = k.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]/g, "").trim();
              return cleanK.includes('codigo') || cleanK.includes('sku') || cleanK.includes('codig');
            });
            if (foundCodeKey) {
              code = String(r.values[foundCodeKey] || '').trim().toLowerCase();
            }
            const foundNameKey = keys.find(k => {
              const cleanK = k.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]/g, "").trim();
              return cleanK.includes('nombre') || cleanK.includes('producto') || cleanK.includes('articulo');
            });
            if (foundNameKey) {
              name = String(r.values[foundNameKey] || '').trim().toLowerCase();
            }
          }
          if (!code && !name) return null;
          return (products || []).find(p => {
            const pCode = (p.codigo || '').trim().toLowerCase();
            const pName = (p.nombre || '').trim().toLowerCase();
            if (code && pCode && code === pCode) return true;
            if (name && pName && name === pName) return true;
            return false;
          });
        };

        // Dynamic Comparable Value Helper for Surtido records table sorting
        const getSupplyRowCompareValue = (row: any, field: string): any => {
          if (!row) return '';

          // If the field is a price field, dynamically look up the matching product's price from products catalog!
          const cleanF = field.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]/g, "").trim();
          const isPriceField = cleanF.includes('precio') || cleanF.includes('venta') || cleanF.includes('vta') || cleanF.includes('price') || cleanF === 'sinacuerdo' || cleanF === 'regular';
          if (isPriceField) {
            const matchedProd = findMatchingProduct(row);
            if (matchedProd && matchedProd.precio_venta !== undefined) {
              return safeVal(matchedProd.precio_venta);
            }
          }

          // 1. Prioritize dynamic values (case-insensitive & trimmed matching of the field name in values map)
          if (row.values) {
            let lookupFields = [field];
            const cleanField = field.toLowerCase().trim().replace(/_/g, ' ').replace(/\./g, '');
            if (cleanField === 'precio regular' || cleanField === 'precio_regular' || cleanField === 'regular') {
              lookupFields.push('Precio sin acuerdo', 'precio sin acuerdo', 'precios sin acuerdo', 'Precio regular', 'precio_regular');
            }

            for (const f of lookupFields) {
              if (row.values[f] !== undefined) {
                return row.values[f];
              }
              const foundKey = Object.keys(row.values).find(k => k.toLowerCase().trim() === f.toLowerCase().trim());
              if (foundKey && row.values[foundKey] !== undefined) {
                return row.values[foundKey];
              }
            }
          }

          if (field === 'codigo') return row.codigo || '';
          if (field === 'nombre_producto') return row.nombre_producto || '';
          if (field === 'unidad_surtida') return safeVal(row.unidad_surtida);
          if (field === 'costo_surtido') return safeVal(row.costo_surtido);
          if (field === 'precio_venta') return safeVal(row.precio_venta);
          if (field === 'resorte') return row.resorte || '';
          if (field === 'notas') return row.notas || '';
          if (field === 'fecha_registro') return row.fecha_registro || '';
          if (field.toUpperCase() === 'SEL' || field.toLowerCase() === 'seleccion') {
            return row.sel || row.seleccion || '';
          }

          const cleanField = field.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]/g, "").trim();
          if (cleanField === 'sel' || cleanField === 'seleccion' || cleanField === 'slot' || cleanField === 'seleccionnum') {
            return row.sel || row.seleccion || '';
          }
          if (cleanField.includes('codigo') || cleanField.includes('sku') || cleanField.includes('codig')) {
            return row.codigo || '';
          }
          if (cleanField.includes('nombre') || cleanField.includes('producto') || cleanField.includes('articulo')) {
            return row.nombre_producto || '';
          }
          if (cleanField.includes('unidad') || cleanField.includes('surtir') || cleanField.includes('cantidad') || cleanField.includes('unidades')) {
            return safeVal(row.unidad_surtida);
          }
          if (cleanField.includes('costo')) {
            return safeVal(row.costo_surtido);
          }
          if (cleanField.includes('precio') || cleanField.includes('venta') || cleanField.includes('vta') || cleanField.includes('price')) {
            return safeVal(row.precio_venta);
          }
          if (cleanField === 'resor' || cleanField === 'resort' || cleanField === 'resorte') {
            return row.resorte || '';
          }
          if (cleanField === 'notas') {
            return row.notas || '';
          }
          if (cleanField.startsWith('fecha')) {
            if (row.values && row.values[field] !== undefined) return row.values[field];
            return row.fecha || row.fecha_registro || row.fecha_surtido || '';
          }

          const keys = Object.keys(row);
          const foundKey = keys.find(k => k.toLowerCase() === field.toLowerCase());
          if (foundKey) return row[foundKey];

          return '';
        };

        // Numerical & string comparison helper
        const compareVals = (aVal: any, bVal: any): number => {
          if (typeof aVal === 'number' && typeof bVal === 'number') {
            return aVal - bVal;
          }
          const numA = Number(String(aVal).trim());
          const numB = Number(String(bVal).trim());
          if (!isNaN(numA) && !isNaN(numB)) {
            return numA - numB;
          }
          return String(aVal).toLowerCase().localeCompare(String(bVal).toLowerCase(), 'es', { numeric: true, sensitivity: 'base' });
        };

        // Interactive sort controller
        const handleSupplySort = (field: string) => {
          if (supplySortField === field) {
            setSupplySortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
          } else {
            setSupplySortField(field);
            setSupplySortDirection('asc');
          }
        };

        // Render sortable header helper for supply table
        const renderSupplySortableHeader = (label: string, field: string) => {
          const isSorted = supplySortField === field;
          const cleanF = field.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]/g, "").trim();
          const isNameColumn = cleanF.includes('nombre') || cleanF.includes('producto') || cleanF.includes('articulo') || cleanF.includes('description');
          const isFecha = cleanF.startsWith('fecha');
          const isRemovableFecha = isFecha && label.toLowerCase().trim() !== 'fecha';

          return (
            <th key={field} className={`py-3 px-3 select-none ${isNameColumn ? 'w-full min-w-[240px]' : 'w-px whitespace-nowrap'}`}>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => handleSupplySort(field)}
                  className={`flex items-center gap-1 hover:text-[#043077] transition-colors focus:outline-none cursor-pointer uppercase text-[10px] sm:text-[11px] text-slate-500 font-extrabold ${
                    isSorted ? 'text-[#043077] font-black' : ''
                  }`}
                  title={`Click para ordenar por ${label}`}
                >
                  <span className="tracking-wider">{label}</span>
                  <span className="inline-flex items-center justify-center">
                    {isSorted ? (
                      supplySortDirection === 'asc' ? (
                        <ChevronUp className="w-3.5 h-3.5 text-[#043077]" />
                      ) : (
                        <ChevronDown className="w-3.5 h-3.5 text-[#043077]" />
                      )
                    ) : (
                      <ArrowUpDown className="w-3 h-3 text-slate-300 hover:text-slate-400" />
                    )}
                  </span>
                </button>

                {isFecha && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleAddFechaColumn();
                    }}
                    className="p-1 rounded bg-indigo-50 hover:bg-indigo-100 text-[#043077] hover:text-indigo-900 border border-indigo-200 transition-all flex items-center gap-0.5 text-[9px] font-black shadow-2xs cursor-pointer"
                    title="Añadir otra columna de Fecha sin límite (+)"
                  >
                    <Plus className="w-3 h-3 stroke-[3]" />
                  </button>
                )}

                {isRemovableFecha && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRemoveColumn(label);
                    }}
                    className="p-0.5 rounded hover:bg-rose-50 text-slate-300 hover:text-rose-600 transition-all cursor-pointer"
                    title={`Eliminar columna ${label}`}
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </th>
          );
        };

        // Submenu state helpers
        const getActiveSubmenuData = (): any[] => {
          switch (activeSupplySubmenu) {
            case 'cer_bb': return cerBBData;
            case 'art_alt': return artAltData;
            case 'art_ct': return artCtData;
            default: {
              const currentData = genericSubmenuData[activeSupplySubmenu];
              if (!currentData || currentData.length === 0) {
                const submenuMeta = supplySubmenuList.find(s => s.id === activeSupplySubmenu);
                const subName = submenuMeta ? submenuMeta.name : 'Insumo';
                const pCode = `${subName.replace(/\s+/g, '').substring(0,3).toUpperCase()}-1`;
                return [
                  {
                    id: 1,
                    codigo: pCode,
                    nombre_producto: `Surtido Inicial de ${subName}`,
                    unidad_surtida: 40,
                    costo_surtido: 15.00,
                    precio_venta: 30.00,
                    proveedor: 'Proveedor General',
                    fecha_registro: new Date().toISOString().split('T')[0]
                  }
                ];
              }
              return currentData;
            }
          }
        };

        const handleUpdateSubmenuData = (updater: any) => {
          if (activeSupplySubmenu === 'cer_bb') {
            setCerBBData(prev => {
              const res = typeof updater === 'function' ? updater(prev) : updater;
              const sorted = [...res].sort((a, b) => {
                const aVal = getSupplyRowCompareValue(a, 'sel');
                const bVal = getSupplyRowCompareValue(b, 'sel');
                return compareVals(aVal, bVal);
              });
              setTimeout(() => saveToSupabase('cer_bb', sorted), 10);
              return sorted;
            });
          } else if (activeSupplySubmenu === 'art_alt') {
            setArtAltData(prev => {
              const res = typeof updater === 'function' ? updater(prev) : updater;
              const sorted = [...res].sort((a, b) => {
                const aVal = getSupplyRowCompareValue(a, 'sel');
                const bVal = getSupplyRowCompareValue(b, 'sel');
                return compareVals(aVal, bVal);
              });
              setTimeout(() => saveToSupabase('art_alt', sorted), 10);
              return sorted;
            });
          } else if (activeSupplySubmenu === 'art_ct') {
            setArtCtData(prev => {
              const res = typeof updater === 'function' ? updater(prev) : updater;
              const sorted = [...res].sort((a, b) => {
                const aVal = getSupplyRowCompareValue(a, 'sel');
                const bVal = getSupplyRowCompareValue(b, 'sel');
                return compareVals(aVal, bVal);
              });
              setTimeout(() => saveToSupabase('art_ct', sorted), 10);
              return sorted;
            });
          } else {
            setGenericSubmenuData(prev => {
              const currentList = prev[activeSupplySubmenu] || [];
              const actualList = currentList.length > 0 ? currentList : (() => {
                const submenuMeta = supplySubmenuList.find(s => s.id === activeSupplySubmenu);
                const subName = submenuMeta ? submenuMeta.name : 'Insumo';
                const pCode = `${subName.replace(/\s+/g, '').substring(0,3).toUpperCase()}-1`;
                return [
                  {
                    id: 1,
                    codigo: pCode,
                    nombre_producto: `Surtido Inicial de ${subName}`,
                    unidad_surtida: 40,
                    costo_surtido: 15.00,
                    precio_venta: 30.00,
                    proveedor: 'Proveedor General',
                    fecha_registro: new Date().toISOString().split('T')[0]
                  }
                ];
              })();
              const res = typeof updater === 'function' ? updater(actualList) : updater;
              const sorted = [...res].sort((a, b) => {
                const aVal = getSupplyRowCompareValue(a, 'sel');
                const bVal = getSupplyRowCompareValue(b, 'sel');
                return compareVals(aVal, bVal);
              });
              setTimeout(() => saveToSupabase(activeSupplySubmenu, sorted), 10);
              return {
                ...prev,
                [activeSupplySubmenu]: sorted
              };
            });
          }
        };

        const currentSubmenuData = getActiveSubmenuData();
        const activeMeta = supplySubmenuList.find(s => s.id === activeSupplySubmenu) || supplySubmenuList[0];

        // Filter table rows based on active search inside submenu
        const filteredSubmenuRows = currentSubmenuData.filter(item => {
          const query = submenuSearchQuery.toLowerCase();
          return (
            (item.codigo || '').toLowerCase().includes(query) ||
            (item.nombre_producto || '').toLowerCase().includes(query) ||
            (item.proveedor || '').toLowerCase().includes(query)
          );
        });

        // Sorted submenu rows ready for table presentation
        const sortedSubmenuRows = [...filteredSubmenuRows].sort((a, b) => {
          if (!supplySortField) return 0;
          const aVal = getSupplyRowCompareValue(a, supplySortField);
          const bVal = getSupplyRowCompareValue(b, supplySortField);
          const comp = compareVals(aVal, bVal);
          return supplySortDirection === 'asc' ? comp : -comp;
        });

        // Paginate Surtido rows (5 per page)
        const totalSupplyPages = Math.max(Math.ceil(sortedSubmenuRows.length / 5), 1);
        const paginatedSubmenuRows = sortedSubmenuRows.slice((supplyPage - 1) * 5, supplyPage * 5);

        // Dynamic Calculations for KPIs
        const totalUnits = filteredSubmenuRows.reduce((acc, row) => acc + safeVal(row.unidad_surtida), 0);
        const totalCostIncurred = filteredSubmenuRows.reduce((acc, row) => acc + (safeVal(row.unidad_surtida) * safeVal(row.costo_surtido)), 0);
        const projectedSalesValue = filteredSubmenuRows.reduce((acc, row) => acc + (safeVal(row.unidad_surtida) * safeVal(row.precio_venta)), 0);
        const grossProfit = projectedSalesValue - totalCostIncurred;
        const avgMarginPct = filteredSubmenuRows.length > 0 
          ? (filteredSubmenuRows.reduce((acc, row) => {
              const precio = safeVal(row.precio_venta);
              const costo = safeVal(row.costo_surtido);
              if (precio === 0) return acc;
              return acc + (((precio - costo) / precio) * 100);
            }, 0) / filteredSubmenuRows.length)
          : 0;

        // SQL generation based on current submenu
        const getDynamicSQL = () => {
          const tableName = `surtido_${activeSupplySubmenu}`;
          const currentRows = getActiveSubmenuData();
          const rawHeaders = submenuHeaders[activeSupplySubmenu] || [];
          const headers = cleanHeaders(rawHeaders);

          let sqlText = `-- ⚡ SCRIPT DE CONFIGURACIÓN DE SUPABASE\n`;
          sqlText += `-- 💡 Pasos para sincronizar:\n`;
          sqlText += `--   1. Abre tu panel de Supabase y ve a la sección "SQL Editor".\n`;
          sqlText += `--   2. Crea una nueva consulta ("New Query"), pega TODO este código y haz clic en "Run".\n`;
          sqlText += `--   3. ¡Listo! Ya podrás agregar, importar, modificar o eliminar registros desde la web.\n\n`;
          
          sqlText += `-- 📦 1. TABLA DE CONFIGURACIÓN DE MENÚS (REQUERIDA PARA PERSISTENCIA DE ACCESOS NUEVOS)\n`;
          sqlText += `CREATE TABLE IF NOT EXISTS surtido_submenus (\n`;
          sqlText += `    id VARCHAR(50) PRIMARY KEY,\n`;
          sqlText += `    name VARCHAR(100) NOT NULL,\n`;
          sqlText += `    title VARCHAR(150),\n`;
          sqlText += `    description TEXT,\n`;
          sqlText += `    convenio VARCHAR(10) DEFAULT 'NO',\n`;
          sqlText += `    cliente VARCHAR(150),\n`;
          sqlText += `    grupo VARCHAR(30)\n`;
          sqlText += `);\n`;
          sqlText += `ALTER TABLE surtido_submenus ADD COLUMN IF NOT EXISTS convenio VARCHAR(10) DEFAULT 'NO';\n`;
          sqlText += `ALTER TABLE surtido_submenus ADD COLUMN IF NOT EXISTS cliente VARCHAR(150);\n`;
          sqlText += `ALTER TABLE surtido_submenus ADD COLUMN IF NOT EXISTS grupo VARCHAR(30);\n`;
          sqlText += `ALTER TABLE IF EXISTS surtido_submenus DISABLE ROW LEVEL SECURITY;\n`;
          sqlText += `GRANT ALL ON TABLE surtido_submenus TO anon;\n`;
          sqlText += `GRANT ALL ON TABLE surtido_submenus TO authenticated;\n\n`;

          sqlText += `-- 📊 2. TABLA DE REGISTROS DE ESTE ACCESO (${activeMeta.name.toUpperCase()})\n`;
          sqlText += `DROP TABLE IF EXISTS ${tableName} CASCADE;\n\n`;
          
          if (headers.length > 0) {
            // Dynamic columns schema based on CSV headers
            sqlText += `CREATE TABLE ${tableName} (\n`;
            sqlText += `    id SERIAL PRIMARY KEY,\n`;
            
            headers.forEach(header => {
              const cleanH = cleanHeader(header);
              // Clean name to be a safe SQL identifier
              const sqlColName = header.toLowerCase()
                .normalize("NFD")
                .replace(/[\u0300-\u036f]/g, "")
                .replace(/[^a-z0-9]/g, "_")
                .replace(/^_+|_+$/g, "")
                .trim();

              const isNum = cleanH.includes('precio') || cleanH.includes('vta') || cleanH.includes('costo') || cleanH.includes('surtir') || cleanH.includes('unidades') || cleanH.includes('cantidad') || cleanH.includes('cabe') || cleanH.includes('canal');
              const isInt = cleanH.includes('surtir') || cleanH.includes('unidades') || cleanH.includes('cantidad') || cleanH.includes('cabe') || cleanH.includes('canal');

              if (isInt) {
                sqlText += `    ${sqlColName} INT DEFAULT 0,\n`;
              } else if (isNum) {
                sqlText += `    ${sqlColName} DECIMAL(10,2) DEFAULT 0.00,\n`;
              } else {
                sqlText += `    ${sqlColName} VARCHAR(150) DEFAULT '',\n`;
              }
            });
            sqlText += `    fecha_registro DATE DEFAULT CURRENT_DATE\n`;
            sqlText += `);\n\n`;

            if (currentRows.length > 0) {
              const sqlCols = headers.map(header => {
                return header.toLowerCase()
                  .normalize("NFD")
                  .replace(/[\u0300-\u036f]/g, "")
                  .replace(/[^a-z0-9]/g, "_")
                  .replace(/^_+|_+$/g, "")
                  .trim();
              });

              sqlText += `-- Seeding Inicial de Registros de Surtido (${activeMeta.name})\n`;
              sqlText += `INSERT INTO ${tableName} (${sqlCols.join(', ')})\nVALUES\n`;
              
              const insertValues = currentRows.map(row => {
                const rowVals = headers.map(header => {
                  const val = row.values && row.values[header] !== undefined ? row.values[header] : '';
                  const cleanH = cleanHeader(header);
                  const isNum = cleanH.includes('precio') || cleanH.includes('vta') || cleanH.includes('costo') || cleanH.includes('surtir') || cleanH.includes('unidades') || cleanH.includes('cantidad') || cleanH.includes('cabe') || cleanH.includes('canal');
                  if (isNum) {
                    const numStr = String(val).replace(/[^0-9.-]/g, '');
                    return numStr ? numStr : '0';
                  }
                  return `'${String(val).replace(/'/g, "''")}'`;
                });
                return `(${rowVals.join(', ')})`;
              }).join(',\n');

              sqlText += insertValues + `;\n\n`;
            }
          } else {
            // Default table schema
            sqlText += `CREATE TABLE ${tableName} (\n`;
            sqlText += `    id SERIAL PRIMARY KEY,\n`;
            sqlText += `    codigo VARCHAR(50) NOT NULL,\n`;
            sqlText += `    nombre_producto VARCHAR(150) NOT NULL,\n`;
            sqlText += `    unidad_surtida INT DEFAULT 0,\n`;
            sqlText += `    costo_surtido DECIMAL(10,2) DEFAULT 0.00,\n`;
            sqlText += `    precio_venta DECIMAL(10,2) DEFAULT 0.00,\n`;
            sqlText += `    importe_total DECIMAL(10,2) GENERATED ALWAYS AS (unidad_surtida * precio_venta) STORED,\n`;
            sqlText += `    fecha_registro DATE DEFAULT CURRENT_DATE,\n`;
            sqlText += `    proveedor VARCHAR(100) DEFAULT 'Proveedor General'\n`;
            sqlText += `);\n\n`;

            if (currentRows.length > 0) {
              sqlText += `-- Seeding Inicial de Registros de Surtido\n`;
              sqlText += `INSERT INTO ${tableName} (codigo, nombre_producto, unidad_surtida, costo_surtido, precio_venta, proveedor, fecha_registro)\nVALUES\n`;
              
              const insertValues = currentRows.map(row => {
                const codeEscaped = `'${(row.codigo || '').replace(/'/g, "''")}'`;
                const nameEscaped = `'${(row.nombre_producto || '').replace(/'/g, "''")}'`;
                const provEscaped = `'${(row.proveedor || '').replace(/'/g, "''")}'`;
                return `(${codeEscaped}, ${nameEscaped}, ${row.unidad_surtida}, ${row.costo_surtido}, ${row.precio_venta}, ${provEscaped}, '${row.fecha_registro}')`;
              }).join(',\n');
              
              sqlText += insertValues + `;\n\n`;
            }
          }

          sqlText += `-- ⚠️ DESACTIVAR SEGURIDAD RLS PARA ACCESO DIRECTO DESDE CLIENTE:\n`;
          sqlText += `ALTER TABLE IF EXISTS ${tableName} DISABLE ROW LEVEL SECURITY;\n`;
          sqlText += `GRANT ALL ON TABLE ${tableName} TO anon;\n`;
          sqlText += `GRANT ALL ON TABLE ${tableName} TO authenticated;\n`;
          sqlText += `GRANT ALL ON SEQUENCE ${tableName}_id_seq TO anon;\n`;
          sqlText += `GRANT ALL ON SEQUENCE ${tableName}_id_seq TO authenticated;\n\n`;

          sqlText += `-- Consulta Analítica de Dashboard: Calcular Ganancia Bruta y Margen Real\n`;
          sqlText += `SELECT \n`;
          if (headers.length > 0) {
            // Find columns for calculations
            let surtirCol = 'surtir';
            let precioCol = 'precio_vta';
            let costoCol = '0'; // fallback if no costo exists
            let foundVenta = false;
            
            headers.forEach(h => {
              const cleanH = cleanHeader(h);
              const sqlCol = h.toLowerCase()
                .normalize("NFD")
                .replace(/[\u0300-\u036f]/g, "")
                .replace(/[^a-z0-9]/g, "_")
                .replace(/^_+|_+$/g, "")
                .trim();
                
              if (cleanH === 'surtir' || cleanH === 'cantidad' || cleanH === 'unidades') {
                surtirCol = sqlCol;
              } else if (cleanH === 'costo') {
                costoCol = sqlCol;
              } else if (cleanH === 'precioventa' || cleanH === 'preciovta' || cleanH === 'vta') {
                precioCol = sqlCol;
                foundVenta = true;
              } else if (!foundVenta && (cleanH === 'precio' || cleanH === 'preciodeventa' || cleanH === 'precio_vta' || cleanH === 'precioregular')) {
                precioCol = sqlCol;
              }
            });

            sqlText += `    SUM(${surtirCol}) AS total_piezas_surtidas,\n`;
            sqlText += `    SUM(${surtirCol} * ${costoCol}) AS inversion_total,\n`;
            sqlText += `    SUM(${surtirCol} * ${precioCol}) AS venta_proyectada,\n`;
            sqlText += `    SUM(${surtirCol} * (${precioCol} - ${costoCol})) AS ganancia_bruta_proyectada,\n`;
            sqlText += `    ROUND(AVG(NULLIF(${precioCol} - ${costoCol}, 0) / NULLIF(${precioCol}, 0) * 100), 2) AS margen_promedio_general\n`;
          } else {
            sqlText += `    SUM(unidad_surtida) AS total_piezas_surtidas,\n`;
            sqlText += `    SUM(unidad_surtida * costo_surtido) AS inversion_total,\n`;
            sqlText += `    SUM(unidad_surtida * precio_venta) AS venta_proyectada,\n`;
            sqlText += `    SUM(unidad_surtida * (precio_venta - costo_surtido)) AS ganancia_bruta_proyectada,\n`;
            sqlText += `    ROUND(AVG(NULLIF(precio_venta - costo_surtido, 0) / NULLIF(precio_venta, 0) * 100), 2) AS margen_promedio_general\n`;
          }
          sqlText += `FROM ${tableName};\n\n`;

          sqlText += `-- 🌐 3. SCRIPT GLOBAL PARA AGREGAR COLUMNAS DE FECHA A TODAS LAS MÁQUINAS EN SUPABASE\n`;
          sqlText += `-- Copia y ejecuta este bloque en "SQL Editor" de Supabase para agregar las tablas de fecha a TODAS las máquinas existentes sin borrar datos:\n`;
          sqlText += `DO $$\n`;
          sqlText += `DECLARE\n`;
          sqlText += `    t text;\n`;
          sqlText += `BEGIN\n`;
          sqlText += `    FOR t IN\n`;
          sqlText += `        SELECT table_name\n`;
          sqlText += `        FROM information_schema.tables\n`;
          sqlText += `        WHERE table_name LIKE 'surtido_%' AND table_name != 'surtido_submenus'\n`;
          sqlText += `    LOOP\n`;
          sqlText += `        EXECUTE format('ALTER TABLE %I ADD COLUMN IF NOT EXISTS fecha VARCHAR(150) DEFAULT '''';', t);\n`;
          sqlText += `        EXECUTE format('ALTER TABLE %I ADD COLUMN IF NOT EXISTS fecha_2 VARCHAR(150) DEFAULT '''';', t);\n`;
          sqlText += `        EXECUTE format('ALTER TABLE %I ADD COLUMN IF NOT EXISTS fecha_3 VARCHAR(150) DEFAULT '''';', t);\n`;
          sqlText += `        EXECUTE format('ALTER TABLE %I ADD COLUMN IF NOT EXISTS fecha_4 VARCHAR(150) DEFAULT '''';', t);\n`;
          sqlText += `        EXECUTE format('ALTER TABLE %I ADD COLUMN IF NOT EXISTS fecha_5 VARCHAR(150) DEFAULT '''';', t);\n`;
          sqlText += `    END LOOP;\n`;
          sqlText += `END $$;\n\n`;

          sqlText += `-- 🌐 4. SCRIPT GLOBAL PARA TABLA DE BITÁCORA Y CONTROL DE MANTENIMIENTO POR VISITA DE MÁQUINA\n`;
          sqlText += `CREATE TABLE IF NOT EXISTS surtido_bitacora_mantenimiento (\n`;
          sqlText += `    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,\n`;
          sqlText += `    maquina_id VARCHAR(100) NOT NULL,\n`;
          sqlText += `    visita_label VARCHAR(100) DEFAULT '',\n`;
          sqlText += `    mon_inicial VARCHAR(100) DEFAULT '',\n`;
          sqlText += `    mon_final VARCHAR(100) DEFAULT '',\n`;
          sqlText += `    pruebas VARCHAR(100) DEFAULT 'no',\n`;
          sqlText += `    ventas_externas VARCHAR(100) DEFAULT 'no',\n`;
          sqlText += `    limpieza_interna VARCHAR(50) DEFAULT 'si',\n`;
          sqlText += `    limpieza_externa VARCHAR(50) DEFAULT 'si',\n`;
          sqlText += `    falla_equipo VARCHAR(50) DEFAULT 'no',\n`;
          sqlText += `    monedero VARCHAR(50) DEFAULT 'no',\n`;
          sqlText += `    billetero VARCHAR(50) DEFAULT 'no',\n`;
          sqlText += `    base_resorte VARCHAR(50) DEFAULT 'no',\n`;
          sqlText += `    otro VARCHAR(50) DEFAULT 'no',\n`;
          sqlText += `    notas TEXT DEFAULT 'no',\n`;
          sqlText += `    nombre_repartidor VARCHAR(255) DEFAULT '',\n`;
          sqlText += `    elaboro VARCHAR(100) DEFAULT 'FC',\n`;
          sqlText += `    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()\n`;
          sqlText += `);\n`;
          sqlText += `ALTER TABLE surtido_bitacora_mantenimiento ADD COLUMN IF NOT EXISTS nombre_repartidor VARCHAR(255) DEFAULT '';\n`;
          sqlText += `CREATE INDEX IF NOT EXISTS idx_bitacora_maquina_id ON surtido_bitacora_mantenimiento(maquina_id);\n`;

          return sqlText;
        };

        // Standard custom Excel style export call
        const handleExportToExcel = (tabId: string) => {
          const tabMeta = supplySubmenuList.find(t => t.id === tabId);
          const tabTitle = tabMeta ? tabMeta.title : 'Reporte_Surtido';
          let dataToExport: any[] = [];
          
          if (tabId === 'cer_bb') dataToExport = cerBBData;
          else if (tabId === 'art_alt') dataToExport = artAltData;
          else if (tabId === 'art_ct') dataToExport = artCtData;
          else dataToExport = genericSubmenuData[tabId] || [];

          if (dataToExport.length === 0) {
            alert("No hay registros cargados en este acceso para ser exportados a Excel.");
            return;
          }

          // Export in the exact same order as visible in the system (using active sort)
          const sortedDataToExport = [...dataToExport].sort((a, b) => {
            if (!supplySortField) {
              const aVal = getSupplyRowCompareValue(a, 'sel');
              const bVal = getSupplyRowCompareValue(b, 'sel');
              return compareVals(aVal, bVal);
            }
            const aVal = getSupplyRowCompareValue(a, supplySortField);
            const bVal = getSupplyRowCompareValue(b, supplySortField);
            const comp = compareVals(aVal, bVal);
            return supplySortDirection === 'asc' ? comp : -comp;
          });

          const activeSubHeaders = filterEmptyColumnaHeaders(cleanHeaders(submenuHeaders[tabId] || []), sortedDataToExport);
          const hasDynamicHeaders = activeSubHeaders.length > 0;
          const colLabels = hasDynamicHeaders 
            ? [...activeSubHeaders, 'Importe Total ($)', 'Fecha Registro'] 
            : ['ID', 'Código', 'Producto / Artículo', 'Unidades Surtidas', 'Costo Unitario ($)', 'Precio regular ($)', 'Importe Total ($)', 'SEL / Resorte', 'Notas', 'Fecha Registro'];

          const headers = colLabels.map(label => `"${label.replace(/"/g, '""')}"`).join(';');
          const rows = sortedDataToExport.map(item => {
            const totalImport = safeVal(item.unidad_surtida) * safeVal(item.precio_venta);
            
            if (hasDynamicHeaders) {
              const rowValues: string[] = [];
              activeSubHeaders.forEach(h => {
                const val = item.values && item.values[h] !== undefined ? item.values[h] : getSupplyRowCompareValue(item, h);
                let valStr = String(val === null || val === undefined ? '' : val).replace(/"/g, '""');
                rowValues.push(`"${valStr}"`);
              });
              // Append totalImport and date
              rowValues.push(`"${totalImport.toFixed(2).replace('.', ',')}"`);
              rowValues.push(`"${(item.fecha_registro || '').replace(/"/g, '""')}"`);
              return rowValues.join(';');
            } else {
              const colKeys = ['id', 'codigo', 'nombre_producto', 'unidad_surtida', 'costo_surtido', 'precio_venta', 'importe_total', 'sel', 'notas', 'fecha_registro'];
              const rowCopy = {
                ...item,
                importe_total: totalImport,
                sel: item.sel || item.seleccion || item.resorte || ''
              };
              return colKeys.map(key => {
                const val = rowCopy[key];
                if (val === undefined || val === null) return '""';
                if (typeof val === 'number') {
                  return `"${val.toFixed(2).replace('.', ',')}"`;
                }
                let valStr = String(val).replace(/"/g, '""');
                return `"${valStr}"`;
              }).join(';');
            }
          });

          const csvContent = "\uFEFF" + "sep=;\n" + [
            headers,
            ...rows,
            '',
            '"BITÁCORA DE CONTROL Y MANTENIMIENTO DE MÁQUINA"',
            ['Concepto', 'Detalle', ...getMachineVisits(tabId).map(v => v.visitLabel || 'Visita')].map(v => `"${v.replace(/"/g, '""')}"`).join(';'),
            ...[
              { concept: 'Mon. Inicial', detail: '', key: 'mon_inicial' },
              { concept: 'Mon. Final', detail: '', key: 'mon_final' },
              { concept: 'Pruebas con $$', detail: 'Cuanto $?', key: 'pruebas' },
              { concept: 'Ventas Externas', detail: 'Cuanto $?', key: 'ventas_externas' },
              { concept: 'Limpieza interna', detail: 'Si / no', key: 'limpieza_interna' },
              { concept: 'Limpieza externa', detail: 'Si / no', key: 'limpieza_externa' },
              { concept: 'Falla de equipo', detail: 'Si / no', key: 'falla_equipo' },
              { concept: 'Monedero', detail: 'X', key: 'monedero' },
              { concept: 'Billetero', detail: 'X', key: 'billetero' },
              { concept: 'Base de resorte', detail: 'X', key: 'base_resorte' },
              { concept: 'Otro', detail: 'X', key: 'otro' },
              { concept: 'Notas', detail: 'no', key: 'notas' },
              { concept: 'Nombre del repartidor', detail: 'Surtidor', key: 'repartidor' },
              { concept: 'Elaboro', detail: '', key: 'elaboro' }
            ].map(rowDef => {
              const lineVals = [rowDef.concept, rowDef.detail];
              getMachineVisits(tabId).forEach(v => {
                lineVals.push(String((v as any)[rowDef.key] || ''));
              });
              return lineVals.map(val => `"${val.replace(/"/g, '""')}"`).join(';');
            })
          ].join('\n');
          const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
          const url = URL.createObjectURL(blob);
          const link = document.createElement("a");
          const safeName = tabTitle.toLowerCase().replace(/[^a-z0-9]/g, '_');
          link.setAttribute("href", url);
          link.setAttribute("download", `${safeName}_excel.csv`);
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
        };

        const handleExportAllToExcel = () => {
          const exportBlocks: string[] = [];
          
          supplySubmenuList.forEach(submenu => {
            let data: any[] = [];
            if (submenu.id === 'cer_bb') data = cerBBData;
            else if (submenu.id === 'art_alt') data = artAltData;
            else if (submenu.id === 'art_ct') data = artCtData;
            else data = genericSubmenuData[submenu.id] || [];

            if (data.length === 0) {
              // Skip tables with no records
              return;
            }

            // Sort each submenu's data using active system sort if available, else by SEL/seleccion
            const sortedData = [...data].sort((a, b) => {
              if (!supplySortField) {
                const aVal = getSupplyRowCompareValue(a, 'sel');
                const bVal = getSupplyRowCompareValue(b, 'sel');
                return compareVals(aVal, bVal);
              }
              const aVal = getSupplyRowCompareValue(a, supplySortField);
              const bVal = getSupplyRowCompareValue(b, supplySortField);
              const comp = compareVals(aVal, bVal);
              return supplySortDirection === 'asc' ? comp : -comp;
            });

            const activeSubHeaders = filterEmptyColumnaHeaders(cleanHeaders(submenuHeaders[submenu.id] || []), sortedData);
            const hasDynamicHeaders = activeSubHeaders.length > 0;

            const colLabels = hasDynamicHeaders 
              ? [...activeSubHeaders, 'Importe Total ($)', 'Fecha Registro'] 
              : ['Código', 'Producto / Artículo', 'Unidades Surtidas', 'Costo Unitario ($)', 'Precio regular ($)', 'Importe Total ($)', 'SEL / Resorte', 'Notas', 'Fecha Registro'];

            // Title block for this submenu
            exportBlocks.push(`"MÁQUINA / SUBMENÚ: ${submenu.name.replace(/"/g, '""')}"`);
            exportBlocks.push(colLabels.map(label => `"${label.replace(/"/g, '""')}"`).join(';'));

            sortedData.forEach(item => {
              const totalImport = safeVal(item.unidad_surtida) * safeVal(item.precio_venta);
              
              if (hasDynamicHeaders) {
                const rowValues: string[] = [];
                activeSubHeaders.forEach(h => {
                  const val = item.values && item.values[h] !== undefined ? item.values[h] : getSupplyRowCompareValue(item, h);
                  let valStr = String(val === null || val === undefined ? '' : val).replace(/"/g, '""');
                  if (valStr.includes(';') || valStr.includes('\n') || valStr.includes(',')) {
                    valStr = `"${valStr}"`;
                  } else {
                    valStr = `"${valStr}"`;
                  }
                  rowValues.push(valStr);
                });
                // Append totalImport and date
                rowValues.push(`"${totalImport.toFixed(2).replace('.', ',')}"`);
                rowValues.push(`"${(item.fecha_registro || '').replace(/"/g, '""')}"`);
                exportBlocks.push(rowValues.join(';'));
              } else {
                const colKeys = ['codigo', 'nombre_producto', 'unidad_surtida', 'costo_surtido', 'precio_venta', 'importe_total', 'sel', 'notas', 'fecha_registro'];
                const rowCopy = {
                  ...item,
                  importe_total: totalImport,
                  sel: item.sel || item.seleccion || item.resorte || ''
                };
                const rowValues = colKeys.map(key => {
                  const val = rowCopy[key];
                  if (val === undefined || val === null) return '""';
                  if (typeof val === 'number') {
                    return `"${val.toFixed(2).replace('.', ',')}"`;
                  }
                  let valStr = String(val).replace(/"/g, '""');
                  return `"${valStr}"`;
                });
                exportBlocks.push(rowValues.join(';'));
              }
            });

            // Append Bitácora de Mantenimiento table for this machine
            const currentVisits = getMachineVisits(submenu.id);
            exportBlocks.push('');
            exportBlocks.push(`"BITÁCORA DE CONTROL Y MANTENIMIENTO - ${submenu.name.replace(/"/g, '""').toUpperCase()}"`);
            const visitHeaderRow = ['Concepto', 'Detalle', ...currentVisits.map(v => v.visitLabel || 'Visita')];
            exportBlocks.push(visitHeaderRow.map(v => `"${v.replace(/"/g, '""')}"`).join(';'));

            const maintenanceRowsDef = [
              { concept: 'Mon. Inicial', detail: '', key: 'mon_inicial' },
              { concept: 'Mon. Final', detail: '', key: 'mon_final' },
              { concept: 'Pruebas con $$', detail: 'Cuanto $?', key: 'pruebas' },
              { concept: 'Ventas Externas', detail: 'Cuanto $?', key: 'ventas_externas' },
              { concept: 'Limpieza interna', detail: 'Si / no', key: 'limpieza_interna' },
              { concept: 'Limpieza externa', detail: 'Si / no', key: 'limpieza_externa' },
              { concept: 'Falla de equipo', detail: 'Si / no', key: 'falla_equipo' },
              { concept: 'Monedero', detail: 'X', key: 'monedero' },
              { concept: 'Billetero', detail: 'X', key: 'billetero' },
              { concept: 'Base de resorte', detail: 'X', key: 'base_resorte' },
              { concept: 'Otro', detail: 'X', key: 'otro' },
              { concept: 'Notas', detail: 'no', key: 'notas' },
              { concept: 'Nombre del repartidor', detail: 'Surtidor', key: 'repartidor' },
              { concept: 'Elaboro', detail: '', key: 'elaboro' }
            ];

            maintenanceRowsDef.forEach(rowDef => {
              const lineVals = [rowDef.concept, rowDef.detail];
              currentVisits.forEach(v => {
                lineVals.push(String((v as any)[rowDef.key] || ''));
              });
              exportBlocks.push(lineVals.map(val => `"${val.replace(/"/g, '""')}"`).join(';'));
            });

            // Add separation blank rows after each table block
            exportBlocks.push('');
            exportBlocks.push('');
          });

          if (exportBlocks.length === 0) {
            alert("No hay registros en ninguna sección para ser exportados.");
            return;
          }

          const csvContent = "\uFEFF" + "sep=;\n" + exportBlocks.join('\n');
          const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
          const url = URL.createObjectURL(blob);
          const link = document.createElement("a");
          link.setAttribute("href", url);
          link.setAttribute("download", `surtido_completo_todos_los_registros.csv`);
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
        };

        const handleSelectSelAssociation = (assoc: any) => {
          isManualSelRef.current = false;
          setRowSeleccion(assoc.sel);
          if (assoc.productRef) {
            handleSelectProduct(assoc.productRef);
          } else {
            if (assoc.codigo) setRowCodigo(assoc.codigo);
            if (assoc.nombre) setRowNombre(assoc.nombre);
          }
          setSelSuggestions([]);
          setShowSelSuggestions(false);
        };

        const handleSelectProduct = (prod: any) => {
          isManualSelRef.current = false;
          setRowCodigo(prod.codigo || prod.id || '');
          setRowNombre(prod.nombre || '');
          let cost = prod.precio_unidad || 0;
          if (cost === 0 && prod.precio_caja && prod.piezas_por_caja) {
            cost = Number((prod.precio_caja / prod.piezas_por_caja).toFixed(2));
          }
          setRowCosto(cost || prod.precio_venta || 0);
          setRowPrecio(prod.precio_venta || 0);
          setRowProveedor(prod.proveedor || 'Genérico');
          setRowResorte(prod.resorte_usa || '');
          
          const assignedSel = getAssignedSeleccionForProduct(prod.codigo, prod.nombre);
          if (assignedSel) {
            setRowSeleccion(assignedSel);
          }
          
          setCodigoSuggestions([]);
          setNombreSuggestions([]);
          setSelSuggestions([]);
          setShowCodigoSuggestions(false);
          setShowNombreSuggestions(false);
          setShowSelSuggestions(false);
        };

        const handleLookupAndFillByCodigo = (codigoVal: string, isEditMode: boolean = false) => {
          if (!codigoVal.trim()) return false;
          const cleanCode = codigoVal.trim().toLowerCase();
          
          const foundProd = products.find(p => 
            String(p.codigo || '').trim().toLowerCase() === cleanCode ||
            String(p.id || '').trim().toLowerCase() === cleanCode
          );
          
          if (foundProd) {
            let cost = foundProd.precio_unidad || 0;
            if (cost === 0 && foundProd.precio_caja && foundProd.piezas_por_caja) {
              cost = Number((foundProd.precio_caja / foundProd.piezas_por_caja).toFixed(2));
            }
            const finalCosto = cost || foundProd.precio_venta || 0;
            const finalPrecio = foundProd.precio_venta || 0;
            const finalProveedor = foundProd.proveedor || 'Genérico';
            const finalResorte = foundProd.resorte_usa || '';

            if (isEditMode) {
              setEditRowCodigo(foundProd.codigo || foundProd.id || '');
              setEditRowNombre(foundProd.nombre || '');
              setEditRowCosto(finalCosto);
              setEditRowPrecio(finalPrecio);
              setEditRowProveedor(finalProveedor);
              setEditRowResorte(finalResorte);
              
              const activeSubHeaders = cleanHeaders(submenuHeaders[activeSupplySubmenu] || []);
              if (activeSubHeaders.length > 0) {
                setEditRowValues(prev => {
                  const updated = { ...prev };
                  activeSubHeaders.forEach(header => {
                    const norm = header.toLowerCase().trim().replace(/_/g, ' ').replace(/\./g, '');
                    if (norm === 'codigo' || norm === 'sku' || norm === 'code') {
                      updated[header] = foundProd.codigo || foundProd.id || '';
                    } else if (norm === 'producto' || norm === 'nombre' || norm === 'articulo' || norm === 'producto o articulo') {
                      updated[header] = foundProd.nombre || '';
                    } else if (norm === 'costo unit' || norm === 'costo' || norm === 'costo unitario') {
                      updated[header] = finalCosto;
                    } else if (norm === 'precio vta' || norm === 'precio' || norm === 'precio venta' || norm === 'precio regular') {
                      updated[header] = finalPrecio;
                    } else if (norm === 'resorte' || norm === 'sel / resorte') {
                      updated[header] = finalResorte;
                    }
                  });
                  return updated;
                });
              }
            } else {
              setRowCodigo(foundProd.codigo || foundProd.id || '');
              setRowNombre(foundProd.nombre || '');
              setRowCosto(finalCosto);
              setRowPrecio(finalPrecio);
              setRowProveedor(finalProveedor);
              setRowResorte(finalResorte);
              
              const assignedSel = getAssignedSeleccionForProduct(foundProd.codigo, foundProd.nombre);
              if (assignedSel) {
                setRowSeleccion(assignedSel);
              }
            }
            return true;
          }
          return false;
        };

        const handleAddRow = () => {
          if (isSurtidorOnly) return;
          if (!rowCodigo.trim() || !rowNombre.trim()) {
            alert("Por favor completa el código y nombre del producto.");
            return;
          }

          const activeSubHeaders = cleanHeaders(submenuHeaders[activeSupplySubmenu] || []);
          const hasDynamicHeaders = activeSubHeaders.length > 0;
          let newRowValues: Record<string, string> = {};
          
          if (hasDynamicHeaders) {
            const headersCleaned = activeSubHeaders.map(h => h.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]/g, "").trim());
            
            headersCleaned.forEach((h, idx) => {
              const originalHeader = activeSubHeaders[idx];
              if (h === 'sel' || h === 'seleccion' || h === 'slot' || h === 'seleccionnum') {
                newRowValues[originalHeader] = rowSeleccion.trim();
              } else if (h === 'codigo' || h === 'sku' || h === 'codig' || h === 'code') {
                newRowValues[originalHeader] = rowCodigo.trim().toUpperCase();
              } else if (h === 'producto' || h === 'nombre' || h === 'articulo') {
                newRowValues[originalHeader] = rowNombre.trim();
              } else if (h === 'surtir' || h === 'cantidad' || h === 'unidades' || h === 'cant') {
                newRowValues[originalHeader] = String(safeVal(rowUnidades));
              } else if (h === 'costo') {
                newRowValues[originalHeader] = String(safeVal(rowCosto));
              } else if (h === 'precio' || h === 'preciovta' || h === 'precioventa' || h === 'preciodeventa' || h === 'precio_vta' || h === 'precioregular') {
                newRowValues[originalHeader] = String(safeVal(rowPrecio));
              } else if (h === 'proveedor') {
                newRowValues[originalHeader] = rowProveedor.trim() || 'Proveedor General';
              } else if (h === 'resor' || h === 'resort' || h === 'resorte') {
                newRowValues[originalHeader] = rowResorte.trim();
              } else if (h === 'notas') {
                newRowValues[originalHeader] = rowNotas.trim();
              } else {
                newRowValues[originalHeader] = addRowValues[originalHeader] !== undefined ? addRowValues[originalHeader] : '';
              }
            });
          }

          const newRow = {
            id: Date.now(),
            codigo: rowCodigo.trim().toUpperCase(),
            nombre_producto: rowNombre.trim(),
            text_search_ref: `${rowCodigo.trim().toLowerCase()} ${rowNombre.trim().toLowerCase()}`,
            unidad_surtida: safeVal(rowUnidades),
            costo_surtido: safeVal(rowCosto),
            precio_venta: safeVal(rowPrecio),
            sel: rowSeleccion.trim(),
            seleccion: rowSeleccion.trim(),
            proveedor: rowProveedor.trim() || 'Proveedor General',
            resorte: rowResorte.trim(),
            notas: rowNotas.trim(),
            fecha_registro: new Date().toISOString().split('T')[0],
            values: hasDynamicHeaders ? newRowValues : undefined
          };

          handleUpdateSubmenuData((prev: any[]) => [...prev, newRow]);
          
          // reset form
          setRowCodigo('');
          setRowNombre('');
          setRowUnidades(1);
          setRowCosto(0);
          setRowPrecio(0);
          setRowProveedor('');
          setRowResorte('');
          setRowNotas('');
          setRowSeleccion('');
          setAddRowValues({});
          setAddSupplyRowOpen(false);
          setCodigoSuggestions([]);
          setNombreSuggestions([]);
          setShowCodigoSuggestions(false);
          setShowNombreSuggestions(false);
        };

        const handleDeleteRow = (rowId: number) => {
          if (isSurtidorOnly) return;
          if (confirm("¿Estás seguro de eliminar este registro de surtido?")) {
            handleUpdateSubmenuData((prev: any[]) => prev.filter(r => r.id !== rowId));
            setSelectedRowIds(prev => prev.filter(id => id !== rowId));
            deleteFromSupabase(activeSupplySubmenu, rowId);
          }
        };

        const handleDeleteSelected = () => {
          if (isSurtidorOnly) return;
          if (selectedRowIds.length === 0) return;
          if (confirm(`¿Estás seguro de que deseas eliminar los ${selectedRowIds.length} registros seleccionados de forma masiva?`)) {
            handleUpdateSubmenuData((prev: any[]) => prev.filter(r => !selectedRowIds.includes(r.id)));
            deleteFromSupabase(activeSupplySubmenu, selectedRowIds);
            setSelectedRowIds([]);
          }
        };

        const handleClearAllSubmenuRows = () => {
          if (isSurtidorOnly) return;
          const count = currentSubmenuData.length;
          if (count === 0) {
            alert("No hay registros para borrar en esta sección.");
            return;
          }
          if (confirm(`⚠️ ALERTA DE BORRADO MASIVO \n\n¿Estás completamente seguro de eliminar TODOS los ${count} registros de esta sección (${activeMeta.name})?\n\nEsta acción borrará la tabla entera.`)) {
            handleUpdateSubmenuData([]);
            clearTableInSupabase(activeSupplySubmenu);
            setSelectedRowIds([]);
          }
        };

        const handleStartEditRow = (row: any) => {
          if (isSurtidorOnly) return;
          setEditingRowId(row.id);
          setEditRowCodigo(row.codigo || '');
          setEditRowNombre(row.nombre_producto || '');
          setEditRowUnidades(safeVal(row.unidad_surtida));
          setEditRowCosto(safeVal(row.costo_surtido));
          setEditRowPrecio(safeVal(row.precio_venta));
          setEditRowProveedor(row.proveedor || '');
          setEditRowResorte(row.resorte || '');
          setEditRowNotas(row.notas || '');
          setEditRowValues(row.values || {});
        };

        const handleSaveRow = (rowId: number) => {
          let updatedFields: any = null;
          handleUpdateSubmenuData((prev: any[]) => prev.map(r => {
            if (r.id === rowId) {
              const activeSubHeaders = cleanHeaders(submenuHeaders[activeSupplySubmenu] || []);
              const hasDynamicHeaders = activeSubHeaders.length > 0;
              if (hasDynamicHeaders) {
                const updatedValues = { ...(r.values || {}), ...editRowValues };
                
                // Extract standard fields using header mapping
                let colCodigo = -1;
                let colNombre = -1;
                let colUnidades = -1;
                let colCosto = -1;
                let colPrecio = -1;
                let colProveedor = -1;
                let colResorte = -1;
                let colNotas = -1;
                const headers = activeSubHeaders;
                const headersCleaned = headers.map(h => h.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]/g, "").trim());
                
                headersCleaned.forEach((h, idx) => {
                  if (h === 'codigo' || h === 'sku' || h === 'codig' || h === 'code') colCodigo = idx;
                  else if (h === 'producto' || h === 'nombre' || h === 'articulo') colNombre = idx;
                  else if (h === 'surtir' || h === 'cantidad' || h === 'unidades' || h === 'cant') colUnidades = idx;
                  else if (h === 'costo') colCosto = idx;
                  else if (h === 'precio' || h === 'preciovta' || h === 'precioventa' || h === 'preciodeventa' || h === 'precio_vta' || h === 'precioregular') colPrecio = idx;
                  else if (h === 'proveedor') colProveedor = idx;
                  else if (h === 'resor' || h === 'resort' || h === 'resorte') colResorte = idx;
                  else if (h === 'notas') colNotas = idx;
                });
                
                headersCleaned.forEach((h, idx) => {
                  if (colCodigo === -1 && (h.includes('codigo') || h.includes('sku') || h.includes('codig') || h === 'ref' || h === 'code')) colCodigo = idx;
                  if (colNombre === -1 && (h.includes('producto') || h.includes('nombre') || h.includes('articulo') || h === 'item' || h.includes('descripcion'))) colNombre = idx;
                  if (colUnidades === -1 && (h.includes('surtir') || h.includes('surtid') || h.includes('cantidad') || h.includes('unidad') || h.includes('piezas'))) colUnidades = idx;
                  if (colCosto === -1 && (h.includes('costo') || h.includes('compra') || h.includes('adquisicion'))) colCosto = idx;
                  if (colPrecio === -1 && (h.includes('precio') || h.includes('venta') || h === 'pv' || h === 'p_venta' || h.includes('vta'))) colPrecio = idx;
                  if (colProveedor === -1 && (h.includes('proveedor') || h.includes('marca') || h.includes('distribuidor'))) colProveedor = idx;
                  if (colResorte === -1 && (h.includes('resor') || h.includes('resort') || h.includes('resorte'))) colResorte = idx;
                  if (colNotas === -1 && h.includes('nota')) colNotas = idx;
                });

                const codeHeader = colCodigo !== -1 ? headers[colCodigo] : '';
                const nameHeader = colNombre !== -1 ? headers[colNombre] : '';
                const unidadesHeader = colUnidades !== -1 ? headers[colUnidades] : '';
                const costoHeader = colCosto !== -1 ? headers[colCosto] : '';
                const precioHeader = colPrecio !== -1 ? headers[colPrecio] : '';
                const provHeader = colProveedor !== -1 ? headers[colProveedor] : '';
                const resorteHeader = colResorte !== -1 ? headers[colResorte] : '';
                const notasHeader = colNotas !== -1 ? headers[colNotas] : '';

                const cleanNumVal = (str: any): number => {
                  if (str === undefined || str === null) return 0;
                  const cleaned = String(str).replace(/[^0-9.,-]/g, '').trim();
                  if (!cleaned) return 0;
                  if (cleaned.includes(',') && !cleaned.includes('.')) return parseFloat(cleaned.replace(',', '.')) || 0;
                  if (cleaned.includes(',') && cleaned.includes('.')) return parseFloat(cleaned.replace(/,/g, '')) || 0;
                  return parseFloat(cleaned) || 0;
                };

                const finalCode = codeHeader ? String(updatedValues[codeHeader] || '').trim().toUpperCase() : r.codigo;
                const finalName = nameHeader ? String(updatedValues[nameHeader] || '').trim() : r.nombre_producto;
                const finalPrecio = precioHeader ? cleanNumVal(updatedValues[precioHeader]) : r.precio_venta;

                updatedFields = {
                  codigo: finalCode,
                  nombre: finalName,
                  precio_venta: finalPrecio
                };

                return {
                  ...r,
                  codigo: finalCode,
                  nombre_producto: finalName,
                  unidad_surtida: unidadesHeader ? cleanNumVal(updatedValues[unidadesHeader]) : r.unidad_surtida,
                  costo_surtido: costoHeader ? cleanNumVal(updatedValues[costoHeader]) : r.costo_surtido,
                  precio_venta: finalPrecio,
                  proveedor: provHeader ? String(updatedValues[provHeader] || '').trim() : r.proveedor,
                  resorte: resorteHeader ? String(updatedValues[resorteHeader] || '').trim() : r.resorte,
                  notas: notasHeader ? String(updatedValues[notasHeader] || '').trim() : r.notas,
                  values: updatedValues
                };
              } else {
                updatedFields = {
                  codigo: editRowCodigo.trim().toUpperCase(),
                  nombre: editRowNombre.trim(),
                  precio_venta: safeVal(editRowPrecio)
                };
                return {
                  ...r,
                  codigo: editRowCodigo.trim().toUpperCase(),
                  nombre_producto: editRowNombre.trim(),
                  unidad_surtida: safeVal(editRowUnidades),
                  costo_surtido: safeVal(editRowCosto),
                  precio_venta: safeVal(editRowPrecio),
                  proveedor: editRowProveedor.trim() || 'Proveedor General',
                  resorte: editRowResorte.trim(),
                  notas: editRowNotas.trim()
                };
              }
            }
            return r;
          }));

          // Synchronize with Products catalog
          if (updatedFields && onUpdateProduct && products.length > 0) {
            const prod = products.find(p => 
              (p.codigo && updatedFields.codigo && p.codigo.trim().toLowerCase() === updatedFields.codigo.trim().toLowerCase()) ||
              (p.nombre && updatedFields.nombre && p.nombre.trim().toLowerCase() === updatedFields.nombre.trim().toLowerCase())
            );
            if (prod) {
              onUpdateProduct(prod.id, { precio_venta: Number(updatedFields.precio_venta) });
            }
          }

          setEditingRowId(null);
        };

        const handleCancelEditRow = () => {
          setEditingRowId(null);
        };

        const handleRegisterNewSubmenu = () => {
          if (!newSubmenuTitle.trim()) {
            alert("Por favor escribe el Título de registro de máquina.");
            return;
          }
          
          const cleanTitle = newSubmenuTitle.trim();
          let displayName = newSubmenuName.trim() || cleanTitle;
          
          // Generate key/id and display label ensuring proper categorization
          let generatedId = 'custom_' + cleanTitle.toLowerCase().trim().replace(/[^a-z0-9]/g, '_');
          if (newSubmenuGroup === 'bebidas') {
            if (!generatedId.includes('bb') && !generatedId.includes('bebida')) {
              generatedId += '_bb';
            }
            if (!displayName.toLowerCase().includes('bb') && !displayName.toLowerCase().includes('bebida')) {
              displayName += ' (BB)';
            }
          } else if (newSubmenuGroup === 'cafe') {
            if (!generatedId.includes('cafe')) {
              generatedId += '_cafe';
            }
            if (!displayName.toLowerCase().includes('cafe') && !displayName.toLowerCase().includes('café')) {
              displayName += ' (Café)';
            }
          }

          if (supplySubmenuList.some(s => s.id === generatedId)) {
            alert("Ya existe un acceso registrado bajo este mismo título de registro.");
            return;
          }
          
          const newTabItem = {
            id: generatedId,
            name: displayName,
            title: cleanTitle,
            desc: newSubmenuDesc.trim() || `Surtido para ${cleanTitle}.`,
            convenio: newSubmenuConvenio,
            cliente: newSubmenuCliente.trim(),
            grupo: newSubmenuGroup
          };

          setSupplySubmenuList(prev => sortSubmenus([...prev, newTabItem]));
          
          const initialRow = { 
            id: 1, 
            codigo: `${cleanTitle.substring(0,3).toUpperCase()}-1`, 
            nombre_producto: `Insumo Inicial ${cleanTitle}`, 
            unidad_surtida: 40, 
            costo_surtido: 35.00, 
            precio_venta: 70.00, 
            proveedor: 'Proveedor Asociado', 
            fecha_registro: new Date().toISOString().split('T')[0] 
          };

          // Bootstrap state
          setGenericSubmenuData(prev => ({
            ...prev,
            [generatedId]: [initialRow]
          }));

          // Persist custom submenu definition in Supabase metadata table
          supabase.from('surtido_submenus').upsert({
            id: generatedId,
            name: displayName,
            title: cleanTitle,
            description: newTabItem.desc,
            convenio: newSubmenuConvenio,
            cliente: newSubmenuCliente.trim(),
            grupo: newSubmenuGroup
          }).then(({ error }) => {
            if (error) {
              console.log("Supabase submenus config status:", error.message);
            } else {
              console.log("Submenu registered successfully in Supabase!");
              // Save default row inside the new table in Supabase!
              setTimeout(() => saveToSupabase(generatedId, [initialRow]), 200);
            }
          });

          setActiveCategory(newSubmenuGroup as any);
          setActiveSupplySubmenu(generatedId);
          setNewSubmenuName('');
          setNewSubmenuTitle('');
          setNewSubmenuCliente('');
          setNewSubmenuDesc('');
          setNewSubmenuGroup('botana');
          setNewSubmenuConvenio('NO');
          setAddSubmenuOpen(false);
        };

        const handleSaveEditedSubmenu = () => {
          if (!editSubmenuTitle.trim()) {
            alert("Por favor escribe el Título de registro de máquina.");
            return;
          }

          const cleanTitle = editSubmenuTitle.trim();

          setSupplySubmenuList(prev => sortSubmenus(prev.map(s => {
            if (s.id === editSubmenuId) {
              return {
                ...s,
                name: cleanTitle,
                title: cleanTitle,
                desc: editSubmenuDesc.trim() || `Administración, adición y exportación de surtidos para el acceso ${cleanTitle}.`,
                cliente: editSubmenuCliente.trim(),
                convenio: editSubmenuConvenio,
                grupo: editSubmenuGroup
              };
            }
            return s;
          })));

          // Persist to Supabase if connected
          supabase.from('surtido_submenus').upsert({
            id: editSubmenuId,
            name: cleanTitle,
            title: cleanTitle,
            description: editSubmenuDesc.trim() || `Administración, adición y exportación de surtidos para el acceso ${cleanTitle}.`,
            cliente: editSubmenuCliente.trim(),
            convenio: editSubmenuConvenio,
            grupo: editSubmenuGroup
          }).then(({ error }) => {
            if (error) {
              console.log("Supabase submenus update status:", error.message);
            } else {
              console.log("Submenu updated successfully in Supabase!");
            }
          });

          setIsEditSubmenuOpen(false);
        };

        const handleDeleteSubmenu = (submenuId: string) => {
          const submenu = supplySubmenuList.find(s => s.id === submenuId);
          if (!submenu) return;
          
          const isDefault = ['cer_bb', 'art_alt', 'art_ct'].includes(submenuId);
          const confirmMsg = isDefault 
            ? `¿Estás seguro de que deseas eliminar la sección predeterminada "${submenu.name}"? Se perderán todos sus datos.`
            : `¿Estás seguro de que deseas eliminar la sección "${submenu.name}"? Esta acción borrará el acceso y todos sus datos asociados.`;
            
          if (!window.confirm(confirmMsg)) {
            return;
          }

          // Delete from local list state
          setSupplySubmenuList(prev => prev.filter(s => s.id !== submenuId));
          
          // Clean up generic state data
          setGenericSubmenuData(prev => {
            const copy = { ...prev };
            delete copy[submenuId];
            return copy;
          });

          // Clean up localStorage for this specific submenu data
          try {
            localStorage.removeItem(`surtiantojo_${submenuId}`);
            
            const deletedStored = localStorage.getItem('surtiantojo_deleted_submenu_ids');
            const deletedIds = deletedStored ? JSON.parse(deletedStored) : [];
            if (!deletedIds.includes(submenuId)) {
              deletedIds.push(submenuId);
              localStorage.setItem('surtiantojo_deleted_submenu_ids', JSON.stringify(deletedIds));
            }
          } catch (e) {}

          // Delete from Supabase 'surtido_submenus' metadata table if connected
          supabase.from('surtido_submenus').delete().eq('id', submenuId).then(({ error }) => {
            if (error) {
              console.log("Supabase submenus delete status:", error.message);
            } else {
              console.log("Submenu deleted from Supabase!");
            }
          });

          // Clear table data in Supabase if any
          clearTableInSupabase(submenuId);

          // If the deleted submenu was the active one, switch to the first available
          if (activeSupplySubmenu === submenuId) {
            const remaining = supplySubmenuList.filter(s => s.id !== submenuId);
            if (remaining.length > 0) {
              setActiveSupplySubmenu(remaining[0].id);
            } else {
              setActiveSupplySubmenu('art_alt');
            }
          }

          setIsEditSubmenuOpen(false);
        };

        // 1. RENDER DEDICATED FULL SECTION/PAGE FORM IF MACHINE IS SELECTED FOR REFILL
        if (activeRefillMachineId && activeMachine) {
          return (
            <div className="space-y-6 text-left select-none">
              
              {/* Back Header */}
              <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => {
                      setActiveRefillMachineId(null);
                      setSelectedRefillProduct(null);
                      setSessionRefills([]);
                      setProductCounts({});
                    }}
                    className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-black text-xs uppercase tracking-wider rounded-xl transition-all flex items-center gap-1.5 cursor-pointer shadow-3xs"
                  >
                    ← Regresar al Surtido
                  </button>
                  <div>
                    <h4 className="text-xl font-black text-slate-800 flex items-center gap-2 mt-1 sm:mt-0">
                      {getSurtidoIcon(activeMachine.icon)}
                      Llenado & Control: {activeMachine.name}
                    </h4>
                    <p className="text-xs text-slate-400 font-semibold">{activeMachine.alias}</p>
                  </div>
                </div>

                <div className="px-3 py-1 bg-[#043077]/10 text-[#043077] rounded-all text-[10px] font-black uppercase tracking-widest self-stretch sm:self-auto text-center">
                  Módulo de Surtido Directo
                </div>
              </div>

              {/* Grid interactive display split */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6">
                
                {/* Left side: Selector table of raw products */}
                <div className="lg:col-span-7 bg-white border border-slate-200 rounded-3xl p-3 sm:p-6 shadow-xs flex flex-col gap-4">
                  <div>
                    <h5 className="text-xs font-black text-[#043077] uppercase tracking-wider">
                      1. Selecciona un Producto del Inventario General
                    </h5>
                    <p className="text-[11px] text-slate-400 font-semibold mt-0.5">
                      Asocia el producto o insumo comercial correspondiente que se cargará físicamente en esta terminal.
                    </p>
                  </div>

                  {/* Search filter for fast locating */}
                  <div className="relative">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
                    <input
                      type="text"
                      value={refillSearch}
                      onChange={(e) => setRefillSearch(e.target.value)}
                      placeholder="Buscar producto por nombre o código..."
                      className="w-full pl-9 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:outline-none focus:border-[#043077] focus:ring-1 focus:ring-[#043077]"
                    />
                    {refillSearch && (
                      <button
                        onClick={() => setRefillSearch('')}
                        className="absolute right-3 top-2.5 text-[10px] bg-slate-200 hover:bg-slate-350 px-2 py-1 rounded font-black text-slate-700 transition-all cursor-pointer"
                      >
                        Limpiar
                      </button>
                    )}
                  </div>

                  {/* List of scrollable elements with beautiful individual controls */}
                  <div className="border border-slate-150 rounded-2xl overflow-y-auto overflow-x-hidden divide-y divide-slate-100 max-h-[420px] bg-white w-full">
                    {filteredProductsToSelect.map((prod) => {
                      const prodKey = prod.id || prod.codigo || '';
                      const isSelected = selectedRefillProduct?.id === prod.id || selectedRefillProduct?.codigo === prod.codigo;
                      const count = productCounts[prodKey] || 1;

                      const handleIncrement = (e: React.MouseEvent) => {
                        e.stopPropagation();
                        setProductCounts(prev => ({
                          ...prev,
                          [prodKey]: count + 1
                        }));
                        setSelectedRefillProduct(prod);
                      };

                      const handleDecrement = (e: React.MouseEvent) => {
                        e.stopPropagation();
                        setProductCounts(prev => ({
                          ...prev,
                          [prodKey]: Math.max(1, count - 1)
                        }));
                        setSelectedRefillProduct(prod);
                      };

                      const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
                        const val = parseInt(e.target.value);
                        setProductCounts(prev => ({
                          ...prev,
                          [prodKey]: Math.max(1, isNaN(val) ? 1 : val)
                        }));
                        setSelectedRefillProduct(prod);
                      };

                      const handleAddClick = (e: React.MouseEvent) => {
                        e.stopPropagation();
                        handleAddSessionRefill(prod, count);
                        // Reset count to 1 after adding
                        setProductCounts(prev => ({
                          ...prev,
                          [prodKey]: 1
                        }));
                      };

                      return (
                        <div
                          key={prodKey}
                          onClick={() => setSelectedRefillProduct(prod)}
                          className={`p-3.5 sm:p-4 flex flex-col gap-3 transition-colors text-left ${
                            isSelected ? 'bg-[#043077]/5 border-l-4 border-[#043077]' : 'hover:bg-slate-50'
                          }`}
                        >
                          {/* Name and product details */}
                          <div className="space-y-1 block">
                            <span className="font-extrabold text-slate-800 text-xs sm:text-sm block break-words leading-tight">
                              {prod.nombre || prod.name}
                            </span>
                            <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[10px] font-bold font-mono text-slate-400">
                              <span className="text-[#043077] font-black">{formatMXN(prod.precio_venta)}</span>
                              <span>•</span>
                              <span>Código: {prod.codigo || 'N/D'}</span>
                              <span>•</span>
                              <span>Prov: {prod.proveedor || 'S/P'}</span>
                            </div>
                          </div>

                          {/* Quick counter and Add button - Name first, then counter below, then add button below */}
                          <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between pt-2 border-t border-slate-100/60" onClick={e => e.stopPropagation()}>
                            {/* Counter Selector */}
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] text-slate-400 font-bold uppercase sm:hidden">Pzas:</span>
                              <div className="flex items-center bg-slate-100 rounded-xl border border-slate-205 p-0.5 w-[90px]">
                                <button
                                  type="button"
                                  onClick={handleDecrement}
                                  className="w-5 h-5 bg-white hover:bg-slate-50 text-slate-600 rounded-lg flex items-center justify-center border border-slate-200 cursor-pointer text-xs font-black active:scale-95 transition-all shadow-3xs"
                                >
                                  -
                                </button>
                                <input
                                  type="number"
                                  value={count}
                                  onChange={handleInputChange}
                                  className="w-full text-center font-mono font-black text-slate-800 bg-transparent text-xs focus:outline-none"
                                />
                                <button
                                  type="button"
                                  onClick={handleIncrement}
                                  className="w-5 h-5 bg-white hover:bg-slate-50 text-slate-600 rounded-lg flex items-center justify-center border border-slate-200 cursor-pointer text-xs font-black active:scale-95 transition-all shadow-3xs"
                                >
                                  +
                                </button>
                              </div>
                            </div>

                            {/* Discrete Add Button */}
                            <button
                              type="button"
                              onClick={handleAddClick}
                              className="px-2.5 py-1.5 bg-[#043077] hover:bg-opacity-95 active:scale-95 transition-all text-white font-black text-[10px] uppercase tracking-wider rounded-lg cursor-pointer flex items-center justify-center gap-1 shadow-3xs w-full sm:w-auto self-stretch"
                            >
                              <Plus className="w-3 h-3 stroke-[3]" /> Agregar
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Right side: Amount picker / refill configurations */}
                <div className="lg:col-span-5 flex flex-col gap-6">
                  
                  {/* Visual Status Metrics */}
                  <div className="bg-white border border-slate-200 rounded-3xl p-3.5 sm:p-6 shadow-xs space-y-4">
                    <h5 className="text-xs font-black text-slate-700 uppercase tracking-wider">
                      Métricas acumuladas del icono seleccionado
                    </h5>

                    <div className="grid grid-cols-2 gap-3 text-center">
                      <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100">
                        <span className="text-[9px] text-[#043077] font-black uppercase tracking-wider block">Nivel Actual</span>
                        <span className="text-sm font-black text-slate-800 font-mono mt-1 block">
                          {activeMachine.stock} / {activeMachine.maxStock} {activeMachine.unit}
                        </span>
                      </div>
                      <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100">
                        <span className="text-[9px] text-emerald-600 font-black uppercase tracking-wider block">Histórico Surtido</span>
                        <span className="text-sm font-black text-slate-800 font-mono mt-1 block">
                          {(activeMachine as any).totalFilledAmount || 0} {activeMachine.unit}
                        </span>
                      </div>
                      <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100">
                        <span className="text-[9px] text-slate-400 font-black uppercase tracking-wider block">Llenados Totales</span>
                        <span className="text-sm font-black text-slate-800 font-mono mt-1 block">
                          {(activeMachine as any).fillCount || 0} veces
                        </span>
                      </div>
                      <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100">
                        <span className="text-[9px] text-slate-400 font-black uppercase tracking-wider block font-sans">Último Llenado</span>
                        <span className="text-[11px] font-black text-slate-700 mt-1 block truncate">
                          {(activeMachine as any).lastFilledDate || 'Ninguno'}
                        </span>
                      </div>
                    </div>

                    <div className="p-3 bg-[#043077]/5 rounded-xl border border-[#043077]/10 text-xs">
                      <span className="text-[9px] font-black text-[#043077] uppercase block">Producto actual en máquina:</span>
                      <span className="text-[11px] font-black text-slate-800 mt-0.5 block">
                        {(activeMachine as any).loadedProduct || 'Ninguno'}
                      </span>
                    </div>
                  </div>

                  {/* Lote de Llenado Temporal - NUEVA SECCIÓN MULTI-SURTIDO */}
                  <div className="bg-white border border-slate-200 rounded-3xl p-3.5 sm:p-6 shadow-xs space-y-4 flex flex-col flex-1">
                    <div className="flex justify-between items-center">
                      <div>
                        <h5 className="text-xs font-black text-slate-700 uppercase tracking-wider">
                          Lote de Llenado Reciente
                        </h5>
                        <p className="text-[10px] text-slate-400 font-semibold">Insumos listos para registrar</p>
                      </div>
                      <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 text-[10px] font-black rounded-lg">
                        {sessionRefills.length} Items
                      </span>
                    </div>

                    {sessionRefills.length === 0 ? (
                      <div className="p-8 border border-dashed border-slate-200 rounded-2xl text-center text-slate-400 text-xs font-medium bg-slate-50/50 flex-1 flex flex-col items-center justify-center gap-2 min-h-[120px]">
                        <Boxes className="w-8 h-8 text-slate-300 stroke-[1.5]" />
                        <span>El lote está vacío. Selecciona un producto a la izquierda y agrégalo.</span>
                      </div>
                    ) : (
                      <div className="flex-1 flex flex-col gap-3 min-h-[160px] max-h-[300px] overflow-y-auto pr-1">
                        <div className="divide-y divide-slate-100 border border-slate-100 rounded-2xl overflow-hidden bg-slate-50/40">
                          {sessionRefills.map((item) => (
                            <div key={item.id} className="p-3 flex justify-between items-center text-xs hover:bg-slate-50 transition-colors">
                              <div className="space-y-0.5 flex-1 pr-2">
                                <span className="font-extrabold text-slate-800 block leading-tight">{item.name}</span>
                                <span className="text-[10px] text-slate-400 font-bold block">Código: {item.codigo}</span>
                              </div>
                              <div className="flex items-center gap-4 shrink-0">
                                <div className="text-right">
                                  <span className="font-mono font-black text-[#043077] block text-[11px]">
                                    +{item.amount} pzas
                                  </span>
                                  <span className="text-[9px] text-slate-400 font-semibold block">
                                    Precio: {formatMXN(item.price)}
                                  </span>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteSessionRefill(item.id)}
                                  className="p-1 px-1.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg transition-all cursor-pointer text-xs font-bold"
                                  title="Eliminar de lote"
                                >
                                  ❌
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>

                        {/* Summary of the batch */}
                        <div className="p-3 bg-indigo-50/40 rounded-2xl border border-indigo-100/60 flex justify-between items-center text-xs">
                          <span className="font-bold text-indigo-900">Total de piezas a surtir:</span>
                          <span className="font-mono font-black text-indigo-950 text-sm">
                            {sessionRefills.reduce((acc, item) => acc + item.amount, 0)} unidades
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Master Actions */}
                    <div className="pt-4 border-t border-slate-150 flex gap-3">
                      <button
                        type="button"
                        onClick={() => {
                          setActiveRefillMachineId(null);
                          setSelectedRefillProduct(null);
                          setSessionRefills([]);
                          setProductCounts({});
                        }}
                        className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-2xl text-xs font-black uppercase tracking-wider cursor-pointer transition-all text-center"
                      >
                        Cancelar
                      </button>

                      <button
                        type="button"
                        onClick={() => handleSaveAllSessionRefills(activeMachine.id)}
                        disabled={sessionRefills.length === 0}
                        className={`flex-1 py-3 rounded-2xl text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 shadow-sm text-white ${
                          sessionRefills.length > 0
                            ? 'bg-[#043077] hover:bg-blue-800 cursor-pointer active:scale-95' 
                            : 'bg-slate-200 cursor-not-allowed text-slate-400'
                        }`}
                      >
                        <Check className="w-4 h-4" /> Guardar y Surtido
                      </button>
                    </div>

                  </div>

                </div>

              </div>

            </div>
          );
        }

        // 2. DEFAULT RENDER: MAIN OVERVIEW DECK OF CARDS
        return (
          <div className="space-y-6 text-left">
            
            {/* Elegant Submenu Control Accesses bar */}
            <div className="flex flex-col gap-4">
              <span className="text-[10px] font-black uppercase tracking-widest text-[#043077]">Organización de Accesos Surtido</span>
              
              {/* 4 Core Menus Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {/* Menu 1: Maq. Botana */}
                <button
                  type="button"
                  onClick={() => handleSelectCategory('botana')}
                  className={`p-3.5 rounded-2xl text-left transition-all border flex flex-col justify-between cursor-pointer group relative overflow-hidden ${
                    activeCategory === 'botana'
                      ? 'bg-blue-50/70 border-blue-200 shadow-xs ring-1 ring-blue-100'
                      : 'bg-white hover:bg-slate-50 border-slate-200'
                  }`}
                >
                  <div className="absolute top-0 right-0 p-4 opacity-5 text-blue-900 group-hover:scale-110 transition-transform">
                    <Boxes className="w-16 h-16" />
                  </div>
                  <div className="flex items-center gap-2">
                    <div className={`p-2 rounded-xl ${
                      activeCategory === 'botana' ? 'bg-[#043077] text-white' : 'bg-slate-100 text-slate-600'
                    }`}>
                      <Boxes className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 font-extrabold block uppercase tracking-wider">Menu 1</span>
                      <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider">Maq. Botana</h4>
                    </div>
                  </div>
                  <div className="mt-4 flex items-center justify-between">
                    <span className="text-[10px] text-slate-500 font-bold">
                      {supplySubmenuList.filter(s => getSubmenuGroup(s.id, s.name) === 'botana').length} Accesos
                    </span>
                    {activeCategory === 'botana' && (
                      <span className="w-1.5 h-1.5 rounded-full bg-[#043077]" />
                    )}
                  </div>
                </button>

                {/* Menu 2: Maq. Bebidas */}
                <button
                  type="button"
                  onClick={() => handleSelectCategory('bebidas')}
                  className={`p-3.5 rounded-2xl text-left transition-all border flex flex-col justify-between cursor-pointer group relative overflow-hidden ${
                    activeCategory === 'bebidas'
                      ? 'bg-blue-50/70 border-blue-200 shadow-xs ring-1 ring-blue-100'
                      : 'bg-white hover:bg-slate-50 border-slate-200'
                  }`}
                >
                  <div className="absolute top-0 right-0 p-4 opacity-5 text-blue-900 group-hover:scale-110 transition-transform">
                    <CupSoda className="w-16 h-16" />
                  </div>
                  <div className="flex items-center gap-2">
                    <div className={`p-2 rounded-xl ${
                      activeCategory === 'bebidas' ? 'bg-[#043077] text-white' : 'bg-slate-100 text-slate-600'
                    }`}>
                      <CupSoda className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 font-extrabold block uppercase tracking-wider">Menu 2</span>
                      <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider">Maq. Bebidas</h4>
                    </div>
                  </div>
                  <div className="mt-4 flex items-center justify-between">
                    <span className="text-[10px] text-slate-500 font-bold">
                      {supplySubmenuList.filter(s => getSubmenuGroup(s.id, s.name) === 'bebidas').length} Accesos
                    </span>
                    {activeCategory === 'bebidas' && (
                      <span className="w-1.5 h-1.5 rounded-full bg-[#043077]" />
                    )}
                  </div>
                </button>

                {/* Menu 3: Maq. de Café */}
                <button
                  type="button"
                  onClick={() => handleSelectCategory('cafe')}
                  className={`p-3.5 rounded-2xl text-left transition-all border flex flex-col justify-between cursor-pointer group relative overflow-hidden ${
                    activeCategory === 'cafe'
                      ? 'bg-amber-50/70 border-amber-200 shadow-xs ring-1 ring-amber-100'
                      : 'bg-white hover:bg-slate-50 border-slate-200'
                  }`}
                >
                  <div className="absolute top-0 right-0 p-4 opacity-5 text-amber-900 group-hover:scale-110 transition-transform">
                    <Coffee className="w-16 h-16" />
                  </div>
                  <div className="flex items-center gap-2">
                    <div className={`p-2 rounded-xl ${
                      activeCategory === 'cafe' ? 'bg-amber-600 text-white' : 'bg-slate-100 text-slate-600'
                    }`}>
                      <Coffee className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 font-extrabold block uppercase tracking-wider">Menu 3</span>
                      <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider">Maq. de Café</h4>
                    </div>
                  </div>
                  <div className="mt-4 flex items-center justify-between">
                    <span className="text-[10px] text-slate-500 font-bold">
                      {supplySubmenuList.filter(s => getSubmenuGroup(s.id, s.name) === 'cafe').length} Accesos
                    </span>
                    {activeCategory === 'cafe' && (
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                    )}
                  </div>
                </button>

                {/* Menu 4: Registrar acceso */}
                <button
                  type="button"
                  onClick={() => setAddSubmenuOpen(true)}
                  className="p-3.5 bg-indigo-50/60 border border-indigo-150 rounded-2xl text-left transition-all hover:bg-indigo-100/70 cursor-pointer flex flex-col justify-between group relative overflow-hidden"
                >
                  <div className="absolute top-0 right-0 p-4 opacity-5 text-indigo-900 group-hover:scale-110 transition-transform">
                    <Plus className="w-16 h-16" />
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="p-2 rounded-xl bg-indigo-600 text-white shadow-xs">
                      <Plus className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-[10px] text-indigo-600 font-extrabold block uppercase tracking-wider">Registrar</span>
                      <h4 className="text-xs font-black text-[#043077] uppercase tracking-wider">Nueva maquina</h4>
                    </div>
                  </div>
                  {!isSurtidorOnly && (
                    <div className="mt-4 text-left">
                      <span className="text-[10px] text-indigo-700 font-extrabold flex items-center gap-1">
                        Crear nueva sección +
                      </span>
                    </div>
                  )}
                </button>
              </div>

              {/* Submenu lists for the chosen category */}
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeCategory}
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -5 }}
                  className="bg-slate-50/50 border border-slate-200/60 p-4 rounded-2xl"
                >
                  <div className="flex flex-col gap-2.5">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500">
                      Selecciona el Submenú para {
                        activeCategory === 'botana'
                          ? 'Máquinas de Botana'
                          : activeCategory === 'bebidas'
                            ? 'Máquinas de Bebidas'
                            : 'Máquinas de Café'
                      }:
                    </span>
                    <div className="flex flex-wrap items-center gap-1.5">
                      {supplySubmenuList
                        .filter(submenu => getSubmenuGroup(submenu.id, submenu.name) === activeCategory)
                        .map((submenu) => {
                          const isActive = activeSupplySubmenu === submenu.id;
                          const isMissing = missingTables.includes(`surtido_${submenu.id}`);
                          return (
                            <button
                              key={submenu.id}
                              onClick={() => {
                                setActiveSupplySubmenu(submenu.id);
                                setShowSQLSchema(false);
                                setSubmenuSearchQuery('');
                              }}
                              className={`px-4 py-2.5 text-xs font-black uppercase tracking-wider rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
                                isActive
                                  ? 'bg-[#043077] text-white shadow-md scale-102 ring-2 ring-blue-100'
                                  : 'bg-white hover:bg-slate-100 text-slate-600 border border-slate-200'
                              }`}
                            >
                              {submenu.id === 'vending_surtido' ? (
                                <Sliders className="w-3.5 h-3.5" />
                              ) : (
                                <FileSpreadsheet className={`w-3.5 h-3.5 ${isMissing ? 'text-amber-500' : ''}`} />
                              )}
                              <span>{submenu.name}</span>
                              {isMissing && (
                                <AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0 ml-0.5 animate-pulse" title="Sincronización local activa (Sin tabla en Supabase)" />
                              )}
                              {isActive && !isSurtidorOnly && (
                                <span 
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setEditSubmenuId(submenu.id);
                                    setEditSubmenuName(submenu.name);
                                    setEditSubmenuTitle(submenu.title || `Reporte Surtido ${submenu.name}`);
                                    setEditSubmenuDesc(submenu.desc || submenu.description || '');
                                    setEditSubmenuCliente(submenu.cliente || '');
                                    setIsEditSubmenuOpen(true);
                                  }}
                                  className="p-0.5 rounded-md hover:bg-white/20 transition-all ml-1 flex items-center justify-center shrink-0"
                                  title="Editar nombre de este acceso"
                                >
                                  <Edit className="w-3 h-3 text-white" />
                                </span>
                              )}
                            </button>
                          );
                        })}
                    </div>
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Render dynamically depending on chosen submenu */}
            {activeSupplySubmenu === 'vending_surtido' ? (
              // Option A: Render standard general vending terminals cards
              <div className="space-y-6">
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 p-5 rounded-2xl text-left select-none flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
                  <div>
                    <h4 className="text-sm font-black text-[#043077] uppercase tracking-wider flex items-center gap-2">
                      📥 {activeMeta.title || 'Control Central de Surtido y Abastecimiento'}
                    </h4>
                    <p className="text-xs text-slate-600 font-semibold mt-1.5 leading-relaxed">
                      {activeMeta.desc || 'Selecciona cualquier máquina o icono a continuación para visualizar su producto cargado, configurar su abastecimiento express desde el catálogo o consultar sus métricas de llenado acumuladas en tiempo real.'}
                    </p>
                  </div>
                  {!isSurtidorOnly && (
                    <button
                      type="button"
                      onClick={() => {
                        setEditSubmenuId(activeMeta.id);
                        setEditSubmenuName(activeMeta.name);
                        setEditSubmenuTitle(activeMeta.title || `Reporte Surtido ${activeMeta.name}`);
                        setEditSubmenuDesc(activeMeta.desc || activeMeta.description || '');
                        setEditSubmenuCliente(activeMeta.cliente || '');
                        setIsEditSubmenuOpen(true);
                      }}
                      className="px-3 py-1.5 bg-[#043077]/10 hover:bg-[#043077]/20 text-[#043077] font-black text-[10px] uppercase tracking-wider rounded-lg transition-all flex items-center gap-1.5 shrink-0 cursor-pointer self-stretch md:self-auto text-center justify-center"
                      title="Editar nombre de este acceso"
                    >
                      <Edit className="w-3.5 h-3.5" /> Editar Acceso
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                  {filteredCards.length === 0 ? (
                    <div className="col-span-full bg-white border border-slate-150 rounded-2xl p-12 text-center text-slate-500 font-medium">
                      No se encontraron tarjetas de terminales habilitadas en el sistema.
                    </div>
                  ) : (
                    filteredCards.map((card) => {
                      const pct = Math.round((card.stock / card.maxStock) * 100);
                      
                      let pctColor = "bg-emerald-600";
                      let textColor = "text-emerald-700 bg-emerald-50 border-emerald-100";
                      let statusText = "STOCK LLENO";
                      if (pct < 25) {
                        pctColor = "bg-rose-500";
                        textColor = "text-rose-700 bg-rose-50 border-rose-100";
                        statusText = "S.O.S BAJO";
                      } else if (pct < 60) {
                        pctColor = "bg-amber-500";
                        textColor = "text-amber-700 bg-amber-50 border-amber-100";
                        statusText = "REVISIÓN";
                      }

                      return (
                        <div 
                          key={card.id} 
                          className="bg-white border border-slate-200 hover:border-[#043077]/50 rounded-2xl p-4.5 shadow-2xs hover:shadow-xs transition-all text-left flex flex-col justify-between h-auto min-h-[350px] gap-4"
                        >
                          <div>
                            <div className="flex justify-between items-start">
                              <span className="text-[9px] font-black uppercase tracking-wider text-slate-400 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200">
                                {card.category}
                              </span>
                              <span className={`text-[8px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded-full border ${textColor}`}>
                                {statusText}
                              </span>
                            </div>

                            <div className="flex items-center gap-3 mt-3">
                              <div className="w-10 h-10 rounded-xl bg-[#043077]/5 flex items-center justify-center border border-[#043077]/10 shrink-0">
                                {getSurtidoIcon(card.icon)}
                              </div>
                              <div>
                                <h5 className="text-base font-black text-slate-800 leading-none">{card.name}</h5>
                                <span className="text-[10px] text-slate-400 font-semibold block mt-1 leading-tight line-clamp-1">{card.alias}</span>
                              </div>
                            </div>
                          </div>

                          <div className="bg-slate-50/50 p-2.5 rounded-xl border border-slate-100 space-y-1.5 text-[11px] leading-snug">
                            <div className="flex justify-between text-slate-500">
                              <span>🔄 Llenados:</span>
                              <span className="font-extrabold text-slate-800">{(card as any).fillCount || 0} veces</span>
                            </div>
                            <div className="flex justify-between text-slate-500">
                              <span>📦 Acumulado Surtido:</span>
                              <span className="font-extrabold text-slate-800">{(card as any).totalFilledAmount || 0} {card.unit}</span>
                            </div>
                            <div className="text-slate-500 truncate" title={(card as any).loadedProduct || 'Sin producto'}>
                              <span>🏷️ Producto: </span>
                              <span className="font-black text-[#043077]">{(card as any).loadedProduct || 'Sin asignar'}</span>
                            </div>
                            <div className="flex justify-between text-slate-400 text-[10px] italic">
                              <span>🕒 Recarga:</span>
                              <span>{(card as any).lastFilledDate || 'Ninguna'}</span>
                            </div>
                          </div>

                          <div className="space-y-1">
                            <div className="flex justify-between items-center text-xs">
                              <span className="text-slate-500 font-bold uppercase tracking-wider text-[9px]">Capacidad:</span>
                              <span className="font-mono font-black text-slate-700 text-[11px]">
                                {card.stock} / {card.maxStock} {card.unit} ({pct}%)
                              </span>
                            </div>

                            <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden border border-slate-200/50">
                              <div 
                                className={`h-full rounded-full transition-all duration-300 ${pctColor}`}
                                style={{ width: `${pct}%` }}
                              ></div>
                            </div>
                          </div>

                          <div className="pt-2 border-t border-slate-100">
                            <button
                              onClick={() => {
                                setActiveRefillMachineId(card.id);
                                const matchedDefault = availableProducts.find(p => 
                                  (p.nombre || p.name || '').toLowerCase().includes(card.name.toLowerCase()) ||
                                  (p.codigo || p.id || '').toLowerCase().includes(card.id.toLowerCase())
                                );
                                setSelectedRefillProduct(matchedDefault || availableProducts[0]);
                                setRefillSearch('');
                                setRefillAmount(1);
                                setSessionRefills([]);
                                setProductCounts({});
                              }}
                              className="w-full py-2 bg-[#043077] hover:bg-blue-800 text-white font-black text-[10px] uppercase tracking-wider rounded-lg transition-all flex items-center justify-center gap-1 cursor-pointer shadow-3xs"
                            >
                              <Plus className="w-3.5 h-3.5 animate-pulse" /> Ver Producto / Llenar
                            </button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            ) : (
              // Option B: Render dynamically defined spreadsheets with Excel CSV Export
              <div className="space-y-6">
                
                {/* Section Header */}
                <div className="bg-slate-50 border border-slate-200 p-5 rounded-2xl flex flex-col md:flex-row gap-4 items-start md:items-center justify-between text-left">
                  <div>
                    <h3 className="text-lg font-black text-slate-800 flex items-center gap-2 flex-wrap">
                      <FileSpreadsheet className="w-5 h-5 text-[#043077]" />
                      <span>{activeMeta.title}</span>
                      {activeMeta.convenio && (
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider border ${
                          activeMeta.convenio === 'SI' 
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                            : 'bg-slate-100 text-slate-500 border-slate-200'
                        }`}>
                          Convenio: {activeMeta.convenio}
                        </span>
                      )}
                      {activeMeta.cliente && (
                        <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider border bg-indigo-50 text-indigo-700 border-indigo-200">
                          Cliente: {activeMeta.cliente}
                        </span>
                      )}
                      {!isSurtidorOnly && (
                        <button
                          type="button"
                          onClick={() => {
                            setEditSubmenuId(activeMeta.id);
                            setEditSubmenuName(activeMeta.name);
                            setEditSubmenuTitle(activeMeta.title || `Reporte Surtido ${activeMeta.name}`);
                            setEditSubmenuDesc(activeMeta.desc || activeMeta.description || '');
                            setEditSubmenuCliente(activeMeta.cliente || '');
                            setIsEditSubmenuOpen(true);
                          }}
                          className="px-2 py-1 bg-slate-200 hover:bg-slate-300 text-slate-600 font-bold text-[9px] uppercase tracking-wider rounded-md transition-all flex items-center gap-1.5 cursor-pointer ml-2 shrink-0"
                          title="Editar nombre y descripción de este acceso"
                        >
                          <Edit className="w-3 h-3" /> Editar Acceso
                        </button>
                      )}
                    </h3>
                    <p className="text-xs text-slate-500 font-bold mt-1 leading-relaxed max-w-2xl">{activeMeta.desc}</p>
                  </div>
                  
                  {/* Master quick import Excel trigger */}
                  {!isSurtidorOnly && (
                    <label
                      className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs uppercase tracking-wider rounded-xl transition-all flex items-center gap-2 cursor-pointer shadow-xs whitespace-nowrap self-stretch md:self-auto text-center justify-center select-none"
                    >
                      <Download className="w-4 h-4 rotate-180" /> Importar de Excel (.csv)
                      <input
                        type="file"
                        accept=".csv,.txt"
                        className="hidden"
                        onChange={(e) => handleImportSubmenuCSV(e, activeSupplySubmenu)}
                      />
                    </label>
                  )}
                </div>

                {(() => {
                  const isCurrentTableMissing = missingTables.includes(`surtido_${activeSupplySubmenu}`);
                  if (!supabaseError && !isCurrentTableMissing) return null;
                  
                  const activeTableName = `surtido_${activeSupplySubmenu}`;
                  const displayError = supabaseError || `La tabla '${activeTableName}' para la sección '${activeMeta.name}' no existe en tu base de datos de Supabase. La información que importes o registres se guardará de forma local en tu navegador (Local), pero NO se sincronizará en la nube de Supabase hasta que crees la tabla correspondiente.`;
                  
                  return (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="p-5 bg-amber-50 border border-amber-200 text-amber-900 rounded-2xl flex flex-col md:flex-row gap-4 items-start text-left shadow-2xs relative"
                    >
                      <AlertTriangle className="w-6 h-6 text-amber-600 shrink-0 mt-0.5" />
                      <div className="space-y-1.5 flex-1 w-full">
                        <h4 className="text-xs font-black uppercase tracking-wider text-amber-800 flex items-center gap-1.5">
                          ⚠️ Sincronización Local Activa (No guardado en Supabase)
                        </h4>
                        <p className="text-xs text-amber-700 leading-relaxed font-semibold">
                          {displayError}
                        </p>
                        <div className="text-[11px] text-amber-800 font-medium bg-amber-100/50 p-4 rounded-xl border border-amber-200/50 space-y-1 mt-2">
                          <span className="block font-black uppercase text-[10px] tracking-wide mb-1.5 text-amber-900">¿Cómo solucionar esto en tu panel de Supabase?</span>
                          <ol className="list-decimal pl-4 space-y-1.5 font-bold">
                            <li>
                              Haz clic en el botón <span className="font-extrabold text-amber-900 bg-amber-200/70 px-1.5 py-0.5 rounded border border-amber-300 text-[10px] inline-block">📋 Copiar Script SQL</span> de abajo.
                            </li>
                            <li>
                              Abre tu consola de administración de Supabase (SQL Editor), crea una nueva consulta ("New Query"), pega el código y haz clic en el botón <span className="text-emerald-700 font-extrabold">"Run"</span>. ¡Y listo!
                            </li>
                          </ol>
                        </div>
                        
                        <div className="flex flex-wrap gap-2 mt-3.5">
                          <button
                            type="button"
                            onClick={() => {
                              navigator.clipboard.writeText(getDynamicSQL());
                              setCopiedSQL(true);
                              setTimeout(() => setCopiedSQL(false), 2000);
                            }}
                            className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white text-[11px] font-black uppercase tracking-wider rounded-lg transition-all flex items-center gap-1.5 shadow-sm cursor-pointer select-none"
                          >
                            <span>{copiedSQL ? '✓ ¡Script Copiado!' : '📋 Copiar Script SQL de Sincronización'}</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setShowSQLSchema(!showSQLSchema)}
                            className="px-3 py-1.5 bg-white hover:bg-slate-100 text-amber-900 border border-amber-200 text-[11px] font-black uppercase tracking-wider rounded-lg transition-all flex items-center gap-1.5 shadow-2xs cursor-pointer select-none"
                          >
                            <span>{showSQLSchema ? 'Ocultar Detalle SQL' : '👁️ Ver Detalle SQL'}</span>
                          </button>
                        </div>
                      </div>
                      
                      {supabaseError && (
                        <button
                          type="button"
                          onClick={() => setSupabaseError(null)}
                          className="absolute top-4 right-4 text-amber-500 hover:text-amber-800 font-black text-xs cursor-pointer px-2 py-1 bg-amber-100 hover:bg-amber-200 rounded-lg"
                          title="Ocultar advertencia"
                        >
                          Cerrar [X]
                        </button>
                      )}
                    </motion.div>
                  );
                })()}

                {/* KPI Metrics Dashboard has been removed as requested */}

                {/* Notice when viewing in Surtidor mode */}
                {isSurtidorOnly && (
                  <div className="bg-amber-50 border-2 border-amber-300/80 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-amber-950 shadow-xs mb-2">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 bg-amber-500 text-white rounded-xl shadow-xs shrink-0">
                        <Lock className="w-5 h-5 stroke-[2.5]" />
                      </div>
                      <div>
                        <h4 className="text-xs font-black uppercase tracking-wider text-amber-950 flex items-center gap-1.5">
                          🔒 TABLA CON CANDADO — SOLO LECTURA (ROL SURTIDOR)
                        </h4>
                        <p className="text-xs text-amber-900 font-medium leading-relaxed">
                          En el rol Surtidor las tablas de registros están protegidas con candado. No es posible editar, agregar ni eliminar información. Únicamente el perfil <strong>Administrador</strong> tiene permisos para modificar.
                        </p>
                      </div>
                    </div>
                    <span className="px-3 py-1 bg-amber-200/80 text-amber-950 text-[10px] font-black uppercase tracking-widest rounded-lg shrink-0 border border-amber-300">
                      Candado Activo 🔒
                    </span>
                  </div>
                )}

                {/* Submenu filters & rows manipulation bar */}
                <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-start">
                  {/* Actions buttons */}
                  <div className="flex flex-wrap gap-2 shrink-0 w-full">
                    {/* 1. Agregar Registro */}
                    {!isSurtidorOnly && (
                      <button
                        type="button"
                        onClick={() => setAddSupplyRowOpen(!addSupplyRowOpen)}
                        className="px-3.5 py-2 bg-[#043077] hover:bg-blue-800 text-white text-xs font-black uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-1 cursor-pointer shadow-3xs"
                      >
                        <Plus className="w-3.5 h-3.5" /> Agregar Registro
                      </button>
                    )}

                    {/* 1b. Agregar Columna de Fecha (+) */}
                    {!isSurtidorOnly && (
                      <button
                        type="button"
                        onClick={() => handleAddFechaColumn()}
                        className="px-3.5 py-2 bg-indigo-50 hover:bg-indigo-100 text-[#043077] border border-indigo-200 text-xs font-black uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-3xs"
                        title="Agregar otra columna de Fecha sin límite (+)"
                      >
                        <Plus className="w-4 h-4 stroke-[3]" /> + Fecha
                      </button>
                    )}

                    {/* 2. Exportar en Excel */}
                    {currentSubmenuData.length > 0 && (
                      <button
                        type="button"
                        onClick={() => handleExportToExcel(activeSupplySubmenu)}
                        className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-3xs"
                        title="Exportar registros de esta sección a Excel"
                      >
                        <FileSpreadsheet className="w-4 h-4" /> Exportar en Excel
                      </button>
                    )}

                    {/* 3. Exportar Todo */}
                    <button
                      type="button"
                      onClick={handleExportAllToExcel}
                      className="px-3.5 py-2 bg-slate-700 hover:bg-slate-800 text-white text-xs font-black uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-3xs"
                      title="Exportar todos los registros de todos los submenús a un solo archivo Excel"
                    >
                      <Layers className="w-4 h-4" /> Exportar Todo
                    </button>

                    {/* Borrar Seleccionados (contextual button, only shown if checkboxes are ticked) */}
                    {!isSurtidorOnly && selectedRowIds.length > 0 && (
                      <button
                        type="button"
                        onClick={handleDeleteSelected}
                        className="px-3.5 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-black uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-3xs"
                        title="Eliminar registros seleccionados con la casilla"
                      >
                        <Trash2 className="w-3.5 h-3.5" /> Borrar Seleccionados ({selectedRowIds.length})
                      </button>
                    )}

                    {/* 4. Vaciar máquina */}
                    {!isSurtidorOnly && currentSubmenuData.length > 0 && (
                      <button
                        type="button"
                        onClick={handleClearAllSubmenuRows}
                        className="px-3.5 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200/30 text-xs font-bold uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                        title="Eliminar todos los registros de esta sección de forma masiva"
                      >
                        <Trash2 className="w-3.5 h-3.5" /> Vaciar máquina
                      </button>
                    )}

                    {/* 5. SQL */}
                    <button
                      type="button"
                      onClick={() => setShowSQLSchema(!showSQLSchema)}
                      className={`px-3.5 py-2 text-xs font-bold uppercase tracking-wider rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
                        showSQLSchema
                          ? 'bg-amber-100 text-amber-800 border border-amber-200'
                          : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200/40'
                      }`}
                    >
                      ⚡ SQL
                    </button>
                  </div>
                </div>

                {/* Interactive Dynamic Form for adding records to active spreadsheet */}
                {addSupplyRowOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-5 bg-slate-50 border border-slate-200 rounded-2xl text-left space-y-4"
                  >
                    <div className="flex justify-between items-center border-b border-slate-150 pb-2">
                      <h4 className="text-xs font-black text-slate-800 uppercase tracking-widest">
                        ➕ Añadir Registro a {activeMeta.name}
                      </h4>
                      <button 
                        type="button" 
                        onClick={() => setAddSupplyRowOpen(false)} 
                        className="text-slate-400 hover:text-slate-600 font-extrabold text-sm"
                      >
                        ✕
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-6 gap-3">
                      <div className="space-y-1 relative">
                        <label className="text-[10px] text-[#043077] font-extrabold block">Selección (SEL)</label>
                        <input
                          type="text"
                          placeholder="p. ej: 15"
                          value={rowSeleccion}
                          onChange={(e) => {
                            isManualSelRef.current = true;
                            const val = e.target.value;
                            setRowSeleccion(val);
                            if (val.trim()) {
                              const assocs = getSelAssociations();
                              const filtered = assocs.filter(a => 
                                String(a.sel).toLowerCase().includes(val.toLowerCase()) ||
                                String(a.codigo).toLowerCase().includes(val.toLowerCase()) ||
                                String(a.nombre).toLowerCase().includes(val.toLowerCase())
                              );
                              setSelSuggestions(filtered.slice(0, 8));
                              setShowSelSuggestions(true);
                            } else {
                              const assocs = getSelAssociations();
                              setSelSuggestions(assocs.slice(0, 8));
                              setShowSelSuggestions(true);
                            }
                          }}
                          onFocus={() => {
                            const assocs = getSelAssociations();
                            if (rowSeleccion.trim()) {
                              const filtered = assocs.filter(a => 
                                String(a.sel).toLowerCase().includes(rowSeleccion.toLowerCase()) ||
                                String(a.codigo).toLowerCase().includes(rowSeleccion.toLowerCase()) ||
                                String(a.nombre).toLowerCase().includes(rowSeleccion.toLowerCase())
                              );
                              setSelSuggestions(filtered.slice(0, 8));
                            } else {
                              setSelSuggestions(assocs.slice(0, 8));
                            }
                            setShowSelSuggestions(true);
                          }}
                          onClick={(e) => {
                            e.stopPropagation();
                          }}
                          className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs font-black text-slate-800 focus:ring-1 focus:ring-[#043077]"
                        />
                        {showSelSuggestions && selSuggestions.length > 0 && (
                          <div 
                            className="absolute z-50 left-0 right-0 top-full mt-1 bg-white border border-slate-200 rounded-xl shadow-lg max-h-60 overflow-y-auto w-72 sm:w-80"
                            onMouseDown={(e) => e.preventDefault()}
                          >
                            {selSuggestions.map((assoc) => (
                              <button
                                key={assoc.sel}
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleSelectSelAssociation(assoc);
                                }}
                                className="w-full text-left px-3 py-2 hover:bg-slate-50 transition-colors border-b border-slate-100 last:border-b-0 flex flex-col gap-0.5 cursor-pointer"
                              >
                                <div className="flex justify-between items-center">
                                  <span className="font-mono font-black text-xs text-[#043077] bg-blue-50 px-1.5 py-0.5 rounded">
                                    SEL: {assoc.sel}
                                  </span>
                                  {assoc.codigo && (
                                    <span className="text-[9px] text-slate-400 font-bold font-mono">
                                      {assoc.codigo}
                                    </span>
                                  )}
                                </div>
                                {assoc.nombre && (
                                  <span className="text-[11px] font-extrabold text-slate-700 truncate block mt-1">
                                    {assoc.nombre}
                                  </span>
                                )}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                      <div className="space-y-1 relative">
                        <label className="text-[10px] text-slate-500 font-bold block">Código Producto</label>
                        <input
                          type="text"
                          placeholder="p. ej: CER-BB-06"
                          value={rowCodigo}
                          onChange={(e) => {
                            const val = e.target.value;
                            setRowCodigo(val);
                            const matched = handleLookupAndFillByCodigo(val, false);
                            if (matched) {
                              setCodigoSuggestions([]);
                              setShowCodigoSuggestions(false);
                            } else if (val.trim()) {
                              const filtered = products.filter(p => 
                                String(p.codigo || '').toLowerCase().includes(val.toLowerCase()) ||
                                String(p.nombre || '').toLowerCase().includes(val.toLowerCase()) ||
                                String(p.id || '').toLowerCase().includes(val.toLowerCase())
                              );
                              setCodigoSuggestions(filtered.slice(0, 10));
                              setShowCodigoSuggestions(true);
                            } else {
                              setCodigoSuggestions([]);
                              setShowCodigoSuggestions(false);
                            }
                          }}
                          onBlur={(e) => {
                            handleLookupAndFillByCodigo(e.target.value, false);
                          }}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              handleLookupAndFillByCodigo((e.target as HTMLInputElement).value, false);
                            }
                          }}
                          onFocus={() => {
                            if (rowCodigo.trim()) {
                              const filtered = products.filter(p => 
                                String(p.codigo || '').toLowerCase().includes(rowCodigo.toLowerCase()) ||
                                String(p.nombre || '').toLowerCase().includes(rowCodigo.toLowerCase()) ||
                                String(p.id || '').toLowerCase().includes(rowCodigo.toLowerCase())
                              );
                              setCodigoSuggestions(filtered.slice(0, 10));
                              setShowCodigoSuggestions(true);
                            }
                          }}
                          onClick={(e) => {
                            e.stopPropagation();
                          }}
                          className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs font-bold focus:ring-1 focus:ring-[#043077]"
                        />
                        {showCodigoSuggestions && codigoSuggestions.length > 0 && (
                          <div 
                            className="absolute z-50 left-0 right-0 top-full mt-1 bg-white border border-slate-200 rounded-xl shadow-lg max-h-60 overflow-y-auto"
                            onMouseDown={(e) => e.preventDefault()}
                          >
                            {codigoSuggestions.map((prod) => (
                              <button
                                key={prod.id}
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleSelectProduct(prod);
                                }}
                                className="w-full text-left px-3 py-2 hover:bg-slate-50 transition-colors border-b border-slate-100 last:border-b-0 flex flex-col gap-0.5 cursor-pointer"
                              >
                                <div className="flex justify-between items-center">
                                  <span className="font-mono font-black text-[11px] text-[#043077]">
                                    {prod.codigo || `ID: ${prod.id}`}
                                  </span>
                                  <span className="text-[9px] text-slate-400 font-bold uppercase truncate max-w-[100px]">
                                    {prod.proveedor || 'Genérico'}
                                  </span>
                                </div>
                                <span className="text-xs font-bold text-slate-800 truncate">
                                  {prod.nombre}
                                </span>
                                <div className="flex gap-2 text-[9px] text-slate-500 font-bold">
                                  <span>Costo: <strong className="text-slate-700">${prod.precio_unidad || 0}</strong></span>
                                  <span>Precio: <strong className="text-emerald-600">${prod.precio_venta || 0}</strong></span>
                                </div>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                      <div className="space-y-1 md:col-span-2 relative">
                        <label className="text-[10px] text-slate-500 font-bold block">Nombre Producto / Artículo</label>
                        <input
                          type="text"
                          placeholder="Nombre comercial"
                          value={rowNombre}
                          onChange={(e) => {
                            const val = e.target.value;
                            setRowNombre(val);
                            if (val.trim()) {
                              const filtered = products.filter(p => 
                                String(p.nombre || '').toLowerCase().includes(val.toLowerCase()) ||
                                String(p.codigo || '').toLowerCase().includes(val.toLowerCase())
                              );
                              setNombreSuggestions(filtered.slice(0, 10));
                              setShowNombreSuggestions(true);
                            } else {
                              setNombreSuggestions([]);
                              setShowNombreSuggestions(false);
                            }
                          }}
                          onFocus={() => {
                            if (rowNombre.trim()) {
                              const filtered = products.filter(p => 
                                String(p.nombre || '').toLowerCase().includes(rowNombre.toLowerCase()) ||
                                String(p.codigo || '').toLowerCase().includes(rowNombre.toLowerCase())
                              );
                              setNombreSuggestions(filtered.slice(0, 10));
                              setShowNombreSuggestions(true);
                            }
                          }}
                          onClick={(e) => {
                            e.stopPropagation();
                          }}
                          className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs font-bold focus:ring-1 focus:ring-[#043077]"
                        />
                        {showNombreSuggestions && nombreSuggestions.length > 0 && (
                          <div 
                            className="absolute z-50 left-0 right-0 top-full mt-1 bg-white border border-slate-200 rounded-xl shadow-lg max-h-60 overflow-y-auto"
                            onMouseDown={(e) => e.preventDefault()}
                          >
                            {nombreSuggestions.map((prod) => (
                              <button
                                key={prod.id}
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleSelectProduct(prod);
                                }}
                                className="w-full text-left px-3 py-2 hover:bg-slate-50 transition-colors border-b border-slate-100 last:border-b-0 flex flex-col gap-0.5 cursor-pointer"
                              >
                                <div className="flex justify-between items-center">
                                  <span className="font-mono font-black text-[11px] text-[#043077]">
                                    {prod.codigo || `ID: ${prod.id}`}
                                  </span>
                                  <span className="text-[9px] text-slate-400 font-bold uppercase truncate max-w-[100px]">
                                    {prod.proveedor || 'Genérico'}
                                  </span>
                                </div>
                                <span className="text-xs font-bold text-slate-800 truncate">
                                  {prod.nombre}
                                </span>
                                <div className="flex gap-2 text-[9px] text-slate-500 font-bold">
                                  <span>Costo: <strong className="text-slate-700">${prod.precio_unidad || 0}</strong></span>
                                  <span>Precio: <strong className="text-emerald-600">${prod.precio_venta || 0}</strong></span>
                                </div>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] text-slate-500 font-bold block">Unidades Surtidas</label>
                        <input
                          type="number"
                          min={1}
                          value={rowUnidades}
                          onChange={(e) => setRowUnidades(parseInt(e.target.value) || 0)}
                          className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs font-bold focus:ring-1 focus:ring-[#043077]"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] text-[#043077] font-extrabold block">Precio de Venta / Costo ($)</label>
                        <input
                          type="number"
                          step="0.01"
                          value={rowPrecio}
                          onChange={(e) => {
                            const val = parseFloat(e.target.value) || 0;
                            setRowPrecio(val);
                            setRowCosto(val); // Sincroniza el costo automáticamente
                          }}
                          className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs font-bold focus:ring-1 focus:ring-[#043077]"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-end">
                      <div className="space-y-1">
                        <label className="text-[10px] text-slate-500 font-bold block">Resorte</label>
                        <input
                          type="text"
                          placeholder="Tamaño de resorte (p. ej: 12)"
                          value={rowResorte}
                          onChange={(e) => setRowResorte(e.target.value)}
                          className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs font-bold focus:ring-1 focus:ring-[#043077]"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] text-slate-500 font-bold block">Notas</label>
                        <input
                          type="text"
                          placeholder="Escribe notas o detalles aquí..."
                          value={rowNotas}
                          onChange={(e) => setRowNotas(e.target.value)}
                          className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs font-bold focus:ring-1 focus:ring-[#043077]"
                        />
                      </div>
                    </div>

                    {/* Dynamic Date & Custom Fields (e.g. Fecha, Fecha 2, Fecha 3...) */}
                    {(() => {
                      const activeSubHeaders = cleanHeaders(submenuHeaders[activeSupplySubmenu] || []);
                      const dateOrCustomHeaders = activeSubHeaders.filter(h => {
                        const cleanH = cleanHeader(h);
                        const isStandard = ['sel', 'seleccion', 'slot', 'codigo', 'sku', 'codig', 'code', 'producto', 'nombre', 'articulo', 'surtir', 'cantidad', 'unidades', 'cant', 'costo', 'precio', 'preciovta', 'precioventa', 'preciodeventa', 'precio_vta', 'precioregular', 'proveedor', 'resor', 'resort', 'resorte', 'notas'].includes(cleanH);
                        return !isStandard;
                      });
                      if (dateOrCustomHeaders.length === 0) return null;
                      return (
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 pt-2 border-t border-slate-200/60">
                          {dateOrCustomHeaders.map((header) => {
                            const isFechaHeader = header.toLowerCase().trim().replace(/_/g, ' ').startsWith('fecha');
                            return (
                              <div key={header} className="space-y-1">
                                <label className="text-[10px] text-[#043077] font-extrabold block uppercase tracking-wider">{header}</label>
                                <input
                                  type="text"
                                  inputMode={isFechaHeader ? "numeric" : "text"}
                                  pattern={isFechaHeader ? "[0-9]*" : undefined}
                                  placeholder={isFechaHeader ? `Ingrese ${header} (solo números)...` : `Ingrese ${header}...`}
                                  value={addRowValues[header] || ''}
                                  onChange={(e) => {
                                    const val = isFechaHeader ? e.target.value.replace(/[^0-9]/g, '') : e.target.value;
                                    setAddRowValues(prev => ({ ...prev, [header]: val }));
                                  }}
                                  className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs font-bold text-slate-800 focus:ring-1 focus:ring-[#043077]"
                                />
                              </div>
                            );
                          })}
                        </div>
                      );
                    })()}

                    <div className="flex gap-2 justify-end mt-2">
                      <button
                        type="button"
                        onClick={() => setAddSupplyRowOpen(false)}
                        className="px-4 py-2 bg-slate-200 hover:bg-slate-300 rounded-lg text-xs font-bold text-slate-700 transition-all cursor-pointer"
                      >
                        Cancelar
                      </button>
                      <button
                        type="button"
                        onClick={handleAddRow}
                        className="px-4 py-2 bg-[#043077] hover:bg-blue-800 rounded-lg text-xs font-black text-white uppercase transition-all cursor-pointer shadow-3xs"
                      >
                        Guardar Registro
                      </button>
                    </div>
                  </motion.div>
                )}

                {/* Show Live Postgres SQL generation script for backing up this specific submenu data */}
                {showSQLSchema && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="p-5 bg-slate-900 text-slate-100 rounded-2xl text-left font-mono space-y-3 shadow-inner"
                  >
                    <div className="flex justify-between items-center border-b border-slate-800 pb-2">
                      <span className="text-xs font-bold text-amber-400 block">⚡ SCRIPT SQL DE CREACIÓN Y SEEDING ({activeMeta.name})</span>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            navigator.clipboard.writeText(getDynamicSQL());
                            setCopiedSQL(true);
                            setTimeout(() => setCopiedSQL(false), 2000);
                          }}
                          className={`px-2.5 py-1 text-[10px] font-black uppercase rounded-lg transition-all flex items-center gap-1 cursor-pointer ${
                            copiedSQL 
                              ? 'bg-emerald-600 text-white animate-pulse' 
                              : 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white border border-slate-700'
                          }`}
                        >
                          {copiedSQL ? '✓ ¡Copiado!' : '📋 Copiar SQL'}
                        </button>
                        <button 
                          type="button"
                          onClick={() => setShowSQLSchema(false)} 
                          className="text-slate-500 hover:text-slate-300 text-xs font-black px-2 py-1 bg-slate-800 hover:bg-slate-700 rounded-lg border border-slate-700 cursor-pointer"
                        >
                          Cerrar [X]
                        </button>
                      </div>
                    </div>
                    <pre className="text-[11px] leading-relaxed max-h-[300px] overflow-y-auto pr-2 select-all bg-slate-950 p-3 rounded-lg border border-slate-800">
                      <code>{getDynamicSQL()}</code>
                    </pre>
                    <div className="text-[10px] text-slate-400 italic">
                      💡 Copia este bloque de consulta DDL para aplicarlo en tu base de datos relacional y migrar la información de {activeMeta.name} de forma exacta.
                    </div>
                  </motion.div>
                )}

                {/* Interactive Rows spreadsheet table layout representation matches file structure */}
                <div className="border border-slate-200 rounded-2xl overflow-hidden bg-white shadow-3xs">
                  
                  {/* Barra de scroll superior sincronizada */}
                  <div 
                    ref={submenuTopScrollRef}
                    onScroll={handleSubmenuTopScroll}
                    className="w-full overflow-x-auto select-none bg-slate-50 border-b border-slate-100"
                    style={{ height: '12px', scrollbarWidth: 'thin' }}
                  >
                    <div style={{ width: `${submenuScrollWidth}px`, height: '1px' }}></div>
                  </div>

                  <div 
                    ref={submenuTableContainerRef}
                    onScroll={handleSubmenuTableScroll}
                    className="overflow-x-auto"
                  >
                    <table className="w-full table-auto text-xs text-left border-collapse whitespace-nowrap">
                      <thead>
                        <tr className="bg-slate-100 text-[10px] font-black text-slate-500 uppercase tracking-wider border-b border-slate-200 select-none whitespace-nowrap">
                          <th className="py-3 px-3 text-center w-10 whitespace-nowrap">
                            <input
                              type="checkbox"
                              disabled={isSurtidorOnly}
                              className={`rounded border-slate-300 text-[#043077] focus:ring-[#043077] h-3.5 w-3.5 ${isSurtidorOnly ? 'cursor-not-allowed opacity-30' : 'cursor-pointer'}`}
                              checked={!isSurtidorOnly && paginatedSubmenuRows.length > 0 && paginatedSubmenuRows.every(r => selectedRowIds.includes(r.id))}
                              onChange={(e) => {
                                if (isSurtidorOnly) return;
                                if (e.target.checked) {
                                  const allIds = paginatedSubmenuRows.map(r => r.id);
                                  setSelectedRowIds(prev => Array.from(new Set([...prev, ...allIds])));
                                } else {
                                  const visibleIds = new Set(paginatedSubmenuRows.map(r => r.id));
                                  setSelectedRowIds(prev => prev.filter(id => !visibleIds.has(id)));
                                }
                              }}
                            />
                          </th>
                          {(() => {
                            const activeSubHeaders = filterEmptyColumnaHeaders(cleanHeaders(submenuHeaders[activeSupplySubmenu] || []), currentSubmenuData);
                            return activeSubHeaders.length > 0 ? (
                              activeSubHeaders.map((header, idx) => (
                                renderSupplySortableHeader(header, header)
                              ))
                            ) : (
                              <>
                                {renderSupplySortableHeader("Código / SKU", "codigo")}
                                {renderSupplySortableHeader("Producto o Artículo", "nombre_producto")}
                                {renderSupplySortableHeader("Unidades", "unidad_surtida")}
                                {renderSupplySortableHeader("Costo Unit.", "costo_surtido")}
                                {renderSupplySortableHeader("Precio regular", "precio_venta")}
                                <th className="py-3 px-3 text-right whitespace-nowrap w-px">Importe Total</th>
                                {renderSupplySortableHeader("Resorte", "resorte")}
                                {renderSupplySortableHeader("Notas", "notas")}
                                {renderSupplySortableHeader("Fecha Surtido", "fecha_registro")}
                              </>
                            );
                          })()}
                          <th className="py-3 px-3 text-center whitespace-nowrap w-px">{isSurtidorOnly ? 'Estado' : 'Controles'}</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 bg-white">
                        {paginatedSubmenuRows.length === 0 ? (
                          <tr>
                            <td colSpan={15} className="py-12 text-center text-slate-400 font-bold bg-slate-50/50">
                              No hay registros cargados para {activeMeta.name} que coincidan con la búsqueda.
                            </td>
                          </tr>
                        ) : (
                          paginatedSubmenuRows.map((row) => {
                            const isEditing = row.id === editingRowId;
                            const activeSubHeaders = filterEmptyColumnaHeaders(cleanHeaders(submenuHeaders[activeSupplySubmenu] || []), currentSubmenuData);
                            const hasDynamicHeaders = activeSubHeaders.length > 0;
                            const currentPrecioVenta = (() => {
                              const matched = findMatchingProduct(row);
                              return (matched && matched.precio_venta !== undefined) ? matched.precio_venta : row.precio_venta;
                            })();
                            const totalVal = isEditing 
                              ? safeVal(editRowUnidades) * safeVal(editRowPrecio)
                              : safeVal(row.unidad_surtida) * safeVal(currentPrecioVenta);

                            return (
                              <tr 
                                key={row.id} 
                                className={`${isEditing ? 'bg-indigo-50/60' : 'hover:bg-slate-50/50'} transition-colors`}
                              >
                                {isEditing ? (
                                  <>
                                    <td className="py-2 px-3 text-center">
                                      <input
                                        type="checkbox"
                                        disabled
                                        className="rounded border-slate-200 text-slate-300 h-3.5 w-3.5 cursor-not-allowed opacity-50"
                                      />
                                    </td>
                                    {hasDynamicHeaders ? (
                                      activeSubHeaders.map((header, idx) => {
                                        const norm = header.toLowerCase().trim().replace(/_/g, ' ').replace(/\./g, '');
                                        const isCodeField = norm === 'codigo' || norm === 'sku' || norm === 'code';
                                        return (
                                          <td key={idx} className="py-2 px-3">
                                            <input
                                              type="text"
                                              value={editRowValues[header] !== undefined ? editRowValues[header] : (row.values && row.values[header] !== undefined ? row.values[header] : getSupplyRowCompareValue(row, header))}
                                              onChange={(e) => {
                                                let val = e.target.value;
                                                if (norm.startsWith('fecha')) {
                                                  val = val.replace(/[^0-9]/g, '');
                                                }
                                                setEditRowValues(prev => ({ ...prev, [header]: val }));
                                                if (isCodeField) {
                                                  setEditRowCodigo(val);
                                                  handleLookupAndFillByCodigo(val, true);
                                                }
                                              }}
                                              onBlur={(e) => {
                                                if (isCodeField) {
                                                  handleLookupAndFillByCodigo(e.target.value, true);
                                                }
                                              }}
                                              onKeyDown={(e) => {
                                                if (isCodeField && e.key === 'Enter') {
                                                  handleLookupAndFillByCodigo((e.target as HTMLInputElement).value, true);
                                                }
                                              }}
                                              className="w-full bg-white border border-slate-300 rounded px-1.5 py-0.5 text-xs font-semibold text-slate-800"
                                            />
                                          </td>
                                        );
                                      })
                                    ) : (
                                      <>
                                        <td className="py-2 px-3">
                                          <input
                                            type="text"
                                            value={editRowCodigo}
                                            onChange={(e) => {
                                              const val = e.target.value;
                                              setEditRowCodigo(val);
                                              handleLookupAndFillByCodigo(val, true);
                                            }}
                                            onBlur={(e) => {
                                              handleLookupAndFillByCodigo(e.target.value, true);
                                            }}
                                            onKeyDown={(e) => {
                                              if (e.key === 'Enter') {
                                                handleLookupAndFillByCodigo((e.target as HTMLInputElement).value, true);
                                              }
                                            }}
                                            className="w-full bg-white border border-slate-300 rounded px-1.5 py-0.5 text-xs font-mono font-bold text-[#043077]"
                                          />
                                        </td>
                                        <td className="py-2 px-3">
                                          <input
                                            type="text"
                                            value={editRowNombre}
                                            onChange={(e) => setEditRowNombre(e.target.value)}
                                            className="w-full bg-white border border-slate-300 rounded px-1.5 py-0.5 text-xs font-bold text-slate-800"
                                          />
                                        </td>
                                        <td className="py-2 px-3 text-center">
                                          <input
                                            type="number"
                                            step="any"
                                            value={editRowUnidades}
                                            onChange={(e) => setEditRowUnidades(parseFloat(e.target.value) || 0)}
                                            className="w-16 bg-white border border-slate-300 rounded px-1.5 py-0.5 text-xs font-mono font-bold text-center"
                                          />
                                        </td>
                                        <td className="py-2 px-3 text-right">
                                          <input
                                            type="number"
                                            step="any"
                                            value={editRowCosto}
                                            onChange={(e) => setEditRowCosto(parseFloat(e.target.value) || 0)}
                                            className="w-20 bg-white border border-slate-300 rounded px-1.5 py-0.5 text-xs font-mono text-right"
                                          />
                                        </td>
                                        <td className="py-2 px-3 text-right">
                                          <input
                                            type="number"
                                            step="any"
                                            value={editRowPrecio}
                                            onChange={(e) => setEditRowPrecio(parseFloat(e.target.value) || 0)}
                                            className="w-20 bg-white border border-slate-300 rounded px-1.5 py-0.5 text-xs font-mono text-right"
                                          />
                                        </td>
                                        <td className="py-2 px-3 text-right font-mono font-black text-[#043077] select-none">
                                          {formatMXN(totalVal)}
                                        </td>
                                        <td className="py-2 px-3">
                                          <input
                                            type="text"
                                            value={editRowResorte}
                                            onChange={(e) => setEditRowResorte(e.target.value)}
                                            className="w-full bg-white border border-slate-300 rounded px-1.5 py-0.5 text-xs font-semibold"
                                          />
                                        </td>
                                        <td className="py-2 px-3">
                                          <input
                                            type="text"
                                            value={editRowNotas}
                                            onChange={(e) => setEditRowNotas(e.target.value)}
                                            className="w-full bg-white border border-slate-300 rounded px-1.5 py-0.5 text-xs font-semibold text-slate-800"
                                          />
                                        </td>
                                        <td className="py-2 px-3 text-slate-400 font-medium font-mono select-none">
                                          {row.fecha_registro}
                                        </td>
                                      </>
                                    )}
                                    <td className="py-2 px-3 text-center">
                                      <div className="flex items-center justify-center gap-1.5">
                                        <button
                                          onClick={() => handleSaveRow(row.id)}
                                          className="p-1 bg-emerald-100 hover:bg-emerald-200 text-emerald-700 rounded transition-all cursor-pointer inline-flex items-center"
                                          title="Guardar"
                                        >
                                          <Check className="w-3.5 h-3.5" />
                                        </button>
                                        <button
                                          onClick={handleCancelEditRow}
                                          className="p-1 bg-rose-100 hover:bg-rose-200 text-rose-700 rounded transition-all cursor-pointer inline-flex items-center"
                                          title="Cancelar"
                                        >
                                          <X className="w-3.5 h-3.5" />
                                        </button>
                                      </div>
                                    </td>
                                  </>
                                ) : (
                                  <>
                                    <td className="py-3 px-3 text-center">
                                      <input
                                        type="checkbox"
                                        disabled={isSurtidorOnly}
                                        className={`rounded border-slate-300 text-[#043077] focus:ring-[#043077] h-3.5 w-3.5 ${isSurtidorOnly ? 'cursor-not-allowed opacity-30' : 'cursor-pointer'}`}
                                        checked={!isSurtidorOnly && selectedRowIds.includes(row.id)}
                                        onChange={(e) => {
                                          if (isSurtidorOnly) return;
                                          if (e.target.checked) {
                                            setSelectedRowIds(prev => [...prev, row.id]);
                                          } else {
                                            setSelectedRowIds(prev => prev.filter(id => id !== row.id));
                                          }
                                        }}
                                      />
                                    </td>
                                    {hasDynamicHeaders ? (
                                      activeSubHeaders.map((header, idx) => {
                                        let cellVal = row.values && row.values[header] !== undefined ? row.values[header] : getSupplyRowCompareValue(row, header);
                                         const isPriceVenta = header.toLowerCase().trim().includes('precio') || header.toLowerCase().trim().includes('regular') || header.toLowerCase().trim().includes('vta') || header.toLowerCase().trim().includes('venta') || header.toLowerCase().trim() === 'sin acuerdo' || header.toLowerCase().trim().includes('precio sin acuerdo');
                                         if (isPriceVenta) {
                                           const matchedProd = findMatchingProduct(row);
                                           if (matchedProd && matchedProd.precio_venta !== undefined) {
                                             cellVal = matchedProd.precio_venta;
                                           }
                                         }
                                        const cleanH = cleanHeader(header);
                                        const isCode = cleanH.includes('codigo') || cleanH.includes('sku') || cleanH.includes('codig');
                                        
                                        // Format with dollar sign if the header represents a price/cost
                                        const normHeader = header.toLowerCase().trim();
                                        const isPrice = normHeader.includes('precio') || normHeader.includes('costo') || normHeader.includes('importe') || normHeader.includes('regular') || normHeader.includes('vta') || normHeader.includes('venta') || normHeader === 'sin acuerdo' || normHeader.includes('precio sin acuerdo');
                                        const formattedVal = isPrice ? (typeof cellVal === 'number' ? formatMXN(cellVal) : (isNaN(Number(cellVal)) || cellVal === '' ? cellVal : formatMXN(Number(cellVal)))) : cellVal;

                                        return (
                                          <td 
                                            key={idx} 
                                            className={`py-3 px-3 whitespace-nowrap ${isCode ? 'font-mono font-black text-[#043077]' : 'font-medium text-slate-700'} ${isPrice ? 'text-right font-mono font-extrabold' : ''}`}
                                          >
                                            {formattedVal}
                                          </td>
                                        );
                                      })
                                    ) : (
                                      <>
                                        <td className="py-3 px-3 font-mono font-black text-[#043077] whitespace-nowrap">
                                          {row.codigo}
                                        </td>
                                        <td className="py-3 px-3 font-extrabold text-slate-800 whitespace-nowrap">
                                          {row.nombre_producto}
                                        </td>
                                        <td className="py-3 px-3 text-center font-mono font-black text-slate-700 whitespace-nowrap">
                                          {row.unidad_surtida}
                                        </td>
                                        <td className="py-3 px-3 text-right font-mono text-slate-600 whitespace-nowrap">
                                          {formatMXN(row.costo_surtido)}
                                        </td>
                                        <td className="py-3 px-3 text-right font-mono text-slate-600 whitespace-nowrap">
                                          {formatMXN(currentPrecioVenta)}
                                        </td>
                                        <td className="py-3 px-3 text-right font-mono font-black text-[#043077] whitespace-nowrap">
                                          {formatMXN(totalVal)}
                                        </td>
                                        <td className="py-3 px-3 text-slate-500 font-semibold whitespace-nowrap">
                                          {row.resorte}
                                        </td>
                                        <td className="py-3 px-3 text-slate-700 font-medium whitespace-nowrap">
                                          {row.notas || ''}
                                        </td>
                                        <td className="py-3 px-3 text-slate-400 font-medium whitespace-nowrap">
                                          {row.fecha_registro}
                                        </td>
                                      </>
                                    )}
                                    <td className="py-3 px-3 text-center whitespace-nowrap">
                                      {isSurtidorOnly ? (
                                        <span className="inline-flex items-center gap-1 text-[10px] font-black text-amber-900 bg-amber-100/90 px-2.5 py-1 rounded-lg border border-amber-300/60 select-none" title="Registro protegido con candado para el rol Surtidor">
                                          <Lock className="w-3 h-3 text-amber-700" /> Candado
                                        </span>
                                      ) : (
                                        <div className="flex items-center justify-center gap-1">
                                          <button
                                            onClick={() => handleStartEditRow(row)}
                                            className="p-1 text-slate-500 hover:text-indigo-600 hover:bg-slate-100 rounded-lg transition-all cursor-pointer inline-flex items-center"
                                            title="Editar fila"
                                          >
                                            <Edit className="w-4 h-4" />
                                          </button>
                                          <button
                                            onClick={() => handleDeleteRow(row.id)}
                                            className="p-1 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-all cursor-pointer inline-flex items-center"
                                            title="Eliminar fila"
                                          >
                                            <Trash2 className="w-4 h-4" />
                                          </button>
                                        </div>
                                      )}
                                    </td>
                                  </>
                                )}
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                  
                  {/* Table footer info */}
                  <div className="bg-slate-50 px-4 py-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500 font-bold">
                    <span>Mostrando {paginatedSubmenuRows.length} de {filteredSubmenuRows.length} registros en {activeMeta.name}</span>
                    <span className="font-mono text-[#043077] uppercase tracking-wider">Cargar en Dashboard Excel Habilitado</span>
                  </div>
                </div>

                {/* Surtido Pagination controls */}
                {totalSupplyPages > 1 && (
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-3 p-4 bg-white border border-slate-200/80 rounded-2xl shadow-xs">
                    <div className="text-xs font-black text-slate-500 uppercase tracking-wide">
                      Mostrando <span className="text-[#043077] font-mono">{(supplyPage - 1) * 5 + 1}</span> a <span className="text-[#043077] font-mono">{Math.min(supplyPage * 5, filteredSubmenuRows.length)}</span> de <span className="text-slate-700 font-mono">{filteredSubmenuRows.length}</span> registros
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => setSupplyPage(prev => Math.max(prev - 1, 1))}
                        disabled={supplyPage === 1}
                        className="px-3 py-1.5 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:hover:bg-white text-slate-700 text-xs font-black border border-slate-200 rounded-xl cursor-pointer transition-all focus:outline-none flex items-center gap-1"
                      >
                        ◀️ Anterior
                      </button>
                      {Array.from({ length: totalSupplyPages }, (_, i) => i + 1).map(page => {
                        const isSelected = page === supplyPage;
                        const shouldShow = totalSupplyPages <= 6 || Math.abs(page - supplyPage) <= 1 || page === 1 || page === totalSupplyPages;
                        
                        if (!shouldShow) {
                          if (page === 2 || page === totalSupplyPages - 1) {
                            return <span key={`supply-dots-${page}`} className="text-slate-400 text-xs px-1 select-none">...</span>;
                          }
                          return null;
                        }

                        return (
                          <button
                            key={page}
                            type="button"
                            onClick={() => setSupplyPage(page)}
                            className={`w-8 h-8 flex items-center justify-center text-xs font-black rounded-xl cursor-pointer transition-all focus:outline-none ${
                              isSelected
                                ? 'bg-[#043077] text-white border border-[#043077]'
                                : 'bg-white hover:bg-slate-50 text-slate-700 border border-slate-200'
                            }`}
                          >
                            {page}
                          </button>
                        );
                      })}
                      <button
                        type="button"
                        onClick={() => setSupplyPage(prev => Math.min(prev + 1, totalSupplyPages))}
                        disabled={supplyPage === totalSupplyPages}
                        className="px-3 py-1.5 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:hover:bg-white text-slate-700 text-xs font-black border border-slate-200 rounded-xl cursor-pointer transition-all focus:outline-none flex items-center gap-1"
                      >
                        Siguiente ▶️
                      </button>
                    </div>
                  </div>
                )}

                {/* Nueva Tarjeta: Bitácora de Control y Mantenimiento por Visita (1 grupo por máquina) */}
                {(() => {
                  const visits = getMachineVisits(activeSupplySubmenu);
                  return (
                    <div className="bg-white p-5 rounded-2xl border border-emerald-200/80 shadow-xs space-y-4 mt-6">
                      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-emerald-100">
                        <div className="flex items-center gap-2.5">
                          <div className="p-2 bg-emerald-100 text-emerald-800 rounded-xl">
                            <ClipboardCheck className="w-5 h-5 stroke-[2.5]" />
                          </div>
                          <div>
                            <h4 className="text-sm font-black text-slate-800 uppercase tracking-wide flex items-center gap-2">
                              <span>Bitácora de Control y Mantenimiento ({activeMeta.name})</span>
                              <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[9px] font-black rounded-full uppercase border border-emerald-200">Exportable a Excel</span>
                            </h4>
                            <p className="text-xs text-slate-500 font-medium">Control de pruebas, ventas externas, limpieza y componentes por cada visita realizada.</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleAddMaintenanceVisit(activeSupplySubmenu)}
                            className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white font-black text-xs rounded-xl transition-all flex items-center gap-1 cursor-pointer shadow-3xs"
                          >
                            <Plus className="w-4 h-4 stroke-[3]" /> + Agregar Visita
                          </button>
                        </div>
                      </div>

                      {/* Maintenance Table Layout matching uploaded design image */}
                      <div className="overflow-x-auto rounded-xl border border-emerald-200/80 bg-white shadow-3xs">
                        <table className="w-full text-left text-xs border-collapse">
                          <thead>
                            <tr className="bg-[#e2f0d9] border-b border-emerald-200 text-emerald-950 font-black">
                              <th className="py-2.5 px-3 uppercase text-[11px] font-black border-r border-emerald-200 min-w-[160px] bg-[#d5e8c8]">
                                Concepto
                              </th>
                              <th className="py-2.5 px-3 uppercase text-[11px] font-black border-r border-emerald-200 w-[110px] bg-[#d5e8c8]">
                                Detalle
                              </th>
                              {visits.map((vis, vIdx) => (
                                <th key={vis.id || vIdx} className="py-2 px-3 border-r border-emerald-200 min-w-[130px] text-center bg-[#e2f0d9]">
                                  <div className="flex items-center justify-between gap-1">
                                    <input
                                      type="text"
                                      value={vis.visitLabel}
                                      onChange={(e) => handleUpdateMaintenanceVisit(activeSupplySubmenu, vIdx, 'visitLabel', e.target.value)}
                                      className="w-full bg-white/90 border border-emerald-300 rounded px-1.5 py-1 text-center font-black text-emerald-900 text-xs focus:ring-1 focus:ring-emerald-600"
                                      placeholder="Visita / $"
                                    />
                                    {visits.length > 1 && (
                                      <button
                                        type="button"
                                        onClick={() => handleRemoveMaintenanceVisit(activeSupplySubmenu, vIdx)}
                                        className="p-1 hover:bg-rose-100 text-slate-400 hover:text-rose-600 rounded transition-all cursor-pointer"
                                        title="Eliminar esta visita"
                                      >
                                        <X className="w-3.5 h-3.5" />
                                      </button>
                                    )}
                                  </div>
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-emerald-100 font-bold text-slate-700">
                            {/* Row 0A: Mon. Inicial */}
                            <tr className="bg-[#e2f0d9]/60 hover:bg-[#d5e8c8]/80 transition-colors">
                              <td className="py-2 px-3 font-black text-slate-900 border-r border-emerald-200 bg-[#d5e8c8]">Mon. Inicial</td>
                              <td className="py-2 px-3 text-slate-500 font-bold border-r border-emerald-200 text-[11px] bg-[#d5e8c8]"></td>
                              {visits.map((vis, vIdx) => (
                                <td key={vis.id} className="py-1.5 px-2 border-r border-emerald-200 text-center">
                                  <input
                                    type="text"
                                    value={vis.mon_inicial || ''}
                                    onChange={(e) => handleUpdateMaintenanceVisit(activeSupplySubmenu, vIdx, 'mon_inicial', e.target.value)}
                                    className="w-full bg-white/90 border border-emerald-300 rounded px-2 py-1 text-center text-xs font-black text-emerald-950 focus:ring-1 focus:ring-emerald-600 shadow-3xs"
                                    placeholder="$ 0"
                                  />
                                </td>
                              ))}
                            </tr>

                            {/* Row 0B: Mon. Final */}
                            <tr className="bg-[#e2f0d9]/60 hover:bg-[#d5e8c8]/80 transition-colors">
                              <td className="py-2 px-3 font-black text-slate-900 border-r border-emerald-200 bg-[#d5e8c8]">Mon. Final</td>
                              <td className="py-2 px-3 text-slate-500 font-bold border-r border-emerald-200 text-[11px] bg-[#d5e8c8]"></td>
                              {visits.map((vis, vIdx) => (
                                <td key={vis.id} className="py-1.5 px-2 border-r border-emerald-200 text-center">
                                  <input
                                    type="text"
                                    value={vis.mon_final || ''}
                                    onChange={(e) => handleUpdateMaintenanceVisit(activeSupplySubmenu, vIdx, 'mon_final', e.target.value)}
                                    className="w-full bg-white/90 border border-emerald-300 rounded px-2 py-1 text-center text-xs font-black text-emerald-950 focus:ring-1 focus:ring-emerald-600 shadow-3xs"
                                    placeholder="$ 0"
                                  />
                                </td>
                              ))}
                            </tr>

                            {/* Row 1: Pruebas con $$ */}
                            <tr className="hover:bg-emerald-50/40">
                              <td className="py-2 px-3 font-black text-slate-800 border-r border-emerald-100">Pruebas con $$</td>
                              <td className="py-2 px-3 text-slate-500 font-bold border-r border-emerald-100 text-[11px]">Cuanto $?</td>
                              {visits.map((vis, vIdx) => (
                                <td key={vis.id} className="py-1.5 px-2 border-r border-emerald-100 text-center">
                                  <input
                                    type="text"
                                    value={vis.pruebas}
                                    onChange={(e) => handleUpdateMaintenanceVisit(activeSupplySubmenu, vIdx, 'pruebas', e.target.value)}
                                    className="w-full bg-white border border-slate-200 rounded px-2 py-1 text-center text-xs font-bold text-slate-800 focus:ring-1 focus:ring-emerald-600"
                                  />
                                </td>
                              ))}
                            </tr>

                            {/* Row 2: Ventas Externas */}
                            <tr className="hover:bg-emerald-50/40">
                              <td className="py-2 px-3 font-black text-slate-800 border-r border-emerald-100">Ventas Externas</td>
                              <td className="py-2 px-3 text-slate-500 font-bold border-r border-emerald-100 text-[11px]">Cuanto $?</td>
                              {visits.map((vis, vIdx) => (
                                <td key={vis.id} className="py-1.5 px-2 border-r border-emerald-100 text-center">
                                  <input
                                    type="text"
                                    value={vis.ventas_externas}
                                    onChange={(e) => handleUpdateMaintenanceVisit(activeSupplySubmenu, vIdx, 'ventas_externas', e.target.value)}
                                    className="w-full bg-white border border-slate-200 rounded px-2 py-1 text-center text-xs font-bold text-slate-800 focus:ring-1 focus:ring-emerald-600"
                                  />
                                </td>
                              ))}
                            </tr>

                            {/* Row 3: Limpieza interna */}
                            <tr className="hover:bg-emerald-50/40">
                              <td className="py-2 px-3 font-black text-slate-800 border-r border-emerald-100">Limpieza interna</td>
                              <td className="py-2 px-3 text-slate-500 font-bold border-r border-emerald-100 text-[11px]">
                                <span className="px-1 py-0.5 bg-slate-100 rounded text-slate-600">Si</span> / <span className="px-1 py-0.5 bg-slate-100 rounded text-slate-600">no</span>
                              </td>
                              {visits.map((vis, vIdx) => (
                                <td key={vis.id} className="py-1.5 px-2 border-r border-emerald-100 text-center">
                                  <select
                                    value={vis.limpieza_interna}
                                    onChange={(e) => handleUpdateMaintenanceVisit(activeSupplySubmenu, vIdx, 'limpieza_interna', e.target.value)}
                                    className="w-full bg-white border border-slate-200 rounded px-2 py-1 text-center text-xs font-bold text-slate-800 focus:ring-1 focus:ring-emerald-600"
                                  >
                                    <option value="si">si</option>
                                    <option value="no">no</option>
                                  </select>
                                </td>
                              ))}
                            </tr>

                            {/* Row 4: Limpieza externa */}
                            <tr className="hover:bg-emerald-50/40">
                              <td className="py-2 px-3 font-black text-slate-800 border-r border-emerald-100">Limpieza externa</td>
                              <td className="py-2 px-3 text-slate-500 font-bold border-r border-emerald-100 text-[11px]">
                                <span className="px-1 py-0.5 bg-slate-100 rounded text-slate-600">Si</span> / <span className="px-1 py-0.5 bg-slate-100 rounded text-slate-600">no</span>
                              </td>
                              {visits.map((vis, vIdx) => (
                                <td key={vis.id} className="py-1.5 px-2 border-r border-emerald-100 text-center">
                                  <select
                                    value={vis.limpieza_externa}
                                    onChange={(e) => handleUpdateMaintenanceVisit(activeSupplySubmenu, vIdx, 'limpieza_externa', e.target.value)}
                                    className="w-full bg-white border border-slate-200 rounded px-2 py-1 text-center text-xs font-bold text-slate-800 focus:ring-1 focus:ring-emerald-600"
                                  >
                                    <option value="si">si</option>
                                    <option value="no">no</option>
                                  </select>
                                </td>
                              ))}
                            </tr>

                            {/* Row 5: Falla de equipo */}
                            <tr className="hover:bg-emerald-50/40">
                              <td className="py-2 px-3 font-black text-slate-800 border-r border-emerald-100">Falla de equipo</td>
                              <td className="py-2 px-3 text-slate-500 font-bold border-r border-emerald-100 text-[11px]">
                                <span className="px-1 py-0.5 bg-slate-100 rounded text-slate-600">Si</span> / <span className="px-1 py-0.5 bg-slate-100 rounded text-slate-600">no</span>
                              </td>
                              {visits.map((vis, vIdx) => (
                                <td key={vis.id} className="py-1.5 px-2 border-r border-emerald-100 text-center">
                                  <select
                                    value={vis.falla_equipo}
                                    onChange={(e) => handleUpdateMaintenanceVisit(activeSupplySubmenu, vIdx, 'falla_equipo', e.target.value)}
                                    className="w-full bg-white border border-slate-200 rounded px-2 py-1 text-center text-xs font-bold text-slate-800 focus:ring-1 focus:ring-emerald-600"
                                  >
                                    <option value="no">no</option>
                                    <option value="si">si</option>
                                  </select>
                                </td>
                              ))}
                            </tr>

                            {/* Row 6: Monedero */}
                            <tr className="hover:bg-emerald-50/40">
                              <td className="py-2 px-3 font-black text-slate-800 border-r border-emerald-100">Monedero</td>
                              <td className="py-2 px-3 text-slate-500 font-bold border-r border-emerald-100 text-[11px]">X</td>
                              {visits.map((vis, vIdx) => (
                                <td key={vis.id} className="py-1.5 px-2 border-r border-emerald-100 text-center">
                                  <input
                                    type="text"
                                    value={vis.monedero}
                                    onChange={(e) => handleUpdateMaintenanceVisit(activeSupplySubmenu, vIdx, 'monedero', e.target.value)}
                                    className="w-full bg-white border border-slate-200 rounded px-2 py-1 text-center text-xs font-bold text-slate-800 focus:ring-1 focus:ring-emerald-600"
                                  />
                                </td>
                              ))}
                            </tr>

                            {/* Row 7: Billetero */}
                            <tr className="hover:bg-emerald-50/40">
                              <td className="py-2 px-3 font-black text-slate-800 border-r border-emerald-100">Billetero</td>
                              <td className="py-2 px-3 text-slate-500 font-bold border-r border-emerald-100 text-[11px]">X</td>
                              {visits.map((vis, vIdx) => (
                                <td key={vis.id} className="py-1.5 px-2 border-r border-emerald-100 text-center">
                                  <input
                                    type="text"
                                    value={vis.billetero}
                                    onChange={(e) => handleUpdateMaintenanceVisit(activeSupplySubmenu, vIdx, 'billetero', e.target.value)}
                                    className="w-full bg-white border border-slate-200 rounded px-2 py-1 text-center text-xs font-bold text-slate-800 focus:ring-1 focus:ring-emerald-600"
                                  />
                                </td>
                              ))}
                            </tr>

                            {/* Row 8: Base de resorte */}
                            <tr className="hover:bg-emerald-50/40">
                              <td className="py-2 px-3 font-black text-slate-800 border-r border-emerald-100">Base de resorte</td>
                              <td className="py-2 px-3 text-slate-500 font-bold border-r border-emerald-100 text-[11px]">X</td>
                              {visits.map((vis, vIdx) => (
                                <td key={vis.id} className="py-1.5 px-2 border-r border-emerald-100 text-center">
                                  <input
                                    type="text"
                                    value={vis.base_resorte}
                                    onChange={(e) => handleUpdateMaintenanceVisit(activeSupplySubmenu, vIdx, 'base_resorte', e.target.value)}
                                    className="w-full bg-white border border-slate-200 rounded px-2 py-1 text-center text-xs font-bold text-slate-800 focus:ring-1 focus:ring-emerald-600"
                                  />
                                </td>
                              ))}
                            </tr>

                            {/* Row 9: Otro */}
                            <tr className="hover:bg-emerald-50/40">
                              <td className="py-2 px-3 font-black text-slate-800 border-r border-emerald-100">Otro</td>
                              <td className="py-2 px-3 text-slate-500 font-bold border-r border-emerald-100 text-[11px]">X</td>
                              {visits.map((vis, vIdx) => (
                                <td key={vis.id} className="py-1.5 px-2 border-r border-emerald-100 text-center">
                                  <input
                                    type="text"
                                    value={vis.otro}
                                    onChange={(e) => handleUpdateMaintenanceVisit(activeSupplySubmenu, vIdx, 'otro', e.target.value)}
                                    className="w-full bg-white border border-slate-200 rounded px-2 py-1 text-center text-xs font-bold text-slate-800 focus:ring-1 focus:ring-emerald-600"
                                  />
                                </td>
                              ))}
                            </tr>

                            {/* Row 10: Notas */}
                            <tr className="hover:bg-emerald-50/40">
                              <td className="py-2 px-3 font-black text-slate-800 border-r border-emerald-100">Notas</td>
                              <td className="py-2 px-3 text-slate-500 font-bold border-r border-emerald-100 text-[11px]">-</td>
                              {visits.map((vis, vIdx) => (
                                <td key={vis.id} className="py-1.5 px-2 border-r border-emerald-100 text-center">
                                  <input
                                    type="text"
                                    value={vis.notas}
                                    onChange={(e) => handleUpdateMaintenanceVisit(activeSupplySubmenu, vIdx, 'notas', e.target.value)}
                                    className="w-full bg-white border border-slate-200 rounded px-2 py-1 text-center text-xs font-bold text-slate-800 focus:ring-1 focus:ring-emerald-600"
                                  />
                                </td>
                              ))}
                            </tr>

                            {/* Row 10B: Nombre del repartidor */}
                            <tr className="bg-emerald-50/60 hover:bg-emerald-100/50 transition-colors">
                              <td className="py-2 px-3 font-black text-emerald-950 border-r border-emerald-200 bg-emerald-100/60 flex items-center gap-1.5 whitespace-nowrap">
                                <User className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                                <span>Nombre del repartidor</span>
                              </td>
                              <td className="py-2 px-3 text-emerald-800 font-bold border-r border-emerald-200 text-[11px] bg-emerald-100/60">Surtidor</td>
                              {visits.map((vis, vIdx) => (
                                <td key={vis.id} className="py-1.5 px-2 border-r border-emerald-200 text-center">
                                  <input
                                    type="text"
                                    value={vis.repartidor || currentUserName}
                                    onChange={(e) => handleUpdateMaintenanceVisit(activeSupplySubmenu, vIdx, 'repartidor', e.target.value)}
                                    className="w-full bg-white/95 border border-emerald-300 rounded px-2 py-1 text-center text-xs font-black text-emerald-950 focus:ring-1 focus:ring-emerald-600 shadow-3xs"
                                    placeholder="Nombre repartidor"
                                  />
                                </td>
                              ))}
                            </tr>

                            {/* Row 11: Elaboro (green row matching design image!) */}
                            <tr className="bg-[#00b050] text-white font-extrabold">
                              <td className="py-2.5 px-3 font-black text-white border-r border-emerald-600">Elaboro</td>
                              <td className="py-2.5 px-3 text-emerald-100 font-bold border-r border-emerald-600 text-[11px]">-</td>
                              {visits.map((vis, vIdx) => (
                                <td key={vis.id} className="py-1.5 px-2 border-r border-emerald-600 text-center">
                                  <input
                                    type="text"
                                    value={vis.elaboro}
                                    onChange={(e) => handleUpdateMaintenanceVisit(activeSupplySubmenu, vIdx, 'elaboro', e.target.value)}
                                    className="w-full bg-white/90 border border-emerald-400 rounded px-2 py-1 text-center text-xs font-black text-emerald-950 focus:ring-2 focus:ring-white"
                                  />
                                </td>
                              ))}
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </div>
                  );
                })()}

              </div>
            )}

            {/* Dynamic Popup Modal to Register a brand new custom access to the Submenu */}
            {addSubmenuOpen && (
              <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
                <motion.div
                  initial={{ scale: 0.95, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xl w-full max-w-md space-y-4 text-left"
                >
                  <div className="flex justify-between items-center border-b border-slate-150 pb-3">
                    <h3 className="font-black text-slate-800 text-sm uppercase tracking-wider flex items-center gap-1.5">
                      <Plus className="w-5 h-5 text-indigo-600" /> Registrar Nuevo Acceso en Submenú
                    </h3>
                    <button 
                      type="button"
                      onClick={() => setAddSubmenuOpen(false)}
                      className="text-slate-400 hover:text-slate-600 font-black text-md"
                    >
                      ✕
                    </button>
                  </div>

                  <p className="text-xs text-slate-500 font-medium leading-relaxed">
                    Al dar de alta un acceso en el submenú, se creará de forma dinámica una nueva pestaña de control con su propia hoja de cálculo exportable a Excel, pre-poblada con columnas correspondientes.
                  </p>

                  <div className="space-y-3">
                    <div>
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-1">Grupo de máquina</label>
                      <select
                        value={newSubmenuGroup}
                        onChange={(e) => setNewSubmenuGroup(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-black focus:ring-2 focus:ring-[#043077]/20 outline-hidden focus:border-[#043077] cursor-pointer"
                      >
                        <option value="botana">Máquina botanas</option>
                        <option value="bebidas">Máquinas bebidas</option>
                        <option value="cafe">Máquina de café</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-1">Título de registro de máquina</label>
                      <input
                        type="text"
                        placeholder="p. ej: Máquina de refrescos pasillo central"
                        value={newSubmenuTitle}
                        onChange={(e) => setNewSubmenuTitle(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-extrabold focus:ring-2 focus:ring-[#043077]/20 outline-hidden focus:border-[#043077]"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-1">Cliente</label>
                      <input
                        type="text"
                        placeholder="p. ej: Empresa Cliente S.A."
                        value={newSubmenuCliente}
                        onChange={(e) => setNewSubmenuCliente(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-extrabold focus:ring-2 focus:ring-[#043077]/20 outline-hidden focus:border-[#043077]"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-1">Aplicar Convenio Comercial</label>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => setNewSubmenuConvenio('SI')}
                          className={`flex-1 py-2 text-xs font-black rounded-xl transition-all border ${
                            newSubmenuConvenio === 'SI'
                              ? 'bg-[#043077] text-white border-[#043077] shadow-xs'
                              : 'bg-white hover:bg-slate-50 text-slate-600 border-slate-200'
                          }`}
                        >
                          SÍ
                        </button>
                        <button
                          type="button"
                          onClick={() => setNewSubmenuConvenio('NO')}
                          className={`flex-1 py-2 text-xs font-black rounded-xl transition-all border ${
                            newSubmenuConvenio === 'NO'
                              ? 'bg-[#043077] text-white border-[#043077] shadow-xs'
                              : 'bg-white hover:bg-slate-50 text-slate-600 border-slate-200'
                          }`}
                        >
                          NO
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-1">NOTAS</label>
                      <textarea
                        rows={3}
                        placeholder="Propósito u observaciones de esta máquina..."
                        value={newSubmenuDesc}
                        onChange={(e) => setNewSubmenuDesc(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-semibold focus:ring-2 focus:ring-[#043077]/20 outline-hidden focus:border-[#043077]"
                      />
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-150 flex gap-3">
                    <button
                      type="button"
                      onClick={() => setAddSubmenuOpen(false)}
                      className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-black uppercase tracking-wider rounded-xl transition-all cursor-pointer text-center"
                    >
                      Cancelar
                    </button>
                    <button
                      type="button"
                      onClick={handleRegisterNewSubmenu}
                      className="flex-1 py-2.5 bg-[#043077] hover:bg-blue-800 text-white text-xs font-black uppercase tracking-wider rounded-xl transition-all cursor-pointer text-center shadow-xs"
                    >
                      Dar de Alta Acceso
                    </button>
                  </div>
                </motion.div>
              </div>
            )}

            {/* Edit Submenu/Access Modal */}
            {isEditSubmenuOpen && (
              <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
                <motion.div
                  initial={{ scale: 0.95, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xl w-full max-w-md space-y-4 text-left"
                >
                  <div className="flex justify-between items-center border-b border-slate-150 pb-3">
                    <h3 className="font-black text-slate-800 text-sm uppercase tracking-wider flex items-center gap-1.5">
                      <Edit className="w-5 h-5 text-[#043077]" /> Registrar o Editar Acceso en Submenú
                    </h3>
                    <button 
                      type="button"
                      onClick={() => setIsEditSubmenuOpen(false)}
                      className="text-slate-400 hover:text-slate-600 font-black text-md"
                    >
                      ✕
                    </button>
                  </div>

                  <p className="text-xs text-slate-500 font-medium leading-relaxed">
                    Completa los campos del acceso seleccionado para ajustar su título en las pestañas del submenú, reportes y descripciones operacionales.
                  </p>

                  <div className="space-y-3">
                    <div>
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-1">Grupo de máquina</label>
                      <select
                        value={editSubmenuGroup}
                        onChange={(e) => setEditSubmenuGroup(e.target.value as any)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-black focus:ring-2 focus:ring-[#043077]/20 outline-hidden focus:border-[#043077] cursor-pointer"
                      >
                        <option value="botana">Máquina botanas</option>
                        <option value="bebidas">Máquinas bebidas</option>
                        <option value="cafe">Máquina de café</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-1">Título de registro de máquina</label>
                      <input
                        type="text"
                        placeholder="p. ej: Máquina de refrescos pasillo central"
                        value={editSubmenuTitle}
                        onChange={(e) => setEditSubmenuTitle(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-extrabold focus:ring-2 focus:ring-[#043077]/20 outline-hidden focus:border-[#043077]"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-1">Cliente</label>
                      <input
                        type="text"
                        placeholder="p. ej: Empresa Cliente S.A."
                        value={editSubmenuCliente}
                        onChange={(e) => setEditSubmenuCliente(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-extrabold focus:ring-2 focus:ring-[#043077]/20 outline-hidden focus:border-[#043077]"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-1">Aplicar Convenio Comercial</label>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => setEditSubmenuConvenio('SI')}
                          className={`flex-1 py-2 text-xs font-black rounded-xl transition-all border ${
                            editSubmenuConvenio === 'SI'
                              ? 'bg-[#043077] text-white border-[#043077] shadow-xs'
                              : 'bg-white hover:bg-slate-50 text-slate-600 border-slate-200'
                          }`}
                        >
                          SÍ
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditSubmenuConvenio('NO')}
                          className={`flex-1 py-2 text-xs font-black rounded-xl transition-all border ${
                            editSubmenuConvenio === 'NO'
                              ? 'bg-[#043077] text-white border-[#043077] shadow-xs'
                              : 'bg-white hover:bg-slate-50 text-slate-600 border-slate-200'
                          }`}
                        >
                          NO
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-1">Descripción / Notas</label>
                      <textarea
                        rows={3}
                        placeholder="Propósito u observaciones de este lote de surtido comercial..."
                        value={editSubmenuDesc}
                        onChange={(e) => setEditSubmenuDesc(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-semibold focus:ring-2 focus:ring-[#043077]/20 outline-hidden focus:border-[#043077]"
                      />
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-150 flex flex-col gap-2.5">
                    <div className="flex gap-3">
                      <button
                        type="button"
                        onClick={() => setIsEditSubmenuOpen(false)}
                        className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-black uppercase tracking-wider rounded-xl transition-all cursor-pointer text-center"
                      >
                        Cancelar
                      </button>
                      <button
                        type="button"
                        onClick={handleSaveEditedSubmenu}
                        className="flex-1 py-2.5 bg-[#043077] hover:bg-blue-800 text-white text-xs font-black uppercase tracking-wider rounded-xl transition-all cursor-pointer text-center shadow-xs"
                      >
                        Guardar Cambios
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleDeleteSubmenu(editSubmenuId)}
                      className="w-full mt-1.5 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-black uppercase tracking-wider rounded-xl transition-all cursor-pointer text-center flex items-center justify-center gap-1.5"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Eliminar Esta Sección
                    </button>
                  </div>
                </motion.div>
              </div>
            )}

          </div>
        );
      }

      case 'sales_by_product':
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Leaderboard */}
              <div className="bg-white border border-slate-150 rounded-2xl p-5 shadow-sm space-y-4 text-left">
                <h4 className="text-md md:text-lg font-extrabold text-slate-900">Top 5 Favoritos de la Semana</h4>
                <div className="space-y-4">
                  {[
                    { rank: 1, name: 'Capuchino Aromático 16oz', sales: '320 tazas', rev: '$15,360', pct: 40 },
                    { rank: 2, name: 'Café Americano 12oz', sales: '280 tazas', rev: '$9,800', pct: 28 },
                    { rank: 3, name: 'Rebanada Tres Leches', sales: '142 pzas', rev: '$7,810', pct: 16 },
                    { rank: 4, name: 'Espresso Intenso Doble', sales: '110 tazas', rev: '$3,300', pct: 9 },
                    { rank: 5, name: 'Cuernito de Mantequilla', sales: '94 pzas', rev: '$2,632', pct: 7 },
                  ].map((top, idx) => (
                    <div key={idx} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="w-6 h-6 rounded-full bg-blue-50 text-[#043077] font-black text-sm flex items-center justify-center">
                          {top.rank}
                        </span>
                        <div>
                          <span className="text-sm font-extrabold text-slate-800 block leading-tight">{top.name}</span>
                          <span className="text-xs text-slate-500">{top.sales} despachados</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-sm font-mono font-black text-[#043077] block">{top.rev}</span>
                        <span className="text-xs text-slate-500 font-mono block">{top.pct}% del total</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Pie graph simulation with visual HTML / CSS */}
              <div className="bg-white border border-slate-150 rounded-2xl p-5 shadow-sm flex flex-col justify-between">
                <h4 className="text-md md:text-lg font-extrabold text-slate-900 text-left">Participación de Venta</h4>
                
                <div className="py-4 flex justify-center items-center">
                  <div className="relative w-40 h-40">
                    <svg viewBox="0 0 36 36" className="w-full h-full transform -rotate-90">
                      {/* Grey background circle */}
                      <circle cx="18" cy="18" r="15.915" fill="none" stroke="#f1f5f9" strokeWidth="3.2" />
                      
                      {/* Capuchinos Segment (40%) */}
                      <circle cx="18" cy="18" r="15.915" fill="none" stroke="#043077" strokeWidth="3.2" strokeDasharray="40 60" strokeDashoffset="100" />
                      
                      {/* Americanos (28%) */}
                      <circle cx="18" cy="18" r="15.915" fill="none" stroke="#3b82f6" strokeWidth="3.2" strokeDasharray="28 72" strokeDashoffset="60" />
                      
                      {/* Postres (16%) */}
                      <circle cx="18" cy="18" r="15.915" fill="none" stroke="#10b981" strokeWidth="3.2" strokeDasharray="16 84" strokeDashoffset="32" />
                      
                      {/* Panadería (16%) */}
                      <circle cx="18" cy="18" r="15.915" fill="none" stroke="#f59e0b" strokeWidth="3.2" strokeDasharray="16 84" strokeDashoffset="16" />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                      <span className="text-xs text-slate-500 font-black uppercase tracking-wide">PRINCIPAL</span>
                      <span className="text-2xl font-black text-[#043077]">Cafés</span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs text-slate-600 pt-2 border-t border-slate-50">
                  <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-[#043077]"></span> Capuchinos (40%)</div>
                  <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-blue-500"></span> Americanos (28%)</div>
                  <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-emerald-500"></span> Postres (16%)</div>
                  <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-amber-500"></span> Panadería (16%)</div>
                </div>
              </div>

            </div>
          </div>
        );

      case 'expenses':
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-left">
              <div className="p-4.5 bg-white border border-slate-150 rounded-2xl">
                <span className="text-xs text-slate-400 font-extrabold block uppercase">SERVICIOS FIJOS (LUZ/AGUA)</span>
                <span className="text-3xl font-black text-slate-900 mt-1 block">$4,080.00</span>
                <span className="text-xs text-slate-500 font-mono block">Vencimiento: En 15 días</span>
              </div>
              <div className="p-4.5 bg-white border border-slate-150 rounded-2xl">
                <span className="text-xs text-slate-400 font-extrabold block uppercase">INSUMOS & PROVEEDORES</span>
                <span className="text-3xl font-black text-slate-900 mt-1 block">$18,450.20</span>
                <span className="text-xs text-emerald-600 font-bold font-mono block">80% Facturado con IVA</span>
              </div>
              <div className="p-4.5 bg-white border border-slate-150 rounded-2xl">
                <span className="text-xs text-slate-400 font-extrabold block uppercase">MANTENIMIENTOS</span>
                <span className="text-3xl font-black text-slate-900 mt-1 block">$980.00</span>
                <span className="text-xs text-slate-500 font-mono block">Filtros de agua reemplazados</span>
              </div>
            </div>

            <div className="bg-white border border-slate-150 rounded-2xl p-5 shadow-sm text-left space-y-4">
              <h4 className="text-md md:text-lg font-extrabold text-slate-900">Historial Reciente de Egresos</h4>
              <div className="space-y-3">
                {[
                  { concept: 'Compra de Sacos de Café Arábiga', cat: 'Insumos', cost: '$6,400.00', date: '08 Jun 2026', method: 'Transferencia' },
                  { concept: 'Liquidación de Factura Bimestral CFE', cat: 'Servicios', cost: '$3,400.00', date: '05 Jun 2026', method: 'Crédito' },
                  { concept: 'Refacciones para Molino Italiano', cat: 'Mantenimiento', cost: '$980.00', date: '02 Jun 2026', method: 'Efectivo' },
                  { concept: 'Empaques de Muffin y Vasos Bio', cat: 'Insumos', cost: '$1,850.00', date: '28 May 2026', method: 'Transferencia' },
                ].map((exp, idx) => (
                  <div key={idx} className="flex justify-between items-center p-3.5 rounded-xl hover:bg-slate-50 border border-slate-100 transition-colors">
                    <div>
                      <h5 className="text-sm font-extrabold text-slate-800">{exp.concept}</h5>
                      <p className="text-xs text-slate-500 flex gap-2.5 mt-1">
                        <span>{exp.date}</span>•<span>Categoria: {exp.cat}</span>•<span>{exp.method}</span>
                      </p>
                    </div>
                    <span className="text-sm font-mono font-black text-red-600">-{exp.cost}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );

      case 'client_accounts':
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 text-left">
              
              <div className="p-5 bg-white border border-slate-150 rounded-2xl text-left space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-extrabold text-[#043077]">Ranking VIP de Clientes</span>
                  <span className="text-xs font-mono text-slate-500">Total: 182 Registros</span>
                </div>
                <div className="space-y-3">
                  {[
                    { name: 'Sofía Rodríguez', spent: '42 visitas', points: '14 Sellos Acumulados' },
                    { name: 'Gabriel Martínez', spent: '28 visitas', points: '9 Sellos Acumulados' },
                    { name: 'Carlos Mendoza', spent: '19 visitas', points: '4 Sellos Acumulados' },
                  ].map((vip, i) => (
                    <div key={i} className="flex justify-between items-center p-3 rounded-lg bg-slate-50 border-r-4 border-r-[#043077] text-left">
                      <div>
                        <span className="text-sm font-extrabold text-slate-800 block">{vip.name}</span>
                        <span className="text-xs text-slate-500 mt-0.5">{vip.spent}</span>
                      </div>
                      <span className="text-sm font-mono font-bold text-[#043077]">{vip.points}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-5 bg-[#043077] text-white rounded-2xl text-left flex flex-col justify-between">
                <div>
                  <Sparkles className="w-7 h-7 text-yellow-300 animate-pulse mb-3" />
                  <h4 className="text-base font-extrabold">Tarjeta Digital de Lealtad Activa</h4>
                  <p className="text-sm text-blue-100/90 leading-relaxed mt-2">
                    Cada 10 cafés consumidos por el cliente registrados en su perfil generan una bebida gratis de cortesía tamaño mediano de repostería.
                  </p>
                </div>
                <div className="pt-3">
                  <span className="inline-block text-xs font-bold font-mono bg-white/20 px-3.5 py-1.5 rounded">
                    Código de Promoción: CAFEVIP10
                  </span>
                </div>
              </div>

            </div>

            {/* Loyalty details list */}
            <div className="bg-white border border-slate-150 rounded-2xl p-5 shadow-sm text-left space-y-4">
              <h4 className="text-sm md:text-md font-extrabold text-slate-900">Estado de Cuentas y Fidelidad</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  { name: 'Gabriela Martínez', activeStamps: 7, totalCofees: 32, phone: '55-1234-5678' },
                  { name: 'Héctor Vega', activeStamps: 1, totalCofees: 11, phone: '55-3456-7890' },
                ].map((client, idx) => (
                  <div key={idx} className="p-3.5 bg-slate-50 rounded-xl space-y-3.5 border border-slate-100">
                    <div className="flex justify-between">
                      <div>
                        <h5 className="text-sm font-extrabold text-slate-900">{client.name}</h5>
                        <p className="text-xs text-slate-500">{client.phone}</p>
                      </div>
                      <div className="text-right">
                        <span className="text-sm font-bold text-slate-700 block">{client.totalCofees} consumidos</span>
                      </div>
                    </div>
                    {/* Visual Stamp Card */}
                    <div className="space-y-1.5">
                      <span className="text-xs text-[#043077] font-black uppercase block font-mono">TARJETA DE SELLOS:</span>
                      <div className="flex gap-2 flex-wrap">
                        {Array.from({ length: 10 }).map((_, stampIdx) => (
                          <div 
                            key={stampIdx} 
                            className={`w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold ${
                              stampIdx < client.activeStamps 
                                ? 'bg-gradient-to-tr from-[#043077] to-blue-600 text-white shadow-xs' 
                                : 'bg-slate-200 text-slate-500'
                            }`}
                          >
                            {stampIdx < client.activeStamps ? '☕' : ''}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );

      case 'routes':
        return (
          <div className="space-y-6">
            <div className="p-5 rounded-2xl bg-white border border-slate-150 shadow-sm text-left space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h4 className="text-md md:text-lg font-extrabold text-slate-900">Mapa de Distribución y Rutas</h4>
                  <p className="text-sm text-slate-500">Entrega de repostería fresca e insumos a sucursal y pedidos VIP</p>
                </div>
                <div className="flex items-center gap-2 text-sm font-mono">
                  <span className="inline-flex items-center gap-1.5 text-blue-700 bg-blue-50 px-2.5 py-1.5 rounded">
                    <Truck className="w-3.5 h-3.5" /> Ruta Activa #1
                  </span>
                </div>
              </div>

              {/* Styled route SVG diagram */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 h-44 relative flex items-center justify-center overflow-hidden">
                <div className="absolute inset-0 bg-[radial-gradient(#cbd5e1_1px,transparent_1px)] [background-size:16px_16px] opacity-25"></div>
                
                <svg className="w-full h-full absolute inset-0 text-[#043077]/20" stroke="currentColor" strokeWidth="2.5" strokeDasharray="5 5" fill="none">
                  <path d="M 40,110 C 180,30 280,150 480,90 T 700,100" />
                </svg>

                <div className="absolute top-18 left-8 bg-white p-2.5 rounded-lg border border-slate-200 text-xs font-bold shadow-sm flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-[#043077]" />
                  <span>Matriz Surtiantojo</span>
                </div>

                <div className="absolute bottom-6 right-20 bg-white p-2.5 rounded-lg border border-slate-200 text-xs font-bold shadow-sm flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-[#043077]" />
                  <span>Sucursal Norte (Carga #3)</span>
                </div>

                {/* Animated delivery truck representation marker */}
                <div className="absolute left-[45%] top-[25%] p-1.5 rounded-full bg-gradient-to-tr from-[#043077] to-blue-600 text-white shadow-md animate-bounce">
                  <Truck className="w-5 h-5" />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
                <div className="p-3.5 bg-slate-50 rounded-xl">
                  <span className="text-slate-400 block tracking-wide font-black uppercase text-xs">DIRECCIÓN ACTUAL</span>
                  <span className="font-extrabold text-slate-800 mt-1 block">Calle 24 No. 402, Sucursal Norte</span>
                </div>
                <div className="p-3.5 bg-slate-50 rounded-xl">
                  <span className="text-slate-400 block tracking-wide font-black uppercase text-xs">AVANCE DE TRANSITO</span>
                  <span className="font-extrabold text-slate-800 mt-1 block">2 / 3 Puntos Entregados</span>
                </div>
                <div className="p-3.5 bg-slate-50 rounded-xl">
                  <span className="text-slate-400 block tracking-wide font-black uppercase text-xs">ENVIOS DE REPOSTERÍA</span>
                  <span className="font-extrabold text-slate-800 mt-1 block">82% Capacidad Camioneta</span>
                </div>
              </div>
            </div>
          </div>
        );

      case 'maintenance':
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 text-left">
              
              <div className="p-5 bg-white border border-slate-150 rounded-2xl shadow-sm space-y-4">
                <h4 className="text-base font-extrabold text-slate-900">Salud General de Maquinaria</h4>
                <div className="space-y-4">
                  {[
                    { machine: 'Máquina Espresso Italiana', health: 94, state: 'Excelente' },
                    { machine: 'Molino de Café Principal', health: 88, state: 'Óptimo' },
                    { machine: 'Refrigerador Vitrina Postres', health: 76, state: 'Revisión Filtro' },
                  ].map((mch, idx) => (
                    <div key={idx} className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="font-bold text-slate-800">{mch.machine}</span>
                        <span className="font-mono text-[#043077] font-black">{mch.health}%</span>
                      </div>
                      <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div className="bg-[#043077] h-full rounded-full" style={{ width: `${mch.health}%` }}></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-5 bg-white border border-slate-150 rounded-2xl shadow-sm space-y-4">
                <h4 className="text-base font-extrabold text-slate-900">Programas de Limpieza Próximos</h4>
                <div className="space-y-3">
                  <div className="flex items-center gap-2.5 p-3 rounded-lg bg-red-50 text-red-800 border-l-4 border-l-red-600 text-sm font-bold">
                    <AlertTriangle className="w-5 h-5 shrink-0" />
                    <span>Descalcificación Espresso es requerida en 12 días</span>
                  </div>
                  <div className="flex items-center gap-2.5 p-3 rounded-lg bg-amber-50 text-amber-800 border-l-4 border-l-amber-600 text-sm font-bold">
                    <Clock className="w-5 h-5 shrink-0" />
                    <span>Calibración de muelas del molino: Fin de mes</span>
                  </div>
                </div>
              </div>

            </div>
          </div>
        );

      case 'profile':
        return (
          <div className="space-y-6 text-left">
            <div className="bg-white border border-slate-150 rounded-2xl p-6 shadow-sm space-y-6">
              
              <div className="flex flex-col sm:flex-row sm:items-center gap-5 justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-18 h-18 rounded-full bg-gradient-to-tr from-[#043077] to-blue-600 text-white font-extrabold text-2xl flex items-center justify-center shadow-xs font-mono">
                    {(currentUser?.nombre_completo || 'GS')
                      .split(' ')
                      .map((n: string) => n[0])
                      .join('')
                      .substring(0, 2)
                      .toUpperCase()}
                  </div>
                  <div>
                    <h3 className="text-xl font-extrabold text-slate-900">{currentUser?.nombre_completo || 'Usuario'}</h3>
                    <p className="text-sm text-[#043077] font-extrabold">@{currentUser?.username || 'user'}</p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Permisos del Sistema: {currentUser?.rol === 'Administrador' ? 'Módulos Totales' : 'Módulo Surtido Limitado'}
                    </p>
                  </div>
                </div>
                <span className="text-xs font-bold text-slate-400 bg-slate-100 px-3 py-1.5 rounded-full font-mono">
                  Sesión Activa
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-slate-100 text-sm">
                <div className="space-y-3">
                  <div>
                    <span className="text-slate-400 font-extrabold block uppercase text-xs">USUARIO REGISTRADO</span>
                    <span className="font-extrabold text-slate-800">{currentUser?.username || 'S/N'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 font-extrabold block uppercase text-xs">CONTRASEÑA SEGURA</span>
                    <span className="font-extrabold font-mono text-slate-800">{currentUser?.contrasena || 'S/N'}</span>
                  </div>
                </div>
                <div className="space-y-3">
                  <div>
                    <span className="text-slate-400 font-extrabold block uppercase text-xs">ROL ASIGNADO</span>
                    <span className={`inline-flex items-center gap-1.5 text-xs text-white px-2.5 py-1 rounded font-mono font-bold uppercase mt-1 ${
                      currentUser?.rol === 'Administrador' ? 'bg-[#043077]' : 'bg-emerald-600'
                    }`}>
                      <Shield className="w-3.5 h-3.5" /> {currentUser?.rol || 'Operador'}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 font-extrabold block uppercase text-xs">ÚLTIMA SESIÓN</span>
                    <span className="font-extrabold text-slate-800">Hoy, 09:45 AM desde Navegador Local</span>
                  </div>
                </div>
              </div>

            </div>

            {/* If current user is administrator, display the detailed users management table */}
            {currentUser?.rol === 'Administrador' && (
              <div className="bg-white border border-slate-150 rounded-2xl p-6 shadow-sm space-y-4">
                <div>
                  <h4 className="text-md md:text-lg font-extrabold text-slate-900">👥 Gestión de Roles y Usuarios (Supabase)</h4>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                    Esta tabla muestra las credenciales autorizadas y sus roles. Para cambiar manualmente los roles de los usuarios, simplemente modifícalos en la tabla <strong className="text-[#043077]">"usuarios"</strong> en Supabase, y el sistema sincronizará y aplicará los permisos automáticamente.
                  </p>
                </div>

                <div className="overflow-x-auto border border-slate-100 rounded-xl">
                  <table className="w-full text-xs text-left text-slate-700">
                    <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-100">
                      <tr>
                        <th className="py-3 px-4">Nombre Completo</th>
                        <th className="py-3 px-4">Usuario</th>
                        <th className="py-3 px-4 font-mono">Contraseña</th>
                        <th className="py-3 px-4 text-center">Rol (Permisos)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {usersList.map((usr, i) => (
                        <tr key={i} className="hover:bg-slate-50/80 transition-colors">
                          <td className="py-3 px-4 font-extrabold text-slate-900">{usr.nombre_completo}</td>
                          <td className="py-3 px-4 text-[#043077] font-bold font-mono">@{usr.username}</td>
                          <td className="py-3 px-4 font-mono text-slate-600">{usr.contrasena}</td>
                          <td className="py-3 px-4 text-center">
                            <span className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-extrabold font-mono uppercase ${
                              usr.rol === 'Administrador'
                                ? 'bg-blue-50 text-[#043077] border border-blue-200'
                                : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            }`}>
                              {usr.rol}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="p-3 bg-blue-50/50 border border-blue-100 rounded-xl text-[11px] text-slate-600 leading-normal flex items-center gap-2">
                  <span className="text-base">💡</span>
                  <span><strong>Tip de Pruebas:</strong> Al ingresar con el rol <strong>Surtidor</strong>, la barra lateral se bloquea automáticamente mostrando únicamente el módulo <strong>Surtido</strong>.</span>
                </div>
              </div>
            )}
          </div>
        );

      case 'employees':
        const filteredEmployees = usersList.filter((u: any) => {
          if (!empSearch.trim()) return true;
          const q = empSearch.toLowerCase().trim();
          return (
            (u.nombre_completo || '').toLowerCase().includes(q) ||
            (u.username || '').toLowerCase().includes(q) ||
            (u.correo || '').toLowerCase().includes(q) ||
            (u.rol || '').toLowerCase().includes(q) ||
            (u.whatsapp || '').includes(q)
          );
        });

        const sqlScriptText = `-- 🌐 SCRIPT SQL DE TABLA EMPLEADOS / USUARIOS PARA SUPABASE
CREATE TABLE IF NOT EXISTS usuarios (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    username VARCHAR(100) UNIQUE NOT NULL,
    nombre_completo VARCHAR(200) NOT NULL,
    correo VARCHAR(200) DEFAULT '',
    whatsapp VARCHAR(50) DEFAULT '',
    rol VARCHAR(50) NOT NULL DEFAULT 'Surtidor',
    contrasena VARCHAR(200) NOT NULL,
    creado_en TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Asegurar columnas necesarias
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS correo VARCHAR(200) DEFAULT '';
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS whatsapp VARCHAR(50) DEFAULT '';
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS rol VARCHAR(50) DEFAULT 'Surtidor';

-- Índices de rendimiento
CREATE INDEX IF NOT EXISTS idx_usuarios_username ON usuarios(username);
CREATE INDEX IF NOT EXISTS idx_usuarios_rol ON usuarios(rol);

-- Políticas RLS para lectura y escritura desde la app
ALTER TABLE usuarios ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow public read on usuarios" ON usuarios;
CREATE POLICY "Allow public read on usuarios" ON usuarios FOR SELECT USING (true);
DROP POLICY IF EXISTS "Allow public insert on usuarios" ON usuarios;
CREATE POLICY "Allow public insert on usuarios" ON usuarios FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Allow public update on usuarios" ON usuarios;
CREATE POLICY "Allow public update on usuarios" ON usuarios FOR UPDATE USING (true);
DROP POLICY IF EXISTS "Allow public delete on usuarios" ON usuarios;
CREATE POLICY "Allow public delete on usuarios" ON usuarios FOR DELETE USING (true);`;

        return (
          <div className="space-y-6 text-left">
            
            {/* Top Info Banner */}
            <div className="bg-gradient-to-r from-[#043077] to-blue-900 text-white p-6 rounded-2xl shadow-md flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="space-y-1">
                <span className="text-[10px] uppercase tracking-widest font-bold text-emerald-400 bg-emerald-950/60 px-2.5 py-0.5 rounded-full border border-emerald-500/30">
                  Módulo de Administración de Personal
                </span>
                <h3 className="text-xl font-extrabold tracking-tight">Alta y Control de Empleados y Repartidores</h3>
                <p className="text-xs text-blue-100 max-w-2xl leading-relaxed">
                  Registra a tu equipo de surtidores, asigna su rol de acceso y comparte sus credenciales directamente a su WhatsApp personal.
                </p>
              </div>

              <button
                onClick={() => setShowSqlGuide(!showSqlGuide)}
                className="px-4 py-2 bg-white/10 hover:bg-white/20 border border-white/20 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shrink-0"
              >
                <FileText className="w-4 h-4 text-emerald-400" />
                <span>{showSqlGuide ? 'Ocultar Código SQL' : 'Ver Script SQL Supabase'}</span>
              </button>
            </div>

            {/* Optional SQL Script Guide Dropdown */}
            {showSqlGuide && (
              <div className="bg-slate-900 text-slate-100 p-5 rounded-2xl border border-slate-800 space-y-3 font-mono text-xs shadow-lg">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-emerald-400 font-bold">SQL Editor (Supabase)</span>
                    <span className="text-[10px] text-slate-400">Pega este script para configurar la tabla "usuarios"</span>
                  </div>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(sqlScriptText);
                      setSqlCopied(true);
                      setTimeout(() => setSqlCopied(false), 2000);
                    }}
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg text-xs flex items-center gap-1.5 transition-all cursor-pointer"
                  >
                    {sqlCopied ? (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        <span>¡Copiado!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copiar SQL</span>
                      </>
                    )}
                  </button>
                </div>
                <pre className="p-3 bg-slate-950 rounded-xl overflow-x-auto text-[11px] text-emerald-300 leading-relaxed border border-slate-800/80">
                  {sqlScriptText}
                </pre>
              </div>
            )}

            {/* Main Form + Table Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              
              {/* Left Column: Form Registration Card (5 Cols) */}
              <div className="lg:col-span-5 bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-5">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2">
                    <div className="p-2 bg-blue-50 text-[#043077] rounded-xl font-bold">
                      <UserCheck className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-base font-extrabold text-slate-900">
                        {editingEmpUsername ? 'Editar Empleado' : 'Registrar Nuevo Empleado'}
                      </h4>
                      <p className="text-xs text-slate-500">Completa los campos para crear las credenciales</p>
                    </div>
                  </div>
                  {editingEmpUsername && (
                    <button
                      onClick={() => {
                        setEditingEmpUsername(null);
                        setEmpNombre('');
                        setEmpUsername('');
                        setEmpCorreo('');
                        setEmpContrasena('');
                        setEmpWhatsapp('');
                        setEmpRol('Surtidor');
                        setEmpFormMessage(null);
                      }}
                      className="text-xs font-bold text-slate-400 hover:text-slate-600 underline cursor-pointer"
                    >
                      Cancelar
                    </button>
                  )}
                </div>

                {empFormMessage && (
                  <div className={`p-3.5 rounded-xl text-xs font-bold flex items-center gap-2 ${
                    empFormMessage.type === 'success' 
                      ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' 
                      : 'bg-red-50 text-red-800 border border-red-200'
                  }`}>
                    <span>{empFormMessage.type === 'success' ? '✅' : '⚠️'}</span>
                    <span>{empFormMessage.text}</span>
                  </div>
                )}

                <form onSubmit={handleSaveEmployee} className="space-y-4">
                  {/* Nombre del repartidor/empleado */}
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-600 block">
                      Nombre del Repartidor / Empleado <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={empNombre}
                      onChange={(e) => {
                        setEmpNombre(e.target.value);
                        if (!editingEmpUsername && !empUsername) {
                          const clean = e.target.value.toLowerCase().trim().replace(/[^a-z0-9]/g, '_');
                          setEmpUsername(clean);
                        }
                      }}
                      placeholder="Ej. Juan Pérez"
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:border-blue-600 focus:bg-white transition-all"
                    />
                  </div>

                  {/* Usuario */}
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-600 block">
                      Nombre de Usuario <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <span className="absolute left-3.5 top-2.5 text-slate-400 font-mono text-xs font-bold">@</span>
                      <input
                        type="text"
                        required
                        disabled={!!editingEmpUsername}
                        value={empUsername}
                        onChange={(e) => setEmpUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                        placeholder="juan_perez"
                        className="w-full pl-8 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-[#043077] focus:outline-none focus:border-blue-600 focus:bg-white disabled:opacity-60 transition-all"
                      />
                    </div>
                  </div>

                  {/* Correo */}
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-600 block">
                      Correo Electrónico
                    </label>
                    <input
                      type="email"
                      value={empCorreo}
                      onChange={(e) => setEmpCorreo(e.target.value)}
                      placeholder="juan@surtiantojo.com.mx"
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:border-blue-600 focus:bg-white transition-all"
                    />
                  </div>

                  {/* Contraseña con opción de generar contraseña segura */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-slate-600 block">
                        Contraseña <span className="text-red-500">*</span>
                      </label>
                      <button
                        type="button"
                        onClick={generateSecurePassword}
                        className="text-[11px] font-extrabold text-blue-600 hover:text-blue-800 flex items-center gap-1 cursor-pointer"
                      >
                        <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                        <span>Generar Contraseña Segura</span>
                      </button>
                    </div>

                    <div className="relative">
                      <input
                        type={showEmpPassword ? "text" : "password"}
                        required
                        value={empContrasena}
                        onChange={(e) => setEmpContrasena(e.target.value)}
                        placeholder="••••••••••••"
                        className="w-full pl-3.5 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-900 focus:outline-none focus:border-blue-600 focus:bg-white transition-all"
                      />
                      <button
                        type="button"
                        onClick={() => setShowEmpPassword(!showEmpPassword)}
                        className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 cursor-pointer"
                      >
                        {showEmpPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* WhatsApp */}
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-600 block">
                      Teléfono WhatsApp
                    </label>
                    <div className="relative">
                      <Phone className="w-4 h-4 text-emerald-600 absolute left-3 top-2.5" />
                      <input
                        type="tel"
                        value={empWhatsapp}
                        onChange={(e) => setEmpWhatsapp(e.target.value)}
                        placeholder="5512345678"
                        className="w-full pl-9 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-900 focus:outline-none focus:border-blue-600 focus:bg-white transition-all"
                      />
                    </div>
                    <p className="text-[10px] text-slate-400">Para enviar sus datos directamente a su celular vía WhatsApp</p>
                  </div>

                  {/* Rol */}
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-600 block">
                      Rol de Acceso <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={empRol}
                      onChange={(e) => setEmpRol(e.target.value as any)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:border-blue-600 focus:bg-white transition-all cursor-pointer"
                    >
                      <option value="Surtidor">🚚 Surtidor (Repartidor - Solo Módulo Surtido)</option>
                      <option value="Administrador">👔 Administrador (Acceso Total a Módulos)</option>
                    </select>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3 bg-gradient-to-r from-[#043077] to-blue-700 hover:from-blue-800 hover:to-blue-900 text-white font-extrabold text-xs rounded-xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer mt-2"
                  >
                    <UserCheck className="w-4 h-4 text-emerald-400" />
                    <span>{editingEmpUsername ? 'Guardar Cambios de Empleado' : 'Registrar Empleado'}</span>
                  </button>
                </form>
              </div>

              {/* Right Column: Employee List Table (7 Cols) */}
              <div className="lg:col-span-7 bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
                
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
                  <div>
                    <h4 className="text-base font-extrabold text-slate-900">Plantilla de Empleados ({usersList.length})</h4>
                    <p className="text-xs text-slate-500">Repartidores y administradores dados de alta</p>
                  </div>

                  <div className="relative w-full sm:w-52">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      value={empSearch}
                      onChange={(e) => setEmpSearch(e.target.value)}
                      placeholder="Buscar empleado..."
                      className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>

                <div className="overflow-x-auto border border-slate-150 rounded-xl">
                  <table className="w-full text-xs text-left text-slate-700">
                    <thead className="bg-slate-50 text-slate-500 font-extrabold uppercase tracking-wider border-b border-slate-100">
                      <tr>
                        <th className="py-3 px-3">Empleado</th>
                        <th className="py-3 px-3">Rol</th>
                        <th className="py-3 px-3">Contacto / WhatsApp</th>
                        <th className="py-3 px-3 text-center">Credenciales WhatsApp</th>
                        <th className="py-3 px-3 text-right">Acciones</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredEmployees.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="py-8 text-center text-slate-400 font-semibold">
                            No se encontraron empleados registrados.
                          </td>
                        </tr>
                      ) : (
                        filteredEmployees.map((emp: any, idx: number) => {
                          const isSurt = emp.rol === 'Surtidor' || emp.rol === 'Operador';
                          return (
                            <tr key={emp.username || idx} className="hover:bg-slate-50/80 transition-colors">
                              <td className="py-3 px-3">
                                <div className="flex items-center gap-2.5">
                                  <div className={`w-8 h-8 rounded-full font-bold text-xs flex items-center justify-center shrink-0 ${
                                    isSurt ? 'bg-emerald-100 text-emerald-800' : 'bg-blue-100 text-[#043077]'
                                  }`}>
                                    {(emp.nombre_completo || 'U')
                                      .split(' ')
                                      .map((n: string) => n[0])
                                      .join('')
                                      .substring(0, 2)
                                      .toUpperCase()}
                                  </div>
                                  <div>
                                    <span className="font-extrabold text-slate-900 block leading-tight">{emp.nombre_completo}</span>
                                    <span className="font-mono text-[#043077] font-bold text-[11px]">@{emp.username}</span>
                                  </div>
                                </div>
                              </td>

                              <td className="py-3 px-3">
                                <span className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-extrabold font-mono uppercase ${
                                  isSurt 
                                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                    : 'bg-blue-50 text-[#043077] border border-blue-200'
                                }`}>
                                  {isSurt ? '🚚 Surtidor' : '👔 Admin'}
                                </span>
                              </td>

                              <td className="py-3 px-3">
                                <div className="space-y-0.5">
                                  {emp.whatsapp && (
                                    <span className="text-emerald-700 font-mono font-bold flex items-center gap-1">
                                      <Phone className="w-3 h-3" /> {emp.whatsapp}
                                    </span>
                                  )}
                                  {emp.correo && (
                                    <span className="text-slate-500 text-[11px] block truncate max-w-[140px]">
                                      {emp.correo}
                                    </span>
                                  )}
                                </div>
                              </td>

                              <td className="py-3 px-3 text-center">
                                <button
                                  onClick={() => handleShareWhatsApp(emp)}
                                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-[11px] font-extrabold flex items-center gap-1.5 mx-auto transition-all shadow-2xs cursor-pointer active:scale-95"
                                  title="Enviar credenciales y enlace por WhatsApp"
                                >
                                  <Send className="w-3.5 h-3.5" />
                                  <span>Enviar a WhatsApp</span>
                                </button>
                              </td>

                              <td className="py-3 px-3 text-right">
                                <div className="flex items-center justify-end gap-1">
                                  <button
                                    onClick={() => handleEditEmployee(emp)}
                                    className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                                    title="Editar empleado"
                                  >
                                    <Edit className="w-4 h-4" />
                                  </button>
                                  <button
                                    onClick={() => handleDeleteEmployee(emp.username)}
                                    className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                                    title="Eliminar empleado"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 text-[11px] text-slate-600 space-y-1">
                  <p className="font-bold text-slate-800">💡 Información para el repartidor:</p>
                  <p>Al ingresar con el rol <strong>Surtidor</strong>, el sistema restringe el acceso únicamente al módulo <strong>Surtido</strong>. El enlace de acceso compartido es: <strong className="text-blue-700">https://surtiantojo.com.mx/</strong></p>
                </div>

              </div>

            </div>

          </div>
        );

      default:
        return null;
    }
  };

  // Get module detailed title & specific descriptive subtitle
  const getModuleMeta = () => {
    switch (moduleId) {
      case 'metrics':
        return {
          title: "Métricas Generales",
          desc: "Visualiza reportes financieros, tasas de conversión, ventas netas y el rendimiento mensual de tu cafetería.",
          color: "border-[#043077] bg-white",
          accentColor: "text-[#043077]"
        };
      case 'products':
        return {
          title: "Catálogo de Productos",
          desc: "Administra el menú de bebidas, postres, desayunos y paquetes de Surtiantojo Café con precios y categorías.",
          color: "border-[#043077] bg-white",
          accentColor: "text-[#043077]"
        };
      case 'supply':
        return {
          title: "Surtido & Abastecimiento",
          desc: "Controla compras de insumos (grano de café, leche, tazas, empaques) con alertas de niveles de reabastecimiento.",
          color: "border-[#043077] bg-white",
          accentColor: "text-[#043077]"
        };
      case 'sales_by_product':
        return {
          title: "Venta por Producto",
          desc: "Analiza el top de bebidas más vendidas, alimentos favoritos de los clientes y horas de mayor consumo.",
          color: "border-[#043077] bg-white",
          accentColor: "text-[#043077]"
        };
      case 'expenses':
        return {
          title: "Control de Gastos",
          desc: "Registra egresos operativos, pago de nómina, renta local, mantenimientos y servicios para balance neto.",
          color: "border-[#043077] bg-white",
          accentColor: "text-[#043077]"
        };
      case 'client_accounts':
        return {
          title: "Cuentas y Clientes",
          desc: "Fidelización de clientes habituales. Con la tarjeta digital acumulan tazas de café y obtienen descuentos.",
          color: "border-[#043077] bg-white",
          accentColor: "text-[#043077]"
        };
      case 'routes':
        return {
          title: "Rutas de Despacho",
          desc: "Monitorea entregas de insumos a sucursales secundarias y rutas de pedidos especiales a domicilio.",
          color: "border-[#043077] bg-white",
          accentColor: "text-[#043077]"
        };
      case 'maintenance':
        return {
          title: "Mantenimiento Preventivo",
          desc: "Calendariza limpieza de caldera, descalcificación espresso, calibración de molinos y revisión de refrigeración.",
          color: "border-[#043077] bg-white",
          accentColor: "text-[#043077]"
        };
      case 'profile':
        return {
          title: "Mi Perfil de Usuario",
          desc: "Configura tus datos de contacto, accesos de seguridad, roles del personal y preferencias del sistema.",
          color: "border-[#043077] bg-white",
          accentColor: "text-[#043077]"
        };
      case 'employees':
        return {
          title: "Gestión de Empleados & Repartidores",
          desc: "Alta de empleados con roles de Administrador o Surtidor, generación de contraseñas seguras y envío directo de credenciales por WhatsApp.",
          color: "border-[#043077] bg-white",
          accentColor: "text-[#043077]"
        };
      default:
        return {
          title: "Módulo del Sistema",
          desc: "Administración integral de la operación de Surtiantojo Café.",
          color: "border-[#043077] bg-white",
          accentColor: "text-[#043077]"
        };
    }
  };

  const meta = getModuleMeta();

  return (
    <motion.div 
      id={`module-card-${moduleId}`}
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="bg-white rounded-2xl shadow-md border border-slate-200 overflow-hidden relative"
    >
      {/* Decorative top colored border line with brand new blue brand color #043077 */}
      <div className="h-1.5 w-full bg-[#043077]" />

      <div className="p-3.5 sm:p-6 md:p-8 space-y-4 sm:space-y-6">
        {/* Module Header Inside */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-100 pb-5">
          <div className="space-y-1 text-left">
            <span className="text-[9px] tracking-widest font-black uppercase text-[#043077] font-display">SURTIANTOJO CAFÉ • SISTEMA ACTIVO</span>
            <h2 className="text-2xl md:text-3xl font-extrabold font-display text-slate-900 tracking-tight flex items-center gap-2">
              {meta.title}
            </h2>
            <p className="text-slate-500 text-xs max-w-2xl leading-relaxed">
              {meta.desc}
            </p>
          </div>
        </div>

        {/* The dynamic visual layout showing gorgeous high fidelity active state metrics & charts */}
        <div className="relative rounded-xl bg-slate-50/80 p-2.5 sm:p-6 md:p-8 min-h-[220px] flex flex-col justify-between overflow-hidden border border-slate-200/50">
          {renderInteractiveMetrics()}
        </div>

      </div>
    </motion.div>
  );
}
