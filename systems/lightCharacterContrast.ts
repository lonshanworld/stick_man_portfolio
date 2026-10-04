import * as THREE from 'three';

/** Keep ivory and gold intact; a thin gold contour separates them from paper. */
export function installLightCharacterContrast(group: THREE.Group) {
  const viewport = new THREE.Vector2(1, 1);
  const outline = new THREE.MeshBasicMaterial({
    color: '#80602b', side: THREE.BackSide, toneMapped: false, visible: false,
  });
  outline.userData.lightCharacterOutline = viewport;
  outline.onBeforeCompile = shader => {
    shader.uniforms.uOutlineViewport = { value: viewport };
    shader.vertexShader = `uniform vec2 uOutlineViewport;\n${shader.vertexShader}`
      .replace('#include <project_vertex>', `#include <project_vertex>
        vec3 contourNormal = normalize(normalMatrix * normal);
        vec2 contourOffset = (projectionMatrix * vec4(contourNormal, 0.0)).xy;
        gl_Position.xy += contourOffset / max(length(contourOffset), .001)
          * gl_Position.w * 2.4 / uOutlineViewport;
      `);
  };
  outline.customProgramCacheKey = () => 'light-character-contour-v1';
  const surfaces: THREE.Mesh[] = [];
  group.traverse(node => {
    if (!(node instanceof THREE.Mesh) || node instanceof THREE.InstancedMesh) return;
    const materials = Array.isArray(node.material) ? node.material : [node.material];
    if (!materials.every(material => material.visible && !material.transparent
      && (material instanceof THREE.MeshStandardMaterial || material instanceof THREE.MeshBasicMaterial))) return;
    if (!node.geometry.getAttribute('normal') || !node.geometry.getAttribute('position')?.count) return;
    materials.forEach(material => { material.userData.preserveLightCharacterColor = true; });
    surfaces.push(node);
  });
  for (const surface of surfaces) {
    const contour = new THREE.Mesh(surface.geometry, outline);
    contour.name = 'light-character-contour';
    contour.renderOrder = -1;
    contour.raycast = () => {};
    surface.add(contour);
  }
}
