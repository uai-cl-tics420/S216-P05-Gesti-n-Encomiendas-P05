"use client";

import { useState } from "react";

const INITIAL_FORM = {
  trackingCode: "",
  description: "",
  senderName: "",
  destinationUnit: "",
  residentName: "",
  isPerishable: false,
  notes: "",
};

export default function RegisterForm() {
  const [formData, setFormData] = useState(INITIAL_FORM);
  const [errors, setErrors] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  function handleChange(e) {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  }

  function validate() {
    const next = {};
    if (!formData.trackingCode.trim()) next.trackingCode = "Este campo es obligatorio";
    if (!formData.destinationUnit.trim()) next.destinationUnit = "Este campo es obligatorio";
    if (!formData.residentName.trim()) next.residentName = "Este campo es obligatorio";
    if (!formData.senderName.trim()) next.senderName = "Este campo es obligatorio";
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleSubmit() {
    if (!validate()) return;
    setLoading(true);

    try {
      const res = await fetch("/api/packages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      if (res.ok) {
        setSubmitted(true);
      }
    } catch (err) {
      console.error("Error al registrar:", err);
    } finally {
      setLoading(false);
    }
  }

  function handleReset() {
    setFormData(INITIAL_FORM);
    setErrors({});
    setSubmitted(false);
  }

  if (submitted) {
    return (
      <div style={styles.successCard}>
        <p style={styles.successText}>Encomienda registrada correctamente</p>
        <p style={styles.successSub}>Se notifico al residente del departamento {formData.destinationUnit}</p>
        {formData.isPerishable && (
          <p style={styles.perishableWarning}>Este paquete es perecible, se envio una alerta prioritaria</p>
        )}
        <button type="button" onClick={handleReset} style={{ ...styles.button, ...styles.buttonPrimary }}>
          Registrar otra encomienda
        </button>
      </div>
    );
  }

  return (
    <div style={styles.formWrapper}>
      <h2 style={styles.heading}>Registro de Encomienda</h2>
      <p style={styles.description}>Ingresa los datos del paquete que llego al edificio para notificar al residente.</p>

      <div style={styles.grid}>
        <Field label="Codigo de seguimiento" name="trackingCode" value={formData.trackingCode} placeholder="Ej: PKG-2026-0415" error={errors.trackingCode} onChange={handleChange} required />
        <Field label="Remitente" name="senderName" value={formData.senderName} placeholder="Ej: Amazon, Mercado Libre, particular" error={errors.senderName} onChange={handleChange} required />
        <Field label="Departamento destino" name="destinationUnit" value={formData.destinationUnit} placeholder="Ej: 1201" error={errors.destinationUnit} onChange={handleChange} required />
        <Field label="Nombre del residente" name="residentName" value={formData.residentName} placeholder="Ej: Maria Gonzalez" error={errors.residentName} onChange={handleChange} required />

        <div style={{ gridColumn: "1 / -1" }}>
          <Field label="Descripcion del paquete" name="description" value={formData.description} placeholder="Ej: Caja mediana, sobre, bolsa de supermercado" onChange={handleChange} />
        </div>

        <div style={styles.checkboxRow}>
          <label style={styles.checkboxLabel}>
            <input type="checkbox" name="isPerishable" checked={formData.isPerishable} onChange={handleChange} style={styles.checkbox} />
            Es perecible (comida, supermercado, etc.)
          </label>
          {formData.isPerishable && (
            <p style={styles.perishableWarning}>Se enviara una notificacion urgente al residente</p>
          )}
        </div>

        <div style={{ ...styles.fieldGroup, gridColumn: "1 / -1" }}>
          <label style={styles.label}>Observaciones</label>
          <textarea name="notes" value={formData.notes} placeholder="Opcional: estado del paquete, instrucciones especiales, etc." onChange={handleChange} rows={3} style={styles.input} />
        </div>
      </div>

      <div style={styles.actions}>
        <button type="button" onClick={handleReset} style={{ ...styles.button, ...styles.buttonSecondary }}>Limpiar</button>
        <button type="button" onClick={handleSubmit} disabled={loading} style={{ ...styles.button, ...styles.buttonPrimary, opacity: loading ? 0.6 : 1 }}>
          {loading ? "Guardando..." : "Registrar Encomienda"}
        </button>
      </div>
    </div>
  );
}

function Field({ label, name, value, placeholder, error, required, onChange }) {
  return (
    <div style={styles.fieldGroup}>
      <label style={styles.label}>{label}{required && <span style={styles.required}> *</span>}</label>
      <input type="text" name={name} value={value} placeholder={placeholder} onChange={onChange} style={{ ...styles.input, ...(error ? styles.inputError : {}) }} />
      {error && <span style={styles.errorText}>{error}</span>}
    </div>
  );
}

const styles = {
  formWrapper: { maxWidth: 720, margin: "2rem auto", padding: "2rem", borderRadius: 12, background: "#ffffff", boxShadow: "0 2px 12px rgba(0,0,0,0.08)", fontFamily: "'Segoe UI', system-ui, sans-serif" },
  heading: { fontSize: "1.5rem", fontWeight: 700, marginBottom: "0.25rem", color: "#1a1a2e" },
  description: { fontSize: "0.95rem", color: "#6b7280", marginBottom: "1.5rem" },
  grid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "1.25rem" },
  fieldGroup: { display: "flex", flexDirection: "column", gap: "0.35rem" },
  label: { fontSize: "0.85rem", fontWeight: 600, color: "#374151" },
  required: { color: "#ef4444" },
  input: { padding: "0.65rem 0.85rem", borderRadius: 8, border: "1px solid #d1d5db", fontSize: "0.95rem", outline: "none", width: "100%", boxSizing: "border-box" },
  inputError: { borderColor: "#ef4444" },
  errorText: { fontSize: "0.78rem", color: "#ef4444" },
  checkboxRow: { gridColumn: "1 / -1", display: "flex", flexDirection: "column", gap: "0.5rem" },
  checkboxLabel: { display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.95rem", fontWeight: 500, color: "#374151", cursor: "pointer" },
  checkbox: { width: 18, height: 18, accentColor: "#2563eb", cursor: "pointer" },
  perishableWarning: { padding: "0.5rem 0.75rem", borderRadius: 8, background: "#fef3c7", color: "#92400e", fontSize: "0.85rem", fontWeight: 500, border: "1px solid #fcd34d" },
  actions: { display: "flex", justifyContent: "flex-end", gap: "0.75rem", marginTop: "1.75rem" },
  button: { padding: "0.65rem 1.5rem", borderRadius: 8, fontSize: "0.95rem", fontWeight: 600, cursor: "pointer", border: "none" },
  buttonPrimary: { background: "#2563eb", color: "#ffffff" },
  buttonSecondary: { background: "#f3f4f6", color: "#374151", border: "1px solid #d1d5db" },
  successCard: { maxWidth: 480, margin: "2rem auto", padding: "2rem", borderRadius: 12, background: "#f0fdf4", border: "1px solid #86efac", textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: "1rem" },
  successText: { fontSize: "1.1rem", fontWeight: 600, color: "#166534" },
  successSub: { fontSize: "0.95rem", color: "#374151" },
};
