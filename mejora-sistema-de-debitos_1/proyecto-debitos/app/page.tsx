'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import {
  AlertCircle,
  ArrowDownToLine,
  ArrowUpRight,
  Bell,
  Check,
  ChevronDown,
  ChevronRight,
  CircleCheck,
  Clock3,
  FileCheck2,
  FileText,
  LayoutDashboard,
  Menu,
  MoreHorizontal,
  Search,
  Settings2,
  ShieldCheck,
  UploadCloud,
  Users,
  X,
  XCircle,
} from 'lucide-react'

type Role = 'Operador' | 'Validador' | 'Autorizador' | 'Supervisor'
type NavKey = 'Resumen' | 'Afiliaciones' | 'Cargas y débitos' | 'Aprobaciones' | 'Consultas y reportes' | 'Control de accesos'
type Tone = 'warning' | 'success' | 'danger' | 'info'

type Batch = {
  id: string
  company: string
  type: string
  records: string
  amount: string
  date: string
  user: string
  status: string
  tone: Tone
}

const roleDescriptions: Record<Role, string> = {
  Operador: 'Carga archivos y consulta sus resultados.',
  Validador: 'Revisa registros observados antes de aprobar.',
  Autorizador: 'Aprueba lotes listos para procesamiento.',
  Supervisor: 'Administra operaciones, usuarios y anulaciones.',
}

const allRoles: Role[] = ['Operador', 'Validador', 'Autorizador', 'Supervisor']

const batches: Batch[] = [
  { id: 'LOT-2026-0914-018', company: 'Aldeas Infantiles SOS Bolivia', type: 'Afiliación masiva', records: '1,248', amount: 'Bs 182,430.00', date: '14 sep 2026, 16:42', user: 'María Fernández', status: 'Pendiente de aprobación', tone: 'warning' },
  { id: 'LOT-2026-0914-017', company: 'Alianza Cía. de Seguros', type: 'Débito automático', records: '583', amount: 'Bs 94,210.00', date: '14 sep 2026, 14:10', user: 'Carlos Rojas', status: 'Procesado', tone: 'success' },
  { id: 'LOT-2026-0913-016', company: 'Administradora de Tarjetas ATC', type: 'Afiliación masiva', records: '312', amount: 'Bs 45,680.00', date: '13 sep 2026, 11:28', user: 'Luis Mendoza', status: 'Observado', tone: 'danger' },
  { id: 'LOT-2026-0912-015', company: 'Colegio Horizontes', type: 'Débito automático', records: '87', amount: 'Bs 12,980.00', date: '12 sep 2026, 09:16', user: 'María Fernández', status: 'Procesando', tone: 'info' },
]

const navItems: { key: NavKey; label: string; icon: typeof LayoutDashboard; badge?: string }[] = [
  { key: 'Resumen', label: 'Resumen', icon: LayoutDashboard },
  { key: 'Afiliaciones', label: 'Afiliaciones', icon: Users },
  { key: 'Cargas y débitos', label: 'Cargas y débitos', icon: UploadCloud },
  { key: 'Aprobaciones', label: 'Aprobaciones', icon: ShieldCheck, badge: '8' },
  { key: 'Consultas y reportes', label: 'Consultas y reportes', icon: FileText },
]

function statusClasses(tone: Tone) {
  return tone === 'warning' ? 'bg-[#fff4df] text-[#c87800]' : tone === 'success' ? 'bg-[#e8f7f0] text-[#16845c]' : tone === 'danger' ? 'bg-[#fff0f0] text-[#d04b4b]' : 'bg-[#eaf1ff] text-[#1454c4]'
}

function can(role: Role, action: string) {
  if (action === 'upload') return ['Operador', 'Supervisor'].includes(role)
  if (action === 'approve') return ['Autorizador', 'Supervisor'].includes(role)
  if (action === 'validate') return ['Validador', 'Supervisor'].includes(role)
  if (action === 'access') return role === 'Supervisor'
  return true
}

