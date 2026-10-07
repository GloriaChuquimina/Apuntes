// Datos de demostración para la pantalla "Registro de procesamiento por lote".
// En producción, este módulo se reemplaza por una llamada a
// GET /api/batches/{id}, GET /api/batches/{id}/records y GET /api/batches/{id}/audit.

export type Tone = 'warning' | 'success' | 'danger' | 'info' | 'neutral'
export type RecordStatus = 'Válido' | 'Observado' | 'Rechazado'

export interface BatchRecordRow {
  documentType: string
  documentNumber: string
  customerName: string
  bankAccount: string
  amount: number
  debitDate: string
  affiliationCode: string
  status: RecordStatus
  observation?: string
}

export interface AuditEvent {
  action: string
  previousStatus: string
  newStatus: string
  userName: string
  role: string
  createdAt: string
  comment?: string
}

export interface BatchDetail {
  id: string
  operationType: 'Afiliación masiva' | 'Débito automático'
  company: string
  companyId: string
  collectorAccount: string
  originalFileName: string
  totalRecords: number
  validRecords: number
  observedRecords: number
  rejectedRecords: number
  totalAmount: number
  observedAmount: number
  status: string
  tone: Tone
  createdBy: string
  createdAt: string
  validatedBy?: string
  validatedAt?: string
  approvedBy?: string
  approvedAt?: string
  processedAt?: string
  records: BatchRecordRow[]
  audit: AuditEvent[]
}

export function maskAccount(account: string) {
  const digits = account.replace(/\D/g, '')
  if (digits.length <= 4) return account
  return `••• ${digits.slice(-4)}`
}

