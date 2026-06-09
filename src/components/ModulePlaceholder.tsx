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
  AlertTriangle
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
      transition: { duration: 0.5, ease: "easeOut" }
    }
  };

  const badgeVariants = {
    pulse: {
      scale: [1, 1.03, 1],
      opacity: [0.9, 1, 0.9],
      transition: {
        duration: 3,
        repeat: Infinity,
        ease: "easeInOut"
      }
    }
  };

  // Helper render for the stylized background mockup depending on the module
  const renderMockupBackground = () => {
    switch (moduleId) {
      case 'metrics':
        return (
          <div className="space-y-6 opacity-30 select-none pb-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 rounded-xl bg-stone-200/50 border border-stone-300/40">
                <span className="text-stone-500 text-xs font-medium block">Ventas del Día</span>
                <span className="text-2xl font-bold font-display text-stone-900">$12,450.00</span>
              </div>
              <div className="p-4 rounded-xl bg-stone-200/50 border border-stone-300/40">
                <span className="text-stone-500 text-xs font-medium block">Ticket Promedio</span>
                <span className="text-2xl font-bold font-display text-stone-900">$85.50</span>
              </div>
              <div className="p-4 rounded-xl bg-stone-200/50 border border-stone-300/40">
                <span className="text-stone-500 text-xs font-medium block">Clientes Atendidos</span>
                <span className="text-2xl font-bold font-display text-stone-900">146</span>
              </div>
            </div>
            <div className="p-5 rounded-xl bg-stone-200/40 border border-stone-300/30 h-40 flex items-end justify-between px-8">
              <div className="w-1/12 h-1/4 bg-stone-400/50 rounded-t-md"></div>
              <div className="w-1/12 h-1/2 bg-stone-400/50 rounded-t-md"></div>
              <div className="w-1/12 h-1/3 bg-stone-400/50 rounded-t-md"></div>
              <div className="w-1/12 h-2/3 bg-stone-400/50 rounded-t-md"></div>
              <div className="w-1/12 h-3/4 bg-amber-800/40 rounded-t-md"></div>
              <div className="w-1/12 h-1/2 bg-stone-400/50 rounded-t-md"></div>
              <div className="w-1/12 h-5/6 bg-amber-800/50 rounded-t-md"></div>
            </div>
          </div>
        );

      case 'products':
        return (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 opacity-30 select-none pb-4">
            {[
              { name: 'Café Americano 12oz', price: '$35' },
              { name: 'Capuchino Aromático 16oz', price: '$48' },
              { name: 'Espresso Intenso Doble', price: '$30' },
              { name: 'Rebanada Pastel Tres Leches', price: '$55' },
              { name: 'Cuernito de Mantequilla', price: '$28' },
              { name: 'Muffin de Arándanos', price: '$32' },
            ].map((prod, i) => (
              <div key={i} className="p-4 rounded-xl bg-stone-200/50 border border-stone-300/40 space-y-2">
                <div className="w-full h-24 bg-stone-300/60 rounded-lg flex items-center justify-center">
                  <Coffee className="w-8 h-8 text-stone-400" />
                </div>
                <div className="text-stone-800 text-sm font-semibold truncate">{prod.name}</div>
                <div className="text-amber-800 text-xs font-bold">{prod.price}</div>
              </div>
            ))}
          </div>
        );

      case 'supply':
        return (
          <div className="space-y-4 opacity-30 select-none pb-4">
            {[
              { item: 'Grano Café Blend Surtiantojo', stock: '2.5 kg', status: 'Bajo stock' },
              { item: 'Leche Entera Premium (Cajas)', stock: '12 pzas', status: 'Suficiente' },
              { item: 'Vasos Desechables 12oz', stock: '150 pzas', status: 'Crítico' },
              { item: 'Azúcar Refinada Mascabado', stock: '5.0 kg', status: 'Suficiente' },
            ].map((sup, i) => (
              <div key={i} className="flex justify-between items-center p-3 rounded-lg bg-stone-200/50 border border-stone-300/40">
                <div className="flex items-center gap-3">
                  <ClipboardList className="w-5 h-5 text-stone-500" />
                  <span className="text-sm font-medium text-stone-800">{sup.item}</span>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-xs font-mono font-bold text-stone-700">{sup.stock}</span>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                    sup.status === 'Crítico' ? 'bg-red-200 text-red-800' :
                    sup.status === 'Bajo stock' ? 'bg-amber-200 text-amber-800' : 'bg-green-200 text-green-800'
                  }`}>{sup.status}</span>
                </div>
              </div>
            ))}
          </div>
        );

      case 'sales_by_product':
        return (
          <div className="space-y-4 opacity-30 select-none pb-4">
            <div className="flex items-center justify-between text-xs text-stone-500 font-bold border-b border-stone-300 pb-2">
              <span>PRODUCTO</span>
              <span>CANTIDAD VENDIDA</span>
              <span>TOTAL VENTAS</span>
            </div>
            {[
              { name: 'Capuchino Vainilla 16oz', qty: '84 pzas', revenue: '$4,032.00' },
              { name: 'Café de Olla Dulce 12oz', qty: '72 pzas', revenue: '$2,160.00' },
              { name: 'Cuernito con Jamón y Queso', qty: '48 pzas', revenue: '$2,160.00' },
              { name: 'Pan de Muerto Mini', qty: '44 pzas', revenue: '$1,100.00' },
            ].map((sale, i) => (
              <div key={i} className="flex justify-between items-center text-sm text-stone-700 py-1">
                <span className="font-semibold text-stone-900">{sale.name}</span>
                <span className="font-mono">{sale.qty}</span>
                <span className="font-mono text-amber-900 font-bold">{sale.revenue}</span>
              </div>
            ))}
          </div>
        );

      case 'expenses':
        return (
          <div className="space-y-3 opacity-30 select-none pb-4">
            {[
              { concept: 'Compra de Frascos y Empaques', cat: 'Insumos', cost: '$1,850.00', date: '08 Jun' },
              { concept: 'Recibo de Luz CFE', cat: 'Servicios', cost: '$3,400.00', date: '05 Jun' },
              { concept: 'Refacciones Molino Espresso', cat: 'Mantenimiento', cost: '$980.00', date: '02 Jun' },
              { concept: 'Gas LP cilindro 30kg', cat: 'Servicios', cost: '$680.00', date: '28 May' },
            ].map((exp, i) => (
              <div key={i} className="flex justify-between p-3 rounded-lg bg-stone-200/50 border border-stone-300/40">
                <div>
                  <div className="text-sm font-semibold text-stone-800">{exp.concept}</div>
                  <div className="text-xs text-stone-500 flex gap-2"><span>{exp.date}</span>•<span>{exp.cat}</span></div>
                </div>
                <div className="text-sm font-bold text-red-800 font-mono self-center">{exp.cost}</div>
              </div>
            ))}
          </div>
        );

      case 'client_accounts':
        return (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 opacity-30 select-none pb-4">
            {[
              { name: 'Gabriela Martínez', activeStamps: 7, totalCofees: 32, phone: '55-1234-5678' },
              { name: 'Carlos Mendoza', activeStamps: 4, totalCofees: 18, phone: '55-9876-5432' },
              { name: 'Sofía Rodríguez (VIP)', activeStamps: 9, totalCofees: 57, phone: '55-4321-8765' },
              { name: 'Héctor Vega', activeStamps: 1, totalCofees: 11, phone: '55-3456-7890' },
            ].map((client, i) => (
              <div key={i} className="p-4 rounded-xl bg-stone-200/50 border border-stone-300/40 space-y-3">
                <div>
                  <div className="text-sm font-bold text-stone-900">{client.name}</div>
                  <div className="text-xs text-stone-500">{client.phone}</div>
                </div>
                <div className="space-y-1">
                  <span className="text-[10px] text-stone-500 font-bold block">PUNTOS DE FIDELIDAD (CAFÉS):</span>
                  <div className="flex gap-1.5">
                    {Array.from({ length: 10 }).map((_, stampIdx) => (
                      <div 
                        key={stampIdx} 
                        className={`w-5 h-5 rounded-full flex items-center justify-center text-[8px] font-bold ${
                          stampIdx < client.activeStamps 
                            ? 'bg-amber-800 text-white' 
                            : 'bg-stone-300 text-stone-500 border border-stone-400/30'
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
        );

      case 'routes':
        return (
          <div className="space-y-4 opacity-30 select-none pb-4">
            <div className="p-4 rounded-xl border border-stone-300 bg-stone-200/50 h-36 relative flex items-center justify-center overflow-hidden">
              <div className="absolute inset-0 bg-[radial-gradient(#8b5c1a_1px,transparent_1px)] [background-size:16px_16px] opacity-10"></div>
              {/* Fake Route path */}
              <svg className="w-full h-full absolute inset-0 text-amber-900/30" stroke="currentColor" strokeWidth="2" strokeDasharray="4 4" fill="none">
                <path d="M 30,80 Q 150,20 280,70 T 500,40" />
              </svg>
              <div className="absolute top-10 left-8 bg-stone-100 p-1.5 rounded border border-stone-300 text-[10px] font-bold flex items-center gap-1">
                <MapPin className="w-3 h-3 text-amber-800" />
                <span>Café Matriz</span>
              </div>
              <div className="absolute bottom-5 right-24 bg-stone-100 p-1.5 rounded border border-stone-300 text-[10px] font-bold flex items-center gap-1">
                <MapPin className="w-3 h-3 text-amber-800" />
                <span>Sucursal Norte (Envío #3)</span>
              </div>
            </div>
            <div className="text-xs text-stone-600 font-mono flex justify-between">
              <span>Camión de reparto: Ruta activa #1</span>
              <span>3 paradas programadas</span>
            </div>
          </div>
        );

      case 'maintenance':
        return (
          <div className="space-y-4 opacity-30 select-none pb-4">
            {[
              { eq: 'Máquina Espresso Italiana', task: 'Descalcificación y limpieza del grupo', every: 'Cada 3 meses', due: 'En 12 días' },
              { eq: 'Molino de Café Principal', task: 'Cambio de fresas cónicas', every: 'Anual / 400 kgs', due: 'A tiempo' },
              { eq: 'Refrigerador Vitrina Postres', task: 'Limpieza profunda de condensador', every: 'Cada 6 meses', due: 'Ayer' },
            ].map((maint, i) => (
              <div key={i} className="p-3 rounded-lg bg-stone-200/50 border border-stone-300/40">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="text-sm font-bold text-stone-900">{maint.eq}</h4>
                    <p className="text-xs text-stone-600">{maint.task}</p>
                  </div>
                  <span className={`text-[9px] px-2 py-0.5 rounded font-bold uppercase ${
                    maint.due === 'Ayer' ? 'bg-red-200 text-red-800' : 'bg-stone-300 text-stone-700'
                  }`}>{maint.due}</span>
                </div>
              </div>
            ))}
          </div>
        );

      case 'profile':
        return (
          <div className="opacity-30 select-none pb-4 space-y-4">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-stone-400 flex items-center justify-center">
                <User className="w-8 h-8 text-stone-200" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-stone-900">Eduardo Torres</h3>
                <p className="text-xs text-amber-800 font-bold">Propietario / Administrador Principal</p>
                <p className="text-[10px] text-stone-500">Surtiantojo Café S.A. de C.V.</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="bg-stone-200/50 p-2.5 rounded-lg">
                <span className="text-[10px] text-stone-500 font-bold block">CORREO</span>
                <span>eduardo@surtiantojocafe.com</span>
              </div>
              <div className="bg-stone-200/50 p-2.5 rounded-lg">
                <span className="text-[10px] text-stone-500 font-bold block">TELÉFONO</span>
                <span>55-4321-1234</span>
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
          color: "border-amber-500 bg-amber-500/5",
          accentColor: "text-amber-800"
        };
      case 'products':
        return {
          title: "Catálogo de Productos",
          desc: "Administra el menú de bebidas, postres, desayunos y paquetes de Surtiantojo Café con precios y categorías.",
          color: "border-orange-500 bg-orange-500/5",
          accentColor: "text-orange-800"
        };
      case 'supply':
        return {
          title: "Surtido & Abastecimiento",
          desc: "Controla compras de insumos (grano de café, leche, tazas, empaques) con alertas de niveles de reabastecimiento.",
          color: "border-amber-600 bg-amber-600/5",
          accentColor: "text-amber-900"
        };
      case 'sales_by_product':
        return {
          title: "Venta por Producto",
          desc: "Analiza el top de bebidas más vendidas, alimentos favoritos de los clientes y horas de mayor consumo.",
          color: "border-yellow-600 bg-yellow-600/5",
          accentColor: "text-amber-800"
        };
      case 'expenses':
        return {
          title: "Control de Gastos",
          desc: "Registra egresos operativos, pago de nómina, renta local, mantenimientos y servicios para balance neto.",
          color: "border-red-500 bg-red-500/5",
          accentColor: "text-red-800"
        };
      case 'client_accounts':
        return {
          title: "Cuentas y Clientes",
          desc: "Fidelización de clientes habituales. Con la tarjeta digital acumulan tazas de café y obtienen descuentos.",
          color: "border-emerald-500 bg-emerald-500/5",
          accentColor: "text-emerald-800"
        };
      case 'routes':
        return {
          title: "Rutas de Despacho",
          desc: "Monitorea entregas de insumos a sucursales secundarias y rutas de pedidos especiales a domicilio.",
          color: "border-blue-500 bg-blue-500/5",
          accentColor: "text-blue-800"
        };
      case 'maintenance':
        return {
          title: "Mantenimiento Preventivo",
          desc: "Calendariza limpieza de caldera, descalcificación espresso, calibración de molinos y revisión de refrigeración.",
          color: "border-indigo-500 bg-indigo-500/5",
          accentColor: "text-indigo-800"
        };
      case 'profile':
        return {
          title: "Mi Perfil de Usuario",
          desc: "Configura tus datos de contacto, accesos de seguridad, roles del personal y preferencias del sistema.",
          color: "border-stone-500 bg-stone-500/5",
          accentColor: "text-stone-800"
        };
      default:
        return {
          title: "Módulo del Sistema",
          desc: "Administración integral de la operación de Surtiantojo Café.",
          color: "border-amber-500 bg-amber-500/5",
          accentColor: "text-amber-800"
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
      className="bg-white rounded-3xl shadow-xl shadow-stone-100 border border-stone-200/60 overflow-hidden relative"
    >
      {/* Decorative top colored border line */}
      <div className={`h-1.5 w-full bg-gradient-to-r from-amber-800 to-amber-600`} />

      <div className="p-6 md:p-8 space-y-6">
        {/* Module Header Inside */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-stone-100 pb-5">
          <div className="space-y-1">
            <span className="text-[10px] tracking-widest font-extrabold uppercase text-amber-800 font-display">SURTIANTOJO CAFÉ • SISTEMA</span>
            <h2 className="text-2xl md:text-3xl font-extrabold font-display text-stone-900 tracking-tight flex items-center gap-2">
              {meta.title}
            </h2>
            <p className="text-stone-500 text-sm max-w-2xl leading-relaxed">
              {meta.desc}
            </p>
          </div>
          <div className="flex-shrink-0 self-start sm:self-center">
            {/* Soft pulsing coming soon indicator */}
            <motion.div 
              variants={badgeVariants}
              animate="pulse"
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-amber-50 border border-amber-200 text-amber-900 text-xs font-bold font-mono shadow-sm"
            >
              <Clock className="w-3.5 h-3.5 animate-spin duration-3000 text-amber-800" />
              <span>Próximamente</span>
            </motion.div>
          </div>
        </div>

        {/* The dynamic visual layout covered by blur */}
        <div className="relative rounded-2xl bg-stone-50 p-6 md:p-8 min-h-[220px] flex flex-col justify-between overflow-hidden border border-stone-200/40">
          
          {/* Backgroud mockup preview component strictly inert */}
          {renderMockupBackground()}

          {/* Absolute glassmorphic center overlay card displaying elegant Coming Soon messages */}
          <div className="absolute inset-0 bg-white/70 backdrop-blur-[6px] flex flex-col items-center justify-center p-6 text-center transition-all duration-300">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.15 }}
              className="max-w-md bg-white border border-stone-200/80 p-6 md:p-8 rounded-2xl shadow-xl shadow-stone-200/50 space-y-4"
            >
              <div className="inline-flex p-3 rounded-2xl bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-100 text-amber-800 shadow-sm">
                <Coffee className="w-8 h-8 text-amber-800 animate-pulse" />
              </div>
              <div className="space-y-1">
                <span className="text-[10px] font-extrabold tracking-wider text-amber-800 uppercase block font-mono">ESTADO DE ACTIVACIÓN</span>
                <h3 className="text-xl font-bold font-display text-stone-950">Implementación en Curso</h3>
                <p className="text-stone-600 text-xs leading-relaxed mt-1">
                  Este módulo operativo ya se encuentra preconfigurado y registrado en la barra de navegación del negocio. Los servicios y base de datos locales estarán disponibles en la siguiente fase de desarrollo.
                </p>
              </div>
              <div className="pt-2">
                <span className="inline-flex items-center gap-1 text-[11px] font-mono font-bold text-amber-900 bg-amber-50 px-2.5 py-1 rounded-md">
                  <CheckCircle2 className="w-3.5 h-3.5 text-amber-700" />
                  Listo para Inyecciones
                </span>
                <span className="block text-[9px] text-stone-400 mt-1.5 font-mono">Surtiantojo Café Dashboard • v1.0.0</span>
              </div>
            </motion.div>
          </div>

        </div>

        {/* Feature projection details under mockup */}
        <div className="p-5 rounded-2xl bg-stone-50 border border-stone-200/40 space-y-3">
          <h4 className="text-xs font-bold text-stone-800 tracking-wider uppercase font-mono">¿Qué incluirá este módulo?</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs text-stone-600 leading-relaxed pl-1">
            {moduleId === 'metrics' && (
              <>
                <div className="flex items-center gap-2">✔ Comparativas de ingresos semanales y mensuales</div>
                <div className="flex items-center gap-2">✔ Gráficos interactivos de utilidad de ventas (Margen Neto)</div>
                <div className="flex items-center gap-2">✔ Alertas automáticas de rentabilidad por café servido</div>
                <div className="flex items-center gap-2">✔ Exportación a Excel, PDF y hojas contables</div>
              </>
            )}
            {moduleId === 'products' && (
              <>
                <div className="flex items-center gap-2">✔ Alta, baja y edición rápida de platillos y cafés</div>
                <div className="flex items-center gap-2">✔ Categorías personalizadas (Cafetería, Repostería, Combos)</div>
                <div className="flex items-center gap-2">✔ Configuración de modificadores (leche de almendra, extras)</div>
                <div className="flex items-center gap-2">✔ Carga de imágenes optimizadas para cada consumible</div>
              </>
            )}
            {moduleId === 'supply' && (
              <>
                <div className="flex items-center gap-2">✔ Registro automático de stock al finalizar turnos</div>
                <div className="flex items-center gap-2">✔ Alertas inteligentes de insumos críticos de café</div>
                <div className="flex items-center gap-2">✔ Ordenación de compras automáticas a proveedores</div>
                <div className="flex items-center gap-2">✔ Recepción de notas de carga e historial de almacenes</div>
              </>
            )}
            {moduleId === 'sales_by_product' && (
              <>
                <div className="flex items-center gap-2">✔ Detalle analítico por taza y preparación individual</div>
                <div className="flex items-center gap-2">✔ Identificación de horarios picos y cuellos de botella</div>
                <div className="flex items-center gap-2">✔ Porcentajes de merma y desperdicios calculados</div>
                <div className="flex items-center gap-2">✔ Histórico acumulado para recomendación de insumos</div>
              </>
            )}
            {moduleId === 'expenses' && (
              <>
                <div className="flex items-center gap-2">✔ Bitácora detallada de egresos fijos y variables</div>
                <div className="flex items-center gap-2">✔ Clasificación inteligente por tipo (Insumos, Servicios, Nómina)</div>
                <div className="flex items-center gap-2">✔ Escaneo inteligente e inyección de facturas CFE y proveedores</div>
                <div className="flex items-center gap-2">✔ Gráficos interactivos de distribución de egresos</div>
              </>
            )}
            {moduleId === 'client_accounts' && (
              <>
                <div className="flex items-center gap-2">✔ Base de datos de clientes frecuentes y VIP</div>
                <div className="flex items-center gap-2">✔ Programa de lealtad integrado (Tarjeta de 10 Sellos)</div>
                <div className="flex items-center gap-2">✔ Historial de consumo por cliente y preferencias</div>
                <div className="flex items-center gap-2">✔ Envío automatizado de promociones en cumpleaños</div>
              </>
            )}
            {moduleId === 'routes' && (
              <>
                <div className="flex items-center gap-2">✔ Planificación óptima de distribución de granos y postres</div>
                <div className="flex items-center gap-2">✔ Integración con mapas para entregas locales</div>
                <div className="flex items-center gap-2">✔ Confirmación de entrega fotográfica con firma del operador</div>
                <div className="flex items-center gap-2">✔ Histórico de kilometraje e incidencias en la vía</div>
              </>
            )}
            {moduleId === 'maintenance' && (
              <>
                <div className="flex items-center gap-2">✔ Calendario preventivo inteligente para maquinaria</div>
                <div className="flex items-center gap-2">✔ Notificaciones push/correo para mantenimientos de caldera</div>
                <div className="flex items-center gap-2">✔ Proveedores y técnicos pre-registrados de confianza</div>
                <div className="flex items-center gap-2">✔ Checklist interactivo para calibración matutina de presión</div>
              </>
            )}
            {moduleId === 'profile' && (
              <>
                <div className="flex items-center gap-2">✔ Edición de datos generales de administrador de café</div>
                <div className="flex items-center gap-2">✔ Asignación de perfiles para baristas y encargados</div>
                <div className="flex items-center gap-2">✔ Cambio de contraseña y auditoría de accesos seguros</div>
                <div className="flex items-center gap-2">✔ Personalización visual del color de marca del panel</div>
              </>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
