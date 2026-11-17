/* =====================================================================
   DOMICILIACION - DOCUMENTACION DE TABLAS Y COLUMNAS
   Motor: SQL Server (propiedad extendida MS_Description)

   - Idempotente: si la descripcion ya existe la actualiza, si no la crea.
   - Se puede volver a ejecutar cada vez que cambie una descripcion.
   - Las descripciones se ven en SSMS (Propiedades), DBeaver, DataGrip,
     y las leen herramientas de diccionario de datos.
   ===================================================================== */

SET NOCOUNT ON;

IF OBJECT_ID('tempdb..#DocTables')  IS NOT NULL DROP TABLE #DocTables;
IF OBJECT_ID('tempdb..#DocColumns') IS NOT NULL DROP TABLE #DocColumns;

CREATE TABLE #DocTables  (TableName SYSNAME NOT NULL, Description NVARCHAR(3750) NOT NULL);
CREATE TABLE #DocColumns (TableName SYSNAME NOT NULL, ColumnName SYSNAME NOT NULL, Description NVARCHAR(3750) NOT NULL);

/* ---------------------------------------------------------------------
   DESCRIPCION DE TABLAS
   --------------------------------------------------------------------- */
INSERT INTO #DocTables (TableName, Description) VALUES
(N'DOM_DEBIT',
 N'Capa de negocio de debitos de domiciliacion. Una fila por cada cobro, sin importar el canal (interno o ACH) ni el rol de la EIF (pagador o cobrador). Alimenta el listado "Mis debitos".'),
(N'DOM_OUT_DEBIT_TRANSFER',
 N'Capa tecnica de salida. Registra cada mensaje/transferencia que la EIF envia a la camara de compensacion (ACH) por un debito de domiciliacion, junto con la respuesta recibida.'),
(N'DOM_IN_DEBIT_TRANSFER',
 N'Capa tecnica de entrada. Registra cada mensaje que llega desde la camara (ACH): ordenes de debito de otros bancos, confirmaciones, rechazos y devoluciones. Es la fuente de conciliacion contra DOM_DEBIT y DOM_OUT_DEBIT_TRANSFER.');

/* ---------------------------------------------------------------------
   DESCRIPCION DE COLUMNAS - DOM_DEBIT
   --------------------------------------------------------------------- */
