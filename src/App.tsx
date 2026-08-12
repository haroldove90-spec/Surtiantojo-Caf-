import React, { useState, useEffect, useMemo } from 'react';
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
  Share2,
  LogOut,
  ShieldCheck,
  Lock,
  UserCheck,
  Eye,
  EyeOff
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import ModulePlaceholder from './components/ModulePlaceholder';
import { supabase } from './lib/supabase';

// Module structure matches requested Spanish names exactly
const APP_MODULES = [
  { id: 'metrics', name: 'Métricas', icon: TrendingUp, desc: 'Balance general de ventas y rentabilidad' },
  { id: 'products', name: 'Productos', icon: Coffee, desc: 'Catálogo y carta de cafés y postres' },
  { id: 'supply', name: 'Surtido', icon: ClipboardList, desc: 'Abastecimiento de granos, leche e insumos' },
  { id: 'operadores', name: 'Operadores', icon: Route, desc: 'Registro de ruta de operadores y máquinas' },
  { id: 'sales_by_product', name: 'Venta por producto', icon: BarChart3, desc: 'Rendimiento individual de consumibles' },
  { id: 'expenses', name: 'Gastos', icon: Wallet, desc: 'Egreso por servicios, renta e insumos' },
  { id: 'client_accounts', name: 'Cuentas clientes', icon: Users, desc: 'Premios de fidelidad y saldo VIP' },
  { id: 'employees', name: 'Empleados', icon: UserCheck, desc: 'Gestión y alta de repartidores y personal de surtido' },
  { id: 'profile', name: 'Perfil del usuario', icon: User, desc: 'Permisos de administradores y baristas' }
];

const INITIAL_PRODUCTS : any[] = [];

const DEFAULT_USERS = [
  { 
    username: 'karla_padilla', 
    nombre_completo: 'Karla Padilla', 
    correo: 'karla@surtiantojo.com.mx',
    whatsapp: '525512345678',
    rol: 'Administrador', 
    contrasena: 'KP_Admin_2026!' 
  },
  { 
    username: 'jonathan_moreno', 
    nombre_completo: 'Jonathan Moreno', 
    correo: 'jonathan@surtiantojo.com.mx',
    whatsapp: '525512345679',
    rol: 'Administrador', 
    contrasena: 'JM_Admin_2026!' 
  },
  { 
    username: 'juan_cedillo', 
    nombre_completo: 'Juan Manuel Cedillo', 
    correo: 'juan.cedillo@surtiantojo.com.mx',
    whatsapp: '525512345680',
    rol: 'Surtidor', 
    contrasena: 'JC_Surt_2026!' 
  },
  { 
    username: 'mario_guadalupe', 
    nombre_completo: 'Mario Guadalupe', 
    correo: 'mario.guadalupe@surtiantojo.com.mx',
    whatsapp: '525512345681',
    rol: 'Surtidor', 
    contrasena: 'MG_Surt_2026!' 
  },
  { 
    username: 'harold_anguiano', 
    nombre_completo: 'Harold Anguiano', 
    correo: 'harold@surtiantojo.com.mx',
    whatsapp: '525512345682',
    rol: 'Administrador', 
    contrasena: 'HA_Admin_2026!' 
  }
];

// Helper functions for durable session persistence across browser refreshes, tabs, and iframe sandbox reloads
const SESSION_KEY = 'surtiantojo_logged_user';

function getStoredUserSession(): any | null {
  try {
    const local = localStorage.getItem(SESSION_KEY);
    if (local) {
      const parsed = JSON.parse(local);
      if (parsed && typeof parsed === 'object' && parsed.username) return parsed;
    }
  } catch (e) {}

  try {
    const session = sessionStorage.getItem(SESSION_KEY);
    if (session) {
      const parsed = JSON.parse(session);
      if (parsed && typeof parsed === 'object' && parsed.username) return parsed;
    }
  } catch (e) {}

  try {
    const match = document.cookie.match(new RegExp('(^| )' + SESSION_KEY + '=([^;]+)'));
    if (match && match[2]) {
      const parsed = JSON.parse(decodeURIComponent(match[2]));
      if (parsed && typeof parsed === 'object' && parsed.username) return parsed;
    }
  } catch (e) {}

  try {
    if (window.name && window.name.startsWith('SESSION_USER:')) {
      const raw = window.name.substring('SESSION_USER:'.length);
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object' && parsed.username) return parsed;
    }
  } catch (e) {}

  return null;
}

