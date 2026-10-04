import * as THREE from 'three';
import { createFireFlame } from './fireFlame';
import type { ElementalSpell } from '../data/elementalSpells';
import { SpellDrawing, clamp, ease, noise, TAU, type Point, type BuiltSpellEffect } from './spellDrawing';

/** Fire owns flowing, solid volumes: bright combustion inside vermilion flame and cooled basalt. */
function combustion(d: SpellDrawing, molten = false) {
  const material = new THREE.ShaderMaterial({
    uniforms: { uTime: { value: 0 }, uOpacity: { value: 1 } },
    vertexShader: `varying vec2 vUv; varying vec3 vPosition; varying vec3 vNormal; varying vec3 vView;
      void main(){vUv=uv;vPosition=position; vNormal=normalMatrix*normal; vec4 view=modelViewMatrix*vec4(position,1.0); vView=-view.xyz; gl_Position=projectionMatrix*view;}`,
    fragmentShader: `varying vec2 vUv;varying vec3 vPosition; varying vec3 vNormal; varying vec3 vView;uniform float uTime,uOpacity;
      float hash(vec3 p){return fract(sin(dot(p,vec3(127.1,311.7,74.7)))*43758.5453);}
      float noise3(vec3 p){vec3 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);
        return mix(mix(mix(hash(i),hash(i+vec3(1,0,0)),f.x),mix(hash(i+vec3(0,1,0)),hash(i+vec3(1,1,0)),f.x),f.y),
          mix(mix(hash(i+vec3(0,0,1)),hash(i+vec3(1,0,1)),f.x),mix(hash(i+vec3(0,1,1)),hash(i+vec3(1,1,1)),f.x),f.y),f.z);}
      void main(){
        float n=noise3(vPosition*.24+vec3(0,-uTime*3.,uTime*.6));
        float detail=noise3(vPosition*.61-vec3(0,uTime*5.,0));
        ${molten ? `float seams=1.-smoothstep(.035,.105,abs(n-.49));
          vec3 color=mix(vec3(.035,.012,.008)+detail*.035, mix(vec3(1.,.12,.008),vec3(1.,.7,.12),detail),seams);
          gl_FragColor=vec4(color,uOpacity);` : `float heat=clamp(n*.75+detail*.25,0.,1.);
          vec3 color=mix(vec3(.65,.025,.003),vec3(1.,.23,.009),smoothstep(.2,.52,heat));
          color=mix(color,vec3(1.,.82,.28),smoothstep(.65,.9,heat));
          gl_FragColor=vec4(color,uOpacity*(.75+.25*n)*smoothstep(.03,.55,abs(dot(normalize(vNormal),normalize(vView)))));`}
        #include <colorspace_fragment>
      }`,
    transparent: true, depthWrite: false, side: THREE.DoubleSide, toneMapped: false,
  });
  material.userData.opacity = 1; material.userData.element = 'fire';
  d.surfaces.push(material); return material;
}

function fireTongue(d: SpellDrawing, parent: THREE.Object3D, width: number, height: number, seed: number) {
  const flame = createFireFlame(width, height, seed);
  parent.add(flame.root); d.surfaces.push(flame.material); d.motions.push(flame.update);
  return flame.root;
}

// A tapered round flame keeps its silhouette when the caster turns sideways.
function plume(d: SpellDrawing, parent: THREE.Object3D, path: (u: number, t: number) => Point,
  width: number, material: THREE.ShaderMaterial) {
  const segments = 32, sides = 8, positions = new Float32Array((segments + 1) * sides * 3);
  const uv = new Float32Array((segments + 1) * sides * 2), indices: number[] = [];
  for (let i = 0; i <= segments; i++) for (let j = 0; j < sides; j++) {
    uv.set([j / sides, i / segments], (i * sides + j) * 2);
    if (i < segments) { const a = i * sides + j, b = i * sides + (j + 1) % sides;
      indices.push(a,b,a+sides,b,b+sides,a+sides); }
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3).setUsage(THREE.DynamicDrawUsage));
  geometry.setAttribute('uv', new THREE.BufferAttribute(uv, 2)); geometry.setIndex(indices); geometry.computeVertexNormals();
  const mesh = new THREE.Mesh(geometry, material); mesh.frustumCulled = false; parent.add(mesh);
  const tangent = new THREE.Vector3(), normal = new THREE.Vector3(), binormal = new THREE.Vector3();
  const up = new THREE.Vector3(0,1,0), right = new THREE.Vector3(1,0,0);
  d.motions.push(t => {
    for (let i = 0; i <= segments; i++) {
      const u = i / segments, p = path(u,t), q = path(Math.min(1,u+.005),t), prev = path(Math.max(0,u-.005),t);
      tangent.set(q[0]-prev[0],q[1]-prev[1],q[2]-prev[2]).normalize();
      normal.crossVectors(tangent,Math.abs(tangent.y)>.95 ? right : up).normalize(); binormal.crossVectors(tangent,normal);
      const radius = width * Math.pow(Math.sin(Math.PI * u), .72) * (1 + Math.sin(u * 19 - t * 12) * .1);
      for (let j = 0; j < sides; j++) {
        const a = j / sides * TAU, k = (i * sides + j) * 3;
        positions[k] = p[0] + radius * (normal.x*Math.cos(a)+binormal.x*Math.sin(a));
        positions[k+1] = p[1] + radius * (normal.y*Math.cos(a)+binormal.y*Math.sin(a));
        positions[k+2] = p[2] + radius * (normal.z*Math.cos(a)+binormal.z*Math.sin(a));
      }
    }
    geometry.attributes.position.needsUpdate = true; geometry.computeVertexNormals();
  });
  return mesh;
}

