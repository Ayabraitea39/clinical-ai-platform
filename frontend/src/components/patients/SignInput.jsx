function SignInput({ sign, categoryName, value, onChange, disabled }) {
  const options = sign.predefined_values
    ? sign.predefined_values.split(",").map((v) => v.trim())
    : [];

  const normalizedDataType = String(sign.data_type || "")
    .trim()
    .toLowerCase();

  switch (normalizedDataType) {
    case "numeric":
      return (
        <input
          type="number"
          value={value ?? ""}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
        />
      );

    case "boolean":
      return (
        <input
          type="checkbox"
          checked={value === "true"}
          onChange={(e) =>
            onChange(e.target.checked ? "true" : "false")
          }
          disabled={disabled}
        />
      );

    case "date":
      return (
        <input
          type="date"
          value={value ?? ""}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
        />
      );

    case "list":
      return (
        <select
          value={value ?? ""}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
        >
          <option value="">Select...</option>

          {options.map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>
      );

    case "multi_select": {
      const selected = value
        ? String(value)
            .split(",")
            .map((v) => v.trim())
            .filter(Boolean)
        : [];

      function toggle(opt) {
        if (disabled) return;

        const next = selected.includes(opt)
          ? selected.filter((v) => v !== opt)
          : [...selected, opt];

        onChange(next.join(","));
      }

      return (
        <div className="multi-select-options">
          {options.map((opt) => (
            <label key={opt} className="multi-select-option">
              <input
                type="checkbox"
                checked={selected.includes(opt)}
                onChange={() => toggle(opt)}
                disabled={disabled}
              />
              <span>{opt}</span>
            </label>
          ))}
        </div>
      );
    }

    default:
      return (
        <input
          type="text"
          value={value ?? ""}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
        />
      );
  }
}

export default SignInput;