import React, { useState, useEffect, useMemo } from 'react';
import { 
  Plus, 
  Trash2, 
  Save, 
  FileSpreadsheet, 
  Search, 
  Calendar, 
  Box, 
  CheckCircle2, 
  RefreshCw,
  Layers,
  Sparkles,
  Lock
} from 'lucide-react';
import { supabase } from '../lib/supabase';

interface OperadoresModuleProps {
  currentUser?: any;
  isSurtidorOnly?: boolean;
}

// Default machines fallback if Supabase table is loading
const DEFAULT_SUBMENUS = [
  { id: 'art_alt', name: 'ART ALT', title: 'Reporte ART ALT' },
  { id: 'art_pk', name: 'ART PK', title: 'Reporte ART PK' },
  { id: 'art_prk', name: 'ART PRK', title: 'Reporte ART PRK' },
  { id: 'cer1', name: 'CER 1', title: 'Reporte CER 1' },
  { id: 'cer2', name: 'CER 2', title: 'Reporte CER 2' },
  { id: 'cer3', name: 'CER 3', title: 'Reporte CER 3' },
  { id: 'cg1', name: 'CG 1', title: 'Reporte CG 1' },
  { id: 'cg2', name: 'CG 2', title: 'Reporte CG 2' },
  { id: 'cg3', name: 'CG 3', title: 'Reporte CG 3' },
  { id: 'frial', name: 'FRIAL', title: 'Reporte FRIAL' },
  { id: 'lmno', name: 'LMNO', title: 'Reporte LMNO' }
];

// Initial default controls/bitacora checklist
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

