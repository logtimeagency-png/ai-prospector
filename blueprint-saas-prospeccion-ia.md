**Blueprint: AI Prospector SaaS![](Aspose.Words.aed78cff-7938-4720-8cc3-54514c6b3d1e.001.png)**

Documento Estratégico y Técnico para el Desarrollo del MVP

1. **Concepto del Proyecto![](Aspose.Words.aed78cff-7938-4720-8cc3-54514c6b3d1e.002.png)**

El proyecto consiste en una plataforma SaaS de **"Prospección basada en Diagnóstico"**. A diferencia de los buscadores de leads genéricos, este sistema identifica debilidades técnicas en negocios locales (puntos de dolor) y genera automáticamente un mensaje de venta personalizado para que el usuario simplemente lo copie y lo envíe.

**Propuesta de Valor Clave:**

- **Filtros de Oportunidad:** Búsqueda por "Sin Web", "Web lenta", "Sin Reservas Online", "Pocas Reseñas", etc.
- **Opportunity Score:** Algoritmo que puntúa a cada lead según la urgencia de sus problemas detectados.
- **Copy-Paste Workflow:** Generación de guiones para Email, WhatsApp e Instagram listos para usar sin necesidad de integraciones complejas.
2. **Análisis de Costes Reales (Proyección 2025)![](Aspose.Words.aed78cff-7938-4720-8cc3-54514c6b3d1e.003.png)**

La rentabilidad del SaaS depende de mantener bajos los costes de API. Utilizaremos el stack más eficiente del mercado:



|**Servicio**|**Herramienta Sugerida**|**Coste Estimado**|**Impacto por Lead**|
| - | - | - | - |
|Scraping Google Maps|Apify / Outscraper|$1.50 / 1,000 resultados|$0.0015|
|Análisis IA + Guion|OpenAI (GPT-4o-mini)|$0.15 / 1M tokens (input)|$0.0005|
|Base de Datos / Backend|Supabase / N8N|Fijo (~$20/mes)|Mínimo|
|**TOTAL VARIABLE**|**-**|**-**|**$0.0020 - $0.0025**|

**Nota de Rentabilidad:** Con un coste de $2.50 por cada 1,000 leads analizados, un plan de $29/mes con 400 leads genera un margen superior al 95%. ![](Aspose.Words.aed78cff-7938-4720-8cc3-54514c6b3d1e.004.png)

3. **Modelo de Negocio y Planes![ref1]**



|**Plan**|**Precio (Mes)**|**Créditos de Análisis**|**Características**|
| - | - | - | - |
|**Starter**|$29|400 leads|Acceso a filtros básicos, mensajes IA.|
|**Pro**|$79|2,000 leads|Opportunity Score avanzado, exportación CSV.|
|**Agency**|$199|6,000 leads|Soporte prioritario, análisis multi-localidad.|

4. **Arquitectura Técnica![](Aspose.Words.aed78cff-7938-4720-8cc3-54514c6b3d1e.006.png)**

Diseño pensado para velocidad de desarrollo (MVP en 2-3 semanas):

- **Frontend:** Next.js + Tailwind CSS (Vercel). Interfaz limpia con tabla de leads.
- **Backend/Lógica:** N8N. Orquestará el flujo: Recibir búsqueda -> Activar Apify -> Procesar datos con IA -> Guardar en DB.
- **Base de Datos:** Supabase (PostgreSQL) para auth de usuarios y almacenamiento de leads.
- **Procesamiento IA:** LangChain o llamadas directas a OpenAI para generar los textos personalizados.
5. **Guía para Claude (Prompt de Desarrollo)![](Aspose.Words.aed78cff-7938-4720-8cc3-54514c6b3d1e.007.png)**

Copia y pega este prompt en Claude para empezar la programación:

"Actúa como un Desarrollador Senior Fullstack. Vamos a crear un SaaS de prospección. Necesito:![](Aspose.Words.aed78cff-7938-4720-8cc3-54514c6b3d1e.008.png)

1. Esquema de base de datos en SQL para Supabase que incluya tablas de: 'users', 'subscriptions', 'leads' (con campos para website\_analysis, seo\_score y ai\_message) y 'credit\_usage'.
1. El código de una API Route en Next.js que reciba un nicho y localidad, y simule el flujo de envío de datos a un webhook de N8N.
1. Una página de Dashboard en Next.js usando Shadcn/UI que muestre una lista de leads con un botón 'Ver mensaje personalizado' que abra un modal con el texto generado para copiar."

**6. Hoja de Ruta (Roadmap)![ref1]**

**Fase 1: Motor (Semana 1)**

Configurar N8N + Apify. Lograr que al poner "Dentistas en Madrid" se genere un JSON con la lista y los problemas de cada web.

**Fase 2: Aplicación (Semana 2)**

Conectar el frontend con Supabase. Implementar el sistema de login y la visualización de datos. **Fase 3: Monetización (Semana 3)**

Integrar Stripe para la gestión de créditos y suscripciones.

Documento generado para el desarrollo del Proyecto Prospector AI © 2025 ![](Aspose.Words.aed78cff-7938-4720-8cc3-54514c6b3d1e.009.png)
Página 3 de 3

[ref1]: Aspose.Words.aed78cff-7938-4720-8cc3-54514c6b3d1e.005.png
