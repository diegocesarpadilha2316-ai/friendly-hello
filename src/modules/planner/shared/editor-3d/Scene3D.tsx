function FurnitureRuntimeEvidence({
  f,
  renderer,
  autoFitVersion,
  viewport,
}: {
  f: FurnitureDescriptor;
  renderer: string;
  autoFitVersion: number;
  viewport: Viewport3DState;
}) {
  const { camera } = useThree();
  useEffect(() => {
    let frame = 0;
    let retry = 0;
    let timer = 0;
    const common = {
      id: f.id,
      subtype: f.subtype,
      catalogItemId: f.catalogItemId,
      params: f.params,
      widthMm: Math.round(f.width * 1000),
      heightMm: Math.round(f.height * 1000),
      depthMm: Math.round(f.depth * 1000),
    };
    let pieces = 1;
    if (renderer === "wardrobe") pieces = buildWardrobe(wardrobeSpecFromLegacy(common)).assembly.pieces.length;
    else if (renderer === "kitchen") pieces = buildKitchenModule(kitchenSpecFromLegacy(common)).assembly.pieces.length;
    else if (renderer === "bathroom") pieces = buildBathroomModule(bathroomFromLegacy(common)).assembly.pieces.length;
    else if (renderer === "laundry") pieces = buildLaundryModule(laundryFromLegacy(common)).assembly.pieces.length;
    else if (renderer === "decor" || renderer === "appliance") pieces = 1;

    const report = () => {
      camera.updateMatrixWorld();
      const scene = camera.parent as THREE.Scene;
      if (!scene) return;

      const obj = scene.getObjectByName(`furniture-${f.id}`);
      let visible = false;
      let scaleValid = false;
      let withinBounds = true; 
      let aboveFloor = true;
      let notBehindCamera = true;
      let framed = false;
      let pieceCount = 0;

      if (obj) {
        visible = obj.visible;
        
        const worldScale = new THREE.Vector3();
        obj.getWorldScale(worldScale);
        scaleValid = worldScale.x > 0.001 && worldScale.y > 0.001 && worldScale.z > 0.001;

        const worldPos = new THREE.Vector3();
        obj.getWorldPosition(worldPos);
        aboveFloor = worldPos.y >= -0.05;

        obj.traverse((child) => {
          if ((child as THREE.Mesh).isMesh && (child as THREE.Mesh).geometry) {
            const role = (child.userData as any)?.role;
            if (role !== "validation" && role !== "auxiliary" && role !== "tecnico") {
              pieceCount++;
            }
          }
        });

        const box = new THREE.Box3().setFromObject(obj);
        const center = box.getCenter(new THREE.Vector3());
        const sphere = box.getBoundingSphere(new THREE.Sphere());

        const toObj = center.clone().sub(camera.position);
        const camDir = new THREE.Vector3();
        camera.getWorldDirection(camDir);
        notBehindCamera = toObj.dot(camDir) > 0;

        const frustum = new THREE.Frustum();
        frustum.setFromProjectionMatrix(new THREE.Matrix4().multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse));
        framed = frustum.intersectsSphere(sphere);
        
        if (viewport.sectionHeight != null) {
          if (worldPos.y > (viewport.sectionHeight / 1000)) visible = false;
        }

        if (f.subtype === "volume-tecnico" || (f.params as any)?.role === "validation" || (f.params as any)?.role === "auxiliary") {
          visible = false;
        }
      }

      const physicalPieces = pieceCount || pieces;
      const physicalValid = physicalPieces > 0;

      reportSceneRuntime({ 
        itemId: f.id, 
        renderer, 
        pieces: physicalPieces, 
        visible: visible && physicalValid, 
        framed, 
        scaleValid,
        withinBounds,
        aboveFloor,
        notBehindCamera,
        recordedAt: Date.now() 
      });

      if ((!visible || !framed || !scaleValid || !notBehindCamera || !physicalValid) && retry < 30) {
        retry += 1;
        timer = window.setTimeout(() => {
          frame = window.requestAnimationFrame(report);
        }, 200);
      }
    };
    frame = window.requestAnimationFrame(report);
    return () => {
      window.cancelAnimationFrame(frame);
      window.clearTimeout(timer);
    };
  }, [camera, autoFitVersion, f.id, f.subtype, f.catalogItemId, f.params, f.width, f.height, f.depth, f.cx, f.cz, f.y, renderer, viewport.explode, viewport.sectionHeight]);
  return null;
}
