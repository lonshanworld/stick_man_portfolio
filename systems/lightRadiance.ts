import * as THREE from 'three';

/** Light-only optical sheet: continuous radiance with a white core and spectral fringe.
 * Crossed sheets retain their silhouette from the side; no solid shards or noisy energy. */
export function createLightRay(length: number, width: number, opacity = .7, feather = false) {
  const material = new THREE.ShaderMaterial({
    uniforms: { uTime: { value: 0 }, uOpacity: { value: opacity } },
    vertexShader: `varying vec2 vUv; void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}`,
    fragmentShader: `varying vec2 vUv; uniform float uTime,uOpacity;
      void main(){
        float edge=abs(vUv.x-.5)*2.0;
        float core=exp(-edge*edge*38.0);
        float soft=pow(max(0.0,1.0-edge),2.0);
        float ends=smoothstep(0.0,.08,vUv.y)*(1.0-smoothstep(.78,1.0,vUv.y));
        vec3 fringe=mix(vec3(.69,.85,1.0),vec3(1.0,.78,.40),vUv.x);
        vec3 color=mix(fringe,vec3(1.0,.98,.89),.55+core*.45);
        float breath=.93+.07*sin(uTime*2.0+vUv.y*3.0);
        gl_FragColor=vec4(color,(soft*.36+core*.64)*ends*uOpacity*breath);
      }`,
    transparent: true, depthWrite: false, side: THREE.DoubleSide,
    blending: THREE.AdditiveBlending, toneMapped: false,
  });
  material.userData.opacity = opacity;
  material.userData.element = 'light';
  const root = new THREE.Group(); root.name = feather ? 'radiant-feather' : 'optical-sunbeam';
  const geometry = new THREE.PlaneGeometry(width, length, 1, 24);
  const positions = geometry.attributes.position;
  for (let i = 0; i < positions.count; i++) {
    const p = THREE.MathUtils.clamp((positions.getY(i) + length / 2) / length, 0, 1);
    const taper = feather ? Math.pow(Math.max(0, Math.sin(Math.PI * p)), .7) : .3 + p * .7;
    positions.setXYZ(i, positions.getX(i) * taper, p * length,
      feather ? Math.sin(p * Math.PI) * length * .08 : 0);
  }
  geometry.computeBoundingSphere();
  for (const rotation of [0, Math.PI / 2]) {
    const sheet = new THREE.Mesh(geometry, material); sheet.rotation.y = rotation;
    sheet.renderOrder = 4; root.add(sheet);
  }
  return { root, material };
}

/** A stationary photographic corona; tapered rays replace solid cones and orbiting rings. */
export function createLightCorona(radius = .22) {
  const root = new THREE.Group(); root.name = 'solar-radiance-corona';
  const rays = Array.from({ length: 16 }, (_, i) => {
    const ray = createLightRay(radius * (i % 4 === 0 ? 1.8 : 1.05), radius * .24, .8);
    const a = i * Math.PI / 8;
    ray.root.rotation.z = a; root.add(ray.root); return ray;
  });
  return { root, materials: rays.map(ray => ray.material), update: (time: number, opacity = 1) => {
    rays.forEach((ray, i) => { ray.material.uniforms.uTime.value = time;
      ray.material.uniforms.uOpacity.value = opacity * (.55 + .2 * Math.sin(time * 1.8 + i * .7)); });
  } };
}

export function createLightPalm(facingTarget: THREE.Object3D) {
  const corona = createLightCorona(.28);
  const root = corona.root; root.name = 'hand-magic-seal-light'; root.visible = false;
  root.userData.lightSeal = { facingTarget, activation: 0, update: corona.update };
  return root;
}
