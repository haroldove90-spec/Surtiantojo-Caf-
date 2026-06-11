import React, { useState, useEffect } from 'react';
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
  ArrowRight,
  Database,
  Download,
  Smartphone,
  Share2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import ModulePlaceholder from './components/ModulePlaceholder';
import { supabase } from './lib/supabase';

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

const INITIAL_PRODUCTS : any[] = [];

export default function App() {
  const [activeModule, setActiveModule] = useState<string>(() => {
    try {
      const stored = localStorage.getItem('surtiantojo_active_module');
      if (stored && APP_MODULES.some(m => m.id === stored)) {
        return stored;
      }
    } catch (e) {}
    return 'metrics';
  });
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(false);
  const [dbStatus, setDbStatus] = useState<'checking' | 'connected' | 'error'>('checking');

  // Sync active module to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('surtiantojo_active_module', activeModule);
    } catch (e) {}
  }, [activeModule]);
  
  // Real active catalog of products state - Purges the old sample IDs in case they are stored
  const [products, setProducts] = useState<any[]>(() => {
    try {
      const stored = localStorage.getItem('surtiantojo_products');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          // Permanently filter out the mock/sample items (IDs "1", "2", "3")
          let list = parsed.filter((p: any) => p && p.id !== "1" && p.id !== "2" && p.id !== "3");
          try {
            const storedDel = localStorage.getItem('surtiantojo_deleted_ids');
            const delArr = storedDel ? JSON.parse(storedDel) : [];
            if (Array.isArray(delArr) && delArr.length > 0) {
              list = list.filter((p: any) => p && !delArr.includes(p.id));
            }
          } catch (e) {}
          return list;
        }
      }
    } catch (e) {
      console.error("Error reading products list from localStorage", e);
    }
    return INITIAL_PRODUCTS;
  });

  // Local storage persistence sync
  useEffect(() => {
    localStorage.setItem('surtiantojo_products', JSON.stringify(products));
  }, [products]);

  
  // PWA installation and splash screen states
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showInstallModal, setShowInstallModal] = useState<boolean>(false);
  const [isSplashActive, setIsSplashActive] = useState<boolean>(true);

  // Sync PWA triggers and auto-dismiss splash layout
  useEffect(() => {
    // 2.2 seconds display time for the unencapsulated full-screen launch splash
    const splashTimer = setTimeout(() => {
      setIsSplashActive(false);
    }, 2200);

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      console.log('PWA installation prompt event captured.');
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      clearTimeout(splashTimer);
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  // Async connection verify ping to Supabase rest server
  useEffect(() => {
    async function checkSupabase() {
      try {
        const rawUrl = (import.meta as any).env?.VITE_SUPABASE_URL || 'https://kwumqqselehgrbppuoyu.supabase.co';
        const rawKey = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || '';
        if (!rawUrl) return;
        const urlObj = new URL(rawUrl);
        const res = await fetch(`${urlObj.origin}/rest/v1/`, {
          method: 'GET',
          headers: {
            'apikey': rawKey
          }
        });
        if (res.ok || res.status === 401 || res.status === 404) {
          setDbStatus('connected');
        } else {
          setDbStatus('error');
        }
      } catch (err) {
        console.error('Supabase query validation error:', err);
        setDbStatus('error');
      }
    }
    checkSupabase();
  }, []);

  // Helper to map robust product objects into the restricted Supabase 'products' table columns
  const mapProductToSupabase = (p: any) => {
    return {
      id: p.id,
      nombre: p.nombre || '',
      precio: Number(p.precio_venta || 0),
      categoria: 'json:' + JSON.stringify({
        codigo: p.codigo || '',
        proveedor: p.proveedor || '',
        piezas_por_caja: Number(p.piezas_por_caja || 0),
        precio_caja: Number(p.precio_caja || 0),
        precio_unidad: Number(p.precio_unidad || 0),
        status: p.status || 'Activo',
        forma_pago: p.forma_pago || 'Efectivo',
        precio_venta: Number(p.precio_venta || 0),
        margen_pct: Number(p.margen_pct || 0),
        precio_sugerido: Number(p.precio_sugerido || 0),
        margen_ps_pct: Number(p.margen_ps_pct || 0),
        cambio_precio_fecha: p.cambio_precio_fecha || '',
        notas: p.notas || '',
        resorte_usa: p.resorte_usa || '',
        existencias: Number(p.existencias || 0)
      }),
      popularidad_ventas: p.proveedor || '',
      disponible: p.status !== 'Inactivo',
      creado_en: p.created_at || new Date().toISOString()
    };
  };

  // Helper to parse database rows back into robust product objects
  const mapProductFromSupabase = (dbRow: any) => {
    const base = {
      id: dbRow.id,
      nombre: dbRow.nombre || '',
      precio_venta: Number(dbRow.precio || 0),
      created_at: dbRow.creado_en || dbRow.creado_en || new Date().toISOString()
    };

    if (dbRow.categoria && dbRow.categoria.startsWith('json:')) {
      try {
        const parsed = JSON.parse(dbRow.categoria.substring(5));
        return {
          ...base,
          ...parsed,
          // Guarantee numbers and string values
          piezas_por_caja: Number(parsed.piezas_por_caja || 0),
          precio_caja: Number(parsed.precio_caja || 0),
          precio_unidad: Number(parsed.precio_unidad || 0),
          precio_venta: Number(parsed.precio_venta || base.precio_venta || 0),
          margen_pct: Number(parsed.margen_pct || 0),
          precio_sugerido: Number(parsed.precio_sugerido || 0),
          margen_ps_pct: Number(parsed.margen_ps_pct || 0),
          existencias: Number(parsed.existencias || 0)
        };
      } catch (e) {
        console.error("Failed to parse nested json from category column:", e);
      }
    }

    // fallback for normal rows
    return {
      id: dbRow.id,
      nombre: dbRow.nombre || '',
      codigo: '',
      proveedor: dbRow.popularidad_ventas || '',
      piezas_por_caja: 0,
      precio_caja: 0,
      precio_unidad: Number(dbRow.precio || 0),
      status: dbRow.disponible ? 'Activo' : 'Inactivo',
      forma_pago: 'Efectivo',
      precio_venta: Number(dbRow.precio || 0),
      margen_pct: 0,
      precio_sugerido: Number(dbRow.precio || 0),
      margen_ps_pct: 0,
      cambio_precio_fecha: new Date().toISOString().split('T')[0],
      notas: '',
      resorte_usa: '',
      existencias: 10,
      created_at: dbRow.creado_en || new Date().toISOString()
    };
  };

  // Sync from Supabase table on load if status is 'connected'
  useEffect(() => {
    async function loadFromSupabase() {
      try {
        const { data, error } = await supabase
          .from('products')
          .select('*')
          .order('id', { ascending: true });
        
        if (error) {
          console.warn("Supabase pull warning: Table 'products' might not exist or lacks matching policies. Local storage remains fully operative.", error);
          return;
        }
        
        if (data && data.length > 0) {
          let delArr: string[] = [];
          try {
            const storedDel = localStorage.getItem('surtiantojo_deleted_ids');
            delArr = storedDel ? JSON.parse(storedDel) : [];
          } catch (e) {}

          const filtered = data
            .filter((p: any) => p && p.id !== "1" && p.id !== "2" && p.id !== "3")
            .map(mapProductFromSupabase)
            .filter((p: any) => !delArr.includes(p.id));
          setProducts(filtered);
          
          // Proactively delete any sample items with IDs "1", "2", "3" from Supabase if we found them
          const hasSamples = data.some((p: any) => p && ["1", "2", "3"].includes(p.id));
          if (hasSamples) {
            try {
              await supabase.from('products').delete().in('id', ["1", "2", "3"]);
            } catch (err) {
              console.warn("Could not prune sample products from Supabase table:", err);
            }
          }
        }
      } catch (err) {
        console.error("Error reading from Supabase table 'products':", err);
      }
    }
    if (dbStatus === 'connected') {
      loadFromSupabase();
    }
  }, [dbStatus]);

  // Integrated server + client callback triggers
  const handleAddProduct = async (newProd: any) => {
    const defaultId = crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 9);
    const fresh = {
      ...newProd,
      id: defaultId,
      created_at: new Date().toISOString()
    };

    setProducts(prev => [fresh, ...prev]);

    try {
      if (dbStatus === 'connected') {
        const mapped = mapProductToSupabase(fresh);
        const { error } = await supabase.from('products').insert([mapped]);
        if (error) console.warn("Supabase database insert warning:", error);
      }
    } catch (err) {
      console.error("Supabase insert error:", err);
    }
  };

  const handleAddMultipleProducts = async (newProds: any[]) => {
    if (!newProds || newProds.length === 0) return;
    
    const freshProds = newProds.map(prod => {
      const defaultId = crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 9);
      return {
        ...prod,
        id: defaultId,
        created_at: new Date().toISOString()
      };
    });

    setProducts(prev => [...freshProds, ...prev]);

    try {
      if (dbStatus === 'connected') {
        const mappedList = freshProds.map(p => mapProductToSupabase(p));
        // Bulk insert to Supabase for extremely fast and reliable database save
        const { error } = await supabase.from('products').insert(mappedList);
        if (error) {
          console.warn("Supabase database bulk insert warning:", error);
        } else {
          console.log(`Successfully bulk inserted ${freshProds.length} products to Supabase.`);
        }
      }
    } catch (err) {
      console.error("Supabase bulk insert error:", err);
    }
  };

  const handleUpdateProduct = async (id: string, updatedFields: any) => {
    let freshFullItem: any = null;
    setProducts(prev => prev.map(p => {
      if (p.id === id) {
        freshFullItem = { ...p, ...updatedFields };
        return freshFullItem;
      }
      return p;
    }));

    try {
      if (dbStatus === 'connected' && freshFullItem) {
        const mapped = mapProductToSupabase(freshFullItem);
        const { error } = await supabase.from('products').update(mapped).eq('id', id);
        if (error) console.warn("Supabase database update warning:", error);
      }
    } catch (err) {
      console.error("Supabase update error:", err);
    }
  };

  const handleDeleteProduct = async (id: string) => {
    // Record delete locally to prevent reappearances in case of network or DB RLS policy restrictions
    try {
      const storedDel = localStorage.getItem('surtiantojo_deleted_ids');
      const delArr = storedDel ? JSON.parse(storedDel) : [];
      if (!delArr.includes(id)) {
        delArr.push(id);
        localStorage.setItem('surtiantojo_deleted_ids', JSON.stringify(delArr));
      }
    } catch (e) {}

    setProducts(prev => prev.filter(p => p.id !== id));

    try {
      if (dbStatus === 'connected') {
        const { error } = await supabase.from('products').delete().eq('id', id);
        if (error) console.warn("Supabase database delete warning:", error);
      }
    } catch (err) {
      console.error("Supabase delete error:", err);
    }
  };


  // Trigger app installation prompt
  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      console.log(`PWA installation outcome: ${outcome}`);
      setDeferredPrompt(null);
    } else {
      // Show explicit manual guide modal (especially valuable for iOS/Safari or when running inside preview frames)
      setShowInstallModal(true);
    }
  };

  const selectModule = (id: string) => {
    setActiveModule(id);
    setIsMobileMenuOpen(false);
    
    // Automatically resets vertical scroll positioning for active modules
    setTimeout(() => {
      const mainContainer = document.getElementById('main-content');
      if (mainContainer) {
        mainContainer.scrollTo({ top: 0, behavior: 'smooth' });
      }
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }, 20);
  };

  const activeModuleData = APP_MODULES.find(m => m.id === activeModule) || APP_MODULES[0];

  // Current formatted date to display on top
  const formattedDate = "Hoy, 09:45 AM";

  return (
    <div className="min-h-screen bg-[#F1F5F9] flex flex-col font-sans text-slate-800 antialiased overflow-x-hidden max-w-full w-full">
      
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
              className="h-8 sm:h-9 max-w-[140px] w-auto object-contain transition-all duration-300"
            />
          </div>

          {/* Quick status bar display items */}
          <div className="flex items-center gap-3 md:gap-5">
            
            {/* Quick user avatar visual identifier */}
            <div id="header-user-badge" className="flex items-center gap-3">
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
      <div className="flex-grow flex w-full max-w-full overflow-x-hidden mx-auto relative min-w-0">
        
        {/* DESKTOP SIDEBAR - STYLED IN DEEP BLUE #043077 WITH PREMIUM GRADIENT */}
        <aside 
          id="desktop-sidebar" 
          className={`hidden lg:block transition-all duration-300 flex-shrink-0 sticky top-16 h-[calc(100vh-64px)] ${
            isSidebarCollapsed ? 'w-20' : 'w-64'
          } bg-gradient-to-b from-[#043077] to-[#011432] text-slate-300 overflow-y-auto scrollbar-thin`}
        >
          <div className="p-4 min-h-full flex flex-col justify-between gap-6">
            
            <div className="space-y-5">
              
              {/* Collapsible Sidebar Title */}
              {!isSidebarCollapsed && (
                <div className="px-3 py-1 text-[10px] font-extrabold text-blue-200/60 uppercase tracking-widest">
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
                      className={`w-full flex items-center gap-3.5 px-3.5 py-3 rounded-lg text-left transition-all duration-155 focus:outline-none text-base ${
                        isActive
                          ? 'bg-blue-500/20 text-blue-100 font-extrabold border-l-4 border-blue-400 shadow-xs'
                          : 'text-slate-200 hover:bg-white/5 hover:text-white transition-colors'
                      }`}
                    >
                      <IconComponent className={`w-5.5 h-5.5 flex-shrink-0 ${isActive ? 'text-blue-300 font-bold' : 'text-slate-400'}`} />
                      {!isSidebarCollapsed && (
                        <div className="overflow-hidden truncate flex-1">
                          <span className="block leading-none">{mod.name}</span>
                        </div>
                      )}
                    </button>
                  );
                })}
              </nav>

              {/* Premium mobile install app triggers incorporated in sidebar */}
              <div className="pt-2 border-t border-white/10">
                {!isSidebarCollapsed ? (
                  <div className="space-y-2">
                    <div className="px-3 text-[10px] font-extrabold text-blue-200/60 uppercase tracking-widest">
                      APLICATIVO MÓVIL
                    </div>
                    <button 
                      onClick={handleInstallClick}
                      className="w-full flex items-center justify-center gap-2.5 px-3.5 py-3 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 active:scale-95 transition-all text-white font-extrabold rounded-xl border border-emerald-400/20 shadow-md text-xs focus:outline-none cursor-pointer"
                      title="Instalar aplicación móvil de Surtiantojo"
                    >
                      <Download className="w-4 h-4 text-white animate-bounce shrink-0" />
                      <span className="block leading-none uppercase tracking-wider text-[10px]">Instalar App</span>
                    </button>
                  </div>
                ) : (
                  <div className="flex justify-center px-1">
                    <button 
                      onClick={handleInstallClick}
                      className="p-3 bg-gradient-to-br from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 active:scale-90 transition-all text-white rounded-lg shadow-md border border-emerald-400/20 focus:outline-none"
                      title="Instalar App móvil"
                    >
                      <Download className="w-4 h-4 text-white animate-bounce" />
                    </button>
                  </div>
                )}
              </div>

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
                className="absolute top-0 bottom-0 left-0 w-80 max-w-[calc(100vw-3rem)] bg-gradient-to-b from-[#043077] to-[#011432] text-slate-300 shadow-2xl flex flex-col justify-between p-6 overflow-y-auto scrollbar-none"
              >
                <div className="space-y-6">
                  
                  {/* Drawer header with close button */}
                  <div className="flex items-center justify-between border-b border-white/10 pb-4">
                    <div className="flex items-center gap-2.5">
                      <div>
                        <span className="font-extrabold text-lg block font-display text-white tracking-tight">Surtiantojo Café</span>
                        <span className="text-xs text-blue-200 font-mono font-bold uppercase tracking-wider block">Panel de Control</span>
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
                          className={`w-full flex items-center gap-3.5 px-3.5 py-3 rounded-lg text-left transition-colors focus:outline-none text-base ${
                            isActive
                              ? 'bg-blue-500/20 text-blue-100 font-extrabold border-l-4 border-blue-300'
                              : 'text-slate-200 hover:bg-white/5 hover:text-white'
                          }`}
                        >
                          <IconComponent className="w-5.5 h-5.5 flex-shrink-0 text-slate-300" />
                          <span className="flex-1 block truncate">{mod.name}</span>
                        </button>
                      );
                    })}
                  </nav>

                  {/* Mobile Install App Section */}
                  <div className="pt-4 border-t border-white/10 space-y-2">
                    <span className="text-[10px] font-extrabold text-blue-200/60 uppercase tracking-widest pl-2">
                      APLICACIÓN DISPOSITIVO
                    </span>
                    <button 
                      onClick={() => {
                        setIsMobileMenuOpen(false);
                        handleInstallClick();
                      }}
                      className="w-full flex items-center justify-center gap-2.5 px-3.5 py-3 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 active:scale-95 transition-all text-white font-extrabold rounded-xl border border-emerald-400/20 shadow-md text-xs focus:outline-none cursor-pointer"
                      title="Instalar aplicación móvil de Surtiantojo"
                    >
                      <Download className="w-4 h-4 text-white animate-bounce shrink-0" />
                      <span className="block leading-none uppercase tracking-wider text-[10px]">Instalar App Móvil</span>
                    </button>
                  </div>

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
        <main id="main-content" className="flex-1 min-w-0 p-4 sm:p-6 md:p-8 overflow-y-auto overflow-x-hidden flex flex-col gap-6 w-full max-w-full">
          
          {/* DYNAMIC COMPONENT RENDERER */}
          <div className="transition-all duration-300">
            <ModulePlaceholder 
              moduleId={activeModule} 
              products={products}
              onAddProduct={handleAddProduct}
              onAddProducts={handleAddMultipleProducts}
              onUpdateProduct={handleUpdateProduct}
              onDeleteProduct={handleDeleteProduct}
            />
          </div>

          {/* TWO DECORATIVE HIGH-DENSITY HIGHLIGHT RAIL PANELS - STYLED IN BRAND BLUE #043077 WITH GRADIENTS and ZERO COFFEE COLORS */}
          <div className="flex flex-col md:flex-row gap-4 mt-2">
            <div 
              onClick={() => selectModule('routes')}
              className="flex-1 h-24 bg-gradient-to-r from-blue-50 to-indigo-50 hover:from-blue-100/80 hover:to-indigo-100/80 rounded-2xl border border-blue-100 flex items-center px-6 gap-4 cursor-pointer transition-all shadow-xs"
            >
              <div className="p-3.5 bg-gradient-to-tr from-[#043077] to-blue-600 rounded-xl text-white text-2xl flex items-center justify-center shadow-sm">🚚</div>
              <div className="text-left">
                <p className="text-sm font-black text-[#043077] uppercase tracking-wide">Gestión de Rutas</p>
                <p className="text-xs text-slate-500 font-medium italic mt-0.5">Monitorear entrega e itinerarios activos...</p>
              </div>
            </div>
            <div 
              onClick={() => selectModule('maintenance')}
              className="flex-1 h-24 bg-gradient-to-r from-blue-50 to-indigo-50 hover:from-blue-100/80 hover:to-indigo-100/80 rounded-2xl border border-blue-100 flex items-center px-6 gap-4 cursor-pointer transition-all shadow-xs"
            >
              <div className="p-3.5 bg-gradient-to-tr from-[#043077] to-blue-600 rounded-xl text-white text-2xl flex items-center justify-center shadow-sm">🛠️</div>
              <div className="text-left">
                <p className="text-sm font-black text-[#043077] uppercase tracking-wide">Mantenimiento Preventivo</p>
                <p className="text-xs text-slate-500 font-medium italic mt-0.5">Calibrar molinos y presiones de grupo...</p>
              </div>
            </div>
          </div>

          {/* INTERACTIVE NAVIGATION MAP (GUIDE TO SYSTEM) */}
          <section className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm space-y-4">
            <div className="flex items-center gap-2">
              <HelpCircle className="w-6 h-6 text-[#043077]" />
              <h3 className="font-extrabold text-lg text-slate-900 font-display">Mapa de Módulos Activos</h3>
            </div>
            <p className="text-sm text-slate-500 leading-relaxed max-w-3xl text-left">
              Este dashboard está diseñado con una estructura modular limpia. Para navegar entre los distintos espacios del negocio (Métricas, Productos, Surtido, etc.), usa la barra lateral en tu computador o despliega el menú móvil haciendo clic en el icono de hamburguesa en la esquina superior izquierda. 
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 pt-2">
              {APP_MODULES.map((m) => (
                <button
                  key={m.id}
                  onClick={() => selectModule(m.id)}
                  className={`p-3.5 rounded-xl border text-center transition-all ${
                    m.id === activeModule 
                      ? 'border-[#043077] bg-blue-50/50 text-[#043077] shadow-xs font-extrabold' 
                      : 'border-slate-150 hover:border-slate-300 bg-slate-50/40 text-slate-700'
                  }`}
                >
                  <p className="text-sm truncate font-display font-medium leading-tight">{m.name}</p>
                  <span className="text-[10px] text-[#043077]/80 font-mono mt-0.5 block font-bold capitalize">Módulo Activo</span>
                </button>
              ))}
            </div>
          </section>

        </main>

      </div>

      {/* MANUAL PWA INSTALLATION HELPER STEP DIALOG */}
      <AnimatePresence>
        {showInstallModal && (
          <div id="pwa-install-modal-overlay" className="fixed inset-0 z-50 flex items-center justify-center p-4">
            
            {/* Opaque dark overlay backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.6 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowInstallModal(false)}
              className="absolute inset-0 bg-stone-950/80 backdrop-blur-xs"
            />

            {/* Modal Body Card */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-100 z-10 text-left"
            >
              <div className="p-6 bg-[#043077] text-white relative">
                <button
                  onClick={() => setShowInstallModal(false)}
                  className="absolute top-4 right-4 p-1.5 rounded-full bg-white/10 text-white hover:bg-white/20 transition-all focus:outline-none"
                  aria-label="Cerrar ventana"
                >
                  <X className="w-5 h-5" />
                </button>
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white/15 rounded-xl">
                    <Smartphone className="w-6 h-6 text-yellow-300" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-lg tracking-tight font-display">Instalar Surtiantojo</h3>
                    <p className="text-xs text-blue-200">Guía de instalación rápida para móviles</p>
                  </div>
                </div>
              </div>

              <div className="p-6 space-y-5 text-slate-700">
                
                {/* iOS Instructions Section */}
                <div className="space-y-2.5">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold px-2 py-0.5 rounded bg-blue-50 text-[#043077] font-mono border border-blue-100">iOS (iPhone / iPad)</span>
                  </div>
                  <ol className="list-decimal list-inside space-y-2 text-sm text-slate-600 pl-1 leading-relaxed">
                    <li>Abre esta página en el navegador <strong className="text-slate-900 font-extrabold">Safari</strong>.</li>
                    <li>
                      Toca el botón de <strong className="text-slate-900 font-extrabold">Compartir</strong> <Share2 className="w-4 h-4 inline-block text-blue-600 font-bold mx-0.5" /> en la parte inferior o menú de opciones.
                    </li>
                    <li>Selecciona <strong className="text-slate-900 font-extrabold">"Agregar a Pantalla de Inicio"</strong>.</li>
                    <li>Confirma arriba a la derecha indicando <strong className="text-[#043077] font-extrabold">"Agregar"</strong>.</li>
                  </ol>
                </div>

                <hr className="border-slate-100" />

                {/* Android / Desktop Instructions */}
                <div className="space-y-2.5">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold px-2 py-0.5 rounded bg-blue-50 text-[#043077] font-mono border border-blue-100">Android / Otros</span>
                  </div>
                  <p className="text-sm text-slate-600 leading-relaxed pl-1">
                    En navegadores como <strong className="text-slate-900">Chrome</strong> o Firefox, haz clic en los tres puntos de menú o pulsa directamente el botón <strong className="text-emerald-600">"Instalar App"</strong> en la cabecera superior para disfrutar del acceso directo instantáneo.
                  </p>
                </div>

                <div className="pt-2">
                  <button
                    onClick={() => setShowInstallModal(false)}
                    className="w-full py-3 bg-gradient-to-r from-blue-700 to-[#043077] hover:opacity-95 text-white font-extrabold text-sm rounded-xl transition-all text-center shadow-md focus:outline-none"
                  >
                    Entendido, ¡Listo!
                  </button>
                </div>

              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* INTEGRATED PREMIUM FULL SCREEN UNENCAPSULATED SPLASH SCREEN */}
      <AnimatePresence>
        {isSplashActive && (
          <motion.div 
            id="app-splash-screen"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.7, ease: 'easeInOut' }}
            className="fixed inset-0 z-50 bg-[#043077] flex flex-col items-center justify-center p-4 overflow-hidden"
          >
            <div className="w-full h-full max-w-lg max-h-[85vh] flex flex-col items-center justify-center relative">
              <img 
                src="https://cotecam.com//surtiantojo.jpg" 
                alt="Surtiantojo Splash Logo" 
                className="w-full h-full object-contain select-none transition-all"
                referrerPolicy="no-referrer"
              />
              <div className="absolute bottom-10 flex flex-col items-center gap-2">
                <div className="w-10 h-10 rounded-full border-4 border-white/20 border-t-emerald-400 animate-spin"></div>
                <p className="text-white/70 font-mono tracking-widest text-[11px] uppercase font-bold mt-2.5">Administración Surtiantojo</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
