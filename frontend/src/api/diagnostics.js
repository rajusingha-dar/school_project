/**
 * Diagnostic test data access. Currently returns the bundled sample test.
 * The real version will request a test for a child from the backend and grade answers
 * server-side; the returned shape (questions with visual spec, hints, misconception tags) is the contract.
 */
import { SAMPLE_TEST } from '../features/diagnostics/sampleTest';

export async function startDiagnostic() {
  return SAMPLE_TEST;
}
