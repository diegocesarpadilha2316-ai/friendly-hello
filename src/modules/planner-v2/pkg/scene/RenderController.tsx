import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useRef } from "react";
import * as THREE from "three";
import { usePlannerStore } from "../state/usePlannerStore";
import { setPresentationCapture } from "./presentationCapture";
import { applyKitchenCamera, type KitchenRenderView } from "./cameraPresets";

type RenderView = KitchenRenderView;
type RenderQuality = "quick" | "quality" | "maximum";

type RenderImageRequest = {
  view: RenderView;
  quality: RenderQuality;
  width: number;
  height: number;
};

type RenderVideoRequest = {
  preset: "quick" | "professional" | "client";
  durationMs?: number;
};

const VIEW_TARGET = new THREE.Vector3(0, 1.05, -0.58);

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 2000);
}

function downloadDataUrl(dataUrl: string, filename: string) {
  const anchor = document.createElement("a");
  anchor.href = dataUrl;
  anchor.download = filename;
  anchor.click();
}

function qualityExposure(quality: RenderQuality) {
  if (quality === "quick") return 0.98;
  if (quality === "maximum") return 1.12;
  return 1.06;
}

function temporarilyHideGoldenModuleAssets(scene: THREE.Scene) {
  const hidden: Array<{ object: THREE.Object3D; visible: boolean }> = [];
  scene.traverse((object) => {
    let ancestor: THREE.Object3D | null = object;
    let belongsToGoldenModule = false;
    let belongsToNonFurnitureAsset = false;
    for (let depth = 0; depth < 8 && ancestor; depth += 1) {
      if (ancestor.userData?.instanceId) {
        belongsToGoldenModule = true;
        break;
      }
      if (ancestor.userData?.contentType === "decoration" || ancestor.userData?.contentType === "appliances" || ancestor.userData?.decorAsset || ancestor.userData?.assetId) {
        belongsToNonFurnitureAsset = true;
      }
      ancestor = ancestor.parent;
    }
    if (!belongsToGoldenModule && (belongsToNonFurnitureAsset || object.userData?.contentType === "decoration" || object.userData?.contentType === "appliances" || object.userData?.decorAsset || object.userData?.assetId)) {
      hidden.push({ object, visible: object.visible });
      object.visible = false;
    }
  });
  return () => hidden.forEach(({ object, visible }) => { object.visible = visible; });
}

function temporarilyHideEditorOverlays(scene: THREE.Scene) {
  const hidden: Array<{ object: THREE.Object3D; visible: boolean }> = [];
  scene.traverse((object) => {
    const name = object.name.toLowerCase();
    let ancestor: THREE.Object3D | null = object;
    let inTransformControls = false;
    for (let depth = 0; depth < 6 && ancestor; depth += 1) {
      const candidate = ancestor as THREE.Object3D & { isTransformControlsGizmo?: boolean; isTransformControlsPlane?: boolean };
      if (candidate.isTransformControlsGizmo || candidate.isTransformControlsPlane || candidate.name.toLowerCase().includes("transformcontrols") || candidate.name.toLowerCase().includes("gizmo")) {
        inTransformControls = true;
        break;
      }
      ancestor = ancestor.parent;
    }
    const isEditorOverlay = object.userData?.renderLayer === "EDITOR_ONLY" || object.userData?.editorObject || inTransformControls || object.userData?.dragPreview || object.userData?.snapGuide || object.userData?.gizmo || name.includes("transformcontrols") || name.includes("gizmo") || object.type === "LineSegments" || object.type === "LineLoop";
    if (isEditorOverlay) {
      hidden.push({ object, visible: object.visible });
      object.visible = false;
    }
  });
  return () => hidden.forEach(({ object, visible }) => { object.visible = visible; });
}

