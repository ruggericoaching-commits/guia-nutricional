# Guía Nutricional — mini app para tus asesorados

App web instalable (PWA) que funciona en cualquier celular, **sin servidores, sin bases de datos y sin costo**.
Tiene tres partes en un mismo sitio:

| Parte | Dirección | Quién la usa |
|---|---|---|
| **Panel del entrenador** | `tu-sitio/#coach` | Vos (protegido con PIN) |
| **Formulario inicial** | link que generás en el panel | Alumnos nuevos |
| **App del alumno** | link del plan que generás en el panel | Cada asesorado |

---

## 1. Cómo funciona (en 30 segundos)

1. Le mandás a un alumno nuevo el **link del formulario** (botón 📝 en el panel).
2. Lo completa en 5 minutos y te llega un **WhatsApp** con sus respuestas y un código.
3. Pegás ese mensaje en el panel (botón 📥) → se crea el alumno **con un plan automático** calculado con criterio científico (respeta dieta, alergias, gustos, si cocina o no y dónde come cada comida).
4. Revisás y ajustás lo que quieras: calorías, macros, comidas, opciones, alimentos, consejos.
5. Tocás **Generar link** → se lo mandás por WhatsApp → el alumno lo abre y lo instala en su celular como una app.
6. Cada semana el alumno toca **"Enviar check-in"** → te llega un WhatsApp → lo pegás en el panel y ves su evolución y una **sugerencia de ajuste**.

> **¿Dónde se guardan los datos?** Tus alumnos y planes se guardan en tu dispositivo (navegador). Los registros del alumno, en su celular. Nada pasa por servidores de terceros. Por eso es gratis y privado — y por eso es clave el **respaldo semanal** (ver punto 5).

---

## 2. Probarla en tu computadora

Hacé doble clic en `index.html` y se abre en el navegador. Entrá a `#coach` (o tocá "Acceso entrenador") y configurá tu panel.
Así podés armar planes, pero **los links para los alumnos solo funcionan cuando la app está publicada** (punto 3).

---

## 3. Publicarla gratis (una sola vez, ~10 minutos)

### Opción A — GitHub Pages (recomendada: gratis, permanente y con tu propia dirección)

1. Creá una cuenta gratis en <https://github.com>.
2. Tocá **New repository** → nombre: `guia` → **Public** → *Create repository*.
3. En el repositorio: **Add file → Upload files** → arrastrá **todo el contenido de esta carpeta** (index.html, sw.js, manifest.webmanifest y las carpetas `css`, `js`, `icons`) → *Commit changes*.
4. Andá a **Settings → Pages** → en *Branch* elegí `main` y `/ (root)` → *Save*.
5. En 1–2 minutos tu app queda en: `https://TU-USUARIO.github.io/guia/`
6. Abrí `https://TU-USUARIO.github.io/guia/#coach`, configurá tu panel y en **Ajustes → Dirección pública** pegá esa dirección.

> El código queda público, pero **ningún dato de tus alumnos**: esos viajan dentro de los links y se guardan en cada dispositivo.

### Opción B — Netlify o Cloudflare Pages (también gratis)

- **Netlify**: creá una cuenta en <https://app.netlify.com> → *Add new site → Deploy manually* → arrastrá esta carpeta. Te da una dirección tipo `https://nombre.netlify.app`.
- **Cloudflare Pages**: <https://pages.cloudflare.com> → *Create project → Direct upload* → subí la carpeta.

### Actualizar la app más adelante

Subí los archivos nuevos y cambiá el número en la primera línea de `sw.js` (`guia-nutricional-v1` → `v2`). Los celulares de tus alumnos se actualizan solos la próxima vez que abran la app.

---

## 4. Primer uso del panel

1. Entrá a `tu-sitio/#coach`.
2. Completá: tu nombre, tu marca, **tu WhatsApp con código de país** (ej. `5491122334455`), color y un **PIN**.
3. Para explorar sin alumnos reales: tocá **🧪 Cargar un alumno de ejemplo** (en la lista de alumnos o en Ajustes) y después **Ver como alumno**: ves su app con 3 semanas de uso simulado.
4. Recomendado: usá el panel siempre desde el **mismo dispositivo y navegador** (ideal: la computadora con Chrome, o el celular con la app instalada).

### Flujo con cada alumno

