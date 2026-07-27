import React, { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Mail, AlertCircle } from "lucide-react";
import { Field, PasswordInput, Shell, inputClass } from "./AuthShared";
import { login } from "../../api/auth";
import "./auth.css";

export default function SignIn() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "" });
  const [touched, setTouched] = useState({});
  const [serverError, setServerError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const errors = useMemo(() => {
    const e = {};
    if (!form.email.trim()) e.email = "Required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = "Enter a valid email";
    if (!form.password) e.password = "Required";
    return e;
  }, [form]);

  const isValid = Object.keys(errors).length === 0;

  async function handleSubmit(e) {
    e.preventDefault();
    setTouched({ email: true, password: true });
    setServerError("");
    if (!isValid) return;

    setSubmitting(true);
    try {
      const data = await login(form);
      localStorage.setItem("token", data.access_token);
      localStorage.setItem("user", JSON.stringify(data.user));
      navigate("/patients");
    } catch (err) {
      setServerError(err?.response?.data?.detail || "Invalid email or password");
    } finally {
      setSubmitting(false);
    }
  }

  const showError = (f) => touched[f] && errors[f];

  return (
    <Shell title="Sign in" subtitle="Access your clinical workspace">
      <form onSubmit={handleSubmit} className="auth-form">
        <Field label="Email" error={showError("email")}>
          <div className="auth-input-wrap">
            <Mail size={14} className="auth-input-icon" />
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              onBlur={() => setTouched((t) => ({ ...t, email: true }))}
              placeholder="you@clinic.com"
              className={inputClass(showError("email"), "has-icon-left")}
            />
          </div>
        </Field>

        <Field label="Password" error={showError("password")}>
          <PasswordInput
            value={form.password}
            onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
            onBlur={() => setTouched((t) => ({ ...t, password: true }))}
            error={showError("password")}
            placeholder="••••••••"
          />
        </Field>

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
          {submitting ? "Signing in..." : "Sign in"}
        </button>

        <p className="auth-switch-text">
          Don't have an account?{" "}
          <button type="button" onClick={() => navigate("/signup")} className="auth-switch-link">
            Sign up
          </button>
        </p>
      </form>
    </Shell>
  );
}