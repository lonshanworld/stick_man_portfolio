import * as THREE from 'three';

/** Robot-exclusive machined hardware and rectangular diagnostics. */
export function createRobotHardware(kind: 'head' | 'body' | 'palm' | 'ground') {
  const root = new THREE.Group(); root.name = `robot-${kind}-hardware`;
  const steel = new THREE.MeshStandardMaterial({ color: '#92A2B0', metalness: .8, roughness: .3 });
  const dark = new THREE.MeshStandardMaterial({ color: '#25343F', metalness: .65, roughness: .45 });
  const cyan = new THREE.MeshBasicMaterial({ color: '#37DFEA', transparent: true, opacity: 1 });
  const box = (name: string, size: [number, number, number], at: [number, number, number], material: THREE.Material = steel) => {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(...size), material); mesh.name = name; mesh.position.set(...at); root.add(mesh); return mesh;
  };
  const indicators: THREE.Mesh[] = [];
  if (kind === 'head') {
    for (const side of [-1, 1]) {
      box('robot-temple-processor', [.045, .1, .11], [side * .145, .025, 0], dark);
      indicators.push(box('robot-status-led', [.012, .025, .012], [side * .17, .02, .06], cyan));
    }
    box('robot-brow-armor', [.25, .03, .08], [0, .08, .08]);
  } else if (kind === 'body') {
    box('robot-battery-pack', [.15, .21, .08], [0, .035, -.09], dark);
    box('robot-ai-processor', [.065, .065, .018], [0, .07, .105], dark);
    for (let i = 0; i < 3; i++) indicators.push(box('robot-core-status', [.008, .04, .005], [(i - 1) * .016, .07, .117], cyan));
    for (const side of [-1, 1]) {
      box('robot-shoulder-launch-pod', [.09, .1, .1], [side * .14, .15, -.025]);
      for (let i = 0; i < 4; i++) box('robot-pod-launch-cell', [.025, .025, .012], [side * .14 + (i % 2 ? .019 : -.019), .15 + (i < 2 ? -.022 : .022), .032], dark);
      for (let i = 0; i < 3; i++) box('robot-heat-sink', [.055, .01, .015], [side * .055, -.015 - i * .025, .09], dark);
    }
  } else if (kind === 'palm') {
    box('robot-palm-computer', [.2, .16, .045], [0, 0, 0], dark);
    box('robot-chip-die', [.075, .075, .015], [0, 0, .03]);
    for (const side of [-1, 1]) for (let i = 0; i < 4; i++) {
      box('robot-chip-pin', [.04, .008, .008], [side * .065, (i - 1.5) * .023, .037], cyan);
    }
    for (const x of [-1, 1]) for (const y of [-1, 1]) {
      indicators.push(box('robot-hud-corner', [.085, .01, .01], [x * .17, y * .15, .08], cyan));
      box('robot-hud-corner-vertical', [.01, .06, .01], [x * .21, y * .125, .08], cyan);
    }
  } else {
    for (const x of [-1, 1]) for (const y of [-1, 1]) {
      box('robot-ground-target-bracket', [.16, .012, .012], [x * .24, y * .3, .012], cyan);
      box('robot-ground-target-upright', [.012, .12, .012], [x * .31, y * .24, .012], cyan);
    }
    for (let i = 0; i < 4; i++) indicators.push(box('robot-ground-telemetry', [.04, .012, .012], [(i - 1.5) * .065, -.24, .014], cyan));
  }
  const update = (time: number, opacity = 1) => {
    cyan.opacity = opacity;
    indicators.forEach((led, i) => { led.visible = Math.sin(time * 3 - i * .8) > -.65; });
  };
  return { root, update };
}

export function createRobotPalm(facingTarget: THREE.Object3D) {
  const hardware = createRobotHardware('palm'); hardware.root.visible = false;
  hardware.root.userData.robotSeal = { facingTarget, activation: 0, update: hardware.update };
  return hardware.root;
}
