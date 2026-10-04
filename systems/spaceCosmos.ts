import * as THREE from 'three';
import type { StickMan3DCharacter } from '../types';

export type CosmicSurface = 'blackhole' | 'wormhole' | 'metric' | 'planet';

/** Space owns continuous gravitational lensing and embedded starfields. No runes or smoke. */
export function createCosmicMaterial(kind: CosmicSurface, opacity = 1) {
  const bodies: Record<CosmicSurface, string> = {
    blackhole: `
      float horizon=.225;
      vec2 bent=p*(1.0+.065/max(r*r,.035));
      vec3 sky=stars(bent*1.8)+vec3(.045,.035,.10)*exp(-r*1.4);
      float photon=exp(-abs(r-horizon*1.055)*230.0);
      float ellipse=length(vec2(p.x,p.y*5.2));
      float disc=exp(-abs(ellipse-.49)*22.0)*(1.0-smoothstep(.82,1.0,r));
      float bands=.55+.45*sin(ellipse*160.0-a*4.0-uTime*3.0);
      float doppler=.55+.45*smoothstep(-.6,.5,p.x);
      float upper=exp(-abs(r-.35)*65.0)*smoothstep(.0,.12,p.y);
      float lower=exp(-abs(r-.29)*85.0)*smoothstep(.0,.12,-p.y)*.45;
      vec3 hot=mix(vec3(.58,.22,.10),vec3(1.0,.85,.54),doppler);
      color=sky+hot*(disc*bands*1.45+(upper+lower)*.85)+vec3(.86,.94,1.0)*photon;
      color=mix(color,vec3(.001,.002,.008),1.0-smoothstep(horizon-.004,horizon+.003,r));
      alpha=max((1.0-smoothstep(.68,.97,r))*.55,disc+photon+upper+lower);
      alpha=max(alpha,1.0-smoothstep(horizon-.01,horizon+.01,r));`,
    wormhole: `
      float depth=-log(max(r,.018));
      vec2 warped=vec2(a/6.28318+depth*.09,depth*.22-uTime*.20);
      color=stars(warped*3.0)*1.5;
      float threads=pow(.5+.5*sin(a*10.0+depth*9.0-uTime*1.4),18.0);
      float throat=exp(-r*7.0);
      float rim=exp(-abs(r-.72)*70.0);
      color+=mix(vec3(.12,.21,.52),vec3(.43,.72,.88),r)*threads*.35;
      color+=vec3(.68,.86,1.0)*rim+vec3(.01,.012,.045)*throat;
      alpha=(1.0-smoothstep(.74,.94,r))*.92+rim;`,
    metric: `
      vec2 bent=p/(1.0+.8*exp(-r*r*6.0));
      vec2 cell=abs(fract(bent*9.0+.5)-.5);
      float lines=1.0-smoothstep(.014,.034,min(cell.x,cell.y));
      color=stars(bent*2.0)+vec3(.23,.45,.63)*lines*.75;
      color+=vec3(.05,.06,.18)*(1.0-r);
      alpha=(1.0-smoothstep(.65,1.0,r))*(.10+lines*.38);`,
    planet: `
      float bands=.5+.5*sin(p.y*32.0+sin(p.x*8.0+uTime*.18)*2.0);
      float light=.35+.65*max(0.0,1.0-length(p-vec2(-.35,.38)));
      color=mix(vec3(.10,.20,.38),vec3(.53,.70,.76),bands)*light;
      float atmosphere=exp(-abs(r-.89)*60.0);
      color+=vec3(.37,.66,.85)*atmosphere;
      alpha=1.0-smoothstep(.88,.96,r);`,
  };
  const material = new THREE.ShaderMaterial({
    uniforms: { uTime: { value: 0 }, uOpacity: { value: opacity } },
    vertexShader: `varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}`,
    fragmentShader: `varying vec2 vUv;uniform float uTime,uOpacity;
      float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
      vec3 stars(vec2 uv){
        vec2 q=uv*42.0,cell=floor(q),f=fract(q)-.5;
        float seed=hash(cell);
        vec2 offset=vec2(hash(cell+3.0),hash(cell+7.0))*.6-.3;
        float star=exp(-length(f-offset)*90.0)*step(.86,seed);
        return mix(vec3(.47,.69,1.0),vec3(1.0,.87,.69),seed)*star*(.75+.25*sin(uTime+seed*32.0));
      }
      void main(){vec2 p=(vUv-.5)*2.0;float r=length(p),a=atan(p.y,p.x);
        vec3 color=vec3(0.0);float alpha=0.0;${bodies[kind]}
        gl_FragColor=vec4(color,clamp(alpha,0.0,1.0)*uOpacity);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }`,
    transparent: true, depthWrite: false, side: THREE.DoubleSide,
    blending: THREE.NormalBlending, toneMapped: false,
  });
  material.userData = { element: 'space', cosmicSurface: kind, opacity };
  return material;
}