export default function OperadoresModule({ currentUser, isSurtidorOnly = false }: OperadoresModuleProps) {
  // 1. Machines list registered by Admin (synced from surtido_submenus)
  const [machinesList, setMachinesList] = useState<any[]>(() => {
    try {
      const stored = localStorage.getItem('surtiantojo_submenu_list');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {}
    return DEFAULT_SUBMENUS;
  });

  const [activeMachineId, setActiveMachineId] = useState<string>('art_alt');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Active dates for the selected machine
  const [dates, setDates] = useState<string[]>(['01-jul', '06-jul', '08-jul', '10-jul']);

  // Top metrics (Unid. Vtas, $ ventas)
  const [topMetrics, setTopMetrics] = useState<any[]>([
    { id: '1', sel: '1', concept: 'Unid. Vtas', values: { '01-jul': '68499', '06-jul': '68673', '08-jul': '68898', '10-jul': '69095' } },
    { id: '2', sel: '2', concept: '$ ventas', values: { '01-jul': '934456', '06-jul': '937157', '08-jul': '940765', '10-jul': '943762' } }
  ]);

  // Synchronized product rows (SEL, Nombre, Precio, Caben - read-only from Admin, plus date counts)
  const [products, setProducts] = useState<any[]>([]);

  // Controls / Bitacora checklist
  const [controls, setControls] = useState<any[]>(DEFAULT_CONTROLS);

  // Get active machine object
  const activeMachine = useMemo(() => {
    return machinesList.find(m => m.id === activeMachineId) || machinesList[0] || DEFAULT_SUBMENUS[0];
  }, [machinesList, activeMachineId]);

  // 1. Load machines registered by Admin from Supabase surtido_submenus
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
          grupo: m.grupo || ''
        }));
        setMachinesList(loaded);
        localStorage.setItem('surtiantojo_submenu_list', JSON.stringify(loaded));
      }
    } catch (e) {
      console.log('Error fetching admin submenus:', e);
    }
  };

  useEffect(() => {
    fetchAdminMachines();
  }, []);

  // 2. Load machine product catalog (synced from Admin's surtido_${machineId}) and date entries
  const loadMachineData = async (machineId: string) => {
    setIsLoading(true);

    // First load date entries and bitacora stored for this machine locally or in Supabase
    let storedDates = ['01-jul', '06-jul', '08-jul', '10-jul'];
    let storedTopMetrics = [
      { id: '1', sel: '1', concept: 'Unid. Vtas', values: { '01-jul': '68499', '06-jul': '68673', '08-jul': '68898', '10-jul': '69095' } },
      { id: '2', sel: '2', concept: '$ ventas', values: { '01-jul': '934456', '06-jul': '937157', '08-jul': '940765', '10-jul': '943762' } }
    ];
    let storedControls = JSON.parse(JSON.stringify(DEFAULT_CONTROLS));
    let storedValuesMap: Record<string, Record<string, string>> = {};

    try {
      const localSheet = localStorage.getItem(`surtiantojo_operadores_sheet_${machineId}`);
      if (localSheet) {
        const parsed = JSON.parse(localSheet);
        if (parsed.dates) storedDates = parsed.dates;
        if (parsed.topMetrics) storedTopMetrics = parsed.topMetrics;
        if (parsed.controls) storedControls = parsed.controls;
        if (parsed.valuesMap) storedValuesMap = parsed.valuesMap;
      }
    } catch (e) {}

    // Load master product catalog created/registered by Admin in Surtido for this machine
    let masterProducts: any[] = [];

    try {
      // Query Supabase table surtido_${machineId}
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
        // Fallback to localStorage surtiantojo_surtido_rows_${machineId}
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

    // If no master products exist yet, supply default catalog rows
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

    // Attach date values to each master product row
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
    setIsLoading(false);
  };

  useEffect(() => {
    loadMachineData(activeMachineId);
  }, [activeMachineId]);

  // Handle saving Operadores date entries and bitacora for current active machine
  const handleSave = async () => {
    try {
      // Build values map per product to persist date entries across reloads
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

      // Save locally
      localStorage.setItem(`surtiantojo_operadores_sheet_${activeMachineId}`, JSON.stringify(sheetData));

      // Try saving to Supabase table operadores_data
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

  // Add new date column
  const handleAddDateColumn = () => {
    const todayStr = new Date().toLocaleDateString('es-MX', { day: '2-digit', month: 'short' }).replace('.', '').replace(' ', '-');
    const promptDate = window.prompt("Ingrese la etiqueta para la nueva columna de Fecha (ej: 12-jul):", todayStr);
    if (!promptDate || !promptDate.trim()) return;
    const cleanDate = promptDate.trim();

    if (dates.includes(cleanDate)) {
      alert("Esa columna de fecha ya existe.");
      return;
    }

    const newDates = [...dates, cleanDate];
    setDates(newDates);

    // Add empty '0' values for top metrics, products, and default controls
    setTopMetrics(prev => prev.map(m => ({ ...m, values: { ...m.values, [cleanDate]: '0' } })));
    setProducts(prev => prev.map(p => ({ ...p, values: { ...p.values, [cleanDate]: '0' } })));
    setControls(prev => prev.map(c => ({
      ...c,
      values: { ...c.values, [cleanDate]: c.label.startsWith('Limpieza') ? 'si' : 'no' }
    })));
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

  // Export CSV matching exact Excel format
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

  // Filter products by search term
  const filteredProducts = useMemo(() => {
    if (!searchTerm.trim()) return products;
    const q = searchTerm.toLowerCase();
    return products.filter(p => 
      String(p.sel).toLowerCase().includes(q) || 
      String(p.nombre).toLowerCase().includes(q)
    );
  }, [products, searchTerm]);

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
              Máquinas sincronizadas con el Administrador. SEL, Producto, Precio y Caben son de solo lectura. El operador actualiza las lecturas por fecha y bitácora.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={fetchAdminMachines}
              className="px-3.5 py-2 bg-white/10 hover:bg-white/20 active:bg-white/30 text-white text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 shadow-xs cursor-pointer"
              title="Sincronizar máquinas del Administrador"
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

      {/* Machine Tabs Navigation (Synced with Admin's registered machines) */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
            <span className="text-xs font-black text-slate-400 uppercase tracking-wider shrink-0 mr-1">Máquinas Registradas:</span>
            {machinesList.map(m => (
              <button
                key={m.id}
                onClick={() => setActiveMachineId(m.id)}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-2 ${
                  activeMachineId === m.id
                    ? 'bg-[#043077] text-white shadow-md font-black'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                }`}
              >
                <Box className="w-3.5 h-3.5" />
                {m.name || m.title || m.id}
              </button>
            ))}
          </div>

          {/* Search filter */}
          <div className="relative min-w-[220px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar SEL o Producto..."
              className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#043077] focus:bg-white transition-all font-medium"
            />
          </div>
        </div>

        {/* Quick Toolbar Actions */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleAddDateColumn}
              className="px-3.5 py-1.5 bg-blue-50 hover:bg-blue-100 text-[#043077] border border-blue-200 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer shadow-3xs"
            >
              <Plus className="w-4 h-4 stroke-[3]" /> Fecha (+)
            </button>

            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-50 border border-amber-200 text-amber-800 rounded-xl text-xs font-bold">
              <Lock className="w-3.5 h-3.5 text-amber-600" />
              <span>SEL, Producto, Precio y Caben están sincronizados y protegidos por el Admin</span>
            </div>
          </div>

          <div className="text-[11px] font-bold text-slate-500 bg-slate-100 px-3 py-1 rounded-lg">
            Máquina Seleccionada: <strong className="text-slate-900 font-extrabold">{activeMachine.name || activeMachine.title || activeMachineId}</strong> • Total Productos: <strong className="text-[#043077]">{products.length}</strong>
          </div>
        </div>

        {/* Table Container with Horizontal Scroll */}
        <div className="overflow-x-auto rounded-xl border border-slate-200 shadow-2xs bg-white">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              {/* Row 0: Header Titles */}
              <tr className="bg-[#043077] text-white">
                <th className="py-3 px-3 text-center font-black tracking-wider w-12 border-r border-blue-800 uppercase">
                  SEL
                </th>
                <th className="py-3 px-4 font-black tracking-wider border-r border-blue-800 min-w-[200px] uppercase">
                  {activeMachine.name || activeMachine.title || activeMachineId}
                </th>
                <th className="py-3 px-3 text-center font-black tracking-wider w-20 border-r border-blue-800 uppercase">
                  Precio
                </th>
                <th className="py-3 px-3 text-center font-black tracking-wider w-20 border-r border-blue-800 uppercase">
                  Caben
                </th>
                {dates.map((dateCol: string) => (
                  <th key={dateCol} className="py-2.5 px-3 text-center font-black tracking-wider min-w-[100px] border-r border-blue-800 bg-blue-900/60 relative group">
                    <div className="flex items-center justify-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-blue-300" />
                      <span className="font-mono text-xs">{dateCol}</span>
                      <button
                        onClick={() => handleDeleteDateColumn(dateCol)}
                        className="opacity-0 group-hover:opacity-100 text-rose-300 hover:text-rose-100 p-0.5 rounded transition-all cursor-pointer ml-1"
                        title="Eliminar esta columna de fecha"
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
                <tr key={metric.id} className="bg-slate-100/80 hover:bg-slate-200/50 font-bold border-b border-slate-300">
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
                        className="w-full text-center font-mono font-bold text-xs bg-white border border-slate-300 focus:border-[#043077] focus:ring-1 focus:ring-[#043077] rounded px-1.5 py-1 text-indigo-950 focus:outline-none"
                      />
                    </td>
                  ))}
                </tr>
              ))}

              {/* Section Divider: INVENTARIO */}
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

              {/* Products Table Rows - SEL, Nombre, Precio, Caben are strictly READ-ONLY */}
              {isLoading ? (
                <tr>
                  <td colSpan={4 + dates.length} className="py-8 text-center text-slate-500 font-bold bg-slate-50">
                    Cargando datos de la máquina...
                  </td>
                </tr>
              ) : filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={4 + dates.length} className="py-8 text-center text-slate-500 font-bold bg-slate-50">
                    No hay productos registrados en esta máquina.
                  </td>
                </tr>
              ) : (
                filteredProducts.map((p: any) => (
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

                    {/* Editable Date Columns for Operador / Surtidor */}
                    {dates.map((dateCol: string) => (
                      <td key={dateCol} className="py-1 px-2 text-center border-r border-slate-200">
                        <input
                          type="text"
                          value={p.values[dateCol] || '0'}
                          onChange={(e) => handleUpdateProductCount(p.id, dateCol, e.target.value)}
                          className="w-full text-center font-mono font-bold text-xs bg-slate-50/80 hover:bg-white focus:bg-white border border-slate-200 focus:border-[#043077] rounded px-1.5 py-1 text-slate-900 focus:outline-none"
                        />
                      </td>
                    ))}
                  </tr>
                ))
              )}

              {/* Footer Controls & Bitacora Checklist Section */}
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
                            className={`w-full text-center font-mono font-black text-xs border rounded px-1 py-1 focus:outline-none cursor-pointer ${
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
                            className="w-full text-center font-mono font-bold text-xs bg-white border border-slate-200 focus:border-[#043077] rounded px-1.5 py-1 text-slate-900 focus:outline-none"
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
      </div>
    </div>
  );
}
