import * as THREE from 'three';

/** A solid six-sided crystal with a shoulder and pointed termination. */
export function iceCrystalGeometry(radius: number, height: number) {
  const vertices: number[] = [], uv: number[] = [];
  const ring = (i: number, y: number, r: number) => [Math.cos(i * Math.PI / 3) * r, y, Math.sin(i * Math.PI / 3) * r];
  const triangle = (a: number[], b: number[], c: number[]) => {
    vertices.push(...a, ...b, ...c); uv.push(a[0] / radius / 2 + .5, a[1] / height, b[0] / radius / 2 + .5, b[1] / height, c[0] / radius / 2 + .5, c[1] / height);
  };
  for (let i = 0; i < 6; i++) {
    const a = ring(i, 0, radius * .8), b = ring(i + 1, 0, radius * .8);
    const c = ring(i, height * .7, radius), e = ring(i + 1, height * .7, radius);
    triangle(a, c, b); triangle(b, c, e); triangle(c, [0, height, 0], e); triangle(b, [0, 0, 0], a);
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
  geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); geometry.computeVertexNormals();
  return geometry;
}

export function createIceMaterial(opacity = .9) {
  const material = new THREE.ShaderMaterial({
    uniforms: { uTime: { value: 0 }, uOpacity: { value: opacity } },
    vertexShader: `varying vec3 vNormal, vView, vPosition;
      void main(){vec4 p=modelViewMatrix*vec4(position,1.);vView=-p.xyz;vNormal=normalize(normalMatrix*normal);vPosition=position;gl_Position=projectionMatrix*p;}`,
    fragmentShader: `varying vec3 vNormal,vView,vPosition;uniform float uTime,uOpacity;
      void main(){vec3 n=normalize(vNormal);float rim=pow(1.-abs(dot(n,normalize(vView))),2.);
        float face=.5+.5*dot(n,normalize(vec3(-.4,.9,.7)));
        float vein=pow(1.-abs(sin(vPosition.y*.32+vPosition.x*.73+sin(vPosition.z*.6))),32.);
        float frost=pow(.5+.5*sin(vPosition.x*4.+vPosition.y*3.7)*sin(vPosition.z*4.7),6.);
        vec3 light=normalize(vec3(.4+sin(uTime*.6)*.12,.8,1.));
        float glint=pow(max(0.,dot(reflect(-light,n),normalize(vView))),28.);
        vec3 color=mix(vec3(.10,.23,.48),vec3(.48,.72,.93),face);
        color=mix(color,vec3(.89,.97,1.),clamp(rim*.75+vein*.3+frost*.18+glint*.8,0.,1.));
        gl_FragColor=vec4(color,uOpacity*(.78+.22*rim));}`,
    transparent: true, depthWrite: false, side: THREE.DoubleSide, toneMapped: false,
  });
  material.userData.element = 'ice'; material.userData.opacity = opacity;
  return material;
}

export function createIceCrown() {
  const root = new THREE.Group(), material = createIceMaterial();
  for (let i = 0; i < 5; i++) {
    const crystal = new THREE.Mesh(iceCrystalGeometry(.05, .26 + (2 - Math.abs(i - 2)) * .075), material);
    crystal.position.set((i - 2) * .075, .08, -.015); crystal.rotation.z = -(i - 2) * .18; root.add(crystal);
  }
  const snow = new THREE.Mesh(new THREE.OctahedronGeometry(.016), new THREE.MeshBasicMaterial({ color: '#edf6ff', transparent: true, opacity: .7 }));
  root.add(snow);
  return { root, update: (time: number) => { material.uniforms.uTime.value = time; snow.position.set(Math.sin(time * .4) * .19, .3 + Math.cos(time * .6) * .12, .08); snow.rotation.y = time * .4; } };
}
