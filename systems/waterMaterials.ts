import * as THREE from 'three';

export type WaterSurfaceKind = 'flow' | 'crest' | 'pool' | 'shield' | 'drop';

/** Moving caustics, pale reflected highlights, deep water, and soft translucent edges. */
export function createWaterMaterial(kind: WaterSurfaceKind = 'flow', amplitude = .25) {
  const material = new THREE.ShaderMaterial({
    uniforms: { uTime: { value: 0 }, uOpacity: { value: 1 }, uAmplitude: { value: amplitude } },
    vertexShader: `varying vec2 vUv; varying vec3 vPosition,vNormal,vView; uniform float uTime,uAmplitude;
      void main(){vUv=uv;vPosition=position;vNormal=normalMatrix*normal;
        float ripple=sin(position.x*.21+uTime*2.8)*cos(position.z*.19-uTime*1.9);
        vec3 p=position+normal*ripple*uAmplitude;
        vec4 view=modelViewMatrix*vec4(p,1.);vView=-view.xyz;gl_Position=projectionMatrix*view;}`,
    fragmentShader: `varying vec2 vUv; varying vec3 vPosition,vNormal,vView; uniform float uTime,uOpacity;
      float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
      float n2(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);
        return mix(mix(hash(i),hash(i+vec2(1,0)),f.x),mix(hash(i+vec2(0,1)),hash(i+vec2(1,1)),f.x),f.y);}
      void main(){
        vec2 flow=vUv*vec2(9.,13.)+vec2(uTime*.3,-uTime*.65);
        float n=n2(flow);
        float caustic=pow(1.-abs(sin(flow.x*2.1+n*3.)*cos(flow.y*1.9+n*2.)),14.);
        vec3 normal=normalize(vNormal),eye=normalize(vView);
        float facing=abs(dot(normal,eye)),fresnel=pow(1.-facing,2.);
        float reflected=pow(max(0.,abs(dot(normal,normalize(vec3(-.4,.8,.6))))),24.);
        vec3 color=mix(vec3(.012,.16,.29),vec3(.025,.56,.64),n*.55+fresnel*.45);
        color+=vec3(.22,.57,.56)*caustic*.5+vec3(.58,.88,.86)*reflected*.65;
        float alpha=.42+fresnel*.36;
        ${kind === 'crest' ? `float foam=smoothstep(.65,.91,vUv.y)*smoothstep(.36,.64,n2(vUv*vec2(38.,19.)-vec2(uTime*1.5,uTime*2.)));
          color=mix(color,vec3(.78,.96,.91),foam*.9);alpha=max(alpha,foam*.92);
          alpha*=smoothstep(0.,.05,vUv.x)*(1.-smoothstep(.95,1.,vUv.x));` : ''}
        ${kind === 'pool' ? `vec2 p=vUv*2.-1.;float r=length(p);float ring=pow(.5+.5*sin(r*34.-uTime*7.+n*.8),12.);
          color+=vec3(.19,.5,.47)*ring;alpha*=1.-smoothstep(.85,1.,r);` : ''}
        ${kind === 'shield' ? `float circulation=pow(.5+.5*sin(vUv.y*29.+vUv.x*18.-uTime*4.+n*4.),14.);
          color+=vec3(.17,.47,.45)*circulation;alpha=.24+fresnel*.48+circulation*.2;` : ''}
        ${kind === 'drop' ? `color+=vec3(.28,.5,.49)*reflected;alpha=.65+fresnel*.3;` : ''}
        gl_FragColor=vec4(color,alpha*uOpacity);
        #include <colorspace_fragment>
      }`,
    transparent: true, depthWrite: false, side: THREE.DoubleSide, toneMapped: false,
  });
  material.userData.element = 'water'; material.userData.opacity = 1;
  return material;
}

/** Marina's power is a flowing open crest with orbiting water beads, not a rigid cone crown. */
export function createWaterCrown() {
  const root = new THREE.Group(), material = createWaterMaterial('flow', .009);
  const points = Array.from({ length: 40 }, (_, i) => {
    const a = i / 39 * Math.PI * 1.7;
    return new THREE.Vector3(Math.cos(a) * .19, .14 + Math.sin(a) * .045, Math.sin(a) * .15);
  });
  root.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points), 48, .023, 8, false), material));
  for (const side of [-1, 1]) {
    const crest = Array.from({ length: 24 }, (_, i) => { const u = i / 23, a = u * Math.PI * 1.5;
      return new THREE.Vector3(side * (.07 + (1 - Math.cos(a)) * .05), .14 + Math.sin(a) * .12 + u * .12, -.055 - u * .06); });
    root.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(crest), 32, .018, 8, false), material));
  }
  const beads = Array.from({ length: 6 }, () => {
    const bead = new THREE.Mesh(new THREE.SphereGeometry(.021, 10, 8), material);
    bead.scale.set(.8, 1.3, .8); root.add(bead); return bead;
  });
  const update = (time: number) => {
    material.uniforms.uTime.value = time;
    beads.forEach((bead, i) => { const a = i * Math.PI / 3 + time * .8;
      bead.position.set(Math.cos(a) * .22, .17 + Math.sin(a * 2 + time) * .055, Math.sin(a) * .19); });
  };
  update(0); return { root, update };
}
