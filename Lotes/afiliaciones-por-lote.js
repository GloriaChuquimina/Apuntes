/**
 * Afiliaciones por lote – Lógica de UI (equivalente a AffiliationsWorkflow)
 * Compatible con Bootstrap 5
 */
(function () {
    'use strict';

    // ---------- Datos de ejemplo (mock) ----------
    let lots = [
        {
            id: 'AFI-2026-0914-003',
            company: 'Aldeas Infantiles SOS Bolivia',
            account: '1020347026',
            records: 1248,
            errors: 12,
            status: 'Pendiente de autorización'
        },
        {
            id: 'AFI-2026-0913-002',
            company: 'Administradora de Tarjetas ATC',
            account: '1020397027',
            records: 312,
            errors: 0,
            status: 'Validado'
        },
        {
            id: 'AFI-2026-0912-001',
            company: 'Colegio Horizontes - Colhori',
            account: '1020221022',
            records: 87,
            errors: 4,
            status: 'Observado'
        }
    ];

    const codigosDocumento = [
        { code: 'A', label: 'Cédula de Identidad' },
        { code: 'B', label: 'Pasaporte' },
        { code: 'C', label: 'RUN' },
        { code: 'D', label: 'CAPPN' },
        { code: 'F', label: 'Personería Jurídica' },
        { code: 'J', label: 'RUC' },
        { code: 'N', label: 'NIT' }
    ];

    // Simulación de rol (cámbialo según tu auth)
    // 'Operador' | 'Autorizador' | 'Supervisor'
    const currentRole = 'Operador';
    const canApprove = currentRole === 'Autorizador' || currentRole === 'Supervisor';

    // Estado
    let currentStep = 'directory'; // 'directory' | 'upload' | 'preview'
    let selected = [];
    let filterText = '';
    let selectedFileName = '';

    // ---------- Helpers ----------
    function notify(message) {
        const toastEl = document.getElementById('toastNotificacion');
        const msgEl = document.getElementById('toastMensaje');
        if (!toastEl || !msgEl) {
            alert(message);
            return;
        }
        msgEl.textContent = message;
        const toast = bootstrap.Toast.getOrCreateInstance(toastEl, { delay: 3200 });
        toast.show();
    }

    function statusBadgeClass(status) {
        if (status === 'Aprobado' || status === 'Validado') return 'badge-validado';
        if (status === 'Observado') return 'badge-observado';
        return 'badge-pendiente';
    }

    function statusLabel(status) {
        // Acorta visualmente si es muy largo
        if (status === 'Pendiente de autorización') return 'Pendiente autorización';
        return status;
    }

    // ---------- Render: códigos de documento ----------
    function renderCodigos() {
        const container = document.getElementById('listaCodigos');
        if (!container) return;
        container.innerHTML = codigosDocumento.map(c => `
            <div class="codigo-row">
                <span class="codigo-badge">${c.code}</span>
                <span>${c.label}</span>
            </div>
        `).join('');
    }

    // ---------- Render: tabla de lotes ----------
    function getVisibleLots() {
        const q = filterText.toLowerCase().trim();
        if (!q) return lots;
        return lots.filter(lot =>
            `${lot.id} ${lot.company} ${lot.status}`.toLowerCase().includes(q)
        );
    }

    function renderLotsTable() {
        const tbody = document.getElementById('tbodyLotes');
        if (!tbody) return;

        const visible = getVisibleLots();
        tbody.innerHTML = visible.map(lot => {
            const checked = selected.includes(lot.id) ? 'checked' : '';
            return `
                <tr>
                    <td>
                        <input type="checkbox" class="form-check-input lote-check"
                               data-id="${lot.id}" ${checked}
                               aria-label="Seleccionar ${lot.id}" />
                    </td>
                    <td><span class="lote-id">${lot.id}</span></td>
                    <td>
                        <span class="empresa-nombre">${lot.company}</span>
                        <span class="empresa-cuenta">${lot.account}</span>
                    </td>
                    <td>${lot.records}</td>
                    <td>${lot.errors}</td>
                    <td>
                        <span class="badge-estado ${statusBadgeClass(lot.status)}">
                            ${statusLabel(lot.status)}
                        </span>
                    </td>
                </tr>
            `;
        }).join('');

        // Re-bind checkboxes
        tbody.querySelectorAll('.lote-check').forEach(cb => {
            cb.addEventListener('change', onToggleLot);
        });

        updateSelectionCounter();
    }

    function updateSelectionCounter() {
        const el = document.getElementById('contadorSeleccionados');
        const btn = document.getElementById('btnVistaPrevia');
        if (el) el.textContent = `${selected.length} lote(s) seleccionado(s)`;
        if (btn) btn.disabled = selected.length === 0;
    }

    function onToggleLot(e) {
        const id = e.target.dataset.id;
        if (e.target.checked) {
            if (!selected.includes(id)) selected.push(id);
        } else {
            selected = selected.filter(x => x !== id);
        }
        updateSelectionCounter();
    }

    // ---------- Render: preview ----------
    function renderPreview() {
        const selectedLots = lots.filter(l => selected.includes(l.id));
        const totalRecords = selectedLots.reduce((s, l) => s + l.records, 0);
        const totalErrors = selectedLots.reduce((s, l) => s + l.errors, 0);

        const resumen = document.getElementById('resumenPreview');
        if (resumen) {
            resumen.innerHTML = `
                <div class="col-sm-4">
                    <div class="resumen-card">
                        <div class="label">Lotes</div>
                        <div class="value">${selectedLots.length}</div>
                        <div class="detail">seleccionados</div>
                    </div>
                </div>
                <div class="col-sm-4">
                    <div class="resumen-card">
                        <div class="label">Registros</div>
                        <div class="value">${totalRecords}</div>
                        <div class="detail">a afiliar</div>
                    </div>
                </div>
                <div class="col-sm-4">
                    <div class="resumen-card">
                        <div class="label">Observados</div>
                        <div class="value">${totalErrors}</div>
                        <div class="detail">requieren atención</div>
                    </div>
                </div>
            `;
        }

        const tbody = document.getElementById('tbodyPreview');
        if (tbody) {
            tbody.innerHTML = selectedLots.map(lot => `
                <tr>
                    <td><span class="lote-id">${lot.id}</span></td>
                    <td>${lot.company}</td>
                    <td>${lot.records}</td>
                    <td>${lot.errors}</td>
                    <td>
                        <span class="badge-estado ${statusBadgeClass(lot.status)}">
                            ${statusLabel(lot.status)}
                        </span>
                    </td>
                </tr>
            `).join('');
        }

        const acciones = document.getElementById('accionesPreview');
        if (acciones) {
            if (canApprove) {
                acciones.innerHTML = `
                    <button type="button" class="btn btn-success" id="btnAutorizar">
                        <i class="bi bi-check-lg"></i> Autorizar lotes seleccionados
                    </button>
                `;
                document.getElementById('btnAutorizar').addEventListener('click', onApprove);
            } else {
                acciones.innerHTML = `
                    <div class="alert alert-warning mb-0" style="background:#fff4df;border:none;color:#a66b00;font-weight:600;">
                        Tu perfil no puede autorizar. La vista previa queda disponible para revisión.
                    </div>
                `;
            }
        }
    }

    function onApprove() {
        if (!selected.length) {
            notify('Selecciona al menos un lote para aprobar');
            return;
        }
        lots = lots.map(lot =>
            selected.includes(lot.id) ? { ...lot, status: 'Aprobado' } : lot
        );
        selected = [];
        setStep('directory');
        notify('Lotes de afiliación aprobados correctamente');
    }

    // ---------- Step management ----------
    function setStep(step) {
        currentStep = step;

        // Panels
        document.getElementById('step-directory').classList.toggle('d-none', step !== 'directory');
        document.getElementById('step-upload').classList.toggle('d-none', step !== 'upload');
        document.getElementById('step-preview').classList.toggle('d-none', step !== 'preview');

        // Stepper visual
        document.querySelectorAll('.step-item').forEach(el => {
            el.classList.toggle('active', el.dataset.step === step);
        });

        if (step === 'directory') {
            renderLotsTable();
        } else if (step === 'preview') {
            renderPreview();
        }
    }

    // ---------- Event listeners ----------
    function bindEvents() {
        // Filtro
        const filtro = document.getElementById('filtroLotes');
        if (filtro) {
            filtro.addEventListener('input', (e) => {
                filterText = e.target.value;
                renderLotsTable();
            });
        }

        // Botones header
        document.getElementById('btnDescargarPlantilla')?.addEventListener('click', () => {
            notify('Plantilla de afiliación descargada');
        });

        document.getElementById('btnNuevaAfiliacion')?.addEventListener('click', () => {
            setStep('upload');
        });

        // Directory → Preview
        document.getElementById('btnVistaPrevia')?.addEventListener('click', () => {
            if (selected.length === 0) return;
            setStep('preview');
        });

        // Upload
        document.getElementById('btnCerrarUpload')?.addEventListener('click', () => setStep('directory'));
        document.getElementById('btnCancelarUpload')?.addEventListener('click', () => setStep('directory'));

        const inputArchivo = document.getElementById('inputArchivo');
        const btnValidar = document.getElementById('btnValidarArchivo');
        const nombreArchivo = document.getElementById('nombreArchivo');

        if (inputArchivo) {
            inputArchivo.addEventListener('change', (e) => {
                const file = e.target.files?.[0];
                selectedFileName = file ? file.name : '';
                if (nombreArchivo) {
                    nombreArchivo.textContent = selectedFileName || 'Seleccionar .xlsx, .csv o .txt';
                }
                if (btnValidar) btnValidar.disabled = !selectedFileName;
            });
        }

        if (btnValidar) {
            btnValidar.addEventListener('click', () => {
                if (!selectedFileName) return;
                // Simula que el nuevo lote se agrega y se va a preview
                // En producción: enviar al backend y recibir el id del lote
                notify('Archivo validado: revisa el resumen del lote');
                // Para demo, selecciona el primer lote y va a preview
                if (lots.length && !selected.includes(lots[0].id)) {
                    selected = [lots[0].id];
                }
                setStep('preview');
            });
        }

        // Preview → Directory
        document.getElementById('btnVolverBandeja')?.addEventListener('click', () => {
            setStep('directory');
        });
    }

    // ---------- Init ----------
    document.addEventListener('DOMContentLoaded', () => {
        renderCodigos();
        renderLotsTable();
        bindEvents();
        setStep('directory');
    });
})();
