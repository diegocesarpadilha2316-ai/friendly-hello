import * as THREE from "three";

export type KitchenRenderView =
  | "front"
  | "three-quarter-left"
  | "three-quarter-right"
  | "island"
  | "detail"
  | "overview"
  | "top"
  | "lateral";

export type KitchenCameraPreset = KitchenRenderView;

function isPresentationContent(object: THREE.Object3D) {
  let current: THREE.Object3D | null = object;
  for (let depth = 0; depth < 8 && current; depth += 1) {
    if (current.userData?.renderLayer === "EDITOR_ONLY") return false;
    if (
      current.userData?.instanceId ||
      current.userData?.decorAsset ||
      current.userData?.assetId ||
      current.userData?.contentType === "decoration" ||
      current.userData?.contentType === "appliances"
    )
      return true;
    current = current.parent;
  }
  return false;
}

function belongsToInstance(object: THREE.Object3D, instanceId: string) {
  let current: THREE.Object3D | null = object;
  for (let depth = 0; depth < 10 && current; depth += 1) {
    if (current.userData?.instanceId === instanceId) return true;
    current = current.parent;
  }
  return false;
}

export function autoFrameKitchen(scene: THREE.Scene, instanceId?: string | null) {
  const bounds = new THREE.Box3();
  scene.updateMatrixWorld(true);
  scene.traverse((object) => {
    if (!object.visible) return;
    if (instanceId ? !belongsToInstance(object, instanceId) : !isPresentationContent(object)) return;
    if (object instanceof THREE.Mesh || object instanceof THREE.InstancedMesh)
      bounds.expandByObject(object, true);
  });
  if (bounds.isEmpty())
    bounds.setFromCenterAndSize(new THREE.Vector3(0, 1.05, -0.6), new THREE.Vector3(4.8, 2.5, 3.2));
  const size = bounds.getSize(new THREE.Vector3());
  const center = bounds.getCenter(new THREE.Vector3());
  return { bounds, size, center, radius: Math.max(size.x, size.y, size.z) * 0.5 };
}

export function applyKitchenCamera(
  camera: THREE.Camera,
  scene: THREE.Scene,
  view: KitchenRenderView,
  aspect = 16 / 9,
  instanceId?: string | null,
) {
  const frame = autoFrameKitchen(scene, instanceId);
  const { center, size, radius } = frame;
  const isDetail = view === "detail";
  const fov = isDetail ? 40 : view === "overview" ? 34 : view === "front" ? 38 : 36;
  const margin = isDetail ? 1.24 : view === "front" ? 1.72 : 1.42;
  const distance = Math.max(2.8, (radius / Math.tan((fov * Math.PI) / 360)) * margin);
  const target = center.clone();
  let direction = new THREE.Vector3(0, 0, 1);

  if (view === "three-quarter-left") direction = new THREE.Vector3(-0.78, 0.08, 0.62).normalize();
  if (view === "top") direction = new THREE.Vector3(0, 1, 0.001).normalize();
  if (view === "lateral") direction = new THREE.Vector3(1, 0.08, 0).normalize();
  if (view === "three-quarter-right" || view === "overview")
    direction = new THREE.Vector3(0.72, 0.22, 0.72).normalize();
  if (view === "island") direction = new THREE.Vector3(0.12, 0.05, 1).normalize();
  if (view === "detail") direction = new THREE.Vector3(0.42, 0.08, 0.9).normalize();

  const position = target.clone().add(direction.multiplyScalar(distance));
  if (view === "top") position.y = Math.max(position.y, target.y + Math.max(3.6, size.x * 1.15));
  camera.position.copy(position);
  camera.lookAt(target);
  if (camera instanceof THREE.PerspectiveCamera) {
    camera.aspect = aspect;
    camera.fov = fov;
    camera.near = 0.035;
    camera.far = Math.max(100, distance * 20);
    camera.updateProjectionMatrix();
  } else if (camera instanceof THREE.OrthographicCamera) {
    const half = Math.max(1.8, Math.max(size.x, size.y, size.z) * 0.72);
    camera.left = -half * aspect;
    camera.right = half * aspect;
    camera.top = half;
    camera.bottom = -half;
    camera.updateProjectionMatrix();
  }
}
