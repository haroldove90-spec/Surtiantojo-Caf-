import ExcelJS from 'exceljs';

export interface SurtidoExportOptions {
  tabId: string;
  tabTitle: string;
  tabMeta?: {
    name: string;
    title?: string;
    cliente?: string;
    convenio?: string;
    grupo?: string;
    desc?: string;
  };
  data: any[];
  headers: string[];
  customDateHeaders?: Record<string, string[]>;
  summaryMetrics?: Record<string, any>;
  visits?: any[];
  isSurtidorOnly?: boolean;
}

export interface AllSurtidoExportOptions {
  supplySubmenuList: Array<{
    id: string;
    name: string;
    title?: string;
    cliente?: string;
    convenio?: string;
    grupo?: string;
    desc?: string;
  }>;
  getSubmenuData: (id: string) => any[];
  submenuHeaders: Record<string, string[]>;
  customDateHeaders: Record<string, string[]>;
  summaryMetrics: Record<string, any>;
  getMachineVisits: (id: string) => any[];
  isSurtidorOnly?: boolean;
}

// Helper to safely parse numeric values
const toNum = (val: any): number | null => {
  if (val === null || val === undefined || val === '') return null;
  if (typeof val === 'number') return isNaN(val) ? null : val;
  const cleaned = String(val).replace(/[$ ,]/g, '').trim();
  const num = parseFloat(cleaned);
  return isNaN(num) ? null : num;
};

// Styling color palette
const COLORS = {
  navyHeader: '043077',
  navyLight: 'EBF3FA',
  navyDark: '021B44',
  greenHeader: '00B050',
  greenBg: 'E2F0D9',
  greenBorder: 'A9D18E',
  greenDark: '1E4620',
  grayHeader: 'F1F5F9',
  grayBorder: 'CBD5E1',
  white: 'FFFFFF',
  textDark: '1E293B',
};

