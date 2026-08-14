const DEFAULTS = {
  preset: "media",
  quality: "media",
  cameraFov: 45,
  cameraHeightMm: 1600,
  lighting: "natural",
  exposure: 1,
  updatedAt: 0,
};
const prefsByProject = new Map();
export function getScenePrefs(projectId) {
  return prefsByProject.get(projectId) ?? { ...DEFAULTS };
}
export function setScenePrefs(projectId, patch) {
  const next = {
    ...getScenePrefs(projectId),
    ...patch,
    updatedAt: Date.now(),
  };
  prefsByProject.set(projectId, next);
  return next;
}
export function clearScenePrefs() {
  prefsByProject.clear();
}
