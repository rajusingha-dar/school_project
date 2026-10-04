import { useId } from 'react';

/** Labelled text input. Extra props (type, value, onChange, autoComplete…) go to the <input>. */
export function TextField({ label, hint, ...inputProps }) {
  const id = useId();
  const hintId = hint ? `${id}-hint` : undefined;
  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      <input id={id} aria-describedby={hintId} {...inputProps} />
      {hint && (
        <p id={hintId} className="field-hint">
          {hint}
        </p>
      )}
    </div>
  );
}
