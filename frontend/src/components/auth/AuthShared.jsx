import React, { useState } from "react";
import { Lock, Eye, EyeOff } from "lucide-react";
import "./auth.css";

export const ROLE_OPTIONS = [
  { value: "staff", label: "Staff" },
  { value: "doctor", label: "Doctor" },
];

export const SPECIALTY_OPTIONS = [
  "General Practice",
  "Internal Medicine",
  "Cardiology",
  "Dermatology",
  "Endocrinology",
  "Gastroenterology",
  "Neurology",
  "Obstetrics & Gynecology",
  "Oncology",
  "Ophthalmology",
  "Orthopedics",
  "Pediatrics",
  "Psychiatry",
  "Pulmonology",
  "Radiology",
  "Surgery",
  "Urology",
  "Other",
];

export function inputClass(hasError, extra = "") {
  return "auth-input" + (hasError ? " error" : "") + (extra ? " " + extra : "");
}

export function Field({ label, error, children }) {
  return (
    <label className="auth-field">
      <span className="auth-label">{label}</span>
      {children}
      {error && <span className="auth-error-text">{error}</span>}
    </label>
  );
}

export function PasswordInput({ value, onChange, onBlur, error, placeholder }) {
  const [show, setShow] = useState(false);
  return (
    <div className="auth-input-wrap">
      <Lock size={14} className="auth-input-icon" />
      <input
        type={show ? "text" : "password"}
        value={value}
        onChange={onChange}
        onBlur={onBlur}
        placeholder={placeholder}
        className={inputClass(error, "has-icon-left has-icon-right")}
      />
      <button
        type="button"
        onClick={() => setShow((s) => !s)}
        className="auth-input-toggle"
        tabIndex={-1}
      >
        {show ? <EyeOff size={15} /> : <Eye size={15} />}
      </button>
    </div>
  );
}

export function Shell({ title, subtitle, children }) {
  return (
    <div className="auth-shell">
      <div className="auth-shell-inner">
        <div className="auth-header">
          <p className="auth-eyebrow">Clinical AI Assistant</p>
          <h1 className="auth-title">{title}</h1>
          {subtitle && <p className="auth-subtitle">{subtitle}</p>}
        </div>
        <div className="auth-card">{children}</div>
      </div>
    </div>
  );
}