function renderToPng(
  gl: THREE.WebGLRenderer,
  scene: THREE.Scene,
  camera: THREE.Camera,
  request: RenderImageRequest,
) {
  const width = Math.max(640, Math.min(request.width, 3840));
  const height = Math.max(360, Math.min(request.height, 2160));
  const target = new THREE.WebGLRenderTarget(width, height, {
    depthBuffer: true,
    stencilBuffer: false,
    minFilter: THREE.LinearFilter,
    magFilter: THREE.LinearFilter,
    colorSpace: THREE.SRGBColorSpace,
  });
  const previousTarget = gl.getRenderTarget();
  const previousExposure = gl.toneMappingExposure;
  gl.toneMappingExposure = qualityExposure(request.quality);
  gl.setRenderTarget(target);
  gl.clear(true, true, true);
  gl.render(scene, camera);
  const pixels = new Uint8Array(width * height * 4);
  gl.readRenderTargetPixels(target, 0, 0, width, height, pixels);

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Canvas 2D indisponível para exportação PNG.");
  const imageData = context.createImageData(width, height);
  for (let y = 0; y < height; y += 1) {
    const sourceOffset = (height - y - 1) * width * 4;
    const targetOffset = y * width * 4;
    imageData.data.set(pixels.subarray(sourceOffset, sourceOffset + width * 4), targetOffset);
  }
  context.putImageData(imageData, 0, 0);
  gl.setRenderTarget(previousTarget);
  gl.toneMappingExposure = previousExposure;
  target.dispose();
  return canvas.toDataURL("image/png");
}

function applyView(camera: THREE.Camera, scene: THREE.Scene, view: RenderView, aspect: number, goldenModuleCapture = false) {
  const effectiveView = goldenModuleCapture && view === "overview" ? "detail" : view;
  applyKitchenCamera(camera, scene, effectiveView, aspect);
}