export function buildPhoenixFirestorm(spell: ElementalSpell): BuiltSpellEffect {
  const d = new SpellDrawing(spell), flame = combustion(d);
  flame.userData.opacity = .38;
  d.root.userData.fireDesign = 'living-phoenix';
  const bird = new THREE.Group(); d.root.add(bird);
  plume(d,bird,(u,t)=>[Math.sin(u*5-t*4)*2,18+u*65,3+u*4],7,flame);
  const bodyFire=fireTongue(d,bird,25,71,1);bodyFire.position.set(0,17,3);
  // Swept shoulders with individually separated, curling flame feathers.
  for (const side of [-1,1]) {
    plume(d,bird,(u,t)=>[side*u*67,65+Math.sin(u*Math.PI)*23-u*13+Math.sin(t*4)*u*5,-u*9],6,flame);
    for (let i=0;i<7;i++) {
      const featherFire=fireTongue(d,bird,12,29+i*2,i+side*10);
      featherFire.position.set(side*(14+i*7),65+Math.sin((14+i*7)/67*Math.PI)*23-(14+i*7)/67*13,-i*1.5);
      featherFire.rotation.z=-side*(2.3-i*.055);
      plume(d,bird,(u,t)=>[side*(14+i*7+u*(16+i*1.6)),65+Math.sin((14+i*7)/67*Math.PI)*23-(14+i*7)/67*13-u*(20+i*3)+Math.sin(t*4+u*3)*u*6,
        -i*1.5-u*7+Math.sin(u*8-t*6)*u*2],3.8-i*.2,flame);
    }
  }
  for (let i=0;i<5;i++) plume(d,bird,(u,t)=>[(i-2)*u*6+Math.sin(u*8-t*5+i)*u*4,39-u*(37+noise(i)*10),-u*10],3,flame);
  const head = new THREE.Mesh(new THREE.SphereGeometry(5,20,12),flame); head.position.set(0,82,6); head.scale.set(.8,1.1,1.3); bird.add(head);
  const beak = d.mesh(new THREE.ConeGeometry(2,8,8),d.material('#ffe6a2'),bird); beak.rotation.x=Math.PI/2; beak.position.set(0,82,13);
  for (const side of [-1,1]) d.mote([side*3,84,9],.65,d.white,bird);
  for(let i=0;i<3;i++) plume(d,bird,(u,t)=>[(i-1)*u*6,85+u*13,5-u*6+Math.sin(u*4-t*7)*u],1.8,flame);
  d.halo([0,52,-4],52,'#f65713',bird,.3);
  const storm = new THREE.Group(); d.root.add(storm);
  for(let i=0;i<12;i++) {
    const a=i*TAU/12, tongue=fireTongue(d,storm,23,22+noise(i)*12,i+30);
    tongue.position.set(Math.cos(a)*35,0,Math.sin(a)*35);
  }
  d.particles(90,(i,t)=>{const a=i*2.399,r=15+noise(i)*55;return [Math.cos(a)*r,(noise(i+1)*80+t*28)%95,Math.sin(a)*r];},.8,d.secondary);
  d.motions.push(t=>{bird.scale.setScalar(ease(t/.45)*(1-ease((t-1.55)/.75)*.35));bird.position.y=Math.sin(t*3)*3;
    storm.visible=t>.8;storm.scale.setScalar(ease((t-.8)/.5));});
  return d.finish();
}

