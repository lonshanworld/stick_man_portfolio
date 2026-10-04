import * as THREE from 'three';

export type TreePoint = [number, number, number];
export const treeNoise = (seed: number) => { const n = Math.sin(seed * 127.1 + 311.7) * 43758.5453; return n - Math.floor(n); };

/** Wood has longitudinal furrows and knots, rather than energy filaments. */
export function createBarkMaterial(color = '#755037', opacity = 1) {
  const material = new THREE.ShaderMaterial({
    uniforms: { uTime: { value: 0 }, uOpacity: { value: opacity }, uColor: { value: new THREE.Color(color) } },
    vertexShader: `varying vec2 vUv;varying vec3 vN;
      void main(){vUv=uv;vN=normalize(normalMatrix*normal);gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,
    fragmentShader: `varying vec2 vUv;varying vec3 vN;uniform vec3 uColor;uniform float uOpacity;
      void main(){float groove=pow(.5+.5*sin(vUv.x*39.+sin(vUv.y*9.+vUv.x*6.)*1.4),3.);
        float knot=exp(-length((vUv-vec2(.42,.57))*vec2(15.,9.)));
        float light=.55+.45*max(0.,dot(normalize(vN),normalize(vec3(-.4,.7,1.))));
        gl_FragColor=vec4(uColor*(.68+groove*.37-knot*.15)*light,uOpacity);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }`,
    transparent: true, depthWrite: true, side: THREE.DoubleSide,
  });
  material.userData.element = 'trees'; material.userData.opacity = opacity; return material;
}

/** Keep character palette/material contracts while carving grain into its wood. */
export function carveCharacterBark(material: THREE.MeshStandardMaterial) {
  material.onBeforeCompile = shader => {
    shader.vertexShader = 'varying vec2 vTreeBarkUv;\n' + shader.vertexShader;
    shader.vertexShader = shader.vertexShader.replace('#include <uv_vertex>', '#include <uv_vertex>\nvTreeBarkUv=uv;');
    shader.fragmentShader = 'varying vec2 vTreeBarkUv;\n' + shader.fragmentShader;
    shader.fragmentShader = shader.fragmentShader.replace('#include <color_fragment>', `#include <color_fragment>
      float treeGrain=pow(.5+.5*sin(vTreeBarkUv.x*44.+sin(vTreeBarkUv.y*10.)*1.3),3.);
      diffuseColor.rgb*=.74+treeGrain*.26;`);
  };
  material.customProgramCacheKey = () => 'trees-carved-bark-v1';
  return material;
}

export function createLeafMaterial(color = '#69A742', opacity = 1) {
  const material = new THREE.ShaderMaterial({
    uniforms: { uTime: { value: 0 }, uOpacity: { value: opacity }, uColor: { value: new THREE.Color(color) } },
    vertexShader: `varying vec2 vUv;varying vec3 vN;uniform float uTime;
      void main(){vUv=uv;vec3 p=position;p.z+=sin(uTime*2.+uv.x*3.)*uv.x*uv.x*position.y*.09;
        vec3 n=normal;
        #ifdef USE_INSTANCING
          p=(instanceMatrix*vec4(p,1.)).xyz;n=mat3(instanceMatrix)*n;
        #endif
        vN=normalize(normalMatrix*n);gl_Position=projectionMatrix*modelViewMatrix*vec4(p,1.);}`,
    fragmentShader: `varying vec2 vUv;varying vec3 vN;uniform vec3 uColor;uniform float uOpacity;
      void main(){float rib=exp(-abs(vUv.y-.5)*55.);
        float veins=pow(.5+.5*sin(vUv.x*24.-abs(vUv.y-.5)*17.),14.);
        float light=.65+.35*abs(dot(normalize(vN),normalize(vec3(-.4,.7,1.))));
        vec3 color=mix(uColor,uColor*1.3+vec3(.08,.08,.015),rib*.55+veins*.12);
        gl_FragColor=vec4(color*light,uOpacity);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }`,
    transparent: true, depthWrite: true, side: THREE.DoubleSide,
  });
  material.userData.element = 'trees'; material.userData.opacity = opacity; return material;
}

/** Curved ovate blade with a raised midrib and a tapered petiole. */
export function createTreeLeafGeometry(size = 1) {
  const positions: number[] = [], uv: number[] = [], indices: number[] = [];
  for (let i = 0; i <= 10; i++) {
    const u = i / 10, width = Math.sin(u * Math.PI) * .34 * size;
    for (let j = 0; j < 3; j++) {
      positions.push((j - 1) * width, u * size, Math.sin(u * Math.PI) * size * (j === 1 ? .12 : .04));
      uv.push(u, j / 2);
      if (i < 10 && j < 2) { const a = i * 3 + j; indices.push(a, a + 1, a + 3, a + 1, a + 4, a + 3); }
    }
  }
  const geometry = new THREE.BufferGeometry(); geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); geometry.setIndex(indices); geometry.computeVertexNormals(); return geometry;
}

/** A tapered round wooden branch. Growth reuses its original GPU buffers. */
export function createTreeBranch(path: (u: number) => TreePoint, radius: number, material: THREE.ShaderMaterial, segments = 28) {
  const sides = 7, positions = new Float32Array((segments + 1) * (sides + 1) * 3), normals = new Float32Array(positions.length);
  const uv = new Float32Array((segments + 1) * (sides + 1) * 2), indices: number[] = [];
  for (let i = 0; i <= segments; i++) for (let j = 0; j <= sides; j++) {
    uv.set([j / sides, i / segments], (i * (sides + 1) + j) * 2);
    if (i < segments && j < sides) { const a = i * (sides + 1) + j; indices.push(a, a + 1, a + sides + 1, a + 1, a + sides + 2, a + sides + 1); }
  }
  const geometry = new THREE.BufferGeometry(); geometry.setIndex(indices);
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3).setUsage(THREE.DynamicDrawUsage));
  geometry.setAttribute('normal', new THREE.BufferAttribute(normals, 3).setUsage(THREE.DynamicDrawUsage));
  geometry.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
  const root = new THREE.Mesh(geometry, material); root.name = 'tree-wood-branch'; root.frustumCulled = false;
  const tangent = new THREE.Vector3(), across = new THREE.Vector3(), other = new THREE.Vector3(), up = new THREE.Vector3(0, 1, 0), right = new THREE.Vector3(1, 0, 0);
  const update = (growth = 1) => {
    const g = THREE.MathUtils.clamp(growth, 0, 1); root.visible = g > .002;
    for (let i = 0; i <= segments; i++) {
      const u = i / segments * g, p = path(u), q = path(Math.min(1, u + .002)), prev = u > .998 ? path(u - .002) : p;
      tangent.set(q[0] - prev[0], q[1] - prev[1], q[2] - prev[2]).normalize(); if (tangent.lengthSq() < .001) tangent.set(0, 1, 0);
      across.crossVectors(tangent, Math.abs(tangent.y) > .95 ? right : up).normalize(); other.crossVectors(tangent, across);
      const width = radius * (.08 + .92 * Math.pow(1 - u, .65)) * Math.min(1, g * 4);
      for (let j = 0; j <= sides; j++) {
        const a = j / sides * Math.PI * 2, k = (i * (sides + 1) + j) * 3;
        const nx = across.x * Math.cos(a) + other.x * Math.sin(a), ny = across.y * Math.cos(a) + other.y * Math.sin(a), nz = across.z * Math.cos(a) + other.z * Math.sin(a);
        positions[k] = p[0] + nx * width; positions[k + 1] = p[1] + ny * width; positions[k + 2] = p[2] + nz * width;
        normals[k] = nx; normals[k + 1] = ny; normals[k + 2] = nz;
      }
    }
    geometry.attributes.position.needsUpdate = geometry.attributes.normal.needsUpdate = true;
  };
  update(); return { root, update };
}

/** Leaves are distributed on branching tips, with no spherical canopy stand-ins. */
export function createLeafCluster(center: TreePoint, radius: number, leafSize: number, material: THREE.ShaderMaterial, count = 18, seed = 0) {
  const root = new THREE.InstancedMesh(createTreeLeafGeometry(), material, count); root.name = 'tree-leaf-canopy'; root.frustumCulled = false;
  const matrix = new THREE.Matrix4(), position = new THREE.Vector3(), quaternion = new THREE.Quaternion(), scale = new THREE.Vector3();
  for (let i = 0; i < count; i++) {
    const angle = i * 2.399 + seed, y = (treeNoise(i + seed) - .5) * radius;
    const r = radius * (.25 + treeNoise(i + seed + 9) * .65);
    position.set(center[0] + Math.cos(angle) * r, center[1] + y, center[2] + Math.sin(angle) * r);
    quaternion.setFromEuler(new THREE.Euler(treeNoise(i + 3) * 1.8 - .9, angle, Math.cos(angle) * .9));
    scale.setScalar(leafSize * (.7 + treeNoise(i + seed + 4) * .5)); matrix.compose(position, quaternion, scale); root.setMatrixAt(i, matrix);
  }
  root.instanceMatrix.needsUpdate = true; return root;
}

/** Groot's head shoots branch from his carved crown, with unfurling foliage. */
export function createTreeCrest() {
  const root = new THREE.Group(); root.name = 'tree-branch-crown';
  const bark = createBarkMaterial('#69442B'), leaf = createLeafMaterial('#78B449');
  const leaves: THREE.Mesh[] = [];
  for (let i = 0; i < 5; i++) {
    const angle = i * Math.PI * 2 / 5, height = .13 + treeNoise(i) * .1;
    const shoot = createTreeBranch(u => [Math.cos(angle) * (.08 + u * .07), .09 + u * height, Math.sin(angle) * (.08 + u * .07)], .023, bark, 14);
    root.add(shoot.root);
    for (let j = 0; j < 2; j++) {
      const foliage = new THREE.Mesh(createTreeLeafGeometry(.09), leaf);
      foliage.position.set(Math.cos(angle) * .13, .12 + height * (.5 + j * .4), Math.sin(angle) * .13);
      foliage.rotation.set(.4, angle, (j ? -1 : 1) * .7); root.add(foliage); leaves.push(foliage);
    }
  }
  return { root, update: (time: number) => { leaf.uniforms.uTime.value = time; leaves.forEach((foliage, i) => { foliage.rotation.z = (i % 2 ? -.7 : .7) + Math.sin(time * 1.8 + i) * .12; }); } };
}

export function createTreePalm(facingTarget: THREE.Object3D) {
  const root = new THREE.Group(); root.name = 'hand-magic-seal-trees'; root.visible = false;
  const bark = createBarkMaterial('#805537', 0), leaf = createLeafMaterial('#83BC48', 0);
  const shoots = [-1, 1].map(side => {
    const shoot = createTreeBranch(u => [side * Math.sin(u * Math.PI * .7) * .13, -.08 + u * .29, Math.sin(u * Math.PI) * .025], .014, bark, 18);
    root.add(shoot.root); return shoot;
  });
  for (let i = 0; i < 6; i++) {
    const foliage = new THREE.Mesh(createTreeLeafGeometry(.085), leaf);
    foliage.position.set((i % 2 ? 1 : -1) * .11, -.03 + Math.floor(i / 2) * .075, .02);
    foliage.rotation.z = (i % 2 ? -1 : 1) * .8; root.add(foliage);
  }
  root.userData.treeSeal = { facingTarget, materials: [bark, leaf], shoots, activation: 0 }; return root;
}
