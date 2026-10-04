import * as THREE from 'three';
import type { ElementalSpell } from '../data/elementalSpells';
import { SpellDrawing, clamp, ease, noise, polar, TAU, type Point } from './spellDrawing';
import { createWindCurrent, createWindMaterial } from './windCurrent';

function current(d: SpellDrawing, path: (u:number,t:number)=>Point, width:number, opacity=.6, parent:THREE.Object3D=d.root, segments=56) {
  const flow=createWindCurrent(path,width,opacity,segments); parent.add(flow.root); d.surfaces.push(flow.material); d.motions.push(flow.update); return flow;
}
function tracers(d:SpellDrawing,count:number,path:(i:number,t:number)=>Point) {
  for(let i=0;i<count;i++)current(d,(u,t)=>path(i,t-u*.1),.32,.72,d.root,10);
}

export function buildTornadoGale(spell:ElementalSpell) {
  const d=new SpellDrawing(spell); d.root.userData.windDesign='twisting-pressure-cyclone';
  const vortex=new THREE.Group(); d.root.add(vortex);
  const mist=createWindMaterial(.65,true);d.surfaces.push(mist);
  const funnel=new THREE.Mesh(new THREE.CylinderGeometry(34,3,96,48,20,true),mist);funnel.position.y=48;vortex.add(funnel);
  for(let i=0;i<3;i++)current(d,(u,t)=>{
    const a=u*TAU*2.1+i*TAU/3-t*4.6,r=3+u*u*32;
    return [Math.cos(a)*r+Math.sin(t*2+u*4)*u*3,u*96,Math.sin(a)*r];
  },i%2?6:8,.85,vortex);
  for(let i=0;i<3;i++)current(d,(u,t)=>polar(u*TAU*.8-t*5+i*2.1,11+u*30,1+u*4),2.8,.42,vortex);
  tracers(d,16,(i,t)=>{const y=(noise(i)*90+t*30)%96;return polar(i*2.399-t*5,4+y*y/260,y);});
  d.motions.push((t,p)=>{const grow=ease(t/.4),release=ease((p-.72)/.28);vortex.scale.set(grow*(1+release*.45),grow*(1-release*.7),grow*(1+release*.45));vortex.rotation.z=Math.sin(t*2)*.035;});
  return d.finish();
}

export function buildZephyrBlades(spell:ElementalSpell,heading:number) {
  const d=new SpellDrawing(spell,heading);d.root.userData.windDesign='cutting-pressure-crescents';
  for(let i=0;i<4;i++) {
    const delay=i*.14,flight=1.15;
    const position=(u:number,t:number):Point=>{const a=(u-.5)*Math.PI*1.45,p=clamp((t-delay)/flight);
      return [Math.sin(a)*29,26+i*6+Math.sin(a)*(i%2?9:-9),Math.cos(a)*16+p*180];};
    const blade=current(d,position,8,.95),edge=current(d,position,.7,1);
    const wake=current(d,(u,t)=>{const p=position(.5,t-u*.22);return [p[0]+Math.sin(u*9+i)*u*7,p[1],p[2]];},3.2,.35);
    d.motions.push(t=>{blade.root.visible=edge.root.visible=wake.root.visible=t>delay&&t<delay+flight;});
  }
  tracers(d,12,(i,t)=>[(noise(i)-.5)*48,17+noise(i+4)*33,clamp((t-noise(i)*.3)/1.3)*175]);
  return d.finish();
}

export function buildAeroShockwave(spell:ElementalSpell) {
  const d=new SpellDrawing(spell);d.root.userData.windDesign='rising-air-lift';
  const lift=new THREE.Group();d.root.add(lift);
  for(let i=0;i<3;i++)current(d,(u,t)=>{
    const height=24+Math.sin(clamp(t/spell.duration)*Math.PI)*35;
    const a=i*TAU/3+u*.65+Math.sin(t*2+u*3)*.1,r=19-u*14+Math.sin(u*Math.PI)*4;
    return polar(a,r,2+u*height);
  },5,.8,lift);
  for(let i=0;i<3;i++)current(d,(u,t)=>{const a=u*TAU*.75-t*3.2+i*TAU/3;return polar(a,12+u*22,1+Math.sin(u*Math.PI)*3);},2.3,.46);
  for(const side of [-1,1])current(d,(u,t)=>[side*(15+Math.sin(u*5-t*3)*4),u*(32+Math.sin(t/spell.duration*Math.PI)*31),Math.cos(u*7-t*2)*6],2.2,.6,lift);
  tracers(d,12,(i,t)=>{const p=(noise(i)+t*.75)%1;return polar(i*2.399-t*3,10+p*13,p*54);});
  d.motions.push((t,p)=>{lift.scale.setScalar(ease(t/.24)*(1-ease((p-.8)/.2)*.5));});
  return d.finish();
}
