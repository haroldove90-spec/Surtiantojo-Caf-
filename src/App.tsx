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
    <div className="min-h-screen bg-[#F1F5F9] flex flex-col font-sans text-slate-800 antialiased">
      
      {/* GLOBAL NAVBAR / HEADER - STYLED IN DEEP BLUE #043077 */}
      <header id="global-header" className="sticky top-0 z-40 bg-[#043077] border-b border-blue-900/40 shadow-sm px-6 h-16 flex items-center shrink-0">
        <div className="w-full mx-auto flex items-center justify-between">
          
          {/* Logo on Left - Raw and Clean without bounding frames */}
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
              className="p-2 -ml-2 rounded-lg text-blue-100 hover:bg-white/10 transition-colors focus:outline-none"
              aria-label="Toggle navigation menu"
            >
              <Menu className="w-6 h-6" />
            </button>

            <img 
              id="brand-logo-img"
              src="https://cotecam.com//surtiantojo.jpg" 
              alt="Surtiantojo Café Logo" 
              referrerPolicy="no-referrer"
              className="h-12 w-auto object-contain transition-transform duration-300"
            />
          </div>

          {/* Quick status bar display items */}
          <div className="flex items-center gap-3 md:gap-5">
            
            {/* Quick user avatar visual identifier */}
            <div id="header-user-badge" className="flex items-center gap-3 pl-3 border-l border-white/20">
              <div className="hidden md:flex flex-col items-end text-right">
                <span className="text-[10px] font-bold uppercase tracking-wider text-blue-200">Administrador</span>
                <span className="text-sm font-semibold text-white leading-tight">Gerencia Surtiantojo</span>
              </div>
              <div className="w-10 h-10 rounded-full bg-white/15 border-2 border-white/20 flex items-center justify-center text-white font-bold shadow-sm">
                GS
              </div>
            </div>

          </div>

        </div>
      </header>

      {/* DETAILED CONTENT AREA & SIDEBAR */}
      <div className="flex-grow flex w-full mx-auto relative">
        
        {/* DESKTOP SIDEBAR - STYLED IN DEEP BLUE #043077 WITH PREMIUM GRADIENT */}
        <aside 
          id="desktop-sidebar" 
          className={`hidden lg:block transition-all duration-300 flex-shrink-0 sticky top-16 h-[calc(100vh-64px)] ${
            isSidebarCollapsed ? 'w-20' : 'w-64'
          } bg-gradient-to-b from-[#043077] to-[#011432] text-slate-300`}
        >
          <div className="p-4 h-full flex flex-col justify-between overflow-y-auto">
            
            <div className="space-y-4">
              
              {/* Collapsible Sidebar Title */}
              {!isSidebarCollapsed && (
                <div className="px-3 py-2 text-[10px] font-extrabold text-blue-200/60 uppercase tracking-widest">
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
                          ? 'bg-blue-500/20 text-blue-200 font-semibold border-l-4 border-blue-400'
                          : 'text-slate-300 hover:bg-white/5 hover:text-white transition-colors'
                      }`}
                    >
                      <IconComponent className={`w-5 h-5 flex-shrink-0 ${isActive ? 'text-blue-300' : 'text-slate-400'}`} />
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
                ⚡
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
                className="absolute top-0 bottom-0 left-0 w-80 max-w-[calc(100vw-3rem)] bg-gradient-to-b from-[#043077] to-[#011432] text-slate-300 shadow-2xl flex flex-col justify-between p-6 overflow-y-auto"
              >
                <div className="space-y-6">
                  
                  {/* Drawer header with logo and close button */}
                  <div className="flex items-center justify-between border-b border-white/10 pb-4">
                    <div className="flex items-center gap-2.5">
                      <img 
                        src="https://cotecam.com//surtiantojo.jpg" 
                        alt="Surtiantojo Logo" 
                        referrerPolicy="no-referrer"
                        className="w-10 h-10 object-contain"
                      />
                      <div>
                        <span className="font-extrabold text-sm block font-display text-white">Surtiantojo Café</span>
                        <span className="text-[10px] text-blue-200 font-mono font-bold uppercase tracking-wider block">Panel Móvil</span>
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
                              ? 'bg-blue-500/20 text-blue-200 font-semibold border-l-4 border-blue-400'
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
                  <span className="text-[11px] font-bold text-blue-200 bg-blue-500/20 px-3 py-1 rounded-full inline-block font-mono">
                    Sistema Activo
                  </span>
                </div>
              </motion.div>

            </div>
          )}
        </AnimatePresence>

        {/* MAIN MODULE GRAPHIC INTERFACE */}
        <main id="main-content" className="flex-1 p-6 md:p-8 overflow-y-auto flex flex-col gap-6">
          
          {/* ELEGANT SERIF HEADER PRESCRIBED BY HIGH DENSITY SPEC - CLEANED OF DATE AND TIME AS REQUESTED */}
          <div className="flex flex-col sm:flex-row sm:items-end justify-between border-b border-slate-200 pb-3">
            <div>
              <p className="text-slate-400 text-xs font-bold uppercase tracking-wider">Surtiantojo Café Administration</p>
              <h1 className="text-2xl font-bold text-slate-900 mt-1">
                {activeModuleData.name}
              </h1>
            </div>
          </div>

          {/* DYNAMIC COMPONENT RENDERER */}
          <div className="transition-all duration-300">
            <ModulePlaceholder moduleId={activeModule} />
          </div>

          {/* TWO DECORATIVE HIGH-DENSITY HIGHLIGHT RAIL PANELS - STYLED IN BRAND BLUE #043077 WITH GRADIENTS and ZERO COFFEE COLORS */}
          <div className="flex flex-col md:flex-row gap-4 mt-2">
            <div 
              onClick={() => selectModule('routes')}
              className="flex-1 h-20 bg-gradient-to-r from-blue-50 to-indigo-50 hover:from-blue-100 hover:to-indigo-100 rounded-2xl border border-blue-100 flex items-center px-6 gap-4 cursor-pointer transition-all shadow-xs"
            >
              <div className="p-3 bg-gradient-to-tr from-[#043077] to-blue-600 rounded-xl text-white text-xl flex items-center justify-center shadow-sm">🚚</div>
              <div className="text-left">
                <p className="text-xs font-black text-[#043077] uppercase tracking-wide">Gestión de Rutas</p>
                <p className="text-xs text-slate-500 font-medium italic">Monitorear entrega e itinerarios activos...</p>
              </div>
            </div>
            <div 
              onClick={() => selectModule('maintenance')}
              className="flex-1 h-20 bg-gradient-to-r from-blue-50 to-indigo-50 hover:from-blue-100 hover:to-indigo-100 rounded-2xl border border-blue-100 flex items-center px-6 gap-4 cursor-pointer transition-all shadow-xs"
            >
              <div className="p-3 bg-gradient-to-tr from-[#043077] to-blue-600 rounded-xl text-white text-xl flex items-center justify-center shadow-sm">🛠️</div>
              <div className="text-left">
                <p className="text-xs font-black text-[#043077] uppercase tracking-wide">Mantenimiento Preventivo</p>
                <p className="text-xs text-slate-500 font-medium italic">Calibrar molinos y presiones de grupo...</p>
              </div>
            </div>
          </div>

          {/* INTERACTIVE NAVIGATION MAP (GUIDE TO SYSTEM) */}
          <section className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm space-y-4">
            <div className="flex items-center gap-2">
              <HelpCircle className="w-5 h-5 text-[#043077]" />
              <h3 className="font-bold text-slate-900 font-display">Mapa de Módulos Activos</h3>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed max-w-3xl text-left">
              Este dashboard está diseñado con una estructura modular limpia. Para navegar entre los distintos espacios del negocio (Métricas, Productos, Surtido, etc.), usa la barra lateral en tu computador o despliega el menú móvil haciendo clic en el icono de hamburguesa en la esquina superior izquierda. 
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 pt-2">
              {APP_MODULES.map((m) => (
                <button
                  key={m.id}
                  onClick={() => selectModule(m.id)}
                  className={`p-3 rounded-xl border text-center transition-all ${
                    m.id === activeModule 
                      ? 'border-[#043077] bg-blue-50/50 text-[#043077] shadow-xs font-semibold' 
                      : 'border-slate-100 hover:border-slate-250 bg-slate-50/40 text-slate-600'
                  }`}
                >
                  <p className="text-xs truncate font-display font-medium leading-tight">{m.name}</p>
                  <span className="text-[9px] text-[#043077]/80 font-mono mt-0.5 block font-bold capitalize">Módulo Activo</span>
                </button>
              ))}
            </div>
          </section>

        </main>

      </div>
    </div>
  );
}