INSERT INTO #DocColumns (TableName, ColumnName, Description) VALUES
(N'DOM_DEBIT', N'DOM_DEB_ID', N'Identificador unico del debito (PK, autoincremental).'),
(N'DOM_DEBIT', N'DOM_DEB_CLIENTSERVICE_ID_IN', N'Codigo de la domiciliacion (servicio contratado por el cliente) a la que pertenece el debito.'),
(N'DOM_DEBIT', N'DOM_DEB_CLIENT_COMPANY_ID_IN', N'Codigo de la empresa que cobra el debito.'),
(N'DOM_DEBIT', N'DOM_DEB_ROLE_VC', N'Rol de la EIF en este debito. PAYER: el cliente es de la EIF y se le debita. COLLECTOR: la empresa es de la EIF y se le acredita.'),
(N'DOM_DEBIT', N'DOM_DEB_CHANNEL_VC', N'Canal por el que viaja el debito. INTERNAL: cliente y empresa en la misma EIF, sin camara. ACH_OUT: instruccion/fondos salen por la camara. ACH_IN: instruccion/fondos entran por la camara.'),
(N'DOM_DEBIT', N'DOM_DEB_PAYER_ACCOUNT_VC', N'Numero de cuenta del pagador, la cuenta que se debita.'),
(N'DOM_DEBIT', N'DOM_DEB_COLLECTOR_ACCOUNT_VC', N'Numero de cuenta del cobrador, la cuenta de la empresa que se acredita.'),
(N'DOM_DEBIT', N'DOM_DEB_AMOUNT_DC', N'Monto del debito. Siempre mayor a cero.'),
(N'DOM_DEBIT', N'DOM_DEB_CURRENCY_CODE_VC', N'Codigo de moneda del debito (por ejemplo BOB, USD).'),
(N'DOM_DEBIT', N'DOM_DEB_INSTALLMENT_NUMBER_IN', N'Numero de cuota que se cobra (la "2" de "Cuota 2 de 10"). NULL si el cobro no es en cuotas.'),
(N'DOM_DEBIT', N'DOM_DEB_INSTALLMENT_TOTAL_IN', N'Total de cuotas del plan (la "10" de "Cuota 2 de 10"). NULL si el cobro no es en cuotas.'),
(N'DOM_DEBIT', N'DOM_DEB_BILLING_PERIOD_VC', N'Periodo facturado que se muestra al cliente (por ejemplo "Diciembre"). Aplica a servicios recurrentes como telefonia.'),
(N'DOM_DEBIT', N'DOM_DEB_REFERENCE_VC', N'Glosa o referencia del cobro enviada por la empresa. Es texto visible al cliente final.'),
(N'DOM_DEBIT', N'DOM_DEB_STATUS_VC', N'Estado del debito. PENDIENTE, ENVIADO (ya salio a la camara y espera respuesta), PROCESADO, RECHAZADO, ANULADO, DEVUELTO.'),
(N'DOM_DEBIT', N'DOM_DEB_REJECT_CODE_VC', N'Codigo de rechazo (por ejemplo R02 cuenta cerrada, R04 cuenta invalida). Uso interno, no se expone al cliente final.'),
(N'DOM_DEBIT', N'DOM_DEB_REJECT_DESCRIPTION_VC', N'Detalle tecnico del motivo de rechazo. Uso interno, no se expone al cliente final.'),
(N'DOM_DEBIT', N'DOM_DEB_RETRY_COUNT_IN', N'Cantidad de reintentos de cobro realizados para este debito.'),
(N'DOM_DEBIT', N'DOM_DEB_SCHEDULED_DATE_DT', N'Fecha prevista de cobro. Es la fecha por la que se ordena y pagina el listado del cliente.'),
(N'DOM_DEBIT', N'DOM_DEB_EXECUTED_DATE_DT', N'Fecha y hora reales en que el debito se ejecuto. NULL mientras no se haya ejecutado.'),
(N'DOM_DEBIT', N'DOM_DEB_BANK_REFERENCE_VC', N'Identificador de la transaccion devuelto por el banco o la camara.'),
(N'DOM_DEBIT', N'DOM_DEB_EXTERNAL_REQUEST_ID_VC', N'Identificador de la solicitud enviado por el sistema externo. Con la empresa forma una clave unica que garantiza idempotencia.'),
(N'DOM_DEBIT', N'DOM_DEB_ACCOUNTING_ENTRY_VC', N'Numero de asiento o movimiento contable generado por el debito.'),
(N'DOM_DEBIT', N'DOM_DEB_DATE_CREATION_DT', N'Fecha y hora de creacion del registro.'),
(N'DOM_DEBIT', N'DOM_DEB_USER_CREATION_VC', N'Usuario que creo el registro.'),
(N'DOM_DEBIT', N'DOM_DEB_DATE_MODIFICATION_DT', N'Fecha y hora de la ultima modificacion del registro.'),
(N'DOM_DEBIT', N'DOM_DEB_USER_MODIFICATION_VC', N'Usuario que realizo la ultima modificacion.'),
(N'DOM_DEBIT', N'DOM_DEB_ROW_VERSION', N'Version de fila generada por el motor. Se usa para control de concurrencia optimista.');

/* ---------------------------------------------------------------------
   DESCRIPCION DE COLUMNAS - DOM_OUT_DEBIT_TRANSFER
   --------------------------------------------------------------------- */
