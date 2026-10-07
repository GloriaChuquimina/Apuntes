# Plan de actualización: .NET 8 → .NET 10  
## Proyecto ACHOD_BO_WEB (y solution relacionada)

**Fecha:** octubre 2026  
**Motivo:** .NET 8 y .NET 9 finalizan soporte el **10 de noviembre de 2026**.  
**Destino:** .NET 10 (LTS) — soporte hasta **14 de noviembre de 2028**.

---

## 1. Resumen de versiones

| Versión   | Tipo | Fin de soporte   |
|-----------|------|------------------|
| .NET 8    | LTS  | **10 nov 2026**  |
| .NET 9    | STS  | **10 nov 2026**  |
| **.NET 10** | **LTS** | **14 nov 2028** |

- SDK recomendado: **10.0.401** (runtime 10.0.12 o superior).
- Visual Studio para apuntar a `net10.0`: **Visual Studio 2026 (18.0+)**.
- Servidores IIS: instalar **.NET 10 Hosting Bundle**.

Descargas oficiales: https://dotnet.microsoft.com/download/dotnet/10.0

---

## 2. Checklist general

```
[ ] Crear rama feature/upgrade-net10 (o backup completo)
[ ] Instalar SDK .NET 10 (+ VS 2026 si aplica)
[ ] Actualizar TargetFramework en todos los .csproj de la solution
[ ] Actualizar paquetes Microsoft.* a 10.0.x
[ ] dotnet restore && dotnet build
[ ] Corregir breaking changes / warnings
[ ] Probar Login → Main → Debits / Afiliaciones / Reportes / Roles
[ ] Instalar Hosting Bundle .NET 10 en servidores
[ ] Actualizar CI/CD y contenedores (si aplica)
[ ] Merge y despliegue a producción (antes del 10 nov 2026)
```

---

## 3. Proyectos a actualizar en la solution

Según la estructura visible de **ACHOD_BO_WEB**:

| Proyecto            | Acción                          |
|---------------------|---------------------------------|
| `ACHOD_BO_WEB`      | `net8.0` → `net10.0` + paquetes |
| `ACHOD.Common`      | `net8.0` → `net10.0`            |
| `ACHOD.Logger`      | `net8.0` → `net10.0`            |
| `ACHOD.Models`      | `net8.0` → `net10.0`            |
| Otros (BatchClient, Debits, etc. si son proyectos) | Revisar y actualizar igual |

**Orden recomendado:** Common → Logger → Models → Web (dependencias primero).

---

## 4. Diff del `.csproj` (ACHOD_BO_WEB)

Archivo actual (aprox. según captura):

```xml
<Project Sdk="Microsoft.NET.Sdk.Web">

  <PropertyGroup>
    <TargetFramework>net8.0</TargetFramework>
    <Nullable>enable</Nullable>
    <ImplicitUsings>enable</ImplicitUsings>
  </PropertyGroup>

  <ItemGroup>
    <PackageReference Include="jQuery" Version="3.7.1" />
  </ItemGroup>

  <ItemGroup>
    <ProjectReference Include="..\ACHOD.Common\ACHOD.Common.csproj" />
    <ProjectReference Include="..\ACHOD.Logger\ACHOD.Logger.csproj" />
    <ProjectReference Include="..\ACHOD.Models\ACHOD.Models.csproj" />
  </ItemGroup>

  <ItemGroup>
    <Folder Include="wwwroot\lib\DataTable\" />
    <Folder Include="wwwroot\lib\showPassword\" />
    <Folder Include="wwwroot\lib\sweetAlert\" />
  </ItemGroup>

</Project>
```

### Cambio mínimo requerido

```diff
  <PropertyGroup>
-   <TargetFramework>net8.0</TargetFramework>
+   <TargetFramework>net10.0</TargetFramework>
    <Nullable>enable</Nullable>
    <ImplicitUsings>enable</ImplicitUsings>
  </PropertyGroup>
```

**jQuery 3.7.1** puede permanecer (no depende del TFM de .NET).  
Si tienes más `PackageReference` de Microsoft (AspNetCore, EF Core, Extensions, etc.), súbelos a la serie **10.0.x**.

Ejemplo de paquetes Microsoft (si existen en tu web o librerías):