function saveUserSession(user: any): void {
  if (!user) return;
  const jsonStr = JSON.stringify(user);

  try {
    localStorage.setItem(SESSION_KEY, jsonStr);
  } catch (e) {}

  try {
    sessionStorage.setItem(SESSION_KEY, jsonStr);
  } catch (e) {}

  try {
    const encoded = encodeURIComponent(jsonStr);
    document.cookie = `${SESSION_KEY}=${encoded}; max-age=${365 * 86400}; path=/; SameSite=Lax`;
  } catch (e) {}

  try {
    window.name = `SESSION_USER:${jsonStr}`;
  } catch (e) {}
}

function clearUserSession(): void {
  try {
    localStorage.removeItem(SESSION_KEY);
  } catch (e) {}

  try {
    sessionStorage.removeItem(SESSION_KEY);
  } catch (e) {}

  try {
    document.cookie = `${SESSION_KEY}=; max-age=0; path=/; SameSite=Lax`;
  } catch (e) {}

  try {
    if (window.name && window.name.startsWith('SESSION_USER:')) {
      window.name = '';
    }
  } catch (e) {}
}

export default function App() {
  const [currentUser, setCurrentUser] = useState<any | null>(() => {
    return getStoredUserSession();
  });

  const [usersList, setUsersList] = useState<any[]>(() => {
    try {
      const stored = localStorage.getItem('surtiantojo_users');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const existingUsernames = new Set(parsed.map((u: any) => String(u.username || '').toLowerCase()));
          const missingDefaults = DEFAULT_USERS.filter(d => !existingUsernames.has(d.username.toLowerCase()));
          return [...parsed, ...missingDefaults];
        }
      }
    } catch (e) {}
    return DEFAULT_USERS;
  });
  const [authError, setAuthError] = useState<string | null>(null);
  const [loginUsername, setLoginUsername] = useState<string>('');
  const [loginPassword, setLoginPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [loginLoading, setLoginLoading] = useState<boolean>(false);
  const [showCredsGuide, setShowCredsGuide] = useState<boolean>(true);

  const [isPreviewSurtidor, setIsPreviewSurtidor] = useState<boolean>(false);

  const [activeModule, setActiveModule] = useState<string>(() => {
    try {
      const userObj = getStoredUserSession();
      if (userObj) {
        if (userObj.rol === 'Operador' || userObj.rol === 'Surtidor') {
          return 'supply'; // Surtidor/Operator can only see "Surtido"
        }
      }
      if (window.location.hash) {
        const hashModule = window.location.hash.replace('#', '').split('/')[0];
        if (hashModule && APP_MODULES.some(m => m.id === hashModule)) {
          return hashModule;
        }
      }
      const storedModule = localStorage.getItem('surtiantojo_active_module');
      if (storedModule && APP_MODULES.some(m => m.id === storedModule)) {
        return storedModule;
      }
    } catch (e) {}
    return 'metrics';
  });

  // Automatically save logged-in user session on any change
  useEffect(() => {
    if (currentUser) {
      saveUserSession(currentUser);
    }
  }, [currentUser]);

  const isSurtidorOnly = useMemo(() => {
    if (!currentUser) return false;
    if (currentUser.rol === 'Surtidor' || currentUser.rol === 'Operador') return true;
    if (currentUser.rol === 'Administrador' && isPreviewSurtidor) return true;
    return false;
  }, [currentUser, isPreviewSurtidor]);

  const visibleModules = useMemo(() => {
    if (!currentUser) return [];
    if (isSurtidorOnly) {
      return APP_MODULES.filter(m => m.id === 'operadores');
    }
    // Deactivate 'client_accounts' (Cuentas clientes) for Admin role as requested
    return APP_MODULES.filter(m => m.id !== 'client_accounts');
  }, [currentUser, isSurtidorOnly]);

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(false);
  const [dbStatus, setDbStatus] = useState<'checking' | 'connected' | 'error'>('checking');

  // Sync active module to localStorage and window hash
  useEffect(() => {
    try {
      localStorage.setItem('surtiantojo_active_module', activeModule);
      const activeSub = localStorage.getItem('surtiantojo_active_submenu');
      if (activeModule === 'supply' && activeSub) {
        window.history.replaceState(null, '', `#${activeModule}/${activeSub}`);
      } else {
        window.history.replaceState(null, '', `#${activeModule}`);
      }
    } catch (e) {}
  }, [activeModule]);

  // Handle browser back/forward navigation or hash changes
  useEffect(() => {
    const handleHashChange = () => {
      try {
        if (window.location.hash) {
          const parts = window.location.hash.replace('#', '').split('/');
          const mod = parts[0];
          if (mod && APP_MODULES.some(m => m.id === mod)) {
            setActiveModule(mod);
          }
        }
      } catch (e) {}
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  // Lock Surtidor/Operator to Operadores module, and redirect Admin from client_accounts
  useEffect(() => {
    if (isSurtidorOnly && activeModule !== 'operadores') {
      setActiveModule('operadores');
    } else if (!isSurtidorOnly && activeModule === 'client_accounts') {
      setActiveModule('metrics');
    }
  }, [isSurtidorOnly, activeModule]);
  
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
  const [isSplashActive, setIsSplashActive] = useState<boolean>(() => {
    try {
      return sessionStorage.getItem('surtiantojo_splash_shown') !== 'true';
    } catch (e) {
      return true;
    }
  });

  // Sync PWA triggers and auto-dismiss splash layout
  useEffect(() => {
    try {
      const shown = sessionStorage.getItem('surtiantojo_splash_shown');
      if (shown === 'true') {
        setIsSplashActive(false);
      } else {
        sessionStorage.setItem('surtiantojo_splash_shown', 'true');
      }
    } catch (e) {}

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
        const rawKey = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt3dW1xcXNlbGVoZ3JicHB1b3l1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODEwMzM2MzksImV4cCI6MjA5NjYwOTYzOX0.LqXwIXQn2J7ku5c31kWHZsEp_zcEEHqUbWP8biU0pp8';
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
        console.log('Supabase query validation notice (offline/local fallback):', err);
        setDbStatus('error');
      }
    }
    checkSupabase();
  }, []);

  // Load / Sync users from Supabase 'usuarios' table
  useEffect(() => {
    async function syncUsers() {
      if (dbStatus !== 'connected') return;
      try {
        const { data, error } = await supabase
          .from('usuarios')
          .select('*')
          .order('username', { ascending: true });

        if (error) {
          console.log("Supabase 'usuarios' table is not available yet (using offline-first default credentials). Code:", error.code || error.message);
          return;
        }

        if (data && data.length > 0) {
          console.log("Successfully fetched users from Supabase 'usuarios' table:", data);
          setUsersList(data);
          
          // If logged in, update currentUser's role and details in case they changed in Supabase!
          if (currentUser) {
            const freshUser = data.find((u: any) => u.username.toLowerCase() === currentUser.username.toLowerCase());
            if (freshUser) {
              const hasChanged = freshUser.rol !== currentUser.rol || freshUser.nombre_completo !== currentUser.nombre_completo || freshUser.contrasena !== currentUser.contrasena;
              if (hasChanged) {
                console.log("Logged-in user role or details changed in Supabase. Syncing locally:", freshUser);
                setCurrentUser(freshUser);
                saveUserSession(freshUser);
                if (freshUser.rol === 'Operador' || freshUser.rol === 'Surtidor') {
                  setActiveModule('supply');
                }
              }
            }
          }
        } else {
          // If table exists but has no records, let's proactively seed it with default users!
          console.log("Supabase 'usuarios' table is empty. Seeding with default credentials...");
          const { error: seedError } = await supabase
            .from('usuarios')
            .insert(DEFAULT_USERS);
          if (seedError) {
            console.log("Could not seed default users in Supabase:", seedError);
          } else {
            console.log("Seeded default users in Supabase successfully.");
          }
        }
      } catch (err) {
        console.log("Error syncing users with Supabase:", err);
      }
    }
    syncUsers();
  }, [dbStatus, currentUser]);

  const handleLogin = async (usernameInput: string, passwordInput: string) => {
    setAuthError(null);
    const cleanedUser = usernameInput.trim().toLowerCase();
    const cleanedPass = passwordInput.trim();

    // 1. Try to check against the latest pulled/fetched users list
    let matchedUser = usersList.find(u => u.username.toLowerCase() === cleanedUser);

    // 2. If connected to Supabase, we can also perform a direct real-time fetch to guarantee we have the absolute latest credentials from Supabase!
    if (dbStatus === 'connected') {
      try {
        const { data, error } = await supabase
          .from('usuarios')
          .select('*')
          .eq('username', cleanedUser)
          .maybeSingle();
        
        if (!error && data) {
          matchedUser = data;
        }
      } catch (e) {
        console.log("Real-time login query notice:", e);
      }
    }

    if (!matchedUser) {
      setAuthError('Usuario no encontrado.');
      return false;
    }

    if (matchedUser.contrasena !== cleanedPass) {
      setAuthError('Contraseña incorrecta.');
      return false;
    }

    // Login successful!
    setCurrentUser(matchedUser);
    saveUserSession(matchedUser);
    
    if (matchedUser.rol === 'Operador' || matchedUser.rol === 'Surtidor') {
      setActiveModule('supply');
    } else {
      setActiveModule('metrics');
    }
    
    return true;
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setIsPreviewSurtidor(false);
    clearUserSession();
    setActiveModule('metrics'); // Reset module on logout
  };

  // Handlers for adding/updating/deleting employee user accounts
  const handleAddUserAccount = async (newUser: any) => {
    try {
      const filtered = usersList.filter(u => u.username.toLowerCase() !== newUser.username.toLowerCase());
      const updated = [newUser, ...filtered];
      setUsersList(updated);
      localStorage.setItem('surtiantojo_users', JSON.stringify(updated));

      if (dbStatus === 'connected') {
        const { error } = await supabase
          .from('usuarios')
          .upsert(newUser, { onConflict: 'username' });
        if (error) {
          console.warn("Supabase user insert notice:", error);
        }
      }
      return true;
    } catch (err) {
      console.error("Error adding user account:", err);
      return false;
    }
  };

  const handleUpdateUserAccount = async (username: string, userObj: any) => {
    try {
      const updated = usersList.map(u => u.username.toLowerCase() === username.toLowerCase() ? { ...u, ...userObj } : u);
      setUsersList(updated);
      localStorage.setItem('surtiantojo_users', JSON.stringify(updated));

      if (dbStatus === 'connected') {
        const { error } = await supabase
          .from('usuarios')
          .update(userObj)
          .eq('username', username);
        if (error) {
          console.warn("Supabase user update notice:", error);
        }
      }
      return true;
    } catch (err) {
      console.error("Error updating user account:", err);
      return false;
    }
  };

  const handleDeleteUserAccount = async (username: string) => {
    try {
      const updated = usersList.filter(u => u.username.toLowerCase() !== username.toLowerCase());
      setUsersList(updated);
      localStorage.setItem('surtiantojo_users', JSON.stringify(updated));

      if (dbStatus === 'connected') {
        const { error } = await supabase
          .from('usuarios')
          .delete()
          .eq('username', username);
        if (error) {
          console.warn("Supabase user delete notice:", error);
        }
      }
      return true;
    } catch (err) {
      console.error("Error deleting user account:", err);
      return false;
    }
  };

  // Helper to map robust product objects into the restricted Supabase 'products' table columns
  const mapProductToSupabase = (p: any) => {
    // Truncate notes and sanitize delimiters to safely fit in character varying(100) column
    const cleanNotes = String(p.notas || '').substring(0, 45).replace(/\|/g, ' ').trim();
    const statusVal = p.status || 'Activo';
    
    // We construct a custom positional pipe format:
    // "v1:codigo|piezas|precio_unidad|forma_pago|fecha|resorte|existencias|status|precio_caja|precio_sugerido|notas"
    const positional = [
      p.codigo || '',
      p.piezas_por_caja || 0,
      p.precio_unidad || 0,
      p.forma_pago || 'Efectivo',
      p.cambio_precio_fecha || '',
      p.resorte_usa || '',
      p.existencias || 0,
      statusVal,
      p.precio_caja || 0,
      p.precio_sugerido || 0,
      cleanNotes
    ].join('|');

    // Force strict 100-character upper ceiling to guarantee absolutely zero DB truncation errors
    const categoriaVal = `v1:${positional}`.substring(0, 100);

    return {
      id: p.id,
      nombre: p.nombre || '',
      precio: Number(p.precio_venta || 0),
      categoria: categoriaVal,
      popularidad_ventas: p.proveedor || '',
      disponible: statusVal !== 'Inactivo',
      creado_en: p.created_at || new Date().toISOString()
    };
  };

  // Helper to parse database rows back into robust product objects
  const mapProductFromSupabase = (dbRow: any) => {
    const base = {
      id: dbRow.id,
      nombre: dbRow.nombre || '',
      precio_venta: Number(dbRow.precio || 0),
      created_at: dbRow.creado_en || new Date().toISOString()
    };

    const catStr = dbRow.categoria || '';

    if (catStr.startsWith('json:')) {
      try {
        const parsed = JSON.parse(catStr.substring(5));
        return {
          ...base,
          ...parsed,
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
    } else if (catStr.startsWith('v1:')) {
      try {
        const parts = catStr.substring(3).split('|');
        const codigo = parts[0] || '';
        const piezas_por_caja = Number(parts[1] || 0);
        const precio_unidad = Number(parts[2] || 0);
        const forma_pago = parts[3] || 'Efectivo';
        const cambio_precio_fecha = parts[4] || '';
        const resorte_usa = parts[5] || '';
        const existencias = Number(parts[6] || 0);
        const status = parts[7] || 'Activo';
        const precio_caja = Number(parts[8] || 0);
        const precio_sugerido = Number(parts[9] || 0);
        const notas = parts[10] || '';

        // Safely infer prices and margins
        const precio_venta = base.precio_venta || precio_sugerido || 0;
        const margen_pct = precio_venta > 0 ? Number((((precio_venta - precio_unidad) / precio_venta) * 100).toFixed(2)) : 0;
        const margen_ps_pct = precio_sugerido > 0 ? Number((((precio_sugerido - precio_unidad) / precio_sugerido) * 100).toFixed(2)) : 0;

        return {
          ...base,
          codigo,
          proveedor: dbRow.popularidad_ventas || '',
          piezas_por_caja,
          precio_caja,
          precio_unidad,
          status,
          forma_pago,
          precio_venta,
          margen_pct,
          precio_sugerido,
          margen_ps_pct,
          cambio_precio_fecha,
          notas,
          resorte_usa,
          existencias
        };
      } catch (e) {
        console.error("Failed to parse positional string from category column:", e);
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
          
          // Merge local products (which may have been successfully imported but failed to save in Supabase due to initial RLS rules)
          setProducts(prev => {
            const existingIds = new Set(filtered.map(p => p.id));
            const localOnly = prev.filter(p => p && p.id && !existingIds.has(p.id) && !delArr.includes(p.id));
            return [...filtered, ...localOnly];
          });
          
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
        console.warn("Error reading from Supabase table 'products' (falling back to local storage):", err);
      }
    }
    if (dbStatus === 'connected') {
      loadFromSupabase();
    }
  }, [dbStatus]);

  // Robust RFC4122 v4 UUID generator that operates correctly in all contexts (including HTTP iframe sandboxes)
  const generateUUID = () => {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
      try {
        return crypto.randomUUID();
      } catch (e) {}
    }
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0;
      const v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  };

  // Integrated server + client callback triggers
  const handleAddProduct = async (newProd: any) => {
    const defaultId = generateUUID();
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
      console.warn("Supabase insert error:", err);
    }
  };

  const handleAddMultipleProducts = async (newProds: any[]) => {
    if (!newProds || newProds.length === 0) return;
    
    const freshProds = newProds.map(prod => {
      const defaultId = generateUUID();
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
          alert(`Error de base de datos al importar: ${error.message || 'No se pudieron guardar.'}`);
        } else {
          console.log(`Successfully bulk inserted ${freshProds.length} products to Supabase.`);
        }
      }
    } catch (err) {
      console.warn("Supabase bulk insert error:", err);
      alert('Error de conexión al guardar los productos en la base de datos.');
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
      console.warn("Supabase update error:", err);
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
      console.warn("Supabase delete error:", err);
    }
  };

  const handleUpdateProductStatusBulk = async (ids: string[], targetStatus: 'Activo' | 'Inactivo') => {
    setProducts(prev => prev.map(p => {
      if (ids.includes(p.id)) {
        return { ...p, status: targetStatus };
      }
      return p;
    }));

    try {
      if (dbStatus === 'connected' && ids.length > 0) {
        const { error } = await supabase
          .from('products')
          .update({ status: targetStatus })
          .in('id', ids);
        if (error) console.warn("Supabase database bulk status update warning:", error);
      }
    } catch (err) {
      console.warn("Supabase bulk status update error:", err);
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

  const activeModuleData = useMemo(() => {
    const found = APP_MODULES.find(m => m.id === activeModule) || APP_MODULES[0];
    if (isSurtidorOnly && found.id === 'supply') {
      return { ...found, name: 'Surtidos' };
    }
    return found;
  }, [activeModule, isSurtidorOnly]);

  // Current formatted date to display on top
  const formattedDate = "Hoy, 09:45 AM";

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-4 relative font-sans text-slate-200 antialiased overflow-y-auto w-full">
        {/* Splash screen when loading first time */}
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

        <div className="w-full max-w-md mx-auto my-8 bg-slate-800 rounded-3xl shadow-2xl border border-slate-700/50 overflow-hidden">
          <div className="p-8 bg-[#043077] text-center flex flex-col items-center border-b border-blue-900/40">
            <img 
              src="https://cotecam.com//surtiantojo.jpg" 
              alt="Surtiantojo" 
              referrerPolicy="no-referrer"
              className="h-16 sm:h-20 object-contain mb-4 rounded-xl shadow-md border border-white/10"
            />
            <h2 className="text-xl font-black text-white tracking-tight font-display">
              Acceso al Sistema
            </h2>
            <p className="text-xs text-blue-200 mt-1">
              Ingresa tus credenciales para administrar Surtiantojo
            </p>
          </div>

          <form 
            onSubmit={async (e) => {
              e.preventDefault();
              setLoginLoading(true);
              const ok = await handleLogin(loginUsername, loginPassword);
              setLoginLoading(false);
              if (ok) {
                setLoginUsername('');
                setLoginPassword('');
              }
            }}
            className="p-8 space-y-5"
          >
            {authError && (
              <div className="p-3.5 bg-red-500/10 border border-red-500/20 text-red-300 rounded-xl text-xs font-bold flex items-center gap-2.5">
                <div className="w-2 h-2 rounded-full bg-red-500 animate-ping shrink-0" />
                <span>{authError}</span>
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                Nombre de Usuario
              </label>
              <div className="relative">
                <input 
                  type="text"
                  required
                  value={loginUsername}
                  onChange={(e) => setLoginUsername(e.target.value)}
                  placeholder="Nombre de usuario"
                  className="w-full pl-10 pr-4 py-3 bg-slate-900/60 border border-slate-700 rounded-xl text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors text-sm"
                />
                <UserCheck className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                Contraseña
              </label>
              <div className="relative">
                <input 
                  type={showPassword ? "text" : "password"}
                  required
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full pl-10 pr-10 py-3 bg-slate-900/60 border border-slate-700 rounded-xl text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors text-sm"
                />
                <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
                <button
                  type="button"
                  onClick={() => setShowPassword(prev => !prev)}
                  className="absolute right-3.5 top-3.5 text-slate-500 hover:text-slate-300 focus:outline-none transition-colors"
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loginLoading}
              className="w-full py-3.5 bg-gradient-to-r from-blue-600 to-[#043077] hover:from-blue-500 hover:to-blue-700 disabled:opacity-55 active:scale-[0.98] text-white font-extrabold text-sm rounded-xl transition-all shadow-md focus:outline-none cursor-pointer flex items-center justify-center gap-2"
            >
              {loginLoading ? (
                <div className="w-5 h-5 rounded-full border-2 border-white/20 border-t-white animate-spin" />
              ) : (
                <>
                  <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0" />
                  <span>Iniciar Sesión</span>
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen lg:h-screen lg:overflow-hidden bg-[#F1F5F9] flex flex-col font-sans text-slate-800 antialiased overflow-x-hidden max-w-full w-full">
      
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
            
            {/* Shortcut for Admin to test Surtidor view */}
            {currentUser?.rol === 'Administrador' && (
              <button
                onClick={() => {
                  const next = !isPreviewSurtidor;
                  setIsPreviewSurtidor(next);
                  if (next) {
                    setActiveModule('supply');
                  }
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-extrabold flex items-center gap-1.5 transition-all shadow-xs cursor-pointer ${
                  isPreviewSurtidor
                    ? 'bg-amber-400 text-amber-950 ring-2 ring-amber-300 animate-pulse'
                    : 'bg-white/15 text-white hover:bg-white/25 border border-white/20'
                }`}
                title={isPreviewSurtidor ? "Volver a vista Administrador" : "Probar o ver pantalla con el rol de Surtidor"}
              >
                <Eye className="w-4 h-4 text-amber-300 shrink-0" />
                <span className="hidden sm:inline">
                  {isPreviewSurtidor ? 'Salir Vista Surtidor' : 'Atajo: Vista Surtidor'}
                </span>
                <span className="sm:hidden">
                  {isPreviewSurtidor ? 'Admin' : 'Surtidor'}
                </span>
              </button>
            )}

            {/* Quick user avatar visual identifier */}
            <div id="header-user-badge" className="flex items-center gap-3">
              <div className="hidden md:flex flex-col items-end text-right">
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-300">
                  {currentUser?.rol || 'Administrador'}
                </span>
                <span className="text-sm font-semibold text-white leading-tight">
                  {currentUser?.nombre_completo || 'Usuario'}
                </span>
              </div>
              <div className="w-10 h-10 rounded-full bg-white/15 border-2 border-white/20 flex items-center justify-center text-white font-bold shadow-sm font-mono text-sm">
                {(currentUser?.nombre_completo || 'GS')
                  .split(' ')
                  .map((n: string) => n[0])
                  .join('')
                  .substring(0, 2)
                  .toUpperCase()}
              </div>
              {currentUser && (
                <button
                  onClick={handleLogout}
                  className="p-2 ml-1 rounded-lg text-blue-200 hover:text-white hover:bg-white/10 transition-colors focus:outline-none cursor-pointer flex items-center gap-1.5"
                  title="Cerrar sesión"
                >
                  <LogOut className="w-5 h-5 shrink-0 text-red-400" />
                  <span className="hidden sm:inline text-xs text-blue-200 hover:text-white">Salir</span>
                </button>
              )}
            </div>

          </div>

        </div>
      </header>

      {/* DETAILED CONTENT AREA & SIDEBAR */}
      <div className="flex-grow flex w-full max-w-full overflow-x-hidden mx-auto relative min-w-0 lg:h-[calc(100vh-64px)] lg:overflow-hidden">
        
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
                {visibleModules.map((mod) => {
                  const IconComponent = mod.icon;
                  const isActive = mod.id === activeModule;
                  return (
                    <button
                      key={`desktop-mod-${mod.id}`}
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
                    {visibleModules.map((mod) => {
                      const IconComponent = mod.icon;
                      const isActive = mod.id === activeModule;
                      return (
                        <button
                          key={`mobile-mod-${mod.id}`}
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
                  <span className="text-[10px] text-slate-400 font-mono block">Módulos habilitados: {visibleModules.length}</span>
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
          
          {/* Banner notice when Admin is previewing Surtidor role */}
          {currentUser?.rol === 'Administrador' && isPreviewSurtidor && (
            <div className="bg-amber-500/15 border border-amber-500/30 text-amber-900 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-amber-500 text-white rounded-xl font-extrabold text-xs shrink-0 flex items-center gap-1">
                  <Eye className="w-4 h-4" />
                  <span>Vista Surtidor</span>
                </div>
                <div>
                  <p className="text-xs font-black text-amber-950">MODO VISTA PREVIA: ROL SURTIDOR / REPARTIDOR</p>
                  <p className="text-[11px] text-amber-800 font-medium leading-relaxed">
                    Estás viendo el panel exactamente como lo ve un Surtidor. Únicamente se muestra el módulo <strong>Surtidos</strong>.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsPreviewSurtidor(false)}
                className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-black rounded-xl shadow-xs shrink-0 cursor-pointer transition-all"
              >
                Volver a Vista Admin ↩️
              </button>
            </div>
          )}

          {/* DYNAMIC COMPONENT RENDERER */}
          <div className="transition-all duration-300">
            <ModulePlaceholder 
              moduleId={activeModule} 
              products={products}
              onAddProduct={handleAddProduct}
              onAddProducts={handleAddMultipleProducts}
              onUpdateProduct={handleUpdateProduct}
              onDeleteProduct={handleDeleteProduct}
              onUpdateProductStatusBulk={handleUpdateProductStatusBulk}
              currentUser={currentUser}
              isPreviewSurtidor={isPreviewSurtidor}
              usersList={usersList}
              onAddUserAccount={handleAddUserAccount}
              onUpdateUserAccount={handleUpdateUserAccount}
              onDeleteUserAccount={handleDeleteUserAccount}
            />
          </div>

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
