# Registro de procesamiento por lote
## Pantalla nueva del módulo ACH - ODD

**Fecha:** 15 de septiembre de 2026
**Ruta en el prototipo:** `/lotes/{id}`
**Ruta sugerida en ASP.NET:** `/Credicargo/Batches/Review/{batchId}`

## 1. Qué resuelve

Antes, la única forma de revisar un lote era la fila en la tabla de "Últimas cargas": código, empresa, cantidad de registros y un botón que no llevaba a ningún detalle. Esta pantalla nueva abre, a partir de cualquier lote, todo lo que un validador o autorizador necesita para decidir sin salir de la vista: avance del procesamiento, totales, quién hizo cada paso y el detalle de cada registro observado o rechazado.

Se llega a ella haciendo clic en el código de lote (o en la flecha `›`) desde el Resumen o desde Cargas y débitos.

## 2. Lote pendiente de aprobación

El caso más frecuente para un Validador o Autorizador: el lote ya fue cargado y validado automáticamente, tiene algunos registros observados y espera una decisión.

![Lote pendiente de aprobación](public/capturas/07-lote-pendiente-resumen.png)

**A destacar:**

- El stepper de arriba ubica de un vistazo en qué paso está el lote: *Cargado → Validado → Pendiente de aprobación → Aprobado → Procesando → Procesado*.
- Las 5 tarjetas resumen (total, válidos, observados, rechazados, monto) evitan tener que contar filas.
- La columna izquierda muestra el archivo original, la empresa, la cuenta recaudadora y quién hizo cada etapa, con fecha y hora.
- La pestaña **Resumen y trazabilidad** trae la bitácora completa: acción, usuario, rol y resultado — es el requisito de trazabilidad por lote que pedía el documento de funcionalidades.
- Los botones de la parte superior (Aprobar, Devolver, Reprocesar observados) solo aparecen si el estado y el rol lo permiten; en ASP.NET esa condición se recalcula en el servidor, nunca solo en la pantalla.

Al abrir la pestaña **Observados** se ve el detalle registro por registro, con el motivo de cada observación y la cuenta bancaria enmascarada:

![Detalle de registros observados](public/capturas/08-lote-pendiente-observados.png)

## 3. Lote con observaciones y rechazos

Cuando la validación automática encuentra más problemas, el lote queda en estado **Observado** y el stepper se bifurca para dejar claro que el flujo normal se interrumpió:

![Lote observado](public/capturas/09-lote-observado.png)

La pestaña **Rechazados** separa los registros que no se pueden corregir por reproceso (por ejemplo, cuenta bancaria inexistente) de los observados, que sí pueden reprocesarse una vez corregidos:

![Detalle de registros rechazados](public/capturas/10-lote-rechazados.png)

## 4. Lote procesado (flujo completo)

Un lote que pasó por todas las etapas sin observaciones muestra el stepper completo y la bitácora con las cinco acciones de punta a punta: carga, validación, envío a aprobación, aprobación y procesamiento.

![Lote procesado](public/capturas/11-lote-procesado.png)

## 5. Decisiones de diseño

- **Un stepper, no una lista de estados.** Se eligió un componente visual de avance en lugar de solo mostrar la palabra del estado, porque el usuario de banca necesita entender de inmediato "cuánto falta" y "si algo se salió del camino normal", no solo el estado actual.
- **Cuentas bancarias siempre enmascaradas** en las tablas de registros, tal como recomienda `ADAPTACION_ASP.md`.
- **Pestañas en vez de una tabla única con filtro**, porque separar válidos, observados y rechazados evita que el operador tenga que filtrar manualmente cada vez que entra a revisar un lote.
- **Trazabilidad dentro del Resumen**, no en una pantalla aparte, porque en la práctica se consulta junto con los datos del lote, no por separado.
- **Acciones contextuales**, no un menú fijo de botones: solo se ofrece Aprobar/Devolver/Reprocesar cuando el estado y el rol del usuario lo permiten.

## 6. Pendiente para la integración real

1. Reemplazar `app/lotes/[id]/data.ts` (datos de demostración) por llamadas a `GET /api/batches/{id}`, `GET /api/batches/{id}/records` y `GET /api/batches/{id}/audit`.
2. Paginar la tabla de registros en servidor; el prototipo solo muestra una página de ejemplo.
3. Calcular `CanApprove`, `CanReturn` y `CanReprocessObserved` desde los claims del usuario autenticado, no desde el prototipo.
4. Conectar los botones de acción a los endpoints `POST /api/batches/{id}/approve`, `/return`, `/reject` descritos en `ADAPTACION_ASP.md`.

La guía técnica completa de mapeo a ASP.NET (ViewModel, controlador y partials de Razor sugeridos para esta pantalla) está en `ADAPTACION_ASP.md`, sección **"Pantalla: Registro de procesamiento por lote"**.
