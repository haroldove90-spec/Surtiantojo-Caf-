import React, { useState, useMemo, useRef, useEffect } from 'react';
import { 
  TrendingUp, 
  Coffee, 
  ClipboardList, 
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
  Milk
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

interface ModulePlaceholderProps {
  moduleId: string;
  products?: any[];
  onAddProduct?: (product: any) => Promise<void>;
  onAddProducts?: (productsList: any[]) => Promise<void>;
  onUpdateProduct?: (id: string, product: any) => Promise<void>;
  onDeleteProduct?: (id: string) => Promise<void>;
  onUpdateProductStatusBulk?: (ids: string[], status: 'Activo' | 'Inactivo') => Promise<void>;
}

export default function ModulePlaceholder({ 
  moduleId,
  products = [],
  onAddProduct,
  onAddProducts,
  onUpdateProduct,
  onDeleteProduct,
  onUpdateProductStatusBulk
}: ModulePlaceholderProps) {
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

  // Scroll synchronizer refs
  const topScrollRef = useRef<HTMLDivElement>(null);
  const tableContainerRef = useRef<HTMLDivElement>(null);
  const [tableScrollWidth, setTableScrollWidth] = useState<number>(0);

  // Sorting state (Excel-like)
  const [sortField, setSortField] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  // Multi-selection state
  const [selectedItems, setSelectedItems] = useState<Record<string, boolean>>({});

  // Modals active status
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any | null>(null);
  const [viewingItem, setViewingItem] = useState<any | null>(null);

  // --- SUBMENU GENERAL SURTIDO & EXCEL EXPORT SYSTEM STATES ---
  const [activeSupplySubmenu, setActiveSupplySubmenu] = useState<string>('cer_bb');
  const [supplySubmenuList, setSupplySubmenuList] = useState([
    { id: 'vending_surtido', name: 'Surtido de Terminales', title: 'Surtido General de Máquinas', desc: 'Control físico de stock en terminales con indicadores de carga acumulada y reabastecimiento directo.' },
    { id: 'cer_bb', name: 'Cer BB', title: 'Reporte Surtido Cer BB', desc: 'Concentrado de surtido de tazas, jarros infantiles y productos de cerámica provistos por Vajillas Oaxaca.' },
    { id: 'art_alt', name: 'ART ALT', title: 'Reporte ART ALT', desc: 'Surtido de artículos alternos y complementarios.' },
    { id: 'art_ct', name: 'ART CT', title: 'Reporte ART CT', desc: 'Surtido de artículos de cafetería y complementarios de té.' }
  ]);

  const [cerBBData, setCerBBData] = useState<any[]>(() => {
    try {
      const stored = localStorage.getItem('surtiantojo_cer_bb');
      return stored ? JSON.parse(stored) : [];
    } catch (e) {
      return [];
    }
  });

  const [artAltData, setArtAltData] = useState<any[]>(() => {
    try {
      const stored = localStorage.getItem('surtiantojo_art_alt');
      return stored ? JSON.parse(stored) : [];
    } catch (e) {
      return [];
    }
  });

  const [artCtData, setArtCtData] = useState<any[]>(() => {
    try {
      const stored = localStorage.getItem('surtiantojo_art_ct');
      return stored ? JSON.parse(stored) : [];
    } catch (e) {
      return [];
    }
  });

  // Dynamic content list map for custom added ones!
  const [genericSubmenuData, setGenericSubmenuData] = useState<Record<string, Array<any>>>(() => {
    try {
      const stored = localStorage.getItem('surtiantojo_generic_submenu');
      return stored ? JSON.parse(stored) : {};
    } catch (e) {
      return {};
    }
  });

  // Save submenu headers for dynamic CSV import
  const [submenuHeaders, setSubmenuHeaders] = useState<Record<string, string[]>>(() => {
    try {
      const stored = localStorage.getItem('surtiantojo_submenu_headers');
      return stored ? JSON.parse(stored) : {};
    } catch (e) {
      return {};
    }
  });

  // Values for adding dynamic row
  const [addRowValues, setAddRowValues] = useState<Record<string, string>>({});

  // Values for editing dynamic row
  const [editRowValues, setEditRowValues] = useState<Record<string, string>>({});

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
  const saveToSupabase = async (tabId: string, rows: any[]) => {
    try {
      const tableName = `surtido_${tabId}`;
      const headers = submenuHeaders[tabId] || [];
      if (headers.length === 0) return;

      const mappedRows = rows.map(row => {
        const obj: any = {};
        headers.forEach(header => {
          const sqlColName = header.toLowerCase()
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .replace(/[^a-z0-9]/g, "_")
            .replace(/^_+|_+$/g, "")
            .trim();
          const rawVal = row.values && row.values[header] !== undefined ? row.values[header] : '';
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
        return obj;
      });

      const { error } = await supabase.from(tableName).upsert(mappedRows);
      if (error) {
        console.warn(`Supabase sync failed for ${tableName}:`, error.message);
      } else {
        console.log(`Supabase sync success for ${tableName}`);
      }
    } catch (err) {
      console.error("Error in saveToSupabase:", err);
    }
  };

  // Load Surtido records on mount from Supabase
  useEffect(() => {
    const loadFromSupabase = async () => {
      try {
        const submenus = ['cer_bb', 'art_alt', 'art_ct'];
        for (const tabId of submenus) {
          const tableName = `surtido_${tabId}`;
          const { data, error } = await supabase.from(tableName).select('*');
          if (!error && data && data.length > 0) {
            // Find columns excluding standard auto IDs
            const cols = Object.keys(data[0]).filter(k => k !== 'id' && k !== 'fecha_registro');
            // Reconstruct original-looking headers
            const headers = cols.map(c => {
              return c.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
            });
            
            const rows = data.map((item: any, rIndex: number) => {
              const rowValues: Record<string, string> = {};
              cols.forEach((col, idx) => {
                rowValues[headers[idx]] = String(item[col] !== null && item[col] !== undefined ? item[col] : '');
              });

              // Extract standard values
              let matchedCodigo = '';
              let matchedNombre = '';
              let matchedUnidades = 0;
              let matchedCosto = 0;
              let matchedPrecio = 0;
              let matchedProveedor = 'Proveedor General';

              headers.forEach(h => {
                const cleanH = h.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]/g, "").trim();
                const val = rowValues[h] || '';
                if (cleanH === 'codigo' || cleanH === 'sku' || cleanH === 'codig') matchedCodigo = val;
                else if (cleanH === 'producto' || cleanH === 'nombre' || cleanH === 'articulo') matchedNombre = val;
                else if (cleanH === 'surtir' || cleanH === 'cantidad' || cleanH === 'unidades') matchedUnidades = parseFloat(val) || 0;
                else if (cleanH === 'costo') matchedCosto = parseFloat(val) || 0;
                else if (cleanH === 'precio' || cleanH === 'preciovta' || cleanH === 'preciodeventa' || cleanH === 'precio_vta' || cleanH === 'vta') matchedPrecio = parseFloat(val) || 0;
                else if (cleanH === 'proveedor') matchedProveedor = val;
              });

              return {
                id: item.id || Date.now() + rIndex + Math.random(),
                codigo: (matchedCodigo || `PROD-S-${rIndex}`).toUpperCase(),
                nombre_producto: matchedNombre || `Producto ${rIndex}`,
                unidad_surtida: matchedUnidades,
                costo_surtido: matchedCosto,
                precio_venta: matchedPrecio,
                proveedor: matchedProveedor,
                fecha_registro: item.fecha_registro || new Date().toISOString().split('T')[0],
                values: rowValues
              };
            });

            setSubmenuHeaders(prev => ({ ...prev, [tabId]: headers }));
            if (tabId === 'cer_bb') setCerBBData(rows);
            else if (tabId === 'art_alt') setArtAltData(rows);
            else if (tabId === 'art_ct') setArtCtData(rows);
          }
        }
      } catch (e) {
        console.warn("Could not load from Supabase Surtido tables:", e);
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

  // Inline Row Editing states for spreadsheet table rows
  const [editingRowId, setEditingRowId] = useState<number | null>(null);
  const [editRowCodigo, setEditRowCodigo] = useState('');
  const [editRowNombre, setEditRowNombre] = useState('');
  const [editRowUnidades, setEditRowUnidades] = useState(0);
  const [editRowCosto, setEditRowCosto] = useState(0);
  const [editRowPrecio, setEditRowPrecio] = useState(0);
  const [editRowProveedor, setEditRowProveedor] = useState('');

  // Bulk deletion selection state
  const [selectedRowIds, setSelectedRowIds] = useState<number[]>([]);

  useEffect(() => {
    setSelectedRowIds([]);
  }, [activeSupplySubmenu]);

  // Form states for creating custom submenus
  const [addSubmenuOpen, setAddSubmenuOpen] = useState(false);
  const [newSubmenuName, setNewSubmenuName] = useState('');
  const [newSubmenuTitle, setNewSubmenuTitle] = useState('');
  const [newSubmenuDesc, setNewSubmenuDesc] = useState('');

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
          else if (h === 'precio' || h === 'preciovta' || h === 'preciodeventa' || h === 'precio_vta') colPrecio = idx;
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
        setSubmenuHeaders(prev => ({
          ...prev,
          [tabId]: originalHeaders
        }));

        if (confirm(`Se detectaron ${parsedRows.length} registros en el archivo.\n\n¿Quieres REEMPLAZAR todos los registros actuales de esta sección con la nueva importación?\n(Aceptar = Reemplazar por completo, Cancelar = Agregar al final del listado)`)) {
          if (tabId === 'cer_bb') {
            setCerBBData(parsedRows);
            setTimeout(() => saveToSupabase('cer_bb', parsedRows), 10);
          }
          else if (tabId === 'art_alt') {
            setArtAltData(parsedRows);
            setTimeout(() => saveToSupabase('art_alt', parsedRows), 10);
          }
          else if (tabId === 'art_ct') {
            setArtCtData(parsedRows);
            setTimeout(() => saveToSupabase('art_ct', parsedRows), 10);
          }
          else {
            setGenericSubmenuData(prev => ({
              ...prev,
              [tabId]: parsedRows
            }));
            setTimeout(() => saveToSupabase(tabId, parsedRows), 10);
          }
        } else {
          if (tabId === 'cer_bb') {
            setCerBBData(prev => {
              const res = [...prev, ...parsedRows];
              setTimeout(() => saveToSupabase('cer_bb', res), 10);
              return res;
            });
          }
          else if (tabId === 'art_alt') {
            setArtAltData(prev => {
              const res = [...prev, ...parsedRows];
              setTimeout(() => saveToSupabase('art_alt', res), 10);
              return res;
            });
          }
          else if (tabId === 'art_ct') {
            setArtCtData(prev => {
              const res = [...prev, ...parsedRows];
              setTimeout(() => saveToSupabase('art_ct', res), 10);
              return res;
            });
          }
          else {
            setGenericSubmenuData(prev => {
              const res = [...(prev[tabId] || []), ...parsedRows];
              setTimeout(() => saveToSupabase(tabId, res), 10);
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
    return (
      <th className="py-4 px-4 select-none">
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
                <table className="w-full text-left border-collapse min-w-[1000px]">
                  <thead>
                    <tr className="bg-slate-50 text-[10px] font-black uppercase text-slate-400 border-b border-slate-100">
                      <th className="py-4 px-4 w-12 text-center">
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
                      <th className="py-4 px-4 text-center text-slate-500 font-extrabold uppercase text-[10px]">Acción</th>
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
                            <td className="py-3 px-4 text-center">
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
                            <td className="py-3 px-4">
                              {p.codigo ? (
                                <span className="inline-block max-w-fit text-[11px] font-mono font-bold bg-[#043077]/10 text-[#043077] px-2 py-0.5 rounded uppercase select-all" title="Código de barras / SKU">
                                  {p.codigo}
                                </span>
                              ) : (
                                <span className="text-xs text-slate-400 font-bold italic block">Sin código</span>
                              )}
                            </td>
                            <td className="py-3 px-4">
                              <span className="font-extrabold text-slate-800 text-sm block">{p.nombre}</span>
                            </td>
                            <td className="py-3 px-4">
                              <span className="text-xs font-bold text-slate-600 block bg-slate-100/60 border border-slate-200/50 rounded-lg px-2.5 py-1.5 max-w-[155px] truncate" title={p.proveedor || "Genérico"}>
                                {p.proveedor || "Genérico"}
                              </span>
                            </td>
                            <td className="py-3 px-4">
                              <div className="text-xs text-slate-600 leading-tight">
                                <div>Caja: <span className="font-bold font-mono text-slate-800">{formatMXN(p.precio_caja)}</span></div>
                                <div>Unitario: <span className="font-bold font-mono text-slate-800">{formatMXN(p.precio_unidad)}</span></div>
                              </div>
                            </td>
                            <td className="py-3 px-4">
                              <span className="text-sm font-extrabold text-slate-900 font-mono">
                                {formatMXN(p.precio_venta)}
                              </span>
                            </td>
                            <td className="py-3 px-4">
                              <span className="inline-flex items-center gap-0.5 px-2.5 py-0.5 rounded-full text-xs font-black bg-emerald-50 text-emerald-700">
                                {safeVal(p.margen_pct).toFixed(1)}%
                              </span>
                            </td>
                            <td className="py-3 px-4">
                              <span className="text-sm font-extrabold text-slate-900 font-mono">
                                {formatMXN(p.precio_sugerido)}
                              </span>
                            </td>
                            <td className="py-3 px-4">
                              <span className="inline-flex items-center gap-0.5 px-2.5 py-0.5 rounded-full text-xs font-black bg-[#043077]/5 text-[#043077]">
                                {safeVal(p.margen_ps_pct).toFixed(1)}%
                              </span>
                            </td>
                            <td className="py-3 px-4">
                              <span className="text-xs text-slate-600 font-semibold bg-slate-100 px-2 py-0.5 rounded-md">
                                {p.forma_pago}
                              </span>
                            </td>
                            <td className="py-3 px-4">
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
                            <td className="py-3 px-4">
                              <span className="text-xs text-slate-500 font-mono block">
                                {formattedRegisterDate}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-center">
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
                          <label className="text-xs font-black text-slate-600 block mb-1">Precio Venta Público *</label>
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
                            Precio al público actual
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
                          <label className="text-xs font-black text-slate-600 block mb-1">Precio Sugerido Venta</label>
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

        // Submenu state helpers
        const getActiveSubmenuData = (): any[] => {
          switch (activeSupplySubmenu) {
            case 'cer_bb': return cerBBData;
            case 'art_alt': return artAltData;
            case 'art_ct': return artCtData;
            default: return genericSubmenuData[activeSupplySubmenu] || [];
          }
        };

        const handleUpdateSubmenuData = (updater: any) => {
          if (activeSupplySubmenu === 'cer_bb') {
            setCerBBData(prev => {
              const res = typeof updater === 'function' ? updater(prev) : updater;
              setTimeout(() => saveToSupabase('cer_bb', res), 10);
              return res;
            });
          } else if (activeSupplySubmenu === 'art_alt') {
            setArtAltData(prev => {
              const res = typeof updater === 'function' ? updater(prev) : updater;
              setTimeout(() => saveToSupabase('art_alt', res), 10);
              return res;
            });
          } else if (activeSupplySubmenu === 'art_ct') {
            setArtCtData(prev => {
              const res = typeof updater === 'function' ? updater(prev) : updater;
              setTimeout(() => saveToSupabase('art_ct', res), 10);
              return res;
            });
          } else {
            setGenericSubmenuData(prev => {
              const currentList = prev[activeSupplySubmenu] || [];
              const res = typeof updater === 'function' ? updater(currentList) : updater;
              setTimeout(() => saveToSupabase(activeSupplySubmenu, res), 10);
              return {
                ...prev,
                [activeSupplySubmenu]: res
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
          const headers = submenuHeaders[activeSupplySubmenu] || [];

          let sqlText = `-- PostgreSQL DDL - Creación de Estructura de Tabla y Consultas de Surtido (${activeMeta.name})\n`;
          
          if (headers.length > 0) {
            // Dynamic columns schema based on CSV headers
            sqlText += `CREATE TABLE IF NOT EXISTS ${tableName} (\n`;
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
            sqlText += `CREATE TABLE IF NOT EXISTS ${tableName} (\n`;
            sqlText += `    id SERIAL PRIMARY KEY,\n`;
            sqlText += `    codigo VARCHAR(50) UNIQUE NOT NULL,\n`;
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
              
              sqlText += insertValues + `\nON CONFLICT (codigo) DO UPDATE SET\n`;
              sqlText += `    unidad_surtida = EXCLUDED.unidad_surtida,\n`;
              sqlText += `    costo_surtido = EXCLUDED.costo_surtido,\n`;
              sqlText += `    precio_venta = EXCLUDED.precio_venta;\n\n`;
            }
          }

          sqlText += `-- Consulta Analítica de Dashboard: Calcular Ganancia Bruta y Margen Real\n`;
          sqlText += `SELECT \n`;
          if (headers.length > 0) {
            // Find columns for calculations
            let surtirCol = 'surtir';
            let precioCol = 'precio_vta';
            let costoCol = '0'; // fallback if no costo exists
            headers.forEach(h => {
              const cleanH = cleanHeader(h);
              const sqlCol = h.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]/g, "_").trim();
              if (cleanH === 'surtir' || cleanH === 'cantidad' || cleanH === 'unidades') surtirCol = sqlCol;
              else if (cleanH === 'precio' || cleanH === 'preciovta' || cleanH === 'preciodeventa' || cleanH === 'precio_vta' || cleanH === 'vta') precioCol = sqlCol;
              else if (cleanH === 'costo') costoCol = sqlCol;
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
          sqlText += `FROM ${tableName};`;

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

          const colKeys = ['id', 'codigo', 'nombre_producto', 'unidad_surtida', 'costo_surtido', 'precio_venta', 'importe_total', 'proveedor', 'fecha_registro'];
          const colLabels = ['ID', 'Código', 'Producto / Artículo', 'Unidades Surtidas', 'Costo Unitario ($)', 'Precio Venta Unitario ($)', 'Importe Total ($)', 'Proveedor', 'Fecha Registro'];

          // Generate semicolon separated row content with Excel specific Byte Order Mark (BOM)
          const headers = colLabels.join(';');
          const rows = dataToExport.map(item => {
            const totalImport = safeVal(item.unidad_surtida) * safeVal(item.precio_venta);
            const rowCopy = {
              ...item,
              importe_total: totalImport
            };
            return colKeys.map(key => {
              const val = rowCopy[key];
              if (val === undefined || val === null) return '';
              // Format numbers nicely or escape string values
              if (typeof val === 'number') {
                return val.toFixed(2).replace('.', ',');
              }
              let valStr = String(val).replace(/"/g, '""');
              if (valStr.includes(';') || valStr.includes('\n') || valStr.includes(',')) {
                valStr = `"${valStr}"`;
              }
              return valStr;
            }).join(';');
          });

          const csvContent = "\uFEFF" + "sep=;\n" + [headers, ...rows].join('\n');
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

        const handleAddRow = () => {
          if (!rowCodigo.trim() || !rowNombre.trim()) {
            alert("Por favor completa el código y nombre del producto.");
            return;
          }
          const newRow = {
            id: Date.now(),
            codigo: rowCodigo.trim().toUpperCase(),
            nombre_producto: rowNombre.trim(),
            unidad_surtida: safeVal(rowUnidades),
            costo_surtido: safeVal(rowCosto),
            precio_venta: safeVal(rowPrecio),
            proveedor: rowProveedor.trim() || 'Proveedor General',
            fecha_registro: new Date().toISOString().split('T')[0]
          };

          handleUpdateSubmenuData((prev: any[]) => [...prev, newRow]);
          
          // reset form
          setRowCodigo('');
          setRowNombre('');
          setRowUnidades(1);
          setRowCosto(0);
          setRowPrecio(0);
          setRowProveedor('');
          setAddSupplyRowOpen(false);
        };

        const handleDeleteRow = (rowId: number) => {
          if (confirm("¿Estás seguro de eliminar este registro de surtido?")) {
            handleUpdateSubmenuData((prev: any[]) => prev.filter(r => r.id !== rowId));
            setSelectedRowIds(prev => prev.filter(id => id !== rowId));
          }
        };

        const handleDeleteSelected = () => {
          if (selectedRowIds.length === 0) return;
          if (confirm(`¿Estás seguro de que deseas eliminar los ${selectedRowIds.length} registros seleccionados de forma masiva?`)) {
            handleUpdateSubmenuData((prev: any[]) => prev.filter(r => !selectedRowIds.includes(r.id)));
            setSelectedRowIds([]);
          }
        };

        const handleClearAllSubmenuRows = () => {
          const count = currentSubmenuData.length;
          if (count === 0) {
            alert("No hay registros para borrar en esta sección.");
            return;
          }
          if (confirm(`⚠️ ALERTA DE BORRADO MASIVO \n\n¿Estás completamente seguro de eliminar TODOS los ${count} registros de esta sección (${activeMeta.name})?\n\nEsta acción borrará la tabla entera.`)) {
            handleUpdateSubmenuData([]);
            setSelectedRowIds([]);
          }
        };

        const handleStartEditRow = (row: any) => {
          setEditingRowId(row.id);
          setEditRowCodigo(row.codigo || '');
          setEditRowNombre(row.nombre_producto || '');
          setEditRowUnidades(safeVal(row.unidad_surtida));
          setEditRowCosto(safeVal(row.costo_surtido));
          setEditRowPrecio(safeVal(row.precio_venta));
          setEditRowProveedor(row.proveedor || '');
        };

        const handleSaveRow = (rowId: number) => {
          handleUpdateSubmenuData((prev: any[]) => prev.map(r => {
            if (r.id === rowId) {
              return {
                ...r,
                codigo: editRowCodigo.trim().toUpperCase(),
                nombre_producto: editRowNombre.trim(),
                unidad_surtida: safeVal(editRowUnidades),
                costo_surtido: safeVal(editRowCosto),
                precio_venta: safeVal(editRowPrecio),
                proveedor: editRowProveedor.trim() || 'Proveedor General'
              };
            }
            return r;
          }));
          setEditingRowId(null);
        };

        const handleCancelEditRow = () => {
          setEditingRowId(null);
        };

        const handleRegisterNewSubmenu = () => {
          if (!newSubmenuName.trim()) {
            alert("Por favor escribe el nombre de acceso para el submenú.");
            return;
          }
          const generatedId = 'custom_' + newSubmenuName.toLowerCase().trim().replace(/[^a-z0-9]/g, '_');
          if (supplySubmenuList.some(s => s.id === generatedId)) {
            alert("Ya existe un acceso registrado bajo este mismo nombre de menú.");
            return;
          }
          
          const newTabItem = {
            id: generatedId,
            name: newSubmenuName.trim(),
            title: newSubmenuTitle.trim() || `Reporte Surtido ${newSubmenuName}`,
            desc: newSubmenuDesc.trim() || `Administración, adición y exportación de surtidos para el acceso ${newSubmenuName}.`
          };

          setSupplySubmenuList(prev => [...prev, newTabItem]);
          
          // Bootstrap with one elegant initial default row
          setGenericSubmenuData(prev => ({
            ...prev,
            [generatedId]: [
              { id: 1, codigo: `${newSubmenuName.substring(0,3).toUpperCase()}-1`, nombre_producto: `Insumo Inicial ${newSubmenuName}`, unidad_surtida: 40, costo_surtido: 35.00, precio_venta: 70.00, proveedor: 'Proveedor Asociado', fecha_registro: new Date().toISOString().split('T')[0] }
            ]
          }));

          setActiveSupplySubmenu(generatedId);
          setNewSubmenuName('');
          setNewSubmenuTitle('');
          setNewSubmenuDesc('');
          setAddSubmenuOpen(false);
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
            <div className="flex flex-col gap-3">
              <span className="text-[10px] font-black uppercase tracking-widest text-[#043077]">Visualizar Accesos Surtido en Submenú</span>
              <div className="flex flex-wrap items-center gap-1.5 border-b border-slate-150 pb-2">
                {supplySubmenuList.map((submenu) => {
                  const isActive = activeSupplySubmenu === submenu.id;
                  return (
                    <button
                      key={submenu.id}
                      onClick={() => {
                        setActiveSupplySubmenu(submenu.id);
                        setShowSQLSchema(false);
                        setSubmenuSearchQuery('');
                      }}
                      className={`px-4 py-2 text-xs font-black uppercase tracking-wider rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
                        isActive
                          ? 'bg-[#043077] text-white shadow-xs'
                          : 'bg-slate-100 hover:bg-slate-200 text-slate-600 border border-slate-200/50'
                      }`}
                    >
                      {submenu.id === 'vending_surtido' ? (
                        <Sliders className="w-3.5 h-3.5" />
                      ) : (
                        <FileSpreadsheet className="w-3.5 h-3.5" />
                      )}
                      {submenu.name}
                    </button>
                  );
                })}
                
                {/* Plus access button */}
                <button
                  type="button"
                  onClick={() => setAddSubmenuOpen(true)}
                  className="px-3 py-2 bg-indigo-50 border border-indigo-200 text-[#043077] text-xs font-bold uppercase tracking-wider rounded-xl hover:bg-indigo-100/80 transition-all flex items-center gap-1 cursor-pointer"
                  title="Dar de alta nuevo acceso al submenú"
                >
                  <Plus className="w-3.5 h-3.5" /> Registrar Acceso
                </button>
              </div>
            </div>

            {/* Render dynamically depending on chosen submenu */}
            {activeSupplySubmenu === 'vending_surtido' ? (
              // Option A: Render standard general vending terminals cards
              <div className="space-y-6">
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 p-5 rounded-2xl text-left select-none">
                  <h4 className="text-sm font-black text-[#043077] uppercase tracking-wider flex items-center gap-2">
                    📥 Control Central de Surtido y Abastecimiento
                  </h4>
                  <p className="text-xs text-slate-600 font-semibold mt-1.5 leading-relaxed">
                    Selecciona cualquier máquina o icono a continuación para visualizar su producto cargado, configurar su abastecimiento express desde el catálogo o consultar sus métricas de llenado acumuladas en tiempo real.
                  </p>
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
                    <h3 className="text-lg font-black text-slate-800 flex items-center gap-2">
                      <FileSpreadsheet className="w-5 h-5 text-[#043077]" />
                      {activeMeta.title}
                    </h3>
                    <p className="text-xs text-slate-500 font-bold mt-1 leading-relaxed max-w-2xl">{activeMeta.desc}</p>
                  </div>
                  
                  {/* Master quick import Excel trigger */}
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
                </div>

                {/* KPI Metrics Dashboard based on live filters of the report */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                  <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-3xs flex flex-col justify-between">
                    <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wide block">Piezas Surtidas</span>
                    <div className="flex items-baseline gap-1 mt-2">
                      <span className="text-xl font-mono font-black text-slate-800">{totalUnits}</span>
                      <span className="text-[10px] text-slate-500 font-semibold uppercase">u.</span>
                    </div>
                  </div>

                  <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-3xs flex flex-col justify-between">
                    <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wide block">Costo de Inversión</span>
                    <div className="flex items-baseline gap-1 mt-2">
                      <span className="text-xl font-mono font-black text-slate-800">{formatMXN(totalCostIncurred)}</span>
                    </div>
                  </div>

                  <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-3xs flex flex-col justify-between">
                    <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wide block">Venta Proyectada</span>
                    <div className="flex items-baseline gap-1 mt-2">
                      <span className="text-xl font-mono font-black text-[#043077]">{formatMXN(projectedSalesValue)}</span>
                    </div>
                  </div>

                  <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-3xs flex flex-col justify-between">
                    <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wide block">Ganancia Bruta</span>
                    <div className="flex items-baseline gap-1 mt-2">
                      <span className="text-xl font-mono font-black text-emerald-600">+{formatMXN(grossProfit)}</span>
                    </div>
                  </div>

                  <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-3xs flex flex-col justify-between">
                    <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wide block">Margen Promedio</span>
                    <div className="flex items-baseline gap-1 mt-2">
                      <span className="text-xl font-mono font-black text-indigo-600">{avgMarginPct.toFixed(1)}%</span>
                    </div>
                  </div>
                </div>

                {/* Submenu filters & rows manipulation bar */}
                <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
                  {/* Search query input */}
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                    <input
                      type="text"
                      placeholder="Buscar por código, nombre o proveedor..."
                      value={submenuSearchQuery}
                      onChange={(e) => setSubmenuSearchQuery(e.target.value)}
                      className="w-full pl-9 pr-4 py-2 bg-slate-50 hover:bg-slate-100/50 border border-slate-205 rounded-xl text-xs font-bold outline-hidden transition-all focus:ring-2 focus:ring-[#043077]/10"
                    />
                    {submenuSearchQuery && (
                      <button 
                        onClick={() => setSubmenuSearchQuery('')}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs font-black"
                      >
                        ✕
                      </button>
                    )}
                  </div>

                  {/* Actions buttons */}
                  <div className="flex flex-wrap gap-2 shrink-0">
                    {selectedRowIds.length > 0 && (
                      <button
                        type="button"
                        onClick={handleDeleteSelected}
                        className="px-3.5 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-black uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-3xs"
                        title="Eliminar registros seleccionados con la casilla"
                      >
                        <Trash2 className="w-3.5 h-3.5" /> Borrar Seleccionados ({selectedRowIds.length})
                      </button>
                    )}

                    {currentSubmenuData.length > 0 && (
                      <button
                        type="button"
                        onClick={handleClearAllSubmenuRows}
                        className="px-3.5 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200/30 text-xs font-bold uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                        title="Eliminar todos los registros de esta sección de forma masiva"
                      >
                        <Trash2 className="w-3.5 h-3.5" /> Vaciar Sección
                      </button>
                    )}

                    {/* Inline code SQL triggers */}
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

                    {/* Add row button */}
                    <button
                      type="button"
                      onClick={() => setAddSupplyRowOpen(!addSupplyRowOpen)}
                      className="px-3.5 py-2 bg-[#043077] hover:bg-blue-800 text-white text-xs font-black uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-1 cursor-pointer shadow-3xs"
                    >
                      <Plus className="w-3.5 h-3.5" /> Agregar Registro
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
                      <div className="space-y-1">
                        <label className="text-[10px] text-slate-500 font-bold block">Código Producto</label>
                        <input
                          type="text"
                          placeholder="p. ej: CER-BB-06"
                          value={rowCodigo}
                          onChange={(e) => setRowCodigo(e.target.value)}
                          className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs font-bold focus:ring-1 focus:ring-[#043077]"
                        />
                      </div>
                      <div className="space-y-1 md:col-span-2">
                        <label className="text-[10px] text-slate-500 font-bold block">Nombre Producto / Artículo</label>
                        <input
                          type="text"
                          placeholder="Nombre comercial"
                          value={rowNombre}
                          onChange={(e) => setRowNombre(e.target.value)}
                          className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs font-bold focus:ring-1 focus:ring-[#043077]"
                        />
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
                        <label className="text-[10px] text-slate-500 font-bold block">Costo Adquisición ($)</label>
                        <input
                          type="number"
                          step="0.01"
                          value={rowCosto}
                          onChange={(e) => setRowCosto(parseFloat(e.target.value) || 0)}
                          className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs font-bold focus:ring-1 focus:ring-[#043077]"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] text-slate-500 font-bold block">Precio de Venta ($)</label>
                        <input
                          type="number"
                          step="0.01"
                          value={rowPrecio}
                          onChange={(e) => setRowPrecio(parseFloat(e.target.value) || 0)}
                          className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs font-bold focus:ring-1 focus:ring-[#043077]"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-end">
                      <div className="space-y-1">
                        <label className="text-[10px] text-slate-500 font-bold block">Proveedor / Marca comercial</label>
                        <input
                          type="text"
                          placeholder="Nombre de la distribuidora"
                          value={rowProveedor}
                          onChange={(e) => setRowProveedor(e.target.value)}
                          className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs font-bold focus:ring-1 focus:ring-[#043077]"
                        />
                      </div>
                      <div className="flex gap-2 justify-end">
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
                      <button 
                        onClick={() => setShowSQLSchema(false)} 
                        className="text-slate-500 hover:text-slate-300 text-xs font-black"
                      >
                        Cerrar [X]
                      </button>
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
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-100 text-[10px] font-black text-slate-500 uppercase tracking-wider border-b border-slate-200 select-none">
                          <th className="py-3 px-3 text-center w-10">
                            <input
                              type="checkbox"
                              className="rounded border-slate-300 text-[#043077] focus:ring-[#043077] h-3.5 w-3.5 cursor-pointer"
                              checked={filteredSubmenuRows.length > 0 && filteredSubmenuRows.every(r => selectedRowIds.includes(r.id))}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  const allIds = filteredSubmenuRows.map(r => r.id);
                                  setSelectedRowIds(prev => Array.from(new Set([...prev, ...allIds])));
                                } else {
                                  const visibleIds = new Set(filteredSubmenuRows.map(r => r.id));
                                  setSelectedRowIds(prev => prev.filter(id => !visibleIds.has(id)));
                                }
                              }}
                            />
                          </th>
                          {submenuHeaders[activeSupplySubmenu] && submenuHeaders[activeSupplySubmenu].length > 0 ? (
                            submenuHeaders[activeSupplySubmenu].map((header, idx) => (
                              <th key={idx} className="py-3 px-4">{header}</th>
                            ))
                          ) : (
                            <>
                              <th className="py-3 px-4">Código / SKU</th>
                              <th className="py-3 px-4">Producto o Artículo</th>
                              <th className="py-3 px-4 text-center">Unidades</th>
                              <th className="py-3 px-4 text-right">Costo Unit.</th>
                              <th className="py-3 px-4 text-right">Precio Venta</th>
                              <th className="py-3 px-4 text-right">Importe Total</th>
                              <th className="py-3 px-4">Proveedor</th>
                              <th className="py-3 px-4">Fecha Surtido</th>
                            </>
                          )}
                          <th className="py-3 px-4 text-center">Controles</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 bg-white">
                        {filteredSubmenuRows.length === 0 ? (
                          <tr>
                            <td colSpan={15} className="py-12 text-center text-slate-400 font-bold bg-slate-50/50">
                              No hay registros cargados para {activeMeta.name} que coincidan con la búsqueda.
                            </td>
                          </tr>
                        ) : (
                          filteredSubmenuRows.map((row) => {
                            const isEditing = row.id === editingRowId;
                            const hasDynamicHeaders = submenuHeaders[activeSupplySubmenu] && submenuHeaders[activeSupplySubmenu].length > 0;
                            const totalVal = isEditing 
                              ? safeVal(editRowUnidades) * safeVal(editRowPrecio)
                              : safeVal(row.unidad_surtida) * safeVal(row.precio_venta);

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
                                      submenuHeaders[activeSupplySubmenu].map((header, idx) => (
                                        <td key={idx} className="py-2 px-3">
                                          <input
                                            type="text"
                                            value={editRowValues[header] !== undefined ? editRowValues[header] : ''}
                                            onChange={(e) => setEditRowValues(prev => ({ ...prev, [header]: e.target.value }))}
                                            className="w-full bg-white border border-slate-300 rounded px-1.5 py-0.5 text-xs font-semibold text-slate-800"
                                          />
                                        </td>
                                      ))
                                    ) : (
                                      <>
                                        <td className="py-2 px-3">
                                          <input
                                            type="text"
                                            value={editRowCodigo}
                                            onChange={(e) => setEditRowCodigo(e.target.value)}
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
                                            value={editRowProveedor}
                                            onChange={(e) => setEditRowProveedor(e.target.value)}
                                            className="w-full bg-white border border-slate-300 rounded px-1.5 py-0.5 text-xs font-semibold"
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
                                        className="rounded border-slate-300 text-[#043077] focus:ring-[#043077] h-3.5 w-3.5 cursor-pointer"
                                        checked={selectedRowIds.includes(row.id)}
                                        onChange={(e) => {
                                          if (e.target.checked) {
                                            setSelectedRowIds(prev => [...prev, row.id]);
                                          } else {
                                            setSelectedRowIds(prev => prev.filter(id => id !== row.id));
                                          }
                                        }}
                                      />
                                    </td>
                                    {hasDynamicHeaders ? (
                                      submenuHeaders[activeSupplySubmenu].map((header, idx) => {
                                        const cellVal = row.values && row.values[header] !== undefined ? row.values[header] : '';
                                        const cleanH = cleanHeader(header);
                                        const isCode = cleanH.includes('codigo') || cleanH.includes('sku') || cleanH.includes('codig');
                                        return (
                                          <td 
                                            key={idx} 
                                            className={`py-3 px-4 ${isCode ? 'font-mono font-black text-[#043077]' : 'font-medium text-slate-700'}`}
                                          >
                                            {cellVal}
                                          </td>
                                        );
                                      })
                                    ) : (
                                      <>
                                        <td className="py-3 px-4 font-mono font-black text-[#043077]">
                                          {row.codigo}
                                        </td>
                                        <td className="py-3 px-4 font-extrabold text-slate-800">
                                          {row.nombre_producto}
                                        </td>
                                        <td className="py-3 px-4 text-center font-mono font-black text-slate-700">
                                          {row.unidad_surtida}
                                        </td>
                                        <td className="py-3 px-4 text-right font-mono text-slate-600">
                                          {formatMXN(row.costo_surtido)}
                                        </td>
                                        <td className="py-3 px-4 text-right font-mono text-slate-600">
                                          {formatMXN(row.precio_venta)}
                                        </td>
                                        <td className="py-3 px-4 text-right font-mono font-black text-[#043077]">
                                          {formatMXN(totalVal)}
                                        </td>
                                        <td className="py-3 px-4 text-slate-500 font-semibold">
                                          {row.proveedor}
                                        </td>
                                        <td className="py-3 px-4 text-slate-400 font-medium">
                                          {row.fecha_registro}
                                        </td>
                                      </>
                                    )}
                                    <td className="py-3 px-4 text-center">
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
                    <span>Mostrando {filteredSubmenuRows.length} registros en {activeMeta.name}</span>
                    <span className="font-mono text-[#043077] uppercase tracking-wider">Cargar en Dashboard Excel Habilitado</span>
                  </div>
                </div>

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
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-1">Nombre Corto de Acceso (Menú)</label>
                      <input
                        type="text"
                        placeholder="p. ej: Cervezas BB, Refrescos"
                        value={newSubmenuName}
                        onChange={(e) => setNewSubmenuName(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-black focus:ring-2 focus:ring-[#043077]/20 outline-hidden focus:border-[#043077]"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-1">Título del Reporte / Hoja</label>
                      <input
                        type="text"
                        placeholder="p. ej: Reporte Consolidado de Cervezas BB"
                        value={newSubmenuTitle}
                        onChange={(e) => setNewSubmenuTitle(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-extrabold focus:ring-2 focus:ring-[#043077]/20 outline-hidden focus:border-[#043077]"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-1">Descripción / Notas</label>
                      <textarea
                        rows={3}
                        placeholder="Propósito u observaciones de este lote de surtido comercial..."
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
                  <div className="w-18 h-18 rounded-full bg-gradient-to-tr from-[#043077] to-blue-600 text-white font-extrabold text-2xl flex items-center justify-center shadow-xs">
                    GS
                  </div>
                  <div>
                    <h3 className="text-xl font-extrabold text-slate-900">Gerencia Surtiantojo</h3>
                    <p className="text-sm text-[#043077] font-extrabold">Administrador General del Sistema</p>
                    <p className="text-xs text-slate-400 mt-0.5">Permisos Totales: Lectura, Escritura, Edición de Catálogos</p>
                  </div>
                </div>
                <button className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-extrabold rounded-xl transition-all">
                  Editar Información
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-slate-100 text-sm">
                <div className="space-y-3">
                  <div>
                    <span className="text-slate-400 font-extrabold block uppercase text-xs">CORREO ACCESO</span>
                    <span className="font-extrabold text-slate-800">gerencia@surtiantojocafe.com</span>
                  </div>
                  <div>
                    <span className="text-slate-400 font-extrabold block uppercase text-xs">TELÉFONO DE CONTACTO</span>
                    <span className="font-extrabold text-slate-800">55-8422-9011</span>
                  </div>
                </div>
                <div className="space-y-3">
                  <div>
                    <span className="text-slate-400 font-extrabold block uppercase text-xs">ROL ASIGNADO</span>
                    <span className="inline-flex items-center gap-1.5 text-xs text-white bg-[#043077] px-2.5 py-1 rounded font-mono font-bold uppercase mt-1">
                      <Shield className="w-3.5 h-3.5" /> Superadministrador
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 font-extrabold block uppercase text-xs">ÚLTIMA SESIÓN</span>
                    <span className="font-extrabold text-slate-800">Hoy, 22:16 UTC desde Navegador Local</span>
                  </div>
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