// Apply styling to a Surtido sheet
function buildSurtidoWorksheet(
  worksheet: ExcelJS.Worksheet,
  options: {
    tabTitle: string;
    tabMeta?: any;
    data: any[];
    headers: string[];
    dateCols: string[];
    customDateTitles: string[];
    summaryMetric?: any;
    visits?: any[];
    isSurtidorOnly?: boolean;
  }
) {
  const { tabTitle, tabMeta, data, dateCols, customDateTitles, summaryMetric, visits } = options;

  worksheet.views = [{ showGridLines: true }];

  let currentRow = 1;

  // Title Banner
  const titleCell = worksheet.getCell(`A${currentRow}`);
  titleCell.value = `SURTIANTOJO - REPORTE DE SURTIDO: ${tabTitle.toUpperCase()}`;
  titleCell.font = { name: 'Calibri', size: 14, bold: true, color: { argb: COLORS.white } };
  titleCell.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: COLORS.navyHeader }
  };
  titleCell.alignment = { vertical: 'middle', horizontal: 'left', indent: 1 };
  worksheet.getRow(currentRow).height = 30;

  // Merge banner across standard width
  const maxCols = Math.max(7, dateCols.length + 5);
  worksheet.mergeCells(currentRow, 1, currentRow, maxCols);
  currentRow += 2;

  // Machine Metadata Info Box
  if (tabMeta) {
    const metaRow = currentRow;
    worksheet.getCell(`A${metaRow}`).value = 'Máquina:';
    worksheet.getCell(`A${metaRow}`).font = { bold: true, size: 10, color: { argb: COLORS.navyDark } };
    worksheet.getCell(`B${metaRow}`).value = tabMeta.name || tabTitle;
    worksheet.getCell(`B${metaRow}`).font = { bold: true, size: 10 };

    worksheet.getCell(`D${metaRow}`).value = 'Cliente / Ubicación:';
    worksheet.getCell(`D${metaRow}`).font = { bold: true, size: 10, color: { argb: COLORS.navyDark } };
    worksheet.getCell(`E${metaRow}`).value = tabMeta.cliente || 'General';
    worksheet.getCell(`E${metaRow}`).font = { size: 10 };

    if (tabMeta.convenio) {
      worksheet.getCell(`G${metaRow}`).value = 'Convenio:';
      worksheet.getCell(`G${metaRow}`).font = { bold: true, size: 10, color: { argb: COLORS.navyDark } };
      worksheet.getCell(`H${metaRow}`).value = tabMeta.convenio;
      worksheet.getCell(`H${metaRow}`).font = { size: 10 };
    }
    currentRow += 2;
  }

  // Summary Metrics Table (Unid Vtas, $ Ventas, Inventario)
  const unidVtasVal = summaryMetric?.valor?.unidVtas ?? summaryMetric?.Fecha?.unidVtas ?? '';
  const ventasVal = summaryMetric?.valor?.ventas ?? summaryMetric?.Fecha?.ventas ?? '';
  const inventarioVal = summaryMetric?.valor?.inventario ?? summaryMetric?.Fecha?.inventario ?? '';

  if (unidVtasVal || ventasVal || inventarioVal) {
    const summaryHeaderRow = currentRow;
    worksheet.getCell(`A${summaryHeaderRow}`).value = 'Sel';
    worksheet.getCell(`B${summaryHeaderRow}`).value = 'Nombre Máquina / Concepto';
    worksheet.getCell(`C${summaryHeaderRow}`).value = 'Valor';

    ['A', 'B', 'C'].forEach(col => {
      const cell = worksheet.getCell(`${col}${summaryHeaderRow}`);
      cell.font = { bold: true, size: 10, color: { argb: '0F172A' } };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'E2E8F0' } };
      cell.border = {
        top: { style: 'thin', color: { argb: COLORS.grayBorder } },
        left: { style: 'thin', color: { argb: COLORS.grayBorder } },
        bottom: { style: 'thin', color: { argb: COLORS.grayBorder } },
        right: { style: 'thin', color: { argb: COLORS.grayBorder } }
      };
      cell.alignment = { horizontal: col === 'B' ? 'left' : 'center', vertical: 'middle' };
    });
    currentRow++;

    const summaryRows = [
      { sel: 1, name: 'Unid. Vtas.', val: unidVtasVal, isCurrency: false },
      { sel: 2, name: '$ Ventas', val: ventasVal, isCurrency: true },
      { sel: '', name: 'Inventario', val: inventarioVal, isCurrency: false }
    ];

    summaryRows.forEach(sRow => {
      const rIdx = currentRow;
      const cSel = worksheet.getCell(`A${rIdx}`);
      const cName = worksheet.getCell(`B${rIdx}`);
      const cVal = worksheet.getCell(`C${rIdx}`);

      cSel.value = sRow.sel;
      cName.value = sRow.name;

      const numV = toNum(sRow.val);
      if (numV !== null) {
        cVal.value = numV;
        if (sRow.isCurrency) cVal.numFmt = '"$"#,##0.00';
      } else {
        cVal.value = sRow.val || '';
      }

      [cSel, cName, cVal].forEach((c, idx) => {
        c.border = {
          top: { style: 'thin', color: { argb: COLORS.grayBorder } },
          left: { style: 'thin', color: { argb: COLORS.grayBorder } },
          bottom: { style: 'thin', color: { argb: COLORS.grayBorder } },
          right: { style: 'thin', color: { argb: COLORS.grayBorder } }
        };
        c.font = { size: 10, bold: idx === 1 };
        c.alignment = { horizontal: idx === 1 ? 'left' : 'center', vertical: 'middle' };
      });
      currentRow++;
    });
    currentRow += 2;
  }

  // Surtido Products Table Header
  const tableHeaderRow = currentRow;
  const columnsDef: Array<{ header: string; key: string; width: number; align?: 'left' | 'center' | 'right'; format?: string }> = [
    { header: 'Sel', key: 'sel', width: 10, align: 'center' },
    { header: 'Nombre del Producto', key: 'nombre_producto', width: 34, align: 'left' },
    { header: 'Precio de venta', key: 'precio_venta', width: 16, align: 'right', format: '"$"#,##0.00' },
    { header: 'Resorte', key: 'resorte', width: 12, align: 'center' }
  ];

  // Dynamic Date Columns
  dateCols.forEach((dCol, dIdx) => {
    const customTitle = customDateTitles[dIdx] || dCol;
    columnsDef.push({
      header: customTitle,
      key: `date_${dIdx}`,
      width: 15,
      align: 'center'
    });
  });

  // Additional columns for completeness
  columnsDef.push({ header: 'Importe Total', key: 'importe_total', width: 16, align: 'right', format: '"$"#,##0.00' });
  columnsDef.push({ header: 'Notas', key: 'notas', width: 22, align: 'left' });

  // Render Table Header Row
  worksheet.getRow(tableHeaderRow).height = 24;
  columnsDef.forEach((col, cIdx) => {
    const colLetter = worksheet.getColumn(cIdx + 1).letter;
    const cell = worksheet.getCell(`${colLetter}${tableHeaderRow}`);
    cell.value = col.header;
    cell.font = { name: 'Calibri', size: 10, bold: true, color: { argb: COLORS.white } };
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: COLORS.navyHeader }
    };
    cell.alignment = { horizontal: col.align || 'center', vertical: 'middle' };
    cell.border = {
      top: { style: 'medium', color: { argb: COLORS.navyDark } },
      left: { style: 'thin', color: { argb: '4A77B4' } },
      bottom: { style: 'medium', color: { argb: COLORS.navyDark } },
      right: { style: 'thin', color: { argb: '4A77B4' } }
    };
  });
  currentRow++;

  // Render Table Data Rows
  const startDataRow = currentRow;
  data.forEach((item, rIndex) => {
    const rowNum = currentRow;
    const rowObj = worksheet.getRow(rowNum);
    rowObj.height = 20;

    const isEven = rIndex % 2 === 0;
    const bgArgb = isEven ? 'FFFFFF' : 'F8FAFC';

    // Sel
    let selVal = (item.sel !== undefined && item.sel !== null)
      ? String(item.sel)
      : (item.slot !== undefined && item.slot !== null ? String(item.slot) : (item.codigo !== undefined ? String(item.codigo) : ''));
    if (selVal.startsWith('PROD-S-') || selVal.includes('-S-') || selVal.startsWith('PROD-')) selVal = '';

    // Name
    let nameVal = (item.nombre_producto !== undefined && item.nombre_producto !== null)
      ? String(item.nombre_producto)
      : (item.producto !== undefined ? String(item.producto) : (item.articulo || item.nombre || ''));
    if (/^Producto \d+$/i.test(nameVal.trim()) || /^Producto Importado \d+$/i.test(nameVal.trim())) nameVal = '';

    // Price
    const numPrice = toNum(item.precio_venta !== undefined ? item.precio_venta : item.precio);

    // Resorte
    let resorteVal = item.resorte !== undefined && item.resorte !== null ? String(item.resorte) : (item.resort || '');
    if (resorteVal === '0') resorteVal = '';

    // Unidades / Total Import
    const unidades = toNum(item.unidad_surtida !== undefined ? item.unidad_surtida : item.surtir) || 0;
    const totalImport = numPrice !== null ? numPrice * (unidades > 0 ? unidades : 1) : 0;

    // Date column values
    const dateValues: any[] = dateCols.map((dCol) => {
      const val = item.values && item.values[dCol] !== undefined
        ? item.values[dCol]
        : (item[dCol] !== undefined ? item[dCol] : '');
      const parsedNum = toNum(val);
      return parsedNum !== null ? parsedNum : (val || '');
    });

    const valuesToSet: Array<{ val: any; align?: string; bold?: boolean; format?: string }> = [
      { val: selVal, align: 'center', bold: true },
      { val: nameVal, align: 'left', bold: true },
      { val: numPrice !== null ? numPrice : '', align: 'right', format: '"$"#,##0.00' },
      { val: resorteVal, align: 'center' },
      ...dateValues.map(dv => ({
        val: dv,
        align: 'center',
        format: typeof dv === 'number' ? '#,##0' : undefined
      })),
      { val: totalImport > 0 ? totalImport : '', align: 'right', format: '"$"#,##0.00' },
      { val: item.notas || '', align: 'left' }
    ];

    valuesToSet.forEach((vDef, cIdx) => {
      const colLetter = worksheet.getColumn(cIdx + 1).letter;
      const cell = worksheet.getCell(`${colLetter}${rowNum}`);
      cell.value = vDef.val;
      if (vDef.format) cell.numFmt = vDef.format;
      cell.font = { name: 'Calibri', size: 10, bold: vDef.bold || false, color: { argb: COLORS.textDark } };
      cell.alignment = { horizontal: vDef.align as any, vertical: 'middle' };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: bgArgb } };
      cell.border = {
        top: { style: 'thin', color: { argb: COLORS.grayBorder } },
        left: { style: 'thin', color: { argb: COLORS.grayBorder } },
        bottom: { style: 'thin', color: { argb: COLORS.grayBorder } },
        right: { style: 'thin', color: { argb: COLORS.grayBorder } }
      };
    });

    currentRow++;
  });

  const endDataRow = currentRow - 1;

  // Total Summary Row
  if (data.length > 0) {
    const totalRow = currentRow;
    const rObj = worksheet.getRow(totalRow);
    rObj.height = 22;

    const cSel = worksheet.getCell(`A${totalRow}`);
    const cName = worksheet.getCell(`B${totalRow}`);
    cSel.value = '';
    cName.value = `TOTAL (${data.length} REGISTROS)`;

    [cSel, cName].forEach(c => {
      c.font = { name: 'Calibri', size: 10, bold: true, color: { argb: COLORS.navyDark } };
      c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.navyLight } };
      c.border = {
        top: { style: 'medium', color: { argb: COLORS.navyHeader } },
        bottom: { style: 'medium', color: { argb: COLORS.navyHeader } },
        left: { style: 'thin', color: { argb: COLORS.grayBorder } },
        right: { style: 'thin', color: { argb: COLORS.grayBorder } }
      };
    });

    // Sum of price column
    const priceColLetter = worksheet.getColumn(3).letter;
    const priceSumCell = worksheet.getCell(`${priceColLetter}${totalRow}`);
    priceSumCell.value = { formula: `AVERAGE(${priceColLetter}${startDataRow}:${priceColLetter}${endDataRow})` };
    priceSumCell.numFmt = '"$"#,##0.00';

    columnsDef.forEach((col, cIdx) => {
      const colLetter = worksheet.getColumn(cIdx + 1).letter;
      const cell = worksheet.getCell(`${colLetter}${totalRow}`);
      if (cIdx >= 2) {
        if (col.key.startsWith('date_')) {
          cell.value = { formula: `SUM(${colLetter}${startDataRow}:${colLetter}${endDataRow})` };
          cell.numFmt = '#,##0';
        } else if (col.key === 'importe_total') {
          cell.value = { formula: `SUM(${colLetter}${startDataRow}:${colLetter}${endDataRow})` };
          cell.numFmt = '"$"#,##0.00';
        } else if (cIdx !== 2) {
          cell.value = '';
        }
      }
      cell.font = { name: 'Calibri', size: 10, bold: true, color: { argb: COLORS.navyDark } };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.navyLight } };
      cell.alignment = { horizontal: col.align || 'center', vertical: 'middle' };
      cell.border = {
        top: { style: 'medium', color: { argb: COLORS.navyHeader } },
        bottom: { style: 'medium', color: { argb: COLORS.navyHeader } },
        left: { style: 'thin', color: { argb: COLORS.grayBorder } },
        right: { style: 'thin', color: { argb: COLORS.grayBorder } }
      };
    });

    currentRow += 3;
  } else {
    currentRow += 2;
  }

  // Bitácora de Mantenimiento Section
  if (visits && visits.length > 0) {
    const bitacoraStartRow = currentRow;

    // Bitacora Title
    const bTitleCell = worksheet.getCell(`A${bitacoraStartRow}`);
    bTitleCell.value = `BITÁCORA DE CONTROL Y MANTENIMIENTO - ${tabTitle.toUpperCase()}`;
    bTitleCell.font = { name: 'Calibri', size: 12, bold: true, color: { argb: COLORS.white } };
    bTitleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.greenHeader } };
    bTitleCell.alignment = { vertical: 'middle', horizontal: 'left', indent: 1 };
    worksheet.getRow(bitacoraStartRow).height = 26;
    worksheet.mergeCells(bitacoraStartRow, 1, bitacoraStartRow, Math.max(4, visits.length + 2));
    currentRow += 2;

    // Header Row: Concepto | Detalle | Visita 1 | Visita 2 ...
    const bHeaderRow = currentRow;
    worksheet.getRow(bHeaderRow).height = 22;

    worksheet.getCell(`A${bHeaderRow}`).value = 'Concepto';
    worksheet.getCell(`B${bHeaderRow}`).value = 'Detalle';

    ['A', 'B'].forEach(col => {
      const cell = worksheet.getCell(`${col}${bHeaderRow}`);
      cell.font = { bold: true, size: 10, color: { argb: COLORS.greenDark } };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'D5E8C8' } };
      cell.border = {
        top: { style: 'medium', color: { argb: COLORS.greenHeader } },
        bottom: { style: 'medium', color: { argb: COLORS.greenHeader } },
        left: { style: 'thin', color: { argb: COLORS.greenBorder } },
        right: { style: 'thin', color: { argb: COLORS.greenBorder } }
      };
      cell.alignment = { horizontal: 'left', vertical: 'middle' };
    });

    visits.forEach((vis, vIdx) => {
      const colLetter = worksheet.getColumn(vIdx + 3).letter;
      const cell = worksheet.getCell(`${colLetter}${bHeaderRow}`);
      cell.value = vis.visitLabel || `Visita ${vIdx + 1}`;
      cell.font = { bold: true, size: 10, color: { argb: COLORS.greenDark } };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.greenBg } };
      cell.border = {
        top: { style: 'medium', color: { argb: COLORS.greenHeader } },
        bottom: { style: 'medium', color: { argb: COLORS.greenHeader } },
        left: { style: 'thin', color: { argb: COLORS.greenBorder } },
        right: { style: 'thin', color: { argb: COLORS.greenBorder } }
      };
      cell.alignment = { horizontal: 'center', vertical: 'middle' };
    });
    currentRow++;

    const maintenanceRowsDef = [
      { concept: 'Mon. Inicial', detail: '', key: 'mon_inicial', isHeaderRow: true },
      { concept: 'Mon. Final', detail: '', key: 'mon_final', isHeaderRow: true },
      { concept: 'Pruebas con $$', detail: 'Cuanto $?', key: 'pruebas' },
      { concept: 'Ventas Externas', detail: 'Cuanto $?', key: 'ventas_externas' },
      { concept: 'Limpieza interna', detail: 'Si / no', key: 'limpieza_interna' },
      { concept: 'Limpieza externa', detail: 'Si / no', key: 'limpieza_externa' },
      { concept: 'Falla de equipo', detail: 'Si / no', key: 'falla_equipo' },
      { concept: 'Monedero', detail: 'X', key: 'monedero' },
      { concept: 'Billetero', detail: 'X', key: 'billetero' },
      { concept: 'Base de resorte', detail: 'X', key: 'base_resorte' },
      { concept: 'Otro', detail: 'X', key: 'otro' },
      { concept: 'Notas', detail: '-', key: 'notas' },
      { concept: 'Nombre del repartidor', detail: 'Surtidor', key: 'repartidor', isRepartidor: true },
      { concept: 'Elaboro', detail: '-', key: 'elaboro', isElaboro: true }
    ];

    maintenanceRowsDef.forEach(rDef => {
      const rIdx = currentRow;
      const rowObj = worksheet.getRow(rIdx);
      rowObj.height = 20;

      const cConcept = worksheet.getCell(`A${rIdx}`);
      const cDetail = worksheet.getCell(`B${rIdx}`);
      cConcept.value = rDef.concept;
      cDetail.value = rDef.detail;

      let rowBg = 'FFFFFF';
      let fontColor = COLORS.textDark;
      let isBold = false;

      if (rDef.isElaboro) {
        rowBg = COLORS.greenHeader;
        fontColor = COLORS.white;
        isBold = true;
      } else if (rDef.isRepartidor) {
        rowBg = 'E8F5E9';
        fontColor = COLORS.greenDark;
        isBold = true;
      } else if (rDef.isHeaderRow) {
        rowBg = 'F1F8E9';
        isBold = true;
      }

      [cConcept, cDetail].forEach(c => {
        c.font = { name: 'Calibri', size: 10, bold: isBold || true, color: { argb: fontColor } };
        c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: rDef.isHeaderRow ? 'D5E8C8' : rowBg } };
        c.border = {
          top: { style: 'thin', color: { argb: COLORS.greenBorder } },
          bottom: { style: 'thin', color: { argb: COLORS.greenBorder } },
          left: { style: 'thin', color: { argb: COLORS.greenBorder } },
          right: { style: 'thin', color: { argb: COLORS.greenBorder } }
        };
        c.alignment = { horizontal: 'left', vertical: 'middle' };
      });

      visits.forEach((vis, vIdx) => {
        const colLetter = worksheet.getColumn(vIdx + 3).letter;
        const cell = worksheet.getCell(`${colLetter}${rIdx}`);
        const rawVal = vis[rDef.key] !== undefined ? vis[rDef.key] : '';
        const numVal = toNum(rawVal);

        cell.value = numVal !== null ? numVal : rawVal;
        cell.font = { name: 'Calibri', size: 10, bold: isBold, color: { argb: fontColor } };
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: rowBg } };
        cell.alignment = { horizontal: 'center', vertical: 'middle' };
        cell.border = {
          top: { style: 'thin', color: { argb: COLORS.greenBorder } },
          bottom: { style: 'thin', color: { argb: COLORS.greenBorder } },
          left: { style: 'thin', color: { argb: COLORS.greenBorder } },
          right: { style: 'thin', color: { argb: COLORS.greenBorder } }
        };
      });

      currentRow++;
    });
  }

  // Auto-adjust column widths nicely
  columnsDef.forEach((col, cIdx) => {
    const column = worksheet.getColumn(cIdx + 1);
    column.width = Math.max(col.width, 12);
  });
}

