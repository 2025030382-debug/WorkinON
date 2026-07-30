# WorkinON — versión estática (HTML + CSS + JS)

Esta carpeta es una versión de WorkinON que **no necesita servidor**.
Sirve para publicarla en Vercel (o Netlify, GitHub Pages, etc.), que no
pueden correr el backend de Java + Spring Boot + MySQL.

## ¿Qué cambió respecto a la versión con Java?

Toda la lógica que antes vivía en el backend (Spring Boot) ahora vive
en el navegador, dentro de `js/db.js`. Ese archivo simula una base de
datos usando `localStorage`, y expone las mismas "rutas" que antes
atendía el servidor (`/auth/login`, `/proyectos`, `/solicitudes`,
`/medallas`, etc.). Gracias a eso, `js/script.js` (toda la lógica de
pantallas: login, buscar proyectos, solicitudes, medallas,
evaluaciones, reportes...) **no tuvo que cambiar casi nada**, solo la
forma en que se conecta con los datos.

Esto significa que la app funciona al 100% sin backend:
- Crear cuenta / iniciar sesión (contraseñas guardadas en tu navegador,
  no con hash real como en la versión con Spring Security — ver nota
  de seguridad abajo).
- Publicar proyectos, con categorías y habilidades reales.
- Solicitar unirte a un proyecto, aceptar/rechazar solicitantes.
- Ver el equipo de un proyecto (solo si eres el dueño o ya te aceptaron).
- Ganar medallas y verlas en tu perfil.
- Crear evaluaciones para candidatos aceptados.
- Enviar reportes.
- Editar tu perfil (nombre, descripción, foto).
- Recuperar contraseña (cambia de verdad la contraseña guardada).
- La sesión se recuerda al recargar la página (usando `localStorage`).

Incluye una cuenta de ejemplo ya cargada con 4 proyectos de muestra:

```
correo:      demo@workinon.com
contraseña:  demo1234
```

## ⚠️ Importante: esto NO es una base de datos compartida

`localStorage` es **local a cada navegador/dispositivo**. Eso quiere
decir que:
- Los datos que tú registres en tu computadora no los va a ver otra
  persona que entre desde su propio celular o computadora.
- Si borras el caché/datos del sitio en el navegador, se pierde todo.
- No hay contraseñas con hash real (bcrypt) como sí tenía el backend
  de Java — aquí se guardan tal cual dentro de tu navegador. Está bien
  para una demo o entrega escolar, pero no seria válido para producción real.

Si más adelante quieres una base de datos real compartida entre
usuarios, se necesitaría volver a un backend con servidor (por ejemplo
desplegando el proyecto `workinon-backend` en Render/Railway y
apuntando el frontend a esa URL), que es justamente lo que tenías
antes.

## Cómo publicar en Vercel

**Opción A — desde la web de Vercel:**
1. Sube esta carpeta (`workinon`) a un repositorio de GitHub.
2. En vercel.com → "Add New Project" → importa el repositorio.
3. Framework Preset: "Other" (sitio estático). No hay que configurar
   build command ni output directory, Vercel detecta `index.html`.
4. Deploy.

**Opción B — desde la terminal:**
```bash
npm i -g vercel
cd workinon
vercel
```

## Estructura

```
index.html          Toda la interfaz (pantallas de login, home, buscar, etc.)
css/styles.css       Estilos (sin cambios respecto al original)
js/db.js             "Backend" local en localStorage (NUEVO)
js/script.js         Lógica de pantallas (casi sin cambios, ahora usa js/db.js)
assets/logo.png       Logo
vercel.json           Configuración mínima para Vercel
```
"# WorkinON" 