```xml
<!-- Ejemplo: actualizar versiones a 10.0.x -->
<PackageReference Include="Microsoft.AspNetCore.Mvc.Razor.RuntimeCompilation" Version="10.0.0" />
<PackageReference Include="Microsoft.EntityFrameworkCore.SqlServer" Version="10.0.0" />
<PackageReference Include="Microsoft.Extensions.Http" Version="10.0.0" />
```

> Ajusta el número de parche (10.0.12, etc.) al último disponible en NuGet en el momento de la migración.

---

## 5. `global.json` (opcional pero recomendado)

En la raíz de la solution (junto al `.sln`):

```json
{
  "sdk": {
    "version": "10.0.401",
    "rollForward": "latestFeature"
  }
}
```

Así el `dotnet` CLI y CI usan de forma consistente el SDK 10.

---

## 6. Comandos PowerShell (actualizar toda la solution)

Ejecutar desde la **carpeta raíz de la solution** (donde está el `.sln`).

### 6.1 Verificar SDK instalado

```powershell
dotnet --list-sdks
dotnet --version
# Debe mostrar algo como: 10.0.401
```

### 6.2 Crear rama (si usas Git)

```powershell
git checkout -b feature/upgrade-net10
git status
```

### 6.3 Cambiar `TargetFramework` en todos los `.csproj`

```powershell
# Reemplaza net8.0 por net10.0 en todos los proyectos de la solution
Get-ChildItem -Recurse -Filter *.csproj | ForEach-Object {
    $content = Get-Content $_.FullName -Raw
    if ($content -match 'net8\.0') {
        $newContent = $content -replace '<TargetFramework>net8\.0</TargetFramework>', '<TargetFramework>net10.0</TargetFramework>'
        $newContent = $newContent -replace '<TargetFrameworks>net8\.0</TargetFrameworks>', '<TargetFrameworks>net10.0</TargetFrameworks>'
        Set-Content -Path $_.FullName -Value $newContent -NoNewline
        Write-Host "Actualizado: $($_.FullName)"
    }
}
```

### 6.4 Restaurar y compilar

```powershell
dotnet clean
dotnet restore
dotnet build --configuration Release
```

Si quieres tratar warnings como errores durante la migración:

```powershell
dotnet build --configuration Release --warnaserror
```

### 6.5 Listar paquetes desactualizados

```powershell
dotnet list package --outdated
```

### 6.6 Actualizar paquetes Microsoft a 10.0.x (manual o con herramienta)

Opción A — Visual Studio: clic derecho en la **Solution** → **Manage NuGet Packages for Solution** → pestaña **Updates**.

Opción B — CLI (ejemplo por paquete; repite según tu lista):

```powershell
# Ejemplo genérico (ajusta nombres según lo que tenga tu solution)
dotnet add ACHOD_BO_WEB package Microsoft.Extensions.Http --version 10.0.12
```

Opción C — script orientativo para subir versiones major de Microsoft (revisar antes de aplicar en producción):

```powershell
# Solo referencia: revisar salida de "dotnet list package --outdated" primero
# No ejecutes actualizaciones masivas a ciegas en paquetes de terceros.
```

### 6.7 Ejecutar tests (si existen)

```powershell
dotnet test --configuration Release
```

### 6.8 Publicar (ejemplo)

```powershell
dotnet publish ACHOD_BO_WEB\ACHOD_BO_WEB.csproj -c Release -o .\publish-net10
```

---

## 7. Servidor / IIS

1. Descargar e instalar el **.NET 10 Hosting Bundle**:  
   https://dotnet.microsoft.com/download/dotnet/10.0  
   (sección *Run apps - Runtime* → *Hosting Bundle* para Windows).

2. Reiniciar IIS:
   ```powershell
   iisreset
   ```

3. Verificar runtime instalado:
   ```powershell
   dotnet --list-runtimes
   # Debe aparecer Microsoft.AspNetCore.App 10.0.x y Microsoft.NETCore.App 10.0.x
   ```

4. En el Application Pool de IIS: *No Managed Code* (como en ASP.NET Core habitual).

---

## 8. Docker (si aplica)

