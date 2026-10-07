/**
 * Build-time constants shared by the app build, Storybook and Vitest, so a value like the build year is
 * the same in the prerendered HTML and in the client bundle (it is never read from the clock at module scope).
 */
export const buildDefine = {
  __BUILD_YEAR__: JSON.stringify(new Date().getFullYear()),
};
