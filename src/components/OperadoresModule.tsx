import React, { useState, useEffect, useMemo } from 'react';
import { 
  Plus, 
  Trash2, 
  Save, 
  FileSpreadsheet, 
  Calendar, 
  Box, 
  CheckCircle2, 
  RefreshCw,
  Layers,
  Sparkles,
  Lock,
  Boxes,
  CupSoda,
  Coffee,
  AlertCircle,
  X
} from 'lucide-react';
import { supabase } from '../lib/supabase';

interface OperadoresModuleProps {
  currentUser?: any;
  isSurtidorOnly?: boolean;
}

// Fallback machines list if Supabase query is loading or empty
const DEFAULT_SUBMENUS = [
  // Botanas
  { id: 'art_alt', name: 'ART ALT', title: 'Reporte ART ALT', desc: 'Surtido de artículos alternos y complementarios.', grupo: 'botana' },
  { id: 'art_ct', name: 'ART CT', title: 'Reporte ART CT', desc: 'Surtido de artículos de cafetería y complementarios de té.', grupo: 'botana' },
  { id: 'art_pk', name: 'ART PK', title: 'Reporte ART PK', desc: 'Surtido de artículos de botanas PK.', grupo: 'botana' },
  { id: 'art_prk', name: 'ART PRK', title: 'Reporte ART PRK', desc: 'Surtido de artículos de botanas y confitería PRK.', grupo: 'botana' },
  { id: 'cer1', name: 'CER 1', title: 'Reporte CER 1', desc: 'Surtido de la máquina CER 1 para botanas.', grupo: 'botana' },
  { id: 'cer2', name: 'CER 2', title: 'Reporte CER 2', desc: 'Surtido de la máquina CER 2 para botanas.', grupo: 'botana' },
  { id: 'cer3', name: 'CER 3', title: 'Reporte CER 3', desc: 'Surtido de la máquina CER 3 para botanas y snacks.', grupo: 'botana' },
  { id: 'cg1', name: 'CG 1', title: 'Reporte CG 1', desc: 'Surtido de la máquina CG 1 para botanas.', grupo: 'botana' },
  { id: 'cg2', name: 'CG 2', title: 'Reporte CG 2', desc: 'Surtido de la máquina CG 2 para botanas.', grupo: 'botana' },
  { id: 'cg3', name: 'CG 3', title: 'Reporte CG 3', desc: 'Surtido de la máquina CG 3 para botanas.', grupo: 'botana' },
  { id: 'frial', name: 'FRIAL', title: 'Reporte FRIAL', desc: 'Surtido para máquina Frial.', grupo: 'botana' },
  { id: 'lmno', name: 'LMNO', title: 'Reporte LMNO', desc: 'Surtido para máquina LMNO.', grupo: 'botana' },
  // Bebidas
  { id: 'cer_bb', name: 'CER BB', title: 'Reporte CER BB', desc: 'Surtido de la máquina de bebidas CER BB.', grupo: 'bebidas' },
  { id: 'cont_bb', name: 'CONT. BB', title: 'Reporte CONT. BB', desc: 'Surtido de la máquina de bebidas CONT. BB.', grupo: 'bebidas' },
  { id: 'vitro_bb', name: 'VITRO BB', title: 'Reporte VITRO BB', desc: 'Surtido de la máquina de bebidas VITRO BB.', grupo: 'bebidas' }
];

// Default bitacora / controls checklist
const DEFAULT_CONTROLS = [
  { id: 'c1', label: 'Mon. Inicial', detail: '', values: { '01-jul': '$679', '06-jul': '$51', '08-jul': '$202', '10-jul': '$21' } },
  { id: 'c2', label: 'Mon. Final', detail: '', values: { '01-jul': '$1,349', '06-jul': '$1,040', '08-jul': '$1,208', '10-jul': '$1,260' } },
  { id: 'c3', label: 'Pruebas con $$', detail: 'Cuanto $?', values: { '01-jul': 'no', '06-jul': 'no', '08-jul': 'no', '10-jul': 'no' } },
  { id: 'c4', label: 'Ventas Externas', detail: 'Cuanto $?', values: { '01-jul': 'no', '06-jul': 'no', '08-jul': 'no', '10-jul': 'no' } },
  { id: 'c5', label: 'Limpieza interna', detail: 'Si', values: { '01-jul': 'no', '06-jul': 'si', '08-jul': 'si', '10-jul': 'si' } },
  { id: 'c6', label: 'Limpieza externa', detail: 'Si', values: { '01-jul': 'no', '06-jul': 'si', '08-jul': 'si', '10-jul': 'si' } },
  { id: 'c7', label: 'Falla de equipo', detail: 'Si', values: { '01-jul': 'no', '06-jul': 'no', '08-jul': 'no', '10-jul': 'no' } },
  { id: 'c8', label: 'Monedero', detail: 'X', values: { '01-jul': 'no', '06-jul': 'no', '08-jul': 'no', '10-jul': 'no' } },
  { id: 'c9', label: 'Billetero', detail: 'X', values: { '01-jul': 'no', '06-jul': 'no', '08-jul': 'no', '10-jul': 'no' } },
  { id: 'c10', label: 'Base de resorte', detail: 'X', values: { '01-jul': 'no', '06-jul': 'no', '08-jul': 'no', '10-jul': 'no' } },
  { id: 'c11', label: 'Otro', detail: 'X', values: { '01-jul': 'no', '06-jul': 'no', '08-jul': 'no', '10-jul': 'no' } },
  { id: 'c12', label: 'Notas', detail: '', values: { '01-jul': 'no', '06-jul': 'no', '08-jul': 'no', '10-jul': 'no' } },
  { id: 'c13', label: 'Elaboro', detail: '', values: { '01-jul': 'FC', '06-jul': 'FC', '08-jul': 'FC', '10-jul': 'Fc' } }
];

