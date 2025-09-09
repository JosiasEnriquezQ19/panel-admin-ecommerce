# PanelAdmin (React + Vite)

App mínima para administrar recursos (consumo de API ASP.NET Core en http://localhost:5184).

Requisitos
- Node.js y npm
- Backend corriendo en http://localhost:5184

Instalación y ejecución (PowerShell):

```powershell
cd "D:\4 CICLO\HERRAMIENTAS DE PROGRAMACION 2\EVALUACION\PanelAdmin"
npm install
npm run dev
```

Notas
- Dev server corre en el puerto 3000; las peticiones a `/api/*` se proxyean a `http://localhost:5184`.
- Ajusta `.env` si la ruta del backend cambia (VITE_API_BASE).

Qué incluye
- Página de `Productos` con listado (GET /api/Productos), creación (POST /api/Productos) y eliminación (DELETE /api/Productos/{id}).
