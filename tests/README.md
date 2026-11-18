# `tests/` — pruebas organizadas por nivel

Todo lo que es prueba vive acá. `src/` queda solo con código de producción.
Misma convención que el repositorio del backend, para que no tengas que
aprender dos.

```
tests/
└── e2e/            pruebas end-to-end por la interfaz (Playwright)
```

## Por qué acá solo hay un nivel

Este repositorio es la interfaz. Los niveles de abajo —unitaria, componente,
integración— se verifican contra el **backend**, y viven en su repositorio:

```
retail-demo-backend-alumnos/tests/
├── unitarias/      ✅ 108 incluidas
├── componentes/    ✍️
└── integracion/    ✍️
```

Si más adelante agregas pruebas de componente de React (Playwright y Cypress
las soportan), su lugar natural sería `tests/componentes/` acá mismo.

## Cómo correrlas

```bash
# terminal 1 · en el repositorio del backend
npm run dev                        # la API en el 4000

# terminal 2 · acá
npm install
npx playwright install chromium    # solo la primera vez
npm run test:e2e
npm run test:e2e:ui                # modo interactivo
```

El frontend lo levanta Playwright solo. Si el backend no está arriba, la primera
prueba falla con un mensaje explícito en vez de un error críptico.

## El contenido

`e2e/demo-clase11/` son los ejemplos que se leen en clase, y su estructura **es**
la arquitectura en capas: `datos/` es la capa 2, `paginas/` la 3, los `.spec.js`
la 5, y `playwright.config.js` la 1 y la 6.

La capa 4 (acciones de negocio) todavía no existe, y el README de esa carpeta
explica por qué: aparece cuando un flujo cruza varias pantallas, no antes.

Está explicado en `e2e/demo-clase11/README.md`.
