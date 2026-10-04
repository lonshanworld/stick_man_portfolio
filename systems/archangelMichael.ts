import * as THREE from 'three';
import type { StickMan3DCharacter } from '../types';
import { createLightCorona, createLightRay } from './lightRadiance';

export { ARCHANGEL_POWER } from '../data/archangelPower';

/** Armor and wings attach to the animated skeleton, so the form follows every attack and jump. */
export function installArchangelMichael(char: StickMan3DCharacter) {
  if (char.element !== 'light') return;
  const ivory = new THREE.MeshStandardMaterial({ color: '#fff8e9', metalness: .25, roughness: .35, emissive: '#fff0ce', emissiveIntensity: .12 });
  const gold = new THREE.MeshStandardMaterial({ color: '#d9ad48', metalness: .75, roughness: .22,
    emissive: '#9c7422', emissiveIntensity: .2 });
  const blue = new THREE.MeshStandardMaterial({ color: '#264d91', metalness: .15, roughness: .6, side: THREE.DoubleSide });
  const attachments: THREE.Group[] = [];
  const attach = (parent: THREE.Object3D, name: string) => {
    const root = new THREE.Group(); root.name = name; root.visible = false; parent.add(root); attachments.push(root); return root;
  };
  const mesh = (parent: THREE.Object3D, geometry: THREE.BufferGeometry, material: THREE.Material,
    x = 0, y = 0, z = 0) => { const item = new THREE.Mesh(geometry, material); item.position.set(x, y, z); parent.add(item); return item; };
  const body = attach(char.bodyGroup, 'archangel-michael');
  const cuirass = mesh(body, new THREE.SphereGeometry(1, 20, 16), ivory, 0, .19, .005);
  cuirass.scale.set(.105, .17, .073);
  mesh(body, new THREE.BoxGeometry(.13, .018, .014), gold, 0, .19, .084);
  mesh(body, new THREE.BoxGeometry(.018, .18, .014), gold, 0, .19, .085);
  mesh(body, new THREE.BoxGeometry(.19, .034, .14), gold, 0, .025, 0);
  const sash = mesh(body, new THREE.PlaneGeometry(.06, .4), blue, .012, .10, .091); sash.rotation.z = -.45;
  const skirt = mesh(body, new THREE.ConeGeometry(.12, .22, 8, 1, true), blue, 0, -.08, 0);
  skirt.rotation.z = Math.PI;
  const wingRoots: THREE.Group[] = [], lights: ReturnType<typeof createLightRay>[] = [];
  const pearl = new THREE.MeshStandardMaterial({ color: '#f1e5cf', roughness: .5, metalness: .08,
    emissive: '#e4d4b4', emissiveIntensity: .08 });
  const shaft = new THREE.MeshBasicMaterial({ color: '#d3b66c', transparent: true, opacity: .55 });
  for (const side of [-1, 1]) {
    const wing = new THREE.Group(); wing.name = 'michael-eagle-wing';
    wing.position.set(side * .065, .29, -.09); wing.scale.x = side;
    body.add(wing); wingRoots.push(wing);
    // Shoulder, elbow, and wrist form an eagle's swept leading edge.
    const shoulder = new THREE.Shape(); shoulder.moveTo(0, 0);
    shoulder.bezierCurveTo(.10, .29, .22, .54, .43, .61);
    shoulder.bezierCurveTo(.66, .73, .91, .67, 1.05, .54);
    shoulder.lineTo(.88, .33); shoulder.quadraticCurveTo(.54, .32, .26, .04);
    shoulder.quadraticCurveTo(.10, -.08, 0, 0);
    mesh(wing, new THREE.ExtrudeGeometry(shoulder, { depth: .026, bevelEnabled: false, curveSegments: 16 }), pearl);
    const feather = (name: string, x: number, y: number, dx: number, dy: number, width: number,
      z: number, material: THREE.Material, radiant = false) => {
      const length = Math.hypot(dx, dy), shape = new THREE.Shape();
      shape.moveTo(0, 0);
      shape.bezierCurveTo(width * .7, length * .15, width, length * .56, 0, length);
      shape.bezierCurveTo(-width * .65, length * .65, -width * .75, length * .15, 0, 0);
      const plume = mesh(wing, new THREE.ExtrudeGeometry(shape, { depth: .009, bevelEnabled: false, curveSegments: 12 }), material, x, y, z);
      plume.name = name; plume.rotation.z = Math.atan2(-dx, dy);
      const quill = mesh(plume, new THREE.CylinderGeometry(.0012, .0024, length * .83, 4), shaft, 0, length * .43, .012);
      quill.name = 'feather-quill';
      if (radiant) {
        const light = createLightRay(length, width * .65, .32, true);
        light.root.position.copy(plume.position); light.root.position.z += .016;
        light.root.rotation.copy(plume.rotation); wing.add(light.root); lights.push(light);
      }
    };
    // Long overlapping secondary feathers hang below the broad inner wing.
    for (let i = 0; i < 15; i++) {
      const u = i / 14, x = .11 + u * .62, y = .15 + Math.sin(u * Math.PI * .66) * .40;
      feather('michael-secondary-feather', x, y, .10 + u * .11, -.42 - u * .18,
        .043, .03 + i * .001, i % 3 === 0 ? pearl : ivory, true);
    }
    // Separate, long primary flight feathers form the eagle's unmistakable fingertips.
    for (let i = 0; i < 10; i++) {
      const u = i / 9;
      feather('michael-primary-feather', .63 + u * .38, .61 - u * .10,
        .38 + Math.sin(u * Math.PI) * .22, .10 - u * .66,
        .052, .048 + i * .002, ivory, true);
    }
    // Three rows of small coverts overlap the roots of the flight feathers.
    for (let row = 0; row < 3; row++) for (let i = 0; i < 13; i++) {
      const u = i / 12;
      feather('michael-covert-feather', .08 + u * .89, .15 + Math.sin(u * Math.PI * .8) * .42 - row * .07,
        .06 + u * .03, -.17 - row * .015, .030, .085 + row * .012,
        row === 1 ? pearl : ivory);
    }
  }
  const head = attach(char.headMesh, 'michael-golden-diadem');
  const crown = mesh(head, new THREE.TorusGeometry(.145, .014, 8, 40), gold, 0, .015, 0); crown.rotation.x = Math.PI / 2;
  for (const side of [-1, 1]) {
    const crest = mesh(head, new THREE.ConeGeometry(.035, .11, 4), gold, side * .11, .07, .02); crest.rotation.z = -side * .3;
  }
  const halo = createLightCorona(.3); halo.root.position.set(0, .23, -.06); head.add(halo.root);
  for (const arm of [char.leftArm, char.rightArm]) {
    const armor = attach(arm.shoulder, 'michael-pauldron');
    const plate = mesh(armor, new THREE.SphereGeometry(.082, 12, 8), gold, 0, -.035, 0); plate.scale.y = .65;
    const bracer = attach(arm.lower, 'michael-bracer');
    mesh(bracer, new THREE.CylinderGeometry(.036, .03, .12, 10), ivory, 0, -.075, 0);
  }
  for (const leg of [char.leftLeg, char.rightLeg]) {
    const greave = attach(leg.shin, 'michael-greave');
    mesh(greave, new THREE.CylinderGeometry(.038, .03, .18, 10), gold, 0, -.10, 0);
  }
  const sword = attach(char.rightArm.hand, 'michael-sword-of-light');
  mesh(sword, new THREE.CylinderGeometry(.014, .014, .095, 8), gold, 0, .03, 0);
  mesh(sword, new THREE.BoxGeometry(.13, .018, .028), gold, 0, .08, 0);
  const blade = mesh(sword, new THREE.ConeGeometry(.028, .52, 4), ivory, 0, .35, 0); blade.rotation.y = Math.PI / 4;
  const swordLight = createLightRay(.53, .075, .75); swordLight.root.position.y = .09; sword.add(swordLight.root); lights.push(swordLight);
  char.bodyGroup.userData.updateArchangel = (remaining: number, time: number) => {
    const active = remaining > 0;
    attachments.forEach(item => { item.visible = active; });
    char.headElementGroup.visible = !active; char.bodyElementGroup.visible = !active;
    if (!active) return;
    // Keep a three-quarter presentation of the wings when the fighter turns sideways.
    // Their shoulder anchors still follow the body and its attack/jump animation.
    wingRoots.forEach((wing, i) => {
      wing.rotation.y = -char.group.rotation.y + (i ? 1 : -1) * (.18 + Math.sin(time * 2.4) * .045);
    });
    lights.forEach(light => { light.material.uniforms.uTime.value = time; }); halo.update(time);
  };
}

export function updateArchangelMichael(char: StickMan3DCharacter, remaining: number, time: number) {
  char.bodyGroup.userData.updateArchangel?.(remaining, time);
}
