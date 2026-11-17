/* =====================================================================
   DOMICILIACION - MODULO DE DEBITOS
   Motor: SQL Server
   EIF actuando como PAGADOR (banco del cliente) y COBRADOR (banco de la empresa)

   Tablas:
     1. DOM_DEBIT               -> capa de negocio (alimenta "Mis debitos")
     2. DOM_OUT_DEBIT_TRANSFER  -> mensajes/transferencias que SALEN hacia la camara (ACH)
     3. DOM_IN_DEBIT_TRANSFER   -> mensajes/transferencias que ENTRAN desde la camara (ACH)

   Convencion de sufijos (la del proyecto):
     _BI bigint | _IN int | _VC varchar | _DC decimal | _DT fecha/hora
   ===================================================================== */

/* ---------------------------------------------------------------------
   1. DOM_DEBIT : una fila por cada cobro, sin importar el canal
   ---------------------------------------------------------------------
   DOM_DEB_ROLE_VC     : rol de la EIF en este debito
        PAYER     -> el cliente es nuestro (le debitamos)
        COLLECTOR -> la empresa es nuestra (le acreditamos)
   DOM_DEB_CHANNEL_VC  : por donde viaja el debito
        INTERNAL  -> cliente y empresa en la misma EIF (sin camara)
        ACH_OUT   -> los fondos/instruccion salen por la camara
        ACH_IN    -> los fondos/instruccion entran por la camara
   --------------------------------------------------------------------- */
