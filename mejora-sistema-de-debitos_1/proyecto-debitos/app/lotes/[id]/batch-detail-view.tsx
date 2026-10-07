'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import {
  ArrowLeft,
  Building2,
  Check,
  CheckCircle2,
  CircleCheck,
  Clock3,
  Download,
  FileSpreadsheet,
  FileWarning,
  History,
  RotateCcw,
  ShieldCheck,
  Undo2,
  Wallet,
  XCircle,
} from 'lucide-react'
import { type BatchDetail, type RecordStatus, formatCurrency, maskAccount } from './data'

type TabKey = 'resumen' | 'validos' | 'observados' | 'rechazados'

const MAIN_STEPS = ['Cargado', 'Validado', 'Pendiente de aprobación', 'Aprobado', 'Procesando', 'Procesado']
const ALERT_STATUSES = ['Observado', 'Rechazado', 'Devuelto']

function badgeClasses(tone: BatchDetail['tone']) {
  if (tone === 'success') return 'bg-[#e8f7f0] text-[#16845c]'
  if (tone === 'warning') return 'bg-[#fff4df] text-[#c87800]'
  if (tone === 'danger') return 'bg-[#fff0f0] text-[#d04b4b]'
  if (tone === 'info') return 'bg-[#eaf1ff] text-[#1454c4]'
  return 'bg-slate-100 text-slate-600'
}

function recordBadgeClasses(status: RecordStatus) {
  if (status === 'Válido') return 'bg-[#e8f7f0] text-[#16845c]'
  if (status === 'Observado') return 'bg-[#fff4df] text-[#c87800]'
  return 'bg-[#fff0f0] text-[#d04b4b]'
}