INSERT INTO #DocColumns (TableName, ColumnName, Description) VALUES
(N'DOM_OUT_DEBIT_TRANSFER', N'DOM_ODT_ID', N'Identificador unico de la transferencia de salida (PK, autoincremental).'),
(N'DOM_OUT_DEBIT_TRANSFER', N'DOM_ODT_DEBIT_ID_BI', N'Debito de negocio al que corresponde esta transferencia (FK a DOM_DEBIT).'),
(N'DOM_OUT_DEBIT_TRANSFER', N'DOM_ODT_ACH_TRANSFER_NUMBER_VC', N'Numero de transferencia asignado para la camara ACH. Se usa para cruzar las respuestas entrantes.'),
(N'DOM_OUT_DEBIT_TRANSFER', N'DOM_ODT_RECIPIENT_BANK_ALIAS_VC', N'Codigo o alias del banco destino de la transferencia.'),
(N'DOM_OUT_DEBIT_TRANSFER', N'DOM_ODT_SENDER_BRANCH_OFFICE_ID_VC', N'Codigo de la oficina o sucursal (lugar) desde la que se origina.'),
(N'DOM_OUT_DEBIT_TRANSFER', N'DOM_ODT_CURRENCY_CODE_VC', N'Tipo de moneda de la transferencia.'),
(N'DOM_OUT_DEBIT_TRANSFER', N'DOM_ODT_AMOUNT_DC', N'Monto de la transferencia. Siempre mayor a cero.'),
(N'DOM_OUT_DEBIT_TRANSFER', N'DOM_ODT_SENDER_ACCOUNT_TYPE_VC', N'Tipo de la cuenta saliente (la que origina el movimiento).'),
(N'DOM_OUT_DEBIT_TRANSFER', N'DOM_ODT_RECIPIENT_ACCOUNT_TYPE_VC', N'Tipo de la cuenta que recibe.'),
(N'DOM_OUT_DEBIT_TRANSFER', N'DOM_ODT_SENDER_ACCOUNT_NUMBER_VC', N'Numero de la cuenta saliente.'),
(N'DOM_OUT_DEBIT_TRANSFER', N'DOM_ODT_RECIPIENT_ACCOUNT_NUMBER_VC', N'Numero de la cuenta que recibe.'),
(N'DOM_OUT_DEBIT_TRANSFER', N'DOM_ODT_DESCRIPTION_VC', N'Glosa o descripcion enviada en la transferencia.'),
(N'DOM_OUT_DEBIT_TRANSFER', N'DOM_ODT_CLIENTSERVICE_ID_IN', N'Codigo de la domiciliacion asociada.'),
(N'DOM_OUT_DEBIT_TRANSFER', N'DOM_ODT_CLIENT_COMPANY_ID_IN', N'Codigo de la empresa que cobra.'),
(N'DOM_OUT_DEBIT_TRANSFER', N'DOM_ODT_SENDER_ACCOUNT_HOLDER_ID_VC', N'Documento de identidad del titular de la cuenta saliente.'),
(N'DOM_OUT_DEBIT_TRANSFER', N'DOM_ODT_SENDER_ACCOUNT_HOLDER_VC', N'Nombre del titular de la cuenta saliente.'),
(N'DOM_OUT_DEBIT_TRANSFER', N'DOM_ODT_RECIPIENT_ACCOUNT_HOLDER_ID_VC', N'Documento de identidad del titular de la cuenta que recibe.'),
(N'DOM_OUT_DEBIT_TRANSFER', N'DOM_ODT_RECIPIENT_ACCOUNT_HOLDER_VC', N'Nombre del titular de la cuenta que recibe.'),
(N'DOM_OUT_DEBIT_TRANSFER', N'DOM_ODT_FUNDS_SOURCE_VC', N'Origen de los fondos declarado en la transferencia.'),
(N'DOM_OUT_DEBIT_TRANSFER', N'DOM_ODT_FUNDS_DESTINATION_VC', N'Destino de los fondos declarado en la transferencia.'),
(N'DOM_OUT_DEBIT_TRANSFER', N'DOM_ODT_TYPE_VC', N'Tipo de transferencia segun la clasificacion de la camara.'),
(N'DOM_OUT_DEBIT_TRANSFER', N'DOM_ODT_SERVICE_CODE_VC', N'Codigo del servicio de la empresa asociado al cobro.'),
(N'DOM_OUT_DEBIT_TRANSFER', N'DOM_ODT_STATUS_VC', N'Estado del mensaje. GENERADO, ENVIADO, ACEPTADO, RECHAZADO, ERROR.'),
(N'DOM_OUT_DEBIT_TRANSFER', N'DOM_ODT_SENT_DATE_DT', N'Fecha y hora en que el mensaje se envio a la camara.'),
(N'DOM_OUT_DEBIT_TRANSFER', N'DOM_ODT_RESPONSE_DATE_DT', N'Fecha y hora en que se recibio la respuesta de la camara.'),
(N'DOM_OUT_DEBIT_TRANSFER', N'DOM_ODT_RESPONSE_CODE_VC', N'Codigo de respuesta devuelto por la camara.'),
(N'DOM_OUT_DEBIT_TRANSFER', N'DOM_ODT_RESPONSE_MESSAGE_VC', N'Mensaje o glosa de respuesta devuelto por la camara.'),
(N'DOM_OUT_DEBIT_TRANSFER', N'DOM_ODT_REQUEST_PAYLOAD_VC', N'Mensaje completo enviado a la camara, conservado para auditoria.'),
(N'DOM_OUT_DEBIT_TRANSFER', N'DOM_ODT_RESPONSE_PAYLOAD_VC', N'Respuesta completa recibida de la camara, conservada para auditoria.'),
(N'DOM_OUT_DEBIT_TRANSFER', N'DOM_ODT_DATE_CREATION_DT', N'Fecha y hora de creacion del registro.'),
(N'DOM_OUT_DEBIT_TRANSFER', N'DOM_ODT_USER_CREATION_VC', N'Usuario que creo el registro.'),
(N'DOM_OUT_DEBIT_TRANSFER', N'DOM_ODT_DATE_MODIFICATION_DT', N'Fecha y hora de la ultima modificacion del registro.'),
(N'DOM_OUT_DEBIT_TRANSFER', N'DOM_ODT_USER_MODIFICATION_VC', N'Usuario que realizo la ultima modificacion.');

