import React, { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Mail, User, Stethoscope, AlertCircle } from "lucide-react";
import { Field, PasswordInput, Shell, inputClass, ROLE_OPTIONS, SPECIALTY_OPTIONS } from "./AuthShared";
import { signup } from "../../api/auth";
import "./auth.css";

const initial = {
  email: "",
  password: "",
  confirm_password: "",
  name:" ",
  role: "",
  doctor_name: "",
  doctor_specialty: "",
};

export default function SignUp() {
  const navigate = useNavigate();
  const [form, setForm] = useState(initial);
  const [touched, setTouched] = useState({});
  const [serverError, setServerError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const isDoctor = form.role === "doctor";

  const errors = useMemo(() => {
    const e = {};
     if (!form.name.trim()) e.name = "Required"; 
    if (!form.email.trim()) e.email = "Required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = "Enter a valid email";
    if (!form.password) e.password = "Required";
    else if (form.password.length < 8) e.password = "At least 8 characters";
    if (!form.confirm_password) e.confirm_password = "Required";
    else if (form.confirm_password !== form.password) e.confirm_password = "Passwords don't match";
    if (!form.role) e.role = "Required";
    if (isDoctor && !form.doctor_name.trim()) e.doctor_name = "Required";
    if (isDoctor && !form.doctor_specialty.trim()) e.doctor_specialty = "Required";
    return e;
  }, [form, isDoctor]);

  const isValid = Object.keys(errors).length === 0;

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }
  function blur(field) {
    setTouched((t) => ({ ...t, [field]: true }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const allFields = Object.keys(form);
    setTouched(allFields.reduce((acc, f) => ({ ...acc, [f]: true }), {}));
    setServerError("");
    if (!isValid) return;

    const out = {
      email: form.email,
      password: form.password,
      name:form.name,
      role: form.role,
      ...(isDoctor
        ? { doctor: { name: form.doctor_name, specialty: form.doctor_specialty } }
        : {}),
    };

    setSubmitting(true);
    try {
      const data = await signup(out);
      localStorage.setItem("token", data.access_token);
      localStorage.setItem("user", JSON.stringify(data.user));
      navigate("/patients/");
    } catch (err) {
      setServerError(err?.response?.data?.detail || "Signup failed");
    } finally {
      setSubmitting(false);
    }
  }

  const showError = (f) => touched[f] && errors[f];

  return (
    <Shell title="Create account" subtitle="Set up staff or doctor access">
      <form onSubmit={handleSubmit} className="auth-form">
        <Field label="Full name" error={showError("name")}>
  <div className="auth-input-wrap">
    <User size={14} className="auth-input-icon" />
    <input
      type="text"
      value={form.name}
      onChange={(e) => update("name", e.target.value)}
      onBlur={() => blur("name")}
      placeholder="Your full name"
      className={inputClass(showError("name"), "has-icon-left")}
    />
  </div>
</Field>

        <Field label="Email" error={showError("email")}>
          <div className="auth-input-wrap">
            <Mail size={14} className="auth-input-icon" />
            <input
              type="email"
              value={form.email}
              onChange={(e) => update("email", e.target.value)}
              onBlur={() => blur("email")}
              placeholder="you@clinic.com"
              className={inputClass(showError("email"), "has-icon-left")}
            />
          </div>
        </Field>

        <Field label="Password" error={showError("password")}>
          <PasswordInput
            value={form.password}
            onChange={(e) => update("password", e.target.value)}
            onBlur={() => blur("password")}
            error={showError("password")}
            placeholder="At least 8 characters"
          />
        </Field>

        <Field label="Confirm password" error={showError("confirm_password")}>
          <PasswordInput
            value={form.confirm_password}
            onChange={(e) => update("confirm_password", e.target.value)}
            onBlur={() => blur("confirm_password")}
            error={showError("confirm_password")}
            placeholder="Re-enter password"
          />
        </Field>

        <Field label="Role" error={showError("role")}>
          <select
            value={form.role}
            onChange={(e) => update("role", e.target.value)}
            onBlur={() => blur("role")}
            className={inputClass(showError("role"))}
          >
            <option value="">Select role</option>
            {ROLE_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </Field>

        {isDoctor && (
          <div className="auth-panel">
            <Field label="Specialty" error={showError("doctor_specialty")}>
              <select
                value={form.doctor_specialty}
                onChange={(e) => update("doctor_specialty", e.target.value)}
                onBlur={() => blur("doctor_specialty")}
                className={inputClass(showError("doctor_specialty"))}
              >
                <option value="">Select specialty</option>
                {SPECIALTY_OPTIONS.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </Field>
          </div>
        )}

        {serverError && (
          <span className="auth-inline-error">
            <AlertCircle size={13} /> {serverError}
          </span>
        )}

        {!serverError && !isValid && Object.keys(touched).length > 0 && (
          <span className="auth-inline-error">
            <AlertCircle size={13} /> Check the fields above
          </span>
        )}

        <button type="submit" className="auth-button-primary" disabled={submitting}>
          {submitting ? "Creating account..." : "Create account"}
        </button>

        <p className="auth-switch-text">
          Already have an account?{" "}
          <button type="button" onClick={() => navigate("/login")} className="auth-switch-link">
            Sign in
          </button>
        </p>
      </form>
    </Shell>
  );
}