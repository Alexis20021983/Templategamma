import React, { useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import { Download, FileText, ImagePlus, Plus, RotateCcw, Trash2 } from "lucide-react";
import { AlignmentType, Document, HeadingLevel, ImageRun, Packer, Paragraph, TextRun } from "docx";
import "./index.css";
import "./App.css";

const initialStep = () => ({
  title: "",
  action: "",
  expected: "",
  result: "",
  images: [],
});

const initialTemplate = {
  title: "",
  description: "",
  requirement: "",
  objective: "",
  preconditions: "",
  testData: "",
  owner: "",
  tester: "",
  steps: [initialStep()],
};

const initialTripLog = {
  title: "Bitácora de viaje",
  destination: "",
  salesforceCases: "",
  travelDate: "",
  fuelReceiptDate: "",
  fuelStation: "",
  fuelReceiptNumber: "",
  fuelType: "",
  fuelLiters: "",
  fuelAmount: "",
  fuelReceiptImages: [],
};

function App() {
  const [templateType, setTemplateType] = useState("qa");
  const [qaTemplate, setQaTemplate] = useState(initialTemplate);
  const [tripLog, setTripLog] = useState(initialTripLog);
  const [downloading, setDownloading] = useState(false);

  const template = templateType === "qa" ? qaTemplate : tripLog;
  const setTemplate = (updater) => {
    const setCurrent = templateType === "qa" ? setQaTemplate : setTripLog;
    setCurrent(updater);
  };
  const update = (field, value) =>
    setTemplate((current) => ({ ...current, [field]: value }));

  const updateStep = (index, field, value) =>
    setTemplate((current) => ({
      ...current,
      steps: current.steps.map((step, stepIndex) =>
        stepIndex === index ? { ...step, [field]: value } : step,
      ),
    }));

  const addStep = () =>
    setTemplate((current) => ({ ...current, steps: [...current.steps, initialStep()] }));

  const removeStep = (index) =>
    setTemplate((current) => ({
      ...current,
      steps:
        current.steps.length === 1
          ? [initialStep()]
          : current.steps.filter((_, stepIndex) => stepIndex !== index),
    }));

  const reset = () => setTemplate(templateType === "qa" ? initialTemplate : initialTripLog);

  const markdown = useMemo(
    () => templateType === "qa" ? buildMarkdown(template) : buildTripLogMarkdown(template),
    [template, templateType],
  );

  const addImages = (index, files) => {
    Array.from(files).filter((file) => file.type.startsWith("image/")).forEach((file) => {
      const reader = new FileReader();
      reader.onload = () => setTemplate((current) => ({
        ...current,
        steps: current.steps.map((step, stepIndex) => stepIndex === index
          ? { ...step, images: [...(step.images || []), { name: file.name, dataUrl: reader.result }] }
          : step),
      }));
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (stepIndex, imageIndex) => setTemplate((current) => ({
    ...current,
    steps: current.steps.map((step, index) => index === stepIndex
      ? { ...step, images: step.images.filter((_, itemIndex) => itemIndex !== imageIndex) }
      : step),
  }));

  const addReceiptImages = (files) => {
    Array.from(files).filter((file) => file.type.startsWith("image/")).forEach((file) => {
      const reader = new FileReader();
      reader.onload = () => setTripLog((current) => ({
        ...current,
        fuelReceiptImages: [
          ...current.fuelReceiptImages,
          { name: file.name, dataUrl: reader.result },
        ],
      }));
      reader.readAsDataURL(file);
    });
  };

  const removeReceiptImage = (imageIndex) => setTripLog((current) => ({
    ...current,
    fuelReceiptImages: current.fuelReceiptImages.filter((_, index) => index !== imageIndex),
  }));

  const download = (content, filename, type) => {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  };

  const downloadWord = async () => {
    setDownloading(true);
    try {
      const doc = templateType === "qa"
        ? await buildWordDocument(template)
        : await buildTripLogWordDocument(template);
      const blob = await Packer.toBlob(doc);
      const url = URL.createObjectURL(blob);
      const link = window.document.createElement("a");
      link.href = url;
      link.download = templateType === "qa" ? "template-qa.docx" : "bitacora-de-viaje.docx";
      link.click();
      URL.revokeObjectURL(url);
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="app-shell">
      <header className="hero">
        <div>
          <span className="eyebrow">PLANTILLAS · LOCAL</span>
          <h1>Generador de templates</h1>
          <p>Completa una plantilla de caso de prueba o registra los datos de tu viaje.</p>
        </div>
        <FileText size={42} strokeWidth={1.5} />
      </header>

      <main className="workspace">
        <section className="panel editor-panel">
          <div className="template-picker" role="group" aria-label="Elegir template">
            <button
              className={`template-option ${templateType === "qa" ? "template-option-active" : ""}`}
              type="button"
              aria-pressed={templateType === "qa"}
              onClick={() => setTemplateType("qa")}
            >
              Caso de prueba
            </button>
            <button
              className={`template-option ${templateType === "trip" ? "template-option-active" : ""}`}
              type="button"
              aria-pressed={templateType === "trip"}
              onClick={() => setTemplateType("trip")}
            >
              Bitácora de viaje
            </button>
          </div>
          <div className="panel-heading">
            <div>
              <span className="section-label">01 · Contenido</span>
              <h2>{templateType === "qa" ? "Define tu caso de prueba" : "Registra tu viaje"}</h2>
            </div>
            <button className="button button-ghost" onClick={reset} type="button">
              <RotateCcw size={16} /> Limpiar
            </button>
          </div>

          {templateType === "qa" ? <div className="field-grid">
            <Field label="Título del caso" wide value={template.title} onChange={(value) => update("title", value)} placeholder="Ej. Inicio de sesión válido" />
            <Field label="Descripción" wide multiline value={template.description} onChange={(value) => update("description", value)} placeholder="Describe brevemente qué valida este caso..." />
            <Field label="Requisito" multiline value={template.requirement} onChange={(value) => update("requirement", value)} placeholder="REQ-001..." />
            <Field label="Objetivo" multiline value={template.objective} onChange={(value) => update("objective", value)} placeholder="Qué debe comprobarse" />
            <Field label="Precondiciones" multiline value={template.preconditions} onChange={(value) => update("preconditions", value)} placeholder="Configuración necesaria antes de ejecutar" />
            <Field label="Datos de prueba" multiline value={template.testData} onChange={(value) => update("testData", value)} placeholder="Usuarios, valores o archivos necesarios" />
            <Field label="Responsable" value={template.owner} onChange={(value) => update("owner", value)} placeholder="Equipo o persona" />
            <Field label="Tester" value={template.tester} onChange={(value) => update("tester", value)} placeholder="Nombre del tester" />
          </div> : <>
            <div className="field-grid">
              <Field label="Título" wide value={tripLog.title} onChange={(value) => update("title", value)} placeholder="Bitácora de viaje" />
              <Field label="Destino" value={tripLog.destination} onChange={(value) => update("destination", value)} placeholder="Ciudad o lugar" />
              <Field label="Fecha del viaje" type="date" value={tripLog.travelDate} onChange={(value) => update("travelDate", value)} />
              <Field label="Casos de Salesforce" wide multiline value={tripLog.salesforceCases} onChange={(value) => update("salesforceCases", value)} placeholder="Números o detalles de los casos relacionados" />
            </div>
            <div className="steps-heading">
              <div>
                <span className="section-label">02 · Comprobante</span>
                <h2>Datos de combustible</h2>
              </div>
            </div>
            <div className="field-grid">
              <Field label="Fecha del comprobante" type="date" value={tripLog.fuelReceiptDate} onChange={(value) => update("fuelReceiptDate", value)} />
              <Field label="Estación de servicio" value={tripLog.fuelStation} onChange={(value) => update("fuelStation", value)} placeholder="Nombre de la estación" />
              <Field label="Número de comprobante" value={tripLog.fuelReceiptNumber} onChange={(value) => update("fuelReceiptNumber", value)} placeholder="Número o código" />
              <Field label="Tipo de combustible" value={tripLog.fuelType} onChange={(value) => update("fuelType", value)} placeholder="Nafta, diésel..." />
              <Field label="Litros" type="number" value={tripLog.fuelLiters} onChange={(value) => update("fuelLiters", value)} placeholder="0" />
              <Field label="Importe" type="number" value={tripLog.fuelAmount} onChange={(value) => update("fuelAmount", value)} placeholder="0,00" />
              <label className="image-picker field-wide">
                <span><ImagePlus size={16} /> Cargar imagen del comprobante</span>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={(event) => {
                    addReceiptImages(event.target.files);
                    event.target.value = "";
                  }}
                />
              </label>
              {tripLog.fuelReceiptImages.length > 0 && (
                <div className="image-list field-wide">
                  {tripLog.fuelReceiptImages.map((image, index) => (
                    <div className="image-item" key={`${image.name}-${index}`}>
                      <img src={image.dataUrl} alt={image.name} />
                      <span>{image.name}</span>
                      <button type="button" onClick={() => removeReceiptImage(index)} aria-label={`Eliminar ${image.name}`}>
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>}

          {templateType === "qa" && <>
            <div className="steps-heading">
              <div>
                <span className="section-label">02 · Ejecución</span>
                <h2>Pasos de prueba</h2>
              </div>
              <button className="button button-secondary" onClick={addStep} type="button">
                <Plus size={16} /> Agregar paso
              </button>
            </div>

            <div className="steps-list">
              {template.steps.map((step, index) => (
                <article className="step-card" key={index}>
                  <div className="step-number">{String(index + 1).padStart(2, "0")}</div>
                  <div className="step-fields">
                    <Field label="Nombre del paso" value={step.title} onChange={(value) => updateStep(index, "title", value)} placeholder="Ej. Abrir la pantalla de acceso" />
                    <Field label="Acción" multiline value={step.action} onChange={(value) => updateStep(index, "action", value)} placeholder="Qué debe hacer el tester" />
                    <Field label="Resultado esperado" multiline value={step.expected} onChange={(value) => updateStep(index, "expected", value)} placeholder="Qué debería ocurrir" />
                    <Field label="Resultado obtenido" multiline value={step.result} onChange={(value) => updateStep(index, "result", value)} placeholder="Completar durante la ejecución" />
                    <label className="image-picker">
                      <span><ImagePlus size={16} /> Agregar imágenes</span>
                      <input type="file" accept="image/*" multiple onChange={(event) => addImages(index, event.target.files)} />
                    </label>
                    {step.images?.length > 0 && <div className="image-list">{step.images.map((image, imageIndex) => (
                      <div className="image-item" key={`${image.name}-${imageIndex}`}>
                        <img src={image.dataUrl} alt={image.name} />
                        <span>{image.name}</span>
                        <button type="button" onClick={() => removeImage(index, imageIndex)} aria-label={`Eliminar ${image.name}`}><Trash2 size={14} /></button>
                      </div>
                    ))}</div>}
                  </div>
                  <button className="icon-button" onClick={() => removeStep(index)} type="button" aria-label={`Eliminar paso ${index + 1}`}>
                    <Trash2 size={17} />
                  </button>
                </article>
              ))}
            </div>
          </>}
        </section>

        <section className="panel preview-panel">
          <div className="panel-heading">
            <div>
              <span className="section-label">03 · Resultado</span>
              <h2>Vista previa</h2>
            </div>
            <div className="download-actions">
              <button className="button button-primary" onClick={downloadWord} disabled={downloading} type="button">
                <Download size={16} /> {downloading ? "Generando..." : "Word (.docx)"}
              </button>
              <button className="button button-secondary" onClick={() => download(markdown, templateType === "qa" ? "template-qa.md" : "bitacora-de-viaje.md", "text/markdown")} type="button">
                <Download size={16} /> Markdown
              </button>
              <button className="button button-primary" onClick={() => download(JSON.stringify(template, null, 2), templateType === "qa" ? "template-qa.json" : "bitacora-de-viaje.json", "application/json")} type="button">
                <Download size={16} /> JSON
              </button>
            </div>
          </div>
          <div className="preview">
            <pre>{markdown}</pre>
          </div>
          <p className="local-note">Todo se procesa en tu navegador. No se guardan datos en una base de datos.</p>
        </section>
      </main>
      <footer className="site-footer">Autor: Alexis Afonso | Ayudante Tecnico La Pampa</footer>
    </div>
  );
}

function Field({ label, value, onChange, placeholder, type = "text", multiline = false, wide = false }) {
  const commonProps = {
    value,
    onChange: (event) => onChange(event.target.value),
    placeholder,
  };
  return (
    <label className={`field ${wide ? "field-wide" : ""}`}>
      <span>{label}</span>
      {multiline ? <textarea {...commonProps} rows={3} /> : <input {...commonProps} type={type} />}
    </label>
  );
}

function buildMarkdown(data) {
  const value = (text) => text?.trim() || "Pendiente de completar";
  const steps = data.steps
    .map(
      (step, index) =>
        `### ${index + 1}. ${value(step.title)}\n\n**Acción**\n${value(step.action)}\n\n**Resultado esperado**\n${value(step.expected)}\n\n**Resultado obtenido**\n${value(step.result)}\n\n**Imágenes**\n${step.images?.map((image) => `- ${image.name}`).join("\n") || "Sin imágenes"}`,
    )
    .join("\n\n");

  return `# ${value(data.title)}

## Descripción
${value(data.description)}

| Campo | Detalle |
| --- | --- |
| Requisito | ${value(data.requirement)} |
| Objetivo | ${value(data.objective)} |
| Precondiciones | ${value(data.preconditions)} |
| Datos de prueba | ${value(data.testData)} |
| Responsable | ${value(data.owner)} |
| Tester | ${value(data.tester)} |

## Pasos de prueba

${steps}
`;
}

function buildTripLogMarkdown(data) {
  const value = (text) => text?.trim() || "Pendiente de completar";
  const receiptImages = data.fuelReceiptImages
    .map((image) => `- ${image.name}`)
    .join("\n") || "Sin imágenes cargadas";

  return `# ${value(data.title)}

## Datos del viaje

| Campo | Detalle |
| --- | --- |
| Destino | ${value(data.destination)} |
| Fecha del viaje | ${value(data.travelDate)} |
| Casos de Salesforce | ${value(data.salesforceCases)} |

## Comprobante de combustible

| Campo | Detalle |
| --- | --- |
| Fecha | ${value(data.fuelReceiptDate)} |
| Estación de servicio | ${value(data.fuelStation)} |
| Número de comprobante | ${value(data.fuelReceiptNumber)} |
| Tipo de combustible | ${value(data.fuelType)} |
| Litros | ${value(data.fuelLiters)} |
| Importe | ${value(data.fuelAmount)} |

### Imágenes del comprobante
${receiptImages}
`;
}

function dataUrlToBytes(dataUrl) {
  const binary = window.atob(dataUrl.split(",")[1]);
  return Uint8Array.from(binary, (character) => character.charCodeAt(0));
}

function wordImageType(dataUrl) {
  const type = dataUrl.match(/^data:image\/([^;]+)/)?.[1] || "png";
  return type === "jpeg" ? "jpg" : type;
}

function nonEmpty(value) {
  return typeof value === "string" && value.trim().length > 0;
}

function wordText(label, value) {
  if (!nonEmpty(value)) return null;
  return new Paragraph({
    children: [
      new TextRun({ text: `${label}: `, bold: true }),
      new TextRun({ text: value.trim() }),
    ],
    spacing: { after: 140 },
  });
}

function getImageSize(dataUrl) {
  return new Promise((resolve) => {
    const image = new window.Image();
    image.onload = () => {
      const maxWidth = 600;
      const maxHeight = 700;
      const scale = Math.min(1, maxWidth / image.naturalWidth, maxHeight / image.naturalHeight);
      resolve({
        width: Math.max(1, Math.round(image.naturalWidth * scale)),
        height: Math.max(1, Math.round(image.naturalHeight * scale)),
      });
    };
    image.onerror = () => resolve({ width: 600, height: 400 });
    image.src = dataUrl;
  });
}

async function buildWordDocument(data) {
  const children = [];
  if (nonEmpty(data.title)) {
    children.push(new Paragraph({
      text: data.title.trim(),
      heading: HeadingLevel.TITLE,
      alignment: AlignmentType.CENTER,
      spacing: { after: 180 },
    }));
  }

  const contentParagraphs = [
    wordText("Descripción", data.description),
    wordText("Requisito", data.requirement),
    wordText("Objetivo", data.objective),
    wordText("Precondiciones", data.preconditions),
    wordText("Datos de prueba", data.testData),
    wordText("Responsable", data.owner),
    wordText("Tester", data.tester),
  ].filter(Boolean);
  if (contentParagraphs.length > 0) {
    children.push(new Paragraph({
      children: [new TextRun({ text: "DATOS DEL CASO", bold: true, size: 28 })],
      spacing: { before: 160, after: 180 },
    }));
    children.push(...contentParagraphs);
  }

  const steps = data.steps.filter((step) =>
    nonEmpty(step.title) || nonEmpty(step.action) || nonEmpty(step.expected) ||
    nonEmpty(step.result) || step.images?.length > 0,
  );
  if (steps.length > 0) {
    children.push(new Paragraph({
      text: "Ejecución",
      heading: HeadingLevel.HEADING_1,
      spacing: { before: 300, after: 140 },
    }));
    children.push(new Paragraph({
      text: "Pasos de prueba",
      heading: HeadingLevel.HEADING_2,
      spacing: { after: 140 },
    }));
  }
  for (const [index, step] of steps.entries()) {
    children.push(new Paragraph({
      text: `${index + 1}. ${nonEmpty(step.title) ? step.title.trim() : "Paso"}`,
      heading: HeadingLevel.HEADING_2,
    }));
    [wordText("Acción", step.action), wordText("Resultado esperado", step.expected), wordText("Resultado obtenido", step.result)]
      .filter(Boolean)
      .forEach((paragraph) => children.push(paragraph));
    for (const image of step.images || []) {
      const size = await getImageSize(image.dataUrl);
      children.push(
        new Paragraph({ text: `Evidencia: ${image.name}`, spacing: { before: 100, after: 80 } }),
        new Paragraph({
          children: [new ImageRun({
            data: dataUrlToBytes(image.dataUrl),
            transformation: size,
            type: wordImageType(image.dataUrl),
          })],
          alignment: AlignmentType.CENTER,
        }),
      );
    }
  }
  return new Document({ sections: [{ children }] });
}

async function buildTripLogWordDocument(data) {
  const children = [
    new Paragraph({
      text: nonEmpty(data.title) ? data.title.trim() : "Bitácora de viaje",
      heading: HeadingLevel.TITLE,
      alignment: AlignmentType.CENTER,
      spacing: { after: 240 },
    }),
    new Paragraph({
      text: "DATOS DEL VIAJE",
      heading: HeadingLevel.HEADING_1,
      spacing: { after: 160 },
    }),
    ...[
      wordText("Destino", data.destination),
      wordText("Fecha del viaje", data.travelDate),
      wordText("Casos de Salesforce", data.salesforceCases),
    ].filter(Boolean),
    new Paragraph({
      text: "COMPROBANTE DE COMBUSTIBLE",
      heading: HeadingLevel.HEADING_1,
      spacing: { before: 240, after: 160 },
    }),
    ...[
      wordText("Fecha", data.fuelReceiptDate),
      wordText("Estación de servicio", data.fuelStation),
      wordText("Número de comprobante", data.fuelReceiptNumber),
      wordText("Tipo de combustible", data.fuelType),
      wordText("Litros", data.fuelLiters),
      wordText("Importe", data.fuelAmount),
    ].filter(Boolean),
  ];

  for (const image of data.fuelReceiptImages) {
    const size = await getImageSize(image.dataUrl);
    children.push(
      new Paragraph({ text: `Comprobante: ${image.name}`, spacing: { before: 120, after: 80 } }),
      new Paragraph({
        children: [new ImageRun({
          data: dataUrlToBytes(image.dataUrl),
          transformation: size,
          type: wordImageType(image.dataUrl),
        })],
        alignment: AlignmentType.CENTER,
      }),
    );
  }

  return new Document({ sections: [{ children }] });
}

createRoot(document.getElementById("root")).render(<App />);