/** Crossed sheets preserve the silhouette at every world and arena heading. */
export function createCosmicLens(kind: CosmicSurface, radius: number, opacity = 1) {
  const root = new THREE.Group(); root.name = `space-${kind}-lens`;
  const material = createCosmicMaterial(kind, opacity);
  const geometry = new THREE.PlaneGeometry(radius * 2, radius * 2, 1, 1);
  for (const angle of [0, Math.PI / 2]) {
    const sheet = new THREE.Mesh(geometry, material); sheet.rotation.y = angle;
    sheet.renderOrder = 3; root.add(sheet);
  }
  return { root, material, update: (time: number, alpha = opacity) => {
    material.uniforms.uTime.value = time; material.uniforms.uOpacity.value = alpha;
  } };
}

export function createSpaceCrest() {
  const lens = createCosmicLens('blackhole', .38, .92);
  lens.root.position.set(0, .24, -.055);
  lens.root.name = 'space-gravitational-crown';
  return lens;
}

export function createSpacePalm(facingTarget: THREE.Object3D) {
  const lens = createCosmicLens('blackhole', .33);
  const root = lens.root; root.name = 'hand-magic-seal-space'; root.visible = false;
  root.userData.spaceSeal = { facingTarget, activation: 0, update: lens.update };
  return root;
}

/** Four warped starfield panels remain alive for the whole gameplay shield lifetime. */
export function createSpaceWard(radius: number) {
  const root = new THREE.Group(); root.name = 'space-spacetime-ward';
  const material = createCosmicMaterial('metric', .8);
  const panels: THREE.Mesh[] = [];
  for (let i = 0; i < 4; i++) {
    const geometry = new THREE.PlaneGeometry(radius * 1.25, radius * 1.75, 12, 16);
    const positions = geometry.attributes.position;
    for (let j = 0; j < positions.count; j++) {
      const x = positions.getX(j), y = positions.getY(j);
      positions.setZ(j, -radius * .25 * Math.cos(x / radius * 2.1) * Math.cos(y / radius));
    }
    geometry.computeBoundingSphere();
    const panel = new THREE.Mesh(geometry, material); root.add(panel); panels.push(panel);
  }
  return { root, material, update: (time: number, active = true) => {
    root.visible = active;
    material.uniforms.uTime.value = time;
    panels.forEach((panel, i) => {
      const a = i * Math.PI / 2 + time * .3;
      panel.position.set(Math.cos(a) * radius, 0, Math.sin(a) * radius);
      panel.rotation.y = Math.PI / 2 - a;
    });
  } };
}

export function updateSpacePower(char: StickMan3DCharacter, time: number, shielded = false) {
  if (char.element !== 'space') return;
  char.headElementGroup.userData.updateSpace?.(time);
  char.bodyElementGroup.userData.updateSpace?.(time, shielded);
  char.magicSealMesh.userData.updateSpace?.(time, .4);
  for (const mesh of [char.powerBeamMesh, char.shockwaveMesh]) {
    const material = mesh.material as THREE.ShaderMaterial;
    material.uniforms.uTime.value = time;
    material.uniforms.uOpacity.value = material.opacity;
  }
}
