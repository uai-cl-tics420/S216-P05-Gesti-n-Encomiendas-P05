"use client";

import { useState } from "react";

const textos = {
  es: {
    pageTitle: "Traslado de Encomienda",
    pageDescription: "Registra el traslado de un paquete desde conserjeria hacia el departamento del residente.",
    labelPackageCode: "Codigo del paquete",
    labelDestinationUnit: "Departamento destino",
    labelResidentName: "Nombre del residente",
    labelVerificationCode: "Codigo de verificacion (QR / PIN)",
    labelNotes: "Observaciones",
    placeholderPackageCode: "Ej: PKG-2026-0412",
    placeholderUnit: "Ej: 1201",
    placeholderResident: "Ej: Maria Gonzalez",
    placeholderVerification: "Ingresa el codigo que muestra el residente",
    placeholderNotes: "Opcional: estado del paquete, danos, etc.",
    buttonSubmit: "Confirmar Traslado",
    buttonCancel: "Cancelar",
    successMessage: "Traslado registrado exitosamente.",
    errorRequired: "Este campo es obligatorio.",
    labelPerishable: "Es perecible?",
    perishableWarning: "Paquete perecible: entregar con prioridad inmediata.",
  },
  en: {
    pageTitle: "Package Transfer",
    pageDescription: "Register the transfer of a package from the front desk to the resident unit.",
    labelPackageCode: "Package code",
    labelDestinationUnit: "Destination unit",
    labelResidentName: "Resident name",
    labelVerificationCode: "Verification code (QR / PIN)",
    labelNotes: "Notes",
    placeholderPackageCode: "E.g.: PKG-2026-0412",
    placeholderUnit: "E.g.: 1201",
    placeholderResident: "E.g.: Maria Gonzalez",
    placeholderVerification: "Enter the code shown by the resident",
    placeholderNotes: "Optional: package condition, damages, etc.",
    buttonSubmit: "Confirm Transfer",
    buttonCancel: "Cancel",
    successMessage: "Transfer registered successfully.",
    errorRequired: "This field is required.",
    labelPerishable: "Is it perishable?",
    perishableWarning: "Perishable package: deliver with immediate priority.",
  },
};

const INITIAL_FORM = {
  packageCode: "",
  destinationUnit: "",
  residentName: "",
  verificationCode: "",
  isPerishable: false,
  notes: "",
};

export default function TransferForm({ locale = "es" }) {
  const t = textos[locale];

  const [formData, setFormData] = useState(INITIAL_FORM);
  const [errors, setErrors] = useState({});
  const [submitted, setSubmitted] = useState(false);

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
    if (!formData.packageCode.trim()) next.packageCode = t.errorRequired;
    if (!formData.destinationUnit.trim()) next.destinationUnit = t.errorRequired;
    if (!formData.residentName.trim()) next.residentName = t.errorRequired;
    if (!formData.verificationCode.trim()) next.verificationCode = t.errorRequired;
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!validate()) return;

    try {
      const res = await fetch("/api/transfers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      if (res.ok) {
        setSubmitted(true);
      }
    } catch (err) {
      console.error("Error al enviar:", err);
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
        <p style={styles.successText}>{t.successMessage}</p>
        <button
          type="button"
          onClick={() => { setFormData(INITIAL_FORM); setSubmitted(false); }}
          style={{ ...styles.button, ...styles.buttonPrimary }}
        >
          {locale === "es" ? "Registrar otro" : "Register another"}
        </button>
      </div>
    );
  }

  return (
    <div style={styles.formWrapper}>
      <h2 style={styles.heading}>{t.pageTitle}</h2>
      <p style={styles.description}>{t.pageDescription}</p>

      <div style={styles.grid}>
        <Field label={t.labelPackageCode} name="packageCode" value={formData.packageCode} placeholder={t.placeholderPackageCode} error={errors.packageCode} onChange={handleChange} required />
        <Field label={t.labelDestinationUnit} name="destinationUnit" value={formData.destinationUnit} placeholder={t.placeholderUnit} error={errors.destinationUnit} onChange={handleChange} required />
        <Field label={t.labelResidentName} name="residentName" value={formData.residentName} placeholder={t.placeholderResident} error={errors.residentName} onChange={handleChange} required />
        <Field label={t.labelVerificationCode} name="verificationCode" value={formData.verificationCode} placeholder={t.placeholderVerification} error={errors.verificationCode} onChange={handleChange} required />

        <div style={styles.checkboxRow}>
          <label style={styles.checkboxLabel}>
            <input type="checkbox" name="isPerishable" checked={formData.isPerishable} onChange={handleChange} style={styles.checkbox} />
            {t.labelPerishable}
          </label>
          {formData.isPerishable && <p style={styles.perishableWarning}>{t.perishableWarning}</p>}
        </div>

        <div style={{ ...styles.fieldGroup, gridColumn: "1 / -1" }}>
          <label style={styles.label}>{t.labelNotes}</label>
          <textarea name="notes" value={formData.notes} placeholder={t.placeholderNotes} onChange={handleChange} rows={3} style={styles.input} />
        </div>
      </div>

      <div style={styles.actions}>
        <button type="button" onClick={handleReset} style={{ ...styles.button, ...styles.buttonSecondary }}>{t.buttonCancel}</button>
        <button type="button" onClick={handleSubmit} style={{ ...styles.button, ...styles.buttonPrimary }}>{t.buttonSubmit}</button>
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
};