/* ---------------------------------------------------------------------
   DESCRIPCION DE COLUMNAS - DOM_IN_DEBIT_TRANSFER
   --------------------------------------------------------------------- */
INSERT INTO #DocColumns (TableName, ColumnName, Description) VALUES
(N'DOM_IN_DEBIT_TRANSFER', N'DOM_IDT_ID', N'Identificador unico del mensaje de entrada (PK, autoincremental).'),
(N'DOM_IN_DEBIT_TRANSFER', N'DOM_IDT_DEBIT_ID_BI', N'Debito de negocio conciliado con este mensaje (FK a DOM_DEBIT). NULL hasta que se concilia o se crea el debito.'),
(N'DOM_IN_DEBIT_TRANSFER', N'DOM_IDT_OUT_TRANSFER_ID_BI', N'Transferencia de salida a la que responde este mensaje (FK a DOM_OUT_DEBIT_TRANSFER). NULL si es una orden de debito originada por otro banco.'),
(N'DOM_IN_DEBIT_TRANSFER', N'DOM_IDT_MESSAGE_TYPE_VC', N'Tipo de mensaje recibido. DEBIT_REQUEST: orden de debito de otro banco. CONFIRMATION: confirmacion de un envio. REJECT: rechazo. RETURN: devolucion.'),
(N'DOM_IN_DEBIT_TRANSFER', N'DOM_IDT_ACH_TRANSFER_NUMBER_VC', N'Numero de transferencia ACH del mensaje recibido.'),
(N'DOM_IN_DEBIT_TRANSFER', N'DOM_IDT_ORIGINAL_ACH_NUMBER_VC', N'Numero de transferencia ACH original al que hace referencia el mensaje (rechazos y devoluciones).'),
(N'DOM_IN_DEBIT_TRANSFER', N'DOM_IDT_SENDER_BANK_ALIAS_VC', N'Codigo o alias del banco que origina el mensaje.'),
(N'DOM_IN_DEBIT_TRANSFER', N'DOM_IDT_RECIPIENT_BANK_ALIAS_VC', N'Codigo o alias del banco destinatario del mensaje.'),
(N'DOM_IN_DEBIT_TRANSFER', N'DOM_IDT_BRANCH_OFFICE_ID_VC', N'Codigo de la oficina o sucursal indicada en el mensaje.'),
(N'DOM_IN_DEBIT_TRANSFER', N'DOM_IDT_CURRENCY_CODE_VC', N'Codigo de moneda del mensaje.'),
(N'DOM_IN_DEBIT_TRANSFER', N'DOM_IDT_AMOUNT_DC', N'Monto del mensaje. NULL en respuestas que no incluyen monto.'),
(N'DOM_IN_DEBIT_TRANSFER', N'DOM_IDT_SENDER_ACCOUNT_TYPE_VC', N'Tipo de cuenta del ordenante.'),
(N'DOM_IN_DEBIT_TRANSFER', N'DOM_IDT_RECIPIENT_ACCOUNT_TYPE_VC', N'Tipo de cuenta del destinatario.'),
(N'DOM_IN_DEBIT_TRANSFER', N'DOM_IDT_SENDER_ACCOUNT_NUMBER_VC', N'Numero de cuenta del ordenante.'),
(N'DOM_IN_DEBIT_TRANSFER', N'DOM_IDT_RECIPIENT_ACCOUNT_NUMBER_VC', N'Numero de cuenta del destinatario.'),
(N'DOM_IN_DEBIT_TRANSFER', N'DOM_IDT_SENDER_ACCOUNT_HOLDER_ID_VC', N'Documento de identidad del titular de la cuenta del ordenante.'),
(N'DOM_IN_DEBIT_TRANSFER', N'DOM_IDT_SENDER_ACCOUNT_HOLDER_VC', N'Nombre del titular de la cuenta del ordenante.'),
(N'DOM_IN_DEBIT_TRANSFER', N'DOM_IDT_RECIPIENT_ACCOUNT_HOLDER_ID_VC', N'Documento de identidad del titular de la cuenta del destinatario.'),
(N'DOM_IN_DEBIT_TRANSFER', N'DOM_IDT_RECIPIENT_ACCOUNT_HOLDER_VC', N'Nombre del titular de la cuenta del destinatario.'),
(N'DOM_IN_DEBIT_TRANSFER', N'DOM_IDT_DESCRIPTION_VC', N'Glosa o descripcion incluida en el mensaje.'),
(N'DOM_IN_DEBIT_TRANSFER', N'DOM_IDT_SERVICE_CODE_VC', N'Codigo del servicio de la empresa indicado en el mensaje.'),
(N'DOM_IN_DEBIT_TRANSFER', N'DOM_IDT_RESPONSE_CODE_VC', N'Codigo de respuesta o rechazo informado por la camara (por ejemplo R02, R04).'),
(N'DOM_IN_DEBIT_TRANSFER', N'DOM_IDT_RESPONSE_MESSAGE_VC', N'Mensaje o glosa de la respuesta recibida.'),
(N'DOM_IN_DEBIT_TRANSFER', N'DOM_IDT_PROCESS_STATUS_VC', N'Estado de procesamiento interno. RECIBIDO, PROCESADO, ERROR, DUPLICADO, SIN_CONCILIAR.'),
(N'DOM_IN_DEBIT_TRANSFER', N'DOM_IDT_PROCESS_ATTEMPTS_IN', N'Cantidad de intentos de procesamiento realizados sobre el mensaje.'),
(N'DOM_IN_DEBIT_TRANSFER', N'DOM_IDT_PROCESS_ERROR_VC', N'Detalle del ultimo error ocurrido al procesar el mensaje.'),
(N'DOM_IN_DEBIT_TRANSFER', N'DOM_IDT_RECEIVED_DATE_DT', N'Fecha y hora en que el mensaje fue recibido de la camara.'),
(N'DOM_IN_DEBIT_TRANSFER', N'DOM_IDT_PROCESSED_DATE_DT', N'Fecha y hora en que el mensaje termino de procesarse.'),
(N'DOM_IN_DEBIT_TRANSFER', N'DOM_IDT_RAW_PAYLOAD_VC', N'Mensaje original completo tal como llego, conservado para auditoria.'),
(N'DOM_IN_DEBIT_TRANSFER', N'DOM_IDT_DATE_CREATION_DT', N'Fecha y hora de creacion del registro.'),
(N'DOM_IN_DEBIT_TRANSFER', N'DOM_IDT_USER_CREATION_VC', N'Usuario que creo el registro.'),
(N'DOM_IN_DEBIT_TRANSFER', N'DOM_IDT_DATE_MODIFICATION_DT', N'Fecha y hora de la ultima modificacion del registro.'),
(N'DOM_IN_DEBIT_TRANSFER', N'DOM_IDT_USER_MODIFICATION_VC', N'Usuario que realizo la ultima modificacion.');

