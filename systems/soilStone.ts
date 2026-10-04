import * as THREE from 'three';

const noise = (n: number) => { const v = Math.sin(n * 127.1 + 311.7) * 43758.5453; return v - Math.floor(v); };

/** Sedimentary bands, granular inclusions, and narrow ochre mineral veins. */
export function createStoneMaterial(color = '#9C8060', opacity = 1, ore = false) {
  const material = new THREE.ShaderMaterial({
    uniforms: { uTime: { value: 0 }, uOpacity: { value: opacity }, uColor: { value: new THREE.Color(color) }, uOre: { value: ore ? 1 : 0 } },
    vertexShader: `varying vec3 vStone,vNormal;
      void main(){vStone=position;vNormal=normalize(normalMatrix*normal);
        gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,
    fragmentShader: `varying vec3 vStone,vNormal;uniform vec3 uColor;uniform float uOpacity,uOre;
      float hash(vec3 p){return fract(sin(dot(p,vec3(127.1,311.7,74.7)))*43758.5453);}
      float grain(vec3 p){vec3 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);
        return mix(mix(mix(hash(i),hash(i+vec3(1,0,0)),f.x),mix(hash(i+vec3(0,1,0)),hash(i+vec3(1,1,0)),f.x),f.y),
          mix(mix(hash(i+vec3(0,0,1)),hash(i+vec3(1,0,1)),f.x),mix(hash(i+vec3(0,1,1)),hash(i+vec3(1,1,1)),f.x),f.y),f.z);}
      void main(){float grit=grain(vStone*.9);
        float strata=sin(vStone.y*.7+sin(vStone.x*.19)*.6+vStone.z*.1);
        float seam=(1.-smoothstep(.015,.045,abs(sin(vStone.y*.22+vStone.x*.12+sin(vStone.z*.17)*.7))))*step(.64,grain(vStone*.12));
        float light=.52+.48*max(0.,dot(normalize(vNormal),normalize(vec3(-.4,.7,1.))));
        vec3 stone=uColor*(.77+strata*.08+grit*.28);
        vec3 ore=mix(vec3(.32,.20,.095),vec3(.78,.59,.30),grit);
        vec3 color=mix(stone,ore,seam*.45);
        color=mix(color,mix(vec3(.55,.37,.15),vec3(.94,.79,.48),grit*.45+light*.55),uOre);
        gl_FragColor=vec4(color*light,uOpacity);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }`,
    transparent: true, depthWrite: true, side: THREE.FrontSide,
  });
  material.userData.element = 'soil'; material.userData.opacity = opacity;
  return material;
}

/** A broken sedimentary slab, with bevels and an uneven upper edge. */
export function createStrataGeometry(width: number, height: number, depth: number, seed = 0) {
  const shape = new THREE.Shape();
  shape.moveTo(-width * .45, -height * .5);
  shape.lineTo(width * .42, -height * .5);
  shape.lineTo(width * .5, height * .18);
  shape.lineTo(width * .3, height * (.43 + noise(seed) * .09));
  shape.lineTo(-width * .2, height * .5);
  shape.lineTo(-width * .5, height * .3);
  shape.closePath();
  const geometry = new THREE.ExtrudeGeometry(shape, { depth, bevelEnabled: true, bevelSegments: 1, steps: 1,
    bevelSize: Math.min(width, height, depth) * .08, bevelThickness: depth * .06 });
  geometry.translate(0, 0, -depth * .5);
  return geometry;
}

/** Deform by position so duplicate vertices stay joined; preserve flat broken faces. */
export function createBoulderGeometry(radius: number, seed = 0) {
  const geometry = new THREE.IcosahedronGeometry(radius, 1);
  const positions = geometry.getAttribute('position');
  for (let i = 0; i < positions.count; i++) {
    const x = positions.getX(i), y = positions.getY(i), z = positions.getZ(i);
    const scale = .85 + noise(x * .7 + y * 2.3 + z * 1.7 + seed) * .25;
    positions.setXYZ(i, x * scale, y * scale * .88, z * scale);
  }
  geometry.computeVertexNormals();
  return geometry;
}

export function createSoilDustMaterial(opacity = .35) {
  const material = new THREE.ShaderMaterial({
    uniforms: { uTime: { value: 0 }, uOpacity: { value: opacity } },
    vertexShader: `varying vec3 vP,vN;void main(){vP=position;vN=normalize(normalMatrix*normal);gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,
    fragmentShader: `varying vec3 vP,vN;uniform float uTime,uOpacity;
      void main(){float grain=.6+.4*sin(vP.x*9.+sin(vP.y*13.+uTime)*2.)*sin(vP.z*11.);
        float edge=pow(abs(normalize(vN).z),2.4);
        gl_FragColor=vec4(vec3(.58,.46,.33),grain*edge*uOpacity);}`,
    transparent: true, depthWrite: false, side: THREE.FrontSide, toneMapped: false,
  });
  material.userData.element = 'soil'; material.userData.opacity = opacity; return material;
}

/** An opened geode, held by a slow tremor rather than a spinning energy halo. */
export function createMineralCrest() {
  const root = new THREE.Group(); root.name = 'soil-geode-crest';
  const stone = createStoneMaterial('#856B50'), ore = createStoneMaterial('#C4A474', 1, true);
  for (const side of [-1, 1]) {
    const shell = new THREE.Mesh(createBoulderGeometry(.09, side), stone);
    shell.scale.set(.62, 1.2, .65); shell.position.set(side * .075, .205, 0); root.add(shell);
  }
  for (let i = 0; i < 5; i++) {
    const mineral = new THREE.Mesh(createStrataGeometry(.025, .055 + noise(i) * .045, .024, i), ore);
    mineral.position.set((i - 2) * .022, .205 + noise(i + 1) * .025, .035);
    mineral.rotation.z = (i - 2) * -.16; root.add(mineral);
  }
  return { root, update: (time: number) => { root.position.y = Math.sin(time * 1.4) * .009; root.rotation.z = Math.sin(time * .8) * .025; } };
}

/** Small broken tablets assemble at the palm; raw mineral replaces luminous ring layers. */
export function createMineralPalm(facingTarget: THREE.Object3D) {
  const root = new THREE.Group(); root.name = 'hand-magic-seal-soil'; root.visible = false;
  const stone = createStoneMaterial('#8F7859', 0), ore = createStoneMaterial('#C6AA76', 0, true);
  const fragments: THREE.Mesh[] = [];
  for (let i = 0; i < 8; i++) {
    const angle = i * Math.PI / 4;
    const tablet = new THREE.Mesh(createStrataGeometry(.07, .1, .035, i), stone);
    tablet.position.set(Math.sin(angle) * .22, Math.cos(angle) * .22, 0);
    tablet.rotation.z = -angle; root.add(tablet); fragments.push(tablet);
  }
  for (let i = 0; i < 3; i++) {
    const mineral = new THREE.Mesh(createStrataGeometry(.036, .1 - Math.abs(i - 1) * .02, .04, i), ore);
    mineral.position.set((i - 1) * .04, 0, .02); mineral.rotation.z = (i - 1) * -.2; root.add(mineral);
  }
  root.userData.mineralSeal = { facingTarget, materials: [stone, ore], fragments, activation: 0 };
  return root;
}