export function RenderController() {
  const { gl, scene, camera, invalidate } = useThree();
  const videoRef = useRef<{ recorder: MediaRecorder; startedAt: number; durationMs: number; view: RenderView; stream: MediaStream; previousSize: THREE.Vector2; previousPixelRatio: number; previousAspect: number | null; previousSelectedId: string | null } | null>(null);

  useEffect(() => {
    const handleImage = (event: Event) => {
      const request = (event as CustomEvent<RenderImageRequest>).detail;
      const previousSelectedId = usePlannerStore.getState().selectedId;
      const previousPosition = camera.position.clone();
      const previousQuaternion = camera.quaternion.clone();
      const previousExposure = gl.toneMappingExposure;
      const goldenModuleCapture = new URLSearchParams(window.location.search).get("goldenmodule") === "1";
      let restoreOverlays = () => {};
      let restoreGoldenAssets = () => {};
      try {
        setPresentationCapture(true);
        window.dispatchEvent(new CustomEvent("dioris:render-hide-editor"));
        usePlannerStore.getState().selectFurnitureInstance(null);
        if (goldenModuleCapture) restoreGoldenAssets = temporarilyHideGoldenModuleAssets(scene);
        applyView(camera, scene, request.view, request.width / request.height, goldenModuleCapture);
        restoreOverlays = temporarilyHideEditorOverlays(scene);
        invalidate();
        window.setTimeout(() => {
          try {
            const dataUrl = renderToPng(gl, scene, camera, request);
            downloadDataUrl(dataUrl, `dioris-kitchen-v10-${request.view}-${request.quality}-${request.width}x${request.height}.png`);
            window.dispatchEvent(new CustomEvent("dioris:render-status", { detail: { kind: "success", message: `Render ${request.view} exportado em PNG real.` } }));
          } catch (error) {
            window.dispatchEvent(new CustomEvent("dioris:render-status", { detail: { kind: "error", message: error instanceof Error ? error.message : "Falha ao exportar render." } }));
          } finally {
            restoreOverlays();
            restoreGoldenAssets();
            setPresentationCapture(false);
            window.dispatchEvent(new CustomEvent("dioris:render-show-editor"));
            usePlannerStore.getState().selectFurnitureInstance(previousSelectedId);
            camera.position.copy(previousPosition);
            camera.quaternion.copy(previousQuaternion);
            if (camera instanceof THREE.PerspectiveCamera || camera instanceof THREE.OrthographicCamera) camera.updateProjectionMatrix();
            gl.toneMappingExposure = previousExposure;
            invalidate();
          }
        }, 420);
      } catch (error) {
        restoreOverlays();
        restoreGoldenAssets();
        setPresentationCapture(false);
        window.dispatchEvent(new CustomEvent("dioris:render-show-editor"));
        usePlannerStore.getState().selectFurnitureInstance(previousSelectedId);
        window.dispatchEvent(new CustomEvent("dioris:render-status", { detail: { kind: "error", message: error instanceof Error ? error.message : "Falha ao preparar render." } }));
      }
    };

    const handleVideo = (event: Event) => {
      if (videoRef.current) return;
      const request = (event as CustomEvent<RenderVideoRequest>).detail;
      const canvas = gl.domElement;
      if (!("captureStream" in canvas) || typeof MediaRecorder === "undefined") {
        window.dispatchEvent(new CustomEvent("dioris:render-status", { detail: { kind: "error", message: "Exportação de vídeo não suportada neste navegador; WebM indisponível." } }));
        return;
      }
      const previousSize = gl.getSize(new THREE.Vector2());
      const previousPixelRatio = gl.getPixelRatio();
      const previousAspect = camera instanceof THREE.PerspectiveCamera ? camera.aspect : null;
      const previousSelectedId = usePlannerStore.getState().selectedId;
      setPresentationCapture(true);
      window.dispatchEvent(new CustomEvent("dioris:render-hide-editor"));
      usePlannerStore.getState().selectFurnitureInstance(null);
      gl.setPixelRatio(1);
      gl.setSize(1280, 720, false);
      if (camera instanceof THREE.PerspectiveCamera) {
        camera.aspect = 16 / 9;
        camera.updateProjectionMatrix();
      }
      const stream = canvas.captureStream(30);
      const mimeType = ["video/webm;codecs=vp9", "video/webm;codecs=vp8", "video/webm"].find((type) => MediaRecorder.isTypeSupported(type));
      if (!mimeType) {
        window.dispatchEvent(new CustomEvent("dioris:render-status", { detail: { kind: "error", message: "Nenhum codec WebM suportado para exportação." } }));
        stream.getTracks().forEach((track) => track.stop());
        gl.setPixelRatio(previousPixelRatio);
        gl.setSize(previousSize.x, previousSize.y, false);
        if (camera instanceof THREE.PerspectiveCamera && previousAspect !== null) { camera.aspect = previousAspect; camera.updateProjectionMatrix(); }
        usePlannerStore.getState().selectFurnitureInstance(previousSelectedId);
        setPresentationCapture(false);
        window.dispatchEvent(new CustomEvent("dioris:render-show-editor"));
        return;
      }
      const chunks: Blob[] = [];
      const durationMs = request.durationMs ?? (request.preset === "quick" ? 6000 : request.preset === "client" ? 12000 : 9000);
      const recorder = new MediaRecorder(stream, { mimeType, videoBitsPerSecond: request.preset === "client" ? 8_000_000 : 5_000_000 });
      recorder.ondataavailable = (dataEvent) => { if (dataEvent.data.size > 0) chunks.push(dataEvent.data); };
      recorder.onstop = () => {
        downloadBlob(new Blob(chunks, { type: mimeType }), `golden-kitchen-tour-v10-${request.preset}.webm`);
        stream.getTracks().forEach((track) => track.stop());
        gl.setPixelRatio(previousPixelRatio);
        gl.setSize(previousSize.x, previousSize.y, false);
        if (camera instanceof THREE.PerspectiveCamera && previousAspect !== null) { camera.aspect = previousAspect; camera.updateProjectionMatrix(); }
        usePlannerStore.getState().selectFurnitureInstance(previousSelectedId);
        setPresentationCapture(false);
        window.dispatchEvent(new CustomEvent("dioris:render-show-editor"));
        videoRef.current = null;
        window.dispatchEvent(new CustomEvent("dioris:render-status", { detail: { kind: "success", message: "Vídeo WebM real exportado em 1280×720." } }));
      };
      recorder.onerror = () => {
        videoRef.current = null;
        stream.getTracks().forEach((track) => track.stop());
        gl.setPixelRatio(previousPixelRatio);
        gl.setSize(previousSize.x, previousSize.y, false);
        if (camera instanceof THREE.PerspectiveCamera && previousAspect !== null) { camera.aspect = previousAspect; camera.updateProjectionMatrix(); }
        usePlannerStore.getState().selectFurnitureInstance(previousSelectedId);
        setPresentationCapture(false);
        window.dispatchEvent(new CustomEvent("dioris:render-show-editor"));
        window.dispatchEvent(new CustomEvent("dioris:render-status", { detail: { kind: "error", message: "MediaRecorder falhou durante a exportação WebM." } }));
      };
      videoRef.current = { recorder, startedAt: performance.now(), durationMs, view: "overview", stream, previousSize, previousPixelRatio, previousAspect, previousSelectedId };
      recorder.start(250);
      window.dispatchEvent(new CustomEvent("dioris:render-status", { detail: { kind: "progress", message: `Tour ${request.preset} iniciado; exportação em WebM.` } }));
    };

    window.addEventListener("dioris:render-image", handleImage);
    window.addEventListener("dioris:render-video", handleVideo);
    const query = typeof window !== "undefined" ? new URLSearchParams(window.location.search) : null;
    const autoCapture = query?.get("v10autocapture") === "1";
    const requestedView = query?.get("v10view");
    const autoView: RenderView = requestedView === "front" || requestedView === "three-quarter-left" || requestedView === "three-quarter-right" || requestedView === "island" || requestedView === "detail" || requestedView === "overview" || requestedView === "top" || requestedView === "lateral" ? requestedView : "front";
    const goldenModule = query?.get("goldenmodule") === "1";
    const goldenOpen = query?.get("goldenopen") === "1";
    const openAll = query?.get("v10open") === "1";
    const autoVideo = query?.get("v10video") as RenderVideoRequest["preset"] | null;
    const autoCaptureTimer = autoCapture ? window.setTimeout(() => {
      if (openAll) usePlannerStore.getState().openAllAnimations();
      else if (goldenModule && goldenOpen) {
        const id = usePlannerStore.getState().instances[0]?.id;
        if (id) usePlannerStore.getState().toggleInstanceAnimation(id);
      }
      if (autoVideo === "quick" || autoVideo === "professional" || autoVideo === "client") {
        window.dispatchEvent(new CustomEvent("dioris:render-video", { detail: { preset: autoVideo } }));
      } else {
        window.dispatchEvent(new CustomEvent("dioris:render-image", { detail: { view: autoView, quality: "quick", width: 1280, height: 720 } }));
      }
    }, 5200) : undefined;
    return () => {
      if (autoCaptureTimer) window.clearTimeout(autoCaptureTimer);
      window.removeEventListener("dioris:render-image", handleImage);
      window.removeEventListener("dioris:render-video", handleVideo);
      if (videoRef.current) videoRef.current.recorder.stop();
    };
  }, [camera, gl, invalidate, scene]);

  useFrame(() => {
    const session = videoRef.current;
    if (!session) return;
    const elapsed = performance.now() - session.startedAt;
    const progress = Math.min(elapsed / session.durationMs, 1);
    const angle = progress * Math.PI * 2.2;
    const radius = 5.6 - progress * 1.4;
      camera.position.set(Math.sin(angle) * radius, 1.55 + Math.sin(progress * Math.PI) * 0.55, Math.cos(angle) * radius + 0.3);
      VIEW_TARGET.set(0, 1.05, -0.58);
      camera.lookAt(VIEW_TARGET);
    if (camera instanceof THREE.PerspectiveCamera || camera instanceof THREE.OrthographicCamera) camera.updateProjectionMatrix();
    invalidate();
    if (progress >= 1) session.recorder.stop();
  });

  return null;
}
