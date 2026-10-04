import * as THREE from 'three';

/** Adapt final pixels, including procedural shaders and texture-based hand seals.
 * Authored colors and animation uniforms stay intact when the theme changes. */
export function installThemeMaterials(renderer: THREE.WebGLRenderer) {
  const mode = { value: 0 };
  const viewport = new THREE.Vector2();
  const materials = new WeakMap<THREE.Material, { blending: THREE.Blending; light: boolean }>();
  const render = renderer.render.bind(renderer);
  renderer.render = (scene, camera) => {
    const light = document.documentElement.dataset.theme === 'light';
    mode.value = light ? 1 : 0;
    renderer.getSize(viewport);
    scene.traverseVisible(node => {
      if (node.name === 'ground-shadow') return;
      const drawable = node as THREE.Mesh;
      if (!drawable.material) return;
      for (const material of Array.isArray(drawable.material) ? drawable.material : [drawable.material]) {
        const outlineViewport = material.userData.lightCharacterOutline as THREE.Vector2 | undefined;
        if (outlineViewport) {
          outlineViewport.copy(viewport);
          material.visible = light;
          continue;
        }
        let state = materials.get(material);
        if (!state) {
          state = { blending: material.blending, light: !light };
          materials.set(material, state);
          const compile = material.onBeforeCompile;
          const cacheKey = material.customProgramCacheKey.bind(material);
          const originalKey = cacheKey();
          const preserveColor = material.userData.preserveLightCharacterColor === true;
          material.onBeforeCompile = (shader, context) => {
            compile.call(material, shader, context);
            shader.uniforms.uPortfolioLight = mode;
            shader.fragmentShader = `uniform float uPortfolioLight;\n${shader.fragmentShader}`
              .replace(/}\s*$/, `
                float folioLuma = dot(gl_FragColor.rgb, vec3(.2126, .7152, .0722));
                if (uPortfolioLight > .5) {
                  // Pigment remains visible on paper; additive light cannot darken it.
                  ${preserveColor ? '' : 'gl_FragColor.rgb *= min(1.0, .42 / max(folioLuma, .001));'}
                } else if (folioLuma > .015) {
                  // Lift dark elemental silhouettes without filling black texture edges.
                  gl_FragColor.rgb *= max(1.0, .30 / folioLuma);
                }
              }`);
          };
          material.customProgramCacheKey = () => `${originalKey}-portfolio-contrast-v2-${preserveColor}`;
          material.needsUpdate = true;
        }
        if (state.light !== light) {
          material.blending = light && state.blending === THREE.AdditiveBlending
            ? THREE.NormalBlending : state.blending;
          state.light = light;
          material.needsUpdate = true;
        }
      }
    });
    render(scene, camera);
  };
}