- **📝 Link del formulario** → mandáselo a alumnos nuevos.
- **📥 Pegar mensaje** → pegá el WhatsApp completo que te llega (formulario o check-in). También sirve para **recuperar un alumno** pegando el link del plan que le mandaste.
- **Ficha del alumno** (pestañas):
  - **Perfil**: datos, objetivo, actividad, contexto (si cocina, si lleva tupper), dieta, alergias, gustos y salud. Las alertas médicas aparecen arriba en rojo.
  - **Objetivos**: cálculo transparente (metabolismo basal, actividad, entrenamiento, ajuste por objetivo) y macros. Podés fijar calorías, proteína (g/kg) o grasas (%) a mano.
  - **Plan**: comidas con horario, % de energía, lugar (casa / trabajo / afuera) y pre/post entreno. Cada comida tiene opciones equivalentes. Podés agregar alimentos, cambiar gramos, reemplazar por equivalentes (⇄), fijar cantidades (📌) y tocar **⚖️ Ajustar** para que las cantidades calcen solas con el objetivo.
  - **Consejos**: recomendaciones generadas según el perfil (activás las que quieras), consejos propios y un mensaje para el alumno. Arriba está **Arranque y flexibilidad**:
    - **Arranque por fases** (activado por defecto, empieza el día que mandás el primer link): fase 1 *Base* (semanas 1–2, foco en horarios, proteína y verduras, meta 70% de comidas), fase 2 *Plan completo* (semanas 3–4, porciones, meta 80%) y fase 3 *Autonomía* (desde la semana 5, meta 85%). El alumno ve su fase, su foco y 3 hábitos para tildar. En la fase 1 el panel no sugiere ajustar calorías.
    - **Comidas libres por semana** (0, 1 o 2; por defecto 1): el alumno la marca como «Comida libre», cuenta como cumplida y te llega informada en el check-in.
  - **Enviar**: chequeo previo, vista previa "como alumno" y botón para generar el link y mandarlo por WhatsApp.
  - **Progreso**: check-ins, gráfico de peso y sugerencia de ajuste (con botón para aplicarla).

### Cuando cambiás un plan

Generá un **link nuevo** y mandáselo. Al abrirlo, su app se actualiza y **conserva sus registros**.
En iPhone, si el alumno tiene la app instalada en el inicio, que pegue el link nuevo en **⚙️ Ajustes → Actualizar plan**.

---

## 5. Respaldo (¡importante!)

- En **Ajustes → Respaldo** tocá **Descargar respaldo** una vez por semana y guardalo en Google Drive o mandátelo por mail. El panel te avisa si pasaron más de 7 días.
- Para pasar el panel a otro dispositivo: descargá el respaldo en uno y usá **Restaurar respaldo** en el otro.
- Si algún día perdés todo, cada link de plan que mandaste sirve para recuperar a ese alumno (📥 Pegar mensaje).

---

## 6. Para tus alumnos

- **Android (Chrome)**: abrir el link → menú ⋮ → **Instalar app**.
- **iPhone (Safari)**: abrir el link en Safari → botón Compartir ⬆️ → **Agregar a inicio**.
- Funciona sin internet una vez abierta.
- Secciones: **Hoy** (comidas del día para marcar, agua, consejo del día), **Plan** (opciones y equivalencias de cada comida, lista de compras), **Afuera** (método de la mano y guía por lugar: restaurante, parrilla, kiosco, comedor, delivery, eventos, viajes), **Hábitos** y **Progreso** (peso, cintura, adherencia y check-in semanal por WhatsApp).

---

## 7. Base nutricional (resumen para vos)

- **Gasto energético**: Mifflin-St Jeor (o Katch-McArdle si hay % de grasa medido) × factor de actividad diaria + gasto del entrenamiento estimado por MET.
- **Pérdida de grasa**: 0,5–1% del peso por semana (por defecto 0,75%), déficit limitado al 25–30% del gasto y nunca por debajo del metabolismo basal.
- **Ganancia muscular**: superávit de +5 a +15% (por defecto +10%).
- **Proteína**: 1,6–2,2 g/kg según objetivo (más alta en déficit), calculada sobre un peso de referencia en personas con mucha grasa corporal; +0,2 g/kg en dietas veganas.
- **Grasas**: 20–40% de las calorías según el estilo, mínimo 0,5 g/kg. **Carbohidratos**: el resto.
- **Fibra**: ~14 g cada 1.000 kcal (mínimo 25–30 g). **Agua**: ~30 ml/kg + ~500 ml por hora de entrenamiento.
- **Distribución**: proteína repartida en todas las comidas; más carbohidratos y menos grasa alrededor del entrenamiento.
- **Alertas automáticas**: embarazo, TCA, diabetes, enfermedad renal, cirugía bariátrica, menores de 18, IMC bajo, calorías muy bajas, baja disponibilidad energética, etc.
- **Ajuste semanal**: compara promedios de peso de cada check-in y sugiere ±100–150 kcal según el objetivo y la adherencia.

> Esta herramienta es un apoyo para tu trabajo como entrenador y no reemplaza la evaluación de un médico o nutricionista matriculado, sobre todo ante condiciones de salud.

---

## 8. Estructura de archivos

```
index.html             página única de la app
manifest.webmanifest   datos para instalarla en Android/PC
sw.js                  funcionamiento sin internet
css/styles.css         diseño (modo claro y oscuro automático)
js/foods.js            base de alimentos (por 100 g)
js/content.js          comidas modelo, guía para comer afuera, alertas
js/engine.js           cálculos nutricionales y generador de planes
js/store.js            guardado local, links y respaldos
js/ui.js               componentes visuales
js/client.js           app del alumno
js/form.js             formulario inicial
js/coach.js            panel del entrenador
js/app.js              arranque y navegación
icons/                 íconos de la app
```
