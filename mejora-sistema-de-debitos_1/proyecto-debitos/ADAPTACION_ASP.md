# Guía de adaptación para ASP.NET

## Objetivo

Este prototipo representa una propuesta de interfaz para modernizar el módulo ACH - ODD sin cambiar el proceso de negocio: afiliación masiva, validación, aprobación, procesamiento y trazabilidad.

## Estructura visual

- Barra superior institucional: logo, notificaciones y usuario.
- Menú lateral: Resumen, Afiliaciones, Cargas y débitos, Aprobaciones, Consultas y reportes.
- Resumen: indicadores, actividad, tareas pendientes y últimas cargas.
- Modal Nueva carga: tipo de operación, empresa, archivo y validación.

## Rutas ASP.NET sugeridas

```text
/Main/Resumen
/Credicargo/Affiliation
/Credicargo/Affiliation/MassUpload
/Credicargo/Debits
/Credicargo/Batches
/Credicargo/Batches/Review/{batchId}
/Credicargo/Reports
/Admin/Users
/Admin/Roles
```

## Modelo de datos mínimo

### Batch / Lote

- `BatchId` o `BatchCode`
- `OperationType`: AFFILIATION | DEBIT
- `CompanyId`
- `CollectorAccountId`
- `OriginalFileName`
- `TotalRecords`
- `ValidRecords`
- `ObservedRecords`
- `RejectedRecords`
- `TotalAmount`
- `Status`
- `CreatedBy`
- `CreatedAt`
- `ValidatedBy`, `ValidatedAt`
- `ApprovedBy`, `ApprovedAt`
- `ProcessedAt`
- `RejectionReason`

### BatchRecord / Registro del lote

- `BatchRecordId`
- `BatchId`
- `DocumentType`
- `DocumentNumber`
- `CustomerName`
- `BankAccount`
- `Amount`
- `DebitDate`
- `AffiliationCode`
- `Status`
- `Observation`

### AuditEvent / Auditoría

- `AuditEventId`
- `BatchId`
- `Action`
- `PreviousStatus`
- `NewStatus`
- `UserId`
- `CreatedAt`
- `Comment`
- `IpAddress`

## Estados recomendados

```text
DRAFT
VALIDATING
OBSERVED
PENDING_APPROVAL
APPROVED
PROCESSING
PROCESSED
REJECTED
CANCELLED
```

La transición de estado debe estar controlada en servidor. El perfil Operador no debe poder aprobar sus propias cargas.

## Endpoints sugeridos

```http
GET    /api/batches?status=&search=&page=&pageSize=
POST   /api/batches
POST   /api/batches/{id}/validate
GET    /api/batches/{id}/records
GET    /api/batches/{id}/errors
POST   /api/batches/{id}/approve
POST   /api/batches/{id}/return
POST   /api/batches/{id}/reject
POST   /api/batches/{id}/process
POST   /api/batches/{id}/cancel
GET    /api/batches/{id}/audit
GET    /api/affiliations?document=&companyId=&status=
```

Para cargas grandes, `POST /validate` puede responder con un identificador de proceso y ejecutarse como tarea en segundo plano. El front debe consultar el estado o recibir una notificación cuando termine.

## Perfiles y permisos

El prototipo incluye un selector de perfil para demostrar permisos en pantalla. En ASP.NET debe reemplazarse por la identidad y los claims reales del usuario; el selector de demo no debe existir en producción.


| Permiso | Operador | Validador | Autorizador | Supervisor | Administrador |
|---|---:|---:|---:|---:|---:|
| Crear carga | Sí | Sí | No | Sí | Sí |
| Ver registros | Sí | Sí | Sí | Sí | Sí |
| Validar carga | No | Sí | Sí | Sí | Sí |
| Aprobar carga | No | No | Sí | Sí | Sí |
| Reprocesar observados | No | Sí | No | Sí | Sí |
| Anular carga | No | No | No | Sí | Sí |
| Gestionar usuarios | No | No | No | No | Sí |

## Reglas de validación

1. Validar extensión, tamaño máximo y estructura del archivo.
2. Validar campos obligatorios y tipos de documento permitidos.
3. Validar duplicados dentro del archivo y contra afiliaciones existentes.
4. Validar empresa, cuenta recaudadora y cuenta bancaria.
5. Validar montos positivos, fechas y límites configurables.
6. Separar registros correctos, observados y rechazados.
7. Generar archivo descargable con fila, campo, código y descripción del error.
8. No guardar ni procesar un lote que no tenga resultado de validación.

## Pantalla: Registro de procesamiento por lote

Corresponde a la ruta `/Credicargo/Batches/Review/{batchId}` y es la vista de detalle a la que se llega desde cualquier lote listado en Resumen o en Cargas y débitos. Reemplaza la revisión manual registro por registro: el validador/autorizador ve todo el resultado de la carga antes de decidir.

### Composición de la vista

1. **Encabezado** — código de lote, tipo de operación, empresa y una insignia de estado (mismo componente `_StatusBadge` de la lista).
2. **Barra de acciones contextual** — botones habilitados según `Status` y el rol del usuario autenticado (no según lo que el usuario elija en pantalla):
   - `PENDING_APPROVAL` + rol Autorizador/Supervisor → Aprobar, Devolver.
   - `OBSERVED` + rol Validador/Supervisor → Reprocesar observados.
   - Siempre disponible → Descargar archivo de resultados.