export function buildPyroclasticSurge(spell: ElementalSpell, heading: number): BuiltSpellEffect {
  const d=new SpellDrawing(spell,heading),flame=combustion(d);flame.userData.opacity=.35;d.root.userData.fireDesign='ember-comets';
  for(let i=0;i<9;i++) {
    const delay=.08+i*.085;
    const position=(t:number):Point=>{const p=clamp((t-delay)/.9);return [(i%3-1)*(5+p*22),24+Math.sin(p*Math.PI)*(20+i%3*5),14+p*185];};
    const ball=new THREE.Group();d.root.add(ball);
    const core=new THREE.Mesh(new THREE.SphereGeometry(1.8,16,12),flame);core.scale.set(1,1,1.3);ball.add(core);
    d.halo([0,0,0],12,'#ff7e16',ball,.4);
    const envelope=fireTongue(d,ball,16,29,i);envelope.rotation.x=-Math.PI/2;envelope.position.z=5;
    const lick=fireTongue(d,ball,11,17,i+18);lick.position.y=-3;
    d.particles(10,(j,t)=>{const p=position(t-noise(j+i*10)*.2);p[0]+=(noise(j+2)-.5)*7;p[1]+=(noise(j+3)-.5)*8;return p;},.5,d.secondary);
    for(let j=0;j<3;j++) plume(d,ball,(u,t)=>[Math.sin(u*10-t*13+j*2)*u*2,Math.cos(j*2)*u*3,-u*(13+j*3)],2.2,flame);
    const tail=plume(d,d.root,(u,t)=>{const p=position(t-u*.24);p[0]+=Math.sin(u*12-t*11+i)*u*1.7;return p;},3.6,flame);
    d.motions.push(t=>{ball.position.set(...position(t));ball.visible=tail.visible=t>=delay&&t<delay+.9;});
    d.burst(delay+.9,position(delay+.9),14,14,d.secondary);
  }
  return d.finish();
}

export function buildDragonMeteor(spell: ElementalSpell): BuiltSpellEffect {
  const d=new SpellDrawing(spell),flame=combustion(d),basalt=combustion(d,true);
  flame.userData.opacity=.38;
  d.root.userData.fireDesign='molten-cataclysm';
  const impact=1.08, target:Point=[0,3,24];
  const position=(t:number):Point=>{const p=ease(t/impact);return [92*(1-p),3+(1-p*p)*115,24-(1-p)*72];};
  const meteor=new THREE.Group();d.root.add(meteor);
  const rock=new THREE.Mesh(new THREE.IcosahedronGeometry(12,3),basalt);meteor.add(rock);
  d.halo([0,0,0],29,'#ff6b0e',meteor,.65);
  for(let i=0;i<5;i++){const fire=fireTongue(d,meteor,21,47+noise(i)*15,i+50);fire.position.set(Math.cos(i*TAU/5)*7,-8,Math.sin(i*TAU/5)*7);fire.rotation.z=-.35;}
  for(let i=0;i<6;i++) plume(d,meteor,(u,t)=>[Math.cos(i*TAU/6)*6*(1-u)+u*19,Math.sin(i*TAU/6)*6+u*42+Math.sin(u*9-t*12+i)*u*3,-u*14],3.5,flame);
  const tail=plume(d,d.root,(u,t)=>position(t-u*.36),9,flame);
  const crater=new THREE.Group();crater.position.set(...target);d.root.add(crater);
  const lava=new THREE.Mesh(new THREE.CircleGeometry(40,64),basalt);lava.rotation.x=-Math.PI/2;crater.add(lava);
  for(let i=0;i<12;i++) {
    const a=i*TAU/12;
    const chunk=d.mote([Math.cos(a)*37,1,Math.sin(a)*37],4+noise(i)*3,d.material('#38241c'),crater);chunk.scale.y=.5;
    const eruption=fireTongue(d,crater,22,55+noise(i)*27,i+70);eruption.position.set(Math.cos(a)*19,0,Math.sin(a)*19);
  }
  const shock=d.surface(new THREE.RingGeometry(34,40,72),'#ef6514',.7);shock.rotation.x=-Math.PI/2;shock.position.set(...target);
  d.burst(impact,target,88,90,d.primary);d.burst(impact+.05,[0,18,24],60,60,d.secondary);
  d.motions.push(t=>{meteor.position.set(...position(t));rock.rotation.set(t*2,t*3,t);meteor.visible=tail.visible=t<impact;
    const p=clamp((t-impact)/1.5);crater.visible=t>=impact;crater.scale.set( .2+ease(p/.35)*.8, ease(p/.18)*(1-ease((p-.3)/.7)), .2+ease(p/.35)*.8);
    shock.visible=t>impact&&t<impact+.8;shock.scale.setScalar(.3+clamp((t-impact)/.8)*2);});
  return d.finish();
}
