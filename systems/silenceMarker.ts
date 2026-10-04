import * as THREE from 'three';
import type { StickMan3DCharacter } from '../types';

/** Camera-facing forbidden magic rune; the three crossed slots represent all spells. */
export function installSilenceMarker(char: StickMan3DCharacter) {
  const size = 96, pixels = new Uint8Array(size * size * 4);
  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
    const px = (x - 48) / 48, py = (48 - y) / 48;
    const radius = Math.hypot(px, py - .18);
    const ring = Math.abs(radius - .58) < .045;
    const slash = Math.abs(px + py - .18) < .075 && radius < .61;
    const bolt = py > -.17 && py < .58 && Math.abs(px - (py > .22 ? .12 : -.08)) < .055;
    const slot = [-.42, 0, .42].some(cx => Math.abs(px - cx) < .14 && py < -.57 && py > -.85
      && (Math.abs(px - cx) > .1 || py > -.61 || py < -.81 || Math.abs(px - cx + py + .71) < .035));
    const index = (y * size + x) * 4;
    const lit = ring || slash || bolt || slot;
    pixels.set(lit ? [235, 169, 255, 255] : radius < .63 ? [24, 8, 39, 230] : [0, 0, 0, 0], index);
  }
  const texture = new THREE.DataTexture(pixels, size, size);
  texture.magFilter = THREE.LinearFilter; texture.needsUpdate = true;
  const marker = new THREE.Sprite(new THREE.SpriteMaterial({
    map: texture, transparent: true, depthTest: false, depthWrite: false, toneMapped: false,
  }));
  marker.material.addEventListener('dispose', () => texture.dispose());
  marker.name = 'all-spells-silenced-marker';
  marker.userData.label = 'All spells silenced';
  marker.scale.setScalar(.65); marker.renderOrder = 30; marker.visible = false;
  char.group.add(marker);
  char.group.userData.silenceMarker = marker;
}

const headPosition = new THREE.Vector3();

export function updateSilenceMarker(char: StickMan3DCharacter, remaining: number, time: number) {
  const marker = char.group.userData.silenceMarker as THREE.Sprite | undefined;
  if (!marker) return;
  marker.visible = remaining > 0;
  marker.userData.remaining = Math.max(0, remaining);
  if (!marker.visible) return;
  char.headMesh.getWorldPosition(headPosition);
  char.group.worldToLocal(headPosition);
  marker.position.copy(headPosition);
  marker.position.y += .55 + Math.sin(time * 3) * .025;
}
