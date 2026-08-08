import React, { useState, useEffect, useMemo } from 'react';
import { 
  Plus, 
  Trash2, 
  Save, 
  FileSpreadsheet, 
  Search, 
  Calendar, 
  DollarSign, 
  Box, 
  CheckCircle2, 
  AlertCircle, 
  RefreshCw,
  Sliders,
  ChevronDown,
  Layers,
  Sparkles
} from 'lucide-react';

interface OperadoresModuleProps {
  currentUser?: any;
  isSurtidorOnly?: boolean;
}

// Initial pre-loaded Excel Data for Arteche ALT
const DEFAULT_OPERADORES_SHEETS = [
  {
    id: 'arteche_alt',
    name: 'Arteche ALT',
    dates: ['01-jul', '06-jul', '08-jul', '10-jul'],
    topMetrics: [
      { id: '1', sel: '1', concept: 'Unid. Vtas', values: { '01-jul': '68499', '06-jul': '68673', '08-jul': '68898', '10-jul': '69095' } },
      { id: '2', sel: '2', concept: '$ ventas', values: { '01-jul': '934456', '06-jul': '937157', '08-jul': '940765', '10-jul': '943762' } }
    ],
    products: [
      { id: 'p11', sel: '11', nombre: 'Cheetos torcidito', precio: 21, caben: 12, values: { '01-jul': '1522', '06-jul': '1527', '08-jul': '1335', '10-jul': '1541' } },
      { id: 'p13', sel: '13', nombre: 'Churrumais', precio: 21, caben: 12, values: { '01-jul': '1524', '06-jul': '1527', '08-jul': '1536', '10-jul': '1546' } },
      { id: 'p15', sel: '15', nombre: 'Kiubo 1', precio: 10, caben: 12, values: { '01-jul': '1607', '06-jul': '1607', '08-jul': '1613', '10-jul': '1615' } },
      { id: 'p17', sel: '17', nombre: 'Churritos ench', precio: 15, caben: 12, values: { '01-jul': '2208', '06-jul': '2212', '08-jul': '2224', '10-jul': '2234' } },
      { id: 'p19', sel: '19', nombre: 'Mega totis', precio: 7, caben: 15, values: { '01-jul': '1409', '06-jul': '1411', '08-jul': '1413', '10-jul': '1422' } },
      { id: 'p21', sel: '21', nombre: 'Panque gota', precio: 27, caben: 10, values: { '01-jul': '1284', '06-jul': '1288', '08-jul': '1292', '10-jul': '1293' } },
      { id: 'p23', sel: '23', nombre: 'Veggies', precio: 18, caben: 12, values: { '01-jul': '1441', '06-jul': '1442', '08-jul': '1442', '10-jul': '1442' } },
      { id: 'p25', sel: '25', nombre: 'Rebanadas MIX', precio: 10, caben: 12, values: { '01-jul': '2360', '06-jul': '2365', '08-jul': '2370', '10-jul': '2376' } },
      { id: 'p27', sel: '27', nombre: 'Cheeto MIX', precio: 13, caben: 10, values: { '01-jul': '1129', '06-jul': '1133', '08-jul': '1140', '10-jul': '1150' } },
      { id: 'p28', sel: '28', nombre: 'Papatina', precio: 17, caben: 12, values: { '01-jul': '904', '06-jul': '910', '08-jul': '914', '10-jul': '920' } },
      { id: 'p29', sel: '29', nombre: 'Besos de Nuez', precio: 12, caben: 15, values: { '01-jul': '1119', '06-jul': '1128', '08-jul': '1138', '10-jul': '1152' } },
      { id: 'p30', sel: '30', nombre: 'ChipsAhoy', precio: 12, caben: 18, values: { '01-jul': '2516', '06-jul': '2522', '08-jul': '2533', '10-jul': '2543' } },
      { id: 'p31', sel: '31', nombre: 'Barritas Pi/Fr', precio: 10, caben: 18, values: { '01-jul': '2412', '06-jul': '2414', '08-jul': '2416', '10-jul': '2418' } },
      { id: 'p32', sel: '32', nombre: 'Tiritas con Cacah', precio: 15, caben: 15, values: { '01-jul': '982', '06-jul': '984', '08-jul': '987', '10-jul': '990' } },
      { id: 'p33', sel: '33', nombre: 'Botamix', precio: 19, caben: 24, values: { '01-jul': '1886', '06-jul': '1890', '08-jul': '1896', '10-jul': '1903' } },
      { id: 'p34', sel: '34', nombre: 'Cacahuates', precio: 12, caben: 18, values: { '01-jul': '3335', '06-jul': '3342', '08-jul': '3359', '10-jul': '3376' } },
      { id: 'p35', sel: '35', nombre: 'Barra Naranja Proteina', precio: 12, caben: 18, values: { '01-jul': '2474', '06-jul': '2481', '08-jul': '2485', '10-jul': '2494' } },
      { id: 'p36', sel: '36', nombre: 'Canelitas/Polvor', precio: 14, caben: 18, values: { '01-jul': '2446', '06-jul': '2453', '08-jul': '2459', '10-jul': '2463' } },
      { id: 'p37', sel: '37', nombre: 'Cremax', precio: 12, caben: 18, values: { '01-jul': '2299', '06-jul': '2307', '08-jul': '2317', '10-jul': '2325' } },
      { id: 'p38', sel: '38', nombre: 'Chispi Chocs Gaveti', precio: 13, caben: 12, values: { '01-jul': '2321', '06-jul': '910', '08-jul': '2328', '10-jul': '2330' } },
      { id: 'p39', sel: '39', nombre: 'MacMa Galletas', precio: 14, caben: 15, values: { '01-jul': '2029', '06-jul': '2029', '08-jul': '2031', '10-jul': '2031' } },
      { id: 'p40', sel: '40', nombre: 'Deliciosa', precio: 17, caben: 6, values: { '01-jul': '1655', '06-jul': '1661', '08-jul': '1667', '10-jul': '1673' } },
      { id: 'p41', sel: '41', nombre: 'Deliciosa', precio: 17, caben: 6, values: { '01-jul': '1583', '06-jul': '1589', '08-jul': '1595', '10-jul': '1595' } },
      { id: 'p42', sel: '42', nombre: 'Peñafiel Piña/Limon', precio: 24, caben: 6, values: { '01-jul': '1474', '06-jul': '1479', '08-jul': '1485', '10-jul': '1488' } },
      { id: 'p43', sel: '43', nombre: 'Peñafiel Naranjada', precio: 24, caben: 6, values: { '01-jul': '1620', '06-jul': '1622', '08-jul': '1626', '10-jul': '1630' } },
      { id: 'p44', sel: '44', nombre: 'Casera 600', precio: 22, caben: 6, values: { '01-jul': '1731', '06-jul': '1733', '08-jul': '1735', '10-jul': '1735' } },
      { id: 'p45', sel: '45', nombre: 'Jugo Punch', precio: 15, caben: 6, values: { '01-jul': '1768', '06-jul': '1768', '08-jul': '1768', '10-jul': '1770' } },
      { id: 'p46', sel: '46', nombre: 'Jarrito/Zubba/AGA', precio: 17, caben: 6, values: { '01-jul': '1529', '06-jul': '1533', '08-jul': '1539', '10-jul': '1543' } },
      { id: 'p47', sel: '47', nombre: 'Aga 600', precio: 17, caben: 6, values: { '01-jul': '1427', '06-jul': '1433', '08-jul': '1439', '10-jul': '1444' } },
      { id: 'p50', sel: '50', nombre: 'Suerox', precio: 27, caben: 6, values: { '01-jul': '984', '06-jul': '987', '08-jul': '993', '10-jul': '995' } },
      { id: 'p51', sel: '51', nombre: 'Fresca 300', precio: 12, caben: 6, values: { '01-jul': '1087', '06-jul': '1089', '08-jul': '1093', '10-jul': '1095' } },
      { id: 'p52', sel: '52', nombre: 'Agua Sabor 1', precio: 10, caben: 6, values: { '01-jul': '945', '06-jul': '950', '08-jul': '955', '10-jul': '959' } },
      { id: 'p53', sel: '53', nombre: 'Agua Sabor 1', precio: 10, caben: 6, values: { '01-jul': '1336', '06-jul': '1340', '08-jul': '1343', '10-jul': '1346' } },
      { id: 'p54', sel: '54', nombre: 'Agua Members', precio: 7, caben: 6, values: { '01-jul': '1139', '06-jul': '1139', '08-jul': '1139', '10-jul': '1139' } },
      { id: 'p55', sel: '55', nombre: 'Gatorade', precio: 19, caben: 6, values: { '01-jul': '647', '06-jul': '651', '08-jul': '653', '10-jul': '654' } },
      { id: 'p56', sel: '56', nombre: 'Arizona', precio: 20, caben: 6, values: { '01-jul': '873', '06-jul': '875', '08-jul': '879', '10-jul': '880' } },
      { id: 'p57', sel: '57', nombre: 'Amper', precio: 26, caben: 6, values: { '01-jul': '1088', '06-jul': '1091', '08-jul': '1095', '10-jul': '1100' } },
      { id: 'p60', sel: '60', nombre: 'Yoghurt', precio: 16, caben: 6, values: { '01-jul': '869', '06-jul': '874', '08-jul': '878', '10-jul': '879' } },
      { id: 'p61', sel: '61', nombre: 'Lechitas', precio: 15, caben: 6, values: { '01-jul': '698', '06-jul': '700', '08-jul': '702', '10-jul': '705' } },
      { id: 'p62', sel: '62', nombre: 'Chocorrol GRANDE', precio: 28, caben: 6, values: { '01-jul': '530', '06-jul': '532', '08-jul': '535', '10-jul': '536' } },
      { id: 'p63', sel: '63', nombre: 'Minipeñafiel', precio: 16, caben: 15, values: { '01-jul': '803', '06-jul': '803', '08-jul': '804', '10-jul': '804' } },
      { id: 'p64', sel: '64', nombre: 'Mini Gansitos', precio: 10, caben: 12, values: { '01-jul': '953', '06-jul': '962', '08-jul': '970', '10-jul': '973' } },
      { id: 'p65', sel: '65', nombre: 'Fig Bar', precio: 16, caben: 24, values: { '01-jul': '1118', '06-jul': '1120', '08-jul': '1123', '10-jul': '1127' } },
      { id: 'p66', sel: '66', nombre: 'Boing guayaba', precio: 18, caben: 6, values: { '01-jul': '1279', '06-jul': '1283', '08-jul': '1286', '10-jul': '1288' } },
      { id: 'p67', sel: '67', nombre: 'Boing mango', precio: 18, caben: 6, values: { '01-jul': '1353', '06-jul': '1359', '08-jul': '136', '10-jul': '1370' } }
    ],
    controls: [
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
    ]
  }
];