3. **Stepper de avance** — Cargado → Validado → Pendiente de aprobación → Aprobado → Procesando → Procesado, con una bifurcación visual cuando el estado es `OBSERVED` o `REJECTED`.
4. **Tarjetas KPI** — Total, válidos, observados, rechazados y monto total del lote.
5. **Panel de datos del lote y responsables por etapa** — `CreatedBy/At`, `ValidatedBy/At`, `ApprovedBy/At`, `ProcessedAt`.
6. **Pestañas de registros** — Válidos / Observados / Rechazados, cada una paginada en servidor, con cuenta bancaria enmascarada y, en observados/rechazados, la columna `Observation` con el motivo.
7. **Trazabilidad del lote** — línea de tiempo con cada `AuditEvent`: acción, usuario ejecutor, rol, fecha/hora y comentario. Es el requisito de trazabilidad por identificador de lote, usuario y resultado.

### ViewModel sugerido

```csharp
public class BatchDetailViewModel
{
    public string BatchId { get; set; }
    public string OperationType { get; set; }
    public string CompanyName { get; set; }
    public string CollectorAccountLabel { get; set; }
    public string OriginalFileName { get; set; }
    public string Status { get; set; }
    public int TotalRecords { get; set; }
    public int ValidRecords { get; set; }
    public int ObservedRecords { get; set; }
    public int RejectedRecords { get; set; }
    public decimal TotalAmount { get; set; }
    public string CreatedBy { get; set; }
    public DateTime CreatedAt { get; set; }
    public string ValidatedBy { get; set; }
    public DateTime? ValidatedAt { get; set; }
    public string ApprovedBy { get; set; }
    public DateTime? ApprovedAt { get; set; }
    public DateTime? ProcessedAt { get; set; }
    public bool CanApprove { get; set; }
    public bool CanReturn { get; set; }
    public bool CanReprocessObserved { get; set; }
    public List<BatchAuditEventViewModel> Audit { get; set; }
}
```

`CanApprove`, `CanReturn` y `CanReprocessObserved` se calculan en el controlador a partir del rol/claims reales, nunca en el cliente; la vista solo oculta o muestra botones, pero el endpoint vuelve a validar el permiso.

### Controlador (ejemplo mínimo)

```csharp
[HttpGet("Credicargo/Batches/Review/{batchId}")]
public async Task<IActionResult> Review(string batchId)
{
    var batch = await _batchService.GetDetailAsync(batchId);
    if (batch == null) return NotFound();

    var model = _mapper.Map<BatchDetailViewModel>(batch);
    model.CanApprove = User.IsInRole("Autorizador") || User.IsInRole("Supervisor");
    model.CanReturn = model.CanApprove;
    model.CanReprocessObserved = User.IsInRole("Validador") || User.IsInRole("Supervisor");
    return View(model);
}

// Los registros de cada pestaña se cargan aparte, paginados:
// GET /api/batches/{batchId}/records?status=OBSERVED&page=1&pageSize=25
```

### Partials sugeridos para esta vista

- `Credicargo/Batches/Review.cshtml` — layout general de la pantalla.
- `Credicargo/_BatchStepper.cshtml` — stepper de avance, recibe `Status`.
- `Credicargo/_BatchKpiCards.cshtml` — las 5 tarjetas de totales.
- `Credicargo/_BatchRecordsTable.cshtml` — tabla de registros, reutilizable para las tres pestañas cambiando el filtro de estado.
- `Credicargo/_BatchAuditTimeline.cshtml` — línea de tiempo de trazabilidad.

Estos mismos bloques se pueden convertir en User Controls (`.ascx`) si el proyecto sigue en Web Forms.

## Integración en Razor / MVC

Puedes reemplazar progresivamente la vista actual con estos bloques:

- `Shared/_Topbar.cshtml`
- `Shared/_Sidebar.cshtml`
- `Credicargo/Resumen.cshtml`
- `Credicargo/_BatchTable.cshtml`
- `Credicargo/_UploadModal.cshtml`
- `Credicargo/_StatusBadge.cshtml`

Conserva las URLs existentes y adapta los nombres de campos del modelo. Si usas Web Forms, los mismos bloques pueden convertirse en User Controls (`.ascx`).

## Recomendaciones de implementación

- Mantener validaciones críticas en backend; JavaScript solo mejora la experiencia.
- Registrar auditoría para cada cambio de estado.
- Aplicar paginación del lado servidor.
- Utilizar antiforgery tokens en formularios y endpoints mutables.
- Limitar tamaño, extensión y contenido de archivos.
- No mostrar cuentas bancarias completas en tablas; enmascarar parte de la cuenta.
- Deshabilitar acciones según permisos, pero validar autorización nuevamente en servidor.
- Añadir exportación de resultados y descarga de errores.
- Usar mensajes con código de lote para facilitar soporte.

## Migración por fases

1. Crear roles y permisos sin modificar el procesamiento actual.
2. Crear tabla de lotes y auditoría.
3. Incorporar carga masiva y validación previa.
4. Habilitar bandeja de revisión y autorización.
5. Migrar el procesamiento de débitos a estados y lotes.
6. Retirar el alta individual solo después de validar equivalencia funcional.

## Datos de ejemplo del prototipo

Los datos visibles en la interfaz son demostrativos. En ASP deben reemplazarse por llamadas a tus controladores, servicios o APIs existentes; no deben copiarse como información productiva.