CREATE TABLE dbo.DOM_DEBIT
(
    DOM_DEB_ID                    BIGINT IDENTITY(1,1) NOT NULL,

    -- Identidad
    DOM_DEB_CLIENTSERVICE_ID_IN   INT           NOT NULL,   -- codigo de domiciliacion
    DOM_DEB_CLIENT_COMPANY_ID_IN  INT           NOT NULL,   -- codigo de la empresa que cobra
    DOM_DEB_ROLE_VC               VARCHAR(10)   NOT NULL,
    DOM_DEB_CHANNEL_VC            VARCHAR(10)   NOT NULL,

    -- Cuentas involucradas
    DOM_DEB_PAYER_ACCOUNT_VC      VARCHAR(16)   NOT NULL,   -- cuenta que paga (se debita)
    DOM_DEB_COLLECTOR_ACCOUNT_VC  VARCHAR(16)   NOT NULL,   -- cuenta que cobra (se acredita)

    -- Monto
    DOM_DEB_AMOUNT_DC             DECIMAL(18,2) NOT NULL,
    DOM_DEB_CURRENCY_CODE_VC      VARCHAR(5)    NOT NULL,   -- BOB / USD

    -- Lo que muestra la UI ("Cuota 2 de 10", "Diciembre", glosa)
    DOM_DEB_INSTALLMENT_NUMBER_IN SMALLINT      NULL,
    DOM_DEB_INSTALLMENT_TOTAL_IN  SMALLINT      NULL,
    DOM_DEB_BILLING_PERIOD_VC     VARCHAR(30)   NULL,
    DOM_DEB_REFERENCE_VC          VARCHAR(255)  NULL,       -- glosa

    -- Estado
    DOM_DEB_STATUS_VC             VARCHAR(15)   NOT NULL
        CONSTRAINT DF_DOM_DEBIT_STATUS DEFAULT 'PENDIENTE',
    DOM_DEB_REJECT_CODE_VC        VARCHAR(10)   NULL,       -- uso interno, ej. R02, R04
    DOM_DEB_REJECT_DESCRIPTION_VC VARCHAR(255)  NULL,       -- uso interno
    DOM_DEB_RETRY_COUNT_IN        TINYINT       NOT NULL
        CONSTRAINT DF_DOM_DEBIT_RETRY DEFAULT 0,

    -- Fechas
    DOM_DEB_SCHEDULED_DATE_DT     DATE          NOT NULL,   -- fecha prevista de cobro
    DOM_DEB_EXECUTED_DATE_DT      DATETIME2(3)  NULL,       -- fecha real de ejecucion

    -- Trazabilidad
    DOM_DEB_BANK_REFERENCE_VC     VARCHAR(60)   NULL,       -- ID devuelto por banco/camara
    DOM_DEB_EXTERNAL_REQUEST_ID_VC VARCHAR(60)  NULL,       -- idempotencia (id del solicitante)
    DOM_DEB_ACCOUNTING_ENTRY_VC   VARCHAR(30)   NULL,       -- nro. de asiento/movimiento contable

    -- Auditoria
    DOM_DEB_DATE_CREATION_DT      DATETIME2(3)  NOT NULL
        CONSTRAINT DF_DOM_DEBIT_DATE_CREATION DEFAULT SYSDATETIME(),
    DOM_DEB_USER_CREATION_VC      VARCHAR(50)   NOT NULL
        CONSTRAINT DF_DOM_DEBIT_USER_CREATION DEFAULT SYSTEM_USER,
    DOM_DEB_DATE_MODIFICATION_DT  DATETIME2(3)  NULL,
    DOM_DEB_USER_MODIFICATION_VC  VARCHAR(50)   NULL,
    DOM_DEB_ROW_VERSION           ROWVERSION    NOT NULL,   -- control de concurrencia

    CONSTRAINT PK_DOM_DEBIT PRIMARY KEY CLUSTERED (DOM_DEB_ID),

    CONSTRAINT CK_DOM_DEBIT_AMOUNT
        CHECK (DOM_DEB_AMOUNT_DC > 0),
    CONSTRAINT CK_DOM_DEBIT_ROLE
        CHECK (DOM_DEB_ROLE_VC IN ('PAYER', 'COLLECTOR')),
    CONSTRAINT CK_DOM_DEBIT_CHANNEL
        CHECK (DOM_DEB_CHANNEL_VC IN ('INTERNAL', 'ACH_OUT', 'ACH_IN')),
    CONSTRAINT CK_DOM_DEBIT_STATUS
        CHECK (DOM_DEB_STATUS_VC IN ('PENDIENTE', 'ENVIADO', 'PROCESADO',
                                     'RECHAZADO', 'ANULADO', 'DEVUELTO')),
    CONSTRAINT CK_DOM_DEBIT_INSTALLMENT
        CHECK (DOM_DEB_INSTALLMENT_NUMBER_IN IS NULL
               OR (DOM_DEB_INSTALLMENT_TOTAL_IN IS NOT NULL
                   AND DOM_DEB_INSTALLMENT_NUMBER_IN BETWEEN 1 AND DOM_DEB_INSTALLMENT_TOTAL_IN))

    -- Descomentar y ajustar al nombre real de tus tablas:
    -- ,CONSTRAINT FK_DOM_DEBIT_CLIENTSERVICE FOREIGN KEY (DOM_DEB_CLIENTSERVICE_ID_IN)
    --      REFERENCES dbo.DOM_CLIENT_SERVICE (<PK>)
    -- ,CONSTRAINT FK_DOM_DEBIT_COMPANY FOREIGN KEY (DOM_DEB_CLIENT_COMPANY_ID_IN)
    --      REFERENCES dbo.DOM_COMPANY (<PK>)
);
GO

-- Idempotencia: una misma solicitud externa no puede crear dos debitos para la misma empresa
CREATE UNIQUE NONCLUSTERED INDEX UX_DOM_DEBIT_COMPANY_EXTERNAL_REQUEST
    ON dbo.DOM_DEBIT (DOM_DEB_CLIENT_COMPANY_ID_IN, DOM_DEB_EXTERNAL_REQUEST_ID_VC)
    WHERE DOM_DEB_EXTERNAL_REQUEST_ID_VC IS NOT NULL;

-- Listado "Mis debitos" del cliente (paginacion por cursor: fecha DESC, id DESC)
CREATE NONCLUSTERED INDEX IX_DOM_DEBIT_CLIENTSERVICE_LIST
    ON dbo.DOM_DEBIT (DOM_DEB_CLIENTSERVICE_ID_IN, DOM_DEB_SCHEDULED_DATE_DT DESC, DOM_DEB_ID DESC)
    INCLUDE (DOM_DEB_CLIENT_COMPANY_ID_IN, DOM_DEB_AMOUNT_DC, DOM_DEB_CURRENCY_CODE_VC,
             DOM_DEB_STATUS_VC, DOM_DEB_INSTALLMENT_NUMBER_IN, DOM_DEB_INSTALLMENT_TOTAL_IN,
             DOM_DEB_BILLING_PERIOD_VC, DOM_DEB_REFERENCE_VC);

