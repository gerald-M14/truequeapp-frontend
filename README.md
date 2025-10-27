```markdown
# 🛍️ TruequeApp

**TruequeApp** es una plataforma web de intercambio de productos entre usuarios.  
Permite publicar, descubrir y **truequear** artículos con chat en tiempo real, perfiles de usuario y estados de publicación.

---

## 📖 Descripción

- Publica productos con fotos, estado, condición y precio estimado (referencial).
- Descubre por **categorías** y tarjetas estilo marketplace.
- Propón un **trueque** y conversa por chat en tiempo real (Supabase).
- Marca trueques como **completados** y registra el historial.
- Perfiles con estadísticas: trueques, rating, productos activos.

---

## 🧩 Arquitectura

- **Frontend:** React + Vite + TailwindCSS + Lucide Icons
- **Auth:** Auth0 (useAuth0)
- **Realtime:** Supabase (channels + postgres_changes)
- **Backend:** API Routes en Vercel (Node.js)
- **Base de datos:** MySQL (Clever Cloud)

---

## 🗂️ Estructura del repositorio (actual)

```

TRUEQUEAPPOFICIAL/
├── public/
├── src/
│   ├── assets/
│   ├── components/
│   │   ├── presentacion/
│   │   │   ├── CallToAction.jsx
│   │   │   ├── CircularEconomyCard.jsx
│   │   │   ├── CommunityImpact.jsx
│   │   │   ├── Footer.jsx
│   │   │   ├── Header.jsx
│   │   │   ├── Hero.jsx
│   │   │   ├── HowItWorks.jsx
│   │   │   ├── ImpactList.jsx
│   │   │   ├── PopularCategories.jsx
│   │   │   ├── Stats.jsx
│   │   │   ├── SuggestedSwapCard.jsx
│   │   │   └── WhyChoose.jsx
│   │   ├── productos/
│   │   │   ├── DetalleProducto.jsx        # Vista detalle (ProductoDetalle)
│   │   │   ├── header_profile.jsx         # Icono/bandeja de conversaciones (popover)
│   │   │   ├── ListaProductos.jsx
│   │   │   ├── ListarCategorias.jsx
│   │   │   ├── GoogleButton.jsx
│   │   │   ├── login.jsx
│   │   │   ├── logout.jsx
│   │   │   ├── profile.jsx
│   │   │   └── SignupButton.jsx
│   ├── lib/
│   │   └── supabase.js                    # Cliente Supabase
│   ├── pages/
│   │   ├── ChatRoom.jsx                   # Chat realtime + botón “Trueque completado”
│   │   ├── HomePage.jsx
│   │   ├── MisChats.jsx                   # Listado de conversaciones
│   │   ├── PerfilEditar.jsx
│   │   ├── PerfilUsuario.jsx              # Perfil público con métricas
│   │   ├── ProductoEditar.jsx
│   │   └── Publicar.jsx                   # Crear publicación
│   ├── App.css
│   ├── App.jsx
│   ├── index.css
│   └── main.jsx
│
├── .env
├── index.html
├── package.json
├── vite.config.js
└── README.md

````

> El backend/API vive en un proyecto Vercel aparte (por límite de rutas), con estructura `api/`:
>
> ```
> truequeapp-api-vercel/
> └── api/
>     ├── categorias/index.js
>     ├── productos/index.js
>     ├── productos/[id].js
>     ├── provincias/index.js
>     ├── usuarios/[id]/detalles.js
>     ├── usuarios/[id]/perfil.js
>     ├── usuarios/[id]/productos.js
>     ├── usuarios/find.js
>     ├── _cors.js
>     ├── _db.js
>     ├── health.js
>     └── user-sync.js
> ```

---

## ⚙️ Instalación (local)

```bash
# 1) instalar
npm install

# 2) variables de entorno
cp .env.example .env
# edita con tus valores:
# VITE_API_BASE=https://truequeapp-api-vercel.vercel.app
# VITE_AUTH0_DOMAIN=tu-dominio.auth0.com
# VITE_AUTH0_CLIENT_ID=xxxxxxxxxxxxxxxx
# VITE_SUPABASE_URL=https://xxxx.supabase.co
# VITE_SUPABASE_ANON_KEY=eyJhbGci...

# 3) correr
npm run dev
````

---

## 🔐 Autenticación

* `useAuth0()` para login/logout y proteger rutas.
* El backend espera `x-user-email` en algunas rutas **(creación de productos, etc.)**.

---

## 💬 Chat + Trueques

* Tabla `conversations` (Supabase) con `participants` (emails), `product_id`, `last_message`, `last_message_at`.
* Tabla `messages` (Supabase) con `conversation_id`, `sender_email`, `body`, `created_at`.
* **ChatRoom.jsx**: escucha realtime (`postgres_changes`) y formatea por día; soporta Enter/Shift+Enter.

### Botón “Trueque Completado”

* En **ChatRoom.jsx** agregaste la acción que:

  1. Inserta historial de evento en `messages`.
  2. Actualiza `conversations.last_message`/**last_message_at**.
  3. Llama a `POST /api/usuarios/:id/trueques+1` (o variante `PATCH`) para **sumar** el contador de ambos usuarios.
  4. Opcional: `PATCH /api/productos/:id` → `estado_publicacion="intercambiada"` para ocultarlo de listados.

---

## 🗄️ Tablas relevantes (MySQL)

* `usuarios`: `id_usuario`, `email`, `nombre_completo`, `avatar_url`, `trueques_realizados`, `rating_promedio`, `nivel_confianza`, …
* `productos`: `id_producto`, `id_usuario`, `titulo`, `descripcion`, `estado_producto`, `condicion`, `precio_estimado`, `estado_publicacion`, `fecha_publicacion`
* `categorias`: catálogo
* `producto_categoria`: relación N:M
* **(intercambios opcional):** `intercambios`, `historial_intercambios`, `intercambio_items`, `tokens_intercambio`

**Filtro de listados:** en el front ya se omiten productos del propio usuario **y** productos con `estado_publicacion = 'intercambiada'`.

---

## 🔗 Endpoints API (Vercel)

* `GET /api/categorias` — lista categorías
* `GET /api/productos` — lista productos (query `?categoria=...`)
* `GET /api/productos/:id` — detalle
* `POST /api/productos` — crear (requiere `x-user-email`)
* `GET /api/usuarios/find?email=...` — busca usuario por email
* `GET /api/usuarios/:id/perfil` — perfil agregado (trueques, rating, verificado, etc.)
* `GET /api/usuarios/:id/productos` — productos de un usuario
* *(plus)* `PATCH /api/usuarios/:id/trueques` — **incrementa trueques_realizados** (cuando marcas trueque completado)
* *(plus)* `PATCH /api/productos/:id` — actualizar `estado_publicacion` a `intercambiada`


---

## 🎨 UI/UX

* **Tailwind** con una paleta teal/emerald/cyan suave.
* Tarjetas compactas estilo marketplace (`ListaProductos.jsx`) con animaciones y “chip” de categoría.
* Selects/segmentados y **dropzone** para imágenes en `Publicar.jsx`.

---

## 🧰 Scripts

```json
{
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  }
}
```



## 🤝 Créditos

* Frontend: React + Vite + Tailwind
* Backend: Vercel Functions (Node)
* Realtime: Supabase
* DB: MySQL (Clever Cloud)
* Auth: Auth0

**Contacto:** [geraldhymessu7@gmail.com](mailto:geraldhymessu7@gmail.com)

---


