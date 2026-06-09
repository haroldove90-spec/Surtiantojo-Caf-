import React, { useState } from 'react';
import { 
  Menu, 
  X, 
  TrendingUp, 
  Coffee, 
  ClipboardList, 
  BarChart3, 
  Wallet, 
  Users, 
  Route, 
  Wrench, 
  User, 
  HelpCircle, 
  Home, 
  Bell, 
  Coffee as CupIcon, 
  Clock,
  ArrowRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import ModulePlaceholder from './components/ModulePlaceholder';

// Module structure matches requested Spanish names exactly
const APP_MODULES = [
  { id: 'metrics', name: 'Métricas', icon: TrendingUp, desc: 'Balance general de ventas y rentabilidad' },
  { id: 'products', name: 'Productos', icon: Coffee, desc: 'Catálogo y carta de cafés y postres' },
  { id: 'supply', name: 'Surtido', icon: ClipboardList, desc: 'Abastecimiento de granos, leche e insumos' },
  { id: 'sales_by_product', name: 'Venta por producto', icon: BarChart3, desc: 'Rendimiento individual de consumibles' },
  { id: 'expenses', name: 'Gastos', icon: Wallet, desc: 'Egreso por servicios, renta e insumos' },
  { id: 'client_accounts', name: 'Cuentas clientes', icon: Users, desc: 'Premios de fidelidad y saldo VIP' },
  { id: 'routes', name: 'Rutas', icon: Route, desc: 'Surtido o entregas de repostería' },
  { id: 'maintenance', name: 'Mantenimiento', icon: Wrench, desc: 'Cuidado preventivo de espresso y molinos' },
  { id: 'profile', name: 'Perfil del usuario', icon: User, desc: 'Permisos de administradores y baristas' }
];

export default function App() {
  const [activeModule, setActiveModule] = useState<string>('metrics');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(false);

  // Quick helper to close menu on mobile selection
  const selectModule = (id: string) => {
    setActiveModule(id);
    setIsMobileMenuOpen(false);
  };

  const activeModuleData = APP_MODULES.find(m => m.id === activeModule) || APP_MODULES[0];

  // Current formatted date to display on top
  const formattedDate = "Hoy, 09:45 AM";

  return (
    <div className="min-h-screen bg-[#F8F5F2] flex flex-col font-sans text-stone-800 antialiased">
      
      {/* GLOBAL NAVBAR / HEADER */}
      <header id="global-header" className="sticky top-0 z-40 bg-white border-b border-slate-200/80 shadow-sm px-6 h-16 flex items-center shrink-0">
        <div className="w-full mx-auto flex items-center justify-between">
          
          {/* Logo and Brand Title on Left */}
          <div className="flex items-center gap-4">
            
            {/* Hamburger Button for Mobile / Expand-Collapse for Desktop */}
            <button 
              id="hamburger-btn"
              onClick={() => {
                if (window.innerWidth >= 1024) {
                  setIsSidebarCollapsed(!isSidebarCollapsed);
                } else {
                  setIsMobileMenuOpen(!isMobileMenuOpen);
                }
              }}
              className="p-2 -ml-2 rounded-lg text-slate-500 hover:bg-slate-100 transition-colors focus:outline-none"
              aria-label="Toggle navigation menu"
            >
              <Menu className="w-6 h-6" />
            </button>

            <div className="flex items-center gap-3">
              {/* Premium image logo framed per instructions */}
              <div id="brand-logo-frame" className="relative shrink-0 flex items-center">
                <img 
                  id="brand-logo-img"
                  src="https://cotecam.com//surtiantojo.jpg" 
                  alt="Surtiantojo Café Logo" 
                  referrerPolicy="no-referrer"
                  className="h-10 w-auto object-contain rounded transition-transform duration-300"
                />
              </div>

              <div>
                <h1 className="text-base md:text-lg font-black font-display text-[#2C1810] tracking-tight leading-none">
                  Surtiantojo Café
                </h1>
                <p className="text-[10px] md:text-xs font-semibold text-stone-500 tracking-wide mt-0.5">
                  Dashboard de Administración
                </p>
              </div>
            </div>

          </div>

          {/* Quick status bar display items */}
          <div className="flex items-center gap-3 md:gap-5">
            
            {/* Simulation of a real-time system connection indicator */}
            <div className="hidden sm:flex items-center gap-2 bg-stone-100/80 hover:bg-stone-200/50 transition-colors px-3 py-1.5 rounded-full border border-stone-200/60">
              <span className="w-2 h-2 rounded-full bg-amber-600 animate-pulse"></span>
              <span className="text-[11px] font-mono font-medium text-stone-600">Servicio Activo</span>
            </div>

            {/* Quick user avatar visual identifier matching the High Density Theme */}
            <div id="header-user-badge" className="flex items-center gap-3 pl-3 border-l border-stone-200">
              <div className="hidden md:flex flex-col items-end">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Administrador</span>
                <span className="text-sm font-semibold text-amber-900 leading-tight">Gerencia Surtiantojo</span>
              </div>
              <div className="w-10 h-10 rounded-full bg-amber-100 border-2 border-amber-600 flex items-center justify-center text-amber-800 font-bold shadow-sm">
                GS
              </div>
            </div>

          </div>

        </div>
      </header>

      {/* DETAILED CONTENT AREA & SIDEBAR */}
      <div className="flex-grow flex w-full mx-auto relative">
        
        {/* DESKTOP SIDEBAR - CUSTOM COZY COFFEE COLOR FROM THE HIGH DENSITY THEME */}
        <aside 
          id="desktop-sidebar" 
          className={`hidden lg:block transition-all duration-300 flex-shrink-0 sticky top-16 h-[calc(100vh-64px)] ${
            isSidebarCollapsed ? 'w-20' : 'w-64'
          } bg-[#2C1810] text-slate-300`}
        >
          <div className="p-4 h-full flex flex-col justify-between overflow-y-auto">
            
            <div className="space-y-4">
              
              {/* Collapsible Sidebar Title */}
              {!isSidebarCollapsed && (
                <div className="px-3 py-2 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                  OPERACIONES
                </div>
              )}

              {/* Sidebar Menu Buttons */}
              <nav className="flex flex-col gap-1">
                {APP_MODULES.map((mod) => {
                  const IconComponent = mod.icon;
                  const isActive = mod.id === activeModule;
                  return (
                    <button
                      key={mod.id}
                      id={`sidebar-link-${mod.id}`}
                      onClick={() => selectModule(mod.id)}
                      title={mod.name}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-left transition-all duration-155 focus:outline-none text-sm ${
                        isActive
                          ? 'bg-amber-600/15 text-amber-400 font-semibold border-l-4 border-amber-500'
                          : 'text-slate-300 hover:bg-white/5 hover:text-white transition-colors'
                      }`}
                    >
                      <IconComponent className={`w-5 h-5 flex-shrink-0 ${isActive ? 'text-amber-400' : 'text-slate-400'}`} />
                      {!isSidebarCollapsed && (
                        <div className="overflow-hidden truncate flex-1">
                          <span className="block leading-none">{mod.name}</span>
                        </div>
                      )}
                    </button>
                  );
                })}
              </nav>

            </div>

            {/* Quick footer with version */}
            {!isSidebarCollapsed ? (
              <div className="p-4 border-t border-white/10 text-xs text-center opacity-50 font-mono">
                v1.0.4 Premium Admin
              </div>
            ) : (
              <div className="text-center text-xs opacity-40 py-2">
                ☕
              </div>
            )}

          </div>
        </aside>

        {/* MOBILE SIDEBAR DRAWER (Backdrop Overlay + Slide Side Menu) */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <div id="mobile-menu-portal" className="fixed inset-0 z-50 lg:hidden">
              
              {/* Opaque dark overlay backdrop */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.5 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsMobileMenuOpen(false)}
                className="absolute inset-0 bg-stone-900"
              />

              {/* Sidebar container sliding out */}
              <motion.div
                initial={{ x: '-100%' }}
                animate={{ x: 0 }}
                exit={{ x: '-100%' }}
                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                className="absolute top-0 bottom-0 left-0 w-80 max-w-[calc(100vw-3rem)] bg-[#2C1810] text-slate-300 shadow-2xl flex flex-col justify-between p-6 overflow-y-auto"
              >
                <div className="space-y-6">
                  
                  {/* Drawer header with logo and close button */}
                  <div className="flex items-center justify-between border-b border-white/10 pb-4">
                    <div className="flex items-center gap-2.5">
                      <img 
                        src="https://cotecam.com//surtiantojo.jpg" 
                        alt="Surtiantojo Logo" 
                        referrerPolicy="no-referrer"
                        className="w-8 h-8 object-cover rounded border border-white/10"
                      />
                      <div>
                        <span className="font-extrabold text-sm block font-display text-white">Surtiantojo Café</span>
                        <span className="text-[9px] text-slate-400 font-mono font-bold uppercase tracking-wider block">Panel Móvil</span>
                      </div>
                    </div>
                    
                    <button
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 focus:outline-none"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  {/* Modules Nav for mobile */}
                  <nav className="flex flex-col gap-1">
                    {APP_MODULES.map((mod) => {
                      const IconComponent = mod.icon;
                      const isActive = mod.id === activeModule;
                      return (
                        <button
                          key={mod.id}
                          id={`mobile-sidebar-link-${mod.id}`}
                          onClick={() => selectModule(mod.id)}
                          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-left transition-colors focus:outline-none text-sm ${
                            isActive
                              ? 'bg-amber-600/15 text-amber-400 font-semibold border-l-4 border-amber-500'
                              : 'text-slate-300 hover:bg-white/5 hover:text-white'
                          }`}
                        >
                          <IconComponent className="w-5 h-5 flex-shrink-0 text-slate-400" />
                          <span className="flex-1 block truncate">{mod.name}</span>
                        </button>
                      );
                    })}
                  </nav>

                </div>

                <div className="border-t border-white/10 pt-5 text-center space-y-1">
                  <span className="text-[10px] text-slate-400 font-mono block">Módulos habilitados: 9</span>
                  <span className="text-[11px] font-bold text-amber-400 bg-amber-600/10 px-3 py-1 rounded-full inline-block font-mono">
                    Próxima Integración
                  </span>
                </div>
              </motion.div>

            </div>
          )}
        </AnimatePresence>

        {/* MAIN MODULE GRAPHIC INTERFACE */}
        <main id="main-content" className="flex-1 p-6 md:p-8 overflow-y-auto flex flex-col gap-6">
          
          {/* ELEGANT SERIF HEADER PRESCRIBED BY HIGH DENSITY SPEC */}
          <div className="flex flex-col sm:flex-row sm:items-end justify-between border-b border-slate-200 pb-4 gap-2">
            <div>
              <h1 className="text-3xl font-serif font-bold text-slate-900">
                Panel de Control General
              </h1>
              <p className="text-slate-500 text-xs mt-1">
                Visualización de Surtiantojo Café • Módulo activo: <strong className="text-[#2C1810]">{activeModuleData.name}</strong>
              </p>
            </div>
            <p className="text-slate-500 text-xs font-mono">
              Última actualización: {formattedDate}
            </p>
          </div>

          {/* DYNAMIC COMPONENT RENDERER */}
          <div className="transition-all duration-300">
            <ModulePlaceholder moduleId={activeModule} />
          </div>

          {/* TWO DECORATIVE HIGH-DENSITY HIGHLIGHT RAIL PANELS PRESCRIBED IN THE HTML SCHEMATIC */}
          <div className="flex flex-col md:flex-row gap-4 mt-2">
            <div 
              onClick={() => selectModule('routes')}
              className="flex-1 h-20 bg-[#6F4E37]/10 rounded-xl border border-[#6F4E37]/20 flex items-center px-6 gap-4 cursor-pointer hover:bg-[#6F4E37]/15 transition-all"
            >
              <div className="p-3 bg-white rounded-lg shadow-sm text-xl flex items-center justify-center">🚚</div>
              <div>
                <p className="text-xs font-bold text-[#6F4E37] uppercase">Gestión de Rutas</p>
                <p className="text-xs text-slate-500 font-medium italic">Regresar o programar camión de despacho...</p>
              </div>
            </div>
            <div 
              onClick={() => selectModule('maintenance')}
              className="flex-1 h-20 bg-[#6F4E37]/10 rounded-xl border border-[#6F4E37]/20 flex items-center px-6 gap-4 cursor-pointer hover:bg-[#6F4E37]/15 transition-all"
            >
              <div className="p-3 bg-white rounded-lg shadow-sm text-xl flex items-center justify-center">🛠️</div>
              <div>
                <p className="text-xs font-bold text-[#6F4E37] uppercase">Mantenimiento</p>
                <p className="text-xs text-slate-500 font-medium italic">Revisar máquinas italianas y molinos espresso...</p>
              </div>
            </div>
          </div>

          {/* INTERACTIVE NAVIGATION MAP (GUIDE TO SYSTEM) */}
          <section className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm space-y-4">
            <div className="flex items-center gap-2">
              <HelpCircle className="w-5 h-5 text-amber-800" />
              <h3 className="font-bold text-slate-900 font-display">Mapa de Módulos Activos</h3>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed max-w-3xl">
              Este dashboard está diseñado con una estructura modular limpia. Para navegar entre los distintos espacios del negocio (Métricas, Productos, Surtido, etc.), usa la barra lateral en tu computador o despliega el menú móvil haciendo clic en el icono de hamburguesa en la esquina superior izquierda. 
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 pt-2">
              {APP_MODULES.map((m) => (
                <button
                  key={m.id}
                  onClick={() => selectModule(m.id)}
                  className={`p-3 rounded-xl border text-center transition-all ${
                    m.id === activeModule 
                      ? 'border-amber-800 bg-amber-50/50 text-amber-950 shadow-sm font-semibold' 
                      : 'border-slate-100 hover:border-slate-300 bg-slate-50/40 text-stone-600'
                  }`}
                >
                  <p className="text-xs truncate font-display font-medium leading-tight">{m.name}</p>
                  <span className="text-[9px] text-stone-400 font-mono mt-0.5 block capitalize">Próximamente</span>
                </button>
              ))}
            </div>
          </section>

        </main>

      </div>
    </div>
  );
}
