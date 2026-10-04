import * as THREE from 'three';
import type { StickMan3DCharacter } from '../types';
import { DEMON_POWER } from '../data/demonPower';

export function createDarkPoisonMaterial() {
  const material = new THREE.ShaderMaterial({
    uniforms: { uTime: { value: 0 }, uOpacity: { value: .55 } },
    vertexShader: `varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,
    fragmentShader: `varying vec2 vUv;uniform float uTime,uOpacity;
      float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
      float noise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(hash(i),hash(i+vec2(1,0)),f.x),mix(hash(i+vec2(0,1)),hash(i+1.),f.x),f.y);}
      void main(){vec2 p=(vUv-.5)*2.;float r=length(p);
        float fog=noise(p*5.+vec2(uTime*.25,-uTime*.18))*.65+noise(p*11.-uTime*.13)*.35;
        float rim=exp(-pow((r-.94)*42.,2.));
        float pulse=exp(-pow((r-fract(uTime))*16.,2.))*.16;
        float edge=1.-smoothstep(.87,1.,r);
        vec3 color=mix(vec3(.08,.035,.11),vec3(.18,.29,.16),fog*.7+rim*.35);
        gl_FragColor=vec4(color,(fog*.42*edge+rim*.45+pulse*edge)*uOpacity);
      }`,
    transparent: true, depthWrite: false, side: THREE.DoubleSide, toneMapped: false,
  });
  material.userData.element = 'dark'; material.userData.opacity = .55; return material;
}

/** Lucifer owns long scalloped leather membranes and skeletal wing fingers, never feathers. */
export function createDemonBatWing() {
  const root = new THREE.Group(); root.name = 'lucifer-bat-wing';
  const membrane = new THREE.MeshStandardMaterial({ color: '#492b40', roughness: .62, metalness: .12,
    emissive: '#311625', emissiveIntensity: .22, side: THREE.DoubleSide });
  const bone = new THREE.MeshStandardMaterial({ color: '#b5a28d', roughness: .6, metalness: .1 });
  const vein = new THREE.MeshBasicMaterial({ color: '#816176', transparent: true, opacity: .6 });
  const shape = new THREE.Shape(); shape.moveTo(0, 0);
  shape.bezierCurveTo(.14, .34, .29, .66, .51, .72);
  shape.bezierCurveTo(.86, .96, 1.15, .70, 1.53, .38);
  shape.quadraticCurveTo(1.22, .33, 1.30, -.18);
  shape.quadraticCurveTo(1.06, .04, .94, -.43);
  shape.quadraticCurveTo(.71, -.02, .56, -.36);
  shape.quadraticCurveTo(.40, -.01, .25, -.28);
  shape.quadraticCurveTo(.16, -.05, 0, -.05); shape.closePath();
  const geometry = new THREE.ExtrudeGeometry(shape, { depth: .012, bevelEnabled: false, curveSegments: 24 });
  const position = geometry.attributes.position;
  for (let i = 0; i < position.count; i++) {
    const x = position.getX(i), y = position.getY(i);
    position.setZ(i, position.getZ(i) + Math.sin(x * Math.PI / 1.53) * .065 * Math.cos(y * 3));
  }
  geometry.computeVertexNormals(); geometry.computeBoundingSphere();
  const skin = new THREE.Mesh(geometry, membrane); skin.name = 'lucifer-leather-membrane'; root.add(skin);
  const tube = (points: THREE.Vector3[], radius: number, material: THREE.Material, name: string) => {
    const curve = new THREE.CatmullRomCurve3(points), geo = new THREE.TubeGeometry(curve, 24, radius, 7, false);
    const vertices = geo.attributes.position, uv = geo.attributes.uv;
    for (let i = 0; i < vertices.count; i++) {
      const u = uv.getX(i), center = curve.getPointAt(u), taper = 1 - u * .88;
      vertices.setXYZ(i, center.x + (vertices.getX(i) - center.x) * taper,
        center.y + (vertices.getY(i) - center.y) * taper, center.z + (vertices.getZ(i) - center.z) * taper);
    }
    geo.computeVertexNormals(); geo.computeBoundingSphere();
    const mesh = new THREE.Mesh(geo, material); mesh.name = name; root.add(mesh);
  };
  tube([new THREE.Vector3(0, 0, .03), new THREE.Vector3(.20, .38, .045), new THREE.Vector3(.51, .72, .07), new THREE.Vector3(1.53, .38, .035)], .022, bone, 'lucifer-wing-arm');
  for (const [x, y] of [[1.30, -.18], [.94, -.43], [.56, -.36], [.25, -.28]]) {
    tube([new THREE.Vector3(.51, .72, .07), new THREE.Vector3(x * .79, y * .34 + .28, .09), new THREE.Vector3(x, y, .025)], .014, bone, 'lucifer-wing-finger');
  }
  for (let i = 0; i < 12; i++) {
    const x = .18 + i * .10, y = .13 + Math.sin(i * .45) * .15;
    tube([new THREE.Vector3(.49, .64, .085), new THREE.Vector3(x * .83, y + .08, .085), new THREE.Vector3(x, y - .05, .075)], .002, vein, 'lucifer-membrane-vein');
  }
  const claw = new THREE.Mesh(new THREE.ConeGeometry(.038, .16, 6), bone);
  claw.position.set(.51, .79, .065); claw.rotation.z = -.35; root.add(claw);
  return root;
}

export function installFallenLucifer(char: StickMan3DCharacter) {
  if (char.element !== 'dark') return;
  const armor = new THREE.MeshStandardMaterial({ color: '#24212b', roughness: .36, metalness: .58 });
  const trim = new THREE.MeshStandardMaterial({ color: '#977b72', roughness: .4, metalness: .55 });
  const bone = new THREE.MeshStandardMaterial({ color: '#b7a58c', roughness: .7 });
  const soul = new THREE.MeshBasicMaterial({ color: '#adc583' });
  const attachments: THREE.Group[] = [];
  const attach = (parent: THREE.Object3D, name: string) => {
    const root = new THREE.Group(); root.name = name; root.visible = false; parent.add(root); attachments.push(root); return root;
  };
  const mesh = (parent: THREE.Object3D, geometry: THREE.BufferGeometry, material: THREE.Material, x = 0, y = 0, z = 0) => {
    const item = new THREE.Mesh(geometry, material); item.position.set(x, y, z); parent.add(item); return item;
  };
  const body = attach(char.bodyGroup, 'fallen-lucifer');
  const chest = mesh(body, new THREE.SphereGeometry(1, 16, 12), armor, 0, .18, .01); chest.scale.set(.11, .18, .077);
  const heart = mesh(body, new THREE.OctahedronGeometry(.032), soul, 0, .21, .088); heart.scale.y = 1.5;
  for (const side of [-1, 1]) for (let i = 0; i < 3; i++) {
    const rib = mesh(body, new THREE.BoxGeometry(.071, .014, .018), trim, side * .049, .13 + i * .043, .081); rib.rotation.z = side * .28;
  }
  mesh(body, new THREE.BoxGeometry(.18, .032, .13), trim, 0, .018, 0);
  const wings = [-1, 1].map(side => {
    const wing = createDemonBatWing(); wing.position.set(side * .06, .28, -.105); wing.scale.x = side; body.add(wing); return wing;
  });
  const head = attach(char.headMesh, 'lucifer-horned-crown');
  for (const side of [-1, 1]) {
    const curve = new THREE.CatmullRomCurve3([new THREE.Vector3(side * .10, .07, -.015),
      new THREE.Vector3(side * .22, .20, -.045), new THREE.Vector3(side * .23, .34, -.06), new THREE.Vector3(side * .14, .39, -.035)]);
    const horn = new THREE.TubeGeometry(curve, 28, .034, 8, false), p = horn.attributes.position, uv = horn.attributes.uv;
    for (let i = 0; i < p.count; i++) { const u = uv.getX(i), center = curve.getPointAt(u), taper = 1 - u * .97;
      p.setXYZ(i, center.x + (p.getX(i) - center.x) * taper, center.y + (p.getY(i) - center.y) * taper, center.z + (p.getZ(i) - center.z) * taper); }
    horn.computeVertexNormals(); horn.computeBoundingSphere(); mesh(head, horn, bone).name = 'lucifer-crown-horn';
    const brow = mesh(head, new THREE.BoxGeometry(.075, .022, .025), armor, side * .045, .028, .137); brow.rotation.z = -side * .3;
    mesh(head, new THREE.BoxGeometry(.045, .008, .026), soul, side * .042, .009, .141);
  }
  const tailCurve = new THREE.CatmullRomCurve3([new THREE.Vector3(0, -.015, -.065), new THREE.Vector3(.24, -.17, -.16),
    new THREE.Vector3(.33, -.27, -.02), new THREE.Vector3(.24, -.30, .09)]);
  mesh(body, new THREE.TubeGeometry(tailCurve, 28, .014, 7, false), armor).name = 'lucifer-spaded-tail';
  const tailTip = mesh(body, new THREE.ConeGeometry(.04, .11, 3), trim, .24, -.30, .09); tailTip.rotation.z = -1.2;
  for (const arm of [char.leftArm, char.rightArm]) {
    const shoulder = attach(arm.shoulder, 'lucifer-spiked-pauldron');
    mesh(shoulder, new THREE.OctahedronGeometry(.085), armor, 0, -.018, 0);
    for (let i = 0; i < 3; i++) { const spike = mesh(shoulder, new THREE.ConeGeometry(.015, .09, 5), bone, (i - 1) * .038, .02, -.01); spike.rotation.z = (i - 1) * -.35; }
    const bracer = attach(arm.lower, 'lucifer-gauntlet'); mesh(bracer, new THREE.CylinderGeometry(.035, .03, .12, 8), armor, 0, -.075, 0);
  }
  for (const leg of [char.leftLeg, char.rightLeg]) {
    const greave = attach(leg.shin, 'lucifer-greave'); mesh(greave, new THREE.CylinderGeometry(.037, .028, .18, 8), armor, 0, -.10, 0);
  }
  const spear = attach(char.rightArm.hand, 'lucifer-demon-spear');
  mesh(spear, new THREE.CylinderGeometry(.010, .013, .78, 8), armor, 0, .16, 0);
  const blade = mesh(spear, new THREE.OctahedronGeometry(1), trim, 0, .64, 0); blade.scale.set(.05, .16, .022);
  mesh(spear, new THREE.BoxGeometry(.12, .018, .025), bone, 0, .52, 0);
  for (const side of [-1, 1]) { const barb = mesh(spear, new THREE.ConeGeometry(.019, .15, 5), trim, side * .055, .57, 0); barb.rotation.z = -side * .35; }
  mesh(spear, new THREE.OctahedronGeometry(.023), soul, 0, .52, .02);
  const aura = attach(char.group, 'lucifer-dark-poison-aura'), poison = createDarkPoisonMaterial();
  const fog = mesh(aura, new THREE.PlaneGeometry(2, 2), poison, 0, .035, 0); fog.rotation.x = -Math.PI / 2;
  const vapors = new THREE.InstancedMesh(new THREE.PlaneGeometry(1, 1), poison, 18);
  vapors.name = 'lucifer-poison-vapors'; vapors.frustumCulled = false;
  vapors.instanceMatrix.setUsage(THREE.DynamicDrawUsage); aura.add(vapors);
  const vapor = new THREE.Object3D();
  char.bodyGroup.userData.updateLucifer = (remaining: number, time: number, radius = DEMON_POWER.poisonRadius) => {
    const active = remaining > 0; attachments.forEach(item => { item.visible = active; });
    char.headElementGroup.visible = !active; char.bodyElementGroup.visible = !active;
    if (!active) return;
    wings.forEach((wing, i) => { wing.rotation.y = -char.group.rotation.y + (i ? 1 : -1) * (.18 + Math.sin(time * 2.1) * .04); });
    poison.uniforms.uTime.value = time; fog.scale.setScalar(radius);
    for (let i = 0; i < vapors.count; i++) {
      const a = i * 2.399 + time * .10, phase = (time * .3 + i / vapors.count) % 1;
      const r = radius * (.22 + .65 * ((i * .618) % 1));
      vapor.position.set(Math.cos(a) * r, .1 + phase * .5, Math.sin(a) * r);
      vapor.rotation.y = -char.group.rotation.y;
      vapor.scale.set(.45 * Math.sin(phase * Math.PI), .8 * Math.sin(phase * Math.PI), 1);
      vapor.updateMatrix(); vapors.setMatrixAt(i, vapor.matrix);
    }
    vapors.instanceMatrix.needsUpdate = true;
    heart.scale.y = 1.5 + Math.sin(time * 3.2) * .12;
  };
}

export function updateFallenLucifer(char: StickMan3DCharacter, remaining: number, time: number, radius?: number) {
  char.bodyGroup.userData.updateLucifer?.(remaining, time, radius);
}