-- Vista de la empresa cobradora (conciliacion / reportes)
CREATE NONCLUSTERED INDEX IX_DOM_DEBIT_COMPANY_DATE
    ON dbo.DOM_DEBIT (DOM_DEB_CLIENT_COMPANY_ID_IN, DOM_DEB_SCHEDULED_DATE_DT DESC)
    INCLUDE (DOM_DEB_STATUS_VC, DOM_DEB_AMOUNT_DC);

-- Procesos batch: que toca enviar / reintentar
CREATE NONCLUSTERED INDEX IX_DOM_DEBIT_STATUS_SCHEDULED
    ON dbo.DOM_DEBIT (DOM_DEB_STATUS_VC, DOM_DEB_SCHEDULED_DATE_DT)
    INCLUDE (DOM_DEB_PAYER_ACCOUNT_VC, DOM_DEB_AMOUNT_DC, DOM_DEB_CLIENT_COMPANY_ID_IN, DOM_DEB_CHANNEL_VC);
GO


/* ---------------------------------------------------------------------
   2. DOM_OUT_DEBIT_TRANSFER : lo que SALE hacia la camara
   --------------------------------------------------------------------- */
CREATE TABLE dbo.DOM_OUT_DEBIT_TRANSFER
(
    DOM_ODT_ID                          BIGINT IDENTITY(1,1) NOT NULL,
    DOM_ODT_DEBIT_ID_BI                 BIGINT        NOT NULL,   -- FK a DOM_DEBIT

    -- Datos de la transferencia
    DOM_ODT_ACH_TRANSFER_NUMBER_VC      VARCHAR(20)   NULL,       -- nro. de transferencia ACH
    DOM_ODT_RECIPIENT_BANK_ALIAS_VC     VARCHAR(30)   NOT NULL,   -- codigo de banco destino
    DOM_ODT_SENDER_BRANCH_OFFICE_ID_VC  VARCHAR(5)    NULL,       -- lugar / sucursal
    DOM_ODT_CURRENCY_CODE_VC            VARCHAR(5)    NOT NULL,   -- tipo de moneda
    DOM_ODT_AMOUNT_DC                   DECIMAL(18,2) NOT NULL,
    DOM_ODT_SENDER_ACCOUNT_TYPE_VC      VARCHAR(12)   NOT NULL,   -- tipo cuenta saliente
    DOM_ODT_RECIPIENT_ACCOUNT_TYPE_VC   VARCHAR(12)   NOT NULL,   -- tipo cuenta que recibe
    DOM_ODT_SENDER_ACCOUNT_NUMBER_VC    VARCHAR(16)   NOT NULL,   -- (corregido: NUMER -> NUMBER)
    DOM_ODT_RECIPIENT_ACCOUNT_NUMBER_VC VARCHAR(16)   NOT NULL,
    DOM_ODT_DESCRIPTION_VC              VARCHAR(255)  NULL,       -- glosa (antes sin longitud)

    -- Codigos de negocio
    DOM_ODT_CLIENTSERVICE_ID_IN         INT           NOT NULL,   -- codigo de domiciliacion
    DOM_ODT_CLIENT_COMPANY_ID_IN        INT           NOT NULL,   -- codigo de la empresa que cobra

    -- Datos del debito de transferencia
    DOM_ODT_SENDER_ACCOUNT_HOLDER_ID_VC     VARCHAR(20)  NULL,
    DOM_ODT_SENDER_ACCOUNT_HOLDER_VC        VARCHAR(100) NULL,
    DOM_ODT_RECIPIENT_ACCOUNT_HOLDER_ID_VC  VARCHAR(20)  NULL,
    DOM_ODT_RECIPIENT_ACCOUNT_HOLDER_VC     VARCHAR(100) NULL,
    DOM_ODT_FUNDS_SOURCE_VC             VARCHAR(100)  NULL,       -- (antes sin longitud)
    DOM_ODT_FUNDS_DESTINATION_VC        VARCHAR(100)  NULL,       -- (antes sin longitud)
    DOM_ODT_TYPE_VC                     VARCHAR(20)   NULL,
    DOM_ODT_SERVICE_CODE_VC             VARCHAR(50)   NULL,

    -- Ciclo de vida del mensaje
    DOM_ODT_STATUS_VC                   VARCHAR(15)   NOT NULL
        CONSTRAINT DF_DOM_ODT_STATUS DEFAULT 'GENERADO',
    DOM_ODT_SENT_DATE_DT                DATETIME2(3)  NULL,      -- cuando se envio a la camara
    DOM_ODT_RESPONSE_DATE_DT            DATETIME2(3)  NULL,      -- cuando llego la respuesta
    DOM_ODT_RESPONSE_CODE_VC            VARCHAR(10)   NULL,      -- codigo devuelto por la camara
    DOM_ODT_RESPONSE_MESSAGE_VC         VARCHAR(255)  NULL,
    DOM_ODT_REQUEST_PAYLOAD_VC          NVARCHAR(MAX) NULL,      -- mensaje enviado (auditoria)
    DOM_ODT_RESPONSE_PAYLOAD_VC         NVARCHAR(MAX) NULL,      -- respuesta recibida (auditoria)

    -- Auditoria (una sola columna de modificacion, ya sin typos)
    DOM_ODT_DATE_CREATION_DT            DATETIME2(3)  NOT NULL
        CONSTRAINT DF_DOM_ODT_DATE_CREATION DEFAULT SYSDATETIME(),
    DOM_ODT_USER_CREATION_VC            VARCHAR(20)   NOT NULL
        CONSTRAINT DF_DOM_ODT_USER_CREATION DEFAULT SYSTEM_USER,
    DOM_ODT_DATE_MODIFICATION_DT        DATETIME2(3)  NULL,
    DOM_ODT_USER_MODIFICATION_VC        VARCHAR(20)   NULL,

    CONSTRAINT PK_DOM_OUT_DEBIT_TRANSFER PRIMARY KEY CLUSTERED (DOM_ODT_ID),
    CONSTRAINT FK_DOM_ODT_DEBIT FOREIGN KEY (DOM_ODT_DEBIT_ID_BI)
        REFERENCES dbo.DOM_DEBIT (DOM_DEB_ID),
    CONSTRAINT CK_DOM_ODT_AMOUNT CHECK (DOM_ODT_AMOUNT_DC > 0),
    CONSTRAINT CK_DOM_ODT_STATUS
        CHECK (DOM_ODT_STATUS_VC IN ('GENERADO', 'ENVIADO', 'ACEPTADO', 'RECHAZADO', 'ERROR'))
);
GO

