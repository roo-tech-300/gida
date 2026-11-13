// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');

module.exports = defineConfig([
  expoConfig,
  {
    ignores: ['dist/*', 'public/**', 'media-server/**', 'worker/.wrangler/**', '.expo/**', 'supabase/functions/**'],
  },
  {
    rules: {
      // Advisory React Compiler rule. Most hits are "reset the form when a modal opens"
      // effects that work correctly; restructuring them needs visual QA per modal.
      // Kept visible as a warning so new code still gets flagged.
      'react-hooks/set-state-in-effect': 'warn',
    },
  },
]);