// Helper to determine category group (botana, bebidas, cafe)
const getSubmenuGroup = (id: string, name: string = '', group?: string): 'botana' | 'bebidas' | 'cafe' => {
  if (group && ['botana', 'bebidas', 'cafe'].includes(group.toLowerCase())) {
    return group.toLowerCase() as 'botana' | 'bebidas' | 'cafe';
  }
  const lowerId = (id || '').toLowerCase();
  const lowerName = (name || '').toLowerCase();
  const combined = `${lowerId} ${lowerName}`;

  if (
    combined.includes('cer_bb') || 
    combined.includes('cont_bb') || 
    combined.includes('vitro_bb') ||
    combined.includes('bebida') ||
    combined.includes('refresco') ||
    combined.includes('jugo') ||
    combined.includes(' bb') ||
    lowerId.endsWith('_bb')
  ) {
    return 'bebidas';
  }

  if (
    combined.includes('cafe') || 
    combined.includes('café') || 
    combined.includes('coffee') ||
    combined.includes('cafeteria') ||
    combined.includes('cafetería')
  ) {
    return 'cafe';
  }

  return 'botana';
};

const sortSubmenus = (list: any[]) => {
  if (!list || !Array.isArray(list)) return [];
  const others = list.filter(item => item && item.id && item.id !== 'vending_surtido');
  const unique: any[] = [];
  const seenIds = new Set<string>();
  const seenNames = new Set<string>();

  others.forEach(item => {
    const rawId = String(item.id || '').trim();
    const normId = rawId.toLowerCase();
    const rawName = String(item.name || item.title || item.id || '').trim();
    const cleanKey = rawName.toUpperCase().replace(/\s+/g, '');

    if (!seenIds.has(normId) && !seenNames.has(cleanKey)) {
      seenIds.add(normId);
      seenNames.add(cleanKey);
      const group = getSubmenuGroup(rawId, rawName, item.grupo || item.group);
      unique.push({
        id: rawId,
        name: rawName,
        title: item.title || `Reporte ${rawName}`,
        desc: item.desc || item.description || `Surtido para ${rawName}`,
        cliente: item.cliente || '',
        convenio: item.convenio || 'NO',
        grupo: group
      });
    }
  });
  unique.sort((a, b) => a.name.localeCompare(b.name, 'es', { sensitivity: 'base', numeric: true }));
  return unique;
};

// Date validation helper
const formatOrValidateDate = (inputStr: string): string | null => {
  if (!inputStr || !inputStr.trim()) return null;
  const str = inputStr.trim();

  // YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(str)) {
    const [y, m, d] = str.split('-');
    const months = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
    const monthIdx = parseInt(m, 10) - 1;
    if (monthIdx >= 0 && monthIdx < 12) {
      return `${d.padStart(2, '0')}-${months[monthIdx]}`;
    }
  }

  // DD-MMM e.g. 12-jul, 05-ago, 15-ene
  if (/^\d{1,2}-[a-zA-Z]{3,4}$/i.test(str)) {
    const [d, m] = str.split('-');
    return `${d.padStart(2, '0')}-${m.toLowerCase()}`;
  }

  // DD/MM/YYYY or DD/MM/YY
  if (/^\d{1,2}\/\d{1,2}\/\d{2,4}$/.test(str)) {
    const [d, m] = str.split('/');
    const months = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
    const monthIdx = parseInt(m, 10) - 1;
    if (monthIdx >= 0 && monthIdx < 12) {
      return `${d.padStart(2, '0')}-${months[monthIdx]}`;
    }
  }

  // JS Date fallback
  const dObj = new Date(str);
  if (!isNaN(dObj.getTime())) {
    const day = String(dObj.getDate()).padStart(2, '0');
    const months = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
    return `${day}-${months[dObj.getMonth()]}`;
  }

  return null;
};

