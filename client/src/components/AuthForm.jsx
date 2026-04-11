function AuthForm({
  title,
  subtitle,
  fields,
  values,
  onChange,
  onSubmit,
  loading,
  submitLabel,
  footer,
  error,
}) {
  return (
    <div className="arena-panel mx-auto w-full max-w-md p-8">
      <div className="mb-8">
        <div className="mb-3 inline-flex rounded-full border border-arena-500/30 bg-arena-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.28em] text-arena-400">
          CodeCamp Arena
        </div>
        <h1 className="text-3xl font-bold">{title}</h1>
        <p className="mt-2 text-paper-200/65">{subtitle}</p>
      </div>

      <form className="space-y-4" onSubmit={onSubmit}>
        {fields.map((field) => (
          <div key={field.name} className="space-y-2">
            <label className="text-sm font-medium text-paper-200/75" htmlFor={field.name}>
              {field.label}
            </label>
            <input
              id={field.name}
              className="arena-input"
              type={field.type}
              name={field.name}
              placeholder={field.placeholder}
              value={values[field.name]}
              onChange={onChange}
              autoComplete={field.autoComplete}
              required
            />
          </div>
        ))}

        {error ? <div className="rounded-2xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">{error}</div> : null}

        <button className="arena-button-primary w-full" disabled={loading} type="submit">
          {loading ? "Please wait..." : submitLabel}
        </button>
      </form>

      <div className="mt-6 text-sm text-paper-200/65">{footer}</div>
    </div>
  );
}

export default AuthForm;