CREATE NONCLUSTERED INDEX IX_DOM_ODT_DEBIT
    ON dbo.DOM_OUT_DEBIT_TRANSFER (DOM_ODT_DEBIT_ID_BI);

-- Cruce con las respuestas que llegan de la camara
CREATE NONCLUSTERED INDEX IX_DOM_ODT_ACH_NUMBER
    ON dbo.DOM_OUT_DEBIT_TRANSFER (DOM_ODT_ACH_TRANSFER_NUMBER_VC)
    WHERE DOM_ODT_ACH_TRANSFER_NUMBER_VC IS NOT NULL;

CREATE NONCLUSTERED INDEX IX_DOM_ODT_STATUS
    ON dbo.DOM_OUT_DEBIT_TRANSFER (DOM_ODT_STATUS_VC, DOM_ODT_DATE_CREATION_DT);
GO


/* ---------------------------------------------------------------------
   3. DOM_IN_DEBIT_TRANSFER : lo que ENTRA desde la camara
   ---------------------------------------------------------------------
   Cubre dos casos:
     a) Como PAGADOR : llegan ordenes de debito de empresas de otros bancos
     b) Respuestas a lo que enviamos (confirmaciones, rechazos, devoluciones)
   DOM_IDT_DEBIT_ID_BI es NULL hasta que el mensaje se concilia o crea el debito.
   --------------------------------------------------------------------- */