export default function OperadoresModule({ currentUser, isSurtidorOnly = false }: OperadoresModuleProps) {
  // Category state (all, botana, bebidas, cafe)
  const [activeCategory, setActiveCategory] = useState<'all' | 'botana' | 'bebidas' | 'cafe'>('all');

  // Machines list registered by Admin (synced from surtido_submenus)
  const [machinesList, setMachinesList] = useState<any[]>(() => {
    try {
      const stored = localStorage.getItem('surtiantojo_submenu_list');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) return sortSubmenus(parsed);
      }
    } catch (e) {}
    return sortSubmenus(DEFAULT_SUBMENUS);
  });

  const [activeMachineId, setActiveMachineId] = useState<string>('art_alt');
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Modal for Date picker / Date addition
  const [isDateModalOpen, setIsDateModalOpen] = useState<boolean>(false);
  const [datePickerValue, setDatePickerValue] = useState<string>(new Date().toISOString().split('T')[0]);
  const [customDateLabel, setCustomDateLabel] = useState<string>('');
  const [dateError, setDateError] = useState<string | null>(null);

  // Active dates for the selected machine
  const [dates, setDates] = useState<string[]>(['01-jul', '06-jul', '08-jul', '10-jul']);

  // Top metrics (Unid. Vtas, $ ventas)
  const [topMetrics, setTopMetrics] = useState<any[]>([
    { id: '1', sel: '1', concept: 'Unid. Vtas', values: { '01-jul': '68499', '06-jul': '68673', '08-jul': '68898', '10-jul': '69095' } },
    { id: '2', sel: '2', concept: '$ ventas', values: { '01-jul': '934456', '06-jul': '937157', '08-jul': '940765', '10-jul': '943762' } }
  ]);

  // Synchronized product rows (SEL, Nombre, Precio, Caben - read-only from Admin, plus date counts)
  const [products, setProducts] = useState<any[]>([]);

  // Pagination for products table (10 per page)
  const [opPage, setOpPage] = useState<number>(1);
  const OP_PAGE_SIZE = 10;
  const totalOpPages = Math.max(Math.ceil(products.length / OP_PAGE_SIZE), 1);
  const paginatedProducts = useMemo(() => {
    return products.slice((opPage - 1) * OP_PAGE_SIZE, opPage * OP_PAGE_SIZE);
  }, [products, opPage]);

  // Controls / Bitacora checklist
  const [controls, setControls] = useState<any[]>(DEFAULT_CONTROLS);

  // Get active machine object
  const activeMachine = useMemo(() => {
    return machinesList.find(m => m.id === activeMachineId) || machinesList[0] || DEFAULT_SUBMENUS[0];
  }, [machinesList, activeMachineId]);

  // Fetch admin registered machines
  const fetchAdminMachines = async () => {
    try {
      const { data, error } = await supabase.from('surtido_submenus').select('*');
      if (!error && data && data.length > 0) {
        const loaded = data.map((m: any) => ({
          id: m.id,
          name: m.name || m.title || m.id,
          title: m.title || m.name || m.id,
          cliente: m.cliente || '',
          convenio: m.convenio || 'NO',
          grupo: m.grupo || getSubmenuGroup(m.id, m.name || m.title || '')
        }));
        const sorted = sortSubmenus(loaded);
        setMachinesList(sorted);
        localStorage.setItem('surtiantojo_submenu_list', JSON.stringify(sorted));
      }
    } catch (e) {
      console.log('Error fetching admin submenus:', e);
    }
  };

  useEffect(() => {
    fetchAdminMachines();
  }, []);

  // Filter machines by active category
  const categoryMachines = useMemo(() => {
    if (activeCategory === 'all') return machinesList;
    return machinesList.filter(m => getSubmenuGroup(m.id, m.name || m.title || '', m.grupo) === activeCategory);
  }, [machinesList, activeCategory]);

  // Ensure active machine belongs to active category when category changes
  const handleSelectCategory = (cat: 'all' | 'botana' | 'bebidas' | 'cafe') => {
    setActiveCategory(cat);
    if (cat === 'all') return;
    const inCategory = machinesList.filter(m => getSubmenuGroup(m.id, m.name || m.title || '', m.grupo) === cat);
    if (inCategory.length > 0 && !inCategory.some(m => m.id === activeMachineId)) {
      setActiveMachineId(inCategory[0].id);
    }
  };

  // Load machine catalog products & date entries
  const loadMachineData = async (machineId: string) => {
    setIsLoading(true);

    let storedDates = ['01-jul', '06-jul', '08-jul', '10-jul'];
    let storedTopMetrics = [
      { id: '1', sel: '1', concept: 'Unid. Vtas', values: { '01-jul': '68499', '06-jul': '68673', '08-jul': '68898', '10-jul': '69095' } },
      { id: '2', sel: '2', concept: '$ ventas', values: { '01-jul': '934456', '06-jul': '937157', '08-jul': '940765', '10-jul': '943762' } }
    ];
    let storedControls = JSON.parse(JSON.stringify(DEFAULT_CONTROLS));
    let storedValuesMap: Record<string, Record<string, string>> = {};

    try {
      // 1. Fetch cloud operators data from Supabase first
      const { data: opCloudData, error: opCloudErr } = await supabase
        .from('operadores_data')
        .select('*')
        .eq('machine_id', machineId)
        .maybeSingle();

      if (!opCloudErr && opCloudData) {
        if (opCloudData.dates && Array.isArray(opCloudData.dates)) storedDates = opCloudData.dates;
        if (opCloudData.top_metrics && Array.isArray(opCloudData.top_metrics)) storedTopMetrics = opCloudData.top_metrics;
        if (opCloudData.controls && Array.isArray(opCloudData.controls)) storedControls = opCloudData.controls;
        if (opCloudData.values_map && typeof opCloudData.values_map === 'object') storedValuesMap = opCloudData.values_map;
      } else {
        const localSheet = localStorage.getItem(`surtiantojo_operadores_sheet_${machineId}`);
        if (localSheet) {
          const parsed = JSON.parse(localSheet);
          if (parsed.dates) storedDates = parsed.dates;
          if (parsed.topMetrics) storedTopMetrics = parsed.topMetrics;
          if (parsed.controls) storedControls = parsed.controls;
          if (parsed.valuesMap) storedValuesMap = parsed.valuesMap;
        }
      }
    } catch (e) {}

    let masterProducts: any[] = [];

    try {
      const tableName = `surtido_${machineId}`;
      const { data: supaRows, error: supaErr } = await supabase.from(tableName).select('*');

      if (!supaErr && supaRows && supaRows.length > 0) {
        masterProducts = supaRows.map((item: any, idx: number) => {
          const selVal = String(item.resorte !== undefined ? item.resorte : (item.sel !== undefined ? item.sel : idx + 1));
          const nameVal = String(item.surtir !== undefined ? item.surtir : (item.nombre_producto !== undefined ? item.nombre_producto : (item.nombre || `Producto ${idx + 1}`)));
          const priceVal = parseFloat(item.precio_venta !== undefined ? item.precio_venta : (item.precio || 0)) || 0;
          const capacityVal = parseInt(item.capacidad !== undefined ? item.capacidad : (item.caben !== undefined ? item.caben : (item.unidad_surtida || 12))) || 12;

          return {
            id: String(item.id || `prod_${machineId}_${idx}`),
            sel: selVal,
            nombre: nameVal,
            precio: priceVal,
            caben: capacityVal
          };
        });
      } else {
        const localSurtido = localStorage.getItem(`surtiantojo_surtido_rows_${machineId}`);
        if (localSurtido) {
          const parsedSurtido = JSON.parse(localSurtido);
          if (Array.isArray(parsedSurtido) && parsedSurtido.length > 0) {
            masterProducts = parsedSurtido.map((item: any, idx: number) => ({
              id: String(item.id || `prod_${machineId}_${idx}`),
              sel: String(item.resorte || item.sel || idx + 1),
              nombre: String(item.surtir || item.nombre_producto || item.nombre || `Producto ${idx + 1}`),
              precio: parseFloat(item.precio_venta || item.precio || 0) || 0,
              caben: parseInt(item.capacidad || item.caben || item.unidad_surtida || 12) || 12
            }));
          }
        }
      }
    } catch (e) {
      console.log('Error fetching product rows for machine:', e);
    }

    if (masterProducts.length === 0) {
      masterProducts = [
        { id: 'p11', sel: '11', nombre: 'Cheetos torcidito', precio: 21, caben: 12 },
        { id: 'p13', sel: '13', nombre: 'Churrumais', precio: 21, caben: 12 },
        { id: 'p15', sel: '15', nombre: 'Kiubo 1', precio: 10, caben: 12 },
        { id: 'p17', sel: '17', nombre: 'Churritos ench', precio: 15, caben: 12 },
        { id: 'p19', sel: '19', nombre: 'Mega totis', precio: 7, caben: 15 },
        { id: 'p21', sel: '21', nombre: 'Panque gota', precio: 27, caben: 10 },
        { id: 'p23', sel: '23', nombre: 'Veggies', precio: 18, caben: 12 },
        { id: 'p25', sel: '25', nombre: 'Rebanadas MIX', precio: 10, caben: 12 },
        { id: 'p27', sel: '27', nombre: 'Cheeto MIX', precio: 13, caben: 10 },
        { id: 'p28', sel: '28', nombre: 'Papatina', precio: 17, caben: 12 },
        { id: 'p29', sel: '29', nombre: 'Besos de Nuez', precio: 12, caben: 15 },
        { id: 'p30', sel: '30', nombre: 'ChipsAhoy', precio: 12, caben: 18 }
      ];
    }

    const mergedProducts = masterProducts.map(p => {
      const prodKey = `${p.sel}_${p.nombre}`;
      const existingValues = storedValuesMap[prodKey] || storedValuesMap[p.id] || {};
      const dateValues: Record<string, string> = {};
      
      storedDates.forEach(d => {
        dateValues[d] = existingValues[d] !== undefined ? existingValues[d] : '0';
      });

      return {
        ...p,
        values: dateValues
      };
    });

    setDates(storedDates);
    setTopMetrics(storedTopMetrics);
    setControls(storedControls);
    setProducts(mergedProducts);
    setOpPage(1);
    setIsLoading(false);
  };

  useEffect(() => {
    loadMachineData(activeMachineId);
  }, [activeMachineId]);

  // Handle saving Operadores date entries and bitacora
  const handleSave = async () => {
    try {
      const valuesMap: Record<string, Record<string, string>> = {};
      products.forEach(p => {
        const prodKey = `${p.sel}_${p.nombre}`;
        valuesMap[prodKey] = p.values;
        valuesMap[p.id] = p.values;
      });

      const sheetData = {
        machineId: activeMachineId,
        dates,
        topMetrics,
        controls,
        valuesMap
      };

      localStorage.setItem(`surtiantojo_operadores_sheet_${activeMachineId}`, JSON.stringify(sheetData));

      try {
        await supabase.from('operadores_data').upsert({
          machine_id: activeMachineId,
          dates: dates,
          top_metrics: topMetrics,
          controls: controls,
          values_map: valuesMap,
          updated_at: new Date().toISOString()
        });
      } catch (e) {}

      setSaveMessage(`¡Fechas y bitácora de ${activeMachine.name || activeMachineId} guardadas exitosamente!`);
      setTimeout(() => setSaveMessage(null), 3500);
    } catch (e) {
      setSaveMessage('Error al guardar datos');
      setTimeout(() => setSaveMessage(null), 3000);
    }
  };

  // Open strict date picker modal
  const handleOpenAddDateModal = () => {
    setDateError(null);
    setDatePickerValue(new Date().toISOString().split('T')[0]);
    setCustomDateLabel('');
    setIsDateModalOpen(true);
  };

  // Confirm date column addition with validation
  const handleConfirmAddDate = () => {
    let finalLabel = customDateLabel.trim();
    if (!finalLabel) {
      const validated = formatOrValidateDate(datePickerValue);
      if (validated) finalLabel = validated;
    } else {
      const validated = formatOrValidateDate(finalLabel);
      if (!validated) {
        setDateError('Formato de fecha no válido. Usa el selector o escribe una fecha válida (ej: 12-jul o 2026-08-12).');
        return;
      }
      finalLabel = validated;
    }

    if (!finalLabel) {
      setDateError('Por favor selecciona una fecha válida.');
      return;
    }

    if (dates.includes(finalLabel)) {
      setDateError(`La columna de fecha "${finalLabel}" ya existe.`);
      return;
    }

    const newDates = [...dates, finalLabel];
    setDates(newDates);

    setTopMetrics(prev => prev.map(m => ({ ...m, values: { ...m.values, [finalLabel]: '0' } })));
    setProducts(prev => prev.map(p => ({ ...p, values: { ...p.values, [finalLabel]: '0' } })));
    setControls(prev => prev.map(c => ({
      ...c,
      values: { ...c.values, [finalLabel]: c.label.startsWith('Limpieza') ? 'si' : 'no' }
    })));

    setIsDateModalOpen(false);
  };

  // Delete date column
  const handleDeleteDateColumn = (dateCol: string) => {
    if (!window.confirm(`¿Seguro que deseas eliminar la columna de fecha "${dateCol}"?`)) return;
    const newDates = dates.filter(d => d !== dateCol);
    setDates(newDates);

    setTopMetrics(prev => prev.map(m => {
      const v = { ...m.values };
      delete v[dateCol];
      return { ...m, values: v };
    }));

    setProducts(prev => prev.map(p => {
      const v = { ...p.values };
      delete v[dateCol];
      return { ...p, values: v };
    }));

    setControls(prev => prev.map(c => {
      const v = { ...c.values };
      delete v[dateCol];
      return { ...c, values: v };
    }));
  };

  // Update top metric for a date
  const handleUpdateTopMetric = (metricId: string, dateCol: string, val: string) => {
    setTopMetrics(prev => prev.map(m => {
      if (m.id !== metricId) return m;
      return { ...m, values: { ...m.values, [dateCol]: val } };
    }));
  };

  // Update product count for a date
  const handleUpdateProductCount = (prodId: string, dateCol: string, val: string) => {
    setProducts(prev => prev.map(p => {
      if (p.id !== prodId) return p;
      return { ...p, values: { ...p.values, [dateCol]: val } };
    }));
  };

  // Update bitacora control for a date
  const handleUpdateControl = (ctrlId: string, dateCol: string, val: string) => {
    setControls(prev => prev.map(c => {
      if (c.id !== ctrlId) return c;
      return { ...c, values: { ...c.values, [dateCol]: val } };
    }));
  };

  // Handle Enter key navigation across editable input cells
  const handleKeyDownEnter = (e: React.KeyboardEvent<HTMLInputElement | HTMLSelectElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const cells = Array.from(document.querySelectorAll<HTMLElement>('.editable-cell'));
      const currIndex = cells.indexOf(e.currentTarget);
      if (currIndex !== -1 && currIndex < cells.length - 1) {
        const nextCell = cells[currIndex + 1];
        nextCell.focus();
        if ('select' in nextCell && typeof (nextCell as any).select === 'function') {
          (nextCell as any).select();
        }
      }
    }
  };

  // Export CSV
  const handleExportCSV = () => {
    let csvContent = "";
    csvContent += `SEL,${activeMachine.name || activeMachineId},Precio,Caben,${dates.join(',')}\n`;

    topMetrics.forEach(m => {
      const vals = dates.map(d => m.values[d] || '0').join(',');
      csvContent += `${m.sel},${m.concept},,,${vals}\n`;
    });

    csvContent += `,INVENTARIO DE PRODUCTOS,,,,,,,,\n`;

    products.forEach(p => {
      const vals = dates.map(d => p.values[d] || '0').join(',');
      csvContent += `${p.sel},"${p.nombre}",$${p.precio},${p.caben},${vals}\n`;
    });

    controls.forEach(c => {
      const vals = dates.map(d => c.values[d] || '').join(',');
      csvContent += `,${c.label},${c.detail},,${vals}\n`;
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Operadores_${(activeMachine.name || activeMachineId).replace(/\s+/g, '_')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Top Header Banner */}
      <div className="bg-gradient-to-r from-[#043077] via-indigo-900 to-[#043077] rounded-2xl p-4 sm:p-6 text-white shadow-lg relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-8 -translate-y-8 w-48 h-48 bg-blue-400/10 rounded-full blur-2xl pointer-events-none" />
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 relative z-10">
          <div>
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold text-blue-200 mb-2 border border-white/10">
              <Sparkles className="w-3.5 h-3.5 text-amber-300" /> Módulo Operadores • Ruta y Lecturas
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight font-display text-white">
              Control de Operadores y Máquinas
            </h1>
            <p className="text-blue-100/80 text-xs sm:text-sm mt-1 max-w-2xl">
              Selecciona categoría y máquina para registrar lecturas de fecha y bitácora. Presiona <kbd className="px-1.5 py-0.5 bg-white/20 rounded font-mono text-xs">Enter</kbd> para avanzar entre celdas editables.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={fetchAdminMachines}
              className="px-3.5 py-2 bg-white/10 hover:bg-white/20 active:bg-white/30 text-white text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 shadow-xs cursor-pointer"
              title="Sincronizar catálogo de máquinas creadas por el Admin"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Sincronizar Máquinas
            </button>
            <button
              onClick={handleSave}
              className="px-4 py-2.5 bg-emerald-500 hover:bg-emerald-600 active:bg-emerald-700 text-white text-xs font-extrabold uppercase tracking-wider rounded-xl transition-all flex items-center gap-2 shadow-md cursor-pointer shrink-0"
            >
              <Save className="w-4 h-4 stroke-[2.5]" /> Guardar Fechas
            </button>
            <button
              onClick={handleExportCSV}
              className="px-4 py-2.5 bg-white/10 hover:bg-white/20 active:bg-white/30 text-white border border-white/20 text-xs font-extrabold uppercase tracking-wider rounded-xl transition-all flex items-center gap-2 shadow-sm cursor-pointer shrink-0"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-300 stroke-[2.5]" /> Exportar Excel
            </button>
          </div>
        </div>
      </div>

      {/* Save Notification Alert */}
      {saveMessage && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 font-bold text-xs rounded-xl flex items-center justify-between shadow-2xs">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>{saveMessage}</span>
          </div>
        </div>
      )}

      {/* Category Selection Cards ("ORGANIZACIÓN DE ACCESOS SURTIDO") */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-xs space-y-4">
        <div>
          <h3 className="text-xs font-black text-slate-500 uppercase tracking-wider mb-3">
            Organización de Accesos Surtido (Categorías):
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
            {/* Menu 0: Todas las Maquinas */}
            <button
              type="button"
              onClick={() => handleSelectCategory('all')}
              className={`p-3.5 rounded-2xl text-left transition-all border flex flex-col justify-between cursor-pointer group relative overflow-hidden ${
                activeCategory === 'all'
                  ? 'bg-blue-50/90 border-[#043077] shadow-xs ring-2 ring-[#043077]/20'
                  : 'bg-white hover:bg-slate-50 border-slate-200'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-xl ${
                  activeCategory === 'all' ? 'bg-[#043077] text-white' : 'bg-slate-100 text-slate-600'
                }`}>
                  <Layers className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-extrabold block uppercase tracking-wider">Catálogo Total</span>
                  <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider">Todas</h4>
                </div>
              </div>
              <div className="mt-4 flex items-center justify-between">
                <span className="text-[10px] text-slate-500 font-bold">
                  {machinesList.length} Máquinas
                </span>
                {activeCategory === 'all' && (
                  <span className="w-1.5 h-1.5 rounded-full bg-[#043077]" />
                )}
              </div>
            </button>

            {/* Menu 1: Botanas */}
            <button
              type="button"
              onClick={() => handleSelectCategory('botana')}
              className={`p-3.5 rounded-2xl text-left transition-all border flex flex-col justify-between cursor-pointer group relative overflow-hidden ${
                activeCategory === 'botana'
                  ? 'bg-blue-50/80 border-[#043077] shadow-xs ring-2 ring-[#043077]/20'
                  : 'bg-white hover:bg-slate-50 border-slate-200'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-xl ${
                  activeCategory === 'botana' ? 'bg-[#043077] text-white' : 'bg-slate-100 text-slate-600'
                }`}>
                  <Boxes className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-extrabold block uppercase tracking-wider">Menu 1</span>
                  <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider">Maq. Botana</h4>
                </div>
              </div>
              <div className="mt-4 flex items-center justify-between">
                <span className="text-[10px] text-slate-500 font-bold">
                  {machinesList.filter(s => getSubmenuGroup(s.id, s.name || s.title || '', s.grupo) === 'botana').length} Accesos
                </span>
                {activeCategory === 'botana' && (
                  <span className="w-1.5 h-1.5 rounded-full bg-[#043077]" />
                )}
              </div>
            </button>

            {/* Menu 2: Bebidas */}
            <button
              type="button"
              onClick={() => handleSelectCategory('bebidas')}
              className={`p-3.5 rounded-2xl text-left transition-all border flex flex-col justify-between cursor-pointer group relative overflow-hidden ${
                activeCategory === 'bebidas'
                  ? 'bg-blue-50/80 border-[#043077] shadow-xs ring-2 ring-[#043077]/20'
                  : 'bg-white hover:bg-slate-50 border-slate-200'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-xl ${
                  activeCategory === 'bebidas' ? 'bg-[#043077] text-white' : 'bg-slate-100 text-slate-600'
                }`}>
                  <CupSoda className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-extrabold block uppercase tracking-wider">Menu 2</span>
                  <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider">Maq. Bebidas</h4>
                </div>
              </div>
              <div className="mt-4 flex items-center justify-between">
                <span className="text-[10px] text-slate-500 font-bold">
                  {machinesList.filter(s => getSubmenuGroup(s.id, s.name || s.title || '', s.grupo) === 'bebidas').length} Accesos
                </span>
                {activeCategory === 'bebidas' && (
                  <span className="w-1.5 h-1.5 rounded-full bg-[#043077]" />
                )}
              </div>
            </button>

            {/* Menu 3: Cafe */}
            <button
              type="button"
              onClick={() => handleSelectCategory('cafe')}
              className={`p-3.5 rounded-2xl text-left transition-all border flex flex-col justify-between cursor-pointer group relative overflow-hidden ${
                activeCategory === 'cafe'
                  ? 'bg-amber-50/80 border-amber-600 shadow-xs ring-2 ring-amber-500/20'
                  : 'bg-white hover:bg-slate-50 border-slate-200'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-xl ${
                  activeCategory === 'cafe' ? 'bg-amber-600 text-white' : 'bg-slate-100 text-slate-600'
                }`}>
                  <Coffee className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-extrabold block uppercase tracking-wider">Menu 3</span>
                  <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider">Maq. de Café</h4>
                </div>
              </div>
              <div className="mt-4 flex items-center justify-between">
                <span className="text-[10px] text-slate-500 font-bold">
                  {machinesList.filter(s => getSubmenuGroup(s.id, s.name || s.title || '', s.grupo) === 'cafe').length} Accesos
                </span>
                {activeCategory === 'cafe' && (
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-600" />
                )}
              </div>
            </button>

            {/* Card 4: Info for Admin machine synchronization */}
            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-left flex flex-col justify-between opacity-85">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-slate-200 text-slate-600">
                  <Lock className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 font-extrabold block uppercase tracking-wider">Sincronizado</span>
                  <h4 className="text-xs font-black text-slate-700 uppercase tracking-wider">Catálogo Admin</h4>
                </div>
              </div>
              <div className="mt-4 text-[10px] text-slate-500 font-bold">
                100% Sincronizado con Surtido
              </div>
            </div>
          </div>
        </div>

        {/* Submenus / Machines list under the selected category */}
        <div className="bg-slate-50/70 border border-slate-200 p-4 rounded-2xl space-y-2">
          <span className="text-[11px] font-black uppercase tracking-wider text-slate-600 block">
            Selecciona el submenú para {
              activeCategory === 'all' ? 'Todas las Máquinas Registradas' :
              activeCategory === 'botana' ? 'Máquinas de Botana' :
              activeCategory === 'bebidas' ? 'Máquinas de Bebidas' : 'Máquinas de Café'
            }:
          </span>

          <div className="flex flex-wrap items-center gap-2 pt-1">
            {categoryMachines.length === 0 ? (
              <span className="text-xs text-slate-400 italic">No hay máquinas registradas en esta categoría.</span>
            ) : (
              categoryMachines.map((submenu) => {
                const isActive = activeMachineId === submenu.id;
                return (
                  <button
                    key={submenu.id}
                    onClick={() => setActiveMachineId(submenu.id)}
                    className={`px-4 py-2.5 text-xs font-black uppercase tracking-wider rounded-xl transition-all cursor-pointer flex items-center gap-2 ${
                      isActive
                        ? 'bg-[#043077] text-white shadow-md ring-2 ring-[#043077]/20 scale-102'
                        : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200'
                    }`}
                  >
                    <Box className="w-3.5 h-3.5" />
                    <span>{submenu.name || submenu.title || submenu.id}</span>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Quick Toolbar Actions & Date Column Creation */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleOpenAddDateModal}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
            >
              <Plus className="w-4 h-4 stroke-[3]" /> Nueva Fecha (+)
            </button>

            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 border border-amber-200 text-amber-900 rounded-xl text-xs font-bold">
              <Lock className="w-3.5 h-3.5 text-amber-600 shrink-0" />
              <span>SEL, Producto, Precio y Caben están sincronizados de solo lectura</span>
            </div>
          </div>

          <div className="text-[11px] font-bold text-slate-600 bg-slate-100 px-3 py-1.5 rounded-xl border border-slate-200">
            Máquina Activa: <strong className="text-slate-900 font-extrabold">{activeMachine.name || activeMachine.title || activeMachineId}</strong> • Total Productos: <strong className="text-[#043077] font-black">{products.length}</strong>
          </div>
        </div>

        {/* Main Products Table */}
        <div className="overflow-x-auto rounded-xl border border-slate-200 shadow-2xs bg-white">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              {/* Row 0: Table Header */}
              <tr className="bg-[#043077] text-white">
                <th className="py-3 px-3 text-center font-black tracking-wider w-12 border-r border-blue-800 uppercase">
                  SEL
                </th>
                <th className="py-3 px-4 font-black tracking-wider border-r border-blue-800 min-w-[220px] uppercase">
                  Nombre del Producto ({activeMachine.name || activeMachine.title || activeMachineId})
                </th>
                <th className="py-3 px-3 text-center font-black tracking-wider w-20 border-r border-blue-800 uppercase">
                  Precio
                </th>
                <th className="py-3 px-3 text-center font-black tracking-wider w-20 border-r border-blue-800 uppercase">
                  Caben
                </th>
                {dates.map((dateCol: string) => (
                  <th key={dateCol} className="py-2.5 px-3 text-center font-black tracking-wider min-w-[105px] border-r border-blue-800 bg-blue-900/60 relative group">
                    <div className="flex items-center justify-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-blue-300" />
                      <span className="font-mono text-xs">{dateCol}</span>
                      <button
                        onClick={() => handleDeleteDateColumn(dateCol)}
                        className="opacity-0 group-hover:opacity-100 text-rose-300 hover:text-rose-100 p-0.5 rounded transition-all cursor-pointer ml-1"
                        title="Eliminar columna de fecha"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-200 text-slate-800 font-medium">
              {/* Top Metrics Section (Unid. Vtas, $ ventas) */}
              {topMetrics.map((metric: any) => (
                <tr key={metric.id} className="bg-slate-100/90 hover:bg-slate-200/50 font-bold border-b border-slate-300">
                  <td className="py-2 px-3 text-center font-mono font-black text-slate-700 border-r border-slate-300">
                    {metric.sel}
                  </td>
                  <td className="py-2 px-4 font-black text-slate-900 border-r border-slate-300">
                    {metric.concept}
                  </td>
                  <td className="py-2 px-3 text-center border-r border-slate-300 text-slate-400">
                    —
                  </td>
                  <td className="py-2 px-3 text-center border-r border-slate-300 text-slate-400">
                    —
                  </td>
                  {dates.map((dateCol: string) => (
                    <td key={dateCol} className="py-1 px-2 text-center border-r border-slate-300 bg-indigo-50/40">
                      <input
                        type="text"
                        value={metric.values[dateCol] || ''}
                        onChange={(e) => handleUpdateTopMetric(metric.id, dateCol, e.target.value)}
                        onKeyDown={handleKeyDownEnter}
                        className="editable-cell w-full text-center font-mono font-bold text-xs bg-white border border-slate-300 focus:border-[#043077] focus:ring-2 focus:ring-[#043077]/30 rounded px-1.5 py-1 text-indigo-950 focus:outline-none"
                      />
                    </td>
                  ))}
                </tr>
              ))}

              {/* Section Divider: INVENTARIO DE PRODUCTOS */}
              <tr className="bg-slate-200/90 text-slate-900 font-extrabold uppercase text-[11px] tracking-wider">
                <td className="py-2 px-3 text-center border-r border-slate-300 font-mono text-slate-500">
                  #
                </td>
                <td className="py-2 px-4 border-r border-slate-300 text-[#043077] font-black flex items-center gap-2">
                  <Layers className="w-3.5 h-3.5" /> INVENTARIO DE PRODUCTOS
                </td>
                <td className="py-2 px-3 text-center border-r border-slate-300">
                  PRECIO
                </td>
                <td className="py-2 px-3 text-center border-r border-slate-300">
                  CABEN
                </td>
                {dates.map((d: string) => (
                  <td key={d} className="py-2 px-3 text-center border-r border-slate-300 font-mono text-slate-600">
                    {d}
                  </td>
                ))}
              </tr>

              {/* Products Rows - Read-Only for SEL, Nombre, Precio, Caben. Editable for Date columns */}
              {isLoading ? (
                <tr>
                  <td colSpan={4 + dates.length} className="py-8 text-center text-slate-500 font-bold bg-slate-50">
                    Cargando catálogo de productos...
                  </td>
                </tr>
              ) : products.length === 0 ? (
                <tr>
                  <td colSpan={4 + dates.length} className="py-8 text-center text-slate-500 font-bold bg-slate-50">
                    No hay productos registrados en esta máquina.
                  </td>
                </tr>
              ) : (
                paginatedProducts.map((p: any) => (
                  <tr key={p.id} className="hover:bg-blue-50/40 transition-colors">
                    {/* Read-only SEL */}
                    <td className="py-2 px-3 text-center font-mono font-black text-indigo-950 border-r border-slate-200 bg-slate-100/60">
                      {p.sel}
                    </td>

                    {/* Read-only Nombre del producto */}
                    <td className="py-2 px-4 font-extrabold text-slate-900 border-r border-slate-200">
                      {p.nombre}
                    </td>

                    {/* Read-only Precio */}
                    <td className="py-2 px-2 text-center border-r border-slate-200 font-mono font-bold text-slate-800 bg-slate-50/50">
                      ${p.precio}
                    </td>

                    {/* Read-only Caben */}
                    <td className="py-2 px-2 text-center border-r border-slate-200 font-mono font-extrabold text-slate-800 bg-slate-50/50">
                      {p.caben}
                    </td>

                    {/* Editable Date Columns (Press Enter to advance) */}
                    {dates.map((dateCol: string) => (
                      <td key={dateCol} className="py-1 px-2 text-center border-r border-slate-200">
                        <input
                          type="text"
                          value={p.values[dateCol] || '0'}
                          onChange={(e) => handleUpdateProductCount(p.id, dateCol, e.target.value)}
                          onKeyDown={handleKeyDownEnter}
                          className="editable-cell w-full text-center font-mono font-bold text-xs bg-slate-50/80 hover:bg-white focus:bg-white border border-slate-200 focus:border-[#043077] focus:ring-2 focus:ring-[#043077]/30 rounded px-1.5 py-1 text-slate-900 focus:outline-none"
                        />
                      </td>
                    ))}
                  </tr>
                ))
              )}

              {/* Bitacora Checklist Section Header */}
              <tr className="bg-slate-800 text-white font-extrabold uppercase text-[11px] tracking-wider">
                <td colSpan={4} className="py-2.5 px-4 font-black">
                  CONTROLES, BITÁCORA Y ARQUEO DE CAJA Y LIMPIEZA
                </td>
                {dates.map((d: string) => (
                  <td key={d} className="py-2.5 px-3 text-center font-mono text-slate-200">
                    {d}
                  </td>
                ))}
              </tr>

              {/* Bitacora Controls Rows */}
              {controls.map((ctrl: any) => (
                <tr key={ctrl.id} className="hover:bg-slate-100/80 bg-slate-50/40">
                  <td className="py-2 px-3 text-center font-mono font-bold text-slate-400 border-r border-slate-200">
                    •
                  </td>
                  <td className="py-2 px-4 font-black text-slate-800 border-r border-slate-200">
                    {ctrl.label}
                  </td>
                  <td colSpan={2} className="py-2 px-3 text-center font-bold text-slate-500 border-r border-slate-200 text-[11px]">
                    {ctrl.detail}
                  </td>
                  {dates.map((dateCol: string) => {
                    const currentVal = ctrl.values[dateCol] || '';
                    const isYesNo = ['Limpieza interna', 'Limpieza externa', 'Falla de equipo', 'Monedero', 'Billetero', 'Base de resorte', 'Otro'].includes(ctrl.label);

                    return (
                      <td key={dateCol} className="py-1.5 px-2 text-center border-r border-slate-200">
                        {isYesNo ? (
                          <select
                            value={currentVal.toLowerCase()}
                            onChange={(e) => handleUpdateControl(ctrl.id, dateCol, e.target.value)}
                            onKeyDown={handleKeyDownEnter}
                            className={`editable-cell w-full text-center font-mono font-black text-xs border rounded px-1 py-1 focus:outline-none cursor-pointer ${
                              currentVal.toLowerCase() === 'si'
                                ? 'bg-emerald-100 border-emerald-300 text-emerald-900'
                                : currentVal.toLowerCase() === 'no'
                                ? 'bg-rose-50 border-rose-200 text-rose-800'
                                : 'bg-white border-slate-300 text-slate-800'
                            }`}
                          >
                            <option value="no">no</option>
                            <option value="si">si</option>
                            <option value="X">X</option>
                          </select>
                        ) : (
                          <input
                            type="text"
                            value={currentVal}
                            onChange={(e) => handleUpdateControl(ctrl.id, dateCol, e.target.value)}
                            onKeyDown={handleKeyDownEnter}
                            className="editable-cell w-full text-center font-mono font-bold text-xs bg-white border border-slate-200 focus:border-[#043077] focus:ring-2 focus:ring-[#043077]/30 rounded px-1.5 py-1 text-slate-900 focus:outline-none"
                          />
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Products Pagination footer */}
        {totalOpPages > 1 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-3 p-4 bg-white border border-slate-200/80 rounded-2xl shadow-xs">
            <div className="text-xs font-black text-slate-500 uppercase tracking-wide">
              Mostrando <span className="text-[#043077] font-mono">{(opPage - 1) * OP_PAGE_SIZE + 1}</span> a <span className="text-[#043077] font-mono">{Math.min(opPage * OP_PAGE_SIZE, products.length)}</span> de <span className="text-slate-700 font-mono">{products.length}</span> productos
            </div>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setOpPage(prev => Math.max(prev - 1, 1))}
                disabled={opPage === 1}
                className="px-3 py-1.5 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:hover:bg-white text-slate-700 text-xs font-black border border-slate-200 rounded-xl cursor-pointer transition-all focus:outline-none flex items-center gap-1"
              >
                ◀️ Anterior
              </button>
              {Array.from({ length: totalOpPages }, (_, i) => i + 1).map(page => {
                const isSelected = page === opPage;
                const shouldShow = totalOpPages <= 6 || Math.abs(page - opPage) <= 1 || page === 1 || page === totalOpPages;
                
                if (!shouldShow) {
                  if (page === 2 || page === totalOpPages - 1) {
                    return <span key={`op-dots-${page}`} className="text-slate-400 text-xs px-1 select-none">...</span>;
                  }
                  return null;
                }

                return (
                  <button
                    key={page}
                    type="button"
                    onClick={() => setOpPage(page)}
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
                onClick={() => setOpPage(prev => Math.min(prev + 1, totalOpPages))}
                disabled={opPage === totalOpPages}
                className="px-3 py-1.5 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:hover:bg-white text-slate-700 text-xs font-black border border-slate-200 rounded-xl cursor-pointer transition-all focus:outline-none flex items-center gap-1"
              >
                Siguiente ▶️
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Date Picker Modal for Adding Validated Date Columns */}
      {isDateModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4 relative">
            <button
              onClick={() => setIsDateModalOpen(false)}
              className="absolute right-4 top-4 text-slate-400 hover:text-slate-600 p-1 rounded-lg transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3">
              <div className="p-3 bg-blue-100 text-[#043077] rounded-xl">
                <Calendar className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900">Agregar Columna de Fecha</h3>
                <p className="text-xs text-slate-500">Selecciona o ingresa una fecha válida</p>
              </div>
            </div>

            {dateError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs font-bold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{dateError}</span>
              </div>
            )}

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-1">
                  1. Calendario (Formato Fecha Estricto):
                </label>
                <input
                  type="date"
                  value={datePickerValue}
                  onChange={(e) => {
                    setDatePickerValue(e.target.value);
                    setCustomDateLabel('');
                    setDateError(null);
                  }}
                  className="w-full bg-slate-50 border border-slate-300 focus:border-[#043077] focus:ring-2 focus:ring-[#043077]/20 rounded-xl px-3 py-2 text-sm text-slate-900 font-mono focus:outline-none"
                />
              </div>

              <div className="relative flex py-1 items-center">
                <div className="flex-grow border-t border-slate-200"></div>
                <span className="flex-shrink mx-3 text-[10px] font-black uppercase tracking-wider text-slate-400">O Texto de Fecha (dd-mmm)</span>
                <div className="flex-grow border-t border-slate-200"></div>
              </div>

              <div>
                <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-1">
                  2. Etiqueta Personalizada (Ej: 12-jul, 15-ago):
                </label>
                <input
                  type="text"
                  placeholder="Ej: 12-jul o 2026-08-12"
                  value={customDateLabel}
                  onChange={(e) => {
                    setCustomDateLabel(e.target.value);
                    setDateError(null);
                  }}
                  className="w-full bg-slate-50 border border-slate-300 focus:border-[#043077] focus:ring-2 focus:ring-[#043077]/20 rounded-xl px-3 py-2 text-xs text-slate-900 font-mono focus:outline-none"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsDateModalOpen(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmAddDate}
                className="px-5 py-2 bg-[#043077] hover:bg-blue-900 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow-md cursor-pointer flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4 stroke-[3]" /> Agregar Fecha
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
