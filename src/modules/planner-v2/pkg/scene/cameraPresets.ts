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

export function autoFrameKitchen(scene: THREE.Scene) {
  const bounds = new THREE.Box3();
  scene.traverse((object) => {
    if (!object.visible || !isPresentationContent(object)) return;
    if (object instanceof THREE.Mesh || object.userData?.contentType === "decoration")
      bounds.expandByObject(object);
  });
  if (bounds.isEmpty())
    bounds.setFromCenterAndSize(new THREE.Vector3(0, 1.1, -0.6), new THREE.Vector3(3.8, 2.4, 2.8));
  const size = bounds.getSize(new THREE.Vector3());
  const center = bounds.getCenter(new THREE.Vector3());
  return { bounds, size, center, radius: Math.max(size.x, size.y, size.z) * 0.5 };
}

export function applyKitchenCamera(
  camera: THREE.Camera,
  scene: THREE.Scene,
  view: KitchenRenderView,
  aspect = 16 / 9,
) {
  const frame = autoFrameKitchen(scene);
  const { center, size, radius } = frame;
  const horizontal = Math.max(size.x, size.z, 2.4);
  const distance = Math.max(
    3.05,
    horizontal *
      (view === "detail" ? 0.78 : view === "overview" ? 1.18 : view === "front" ? 1.08 : 1.12),
  );
  const target = center.clone();
  target.y = Math.max(0.85, Math.min(center.y, 1.35));
  let direction = new THREE.Vector3(0, 0, 1);
  let height = Math.max(1.35, target.y + radius * (view === "overview" ? 0.9 : 0.35));

  if (view === "three-quarter-left") direction = new THREE.Vector3(-0.78, 0, 0.62).normalize();
  if (view === "top") {
    direction = new THREE.Vector3(0, 1, 0.001).normalize();
    height = Math.max(4.2, target.y + horizontal * 1.15);
  }
  if (view === "lateral") direction = new THREE.Vector3(1, 0.08, 0).normalize();
  if (view === "three-quarter-right") direction = new THREE.Vector3(0.78, 0, 0.62).normalize();
  if (view === "island") {
    direction = new THREE.Vector3(0.12, 0, 1).normalize();
    target.z += Math.min(0.4, size.z * 0.12);
    height = Math.max(1.45, target.y + 0.25);
  }
  if (view === "detail") {
    direction = new THREE.Vector3(0.42, 0.08, 0.9).normalize();
    target.y = Math.max(0.95, target.y);
    height = target.y + 0.08;
  }
  if (view === "overview") {
    direction = new THREE.Vector3(0.72, 0.32, 0.72).normalize();
    target.y = Math.max(1.05, Math.min(center.y, 1.2));
  }

  const position = target.clone().add(direction.multiplyScalar(distance));
  position.y = height;
  camera.position.copy(position);
  camera.lookAt(target);
  if (camera instanceof THREE.PerspectiveCamera) {
    camera.aspect = aspect;
    camera.fov = view === "detail" ? 40 : view === "overview" ? 34 : view === "front" ? 33 : 34;
    camera.near = 0.035;
    camera.far = 100;
    camera.updateProjectionMatrix();
  } else if (camera instanceof THREE.OrthographicCamera) {
    const half = Math.max(2.2, horizontal * 0.75);
    camera.left = -half * aspect;
    camera.right = half * aspect;
    camera.top = half;
    camera.bottom = -half;
    camera.updateProjectionMatrix();
  }
}