CREATE TABLE dbo.DOM_IN_DEBIT_TRANSFER
(
    DOM_IDT_ID                          BIGINT IDENTITY(1,1) NOT NULL,
    DOM_IDT_DEBIT_ID_BI                 BIGINT        NULL,       -- FK a DOM_DEBIT (nullable hasta conciliar)
    DOM_IDT_OUT_TRANSFER_ID_BI          BIGINT        NULL,       -- FK a OUT si es respuesta a un envio

    -- Identificacion del mensaje
    DOM_IDT_MESSAGE_TYPE_VC             VARCHAR(20)   NOT NULL,   -- ver CHECK
    DOM_IDT_ACH_TRANSFER_NUMBER_VC      VARCHAR(20)   NOT NULL,   -- nro. de transferencia ACH
    DOM_IDT_ORIGINAL_ACH_NUMBER_VC      VARCHAR(20)   NULL,       -- nro. original (devoluciones/rechazos)
    DOM_IDT_SENDER_BANK_ALIAS_VC        VARCHAR(30)   NOT NULL,   -- banco que origina el mensaje
    DOM_IDT_RECIPIENT_BANK_ALIAS_VC     VARCHAR(30)   NULL,
    DOM_IDT_BRANCH_OFFICE_ID_VC         VARCHAR(5)    NULL,

    -- Datos economicos
    DOM_IDT_CURRENCY_CODE_VC            VARCHAR(5)    NOT NULL,
    DOM_IDT_AMOUNT_DC                   DECIMAL(18,2) NULL,       -- NULL en respuestas sin monto
    DOM_IDT_SENDER_ACCOUNT_TYPE_VC      VARCHAR(12)   NULL,
    DOM_IDT_RECIPIENT_ACCOUNT_TYPE_VC   VARCHAR(12)   NULL,
    DOM_IDT_SENDER_ACCOUNT_NUMBER_VC    VARCHAR(16)   NULL,
    DOM_IDT_RECIPIENT_ACCOUNT_NUMBER_VC VARCHAR(16)   NULL,
    DOM_IDT_SENDER_ACCOUNT_HOLDER_ID_VC     VARCHAR(20)  NULL,
    DOM_IDT_SENDER_ACCOUNT_HOLDER_VC        VARCHAR(100) NULL,
    DOM_IDT_RECIPIENT_ACCOUNT_HOLDER_ID_VC  VARCHAR(20)  NULL,
    DOM_IDT_RECIPIENT_ACCOUNT_HOLDER_VC     VARCHAR(100) NULL,
    DOM_IDT_DESCRIPTION_VC              VARCHAR(255)  NULL,
    DOM_IDT_SERVICE_CODE_VC             VARCHAR(50)   NULL,

    -- Respuesta / rechazo
    DOM_IDT_RESPONSE_CODE_VC            VARCHAR(10)   NULL,       -- ej. R02, R04
    DOM_IDT_RESPONSE_MESSAGE_VC         VARCHAR(255)  NULL,

    -- Procesamiento interno
    DOM_IDT_PROCESS_STATUS_VC           VARCHAR(15)   NOT NULL
        CONSTRAINT DF_DOM_IDT_PROCESS_STATUS DEFAULT 'RECIBIDO',
    DOM_IDT_PROCESS_ATTEMPTS_IN         TINYINT       NOT NULL
        CONSTRAINT DF_DOM_IDT_ATTEMPTS DEFAULT 0,
    DOM_IDT_PROCESS_ERROR_VC            VARCHAR(255)  NULL,
    DOM_IDT_RECEIVED_DATE_DT            DATETIME2(3)  NOT NULL
        CONSTRAINT DF_DOM_IDT_RECEIVED DEFAULT SYSDATETIME(),
    DOM_IDT_PROCESSED_DATE_DT           DATETIME2(3)  NULL,
    DOM_IDT_RAW_PAYLOAD_VC              NVARCHAR(MAX) NULL,      -- mensaje original (auditoria)

    -- Auditoria
    DOM_IDT_DATE_CREATION_DT            DATETIME2(3)  NOT NULL
        CONSTRAINT DF_DOM_IDT_DATE_CREATION DEFAULT SYSDATETIME(),
    DOM_IDT_USER_CREATION_VC            VARCHAR(20)   NOT NULL
        CONSTRAINT DF_DOM_IDT_USER_CREATION DEFAULT SYSTEM_USER,
    DOM_IDT_DATE_MODIFICATION_DT        DATETIME2(3)  NULL,
    DOM_IDT_USER_MODIFICATION_VC        VARCHAR(20)   NULL,

    CONSTRAINT PK_DOM_IN_DEBIT_TRANSFER PRIMARY KEY CLUSTERED (DOM_IDT_ID),
    CONSTRAINT FK_DOM_IDT_DEBIT FOREIGN KEY (DOM_IDT_DEBIT_ID_BI)
        REFERENCES dbo.DOM_DEBIT (DOM_DEB_ID),
    CONSTRAINT FK_DOM_IDT_OUT_TRANSFER FOREIGN KEY (DOM_IDT_OUT_TRANSFER_ID_BI)
        REFERENCES dbo.DOM_OUT_DEBIT_TRANSFER (DOM_ODT_ID),
    CONSTRAINT CK_DOM_IDT_AMOUNT CHECK (DOM_IDT_AMOUNT_DC IS NULL OR DOM_IDT_AMOUNT_DC > 0),
    -- Ajustar a los tipos de mensaje reales de la camara
    CONSTRAINT CK_DOM_IDT_MESSAGE_TYPE
        CHECK (DOM_IDT_MESSAGE_TYPE_VC IN ('DEBIT_REQUEST', 'CONFIRMATION', 'REJECT', 'RETURN')),
    CONSTRAINT CK_DOM_IDT_PROCESS_STATUS
        CHECK (DOM_IDT_PROCESS_STATUS_VC IN ('RECIBIDO', 'PROCESADO', 'ERROR', 'DUPLICADO', 'SIN_CONCILIAR'))
);
GO