/* ---------------------------------------------------------------------
   APLICACION: crea o actualiza MS_Description
   --------------------------------------------------------------------- */
DECLARE @schema SYSNAME = N'dbo', @table SYSNAME, @column SYSNAME, @desc NVARCHAR(3750);

-- Tablas
DECLARE cur_t CURSOR LOCAL FAST_FORWARD FOR SELECT TableName, Description FROM #DocTables;
OPEN cur_t;
FETCH NEXT FROM cur_t INTO @table, @desc;
WHILE @@FETCH_STATUS = 0
BEGIN
    IF OBJECT_ID(@schema + N'.' + @table, 'U') IS NULL
        PRINT N'AVISO: la tabla ' + @table + N' no existe. Se omite.';
    ELSE IF EXISTS (SELECT 1 FROM sys.extended_properties
                    WHERE class = 1 AND name = N'MS_Description'
                      AND major_id = OBJECT_ID(@schema + N'.' + @table) AND minor_id = 0)
        EXEC sys.sp_updateextendedproperty @name = N'MS_Description', @value = @desc,
             @level0type = N'SCHEMA', @level0name = @schema,
             @level1type = N'TABLE',  @level1name = @table;
    ELSE
        EXEC sys.sp_addextendedproperty @name = N'MS_Description', @value = @desc,
             @level0type = N'SCHEMA', @level0name = @schema,
             @level1type = N'TABLE',  @level1name = @table;

    FETCH NEXT FROM cur_t INTO @table, @desc;