export function formatCurrency(amount: number) {
  return `Bs ${amount.toLocaleString('es-BO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

const names = [
  'Rosa Quispe Mamani', 'Jorge Fernández Vera', 'Silvia Choque Apaza', 'Marcelo Torrez Salazar',
  'Ana Belén Gutiérrez', 'Freddy Callisaya Choque', 'Patricia Guzmán Ríos', 'Édgar Mamani Colque',
  'Verónica Suárez Paco', 'Iván Rodríguez Poma', 'Karina Villarroel Nina', 'Óscar Choquehuanca Flores',
]

function buildRecords(config: { total: number; observed: number; rejected: number; baseAmount: number; reason: string[] }): BatchRecordRow[] {
  const rows: BatchRecordRow[] = []
  for (let i = 0; i < config.total; i += 1) {
    const name = names[i % names.length]
    const isObserved = i < config.observed
    const isRejected = i >= config.observed && i < config.observed + config.rejected
    const status: RecordStatus = isObserved ? 'Observado' : isRejected ? 'Rechazado' : 'Válido'
    rows.push({
      documentType: 'CI',
      documentNumber: `${6200000 + i * 37}`,
      customerName: name,
      bankAccount: `10203${(51000000 + i * 941).toString().slice(0, 8)}`,
      amount: Math.round((config.baseAmount + i * 37.5) * 100) / 100,
      debitDate: '20 sep 2026',
      affiliationCode: `AF-${1000 + i}`,
      status,
      observation: isObserved ? config.reason[i % config.reason.length] : isRejected ? 'Cuenta bancaria no encontrada' : undefined,
    })
  }
  return rows
}

export const batchesDetail: Record<string, BatchDetail> = {
  'LOT-2026-0914-018': {
    id: 'LOT-2026-0914-018',
    operationType: 'Afiliación masiva',
    company: 'Aldeas Infantiles SOS Bolivia',
    companyId: '1020347026',
    collectorAccount: 'Cta. recaudadora 4400-9987-21 · BCP',
    originalFileName: 'afiliacion_aldeas_sos_sep2026.xlsx',
    totalRecords: 1248,
    validRecords: 1240,
    observedRecords: 8,
    rejectedRecords: 0,
    totalAmount: 182430,
    observedAmount: 1180,
    status: 'Pendiente de aprobación',
    tone: 'warning',
    createdBy: 'María Fernández',
    createdAt: '14 sep 2026, 16:20',
    validatedBy: 'Sistema (validación automática)',
    validatedAt: '14 sep 2026, 16:35',
    records: buildRecords({ total: 10, observed: 2, rejected: 0, baseAmount: 140, reason: ['Documento de identidad no coincide con afiliación', 'Monto informado excede el límite configurado'] }),
    audit: [
      { action: 'Carga de archivo', previousStatus: '—', newStatus: 'Cargado', userName: 'María Fernández', role: 'Operador', createdAt: '14 sep 2026, 16:20' },
      { action: 'Validación de estructura y datos', previousStatus: 'Cargado', newStatus: 'Validado', userName: 'Sistema', role: 'Automático', createdAt: '14 sep 2026, 16:35', comment: '1,240 registros válidos, 8 observados sobre 1,248.' },
      { action: 'Envío a aprobación', previousStatus: 'Validado', newStatus: 'Pendiente de aprobación', userName: 'María Fernández', role: 'Operador', createdAt: '14 sep 2026, 16:42' },
    ],
  },
  'LOT-2026-0914-017': {
    id: 'LOT-2026-0914-017',
    operationType: 'Débito automático',
    company: 'Alianza Cía. de Seguros',
    companyId: '1020351029',
    collectorAccount: 'Cta. recaudadora 4400-1123-08 · BCP',
    originalFileName: 'debito_alianza_seguros_sep2026.csv',
    totalRecords: 583,
    validRecords: 583,
    observedRecords: 0,
    rejectedRecords: 0,
    totalAmount: 94210,
    observedAmount: 0,
    status: 'Procesado',
    tone: 'success',
    createdBy: 'Carlos Rojas',
    createdAt: '14 sep 2026, 09:05',
    validatedBy: 'Sistema (validación automática)',
    validatedAt: '14 sep 2026, 09:12',
    approvedBy: 'Daniela Castro',
    approvedAt: '14 sep 2026, 10:30',
    processedAt: '14 sep 2026, 14:10',
    records: buildRecords({ total: 10, observed: 0, rejected: 0, baseAmount: 160, reason: [] }),
    audit: [
      { action: 'Carga de archivo', previousStatus: '—', newStatus: 'Cargado', userName: 'Carlos Rojas', role: 'Operador', createdAt: '14 sep 2026, 09:05' },
      { action: 'Validación de estructura y datos', previousStatus: 'Cargado', newStatus: 'Validado', userName: 'Sistema', role: 'Automático', createdAt: '14 sep 2026, 09:12', comment: '583 de 583 registros válidos.' },
      { action: 'Revisión previa a la corrida', previousStatus: 'Validado', newStatus: 'Pendiente de aprobación', userName: 'Carlos Rojas', role: 'Operador', createdAt: '14 sep 2026, 09:20' },
      { action: 'Aprobación del lote', previousStatus: 'Pendiente de aprobación', newStatus: 'Aprobado', userName: 'Daniela Castro', role: 'Autorizador', createdAt: '14 sep 2026, 10:30', comment: 'Datos verificados contra archivo enviado por la empresa.' },
      { action: 'Procesamiento del débito', previousStatus: 'Aprobado', newStatus: 'Procesado', userName: 'Sistema', role: 'Automático', createdAt: '14 sep 2026, 14:10' },
    ],
  },
  'LOT-2026-0913-016': {
    id: 'LOT-2026-0913-016',
    operationType: 'Afiliación masiva',
    company: 'Administradora de Tarjetas ATC',
    companyId: '1020397027',
    collectorAccount: 'Cta. recaudadora 4400-5541-77 · BCP',
    originalFileName: 'afiliacion_atc_lote16.xlsx',
    totalRecords: 312,
    validRecords: 289,
    observedRecords: 19,
    rejectedRecords: 4,
    totalAmount: 45680,
    observedAmount: 3120,
    status: 'Observado',
    tone: 'danger',
    createdBy: 'Luis Mendoza',
    createdAt: '13 sep 2026, 11:05',
    validatedBy: 'Sistema (validación automática)',
    validatedAt: '13 sep 2026, 11:20',
    records: buildRecords({ total: 12, observed: 5, rejected: 2, baseAmount: 130, reason: ['Usuario ya afiliado previamente', 'Campo obligatorio incompleto', 'Código de afiliación duplicado en el archivo'] }),
    audit: [
      { action: 'Carga de archivo', previousStatus: '—', newStatus: 'Cargado', userName: 'Luis Mendoza', role: 'Operador', createdAt: '13 sep 2026, 11:05' },
      { action: 'Validación de estructura y datos', previousStatus: 'Cargado', newStatus: 'Observado', userName: 'Sistema', role: 'Automático', createdAt: '13 sep 2026, 11:20', comment: '289 válidos, 19 observados y 4 rechazados sobre 312.' },
      { action: 'Notificación al operador', previousStatus: 'Observado', newStatus: 'Observado', userName: 'Sistema', role: 'Automático', createdAt: '13 sep 2026, 11:21', comment: 'Se notificó a Luis Mendoza para corregir los registros observados.' },
    ],
  },
  'LOT-2026-0912-015': {
    id: 'LOT-2026-0912-015',
    operationType: 'Débito automático',
    company: 'Colegio Horizontes',
    companyId: '1020221022',
    collectorAccount: 'Cta. recaudadora 4400-8820-14 · BCP',
    originalFileName: 'debito_colegio_horizontes_sep2026.txt',
    totalRecords: 87,
    validRecords: 87,
    observedRecords: 0,
    rejectedRecords: 0,
    totalAmount: 12980,
    observedAmount: 0,
    status: 'Procesando',
    tone: 'info',
    createdBy: 'María Fernández',
    createdAt: '12 sep 2026, 08:40',
    validatedBy: 'Sistema (validación automática)',
    validatedAt: '12 sep 2026, 08:50',
    approvedBy: 'Daniela Castro',
    approvedAt: '12 sep 2026, 09:05',
    records: buildRecords({ total: 10, observed: 0, rejected: 0, baseAmount: 145, reason: [] }),
    audit: [
      { action: 'Carga de archivo', previousStatus: '—', newStatus: 'Cargado', userName: 'María Fernández', role: 'Operador', createdAt: '12 sep 2026, 08:40' },
      { action: 'Validación de estructura y datos', previousStatus: 'Cargado', newStatus: 'Validado', userName: 'Sistema', role: 'Automático', createdAt: '12 sep 2026, 08:50', comment: '87 de 87 registros válidos.' },
      { action: 'Aprobación del lote', previousStatus: 'Pendiente de aprobación', newStatus: 'Aprobado', userName: 'Daniela Castro', role: 'Autorizador', createdAt: '12 sep 2026, 09:05' },
      { action: 'Envío a procesamiento', previousStatus: 'Aprobado', newStatus: 'Procesando', userName: 'Sistema', role: 'Automático', createdAt: '12 sep 2026, 09:16' },
    ],
  },
}

export function getBatchDetail(id: string): BatchDetail {
  return batchesDetail[id] ?? batchesDetail['LOT-2026-0914-018']
}
