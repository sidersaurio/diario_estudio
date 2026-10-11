# MEMORY.md — Diario de Estudio 
Memoria del proyecto entre sesiones. Máximo ~50 líneas: resume o elimina lo que ya no 
aporte. 

## Estado actual 
- v1 funcionando: registrar sesiones (fecha, tema, minutos), racha actual y lista de 
sesiones. 
- Datos en localStorage. 
- **Total semanal (lunes-domingo) mostrado en tarjeta en header** 
- **Días estudiados este mes mostrado en tarjeta en header** 
- `.gitignore` cubre basura de SO/editor, temporales, logs y secretos locales; no se ignoran artefactos de build ni dependencias porque el proyecto no los usa.

## Aprendizajes y errores a evitar 
- (vacío por ahora) 

## Decisiones (y por qué) 
- Sin backend ni dependencias: cualquiera debe poder abrirlo con doble clic. 
- Fecha editable en el formulario: permite registrar días pasados y ver la racha crecer. 
- **Semana = lunes a domingo (ISO), basada en fecha local actual** 
- **Mes = mes actual (fecha local), excluye fechas futuras** 

## Próximos pasos 
- (vacío por ahora) 