```dockerfile
# Antes
FROM mcr.microsoft.com/dotnet/aspnet:8.0
# ...
FROM mcr.microsoft.com/dotnet/sdk:8.0

# Después
FROM mcr.microsoft.com/dotnet/aspnet:10.0
# ...
FROM mcr.microsoft.com/dotnet/sdk:10.0
```

---

## 9. Breaking changes a revisar (ASP.NET Core / .NET 10)

Documentación oficial:

- Breaking changes .NET 10: https://learn.microsoft.com/dotnet/core/compatibility/10  
- Breaking changes ASP.NET Core 10: https://learn.microsoft.com/aspnet/core/breaking-changes/10/overview  

Temas frecuentes en apps MVC/Razor como ACHOD:

| Tema | Notas |
|------|--------|
| Razor runtime compilation | Obsoleto; preferir compilación en build. |
| `IActionContextAccessor` | Obsoleto. |
| Cookie login redirects hacia APIs | Cambio de comportamiento. |
| `ForwardedHeaders` / `IPNetwork` | APIs obsoletas. |
| NuGet Audit (NU1901–NU1904) | Más estricto con vulnerabilidades transitivas. |
| `WebHost` / `IWebHost` | Obsoletos (usar `WebApplication` / minimal hosting si aplica). |

En muchos proyectos 8 → 10 el build queda limpio; los problemas suelen aparecer en **comportamiento en runtime** (auth, headers, serialización). Por eso las pruebas funcionales son obligatorias.

---

## 10. Pruebas funcionales mínimas (ACHOD)

Después del upgrade, validar al menos:

1. **Login** (`LoginController`) — sesión y redirección.  
2. **Layout** (`_MainShared.cshtml`) — menú y perfil.  
3. **Main / Resumen**.  
4. **Debits / Cargas / Batch** — listados, filtros, estados.  
5. **Afiliaciones por lote** (si ya integraste el nuevo UI).  
6. **Aprobaciones** y segregación de roles (`ACHOD.Security`, `ObtainRol`, `Roles`).  
7. **Reportes**.  
8. **HttpService** — llamadas a APIs internas.  
9. Carga de archivos (xlsx/csv) y SweetAlert / DataTables.

---

## 11. CI/CD

- Agentes de build: instalar SDK 10.  
- Variables de pipeline: `TargetFramework=net10.0` si está hardcodeado.  
- Imágenes Docker y App Service: stack .NET 10.  
- No dejar jobs apuntando a `net8.0` tras el merge.

---

## 12. Orden de ejecución sugerido (1–2 días)

| Día / bloque | Tareas |
|--------------|--------|
| **Bloque 1** | Rama + instalar SDK 10 + VS 2026 |
| **Bloque 2** | Script PowerShell de TFM en todos los `.csproj` |
| **Bloque 3** | `dotnet restore` + `dotnet build` + actualizar NuGet Microsoft |
| **Bloque 4** | Corregir errores/warnings |
| **Bloque 5** | Pruebas locales (Login → módulos críticos) |
| **Bloque 6** | Hosting Bundle en servidor de pruebas + deploy |
| **Bloque 7** | Pruebas en servidor de pruebas |
| **Bloque 8** | Producción (antes del 10 nov 2026) |

---

## 13. Referencias

- Anuncio .NET 10: https://devblogs.microsoft.com/dotnet/announcing-dotnet-10/  
- Política de soporte: https://dotnet.microsoft.com/platform/support/policy  
- Descarga .NET 10: https://dotnet.microsoft.com/download/dotnet/10.0  
- Migrar ASP.NET Core: https://learn.microsoft.com/aspnet/core/migration/  
- Requisitos Visual Studio para .NET 10: VS 2026 18.0+ para `net10.0`

---

## 14. Notas finales

- No es obligatorio pasar por .NET 9: se puede ir **directo de 8 a 10**.  
- Actualiza primero las **librerías compartidas** (Common, Logger, Models) y después el web.  
- El riesgo principal no es el compilador, sino cambios de **comportamiento** (auth, headers, JSON). Por eso el checklist de pruebas es parte del plan, no un extra.  
- Si un paquete de terceros no soporta .NET 10, busca versión actualizada o alternativa antes de subir a producción.

---

*Documento generado para la solution ACHOD_BO_WEB — actualización .NET 8 → .NET 10.*
