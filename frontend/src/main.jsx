import React, { useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import { Download, FileText, ImagePlus, Plus, RotateCcw, Trash2 } from "lucide-react";
import { AlignmentType, Document, HeadingLevel, ImageRun, Packer, Paragraph, Table, TableCell, TableRow, TextRun } from "docx";
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

function App() {
  const [template, setTemplate] = useState(initialTemplate);
  const [downloading, setDownloading] = useState(false);

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

  const reset = () => setTemplate(initialTemplate);

  const markdown = useMemo(() => buildMarkdown(template), [template]);

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
      const doc = buildWordDocument(template);
      const blob = await Packer.toBlob(doc);
      const url = URL.createObjectURL(blob);
      const link = window.document.createElement("a");
      link.href = url;
      link.download = "template-qa.docx";
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
          <span className="eyebrow">QA TOOLKIT · LOCAL</span>
          <h1>Template Generator</h1>
          <p>Diseña un caso de prueba completo y descarga una plantilla lista para compartir.</p>
        </div>
        <FileText size={42} strokeWidth={1.5} />
      </header>

      <main className="workspace">
        <section className="panel editor-panel">
          <div className="panel-heading">
            <div>
              <span className="section-label">01 · Contenido</span>
              <h2>Define tu template</h2>
            </div>
            <button className="button button-ghost" onClick={reset} type="button">
              <RotateCcw size={16} /> Limpiar
            </button>
          </div>

          <div className="field-grid">
            <Field label="Título del caso" wide value={template.title} onChange={(value) => update("title", value)} placeholder="Ej. Inicio de sesión válido" />
            <Field label="Descripción" wide multiline value={template.description} onChange={(value) => update("description", value)} placeholder="Describe brevemente qué valida este caso..." />
            <Field label="Requisito" multiline value={template.requirement} onChange={(value) => update("requirement", value)} placeholder="REQ-001..." />
            <Field label="Objetivo" multiline value={template.objective} onChange={(value) => update("objective", value)} placeholder="Qué debe comprobarse" />
            <Field label="Precondiciones" multiline value={template.preconditions} onChange={(value) => update("preconditions", value)} placeholder="Configuración necesaria antes de ejecutar" />
            <Field label="Datos de prueba" multiline value={template.testData} onChange={(value) => update("testData", value)} placeholder="Usuarios, valores o archivos necesarios" />
            <Field label="Responsable" value={template.owner} onChange={(value) => update("owner", value)} placeholder="Equipo o persona" />
            <Field label="Tester" value={template.tester} onChange={(value) => update("tester", value)} placeholder="Nombre del tester" />
          </div>

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
              <button className="button button-secondary" onClick={() => download(markdown, "template-qa.md", "text/markdown")} type="button">
                <Download size={16} /> Markdown
              </button>
              <button className="button button-primary" onClick={() => download(JSON.stringify(template, null, 2), "template-qa.json", "application/json")} type="button">
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
    </div>
  );
}

function Field({ label, value, onChange, placeholder, multiline = false, wide = false }) {
  const commonProps = {
    value,
    onChange: (event) => onChange(event.target.value),
    placeholder,
  };
  return (
    <label className={`field ${wide ? "field-wide" : ""}`}>
      <span>{label}</span>
      {multiline ? <textarea {...commonProps} rows={3} /> : <input {...commonProps} />}
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

function dataUrlToBytes(dataUrl) {
  const binary = window.atob(dataUrl.split(",")[1]);
  return Uint8Array.from(binary, (character) => character.charCodeAt(0));
}

function wordText(label, value) {
  return new Paragraph({
    children: [new TextRun({ text: `${label}: `, bold: true }), new TextRun(value?.trim() || "Pendiente de completar")],
    spacing: { after: 120 },
  });
}

function buildWordDocument(data) {
  const text = (value) => value?.trim() || "Pendiente de completar";
  const children = [
    new Paragraph({ text: text(data.title), heading: HeadingLevel.TITLE, alignment: AlignmentType.CENTER }),
    new Paragraph({ text: text(data.description), spacing: { after: 220 } }),
    new Table({
      rows: [
        ["Requisito", data.requirement], ["Objetivo", data.objective],
        ["Precondiciones", data.preconditions], ["Datos de prueba", data.testData],
        ["Responsable", data.owner], ["Tester", data.tester],
      ].map(([label, value]) => new TableRow({
        children: [
          new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: label, bold: true })] })] }),
          new TableCell({ children: [new Paragraph(text(value))] }),
        ],
      })),
    }),
    new Paragraph({ text: "Pasos de prueba", heading: HeadingLevel.HEADING_1, pageBreakBefore: true }),
  ];
  data.steps.forEach((step, index) => {
    children.push(
      new Paragraph({ text: `${index + 1}. ${text(step.title)}`, heading: HeadingLevel.HEADING_2 }),
      wordText("Acción", step.action), wordText("Resultado esperado", step.expected),
      wordText("Resultado obtenido", step.result),
    );
    (step.images || []).forEach((image) => children.push(
      new Paragraph({ text: `Evidencia: ${image.name}` }),
      new Paragraph({
        children: [new ImageRun({ data: dataUrlToBytes(image.dataUrl), transformation: { width: 520, height: 320 } })],
        alignment: AlignmentType.CENTER,
      }),
    ));
  });
  return new Document({ sections: [{ children }] });
}

createRoot(document.getElementById("root")).render(<App />);
