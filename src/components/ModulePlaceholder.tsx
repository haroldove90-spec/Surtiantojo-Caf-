import React, { useState, useMemo, useRef } from 'react';
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
  ChevronDown
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

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

  // Product module state declarations
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [pagoFilter, setPagoFilter] = useState('all');

  // Sorting state (Excel-like)
  const [sortField, setSortField] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  // Multi-selection state
  const [selectedItems, setSelectedItems] = useState<Record<string, boolean>>({});

  // Modals active status
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any | null>(null);
  const [viewingItem, setViewingItem] = useState<any | null>(null);

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
  const [isImportingProgress, setIsImportingProgress] = useState(false);  // Robust number parsing with currency sign and comma decimal safety
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
          proveedor: ['proveedor', 'provider', 'marca', 'brand', 'fabricante', 'distribuidor'],
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
      const matchesSearch = !q ||
                            (p.nombre || '').toLowerCase().includes(q) || 
                            (p.codigo || '').toLowerCase().includes(q) || 
                            (p.proveedor || '').toLowerCase().includes(q) || 
                            (p.notas || '').toLowerCase().includes(q);
      
      const matchesStatus = statusFilter === 'all' || p.status === statusFilter;
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
        <td style="padding: 10px 8px; font-size: 12px; font-weight: bold;"><span style="background-color: ${p.status === 'Activo' ? '#dcfce7' : '#fee2e2'}; color: ${p.status === 'Activo' ? '#166534' : '#991b1b'}; padding: 2px 8px; border-radius: 9999px;">${p.status}</span></td>
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
            <span class="metric-value" style="color: #166534;">${itemsList.filter(p => p.status === 'Activo').length} ítems</span>
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
                  {products.filter(p => p.status === 'Activo').length} Items
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
              
              {/* Row 1: Search and Dropdowns (Full Width & Dynamic Search Optioning) */}
              <div className="flex flex-col lg:flex-row gap-3 w-full">
                
                {/* Search input field */}
                <div className="relative flex-1 min-w-[280px]">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Buscar producto por nombre, código, proveedor o marca..."
                    className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-[#043077] focus:ring-1 focus:ring-[#043077] transition-all text-slate-800 font-medium shadow-2xs"
                  />
                  {searchQuery && (
                    <button 
                      onClick={() => setSearchQuery('')}
                      className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 focus:outline-none text-xs bg-slate-200/50 hover:bg-slate-200 px-1.5 py-0.5 rounded-md"
                    >
                      Limpiar
                    </button>
                  )}
                </div>

                {/* Status Dropdown filter */}
                <div className="relative min-w-[160px]">
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
                <div className="relative min-w-[165px]">
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

            </div>

            {/* List and table main responsive wrapper */}
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
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
                      {renderSortableHeader("Producto", "nombre")}
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
                        <td colSpan={11} className="py-12 text-center text-slate-500 font-medium">
                          No se encontraron productos registrados con los filtros aplicados.
                        </td>
                      </tr>
                    ) : (
                      filteredProducts.map((p) => {
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
                              <div className="flex flex-col gap-1">
                                {p.codigo && (
                                  <span className="inline-block max-w-fit text-[10px] font-mono font-bold bg-[#043077]/10 text-[#043077] px-1.5 py-0.5 rounded uppercase select-all" title="Código de barras / SKU">
                                    {p.codigo}
                                  </span>
                                )}
                                <span className="font-extrabold text-slate-800 text-sm block">{p.nombre}</span>
                                {(p.proveedor || p.piezas_por_caja) && (
                                  <span className="text-xs font-semibold text-slate-500 block">
                                    {p.proveedor ? `Prov: ${p.proveedor}` : ''} {p.piezas_por_caja ? `(${p.piezas_por_caja} pzas/caja)` : ''}
                                  </span>
                                )}
                                {p.notas && (
                                  <span className="text-xs text-slate-400 font-medium line-clamp-1 italic max-w-[200px] block">
                                    {p.notas}
                                  </span>
                                )}
                              </div>
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
                                onClick={() => onUpdateProduct && onUpdateProduct(p.id, { status: p.status === 'Activo' ? 'Inactivo' : 'Activo' })}
                                className="focus:outline-none cursor-pointer"
                                title="Haga clic para cambiar de estado rápidamente"
                              >
                                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                                  p.status === 'Activo' 
                                    ? 'bg-emerald-100 text-emerald-800' 
                                    : 'bg-rose-100 text-rose-800'
                                }`}>
                                  <span className={`w-1.5 h-1.5 rounded-full ${p.status === 'Activo' ? 'bg-emerald-600' : 'bg-rose-600'}`}></span>
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

      case 'supply':
        return (
          <div className="space-y-6">
            {/* Top Indicator bar */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-left">
              <div className="p-4.5 bg-white border border-slate-150 rounded-2xl shadow-xs">
                <span className="text-xs text-slate-400 font-extrabold block">GRANO CAFÉ MATRIZ RESGUARDO</span>
                <span className="text-3xl font-black text-slate-900 mt-1 block">18.5 kgs</span>
                <span className="text-xs text-emerald-600 font-semibold font-mono">Suficiente para 12 días</span>
              </div>
              <div className="p-4.5 bg-white border border-slate-150 rounded-2xl shadow-xs">
                <span className="text-xs text-slate-400 font-extrabold block">VASOS CRÍTICOS 12oz</span>
                <span className="text-3xl font-black text-red-600 mt-1 block">150 pzas</span>
                <span className="text-xs text-red-500 font-bold font-mono">Reordenar urgente</span>
              </div>
              <div className="p-4.5 bg-white border border-slate-150 rounded-2xl shadow-xs">
                <span className="text-xs text-slate-400 font-extrabold block">LECHES & COMPLEMENTOS</span>
                <span className="text-3xl font-black text-slate-900 mt-1 block">74% de Capacidad</span>
                <span className="text-xs text-emerald-600 font-semibold font-mono">Último surtido: Ayer</span>
              </div>
            </div>

            {/* Insumo tables with customized SVG graphic bar indicators */}
            <div className="bg-white border border-slate-150 rounded-2xl p-5 shadow-sm space-y-4">
              <h4 className="text-md md:text-lg font-extrabold text-slate-900 text-left">Niveles de Resguardo e Insumos</h4>
              <div className="space-y-4 text-left">
                {[
                  { item: 'Grano de Café Blend Surtiantojo', type: 'Materia prima', level: 78, qty: '18.5 kg', status: 'Sano', color: '#043077' },
                  { item: 'Vasos Desechables Bio 16oz', type: 'Insumos', level: 32, qty: '420 pzas', status: 'Revisión', color: '#F59E0B' },
                  { item: 'Vasos Desechables Bio 12oz', type: 'Insumos', level: 12, qty: '150 pzas', status: 'Agotando', color: '#EF4444' },
                  { item: 'Leche Entera Premium (Cajas)', type: 'Lácteos', level: 90, qty: '48 pzas', status: 'Sano', color: '#10B981' },
                  { item: 'Azúcar Refinada Mascabado', type: 'Endulzantes', level: 65, qty: '12.0 kg', status: 'Sano', color: '#043077' },
                ].map((sup, idx) => (
                  <div key={idx} className="space-y-1.5">
                    <div className="flex justify-between items-center text-sm">
                      <div>
                        <span className="font-extrabold text-slate-800">{sup.item}</span>
                        <span className="text-xs text-slate-400 ml-2">({sup.type})</span>
                      </div>
                      <div className="font-mono text-slate-700">
                        <strong className="text-slate-900">{sup.qty}</strong> / {sup.level}%
                      </div>
                    </div>
                    {/* Visual progress bar */}
                    <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                      <div 
                        className="h-full rounded-full transition-all duration-500" 
                        style={{ 
                          width: `${sup.level}%`,
                          backgroundColor: sup.color
                        }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );

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

      <div className="p-6 md:p-8 space-y-6">
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
        <div className="relative rounded-xl bg-slate-50/80 p-6 md:p-8 min-h-[220px] flex flex-col justify-between overflow-hidden border border-slate-200/50">
          {renderInteractiveMetrics()}
        </div>

      </div>
    </motion.div>
  );
}
