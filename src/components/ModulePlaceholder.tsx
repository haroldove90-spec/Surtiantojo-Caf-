import React from 'react';
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
  Sparkles
} from 'lucide-react';
import { motion } from 'motion/react';

interface ModulePlaceholderProps {
  moduleId: string;
}

export default function ModulePlaceholder({ moduleId }: ModulePlaceholderProps) {
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
                <span className="text-slate-400 text-[11px] font-bold tracking-wider uppercase block">VENTAS TOTALES DEL MES</span>
                <div className="flex items-baseline gap-2 mt-2">
                  <span className="text-3xl font-extrabold font-display text-slate-900">$284,350</span>
                  <span className="text-xs font-bold text-emerald-600 flex items-center gap-0.5">
                    <TrendingUp className="w-3 h-3" /> +14.2%
                  </span>
                </div>
                <div className="w-full bg-slate-100 h-1.5 rounded-full mt-4 overflow-hidden">
                  <div className="bg-gradient-to-r from-blue-600 to-[#043077] h-full" style={{ width: '74%' }}></div>
                </div>
                <span className="text-[10px] text-slate-400 mt-2 block">Meta mensual: $380,000</span>
              </div>

              <div className="p-5 rounded-2xl bg-white border border-slate-100 shadow-sm relative overflow-hidden group hover:shadow-md transition-shadow">
                <div className="absolute right-0 top-0 w-24 h-24 bg-emerald-500/5 rounded-bl-full pointer-events-none transition-all group-hover:scale-110"></div>
                <span className="text-slate-400 text-[11px] font-bold tracking-wider uppercase block">TICKET PROMEDIO</span>
                <div className="flex items-baseline gap-2 mt-2">
                  <span className="text-3xl font-extrabold font-display text-slate-900">$94.50</span>
                  <span className="text-xs font-bold text-emerald-600 flex items-center gap-0.5">
                    <TrendingUp className="w-3 h-3" /> +5.8%
                  </span>
                </div>
                <div className="w-full bg-slate-100 h-1.5 rounded-full mt-4 overflow-hidden">
                  <div className="bg-gradient-to-r from-emerald-500 to-teal-600 h-full" style={{ width: '85%' }}></div>
                </div>
                <span className="text-[10px] text-slate-400 mt-2 block">Mayor consumo: Capuchinos + Postres</span>
              </div>

              <div className="p-5 rounded-2xl bg-white border border-slate-100 shadow-sm relative overflow-hidden group hover:shadow-md transition-shadow">
                <div className="absolute right-0 top-0 w-24 h-24 bg-amber-500/5 rounded-bl-full pointer-events-none transition-all group-hover:scale-110"></div>
                <span className="text-slate-400 text-[11px] font-bold tracking-wider uppercase block">MARGEN DE UTILIDAD</span>
                <div className="flex items-baseline gap-2 mt-2">
                  <span className="text-3xl font-extrabold font-display text-slate-900">42.8%</span>
                  <span className="text-xs font-bold text-slate-500 flex items-center gap-0.5">
                    Estable
                  </span>
                </div>
                <div className="w-full bg-slate-100 h-1.5 rounded-full mt-4 overflow-hidden">
                  <div className="bg-gradient-to-r from-amber-500 to-orange-600 h-full" style={{ width: '68%' }}></div>
                </div>
                <span className="text-[10px] text-slate-400 mt-2 block">Optimización de insumos lograda</span>
              </div>

              <div className="p-5 rounded-xl bg-gradient-to-tr from-[#043077] to-blue-800 text-white shadow-md relative overflow-hidden group">
                <span className="text-blue-200/80 text-[11px] font-bold tracking-wider uppercase block">TRANSACCIONES</span>
                <div className="flex items-baseline gap-2 mt-2">
                  <span className="text-3xl font-extrabold font-display text-white">3,120</span>
                  <span className="text-xs font-bold text-blue-200 block">Este Mes</span>
                </div>
                <div className="mt-4 pt-1 flex items-center justify-between text-xs text-blue-100">
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
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4.5 rounded-2xl border border-slate-200/60 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-lg bg-[#043077]/10 text-[#043077]">
                  <Layers className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900">Total en Menú: 48 Artículos</h4>
                  <p className="text-xs text-slate-400">Divididos en: Cafetería, Repostería, Desayunos y extras</p>
                </div>
              </div>
              <button className="flex items-center gap-1 px-4.5 py-2 rounded-xl bg-gradient-to-r from-blue-700 to-[#043077] hover:opacity-90 text-white text-xs font-bold transition-all shadow-sm">
                <Plus className="w-4 h-4" /> Agregar Platillo o Café
              </button>
            </div>

            {/* Product Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {[
                { name: 'Café Americano 12oz', price: '$35.00', category: 'Bebidas Calientes', popularity: 'Alto (940/mes)' },
                { name: 'Capuchino Aromático 16oz', price: '$48.00', category: 'Bebidas Calientes', popularity: 'Alto (1,420/mes)' },
                { name: 'Espresso Intenso Doble', price: '$30.00', category: 'Bebidas Calientes', popularity: 'Medio (480/mes)' },
                { name: 'Rebanada Pastel Tres Leches', price: '$55.00', category: 'Repostería', popularity: 'Alto (820/mes)' },
                { name: 'Cuernito de Mantequilla', price: '$28.00', category: 'Panadería', popularity: 'Medio (560/mes)' },
                { name: 'Muffin de Arándanos', price: '$32.00', category: 'Panadería', popularity: 'Bajo (220/mes)' },
              ].map((prod, i) => (
                <div key={i} className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-sm hover:border-[#043077]/50 hover:shadow-md transition-all space-y-3 group text-left">
                  <div className="relative w-full h-32 bg-slate-100 rounded-xl overflow-hidden flex items-center justify-center">
                    <div className="absolute top-2 left-2 px-2 py-0.5 rounded bg-slate-900/60 backdrop-blur-xs text-white text-[9px] font-bold">
                      {prod.category}
                    </div>
                    <Coffee className="w-10 h-10 text-slate-300 group-hover:scale-110 transition-transform" />
                  </div>
                  <div>
                    <h5 className="text-sm font-bold text-slate-800 line-clamp-1">{prod.name}</h5>
                    <div className="flex justify-between items-center mt-1">
                      <span className="text-md font-extrabold text-[#043077]">{prod.price}</span>
                      <span className="text-[10px] bg-blue-50 text-blue-700 font-medium px-2 py-0.5 rounded-full">
                        {prod.popularity}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );

      case 'supply':
        return (
          <div className="space-y-6">
            {/* Top Indicator bar */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-4 bg-white border border-slate-150 rounded-2xl shadow-xs">
                <span className="text-xs text-slate-400 font-bold block">GRANO CAFÉ MATRIZ RESGUARDO</span>
                <span className="text-2xl font-black text-slate-900 mt-1 block">18.5 kgs</span>
                <span className="text-[10px] text-emerald-600 font-medium font-mono">Suficiente para 12 días</span>
              </div>
              <div className="p-4 bg-white border border-slate-150 rounded-2xl shadow-xs">
                <span className="text-xs text-slate-400 font-bold block">VASOS CRÍTICOS 12oz</span>
                <span className="text-2xl font-black text-red-600 mt-1 block">150 pzas</span>
                <span className="text-[10px] text-red-500 font-semibold font-mono">Reordenar urgente</span>
              </div>
              <div className="p-4 bg-white border border-slate-150 rounded-2xl shadow-xs">
                <span className="text-xs text-slate-400 font-bold block">LECHES & COMPLEMENTOS</span>
                <span className="text-2xl font-black text-slate-900 mt-1 block">74% de Capacidad</span>
                <span className="text-[10px] text-emerald-600 font-medium font-mono">Último surtido: Ayer</span>
              </div>
            </div>

            {/* Insumo tables with customized SVG graphic bar indicators */}
            <div className="bg-white border border-slate-150 rounded-2xl p-5 shadow-sm space-y-4">
              <h4 className="text-base font-bold text-slate-900">Niveles de Resguardo e Insumos</h4>
              <div className="space-y-4">
                {[
                  { item: 'Grano de Café Blend Surtiantojo', type: 'Materia prima', level: 78, qty: '18.5 kg', status: 'Sano', color: '#043077' },
                  { item: 'Vasos Desechables Bio 16oz', type: 'Insumos', level: 32, qty: '420 pzas', status: 'Revisión', color: '#F59E0B' },
                  { item: 'Vasos Desechables Bio 12oz', type: 'Insumos', level: 12, qty: '150 pzas', status: 'Agotando', color: '#EF4444' },
                  { item: 'Leche Entera Premium (Cajas)', type: 'Lácteos', level: 90, qty: '48 pzas', status: 'Sano', color: '#10B981' },
                  { item: 'Azúcar Refinada Mascabado', type: 'Endulzantes', level: 65, qty: '12.0 kg', status: 'Sano', color: '#043077' },
                ].map((sup, idx) => (
                  <div key={idx} className="space-y-1.5">
                    <div className="flex justify-between items-center text-xs">
                      <div>
                        <span className="font-bold text-slate-800">{sup.item}</span>
                        <span className="text-[10px] text-slate-400 ml-2">({sup.type})</span>
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
                <h4 className="text-base font-bold text-slate-900">Top 5 Favoritos de la Semana</h4>
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
                        <span className="w-5 h-5 rounded-full bg-blue-50 text-[#043077] font-bold text-xs flex items-center justify-center">
                          {top.rank}
                        </span>
                        <div>
                          <span className="text-xs font-bold text-slate-800 block leading-tight">{top.name}</span>
                          <span className="text-[10px] text-slate-400">{top.sales} despachados</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-xs font-mono font-bold text-[#043077] block">{top.rev}</span>
                        <span className="text-[9px] text-slate-400 font-mono block">{top.pct}% del total</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Pie graph simulation with visual HTML / CSS */}
              <div className="bg-white border border-slate-150 rounded-2xl p-5 shadow-sm flex flex-col justify-between">
                <h4 className="text-base font-bold text-slate-900 text-left">Participación de Venta</h4>
                
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
                      <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wide">PRINCIPAL</span>
                      <span className="text-xl font-extrabold text-[#043077]">Cafés</span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-[10px] text-slate-600 pt-2 border-t border-slate-50">
                  <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded bg-[#043077]"></span> Capuchinos (40%)</div>
                  <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded bg-blue-500"></span> Americanos (28%)</div>
                  <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded bg-emerald-500"></span> Postres (16%)</div>
                  <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded bg-amber-500"></span> Panadería (16%)</div>
                </div>
              </div>

            </div>
          </div>
        );

      case 'expenses':
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 bg-white border border-slate-150 rounded-2xl">
                <span className="text-[10px] text-slate-400 font-bold block uppercase">SERVICIOS FIJOS (LUZ/AGUA)</span>
                <span className="text-2xl font-black text-slate-900 mt-1 block">$4,080.00</span>
                <span className="text-[10px] text-slate-400 font-mono block">Vencimiento: En 15 días</span>
              </div>
              <div className="p-4 bg-white border border-slate-150 rounded-2xl">
                <span className="text-[10px] text-slate-400 font-bold block uppercase">INSUMOS & PROVEEDORES</span>
                <span className="text-2xl font-black text-slate-900 mt-1 block">$18,450.20</span>
                <span className="text-[10px] text-emerald-600 font-semibold font-mono block">80% Facturado con IVA</span>
              </div>
              <div className="p-4 bg-white border border-slate-150 rounded-2xl">
                <span className="text-[10px] text-slate-400 font-bold block uppercase">MANTENIMIENTOS</span>
                <span className="text-2xl font-black text-slate-900 mt-1 block">$980.00</span>
                <span className="text-[10px] text-slate-400 font-mono block">Filtros de agua reemplazados</span>
              </div>
            </div>

            <div className="bg-white border border-slate-150 rounded-2xl p-5 shadow-sm text-left space-y-4">
              <h4 className="text-base font-bold text-slate-900">Historial Reciente de Egresos</h4>
              <div className="space-y-3">
                {[
                  { concept: 'Compra de Sacos de Café Arábiga', cat: 'Insumos', cost: '$6,400.00', date: '08 Jun 2026', method: 'Transferencia' },
                  { concept: 'Liquidación de Factura Bimestral CFE', cat: 'Servicios', cost: '$3,400.00', date: '05 Jun 2026', method: 'Crédito' },
                  { concept: 'Refacciones para Molino Italiano', cat: 'Mantenimiento', cost: '$980.00', date: '02 Jun 2026', method: 'Efectivo' },
                  { concept: 'Empaques de Muffin y Vasos Bio', cat: 'Insumos', cost: '$1,850.00', date: '28 May 2026', method: 'Transferencia' },
                ].map((exp, idx) => (
                  <div key={idx} className="flex justify-between items-center p-3 rounded-xl hover:bg-slate-50 border border-slate-100 transition-colors">
                    <div>
                      <h5 className="text-xs font-bold text-slate-800">{exp.concept}</h5>
                      <p className="text-[10px] text-slate-400 flex gap-2 mt-0.5">
                        <span>{exp.date}</span>•<span>Categoria: {exp.cat}</span>•<span>{exp.method}</span>
                      </p>
                    </div>
                    <span className="text-xs font-mono font-black text-red-600">-{exp.cost}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );

      case 'client_accounts':
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              
              <div className="p-4 bg-white border border-slate-150 rounded-2xl text-left space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-[#043077]">Ranking VIP de Clientes</span>
                  <span className="text-[9px] font-mono text-slate-400">Total: 182 Registros</span>
                </div>
                <div className="space-y-2">
                  {[
                    { name: 'Sofía Rodríguez', spent: '42 visitas', points: '14 Sellos Acumulados' },
                    { name: 'Gabriel Martínez', spent: '28 visitas', points: '9 Sellos Acumulados' },
                    { name: 'Carlos Mendoza', spent: '19 visitas', points: '4 Sellos Acumulados' },
                  ].map((vip, i) => (
                    <div key={i} className="flex justify-between items-center p-2 rounded bg-slate-50 border-r-4 border-r-[#043077] text-left">
                      <div>
                        <span className="text-xs font-bold text-slate-800 block">{vip.name}</span>
                        <span className="text-[10px] text-slate-400">{vip.spent}</span>
                      </div>
                      <span className="text-xs font-mono font-bold text-[#043077]">{vip.points}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-4 bg-[#043077] text-white rounded-2xl text-left flex flex-col justify-between">
                <div>
                  <Sparkles className="w-6 h-6 text-yellow-300 animate-pulse mb-2" />
                  <h4 className="text-sm font-bold">Tarjeta Digital de Lealtad Activa</h4>
                  <p className="text-xs text-blue-100/90 leading-relaxed mt-1">
                    Cada 10 cafés consumidos por el cliente registrados en su perfil generan una bebida gratis de cortesía tamaño mediano de repostería.
                  </p>
                </div>
                <div className="pt-2">
                  <span className="inline-block text-[10px] font-bold font-mono bg-white/20 px-3 py-1 rounded">
                    Código de Promoción: CAFEVIP10
                  </span>
                </div>
              </div>

            </div>

            {/* Loyalty details list */}
            <div className="bg-white border border-slate-150 rounded-2xl p-5 shadow-sm text-left space-y-4">
              <h4 className="text-base font-bold text-slate-900">Estado de Cuentas y Fidelidad</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  { name: 'Gabriela Martínez', activeStamps: 7, totalCofees: 32, phone: '55-1234-5678' },
                  { name: 'Héctor Vega', activeStamps: 1, totalCofees: 11, phone: '55-3456-7890' },
                ].map((client, idx) => (
                  <div key={idx} className="p-3 bg-slate-50 rounded-xl space-y-3 border border-slate-100">
                    <div className="flex justify-between">
                      <div>
                        <h5 className="text-xs font-bold text-slate-900">{client.name}</h5>
                        <p className="text-[10px] text-slate-400">{client.phone}</p>
                      </div>
                      <div className="text-right">
                        <span className="text-xs font-bold text-slate-700 block">{client.totalCofees} consumidos</span>
                      </div>
                    </div>
                    {/* Visual Stamp Card */}
                    <div className="space-y-1">
                      <span className="text-[9px] text-[#043077] font-bold uppercase block font-mono">TARJETA DE SELLOS:</span>
                      <div className="flex gap-1.5 flex-wrap">
                        {Array.from({ length: 10 }).map((_, stampIdx) => (
                          <div 
                            key={stampIdx} 
                            className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
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
                  <h4 className="text-base font-bold text-slate-900">Mapa de Distribución y Rutas</h4>
                  <p className="text-xs text-slate-400">Entrega de repostería fresca e insumos a sucursal y pedidos VIP</p>
                </div>
                <div className="flex items-center gap-2 text-xs font-mono">
                  <span className="inline-flex items-center gap-1.5 text-blue-700 bg-blue-50 px-2 py-1 rounded">
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

                <div className="absolute top-18 left-8 bg-white p-2 rounded-lg border border-slate-200 text-[10px] font-bold shadow-sm flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-[#043077]" />
                  <span>Matriz Surtiantojo</span>
                </div>

                <div className="absolute bottom-6 right-20 bg-white p-2 rounded-lg border border-slate-200 text-[10px] font-bold shadow-sm flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-[#043077]" />
                  <span>Sucursal Norte (Carga #3)</span>
                </div>

                {/* Animated delivery truck representation marker */}
                <div className="absolute left-[45%] top-[25%] p-1 rounded-full bg-gradient-to-tr from-[#043077] to-blue-600 text-white shadow-md animate-bounce">
                  <Truck className="w-4 h-4" />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div className="p-3 bg-slate-50 rounded-xl">
                  <span className="text-slate-400 block tracking-wide font-bold uppercase text-[9px]">DIRECCIÓN ACTUAL</span>
                  <span className="font-bold text-slate-800 mt-1 block">Calle 24 No. 402, Sucursal Norte</span>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl">
                  <span className="text-slate-400 block tracking-wide font-bold uppercase text-[9px]">AVANCE DE TRANSITO</span>
                  <span className="font-bold text-slate-800 mt-1 block">2 / 3 Puntos Entregados</span>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl">
                  <span className="text-slate-400 block tracking-wide font-bold uppercase text-[9px]">ENVIOS DE REPOSTERÍA</span>
                  <span className="font-bold text-slate-800 mt-1 block">82% Capacidad Camioneta</span>
                </div>
              </div>
            </div>
          </div>
        );

      case 'maintenance':
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-left">
              
              <div className="p-5 bg-white border border-slate-150 rounded-2xl shadow-sm space-y-3">
                <h4 className="text-sm font-bold text-slate-900">Salud General de Maquinaria</h4>
                <div className="space-y-3">
                  {[
                    { machine: 'Máquina Espresso Italiana', health: 94, state: 'Excelente' },
                    { machine: 'Molino de Café Principal', health: 88, state: 'Óptimo' },
                    { machine: 'Refrigerador Vitrina Postres', health: 76, state: 'Revisión Filtro' },
                  ].map((mch, idx) => (
                    <div key={idx} className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="font-semibold text-slate-800">{mch.machine}</span>
                        <span className="font-mono text-[#043077]">{mch.health}%</span>
                      </div>
                      <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div className="bg-[#043077] h-full rounded-full" style={{ width: `${mch.health}%` }}></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-5 bg-white border border-slate-150 rounded-2xl shadow-sm space-y-3">
                <h4 className="text-sm font-bold text-slate-900">Programas de Limpieza Próximos</h4>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 p-2 rounded bg-red-50 text-red-800 border-l-4 border-l-red-600 text-xs">
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                    <span>Descalcificación Espresso es requerida en 12 días</span>
                  </div>
                  <div className="flex items-center gap-2 p-2 rounded bg-amber-50 text-amber-800 border-l-4 border-l-amber-600 text-xs">
                    <Clock className="w-4 h-4 shrink-0" />
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
                  <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-[#043077] to-blue-600 text-white font-extrabold text-xl flex items-center justify-center">
                    GS
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-900">Gerencia Surtiantojo</h3>
                    <p className="text-xs text-[#043077] font-bold">Administrador General del Sistema</p>
                    <p className="text-[10px] text-slate-400">Permisos Totales: Lectura, Escritura, Edición de Catálogos</p>
                  </div>
                </div>
                <button className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors">
                  Editar Información
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-slate-100 text-xs">
                <div className="space-y-3">
                  <div>
                    <span className="text-slate-400 font-bold block uppercase text-[10px]">CORREO ACCESO</span>
                    <span className="font-semibold text-slate-800">gerencia@surtiantojocafe.com</span>
                  </div>
                  <div>
                    <span className="text-slate-400 font-bold block uppercase text-[10px]">TELÉFONO DE CONTACTO</span>
                    <span className="font-semibold text-slate-800">55-8422-9011</span>
                  </div>
                </div>
                <div className="space-y-3">
                  <div>
                    <span className="text-slate-400 font-bold block uppercase text-[10px]">ROL ASIGNADO</span>
                    <span className="inline-flex items-center gap-1.5 text-xs text-white bg-[#043077] px-2 py-0.5 rounded font-mono font-bold uppercase">
                      <Shield className="w-3 h-3" /> Superadministrador
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 font-bold block uppercase text-[10px]">ÚLTIMA SESIÓN</span>
                    <span className="font-semibold text-slate-800">Hoy, 22:16 UTC desde Navegador Local</span>
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
