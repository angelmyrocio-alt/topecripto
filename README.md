# Topecripto — web

Reality check de predicciones cripto. Web hecha con Vite + React, con precios en vivo de CoinGecko a través de una función de servidor (la clave nunca se expone al navegador).

## Qué hay dentro
- `src/App.jsx` — toda la app: Diagnóstico, juego de los Ceros, «Quién prometió qué» y la pestaña Pro (Detector de tablas, solo con clave de acceso).
- `src/promesas.js` — los casos de «Quién prometió qué». Para añadir uno: copia un bloque y haz push.
- `api/prices.js` — precios en vivo de CoinGecko con la clave oculta en el servidor.
- `api/track.js` y `api/stats.js` — contador anónimo de clics (Upstash) y su página privada `/api/stats?key=…`.
- `api/keys.js` y `api/redeem.js` — claves de acceso de 7 días: se generan en `/api/keys?key=…` y se validan en el servidor.
- `scripts/prerender.mjs` — tras el build, crea una página HTML por promesa, el sitemap y el robots.txt (para Google y para las vistas previas al compartir).
- `scripts/og-imagenes.mjs` — genera a mano las imágenes al compartir de cada promesa (`public/og/`).
- `public/` — iconos, favicon, manifest e imágenes al compartir.

---

## Cómo publicarla (paso a paso)

### 1. Subir a GitHub
- Crea un repositorio nuevo en tu cuenta de GitHub (por ejemplo `topecripto`).
- Sube todos estos archivos al repositorio (con la web de GitHub, "Add file → Upload files", o con GitHub Desktop).

### 2. Importar en Vercel
- En vercel.com → "Add New… → Project".
- Elige el repositorio `topecripto` de tu GitHub.
- Vercel detecta solo que es un proyecto **Vite**. No cambies nada.

### 3. Poner la clave de CoinGecko (IMPORTANTE)
Antes de darle a "Deploy", en la sección **Environment Variables** añade:
- **Name:** `COINGECKO_API_KEY`
- **Value:** tu clave de CoinGecko (la que generaste).

Esto mantiene la clave en el servidor, oculta. Sin esto, la web funciona igual pero con datos de muestra en vez de en vivo.

### 4. Deploy
- Dale a **"Deploy"**. En un par de minutos estará online en una dirección tipo `topecripto.vercel.app`.

### 5. Conectar tu dominio
- En el proyecto → **Settings → Domains** → añade `topecripto.com`.
- Vercel te dirá qué poner en la configuración DNS de tu dominio (donde lo compraste). Sigue sus instrucciones (suele ser cambiar los "nameservers" o añadir un registro).

---

## Notas
- **Datos:** los precios y el supply vienen en vivo de CoinGecko y se refrescan cada minuto. Si fallan, la web usa precios de reserva y lo indica en el pie.
- **Caché:** la función cachea 60 s, así que aunque entre mucha gente solo se llama a CoinGecko una vez por minuto (no se agota el plan gratis).
- **Probar en local:** `npm install` y luego `npm run dev`. En local los datos salen de muestra (la función de servidor solo corre en Vercel); en producción salen en vivo.
- **No es asesoramiento de inversión.** La app calcula aritmética de capitalización, no predice precios.