/**
 * Export a single machine's Surtido table and Bitácora to a pristine .xlsx file
 */
export async function exportSurtidoToExcel(options: SurtidoExportOptions): Promise<void> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Surtiantojo Web App';
  workbook.created = new Date();

  const tabTitle = options.tabMeta?.name || options.tabTitle || 'Surtido';
  const cleanSheetName = tabTitle.replace(/[\\/*?:[\]]/g, '_').substring(0, 31);

  // Extract dynamic date headers
  const activeSubHeaders = options.headers || [];
  let dateCols = activeSubHeaders.filter(h => {
    const norm = h.toLowerCase().trim().replace(/_/g, ' ');
    return norm.startsWith('fecha');
  });
  if (dateCols.length === 0) dateCols = ['Fecha'];

  const customTitles = options.customDateHeaders?.[options.tabId] || [];

  // Sheet 1: Main Surtido Sheet
  const worksheet = workbook.addWorksheet(cleanSheetName);
  buildSurtidoWorksheet(worksheet, {
    tabTitle,
    tabMeta: options.tabMeta,
    data: options.data,
    headers: options.headers,
    dateCols,
    customDateTitles: customTitles,
    summaryMetric: options.summaryMetrics?.[options.tabId],
    visits: options.visits,
    isSurtidorOnly: options.isSurtidorOnly
  });

  // Generate binary Excel file and trigger download
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  const safeFileName = `Surtido_${cleanSheetName}_${new Date().toISOString().slice(0, 10)}.xlsx`;
  link.href = url;
  link.download = safeFileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Export all machines and submenus to a comprehensive multi-sheet .xlsx workbook
 */
export async function exportAllSurtidoToExcel(options: AllSurtidoExportOptions): Promise<void> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Surtiantojo Web App';
  workbook.created = new Date();

  const {
    supplySubmenuList,
    getSubmenuData,
    submenuHeaders,
    customDateHeaders,
    summaryMetrics,
    getMachineVisits,
    isSurtidorOnly
  } = options;

  let exportedSheetsCount = 0;

  // Add a worksheet for each machine/submenu
  for (const submenu of supplySubmenuList) {
    const data = getSubmenuData(submenu.id);
    if (!data || data.length === 0) {
      // Continue even if empty, or create sheet so user can view template
    }

    const cleanSheetName = (submenu.name || submenu.id).replace(/[\\/*?:[\]]/g, '_').substring(0, 31);
    const worksheet = workbook.addWorksheet(cleanSheetName);

    const headers = submenuHeaders[submenu.id] || [];
    let dateCols = headers.filter(h => {
      const norm = h.toLowerCase().trim().replace(/_/g, ' ');
      return norm.startsWith('fecha');
    });
    if (dateCols.length === 0) dateCols = ['Fecha'];

    const customTitles = customDateHeaders[submenu.id] || [];
    const visits = getMachineVisits(submenu.id) || [];

    buildSurtidoWorksheet(worksheet, {
      tabTitle: submenu.name || submenu.title || submenu.id,
      tabMeta: submenu,
      data,
      headers,
      dateCols,
      customDateTitles: customTitles,
      summaryMetric: summaryMetrics[submenu.id],
      visits,
      isSurtidorOnly
    });

    exportedSheetsCount++;
  }

  if (exportedSheetsCount === 0) {
    const emptySheet = workbook.addWorksheet('Surtido');
    emptySheet.getCell('A1').value = 'No hay máquinas registradas para exportar.';
  }

  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([blobData(buffer)], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  const safeFileName = `Surtido_Completo_Todas_Las_Maquinas_${new Date().toISOString().slice(0, 10)}.xlsx`;
  link.href = url;
  link.download = safeFileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function blobData(buffer: any): BlobPart {
  return buffer;
}

/**
 * Export product catalog to a styled .xlsx file
 */
export async function exportCatalogToExcel(itemsList: any[]): Promise<void> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Surtiantojo Web App';
  workbook.created = new Date();

  const worksheet = workbook.addWorksheet('Catálogo de Productos');
  worksheet.views = [{ showGridLines: true }];

  // Header Title banner
  worksheet.mergeCells('A1:P1');
  const titleCell = worksheet.getCell('A1');
  titleCell.value = 'SURTIANTOJO - CATÁLOGO GENERAL DE PRODUCTOS E INVENTARIO';
  titleCell.font = { name: 'Calibri', size: 13, bold: true, color: { argb: COLORS.white } };
  titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.navyHeader } };
  titleCell.alignment = { vertical: 'middle', horizontal: 'left', indent: 1 };
  worksheet.getRow(1).height = 28;

  const catalogHeaders = [
    { header: 'Código', key: 'codigo', width: 14, align: 'center' },
    { header: 'Nombre del Producto', key: 'nombre', width: 32, align: 'left' },
    { header: 'Proveedor', key: 'proveedor', width: 22, align: 'left' },
    { header: 'Piezas / Caja', key: 'piezas_por_caja', width: 14, align: 'center', format: '#,##0' },
    { header: 'Precio Caja ($)', key: 'precio_caja', width: 16, align: 'right', format: '"$"#,##0.00' },
    { header: 'Precio Unitario ($)', key: 'precio_unidad', width: 18, align: 'right', format: '"$"#,##0.00' },
    { header: 'Precio Venta ($)', key: 'precio_venta', width: 16, align: 'right', format: '"$"#,##0.00' },
    { header: 'Margen %', key: 'margen_pct', width: 14, align: 'right', format: '0.0"%"' },
    { header: 'Ganancia ($)', key: 'ganancia', width: 16, align: 'right', format: '"$"#,##0.00' },
    { header: 'Precio Sugerido ($)', key: 'precio_sugerido', width: 18, align: 'right', format: '"$"#,##0.00' },
    { header: 'Margen Ps %', key: 'margen_ps_pct', width: 14, align: 'right', format: '0.0"%"' },
    { header: 'Forma de Pago', key: 'forma_pago', width: 16, align: 'center' },
    { header: 'Status', key: 'status', width: 14, align: 'center' },
    { header: 'Fecha Cambio Precio', key: 'cambio_precio_fecha', width: 18, align: 'center' },
    { header: 'Notas', key: 'notas', width: 26, align: 'left' },
    { header: 'Fecha Registro', key: 'created_at', width: 16, align: 'center' }
  ];

  // Table Headers
  const hRow = 3;
  worksheet.getRow(hRow).height = 24;
  catalogHeaders.forEach((col, idx) => {
    const colLetter = worksheet.getColumn(idx + 1).letter;
    const cell = worksheet.getCell(`${colLetter}${hRow}`);
    cell.value = col.header;
    cell.font = { name: 'Calibri', size: 10, bold: true, color: { argb: COLORS.white } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.navyHeader } };
    cell.alignment = { horizontal: col.align as any, vertical: 'middle' };
    cell.border = {
      top: { style: 'medium', color: { argb: COLORS.navyDark } },
      bottom: { style: 'medium', color: { argb: COLORS.navyDark } },
      left: { style: 'thin', color: { argb: '4A77B4' } },
      right: { style: 'thin', color: { argb: '4A77B4' } }
    };
  });

  // Table Data Rows
  let curRow = 4;
  itemsList.forEach((p, idx) => {
    worksheet.getRow(curRow).height = 20;
    const isEven = idx % 2 === 0;
    const bgArgb = isEven ? 'FFFFFF' : 'F8FAFC';

    const pVta = toNum(p.precio_venta) || 0;
    const pUni = toNum(p.precio_unidad) || 0;
    const profitMargin = pVta - pUni;

    const rowData = [
      { val: p.codigo || '', align: 'center', bold: true },
      { val: p.nombre || '', align: 'left', bold: true },
      { val: p.proveedor || '', align: 'left' },
      { val: toNum(p.piezas_por_caja) || 0, align: 'center', format: '#,##0' },
      { val: toNum(p.precio_caja), align: 'right', format: '"$"#,##0.00' },
      { val: toNum(p.precio_unidad), align: 'right', format: '"$"#,##0.00' },
      { val: toNum(p.precio_venta), align: 'right', format: '"$"#,##0.00' },
      { val: toNum(p.margen_pct), align: 'right', format: '0.0"%"' },
      { val: profitMargin, align: 'right', format: '"$"#,##0.00' },
      { val: toNum(p.precio_sugerido), align: 'right', format: '"$"#,##0.00' },
      { val: toNum(p.margen_ps_pct), align: 'right', format: '0.0"%"' },
      { val: p.forma_pago || '', align: 'center' },
      { val: p.status || 'Activo', align: 'center' },
      { val: p.cambio_precio_fecha || '', align: 'center' },
      { val: p.notas || '', align: 'left' },
      { val: p.created_at ? new Date(p.created_at).toLocaleDateString() : 'Hoy', align: 'center' }
    ];

    rowData.forEach((rVal, cIdx) => {
      const colLetter = worksheet.getColumn(cIdx + 1).letter;
      const cell = worksheet.getCell(`${colLetter}${curRow}`);
      cell.value = rVal.val;
      if (rVal.format) cell.numFmt = rVal.format;
      cell.font = { name: 'Calibri', size: 10, bold: rVal.bold || false, color: { argb: COLORS.textDark } };
      cell.alignment = { horizontal: rVal.align as any, vertical: 'middle' };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: bgArgb } };
      cell.border = {
        top: { style: 'thin', color: { argb: COLORS.grayBorder } },
        bottom: { style: 'thin', color: { argb: COLORS.grayBorder } },
        left: { style: 'thin', color: { argb: COLORS.grayBorder } },
        right: { style: 'thin', color: { argb: COLORS.grayBorder } }
      };
    });

    curRow++;
  });

  catalogHeaders.forEach((col, idx) => {
    worksheet.getColumn(idx + 1).width = Math.max(col.width, 12);
  });

  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([blobData(buffer)], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  const safeFileName = `Inventario_Productos_${new Date().toISOString().slice(0, 10)}.xlsx`;
  link.href = url;
  link.download = safeFileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

