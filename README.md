# Generador de templates

Aplicación estática para crear templates de casos de prueba y bitácoras de
viaje, sin servidor ni base de datos. Elige el tipo de template y completa sus
datos para obtener una vista previa en tiempo real.

## Uso local

```powershell
cd frontend
npm install
npm run dev
```

La aplicación procesa todo en el navegador. Permite descargar el template
seleccionado como Word, Markdown o JSON. En los casos de prueba puedes adjuntar
imágenes a cada paso; en la bitácora puedes cargar imágenes de los comprobantes
de combustible y seleccionar varias localidades pampeanas para armar el
recorrido. Las imágenes se incrustan en los archivos Word. Ningún dato se envía
ni se guarda en una base de datos.

## Despliegue

`render.yaml` configura un único sitio estático en Render. El proyecto no
requiere API, variables de entorno, almacenamiento persistente ni servicios de
base de datos.
