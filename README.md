# QA Template Generator

QA Template Generator es una página estática para crear templates de casos de
prueba sin servidor ni base de datos. Completa los datos generales y los pasos
de ejecución para obtener una vista previa en tiempo real.

## Uso local

```powershell
cd frontend
npm install
npm run dev
```

La aplicación procesa todo en el navegador. Permite descargar el template
generado como Word (`template-qa.docx`), Markdown (`template-qa.md`) o JSON
(`template-qa.json`). También puedes adjuntar una o varias imágenes a cada paso;
las imágenes se incrustan en el archivo Word. Ningún dato se envía ni se guarda
en una base de datos.

## Despliegue

`render.yaml` configura un único sitio estático en Render. El proyecto no
requiere API, variables de entorno, almacenamiento persistente ni servicios de
base de datos.