function Stepper({ status }: { status: string }) {
  const isAlert = ALERT_STATUSES.includes(status)
  const currentIndex = isAlert ? 1 : MAIN_STEPS.indexOf(status)

  return (
    <div className="flex items-start overflow-x-auto pb-1">
      {MAIN_STEPS.map((step, index) => {
        const done = index < currentIndex || (!isAlert && index === currentIndex && index === MAIN_STEPS.length - 1)
        const current = !isAlert && index === currentIndex
        const isBranchPoint = isAlert && index === 1
        return (
          <div key={step} className="flex min-w-[108px] flex-1 flex-col items-center last:min-w-0 last:flex-none">
            <div className="flex w-full items-center">
              <div className={`h-px flex-1 ${index === 0 ? 'opacity-0' : done || isBranchPoint ? 'bg-[#1454c4]' : 'bg-slate-200'}`} />
              <div
                className={`grid h-8 w-8 shrink-0 place-items-center rounded-full border-2 text-xs font-bold ${
                  done
                    ? 'border-[#1454c4] bg-[#1454c4] text-white'
                    : current
                      ? 'border-[#1454c4] bg-white text-[#1454c4]'
                      : 'border-slate-200 bg-white text-slate-300'
                }`}
              >
                {done ? <Check size={15} /> : index + 1}
              </div>
              <div className={`h-px flex-1 ${index === MAIN_STEPS.length - 1 ? 'opacity-0' : done ? 'bg-[#1454c4]' : 'bg-slate-200'}`} />
            </div>
            <span className={`mt-2 text-center text-[11px] font-semibold leading-tight ${done || current ? 'text-[#102a56]' : 'text-slate-400'}`}>{step}</span>
            {isBranchPoint && (
              <div className="mt-2 flex items-center gap-1.5 rounded-full bg-[#fff0f0] px-2.5 py-1 text-[11px] font-bold text-[#d04b4b]">
                <FileWarning size={12} />
                {status}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

export function BatchDetailView({ batch }: { batch: BatchDetail }) {
  const [tab, setTab] = useState<TabKey>('resumen')
  const [toast, setToast] = useState('')

  const notify = (message: string) => {
    setToast(message)
    window.setTimeout(() => setToast(''), 2800)
  }

  const validRows = useMemo(() => batch.records.filter((row) => row.status === 'Válido'), [batch])
  const observedRows = useMemo(() => batch.records.filter((row) => row.status === 'Observado'), [batch])
  const rejectedRows = useMemo(() => batch.records.filter((row) => row.status === 'Rechazado'), [batch])

  const tabs: { key: TabKey; label: string; count?: number }[] = [
    { key: 'resumen', label: 'Resumen y trazabilidad' },
    { key: 'validos', label: 'Válidos', count: batch.validRecords },
    { key: 'observados', label: 'Observados', count: batch.observedRecords },
    { key: 'rechazados', label: 'Rechazados', count: batch.rejectedRecords },
  ]

  const rowsForTab = tab === 'validos' ? validRows : tab === 'observados' ? observedRows : tab === 'rechazados' ? rejectedRows : []

  return (
    <main className="min-h-screen bg-[#f5f7fb] text-[#102a56]">
      <header className="sticky top-0 z-30 flex h-[72px] items-center justify-between bg-[#073b8f] px-5 text-white shadow-lg md:px-8">
        <div className="flex items-center gap-4">
          <Link href="/" className="rounded-lg p-2 hover:bg-white/10" aria-label="Volver a cargas y débitos">
            <ArrowLeft size={20} />
          </Link>
          <div className="flex items-center gap-2 text-[18px] font-bold tracking-tight">
            <span className="text-[#ff7b00]">›</span>BCP<span className="text-[#ff7b00]">›</span>
            <span>ACH - ODD</span>
          </div>
        </div>
        <div className="hidden items-center gap-2 text-sm text-white/80 md:flex">
          <Link href="/" className="hover:underline">Cargas y débitos</Link>
          <span>/</span>
          <span className="font-semibold text-white">{batch.id}</span>
        </div>
      </header>

      <section className="mx-auto max-w-[1300px] px-5 py-7 md:px-8 lg:px-10">
        <div className="mb-6 flex flex-col justify-between gap-4 lg:flex-row lg:items-start">
          <div>
            <p className="mb-2 text-xs font-semibold text-[#6a7890]">Inicio / Cargas y débitos / {batch.id}</p>
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-[26px] font-bold tracking-[-0.03em] text-[#102a56]">Registro de procesamiento — {batch.id}</h1>
              <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold ${badgeClasses(batch.tone)}`}>
                <span className="h-1.5 w-1.5 rounded-full bg-current" />
                {batch.status}
              </span>
            </div>
            <p className="mt-1 text-sm text-[#6a7890]">{batch.operationType} · {batch.company}</p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button onClick={() => notify(`Descargando resultados de ${batch.id}`)} className="inline-flex items-center gap-2 rounded-lg border border-[#b8c8e1] bg-white px-4 py-2.5 text-sm font-semibold text-[#1454c4] hover:bg-[#f5f9ff]">
              <Download size={16} />
              Archivo de resultados
            </button>
            {batch.observedRecords > 0 && (
              <button onClick={() => notify('Reproceso de observados enviado')} className="inline-flex items-center gap-2 rounded-lg border border-[#e2a744] bg-white px-4 py-2.5 text-sm font-semibold text-[#a66b00] hover:bg-[#fffaf0]">
                <RotateCcw size={16} />
                Reprocesar observados
              </button>
            )}
            {batch.status === 'Pendiente de aprobación' && (
              <>
                <button onClick={() => notify('Lote devuelto al operador')} className="inline-flex items-center gap-2 rounded-lg border border-[#b8c8e1] bg-white px-4 py-2.5 text-sm font-semibold text-[#52627a] hover:bg-slate-50">
                  <Undo2 size={16} />
                  Devolver
                </button>
                <button onClick={() => notify(`Lote ${batch.id} aprobado`)} className="inline-flex items-center gap-2 rounded-lg bg-[#16845c] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#116a48]">
                  <ShieldCheck size={16} />
                  Aprobar lote
                </button>
              </>
            )}
          </div>
        </div>

        <div className="rounded-xl border border-[#e5eaf2] bg-white p-5 shadow-sm md:p-6">
          <p className="mb-5 text-xs font-bold uppercase tracking-wide text-[#8592a8]">Avance del procesamiento</p>
          <Stepper status={batch.status} />
        </div>

        <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
          {[
            { label: 'Total de registros', value: batch.totalRecords.toLocaleString('es-BO'), icon: FileSpreadsheet, color: 'blue' },
            { label: 'Válidos', value: batch.validRecords.toLocaleString('es-BO'), icon: CheckCircle2, color: 'green' },
            { label: 'Observados', value: batch.observedRecords.toLocaleString('es-BO'), icon: FileWarning, color: 'orange' },
            { label: 'Rechazados', value: batch.rejectedRecords.toLocaleString('es-BO'), icon: XCircle, color: 'red' },
            { label: 'Monto total', value: formatCurrency(batch.totalAmount), icon: Wallet, color: 'purple' },
          ].map((card) => {
            const Icon = card.icon
            const bg = card.color === 'blue' ? 'bg-[#eaf1ff] text-[#1454c4]' : card.color === 'green' ? 'bg-[#e8f7f0] text-[#16845c]' : card.color === 'orange' ? 'bg-[#fff4df] text-[#d87900]' : card.color === 'red' ? 'bg-[#fff0f0] text-[#d04b4b]' : 'bg-[#f1ebff] text-[#7952c8]'
            return (
              <div key={card.label} className="rounded-xl border border-[#e5eaf2] bg-white p-5 shadow-sm">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs font-medium text-[#77869e]">{card.label}</p>
                    <p className="mt-2 text-[22px] font-bold tracking-tight text-[#102a56]">{card.value}</p>
                  </div>
                  <div className={`grid h-10 w-10 shrink-0 place-items-center rounded-lg ${bg}`}>
                    <Icon size={18} />
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        <div className="mt-7 grid gap-5 xl:grid-cols-[0.85fr_1.5fr]">
          <div className="space-y-5">
            <div className="rounded-xl border border-[#e5eaf2] bg-white p-5 shadow-sm">
              <h2 className="flex items-center gap-2 font-bold text-[#102a56]"><Building2 size={17} className="text-[#1454c4]" />Datos del lote</h2>
              <dl className="mt-4 space-y-3 text-sm">
                {[
                  ['Empresa', batch.company],
                  ['Código empresa', batch.companyId],
                  ['Cuenta recaudadora', batch.collectorAccount],
                  ['Tipo de operación', batch.operationType],
                  ['Archivo original', batch.originalFileName],
                ].map(([label, value]) => (
                  <div key={label} className="flex flex-col gap-0.5 border-b border-[#f1f4f9] pb-3 last:border-0 last:pb-0">
                    <dt className="text-xs text-[#8592a8]">{label}</dt>
                    <dd className="font-medium text-[#2b4265]">{value}</dd>
                  </div>
                ))}
              </dl>
            </div>

            <div className="rounded-xl border border-[#e5eaf2] bg-white p-5 shadow-sm">
              <h2 className="flex items-center gap-2 font-bold text-[#102a56]"><Clock3 size={17} className="text-[#1454c4]" />Responsables por etapa</h2>
              <dl className="mt-4 space-y-3 text-sm">
                <div className="flex justify-between gap-3 border-b border-[#f1f4f9] pb-3">
                  <div><dt className="text-xs text-[#8592a8]">Cargado por</dt><dd className="font-medium text-[#2b4265]">{batch.createdBy}</dd></div>
                  <dd className="text-right text-xs text-slate-400">{batch.createdAt}</dd>
                </div>
                {batch.validatedBy && (
                  <div className="flex justify-between gap-3 border-b border-[#f1f4f9] pb-3">
                    <div><dt className="text-xs text-[#8592a8]">Validado por</dt><dd className="font-medium text-[#2b4265]">{batch.validatedBy}</dd></div>
                    <dd className="text-right text-xs text-slate-400">{batch.validatedAt}</dd>
                  </div>
                )}
                {batch.approvedBy && (
                  <div className="flex justify-between gap-3 border-b border-[#f1f4f9] pb-3">
                    <div><dt className="text-xs text-[#8592a8]">Aprobado por</dt><dd className="font-medium text-[#2b4265]">{batch.approvedBy}</dd></div>
                    <dd className="text-right text-xs text-slate-400">{batch.approvedAt}</dd>
                  </div>
                )}
                {batch.processedAt && (
                  <div className="flex justify-between gap-3">
                    <div><dt className="text-xs text-[#8592a8]">Procesado</dt><dd className="font-medium text-[#2b4265]">Sistema</dd></div>
                    <dd className="text-right text-xs text-slate-400">{batch.processedAt}</dd>
                  </div>
                )}
              </dl>
            </div>
          </div>

          <div className="rounded-xl border border-[#e5eaf2] bg-white shadow-sm">
            <div className="flex flex-wrap gap-1 border-b border-[#eef1f6] p-2">
              {tabs.map((item) => (
                <button
                  key={item.key}
                  onClick={() => setTab(item.key)}
                  className={`flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition ${tab === item.key ? 'bg-[#edf3ff] text-[#1454c4]' : 'text-[#6a7890] hover:bg-slate-50'}`}
                >
                  {item.label}
                  {typeof item.count === 'number' && (
                    <span className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${tab === item.key ? 'bg-white text-[#1454c4]' : 'bg-slate-100 text-slate-500'}`}>{item.count}</span>
                  )}
                </button>
              ))}
            </div>

            {tab === 'resumen' ? (
              <div className="p-5">
                <h3 className="flex items-center gap-2 font-bold text-[#102a56]"><History size={17} className="text-[#1454c4]" />Trazabilidad del lote</h3>
                <p className="mt-1 text-xs text-[#77869e]">Historial de acciones, usuario ejecutor y resultado de cada etapa</p>
                <ol className="mt-5 space-y-0">
                  {batch.audit.map((event, index) => (
                    <li key={`${event.action}-${index}`} className="relative flex gap-4 pb-6 last:pb-0">
                      {index !== batch.audit.length - 1 && <span className="absolute left-[15px] top-8 h-[calc(100%-1.5rem)] w-px bg-[#e5eaf2]" />}
                      <span className="relative z-10 grid h-8 w-8 shrink-0 place-items-center rounded-full bg-[#eaf1ff] text-[#1454c4]"><CircleCheck size={16} /></span>
                      <div className="flex-1">
                        <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
                          <p className="text-sm font-semibold text-[#2b4265]">{event.action}</p>
                          <span className="text-xs text-slate-400">{event.createdAt}</span>
                        </div>
                        <p className="mt-0.5 text-xs text-[#77869e]">{event.userName} · {event.role} · {event.previousStatus} → {event.newStatus}</p>
                        {event.comment && <p className="mt-1.5 rounded-lg bg-[#f7f9fc] px-3 py-2 text-xs text-[#52627a]">{event.comment}</p>}
                      </div>
                    </li>
                  ))}
                </ol>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[760px] text-left text-sm">
                  <thead className="bg-[#fafbfd] text-[11px] uppercase tracking-wide text-[#8592a8]">
                    <tr>
                      <th className="px-5 py-3">Documento</th>
                      <th className="px-5 py-3">Cliente</th>
                      <th className="px-5 py-3">Cuenta</th>
                      <th className="px-5 py-3">Monto</th>
                      <th className="px-5 py-3">Cód. afiliación</th>
                      <th className="px-5 py-3">Estado</th>
                      {tab !== 'validos' && <th className="px-5 py-3">Observación</th>}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#eef1f6]">
                    {rowsForTab.map((row) => (
                      <tr key={row.documentNumber} className="hover:bg-[#fbfcff]">
                        <td className="px-5 py-3.5"><span className="font-medium text-[#2b4265]">{row.documentType} {row.documentNumber}</span></td>
                        <td className="px-5 py-3.5 text-[#52627a]">{row.customerName}</td>
                        <td className="px-5 py-3.5 font-mono text-xs text-[#52627a]">{maskAccount(row.bankAccount)}</td>
                        <td className="px-5 py-3.5 text-[#52627a]">{formatCurrency(row.amount)}</td>
                        <td className="px-5 py-3.5 text-[#52627a]">{row.affiliationCode}</td>
                        <td className="px-5 py-3.5">
                          <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${recordBadgeClasses(row.status)}`}>
                            <span className="h-1.5 w-1.5 rounded-full bg-current" />
                            {row.status}
                          </span>
                        </td>
                        {tab !== 'validos' && <td className="px-5 py-3.5 text-xs text-[#77869e]">{row.observation}</td>}
                      </tr>
                    ))}
                    {rowsForTab.length === 0 && (
                      <tr>
                        <td colSpan={7} className="px-5 py-10 text-center text-sm text-slate-400">No hay registros en esta categoría.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
                <div className="flex items-center justify-between border-t border-[#eef1f6] px-5 py-3 text-xs text-slate-400">
                  <span>Mostrando {rowsForTab.length} de {tab === 'validos' ? batch.validRecords : tab === 'observados' ? batch.observedRecords : batch.rejectedRecords} registros</span>
                  <span>Página 1</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {toast && (
        <div className="fixed bottom-6 right-6 z-[60] flex items-center gap-3 rounded-xl bg-[#102a56] px-4 py-3 text-sm font-semibold text-white shadow-xl">
          <CircleCheck size={18} className="text-[#62d6a4]" />
          {toast}
        </div>
      )}
    </main>
  )
}
