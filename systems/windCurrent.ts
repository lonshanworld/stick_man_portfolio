import * as THREE from 'three';

export type WindPoint = [number, number, number];

/** Wind is visible through pressure streaks and suspended mist, rather than luminous tubes. */
export function createWindMaterial(opacity = .6, fog = false) {
  const material = new THREE.ShaderMaterial({
    uniforms: { uTime: { value: 0 }, uOpacity: { value: opacity }, uFog: { value: fog ? 1 : 0 } },
    vertexShader: `varying vec2 vUv;uniform float uTime,uFog;
      void main(){vUv=uv;vec3 p=position;
        p.x+=uFog*sin(p.y*.07+uTime*2.)*uv.y*2.;p.z+=uFog*cos(p.y*.09+uTime*2.)*uv.y*2.;
        gl_Position=projectionMatrix*modelViewMatrix*vec4(p,1.);}`,
    fragmentShader: `varying vec2 vUv;uniform float uTime,uOpacity,uFog;
      void main(){float across=sin(vUv.y*3.141593);
        float core=exp(-abs(vUv.y-.5)*20.);
        float filaments=pow(.5+.5*sin(vUv.y*62.+sin(vUv.x*14.-uTime*4.)*1.4),8.);
        float flow=.5+.5*sin(vUv.x*35.-uTime*8.+vUv.y*9.);
        float ends=pow(max(0.,sin(vUv.x*3.141593)),.7);
        float stream=(.34+core*.6+filaments*.25)*across*ends*(.72+flow*.28);
        float swirl=pow(.5+.5*sin(vUv.x*25.+vUv.y*37.-uTime*7.),5.);
        float mist=(.18+swirl*.4)*sin(vUv.y*3.141593);
        vec3 color=mix(vec3(.67,.83,.77),vec3(.96,1.,.98),clamp(core+filaments*.3+uFog*.3,0.,1.));
        gl_FragColor=vec4(color,mix(stream,mist,uFog)*uOpacity);}`,
    transparent: true, depthWrite: false, side: THREE.DoubleSide, toneMapped: false,
  });
  material.userData.element = 'wind'; material.userData.opacity = opacity; return material;
}

/** Crossed, tapered sheets keep a flowing current readable from any camera angle. */
export function createWindCurrent(path: (u: number, time: number) => WindPoint, width: number, opacity = .6, segments = 56) {
  const positions = new Float32Array((segments + 1) * 12), uv = new Float32Array((segments + 1) * 8), indices: number[] = [];
  for (let i = 0; i <= segments; i++) {
    uv.set([i/segments,0,i/segments,1,i/segments,0,i/segments,1], i*8);
    if (i < segments) for (const plane of [0,2]) { const a = i*4+plane; indices.push(a,a+1,a+4,a+1,a+5,a+4); }
  }
  const geometry = new THREE.BufferGeometry(); geometry.setIndex(indices);
  geometry.setAttribute('position',new THREE.BufferAttribute(positions,3).setUsage(THREE.DynamicDrawUsage));
  geometry.setAttribute('uv',new THREE.BufferAttribute(uv,2));
  const material = createWindMaterial(opacity), root = new THREE.Mesh(geometry, material); root.frustumCulled = false;
  const tangent = new THREE.Vector3(), across = new THREE.Vector3(), other = new THREE.Vector3(), up = new THREE.Vector3(0,1,0), right = new THREE.Vector3(1,0,0);
  const update = (time: number) => {
    material.uniforms.uTime.value = time;
    for (let i = 0; i <= segments; i++) {
      const u=i/segments,p=path(u,time),q=path(Math.min(1,u+.002),time),previous=i===segments?path(u-.002,time):p;
      tangent.set(q[0]-previous[0],q[1]-previous[1],q[2]-previous[2]).normalize(); if(tangent.lengthSq()<.01)tangent.set(0,0,1);
      across.crossVectors(tangent,Math.abs(tangent.y)>.95?right:up).normalize(); other.crossVectors(tangent,across);
      const radius=width*(.06+.94*Math.sin(u*Math.PI));
      for(let j=0;j<4;j++){const direction=j<2?across:other,sign=j%2?1:-1,k=(i*4+j)*3;
        positions[k]=p[0]+direction.x*radius*sign;positions[k+1]=p[1]+direction.y*radius*sign;positions[k+2]=p[2]+direction.z*radius*sign;}
    }
    geometry.attributes.position.needsUpdate=true;
  };
  update(0); return { root, material, update };
}

export function createWindCrest() {
  const root = new THREE.Group();
  const currents = Array.from({length:3},(_,i)=>createWindCurrent((u,t)=>{
    const a=u*Math.PI*2.2-t*(1.8+i*.2)+i*2.1,r=.13+u*.13;
    return [Math.cos(a)*r,.13+u*.24+Math.sin(t*1.7+u*6.)*.025,Math.sin(a)*r];
  },.035,.85,40));
  currents.forEach(current=>root.add(current.root));
  return { root, update:(time:number)=>currents.forEach(current=>current.update(time)) };
}
