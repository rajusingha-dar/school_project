/**
 * Dashboard data access. Currently backed by sample data (see sampleData.js).
 * Replace the bodies of these functions with `request(...)` calls when the endpoints exist;
 * the returned shapes are the contract.
 */
import { addSampleChild, sampleChildrenFor, sampleDashboardFor } from './sampleData';

/** True while the dashboard shows placeholder data. Drives the "sample data" banner. */
export const USING_SAMPLE_DATA = true;

/** @returns {Promise<Array<{id: string, fullName: string, classLevel: number, board: string}>>} */
export async function listChildren(user) {
  return sampleChildrenFor(user.email);
}

/** @returns {Promise<{id: string, fullName: string, classLevel: number, board: string}>} */
export async function addChild(user, { fullName, classLevel }) {
  return addSampleChild(user.email, { fullName, classLevel });
}

/**
 * Everything the dashboard needs for one child.
 * `hasData: false` means the child has not taken any diagnostic yet.
 */
export async function getDashboard(childId) {
  return sampleDashboardFor(childId);
}
