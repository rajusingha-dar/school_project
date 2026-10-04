import { useState } from 'react';
import { TextField } from '../../components/TextField';

/** Classes offered today. The MVP supports Class 7 only; more arrive without a UI rewrite. */
export const CLASS_OPTIONS = [{ value: 7, label: 'Class 7' }];

/** Form to add a child (name + class). Used by the empty state and the "Add child" action. */
export function AddChildForm({ onSubmit, onCancel }) {
  const [fullName, setFullName] = useState('');
  const [classLevel, setClassLevel] = useState(CLASS_OPTIONS[0].value);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');
    if (!fullName.trim()) return setError("Please enter your child's name.");
    setSubmitting(true);
    try {
      await onSubmit({ fullName: fullName.trim(), classLevel: Number(classLevel) });
    } catch (caught) {
      setError(caught.message);
      setSubmitting(false);
    }
    return undefined;
  }

  return (
    <form onSubmit={handleSubmit} noValidate>
      {error && (
        <div className="form-error" role="alert">
          {error}
        </div>
      )}
      <TextField
        label="Child's name"
        type="text"
        placeholder="Aarav Sharma"
        autoComplete="off"
        value={fullName}
        onChange={(event) => setFullName(event.target.value)}
        required
      />
      <div className="field">
        <label htmlFor="child-class">Class</label>
        <select
          id="child-class"
          value={classLevel}
          onChange={(event) => setClassLevel(event.target.value)}
        >
          {CLASS_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <p className="field-hint">
          Mathematics, Class 7 is available first. More classes are coming.
        </p>
      </div>
      <div className="form-actions">
        <button className="btn btn-primary" type="submit" disabled={submitting}>
          {submitting ? 'Adding…' : 'Add child'}
        </button>
        {onCancel && (
          <button className="btn btn-ghost" type="button" onClick={onCancel}>
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}