END
CLOSE cur_t; DEALLOCATE cur_t;

-- Columnas
DECLARE cur_c CURSOR LOCAL FAST_FORWARD FOR SELECT TableName, ColumnName, Description FROM #DocColumns;
OPEN cur_c;
FETCH NEXT FROM cur_c INTO @table, @column, @desc;
WHILE @@FETCH_STATUS = 0
BEGIN
    IF COL_LENGTH(@schema + N'.' + @table, @column) IS NULL
        PRINT N'AVISO: la columna ' + @table + N'.' + @column + N' no existe. Se omite.';
    ELSE IF EXISTS (SELECT 1 FROM sys.extended_properties ep
                    JOIN sys.columns c ON c.object_id = ep.major_id AND c.column_id = ep.minor_id
                    WHERE ep.class = 1 AND ep.name = N'MS_Description'
                      AND ep.major_id = OBJECT_ID(@schema + N'.' + @table) AND c.name = @column)
        EXEC sys.sp_updateextendedproperty @name = N'MS_Description', @value = @desc,
             @level0type = N'SCHEMA', @level0name = @schema,
             @level1type = N'TABLE',  @level1name = @table,
             @level2type = N'COLUMN', @level2name = @column;
    ELSE
        EXEC sys.sp_addextendedproperty @name = N'MS_Description', @value = @desc,
             @level0type = N'SCHEMA', @level0name = @schema,
             @level1type = N'TABLE',  @level1name = @table,
             @level2type = N'COLUMN', @level2name = @column;

    FETCH NEXT FROM cur_c INTO @table, @column, @desc;
END
CLOSE cur_c; DEALLOCATE cur_c;

DROP TABLE #DocTables;
DROP TABLE #DocColumns;
GO

/* ---------------------------------------------------------------------
   VERIFICACION: columnas de las tres tablas SIN descripcion
   (debe devolver 0 filas)
   --------------------------------------------------------------------- */
SELECT t.name AS TableName, c.name AS ColumnName
FROM   sys.tables t
JOIN   sys.columns c ON c.object_id = t.object_id
LEFT JOIN sys.extended_properties ep
       ON ep.class = 1 AND ep.name = N'MS_Description'
      AND ep.major_id = c.object_id AND ep.minor_id = c.column_id
WHERE  t.name IN (N'DOM_DEBIT', N'DOM_OUT_DEBIT_TRANSFER', N'DOM_IN_DEBIT_TRANSFER')
  AND  ep.value IS NULL
ORDER BY t.name, c.column_id;
GO

/* ---------------------------------------------------------------------
   CONSULTA DE DICCIONARIO DE DATOS (para exportar a Excel/Confluence)
   --------------------------------------------------------------------- */
SELECT t.name                       AS TableName,
       c.column_id                  AS Ord,
       c.name                       AS ColumnName,
       ty.name
         + CASE WHEN ty.name IN ('varchar','nvarchar','char','nchar')
                THEN '(' + CASE WHEN c.max_length = -1 THEN 'MAX'
                                WHEN ty.name LIKE 'n%' THEN CAST(c.max_length/2 AS VARCHAR(10))
                                ELSE CAST(c.max_length AS VARCHAR(10)) END + ')'
                WHEN ty.name = 'decimal'
                THEN '(' + CAST(c.precision AS VARCHAR(10)) + ',' + CAST(c.scale AS VARCHAR(10)) + ')'
                ELSE '' END         AS DataType,
       CASE WHEN c.is_nullable = 1 THEN 'SI' ELSE 'NO' END AS Nullable,
       CAST(ep.value AS NVARCHAR(3750)) AS Description
FROM   sys.tables t
JOIN   sys.columns c  ON c.object_id = t.object_id
JOIN   sys.types   ty ON ty.user_type_id = c.user_type_id
LEFT JOIN sys.extended_properties ep
       ON ep.class = 1 AND ep.name = N'MS_Description'
      AND ep.major_id = c.object_id AND ep.minor_id = c.column_id
WHERE  t.name IN (N'DOM_DEBIT', N'DOM_OUT_DEBIT_TRANSFER', N'DOM_IN_DEBIT_TRANSFER')
ORDER BY t.name, c.column_id;
GO