-- Idempotencia: la camara puede reenviar el mismo mensaje; no se registra dos veces
CREATE UNIQUE NONCLUSTERED INDEX UX_DOM_IDT_ACH_NUMBER_TYPE
    ON dbo.DOM_IN_DEBIT_TRANSFER (DOM_IDT_ACH_TRANSFER_NUMBER_VC, DOM_IDT_MESSAGE_TYPE_VC,
                                  DOM_IDT_SENDER_BANK_ALIAS_VC);

CREATE NONCLUSTERED INDEX IX_DOM_IDT_DEBIT
    ON dbo.DOM_IN_DEBIT_TRANSFER (DOM_IDT_DEBIT_ID_BI)
    WHERE DOM_IDT_DEBIT_ID_BI IS NOT NULL;

CREATE NONCLUSTERED INDEX IX_DOM_IDT_ORIGINAL_ACH
    ON dbo.DOM_IN_DEBIT_TRANSFER (DOM_IDT_ORIGINAL_ACH_NUMBER_VC)
    WHERE DOM_IDT_ORIGINAL_ACH_NUMBER_VC IS NOT NULL;

-- Cola de trabajo: mensajes pendientes de procesar
CREATE NONCLUSTERED INDEX IX_DOM_IDT_PROCESS_STATUS
    ON dbo.DOM_IN_DEBIT_TRANSFER (DOM_IDT_PROCESS_STATUS_VC, DOM_IDT_RECEIVED_DATE_DT);
GO


/* ---------------------------------------------------------------------
   Consulta de referencia para el servicio "Mis debitos" (cursor)
   ---------------------------------------------------------------------
   DECLARE @clientServiceId INT = ...;   -- derivado del usuario autenticado, NO del front
   DECLARE @cursorDate DATE = NULL, @cursorId BIGINT = NULL;

   SELECT TOP (20)
          d.DOM_DEB_ID, d.DOM_DEB_CLIENT_COMPANY_ID_IN, d.DOM_DEB_AMOUNT_DC,
          d.DOM_DEB_CURRENCY_CODE_VC, d.DOM_DEB_INSTALLMENT_NUMBER_IN,
          d.DOM_DEB_INSTALLMENT_TOTAL_IN, d.DOM_DEB_BILLING_PERIOD_VC,
          d.DOM_DEB_REFERENCE_VC, d.DOM_DEB_STATUS_VC, d.DOM_DEB_SCHEDULED_DATE_DT
   FROM   dbo.DOM_DEBIT d
   WHERE  d.DOM_DEB_CLIENTSERVICE_ID_IN = @clientServiceId
     AND  (@cursorDate IS NULL
           OR d.DOM_DEB_SCHEDULED_DATE_DT < @cursorDate
           OR (d.DOM_DEB_SCHEDULED_DATE_DT = @cursorDate AND d.DOM_DEB_ID < @cursorId))
   ORDER BY d.DOM_DEB_SCHEDULED_DATE_DT DESC, d.DOM_DEB_ID DESC;
   --------------------------------------------------------------------- */
