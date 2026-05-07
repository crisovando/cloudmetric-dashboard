# Dashboard RT — Real-time Server Monitoring Dashboard

Dashboard de monitoreo de servidores en tiempo real vía WebSocket. Muestra métricas en vivo de CPU, temperatura, memoria y red para múltiples servidores en una interfaz responsive con modo oscuro.

## Arquitectura

```
index.html → main.tsx → App.tsx
                          ├─ useDeviceHealth()        # Estado y lógica WebSocket
                          │    └─ useSocket()         # Conexión WebSocket nativa
                          └─ Header + Grid de cards
                               └─ StatCard (x4 por servidor)
```

- **Frontend:** SPA con React 19, single-view dashboard sin router
- **Tiempo real:** WebSocket nativo (no Socket.IO) manejado por el hook `useSocket`
- **Estado:** React hooks (`useState`/`useEffect`) — sin librería externa
- **Estilos:** Tailwind CSS v4 con `cn()` (clsx + tailwind-merge) para merging de clases
- **Componentes:** `StatCard` para métricas individuales, `CommandButton` para acciones futuras
- **Conexión:** `ws://localhost:8080/ws` en desarrollo, `ws://<host>/ws` en producción

## Cualidades

- Métricas en vivo: CPU, temperatura, memoria, red (in/out)
- Grid responsive (1 col móvil · 2 tablet · 3 escritorio)
- Indicador de conexión Gateway (Online / Offline)
- Modo oscuro nativo
- React Compiler habilitado para memoización automática
- Tipado estricto con TypeScript

## Stack tecnológico

| Tecnología | Versión | Propósito |
|---|---|---|
| React | ^19.2.5 | UI framework |
| TypeScript | ~6.0.2 | Tipado estático |
| Vite | ^8.0.10 | Build tool / dev server |
| Tailwind CSS | ^4.1.14 | Estilos utilitarios |
| Lucide React | ^1.14.0 | Iconos |
| clsx + tailwind-merge | ^2.1.1 / ^3.5.0 | Clases condicionales |
| Recharts | ^3.8.1 | Gráficos históricos (futuro) |

### Dependencias notables

- **Recharts** — Incluido para futura implementación de gráficos históricos de salud de servidores (líneas de CPU, temperatura, memoria, etc. a lo largo del tiempo), usando los datos acumulados en `deviceHealth: ServerHealth[]`.

> **Nota:** `socket.io-client` aparece en `package.json` pero el proyecto usa WebSocket nativo. Pendiente de limpieza.

## Cómo correrlo

### Prerrequisitos

- Node.js (compatible con las dependencias)
- [pnpm](https://pnpm.io/) (versión 10.28.0 recomendada)
- Backend WebSocket corriendo en `ws://localhost:8080/ws`

### Comandos

```bash
pnpm install        # Instalar dependencias
pnpm dev            # Iniciar servidor de desarrollo (localhost:5173)
pnpm build          # Type-check + build producción → dist/
pnpm preview        # Servir build producción localmente
pnpm lint           # Lint con ESLint
```

## Estructura del proyecto

```
dashboard-rt/
├── public/                  # Assets estáticos
├── src/
│   ├── components/
│   │   ├── StatCard.tsx     # Card de métrica individual
│   │   └── CommandButton.tsx # Botón de acción (no integrado aún)
│   ├── hooks/
│   │   ├── useSocket.ts     # Hook de conexión WebSocket
│   │   └── useDeviceHealth.ts # Hook de suscripción a mensajes
│   ├── types/
│   │   └── deviceHealth.ts  # Tipos ServerHealth, HealthData, HealthStatus
│   ├── utils/
│   │   └── utils.ts         # Utility cn() para clases condicionales
│   ├── App.tsx              # Componente raíz (layout + grid)
│   ├── App.css              # Estilos específicos de App
│   ├── index.css            # Import de Tailwind
│   └── main.tsx             # Entry point
├── index.html
├── vite.config.ts
├── tsconfig*.json
├── eslint.config.js
└── package.json
```

## Formato del mensaje WebSocket

El backend debe enviar mensajes JSON con la siguiente estructura:

```typescript
interface ServerHealth {
  serverId: string;
  health: {
    timestamp: string;
    cpu: number;          // 0-100
    temp: number;         // °C
    memory: number;       // 0-100
    network: {
      in_value: number;   // bytes/s
      out_value: number;  // bytes/s
    };
    uptime: number;       // segundos
    status: "healthy" | "warning" | "critical";
  };
}
```

## Notas

- `import.meta.env.NODE_ENV` se usa para determinar la URL del WebSocket. En Vite lo correcto es `import.meta.env.DEV`/`PROD` — pendiente de migrar.
- El hook `useSocket` no implementa reconexión automática ante fallos de conexión.
- No hay estado de carga — el dashboard se muestra vacío hasta recibir el primer mensaje WebSocket.
