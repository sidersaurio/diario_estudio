# Spec 001 — Mapa de Calor (Heat Map)
## Contexto y objetivo
Añadir una visualización tipo GitHub heat map que muestre la actividad de estudio de las últimas 52 semanas. Cada día se colorea según los minutos totales estudiados, permitiendo ver patrones de consistencia, rachas y variaciones estacionales de un vistazo. Refuerza el hábito mediante feedback visual inmediato y complementa las métricas numéricas existentes (racha, total semanal, días mensuales).

## Usuarios / actores
- **Estudiante autodidacta**: único usuario, usa la app en navegador de escritorio o móvil, sin cuenta ni backend.

## Historias de usuario
- **H1**: Como estudiante quiero ver un mapa de calor de mi actividad de las últimas 52 semanas para identificar patrones de consistencia y periodos de baja actividad.
- **H2**: Como estudiante quiero pasar el ratón por un día y ver la fecha exacta y los minutos estudiados para validar un dato concreto.
- **H3**: Como estudiante quiero que los días futuros se vean distintos (vacíos) para no confundirlos con días reales sin estudio.

## Requisitos funcionales (criterios de aceptación en EARS)
- **RF-1**: CUANDO la app carga, EL SISTEMA renderiza una cuadrícula de 52 semanas × 7 días (lunes a domingo) con la semana más reciente abajo a la derecha.
- **RF-2**: PARA cada día con al menos una sesión, EL SISTEMA suma los minutos de todas las sesiones de ese día y asigna un nivel de intensidad según: Nivel 0 = 0 min; Nivel 1 = 1–59 min; Nivel 2 = 60–119 min; Nivel 3 = 120–179 min; Nivel 4 = 180+ min.
- **RF-3**: CUANDO el usuario pasa el ratón sobre una celda de día, EL SISTEMA muestra un tooltip con la fecha en formato DD-MM-YYYY y los minutos totales (ej. "15-10-2026: 95 min").
- **RF-4**: SI un día es posterior a hoy (futuro), ENTONCES EL SISTEMA lo renderiza en color neutro (gris claro / nivel 0 visual) sin tooltip de minutos.
- **RF-5**: LA SECCIÓN del mapa de calor aparece al final de la página, tras el historial de sesiones, con título "Actividad (últimas 52 semanas)".
- **RF-6**: EL SISTEMA recalcula y repinta el mapa cada vez que se añade, edita o borra una sesión (refreshUI).

## Requisitos no funcionales
- **RNF-1** (Rendimiento): Cálculo y render del mapa < 50 ms en móvil con 500 sesiones.
- **RNF-2** (Accesibilidad): Tooltip accesible por teclado (focus en celda) y con contraste WCAG AA.
- **RNF-3** (Compatibilidad): Funciona en navegadores modernos sin polyfills; sin dependencias externas.
- **RNF-4** (Internacionalización): Interfaz y tooltips en español; fechas en DD-MM-YYYY.
- **RNF-5** (Mantenibilidad): Lógica de cálculo (agrupación por día, asignación de nivel) en función pura sin DOM ni localStorage, recibiendo "hoy" como parámetro (Constitución #3).

## Casos límite
- **Sin sesiones**: mapa totalmente vacío (nivel 0 en todas las celdas).
- **Sesiones en un solo día**: solo esa celda tiene color.
- **Más de 52 semanas de datos**: se recortan las más antiguas (solo últimas 52).
- **Datos corruptos en localStorage** (fecha inválida, minutos no numéricos): se ignoran esas sesiones, el resto pinta normal.
- **Cambio de huso horario / DST**: fechas siempre en hora local del navegador (input[type=date] ya garantiza YYYY-MM-DD local).
- **Muy pocas semanas de datos** (ej. usuario nuevo): se pintan las semanas disponibles, las anteriores quedan en nivel 0.

## Fuera de alcance
- Navegación por teclado entre celdas (solo hover/focus tooltip).
- Click en celda para rellenar formulario o scroll al historial.
- Selector de rango temporal (12/24/52 semanas) — fijo a 52.
- Escala de color continua o configurable.
- Exportar imagen del mapa.
- Leyenda visible permanente (la intensidad se entiende por contexto; opcional en v2).
- Animaciones de entrada/salida.

## Criterios de finalización
1. Todos los RF con tests unitarios en verde (`node --test`).
2. Demo manual: añadir sesiones en días distintos → mapa actualiza al instante; hover muestra tooltip correcto; días futuros grises; semana empieza en lunes.
3. Accesibilidad básica: focus en celda muestra tooltip, contraste OK.
4. Código sigue Constitución: funciones puras, sin dependencias, localStorage hacia atrás compatible.

## Dudas abiertas
- [NECESITA ACLARACIÓN] Paleta de colores exacta para los 5 niveles (CSS variables nuevas o reutilizar existentes).
- [NECESITA ACLARACIÓN] Tamaño de celda y gap en móvil vs desktop (responsive).
- [NECESITA ACLARACIÓN] Mostrar etiquetas de mes (ene, feb...) al lado de las filas como GitHub.
