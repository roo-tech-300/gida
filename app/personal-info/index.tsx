import { Redirect } from 'expo-router';

/**
 * Root of the personal information editors.
 *
 * Redirects /personal-info to the Full name field. Every other field is its
 * own page and is opened directly from the matching Profile row.
 */
export default function PersonalInfoRoot() {
  return <Redirect from="/personal-info" to="/personal-info/full-name" />;
}