export default function OperadoresModule({ currentUser, isSurtidorOnly = false }: OperadoresModuleProps) {
  // Local storage state initialization
  const [sheets, setSheets] = useState<any[]>(() => {
    try {
      const stored = localStorage.getItem('surtiantojo_operadores_sheets');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {}
    return DEFAULT_OPERADORES_SHEETS;
  });

  const [activeSheetId, setActiveSheetId] = useState<string>('arteche_alt');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [isNewMachineModalOpen, setIsNewMachineModalOpen] = useState<boolean>(false);
  const [newMachineName, setNewMachineName] = useState<string>('');

  // Get active sheet object
  const activeSheet = useMemo(() => {
    return sheets.find(s => s.id === activeSheetId) || sheets[0] || DEFAULT_OPERADORES_SHEETS[0];
  }, [sheets, activeSheetId]);

  // Sync to local storage
  useEffect(() => {
    try {
      localStorage.setItem('surtiantojo_operadores_sheets', JSON.stringify(sheets));
    } catch (e) {}
  }, [sheets]);

  // Handle saving data with user notification
  const handleSave = () => {
    try {
      localStorage.setItem('surtiantojo_operadores_sheets', JSON.stringify(sheets));
      setSaveMessage('¡Datos del módulo Operadores guardados correctamente!');
      setTimeout(() => setSaveMessage(null), 3000);
    } catch (e) {
      setSaveMessage('Error al guardar datos localmente');
      setTimeout(() => setSaveMessage(null), 3000);
    }
  };

  // Handle adding new date column
  const handleAddDateColumn = () => {
    const todayStr = new Date().toLocaleDateString('es-MX', { day: '2-digit', month: 'short' }).replace('.', '').replace(' ', '-');
    const promptDate = window.prompt("Ingrese la etiqueta para la nueva columna de Fecha (ej: 12-jul):", todayStr);
    if (!promptDate || !promptDate.trim()) return;
    const cleanDate = promptDate.trim();

    setSheets(prevSheets => prevSheets.map(sheet => {
      if (sheet.id !== activeSheet.id) return sheet;
      if (sheet.dates.includes(cleanDate)) {
        alert("Esa columna de fecha ya existe.");
        return sheet;
      }
      return {
        ...sheet,
        dates: [...sheet.dates, cleanDate],
        topMetrics: sheet.topMetrics.map((m: any) => ({ ...m, values: { ...m.values, [cleanDate]: '0' } })),
        products: sheet.products.map((p: any) => ({ ...p, values: { ...p.values, [cleanDate]: '0' } })),
        controls: sheet.controls.map((c: any) => ({ ...c, values: { ...c.values, [cleanDate]: c.label.startsWith('Limpieza') ? 'si' : 'no' } }))
      };
    }));
  };

  // Handle updating top metric value
  const handleUpdateTopMetric = (metricId: string, date: string, val: string) => {
    setSheets(prevSheets => prevSheets.map(sheet => {
      if (sheet.id !== activeSheet.id) return sheet;
      return {
        ...sheet,
        topMetrics: sheet.topMetrics.map((m: any) => {
          if (m.id !== metricId) return m;
          return {
            ...m,
            values: { ...m.values, [date]: val }
          };
        })
      };
    }));
  };

  // Handle updating product field
  const handleUpdateProduct = (prodId: string, field: 'precio' | 'caben' | 'nombre' | 'sel', val: any) => {
    setSheets(prevSheets => prevSheets.map(sheet => {
      if (sheet.id !== activeSheet.id) return sheet;
      return {
        ...sheet,
        products: sheet.products.map((p: any) => {
          if (p.id !== prodId) return p;
          return { ...p, [field]: val };
        })
      };
    }));
  };

  // Handle updating product count for a date
  const handleUpdateProductCount = (prodId: string, date: string, val: string) => {
    setSheets(prevSheets => prevSheets.map(sheet => {
      if (sheet.id !== activeSheet.id) return sheet;
      return {
        ...sheet,
        products: sheet.products.map((p: any) => {
          if (p.id !== prodId) return p;
          return {
            ...p,
            values: { ...p.values, [date]: val }
          };
        })
      };
    }));
  };

  // Handle updating control item
  const handleUpdateControl = (controlId: string, date: string, val: string) => {
    setSheets(prevSheets => prevSheets.map(sheet => {
      if (sheet.id !== activeSheet.id) return sheet;
      return {
        ...sheet,
        controls: sheet.controls.map((c: any) => {
          if (c.id !== controlId) return c;
          return {
            ...c,
            values: { ...c.values, [date]: val }
          };
        })
      };
    }));
  };

  // Handle adding new product row
  const handleAddProductRow = () => {
    const selInput = window.prompt("Número de SEL / Posición (ej: 68):", "");
    if (selInput === null) return;
    const nameInput = window.prompt("Nombre del Producto / Artículo:", "");
    if (!nameInput) return;

    const newProd = {
      id: 'p_' + Date.now(),
      sel: selInput.trim() || '70',
      nombre: nameInput.trim(),
      precio: 15,
      caben: 12,
      values: activeSheet.dates.reduce((acc: any, d: string) => ({ ...acc, [d]: '0' }), {})
    };

    setSheets(prevSheets => prevSheets.map(sheet => {
      if (sheet.id !== activeSheet.id) return sheet;
      return {
        ...sheet,
        products: [...sheet.products, newProd]
      };
    }));
  };

  // Delete product row
  const handleDeleteProductRow = (prodId: string) => {
    if (!window.confirm("¿Seguro que deseas eliminar este producto de la tabla?")) return;
    setSheets(prevSheets => prevSheets.map(sheet => {
      if (sheet.id !== activeSheet.id) return sheet;
      return {
        ...sheet,
        products: sheet.products.filter((p: any) => p.id !== prodId)
      };
    }));
  };

  // Delete date column
  const handleDeleteDateColumn = (dateCol: string) => {
    if (!window.confirm(`¿Seguro que deseas eliminar la columna de fecha "${dateCol}"?`)) return;
    setSheets(prevSheets => prevSheets.map(sheet => {
      if (sheet.id !== activeSheet.id) return sheet;
      return {
        ...sheet,
        dates: sheet.dates.filter((d: string) => d !== dateCol),
        topMetrics: sheet.topMetrics.map((m: any) => {
          const newV = { ...m.values };
          delete newV[dateCol];
          return { ...m, values: newV };
        }),
        products: sheet.products.map((p: any) => {
          const newV = { ...p.values };
          delete newV[dateCol];
          return { ...p, values: newV };
        }),
        controls: sheet.controls.map((c: any) => {
          const newV = { ...c.values };
          delete newV[dateCol];
          return { ...c, values: newV };
        })
      };
    }));
  };

  // Add new machine location tab
  const handleCreateMachineSheet = () => {
    if (!newMachineName.trim()) return;
    const cleanName = newMachineName.trim();
    const newId = 'm_' + Date.now();
    
    // Copy structure from default sheet with empty values
    const newSheet = {
      id: newId,
      name: cleanName,
      dates: ['01-jul', '06-jul'],
      topMetrics: [
        { id: '1', sel: '1', concept: 'Unid. Vtas', values: { '01-jul': '0', '06-jul': '0' } },
        { id: '2', sel: '2', concept: '$ ventas', values: { '01-jul': '0', '06-jul': '0' } }
      ],
      products: DEFAULT_OPERADORES_SHEETS[0].products.map(p => ({
        ...p,
        id: 'p_' + Math.random().toString(36).substring(2, 9),
        values: { '01-jul': '0', '06-jul': '0' }
      })),
      controls: DEFAULT_OPERADORES_SHEETS[0].controls.map(c => ({
        ...c,
        id: 'c_' + Math.random().toString(36).substring(2, 9),
        values: { '01-jul': 'no', '06-jul': 'no' }
      }))
    };

    setSheets(prev => [...prev, newSheet]);
    setActiveSheetId(newId);
    setNewMachineName('');
    setIsNewMachineModalOpen(false);
  };

  // Export as CSV matching exact Excel structure
  const handleExportCSV = () => {
    let csvContent = "";
    // Header row
    csvContent += `SEL,${activeSheet.name},Precio,Caben ,${activeSheet.dates.join(',')}\n`;
    
    // Top metrics
    activeSheet.topMetrics.forEach((m: any) => {
      const vals = activeSheet.dates.map((d: string) => m.values[d] || '0').join(',');
      csvContent += `${m.sel},${m.concept},,,${vals}\n`;
    });

    // Section header
    csvContent += `,Inventario,,,,,,,,\n`;

    // Products
    activeSheet.products.forEach((p: any) => {
      const vals = activeSheet.dates.map((d: string) => p.values[d] || '0').join(',');
      csvContent += `${p.sel},"${p.nombre}", $${p.precio} ,${p.caben},${vals}\n`;
    });

    // Footer controls
    activeSheet.controls.forEach((c: any) => {
      const vals = activeSheet.dates.map((d: string) => c.values[d] || '').join(',');
      csvContent += `,${c.label},${c.detail},,${vals}\n`;
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Operadores_${activeSheet.name.replace(/\s+/g, '_')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Filter products by search term
  const filteredProducts = useMemo(() => {
    if (!searchTerm.trim()) return activeSheet.products;
    const q = searchTerm.toLowerCase();
    return activeSheet.products.filter((p: any) => 
      String(p.sel).toLowerCase().includes(q) || 
      String(p.nombre).toLowerCase().includes(q)
    );
  }, [activeSheet.products, searchTerm]);

  return (
    <div className="space-y-6">
      {/* Top Header Banner */}
      <div className="bg-gradient-to-r from-[#043077] via-indigo-900 to-[#043077] rounded-2xl p-4 sm:p-6 text-white shadow-lg relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-8 -translate-y-8 w-48 h-48 bg-blue-400/10 rounded-full blur-2xl pointer-events-none" />
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 relative z-10">
          <div>
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold text-blue-200 mb-2 border border-white/10">
              <Sparkles className="w-3.5 h-3.5 text-amber-300" /> Rol Surtidor • Hoja de Control de Operadores
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight font-display text-white">
              Registro de Operadores
            </h1>
            <p className="text-blue-100/80 text-xs sm:text-sm mt-1 max-w-2xl">
              Captura exacta por fecha de inventario, ventas acumuladas, precios, capacidad por resorte y bitácora de mantenimiento por máquina.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={handleSave}
              className="px-4 py-2.5 bg-emerald-500 hover:bg-emerald-600 active:bg-emerald-700 text-white text-xs font-extrabold uppercase tracking-wider rounded-xl transition-all flex items-center gap-2 shadow-md cursor-pointer shrink-0"
            >
              <Save className="w-4 h-4 stroke-[2.5]" /> Guardar Cambios
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

      {/* Machine Tabs Navigation */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
            <span className="text-xs font-black text-slate-400 uppercase tracking-wider shrink-0 mr-1">Máquinas:</span>
            {sheets.map(sheet => (
              <button
                key={sheet.id}
                onClick={() => setActiveSheetId(sheet.id)}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-2 ${
                  activeSheetId === sheet.id
                    ? 'bg-[#043077] text-white shadow-md font-black'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                }`}
              >
                <Box className="w-3.5 h-3.5" />
                {sheet.name}
              </button>
            ))}

            <button
              onClick={() => setIsNewMachineModalOpen(true)}
              className="px-3 py-2 bg-indigo-50 hover:bg-indigo-100 text-[#043077] border border-indigo-200 rounded-xl text-xs font-extrabold transition-all cursor-pointer flex items-center gap-1.5 shrink-0"
              title="Agregar nueva ubicación / máquina"
            >
              <Plus className="w-3.5 h-3.5 stroke-[3]" /> Nueva Máquina
            </button>
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

            <button
              onClick={handleAddProductRow}
              className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer shadow-3xs"
            >
              <Plus className="w-4 h-4 stroke-[3]" /> Fila Producto (+)
            </button>
          </div>

          <div className="text-[11px] font-bold text-slate-500 bg-slate-100 px-3 py-1 rounded-lg">
            Ubicación: <strong className="text-slate-900 font-extrabold">{activeSheet.name}</strong> • Total Filas: <strong className="text-[#043077]">{activeSheet.products.length}</strong>
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
                  {activeSheet.name}
                </th>
                <th className="py-3 px-3 text-center font-black tracking-wider w-20 border-r border-blue-800 uppercase">
                  Precio
                </th>
                <th className="py-3 px-3 text-center font-black tracking-wider w-20 border-r border-blue-800 uppercase">
                  Caben
                </th>
                {activeSheet.dates.map((dateCol: string) => (
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
              {activeSheet.topMetrics.map((metric: any) => (
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
                  {activeSheet.dates.map((dateCol: string) => (
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
                {activeSheet.dates.map((d: string) => (
                  <td key={d} className="py-2 px-3 text-center border-r border-slate-300 font-mono text-slate-600">
                    {d}
                  </td>
                ))}
              </tr>

              {/* Products Table Rows */}
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={4 + activeSheet.dates.length} className="py-8 text-center text-slate-500 font-bold bg-slate-50">
                    No se encontraron productos coincidentes.
                  </td>
                </tr>
              ) : (
                filteredProducts.map((p: any) => (
                  <tr key={p.id} className="hover:bg-blue-50/40 transition-colors group">
                    <td className="py-1.5 px-3 text-center font-mono font-extrabold text-indigo-900 border-r border-slate-200 bg-slate-50/50">
                      <input
                        type="text"
                        value={p.sel}
                        onChange={(e) => handleUpdateProduct(p.id, 'sel', e.target.value)}
                        className="w-10 text-center font-mono font-bold text-xs bg-transparent focus:bg-white border border-transparent hover:border-slate-300 focus:border-[#043077] rounded px-1 py-0.5 text-indigo-950 focus:outline-none"
                      />
                    </td>
                    <td className="py-1.5 px-4 font-bold text-slate-900 border-r border-slate-200">
                      <div className="flex items-center justify-between gap-2">
                        <input
                          type="text"
                          value={p.nombre}
                          onChange={(e) => handleUpdateProduct(p.id, 'nombre', e.target.value)}
                          className="w-full font-bold text-xs bg-transparent focus:bg-white border border-transparent hover:border-slate-300 focus:border-[#043077] rounded px-1.5 py-1 text-slate-900 focus:outline-none"
                        />
                        <button
                          onClick={() => handleDeleteProductRow(p.id)}
                          className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-rose-600 p-1 rounded transition-all cursor-pointer shrink-0"
                          title="Eliminar esta fila de producto"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                    <td className="py-1.5 px-2 text-center border-r border-slate-200">
                      <div className="relative inline-flex items-center justify-center">
                        <span className="text-slate-400 text-xs font-bold mr-0.5">$</span>
                        <input
                          type="number"
                          value={p.precio}
                          onChange={(e) => handleUpdateProduct(p.id, 'precio', parseFloat(e.target.value) || 0)}
                          className="w-14 text-center font-mono font-bold text-xs bg-transparent focus:bg-white border border-slate-200 focus:border-[#043077] rounded px-1 py-0.5 text-slate-900 focus:outline-none"
                        />
                      </div>
                    </td>
                    <td className="py-1.5 px-2 text-center border-r border-slate-200">
                      <input
                        type="number"
                        value={p.caben}
                        onChange={(e) => handleUpdateProduct(p.id, 'caben', parseInt(e.target.value) || 0)}
                        className="w-12 text-center font-mono font-bold text-xs bg-transparent focus:bg-white border border-slate-200 focus:border-[#043077] rounded px-1 py-0.5 text-slate-900 focus:outline-none"
                      />
                    </td>
                    {activeSheet.dates.map((dateCol: string) => (
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

              {/* Footer Controls & Bitacora Checklist Section (Tal cual en el Excel) */}
              <tr className="bg-slate-800 text-white font-extrabold uppercase text-[11px] tracking-wider">
                <td colSpan={4} className="py-2.5 px-4 font-black">
                  CONTROLES, BITÁCORA Y ARQUEO DE CAJA Y LIMPIEZA
                </td>
                {activeSheet.dates.map((d: string) => (
                  <td key={d} className="py-2.5 px-3 text-center font-mono text-slate-200">
                    {d}
                  </td>
                ))}
              </tr>

              {activeSheet.controls.map((ctrl: any) => (
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
                  {activeSheet.dates.map((dateCol: string) => {
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

      {/* Modal for adding new machine location */}
      {isNewMachineModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 border border-slate-200">
            <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
              <Box className="w-5 h-5 text-[#043077]" /> Nueva Ubicación / Máquina
            </h3>
            <p className="text-xs text-slate-500">
              Ingresa el nombre de la nueva máquina vendomática para crear su formato de ruta y catálogo.
            </p>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Nombre de la Máquina:</label>
              <input
                type="text"
                value={newMachineName}
                onChange={(e) => setNewMachineName(e.target.value)}
                placeholder="Ejemplo: Arteche B1, Hospital General, etc."
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#043077]"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setIsNewMachineModalOpen(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl cursor-pointer"
              >
                Cancelar
              </button>
              <button
                onClick={handleCreateMachineSheet}
                className="px-4 py-2 bg-[#043077] hover:bg-blue-900 text-white font-extrabold text-xs rounded-xl cursor-pointer"
              >
                Crear Máquina
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
