/**
 * ACH-ODD · Lógica completa del sitio
 * Navegación, roles, secciones, modales, toasts
 */
(function () {
  'use strict';

  // ---------- Tipos / datos ----------
  const ROLES = ['Operador', 'Validador', 'Autorizador', 'Supervisor'];
  const ROLE_DESC = {
    Operador: 'Carga archivos y consulta sus resultados.',
    Validador: 'Revisa registros observados antes de aprobar.',
    Autorizador: 'Aprueba lotes listos para procesamiento.',
    Supervisor: 'Administra operaciones, usuarios y anulaciones.'
  };

  let role = 'Validador';
  let activeNav = 'Resumen';
  let search = '';
  let showUpload = false;
  let showMobileNav = false;
  let showNotifications = false;
  let showRoleInfo = false;

  // Batches (cargas)
  let batches = [
    { id: 'LOT-2026-0914-018', company: 'Aldeas Infantiles SOS Bolivia', type: 'Afiliación masiva', records: '1,248', amount: 'Bs 182,430.00', date: '14 sep 2026, 16:42', user: 'María Fernández', status: 'Pendiente de aprobación', tone: 'warning' },
    { id: 'LOT-2026-0914-017', company: 'Alianza Cía. de Seguros', type: 'Débito automático', records: '583', amount: 'Bs 94,210.00', date: '14 sep 2026, 14:10', user: 'Carlos Rojas', status: 'Procesado', tone: 'success' },
    { id: 'LOT-2026-0913-016', company: 'Administradora de Tarjetas ATC', type: 'Afiliación masiva', records: '312', amount: 'Bs 45,680.00', date: '13 sep 2026, 11:28', user: 'Luis Mendoza', status: 'Observado', tone: 'danger' },
    { id: 'LOT-2026-0912-015', company: 'Colegio Horizontes', type: 'Débito automático', records: '87', amount: 'Bs 12,980.00', date: '12 sep 2026, 09:16', user: 'María Fernández', status: 'Procesando', tone: 'info' }
  ];

  // Afiliaciones por lote
  let lots = [
    { id: 'AFI-2026-0914-003', company: 'Aldeas Infantiles SOS Bolivia', account: '1020347026', records: 1248, errors: 12, status: 'Pendiente de autorización' },
    { id: 'AFI-2026-0913-002', company: 'Administradora de Tarjetas ATC', account: '1020397027', records: 312, errors: 0, status: 'Validado' },
    { id: 'AFI-2026-0912-001', company: 'Colegio Horizontes - Colhori', account: '1020221022', records: 87, errors: 4, status: 'Observado' }
  ];
  let lotFilter = '';
  let lotSelected = [];
  let lotStep = 'directory';
  let lotFile = '';
  let lotCompany = 'Aldeas Infantiles SOS Bolivia';

  const COMPANIES = ['Aldeas Infantiles SOS Bolivia', 'Administradora de Tarjetas ATC', 'Colegio Horizontes - Colhori', 'Alianza Cía. de Seguros'];
  const CODIGOS = [
    ['A', 'Cédula de Identidad'], ['B', 'Pasaporte'], ['C', 'RUN'], ['D', 'CAPPN'],
    ['F', 'Personería Jurídica'], ['J', 'RUC'], ['N', 'NIT']
  ];
  const REPORTS = [
    ['Reporte de afiliaciones', 'Altas, bajas y observaciones por empresa'],
    ['Reporte de débitos', 'Montos procesados, rechazados y anulados'],
    ['Auditoría de lotes', 'Historial de usuarios y acciones realizadas'],
    ['Conciliación bancaria', 'Comparación entre archivos y resultados'],
    ['Indicadores operativos', 'Tiempos, volúmenes y productividad'],
    ['Exportación personalizada', 'Selecciona columnas y filtros']
  ];

  function can(action) {
    if (action === 'upload') return ['Operador', 'Supervisor'].includes(role);
    if (action === 'approve') return ['Autorizador', 'Supervisor'].includes(role);
    if (action === 'validate') return ['Validador', 'Supervisor'].includes(role);
    if (action === 'access') return role === 'Supervisor';
    return true;
  }

  function toneClass(tone) {
    return ({ warning: 'badge-warning', success: 'badge-success', danger: 'badge-danger', info: 'badge-info' })[tone] || 'badge-info';
  }

  function statusLotClass(status) {
    if (status === 'Aprobado' || status === 'Validado') return 'badge-success';
    if (status === 'Observado') return 'badge-danger';
    return 'badge-warning';
  }

  // ---------- Toast ----------
  function notify(msg) {
    const el = document.getElementById('toastAch');
    const text = document.getElementById('toastText');
    if (!el || !text) { alert(msg); return; }
    text.textContent = msg;
    el.classList.remove('d-none');
    clearTimeout(el._t);
    el._t = setTimeout(() => el.classList.add('d-none'), 2800);
  }

  // ---------- Nav ----------
  function navigate(key) {
    activeNav = key;
    showMobileNav = false;
    showNotifications = false;
    showRoleInfo = false;
    document.querySelectorAll('.section-panel').forEach(p => p.classList.remove('active'));
    const panel = document.getElementById('sec-' + key.replace(/\s+/g, '-').toLowerCase());
    // Map keys to ids
    const map = {
      'Resumen': 'sec-resumen',
      'Afiliaciones': 'sec-afiliaciones',
      'Cargas y débitos': 'sec-cargas',
      'Aprobaciones': 'sec-aprobaciones',
      'Consultas y reportes': 'sec-reportes',
      'Control de accesos': 'sec-accesos'
    };
    document.querySelectorAll('.section-panel').forEach(p => p.classList.remove('active'));
    const target = document.getElementById(map[key]);
    if (target) target.classList.add('active');

    document.querySelectorAll('.nav-link-item').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.nav === key);
    });

    // Sidebar mobile
    const side = document.getElementById('sidebar');
    if (side) side.classList.toggle('mobile-open', showMobileNav);

    // Close dropdowns
    document.getElementById('panelNotif')?.classList.add('d-none');
    document.getElementById('panelRole')?.classList.add('d-none');

    // Re-render active section data
    if (key === 'Resumen' || key === 'Cargas y débitos') renderBatchTables();
    if (key === 'Afiliaciones') renderAfiliaciones();
    if (key === 'Aprobaciones') renderAprobaciones();
    if (key === 'Consultas y reportes') renderReportes();
    if (key === 'Control de accesos') renderAccesos();
  }

  // ---------- Batches table ----------
  function filteredBatches() {
    const q = search.toLowerCase();
    return batches.filter(b => `${b.id} ${b.company} ${b.status}`.toLowerCase().includes(q));
  }

  function renderBatchTable(tbodyId) {
    const tbody = document.getElementById(tbodyId);
    if (!tbody) return;
    const rows = filteredBatches();
    tbody.innerHTML = rows.map(b => `
      <tr>
        <td>
          <span class="lote-id">${b.id}</span>
          <span class="sub-muted">${b.amount}</span>
        </td>
        <td>
          <span class="fw-medium" style="color:var(--navy-mid)">${b.company}</span>
          <span class="sub-muted">${b.type}</span>
        </td>
        <td style="color:var(--slate)">${b.records}</td>
        <td>
          <span style="color:var(--slate)">${b.date}</span>
          <span class="sub-muted">${b.user}</span>
        </td>
        <td><span class="badge-tone ${toneClass(b.tone)}">${b.status}</span></td>
        <td>
          <button class="btn btn-sm btn-light text-muted btn-batch-action" data-id="${b.id}" aria-label="Ver ${b.id}">
            <i class="bi bi-chevron-right"></i>
          </button>
        </td>
      </tr>
    `).join('');
    tbody.querySelectorAll('.btn-batch-action').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.dataset.id;
        const b = batches.find(x => x.id === id);
        if (!b) return;
        const newStatus = b.status === 'Observado' ? 'En validación' : 'Detalle consultado';
        const newTone = b.status === 'Observado' ? 'info' : b.tone;
        updateBatch(id, newStatus, newTone);
      });
    });
  }

  function renderBatchTables() {
    renderBatchTable('tbodyBatchesResumen');
    renderBatchTable('tbodyBatchesCargas');
  }

  function updateBatch(id, status, tone) {
    batches = batches.map(b => b.id === id ? { ...b, status, tone } : b);
    notify(`Lote ${id} actualizado`);
    renderBatchTables();
    if (activeNav === 'Aprobaciones') renderAprobaciones();
  }

  // ---------- Afiliaciones workflow ----------
  function renderAfiliaciones() {
    // Stepper
    document.querySelectorAll('.step-pill').forEach(el => {
      el.classList.toggle('active', el.dataset.step === lotStep);
    });
    document.getElementById('afi-directory')?.classList.toggle('d-none', lotStep !== 'directory');
    document.getElementById('afi-upload')?.classList.toggle('d-none', lotStep !== 'upload');
    document.getElementById('afi-preview')?.classList.toggle('d-none', lotStep !== 'preview');

    // Nueva afiliación button visibility
    const btnNueva = document.getElementById('btnNuevaAfiliacion');
    if (btnNueva) btnNueva.classList.toggle('d-none', !can('upload'));

    if (lotStep === 'directory') renderLotTable();
    if (lotStep === 'preview') renderLotPreview();
  }

  function renderLotTable() {
    const tbody = document.getElementById('tbodyLotes');
    if (!tbody) return;
    const q = lotFilter.toLowerCase();
    const visible = lots.filter(l => `${l.id} ${l.company} ${l.status}`.toLowerCase().includes(q));
    tbody.innerHTML = visible.map(l => `
      <tr>
        <td><input type="checkbox" class="form-check-input lot-check" data-id="${l.id}" ${lotSelected.includes(l.id) ? 'checked' : ''} /></td>
        <td><span class="lote-id">${l.id}</span></td>
        <td>
          <span class="fw-medium">${l.company}</span>
          <span class="sub-muted">${l.account}</span>
        </td>
        <td>${l.records}</td>
        <td>${l.errors}</td>
        <td><span class="badge-tone ${statusLotClass(l.status)}">${l.status === 'Pendiente de autorización' ? 'Pendiente autorización' : l.status}</span></td>
      </tr>
    `).join('');
    tbody.querySelectorAll('.lot-check').forEach(cb => {
      cb.addEventListener('change', () => {
        const id = cb.dataset.id;
        if (cb.checked) { if (!lotSelected.includes(id)) lotSelected.push(id); }
        else lotSelected = lotSelected.filter(x => x !== id);
        updateLotCounter();
      });
    });
    updateLotCounter();
  }

  function updateLotCounter() {
    const el = document.getElementById('lotCounter');
    const btn = document.getElementById('btnVistaPrevia');
    if (el) el.textContent = `${lotSelected.length} lote(s) seleccionado(s)`;
    if (btn) btn.disabled = lotSelected.length === 0;
  }

  function renderLotPreview() {
    const selectedLots = lots.filter(l => lotSelected.includes(l.id));
    const totalRec = selectedLots.reduce((s, l) => s + l.records, 0);
    const totalErr = selectedLots.reduce((s, l) => s + l.errors, 0);
    const resumen = document.getElementById('previewResumen');
    if (resumen) {
      resumen.innerHTML = `
        <div class="col-sm-4"><div class="p-3 rounded" style="background:var(--bg-soft)">
          <div class="small text-muted">Lotes</div><div class="fs-3 fw-bold">${selectedLots.length}</div><div class="small text-muted">seleccionados</div>
        </div></div>
        <div class="col-sm-4"><div class="p-3 rounded" style="background:var(--bg-soft)">
          <div class="small text-muted">Registros</div><div class="fs-3 fw-bold">${totalRec}</div><div class="small text-muted">a afiliar</div>
        </div></div>
        <div class="col-sm-4"><div class="p-3 rounded" style="background:var(--bg-soft)">
          <div class="small text-muted">Observados</div><div class="fs-3 fw-bold">${totalErr}</div><div class="small text-muted">requieren atención</div>
        </div></div>`;
    }
    const tbody = document.getElementById('tbodyPreview');
    if (tbody) {
      tbody.innerHTML = selectedLots.map(l => `
        <tr>
          <td><span class="lote-id">${l.id}</span></td>
          <td>${l.company}</td>
          <td>${l.records}</td>
          <td>${l.errors}</td>
          <td><span class="badge-tone ${statusLotClass(l.status)}">${l.status}</span></td>
        </tr>`).join('');
    }
    const acciones = document.getElementById('previewAcciones');
    if (acciones) {
      if (can('approve')) {
        acciones.innerHTML = `<button type="button" class="btn-success-ach" id="btnAutorizarLotes"><i class="bi bi-check-lg"></i> Autorizar lotes seleccionados</button>`;
        document.getElementById('btnAutorizarLotes')?.addEventListener('click', () => {
          if (!lotSelected.length) return notify('Selecciona al menos un lote para aprobar');
          lots = lots.map(l => lotSelected.includes(l.id) ? { ...l, status: 'Aprobado' } : l);
          lotSelected = [];
          lotStep = 'directory';
          notify('Lotes de afiliación aprobados correctamente');
          renderAfiliaciones();
        });
      } else {
        acciones.innerHTML = `<div class="p-3 rounded" style="background:#fff4df;color:#a66b00;font-weight:600">Tu perfil no puede autorizar. La vista previa queda disponible para revisión.</div>`;
      }
    }
  }

  function renderCodigos() {
    const el = document.getElementById('listaCodigos');
    if (!el) return;
    el.innerHTML = CODIGOS.map(([c, l]) => `
      <div class="codigo-row"><span class="codigo-badge">${c}</span><span>${l}</span></div>
    `).join('');
  }

  // ---------- Aprobaciones ----------
  function renderAprobaciones() {
    const box = document.getElementById('listaAprobaciones');
    const roleLabel = document.getElementById('roleLabelAprob');
    if (roleLabel) roleLabel.textContent = role;
    if (!box) return;
    const pending = batches.filter(b => b.status === 'Pendiente de aprobación' || b.status === 'Observado');
    if (!pending.length) {
      box.innerHTML = `<div class="empty-state"><i class="bi bi-exclamation-circle fs-3 text-muted"></i><p class="mt-2 fw-semibold mb-0">No hay cargas pendientes</p><p class="small text-muted">Todas las cargas fueron atendidas.</p></div>`;
      return;
    }
    box.innerHTML = pending.map(b => `
      <div class="panel-card p-4 d-flex flex-column flex-md-row align-items-md-center gap-3 mb-3">
        <div class="flex-grow-1">
          <p class="lote-id mb-1">${b.id}</p>
          <p class="fw-medium mb-1">${b.company}</p>
          <p class="small text-muted mb-0">${b.records} registros · ${b.amount} · ${b.user}</p>
        </div>
        <div class="d-flex gap-2">
          ${can('approve') ? `
            <button class="btn-success-ach btn-aprobar" data-id="${b.id}"><i class="bi bi-check-lg"></i> Aprobar</button>
            <button class="btn-warning-outline btn-devolver" data-id="${b.id}">Devolver</button>
          ` : `
            <button class="btn-outline-ach btn-sm btn-revisar" data-id="${b.id}">Revisar detalle</button>
          `}
        </div>
      </div>
    `).join('');
    box.querySelectorAll('.btn-aprobar').forEach(btn => btn.addEventListener('click', () => updateBatch(btn.dataset.id, 'Aprobado', 'success')));
    box.querySelectorAll('.btn-devolver').forEach(btn => btn.addEventListener('click', () => updateBatch(btn.dataset.id, 'Devuelto', 'warning')));
    box.querySelectorAll('.btn-revisar').forEach(btn => btn.addEventListener('click', () => notify('Este perfil solo puede revisar la carga')));
  }

  // ---------- Reportes ----------
  function renderReportes() {
    const grid = document.getElementById('gridReportes');
    if (!grid) return;
    grid.innerHTML = REPORTS.map(([title, desc]) => `
      <button type="button" class="report-card" data-report="${title}">
        <div class="kpi-icon blue mb-3"><i class="bi bi-file-earmark-text"></i></div>
        <h3 class="panel-title mb-1">${title}</h3>
        <p class="panel-desc mb-3">${desc}</p>
        <span class="text-primary small fw-semibold">Generar reporte <i class="bi bi-chevron-right"></i></span>
      </button>
    `).join('');
    grid.querySelectorAll('.report-card').forEach(btn => {
      btn.addEventListener('click', () => notify(`Generando ${btn.dataset.report}`));
    });
  }

  // ---------- Accesos ----------
  function renderAccesos() {
    const list = document.getElementById('listaRoles');
    if (list) {
      list.innerHTML = ROLES.map(r => `
        <button type="button" class="role-btn mb-2 ${role === r ? 'active' : ''}" data-role="${r}">
          <span><strong>${r}</strong><span class="d-block small text-muted mt-1">${ROLE_DESC[r]}</span></span>
          ${role === r ? '<i class="bi bi-check-circle-fill text-primary"></i>' : ''}
        </button>
      `).join('');
      list.querySelectorAll('.role-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          role = btn.dataset.role;
          notify(`Perfil cambiado a ${role}`);
          document.getElementById('headerRoleLabel').textContent = `BC3467 · ${role}`;
          document.getElementById('sidebarRoleLabel').textContent = `${role} · Operaciones`;
          renderAccesos();
          renderAfiliaciones();
          renderAprobaciones();
        });
      });
    }
    // Matrix
    const matrix = document.getElementById('matrizPermisos');
    if (matrix) {
      const actions = [['Cargar archivo', 'upload'], ['Validar observados', 'validate'], ['Aprobar lote', 'approve'], ['Administrar accesos', 'access']];
      matrix.innerHTML = `
        <thead class="border-bottom"><tr>
          <th class="p-3 small text-muted">Función</th>
          ${ROLES.map(r => `<th class="p-3 small text-muted">${r}</th>`).join('')}
        </tr></thead>
        <tbody>
          ${actions.map(([label, act]) => `
            <tr>
              <td class="p-3 fw-medium">${label}</td>
              ${ROLES.map(r => {
                const ok = (act === 'upload' && ['Operador','Supervisor'].includes(r))
                  || (act === 'validate' && ['Validador','Supervisor'].includes(r))
                  || (act === 'approve' && ['Autorizador','Supervisor'].includes(r))
                  || (act === 'access' && r === 'Supervisor');
                return `<td class="p-3">${ok ? '<i class="bi bi-check-lg text-success"></i>' : '<i class="bi bi-x-lg text-danger"></i>'}</td>`;
              }).join('')}
            </tr>
          `).join('')}
        </tbody>`;
    }
  }

  // ---------- Modal upload ----------
  function openUpload() {
    if (!can('upload')) { notify('Tu perfil no tiene permisos para cargar archivos'); return; }
    showUpload = true;
    document.getElementById('modalUpload')?.classList.remove('d-none');
  }
  function closeUpload() {
    showUpload = false;
    document.getElementById('modalUpload')?.classList.add('d-none');
    document.getElementById('uploadFileName').textContent = 'Selecciona un archivo';
    document.getElementById('inputUploadFile').value = '';
  }

  // ---------- Bind ----------
  function bind() {
    // Nav
    document.querySelectorAll('[data-nav]').forEach(btn => {
      btn.addEventListener('click', () => navigate(btn.dataset.nav));
    });

    // Mobile menu
    document.getElementById('btnMenu')?.addEventListener('click', () => {
      showMobileNav = !showMobileNav;
      document.getElementById('sidebar')?.classList.toggle('mobile-open', showMobileNav);
    });

    // Notifications
    document.getElementById('btnNotif')?.addEventListener('click', (e) => {
      e.stopPropagation();
      showNotifications = !showNotifications;
      showRoleInfo = false;
      document.getElementById('panelNotif')?.classList.toggle('d-none', !showNotifications);
      document.getElementById('panelRole')?.classList.add('d-none');
    });
    document.getElementById('btnVerAprobaciones')?.addEventListener('click', () => {
      navigate('Aprobaciones');
    });

    // Role panel
    document.getElementById('btnUser')?.addEventListener('click', (e) => {
      e.stopPropagation();
      showRoleInfo = !showRoleInfo;
      showNotifications = false;
      document.getElementById('panelRole')?.classList.toggle('d-none', !showRoleInfo);
      document.getElementById('panelNotif')?.classList.add('d-none');
    });
    document.getElementById('btnAdminPerfiles')?.addEventListener('click', () => {
      navigate('Control de accesos');
    });
    document.getElementById('btnCambiarPerfil')?.addEventListener('click', () => {
      showRoleInfo = true;
      document.getElementById('panelRole')?.classList.remove('d-none');
    });

    // Search
    document.querySelectorAll('.search-batches').forEach(inp => {
      inp.addEventListener('input', (e) => {
        search = e.target.value;
        renderBatchTables();
      });
    });

    // Upload buttons
    document.querySelectorAll('[data-action="upload"]').forEach(btn => {
      btn.addEventListener('click', openUpload);
    });
    document.getElementById('btnCloseUpload')?.addEventListener('click', closeUpload);
    document.getElementById('btnCancelUpload')?.addEventListener('click', closeUpload);
    document.getElementById('inputUploadFile')?.addEventListener('change', (e) => {
      const f = e.target.files?.[0];
      document.getElementById('uploadFileName').textContent = f ? f.name : 'Selecciona un archivo';
    });
    document.getElementById('btnSendUpload')?.addEventListener('click', () => {
      const name = document.getElementById('uploadFileName').textContent;
      if (name === 'Selecciona un archivo') { notify('Selecciona un archivo para continuar'); return; }
      notify(`Archivo ${name} enviado a validación`);
      closeUpload();
    });

    // Afiliaciones
    document.getElementById('btnDescargarPlantilla')?.addEventListener('click', () => notify('Plantilla de afiliación descargada'));
    document.getElementById('btnNuevaAfiliacion')?.addEventListener('click', () => {
      if (!can('upload')) return notify('Tu perfil no tiene permisos para cargar archivos');
      lotStep = 'upload';
      renderAfiliaciones();
    });
    document.getElementById('filtroLotes')?.addEventListener('input', (e) => {
      lotFilter = e.target.value;
      renderLotTable();
    });
    document.getElementById('btnVistaPrevia')?.addEventListener('click', () => {
      if (!lotSelected.length) return;
      lotStep = 'preview';
      renderAfiliaciones();
    });
    document.getElementById('btnCerrarUploadAfi')?.addEventListener('click', () => { lotStep = 'directory'; renderAfiliaciones(); });
    document.getElementById('btnCancelUploadAfi')?.addEventListener('click', () => { lotStep = 'directory'; renderAfiliaciones(); });
    document.getElementById('inputAfiFile')?.addEventListener('change', (e) => {
      lotFile = e.target.files?.[0]?.name || '';
      document.getElementById('afiFileName').textContent = lotFile || 'Seleccionar .xlsx, .csv o .txt';
      document.getElementById('btnValidarAfi').disabled = !lotFile;
    });
    document.getElementById('btnValidarAfi')?.addEventListener('click', () => {
      if (!lotFile) return;
      notify('Archivo validado: revisa el resumen del lote');
      if (lots.length && !lotSelected.includes(lots[0].id)) lotSelected = [lots[0].id];
      lotStep = 'preview';
      renderAfiliaciones();
    });
    document.getElementById('btnVolverBandeja')?.addEventListener('click', () => {
      lotStep = 'directory';
      renderAfiliaciones();
    });

    // Tasks from dashboard
    document.getElementById('taskAprobaciones')?.addEventListener('click', () => navigate('Aprobaciones'));
    document.getElementById('taskObservados')?.addEventListener('click', () => navigate('Afiliaciones'));

    // Close dropdowns on outside click
    document.addEventListener('click', () => {
      document.getElementById('panelNotif')?.classList.add('d-none');
      document.getElementById('panelRole')?.classList.add('d-none');
      showNotifications = false;
      showRoleInfo = false;
    });
  }

  // ---------- Init ----------
  document.addEventListener('DOMContentLoaded', () => {
    bind();
    renderCodigos();
    navigate('Resumen');
  });
})();