export default function Page() {
  const [activeNav, setActiveNav] = useState<NavKey>('Resumen')
  const [role, setRole] = useState<Role>('Validador')
  const [showUpload, setShowUpload] = useState(false)
  const [showMobileNav, setShowMobileNav] = useState(false)
  const [showNotifications, setShowNotifications] = useState(false)
  const [showRoleInfo, setShowRoleInfo] = useState(false)
  const [search, setSearch] = useState('')
  const [toast, setToast] = useState('')
  const [localBatches, setLocalBatches] = useState(batches)

  const filteredBatches = useMemo(() => localBatches.filter((batch) => `${batch.id} ${batch.company} ${batch.status}`.toLowerCase().includes(search.toLowerCase())), [localBatches, search])
  const notify = (message: string) => { setToast(message); window.setTimeout(() => setToast(''), 2800) }
  const navigate = (key: NavKey) => { setActiveNav(key); setShowMobileNav(false) }
  const updateBatch = (id: string, status: string, tone: Tone) => { setLocalBatches((current) => current.map((batch) => batch.id === id ? { ...batch, status, tone } : batch)); notify(`Lote ${id} actualizado`) }

  return (
    <main className="min-h-screen bg-[#f5f7fb] text-[#102a56]">
      <header className="sticky top-0 z-30 flex h-[72px] items-center justify-between bg-[#073b8f] px-5 text-white shadow-lg md:px-8">
        <div className="flex items-center gap-5"><button onClick={() => setShowMobileNav((value) => !value)} className="rounded-lg p-2 hover:bg-white/10" aria-label="Abrir menú"><Menu size={23} /></button><button onClick={() => navigate('Resumen')} className="flex items-center gap-2 text-[20px] font-bold tracking-tight"><span className="text-[#ff7b00]">›</span>BCP<span className="text-[#ff7b00]">›</span><span>ACH - ODD</span></button></div>
        <div className="relative flex items-center gap-4"><button onClick={() => setShowNotifications((value) => !value)} className="relative rounded-full p-2 hover:bg-white/10" aria-label="Notificaciones"><Bell size={19} /><span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-[#ff7900]" /></button><div className="hidden h-7 w-px bg-white/20 md:block" /><button onClick={() => setShowRoleInfo((value) => !value)} className="flex items-center gap-2 text-sm"><div className="grid h-8 w-8 place-items-center rounded-full bg-white/15 font-semibold">BC</div><span className="hidden md:inline">BC3467 · {role}</span><ChevronDown size={15} /></button>{showNotifications && <div className="absolute right-0 top-12 z-40 w-80 rounded-xl border border-slate-100 bg-white p-4 text-[#102a56] shadow-xl"><p className="font-bold">Notificaciones</p><p className="mt-3 text-sm text-slate-500">8 cargas esperan aprobación y 32 registros tienen observaciones.</p><button onClick={() => { navigate('Aprobaciones'); setShowNotifications(false) }} className="mt-3 text-sm font-semibold text-[#1454c4]">Ver aprobaciones</button></div>}{showRoleInfo && <div className="absolute right-0 top-12 z-40 w-72 rounded-xl border border-slate-100 bg-white p-4 text-[#102a56] shadow-xl"><p className="font-bold">Perfil actual</p><p className="mt-1 text-sm text-slate-500">{roleDescriptions[role]}</p><button onClick={() => { setShowRoleInfo(false); navigate('Control de accesos') }} className="mt-3 text-sm font-semibold text-[#1454c4]">Administrar perfiles</button></div>}</div>
      </header>

      <div className="flex">
        <aside className={`${showMobileNav ? 'block absolute inset-y-[72px] left-0 z-20 shadow-xl' : 'hidden'} min-h-[calc(100vh-72px)] w-[270px] shrink-0 border-r border-[#e4e9f2] bg-white p-4 lg:relative lg:block lg:shadow-none`}>
          <div className="mb-6 rounded-xl bg-[#f1f5fb] px-4 py-3 text-sm font-semibold text-[#2455c3]">Menú principal</div>
          <nav className="space-y-1">{navItems.map((item) => { const Icon = item.icon; const active = activeNav === item.key; return <button key={item.key} onClick={() => navigate(item.key)} className={`flex w-full items-center justify-between rounded-lg px-4 py-3 text-left text-sm transition ${active ? 'bg-[#edf3ff] font-semibold text-[#1454c4]' : 'text-[#52627a] hover:bg-slate-50'}`}><span className="flex items-center gap-3"><Icon size={18} />{item.label}</span>{item.badge && <span className="rounded-full bg-[#e4edff] px-2 py-0.5 text-xs font-bold text-[#1454c4]">{item.badge}</span>}</button> })}</nav>
          <div className="mt-8 border-t border-slate-100 pt-5"><p className="px-4 text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">Operación</p><button onClick={() => can(role, 'access') ? navigate('Control de accesos') : notify('Solo el Supervisor puede administrar accesos')} className="mt-2 flex w-full items-center gap-3 rounded-lg px-4 py-3 text-sm text-[#52627a] hover:bg-slate-50"><Settings2 size={18} />Control de accesos</button></div>
          <div className="mt-8 rounded-xl bg-[#f7f9fc] p-4 text-xs leading-5 text-slate-500"><p className="font-semibold text-[#102a56]">Perfil actual</p><p>{role} · Operaciones</p><button onClick={() => setShowRoleInfo(true)} className="mt-2 font-semibold text-[#1454c4]">Cambiar perfil</button></div>
        </aside>

        <section className="min-w-0 flex-1 px-5 py-7 md:px-8 lg:px-10"><div className="mx-auto max-w-[1400px]">
          {activeNav === 'Resumen' && <Dashboard onNavigate={navigate} onUpload={() => can(role, 'upload') ? setShowUpload(true) : notify('Tu perfil no tiene permisos para cargar archivos')} filteredBatches={filteredBatches} search={search} setSearch={setSearch} onUpdate={updateBatch} />}
          {activeNav === 'Afiliaciones' && <Affiliations onNotify={notify} />}
          {activeNav === 'Cargas y débitos' && <Loads filteredBatches={filteredBatches} search={search} setSearch={setSearch} onUpload={() => can(role, 'upload') ? setShowUpload(true) : notify('Tu perfil no tiene permisos para cargar archivos')} onUpdate={updateBatch} />}
          {activeNav === 'Aprobaciones' && <Approvals role={role} batches={filteredBatches} onNotify={notify} onUpdate={updateBatch} />}
          {activeNav === 'Consultas y reportes' && <Reports onNotify={notify} />}
          {activeNav === 'Control de accesos' && <AccessControl role={role} setRole={setRole} onNotify={notify} />}
        </div></section>
      </div>

      {showUpload && <UploadModal onClose={() => setShowUpload(false)} onNotify={notify} />}
      {toast && <div className="fixed bottom-6 right-6 z-[60] flex items-center gap-3 rounded-xl bg-[#102a56] px-4 py-3 text-sm font-semibold text-white shadow-xl"><CircleCheck size={18} className="text-[#62d6a4]" />{toast}</div>}
    </main>
  )
}

function Header({ title, subtitle, action }: { title: string; subtitle: string; action?: React.ReactNode }) { return <div className="mb-7 flex flex-col justify-between gap-4 md:flex-row md:items-end"><div><p className="mb-2 text-xs font-semibold text-[#6a7890]">Inicio / {title}</p><h1 className="text-[28px] font-bold tracking-[-0.03em] text-[#102a56]">{title}</h1><p className="mt-1 text-sm text-[#6a7890]">{subtitle}</p></div>{action}</div> }

function Dashboard({ onNavigate, onUpload, filteredBatches, search, setSearch, onUpdate }: { onNavigate: (key: NavKey) => void; onUpload: () => void; filteredBatches: Batch[]; search: string; setSearch: (value: string) => void; onUpdate: (id: string, status: string, tone: Tone) => void }) {
  return <><Header title="Resumen operativo" subtitle="Controla afiliaciones y débitos automáticos desde un solo lugar." action={<button onClick={onUpload} className="inline-flex items-center gap-2 rounded-lg bg-[#1454c4] px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-[#0d429f]"><UploadCloud size={17} />Nueva carga</button>} /><div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{[['Afiliaciones activas', '24,682', '+8.4%', Users, 'blue'], ['Pendientes de aprobación', '8', 'Requieren atención', Clock3, 'orange'], ['Cargas procesadas', '1,284', '+12.1%', FileCheck2, 'green'], ['Monto debitado este mes', 'Bs 1.84M', '+6.8%', ArrowUpRight, 'purple']].map(([label, value, detail, Icon, color]) => <div key={label as string} className="rounded-xl border border-[#e5eaf2] bg-white p-5 shadow-sm"><div className="flex items-start justify-between"><div><p className="text-xs font-medium text-[#77869e]">{label}</p><p className="mt-2 text-[25px] font-bold tracking-tight text-[#102a56]">{value}</p><p className={`mt-2 text-xs font-semibold ${color === 'orange' ? 'text-[#e58a00]' : 'text-[#16845c]'}`}>{detail}</p></div><div className={`grid h-10 w-10 place-items-center rounded-lg ${color === 'blue' ? 'bg-[#eaf1ff] text-[#1454c4]' : color === 'orange' ? 'bg-[#fff4df] text-[#d87900]' : color === 'green' ? 'bg-[#e8f7f0] text-[#16845c]' : 'bg-[#f1ebff] text-[#7952c8]'}`}><Icon size={19} /></div></div></div>)}</div><div className="mt-7 grid gap-5 xl:grid-cols-[1.55fr_1fr]"><div className="rounded-xl border border-[#e5eaf2] bg-white p-5 shadow-sm"><div className="flex items-center justify-between"><div><h2 className="font-bold text-[#102a56]">Actividad de cargas</h2><p className="mt-1 text-xs text-[#77869e]">Volumen procesado durante los últimos 7 días</p></div><MoreHorizontal size={18} className="text-slate-400" /></div><div className="mt-7 flex h-[158px] items-end gap-3 border-b border-dashed border-slate-200 px-2">{[42, 65, 51, 82, 72, 96, 75].map((height, index) => <div key={index} className="flex flex-1 flex-col items-center gap-2"><div className={`w-full max-w-[42px] rounded-t-md ${index === 5 ? 'bg-[#1454c4]' : 'bg-[#c9dbff]'}`} style={{ height: `${height}%` }} /><span className="text-[10px] text-slate-400">{['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'][index]}</span></div>)}</div></div><div className="rounded-xl border border-[#e5eaf2] bg-white p-5 shadow-sm"><h2 className="font-bold text-[#102a56]">Tareas pendientes</h2><p className="mt-1 text-xs text-[#77869e]">Acciones que requieren tu atención</p><div className="mt-5 space-y-3"><button onClick={() => onNavigate('Aprobaciones')} className="flex w-full items-center gap-3 rounded-lg border border-slate-100 p-3 text-left hover:bg-slate-50"><span className="grid h-9 w-9 place-items-center rounded-lg bg-[#fff4df] text-sm font-bold text-[#d87900]">8</span><span className="flex-1"><span className="block text-xs font-semibold text-[#2b4265]">Cargas pendientes de aprobación</span><span className="mt-1 block text-[11px] text-slate-400">Prioridad alta</span></span><ChevronRight size={16} className="text-slate-400" /></button><button onClick={() => onNavigate('Afiliaciones')} className="flex w-full items-center gap-3 rounded-lg border border-slate-100 p-3 text-left hover:bg-slate-50"><span className="grid h-9 w-9 place-items-center rounded-lg bg-[#fff0f0] text-sm font-bold text-[#d04b4b]">32</span><span className="flex-1"><span className="block text-xs font-semibold text-[#2b4265]">Registros observados</span><span className="mt-1 block text-[11px] text-slate-400">Revisar antes de las 18:00</span></span><ChevronRight size={16} className="text-slate-400" /></button></div></div></div><BatchTable batches={filteredBatches} search={search} setSearch={setSearch} onUpdate={onUpdate} /> </>
}

function BatchTable({ batches: rows, search, setSearch, onUpdate }: { batches: Batch[]; search: string; setSearch: (value: string) => void; onUpdate: (id: string, status: string, tone: Tone) => void }) { return <div className="mt-7 rounded-xl border border-[#e5eaf2] bg-white shadow-sm"><div className="flex flex-col gap-4 border-b border-[#eef1f6] p-5 md:flex-row md:items-center md:justify-between"><div><h2 className="font-bold text-[#102a56]">Últimas cargas</h2><p className="mt-1 text-xs text-[#77869e]">Seguimiento de lotes y estado de procesamiento</p></div><div className="relative"><Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar lote o empresa" className="w-full rounded-lg border border-[#d9e1ed] py-2 pl-9 pr-3 text-sm outline-none focus:border-[#1454c4] md:w-64" /></div></div><div className="overflow-x-auto"><table className="w-full min-w-[880px] text-left text-sm"><thead className="bg-[#fafbfd] text-[11px] uppercase tracking-wide text-[#8592a8]"><tr><th className="px-5 py-3">Lote</th><th className="px-5 py-3">Empresa / tipo</th><th className="px-5 py-3">Registros</th><th className="px-5 py-3">Fecha y usuario</th><th className="px-5 py-3">Estado</th><th className="px-5 py-3" /></tr></thead><tbody className="divide-y divide-[#eef1f6]">{rows.map((batch) => <tr key={batch.id} className="hover:bg-[#fbfcff]"><td className="px-5 py-4"><Link href={`/lotes/${batch.id}`} className="font-semibold text-[#1454c4] hover:underline">{batch.id}</Link><span className="mt-1 block text-xs text-slate-400">{batch.amount}</span></td><td className="px-5 py-4"><span className="font-medium text-[#2b4265]">{batch.company}</span><span className="mt-1 block text-xs text-slate-400">{batch.type}</span></td><td className="px-5 py-4 text-[#52627a]">{batch.records}</td><td className="px-5 py-4"><span className="block text-[#52627a]">{batch.date}</span><span className="mt-1 block text-xs text-slate-400">{batch.user}</span></td><td className="px-5 py-4"><span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${statusClasses(batch.tone)}`}><span className="h-1.5 w-1.5 rounded-full bg-current" />{batch.status}</span></td><td className="px-5 py-4"><Link href={`/lotes/${batch.id}`} className="inline-flex rounded-lg p-2 text-slate-400 hover:bg-slate-100" aria-label={`Ver registro de procesamiento ${batch.id}`}><ChevronRight size={17} /></Link></td></tr>)}</tbody></table></div></div> }

function Affiliations({ onNotify }: { onNotify: (message: string) => void }) { const [filter, setFilter] = useState(''); const rows = [['Aldeas Infantiles SOS Bolivia', '1020347026', '1,248', 'Activa'], ['Alianza Cía. de Seguros', '1020351029', '583', 'Activa'], ['Administradora de Tarjetas ATC', '1020397027', '312', 'Observada'], ['Colegio Horizontes', '1020221022', '87', 'Activa']].filter((row) => row.join(' ').toLowerCase().includes(filter.toLowerCase())); return <><Header title="Afiliaciones" subtitle="Consulta, valida y administra usuarios afiliados al servicio." action={<button onClick={() => onNotify('Descarga de plantilla iniciada')} className="inline-flex items-center gap-2 rounded-lg border border-[#b8c8e1] bg-white px-4 py-2.5 text-sm font-semibold text-[#1454c4]"><ArrowDownToLine size={17} />Descargar plantilla</button>} /><div className="rounded-xl border border-[#e5eaf2] bg-white p-5 shadow-sm"><div className="flex flex-col justify-between gap-4 md:flex-row"><div><h2 className="font-bold">Directorio de afiliaciones</h2><p className="mt-1 text-xs text-slate-500">1,842 afiliaciones recientes</p></div><div className="relative"><Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" /><input value={filter} onChange={(event) => setFilter(event.target.value)} placeholder="Buscar empresa o cuenta" className="rounded-lg border border-[#d9e1ed] py-2 pl-9 pr-3 text-sm" /></div></div><div className="mt-5 overflow-x-auto"><table className="w-full min-w-[650px] text-left text-sm"><thead className="bg-[#fafbfd] text-xs text-slate-500"><tr><th className="p-3">Empresa</th><th className="p-3">Cuenta</th><th className="p-3">Afiliados</th><th className="p-3">Estado</th><th className="p-3" /></tr></thead><tbody className="divide-y divide-slate-100">{rows.map((row) => <tr key={row[1]}><td className="p-3 font-medium">{row[0]}</td><td className="p-3">{row[1]}</td><td className="p-3">{row[2]}</td><td className="p-3"><span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${row[3] === 'Activa' ? 'bg-[#e8f7f0] text-[#16845c]' : 'bg-[#fff0f0] text-[#d04b4b]'}`}>{row[3]}</span></td><td className="p-3"><button onClick={() => onNotify(`Detalle de ${row[0]}`)} className="text-sm font-semibold text-[#1454c4]">Consultar</button></td></tr>)}</tbody></table></div></div></> }

function Loads({ filteredBatches, search, setSearch, onUpload, onUpdate }: { filteredBatches: Batch[]; search: string; setSearch: (value: string) => void; onUpload: () => void; onUpdate: (id: string, status: string, tone: Tone) => void }) { return <><Header title="Cargas y débitos" subtitle="Administra archivos de afiliación y débitos automáticos." action={<button onClick={onUpload} className="inline-flex items-center gap-2 rounded-lg bg-[#1454c4] px-4 py-2.5 text-sm font-semibold text-white"><UploadCloud size={17} />Nueva carga</button>} /><div className="mb-5 grid gap-4 md:grid-cols-3">{[['Registros del día', '2,230'], ['Procesados', '1,804'], ['Con observaciones', '32']].map((item) => <div key={item[0]} className="rounded-xl border border-[#e5eaf2] bg-white p-5 shadow-sm"><p className="text-xs text-slate-500">{item[0]}</p><p className="mt-2 text-2xl font-bold">{item[1]}</p></div>)}</div><BatchTable batches={filteredBatches} search={search} setSearch={setSearch} onUpdate={onUpdate} /></> }

function Approvals({ role, batches: rows, onNotify, onUpdate }: { role: Role; batches: Batch[]; onNotify: (message: string) => void; onUpdate: (id: string, status: string, tone: Tone) => void }) { const pending = rows.filter((batch) => batch.status === 'Pendiente de aprobación' || batch.status === 'Observado'); return <><Header title="Aprobaciones" subtitle="Revisa y autoriza las cargas antes de procesarlas." /><div className="mb-5 rounded-xl border border-[#c9dbff] bg-[#edf3ff] p-4 text-sm text-[#2455c3]"><strong>Segregación de funciones:</strong> el Operador no puede aprobar sus propias cargas. Perfil actual: {role}.</div><div className="space-y-3">{pending.map((batch) => <div key={batch.id} className="flex flex-col gap-4 rounded-xl border border-[#e5eaf2] bg-white p-5 shadow-sm md:flex-row md:items-center"><div className="flex-1"><p className="font-bold text-[#1454c4]">{batch.id}</p><p className="mt-1 text-sm font-medium">{batch.company}</p><p className="mt-1 text-xs text-slate-500">{batch.records} registros · {batch.amount} · {batch.user}</p></div><div className="flex gap-2">{role === 'Autorizador' || role === 'Supervisor' ? <><button onClick={() => onUpdate(batch.id, 'Aprobado', 'success')} className="inline-flex items-center gap-2 rounded-lg bg-[#16845c] px-3 py-2 text-xs font-semibold text-white"><Check size={15} />Aprobar</button><button onClick={() => onUpdate(batch.id, 'Devuelto', 'warning')} className="rounded-lg border border-[#e2a744] px-3 py-2 text-xs font-semibold text-[#a66b00]">Devolver</button></> : <button onClick={() => onNotify('Este perfil solo puede revisar la carga')} className="rounded-lg border border-[#b8c8e1] px-3 py-2 text-xs font-semibold text-[#1454c4]">Revisar detalle</button>}</div></div>)}{pending.length === 0 && <EmptyState title="No hay cargas pendientes" description="Todas las cargas fueron atendidas." />}</div></> }

function Reports({ onNotify }: { onNotify: (message: string) => void }) { return <><Header title="Consultas y reportes" subtitle="Obtén información operativa para seguimiento y auditoría." /><div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{[['Reporte de afiliaciones', 'Altas, bajas y observaciones por empresa'], ['Reporte de débitos', 'Montos procesados, rechazados y anulados'], ['Auditoría de lotes', 'Historial de usuarios y acciones realizadas'], ['Conciliación bancaria', 'Comparación entre archivos y resultados'], ['Indicadores operativos', 'Tiempos, volúmenes y productividad'], ['Exportación personalizada', 'Selecciona columnas y filtros']].map((report) => <button key={report[0]} onClick={() => onNotify(`Generando ${report[0]}`)} className="rounded-xl border border-[#e5eaf2] bg-white p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-[#b8c8e1]"><div className="grid h-10 w-10 place-items-center rounded-lg bg-[#eaf1ff] text-[#1454c4]"><FileText size={18} /></div><h2 className="mt-4 font-bold">{report[0]}</h2><p className="mt-1 text-sm text-slate-500">{report[1]}</p><span className="mt-4 inline-flex items-center gap-1 text-xs font-semibold text-[#1454c4]">Generar reporte <ChevronRight size={14} /></span></button>)}</div></> }

function AccessControl({ role, setRole, onNotify }: { role: Role; setRole: (role: Role) => void; onNotify: (message: string) => void }) { return <><Header title="Control de accesos" subtitle="Prueba perfiles y permisos para cada etapa de la operación." /><div className="grid gap-5 lg:grid-cols-[1fr_1.4fr]"><div className="rounded-xl border border-[#e5eaf2] bg-white p-5 shadow-sm"><h2 className="font-bold">Cambiar perfil de prueba</h2><p className="mt-1 text-sm text-slate-500">El cambio actualiza las acciones disponibles en todo el sistema.</p><div className="mt-5 space-y-2">{allRoles.map((item) => <button key={item} onClick={() => { setRole(item); onNotify(`Perfil cambiado a ${item}`) }} className={`flex w-full items-center justify-between rounded-lg border p-3 text-left text-sm ${role === item ? 'border-[#1454c4] bg-[#edf3ff] text-[#1454c4]' : 'border-slate-200'}`}><span><strong>{item}</strong><span className="mt-1 block text-xs text-slate-500">{roleDescriptions[item]}</span></span>{role === item && <CircleCheck size={18} />}</button>)}</div></div><div className="rounded-xl border border-[#e5eaf2] bg-white p-5 shadow-sm"><h2 className="font-bold">Matriz de permisos</h2><div className="mt-5 overflow-x-auto"><table className="w-full min-w-[580px] text-left text-sm"><thead className="border-b text-xs text-slate-500"><tr><th className="p-3">Función</th>{allRoles.map((item) => <th key={item} className="p-3">{item}</th>)}</tr></thead><tbody className="divide-y">{[['Cargar archivo', 'upload'], ['Validar observados', 'validate'], ['Aprobar lote', 'approve'], ['Administrar accesos', 'access']].map(([label, action]) => <tr key={action}><td className="p-3 font-medium">{label}</td>{allRoles.map((item) => <td key={item} className="p-3">{can(item, action) ? <Check className="text-[#16845c]" size={18} /> : <X className="text-[#d04b4b]" size={18} />}</td>)}</tr>)}</tbody></table></div></div></div></> }

function EmptyState({ title, description }: { title: string; description: string }) { return <div className="rounded-xl border border-dashed border-slate-300 bg-white p-10 text-center"><AlertCircle className="mx-auto text-slate-400" /><p className="mt-3 font-semibold">{title}</p><p className="mt-1 text-sm text-slate-500">{description}</p></div> }

function UploadModal({ onClose, onNotify }: { onClose: () => void; onNotify: (message: string) => void }) { const [file, setFile] = useState(''); return <div className="fixed inset-0 z-50 grid place-items-center bg-[#061b3d]/40 p-4" role="dialog" aria-modal="true" aria-labelledby="upload-title"><div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl"><div className="flex items-start justify-between"><div><h2 id="upload-title" className="text-lg font-bold">Nueva carga masiva</h2><p className="mt-1 text-sm text-slate-500">Valida el archivo antes de enviarlo al flujo de aprobación.</p></div><button onClick={onClose} className="rounded-lg p-2 text-slate-400 hover:bg-slate-100" aria-label="Cerrar"><XCircle size={20} /></button></div><div className="mt-6 space-y-4"><label className="block text-sm font-semibold">Tipo de operación<select className="mt-2 w-full rounded-lg border border-[#d9e1ed] bg-white p-3 text-sm font-normal"><option>Afiliación masiva</option><option>Débito automático</option></select></label><label className="block text-sm font-semibold">Empresa<select className="mt-2 w-full rounded-lg border border-[#d9e1ed] bg-white p-3 text-sm font-normal"><option>Aldeas Infantiles SOS Bolivia</option><option>Alianza Cía. de Seguros</option><option>Administradora de Tarjetas ATC</option></select></label><label className="block cursor-pointer rounded-xl border-2 border-dashed border-[#cbd9ee] bg-[#f8fbff] p-7 text-center"><UploadCloud className="mx-auto text-[#1454c4]" size={30} /><p className="mt-3 text-sm font-semibold">{file || 'Selecciona un archivo'}</p><p className="mt-1 text-xs text-slate-400">Formatos permitidos: .xlsx, .csv o .txt</p><input type="file" accept=".xlsx,.csv,.txt" className="sr-only" onChange={(event) => setFile(event.target.files?.[0]?.name || '')} /></label></div><div className="mt-6 flex justify-end gap-3"><button onClick={onClose} className="rounded-lg px-4 py-2 text-sm font-semibold text-slate-500 hover:bg-slate-50">Cancelar</button><button onClick={() => { onNotify(file ? `Archivo ${file} enviado a validación` : 'Selecciona un archivo para continuar'); if (file) onClose() }} className="rounded-lg bg-[#1454c4] px-4 py-2 text-sm font-semibold text-white">Enviar a validación</button></div></div></div> }
