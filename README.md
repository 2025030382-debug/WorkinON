# WorkinON — versión estática (HTML + CSS + JS)



 La app funciona al 100% sin backend:
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

"# WorkinON" 
