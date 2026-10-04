import { createHealingPalm } from './healingVitality';
import { createRobotPalm } from './robotHardware';
import { createTimePalm } from './timeChronology';
import { createSpacePalm } from './spaceCosmos';
import { createLightPalm } from './lightRadiance';
import { createDarkPalm } from './darkNature';
import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import type { ElementType } from '../types';
import { createMineralPalm } from './soilStone';
import { createTreePalm } from './treeNature';

export type MagicSealShape = 'triangle'|'ellipseH'|'hexagon'|'pentagon'|'squareTilt'|'star5'|'star6'|'brokenArc'|'star8'|'cross'|'ellipseV'|'diamond'|'octagon'|'circle';
export type MagicRuneFamily = 'flame'|'wave'|'shard'|'gust'|'stone'|'bloom'|'bolt'|'shadow'|'halo'|'mend'|'void'|'orbit'|'time'|'circuit';
type RingMode = 'smooth'|'ripple'|'angular'|'broken'|'cosmic'|'clock'|'tech';
type Point = [number, number];
type StrokePath = { points: Point[]; closed?: boolean };
interface MagicSealProfile { shape:MagicSealShape; rune:MagicRuneFamily; outerDash:[number,number]; innerDash:[number,number]; outerSeconds:number; innerSeconds:number; glyphSeconds:number; outerDirection:1|-1; innerDirection:1|-1; releaseScale:number; ringMode:RingMode }

/** Exact profile values used by spirit_world_portfolio/SpiritMagicSeal. */
export const MAGIC_SEAL_PROFILES: Record<ElementType, MagicSealProfile> = {
  fire:{outerDash:[9,5],innerDash:[2,6],outerSeconds:4.2,innerSeconds:6.5,glyphSeconds:6,outerDirection:1,innerDirection:-1,releaseScale:2.7,ringMode:'angular',shape:'triangle',rune:'flame'},
  water:{outerDash:[2,8],innerDash:[1,6],outerSeconds:8.4,innerSeconds:10,glyphSeconds:10,outerDirection:-1,innerDirection:1,releaseScale:2.3,ringMode:'ripple',shape:'ellipseH',rune:'wave'},
  ice:{outerDash:[1,6],innerDash:[1,4],outerSeconds:7,innerSeconds:11,glyphSeconds:12,outerDirection:1,innerDirection:-1,releaseScale:2.2,ringMode:'smooth',shape:'hexagon',rune:'shard'},
  wind:{outerDash:[4,7],innerDash:[1,10],outerSeconds:5.5,innerSeconds:7.8,glyphSeconds:8,outerDirection:1,innerDirection:1,releaseScale:2.4,ringMode:'ripple',shape:'pentagon',rune:'gust'},
  soil:{outerDash:[12,4],innerDash:[6,6],outerSeconds:9.2,innerSeconds:14,glyphSeconds:11,outerDirection:-1,innerDirection:1,releaseScale:2.1,ringMode:'angular',shape:'squareTilt',rune:'stone'},
  trees:{outerDash:[5,5],innerDash:[2,5],outerSeconds:8.8,innerSeconds:12,glyphSeconds:9,outerDirection:1,innerDirection:-1,releaseScale:2.25,ringMode:'smooth',shape:'star6',rune:'bloom'},
  lightning:{outerDash:[3,9],innerDash:[1,7],outerSeconds:2.8,innerSeconds:4.2,glyphSeconds:3,outerDirection:1,innerDirection:-1,releaseScale:2.8,ringMode:'angular',shape:'star5',rune:'bolt'},
  dark:{outerDash:[7,6],innerDash:[2,8],outerSeconds:10,innerSeconds:13,glyphSeconds:9,outerDirection:-1,innerDirection:-1,releaseScale:2.3,ringMode:'smooth',shape:'brokenArc',rune:'shadow'},
  light:{outerDash:[2,4],innerDash:[1,5],outerSeconds:6,innerSeconds:8,glyphSeconds:7,outerDirection:1,innerDirection:-1,releaseScale:2.5,ringMode:'smooth',shape:'star8',rune:'halo'},
  healing:{outerDash:[4,6],innerDash:[2,5],outerSeconds:7,innerSeconds:10,glyphSeconds:9,outerDirection:-1,innerDirection:1,releaseScale:2.4,ringMode:'smooth',shape:'cross',rune:'mend'},
  void:{outerDash:[14,10],innerDash:[8,8],outerSeconds:11,innerSeconds:7,glyphSeconds:5,outerDirection:-1,innerDirection:1,releaseScale:3,ringMode:'broken',shape:'diamond',rune:'void'},
  space:{outerDash:[2,10],innerDash:[1,8],outerSeconds:14,innerSeconds:9,glyphSeconds:12,outerDirection:1,innerDirection:-1,releaseScale:2.6,ringMode:'cosmic',shape:'ellipseV',rune:'orbit'},
  time:{outerDash:[6,4],innerDash:[1,3],outerSeconds:12,innerSeconds:12,glyphSeconds:10,outerDirection:1,innerDirection:-1,releaseScale:2.2,ringMode:'clock',shape:'circle',rune:'time'},
  robot:{outerDash:[3,3],innerDash:[1,4],outerSeconds:4,innerSeconds:5,glyphSeconds:4,outerDirection:-1,innerDirection:1,releaseScale:2.5,ringMode:'tech',shape:'octagon',rune:'circuit'},
};

const UNIT=.007;
const parentQuaternion=new THREE.Quaternion(), worldQuaternion=new THREE.Quaternion();
const handPosition=new THREE.Vector3(), targetPosition=new THREE.Vector3(), direction=new THREE.Vector3(), xAxis=new THREE.Vector3(), yAxis=new THREE.Vector3();
const basis=new THREE.Matrix4(), cameraFacing=new THREE.Vector3(0,0,1), sealUp=new THREE.Vector3(0,1,0);

function polygon(r:number,n:number,offset=0):Point[]{return Array.from({length:n},(_,i)=>{const a=(i*360/n+offset)*Math.PI/180;return[Math.cos(a)*r,Math.sin(a)*r]})}
function star(r:number,n:number,offset=0,ratio=.42):Point[]{return Array.from({length:n*2},(_,i)=>{const rr=i%2===0?r:r*ratio,a=(i*180/n+offset)*Math.PI/180;return[Math.cos(a)*rr,Math.sin(a)*rr]})}
function ellipse(rx:number,ry:number,start=0,end=Math.PI*2,segments=72):Point[]{return Array.from({length:segments+1},(_,i)=>{const a=start+(end-start)*i/segments;return[Math.cos(a)*rx,Math.sin(a)*ry]})}
function quadratic(a:Point,c:Point,b:Point,segments=8):Point[]{return Array.from({length:segments+1},(_,i)=>{const t=i/segments,u=1-t;return[u*u*a[0]+2*u*t*c[0]+t*t*b[0],u*u*a[1]+2*u*t*c[1]+t*t*b[1]]})}
function join(...paths:Point[][]):Point[]{return paths.flatMap((path,i)=>i?path.slice(1):path)}
function cross(r:number,ratio:number):Point[]{const a=r*ratio;return[[-a,-r],[a,-r],[a,-a],[r,-a],[r,a],[a,a],[a,r],[-a,r],[-a,a],[-r,a],[-r,-a],[-a,-a]]}

type ShapeStroke=StrokePath&{layer:'outer'|'inner';dashed?:'outer'|'inner';width?:number};
/** Every sub-shape and relative size mirrors renderSealRings in SpiritMagicSeal. */
function sealShapePaths(shape:MagicSealShape,outerR=86,innerR=68):ShapeStroke[]{
  const outer=(points:Point[],dashed?:'outer',width=1):ShapeStroke=>({points,closed:true,layer:'outer',dashed,width});
  const inner=(points:Point[],dashed?:'inner',width=1):ShapeStroke=>({points,closed:true,layer:'inner',dashed,width});
  switch(shape){
    case'triangle':return[outer(polygon(outerR,3,-90),'outer'),inner(polygon(innerR,3,-90),'inner'),outer(polygon(outerR*.5,3,90),undefined,.6),{points:[[0,-outerR*.42],[0,outerR*.42]],layer:'inner',width:.8}];
    case'ellipseH':return[outer(ellipse(outerR*1.2,outerR*.7),'outer'),inner(ellipse(innerR*1.18,innerR*.68),'inner'),inner(ellipse(outerR*.55,outerR*.33),undefined,.6),outer(ellipse(outerR*.38,outerR*.22),undefined,.55)];
    case'hexagon':return[outer(polygon(outerR,6,-90),'outer'),inner(polygon(innerR,6,-90),'inner'),inner(polygon(outerR*.48,6),undefined,.55),outer(polygon(outerR*.3,3,-90),undefined,.55)];
    case'pentagon':return[outer(polygon(outerR,5,-90),'outer'),inner(polygon(innerR,5,-90),'inner'),inner(polygon(outerR*.48,5,-18),undefined,.55),outer(polygon(outerR*.3,5,-90),undefined,.55)];
    case'squareTilt':return[outer(polygon(outerR,4,45),'outer'),inner(polygon(innerR,4,45),'inner'),inner(polygon(outerR*.5,4),undefined,.55),outer(polygon(outerR*.32,4,45),undefined,.55)];
    case'star5':return[outer(star(outerR,5,-90),'outer'),inner(star(innerR,5,-90),'inner'),inner(polygon(outerR*.42,5,-90),undefined,.55),outer(polygon(outerR*.26,5,-90),undefined,.55)];
    case'star6':return[outer(star(outerR,6,-90,.5),'outer'),inner(star(innerR,6,-90,.5),'inner'),inner(polygon(outerR*.45,6,-90),undefined,.55),outer(polygon(outerR*.28,3,-90),undefined,.55)];
    case'brokenArc':return[
      {points:ellipse(outerR,outerR,-70*Math.PI/180,40*Math.PI/180,24),layer:'outer',dashed:'outer'},
      {points:ellipse(outerR,outerR,65*Math.PI/180,172*Math.PI/180,24),layer:'outer',dashed:'outer'},
      {points:ellipse(outerR,outerR,198*Math.PI/180,278*Math.PI/180,18),layer:'outer',dashed:'outer'},
      {points:ellipse(innerR,innerR,-30*Math.PI/180,90*Math.PI/180,24),layer:'inner',dashed:'inner'},
      {points:ellipse(innerR,innerR,120*Math.PI/180,250*Math.PI/180,26),layer:'inner',dashed:'inner'},
      inner(polygon(outerR*.42,4,30),undefined,.55),outer(polygon(outerR*.28,4,75),undefined,.55)];
    case'star8':return[outer(star(outerR,8,-22.5),'outer'),inner(star(innerR,8,-22.5),'inner'),inner(polygon(outerR*.44,8,-22.5),undefined,.55),outer(polygon(outerR*.28,4),undefined,.55)];
    case'cross':return[outer(cross(outerR,.28),'outer'),inner(cross(innerR,.3),'inner'),inner(polygon(outerR*.38,4),undefined,.55),outer(polygon(outerR*.25,4,45),undefined,.55)];
    case'ellipseV':return[outer(ellipse(outerR*.7,outerR*1.2),'outer'),inner(ellipse(innerR*.68,innerR*1.18),'inner'),inner(ellipse(outerR*.33,outerR*.55),undefined,.55),outer(ellipse(outerR*.22,outerR*.38),undefined,.55)];
    case'diamond':return[outer(polygon(outerR,4),'outer'),inner(polygon(innerR,4),'inner'),inner(polygon(outerR*.5,4,45),undefined,.55),outer(polygon(outerR*.32,4),undefined,.55)];
    case'octagon':return[outer(polygon(outerR,8,-22.5),'outer'),inner(polygon(innerR,8,-22.5),'inner'),inner(polygon(outerR*.48,4),undefined,.55),outer(polygon(outerR*.3,8),undefined,.55)];
    default:return[outer(ellipse(outerR,outerR),'outer'),inner(ellipse(innerR,innerR),'inner'),inner(polygon(outerR*.55,4,45),undefined,.55),outer(polygon(outerR*.38,4),undefined,.55)];
  }
}

/** Curves mirror runePath from SpiritMagicSeal; even/odd variants are retained. */
function runePaths(f:MagicRuneFamily,i:number):StrokePath[]{switch(f){
  case'flame':return[{points:join(quadratic([0,-9],[9,-1],[5,5]),quadratic([5,5],[0,11],[-5,5]),quadratic([-5,5],[-9,0],[-3,-3]),quadratic([-3,-3],[1,3],[0,-9]))},{points:i%2===0?quadratic([0,6],[-3,2],[1,-2]):quadratic([0,6],[4,2],[1,-2])}];
  case'wave':return[{points:join(quadratic([-8,5],[-2,5],[-2,-1]),quadratic([-2,-1],[1,-10],[7,-3]),quadratic([7,-3],[0,-5],[2,3]))},{points:i%2===0?quadratic([-8,8],[0,4],[8,8]):quadratic([-7,9],[0,7],[7,9])}];
  case'shard':return Array.from({length:6},(_,i):StrokePath[]=>{const a=i*Math.PI/3,c=Math.cos(a),s=Math.sin(a);return [{points:[[0,0],[c*8,s*8]]},{points:[[c*4,s*4],[c*6-s*2,s*6+c*2]]},{points:[[c*4,s*4],[c*6+s*2,s*6-c*2]]}];}).flat();
  case'gust':return[{points:join(quadratic([-8,-3],[2,-8],[7,-3]),quadratic([7,-3],[10,3],[3,4]))},{points:quadratic([-8,2],[-1,-1],[5,2])},{points:i%2===0?quadratic([-6,7],[1,3],[6,6]):quadratic([-6,7],[0,9],[6,6])}];
  case'stone':return[{points:[[-7,-6],[6,-6],[8,-1],[5,6],[-6,5],[-8,0]],closed:true},{points:[[-7,-1],[0,0],[6,-2]]},{points:[[-6,3],[1,2],[5,3]]}];
  case'bloom':return[{points:join(quadratic([0,-8],[6,-2],[0,4]),quadratic([0,4],[-6,-2],[0,-8])),closed:true},{points:[[-7,1],[7,1]]}];
  case'bolt':return[{points:[[-2,-9],[2,-3],[-1,0],[4,8]]},{points:[[-1,0],[-7,-2],[-8,3]]},{points:[[2,-3],[7,-6],[8,-3]]}];
  case'shadow':return i%2===0?[{points:ellipse(7,7),closed:true},{points:ellipse(4,4).map(([x,y])=>[x+3,y]),closed:true}]:[{points:quadratic([-7,-2],[0,8],[7,-2])}];
  case'halo':return[{points:[[0,-8],[0,8]]},{points:[[-8,0],[8,0]]},{points:[[-5,-5],[5,5]]},{points:[[5,-5],[-5,5]]}];
  case'mend':return[{points:[[-8,0],[8,0]]},{points:[[0,-8],[0,8]]},{points:quadratic([-5,-5],[0,-8],[5,-5])}];
  case'void':return i%2===0?[{points:[[-7,-7],[7,7]]},{points:[[7,-7],[-7,7]]},{points:[[-8,0],[8,0]]}]:[{points:quadratic([-8,-4],[0,9],[8,-4])}];
  case'orbit':return[{points:ellipse(7,5),closed:true},{points:[[-2,-8],[2,8]]}];
  case'time':return[{points:[[0,-8],[0,0],[5,3]]},{points:[[-7,-7],[7,-7],[7,7],[-7,7]],closed:true}];
  case'circuit':return[{points:[[-7,-7],[0,-7],[0,0],[7,0]]},{points:[[-7,7],[0,7],[0,0]]},{points:[[-7,-2],[-3,-2]]},{points:[[3,2],[7,2]]}];
}}

type TextureLayer='aura'|'shape'|'outerRunes'|'innerRunes';
function rimGlyph(shape:MagicSealShape,index:number,count:number,radius:number){
  const path=sealShapePaths(shape,radius,radius*.78)[0],points=path.closed?[...path.points,path.points[0]]:path.points;
  const f=index/count*(points.length-1),a=points[Math.floor(f)],b=points[Math.min(points.length-1,Math.floor(f)+1)],p=f-Math.floor(f);
  const x=a[0]+(b[0]-a[0])*p,y=a[1]+(b[1]-a[1])*p;
  return {point:[x,y] as Point,rotation:Math.atan2(y,x)+Math.PI/2};
}
function glyphCount(shape:MagicSealShape){return shape==='triangle'?9:shape==='octagon'?8:shape==='hexagon'||shape==='star6'?12:shape==='star5'||shape==='pentagon'?10:shape==='cross'?8:14}
const layerTextureCache=new Map<string,THREE.CanvasTexture>();
function drawCanvasPath(ctx:CanvasRenderingContext2D,path:StrokePath,color:string,width:number,dash:number[]=[]){
  if(path.points.length<2)return;ctx.beginPath();ctx.moveTo(path.points[0][0],path.points[0][1]);for(const [x,y] of path.points.slice(1))ctx.lineTo(x,y);if(path.closed)ctx.closePath();ctx.strokeStyle=color;ctx.lineWidth=width;ctx.setLineDash(dash);ctx.lineCap='round';ctx.lineJoin='round';ctx.stroke();ctx.setLineDash([]);
}
function spiritLayerTexture(layer:TextureLayer,profile:MagicSealProfile,primary:string,secondary:string):THREE.CanvasTexture|null{
  if(typeof document==='undefined')return null;
  const cacheKey=`${profile.shape}:${profile.rune}:${layer}:${primary}:${secondary}`;const cached=layerTextureCache.get(cacheKey);if(cached)return cached;
  const canvas=document.createElement('canvas');canvas.width=canvas.height=256;const ctx=canvas.getContext('2d');if(!ctx)return null;
  const scale=256/220;ctx.scale(scale,scale);ctx.translate(110,110);ctx.shadowBlur=6;ctx.globalCompositeOperation='lighter';
  if(layer==='aura'){
    const glow=ctx.createRadialGradient(0,0,0,0,0,78);glow.addColorStop(0,`${secondary}66`);glow.addColorStop(.42,`${primary}33`);glow.addColorStop(.72,'transparent');ctx.fillStyle=glow;ctx.beginPath();ctx.arc(0,0,78,0,Math.PI*2);ctx.fill();
    ctx.globalAlpha=.24;for(const path of sealShapePaths(profile.shape,91,74).filter(path=>path.layer==='outer'))drawCanvasPath(ctx,path,primary,4);ctx.globalAlpha=1;
  }else if(layer==='shape'){
    for(const path of sealShapePaths(profile.shape)){const color=path.layer==='outer'?primary:secondary,width=(path.layer==='outer'?2:1.8)*(path.width??1),dash=path.dashed==='outer'?profile.outerDash:path.dashed==='inner'?profile.innerDash:[];ctx.shadowColor=color;drawCanvasPath(ctx,path,color,width,dash)}
  }else{
    const outerLayer=layer==='outerRunes',count=outerLayer?glyphCount(profile.shape):6,radius=outerLayer?99:55,width=outerLayer?1.6:1.3;
    for(let i=0;i<count;i++){const rim=rimGlyph(profile.shape,i,count,radius);ctx.save();ctx.translate(...rim.point);ctx.rotate(rim.rotation);const color=i%2===0?(outerLayer?primary:secondary):(outerLayer?secondary:primary);ctx.shadowColor=color;ctx.globalAlpha=outerLayer?.8:.6;for(const path of runePaths(profile.rune,outerLayer?i:i+1))drawCanvasPath(ctx,path,color,width);ctx.restore()}ctx.globalAlpha=1;
  }
  const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;texture.minFilter=THREE.LinearFilter;texture.magFilter=THREE.LinearFilter;texture.generateMipmaps=false;texture.needsUpdate=true;layerTextureCache.set(cacheKey,texture);return texture;
}
function addSpiritFace(group:THREE.Group,texture:THREE.CanvasTexture|null,z:number):THREE.MeshBasicMaterial|null{
  if(!texture)return null;const mat=new THREE.MeshBasicMaterial({map:texture,transparent:true,opacity:0,depthWrite:false,depthTest:false,side:THREE.DoubleSide,blending:THREE.AdditiveBlending,toneMapped:false});const face=new THREE.Mesh(new THREE.PlaneGeometry(220*UNIT,220*UNIT),mat);face.position.z=z;face.renderOrder=110;face.frustumCulled=false;group.add(face);return mat;
}

function scaled(points:Point[],offset:Point=[0,0],rotation=0):THREE.Vector3[]{const c=Math.cos(rotation),s=Math.sin(rotation);return points.map(([x,y])=>new THREE.Vector3((x*c-y*s+offset[0])*UNIT,(x*s+y*c+offset[1])*UNIT,0))}
function dashedSegments(points:THREE.Vector3[],closed:boolean,dash:[number,number]):THREE.Vector3[][]{
  const source=closed?[...points,points[0]]:points,result:THREE.Vector3[][]=[];const pattern=[dash[0]*UNIT,dash[1]*UNIT];let pi=0,remaining=pattern[0],drawing=true,active:THREE.Vector3[]=[];
  for(let i=0;i<source.length-1;i++){const start=source[i],end=source[i+1],length=start.distanceTo(end);let travelled=0;while(travelled<length-1e-6){const step=Math.min(remaining,length-travelled),a=start.clone().lerp(end,travelled/length),b=start.clone().lerp(end,(travelled+step)/length);if(drawing){if(!active.length)active.push(a);active.push(b)}travelled+=step;remaining-=step;if(remaining<=1e-6){if(drawing&&active.length>1)result.push(active);active=[];pi=(pi+1)%2;drawing=pi===0;remaining=pattern[pi]}}}if(drawing&&active.length>1)result.push(active);return result;
}
function addTube(group:THREE.Group,points:THREE.Vector3[],material:THREE.MeshStandardMaterial,radius:number,closed=false){if(points.length<2)return;const curve=new THREE.CurvePath<THREE.Vector3>();for(let i=0;i<points.length-1;i++)curve.add(new THREE.LineCurve3(points[i],points[i+1]));if(closed)curve.add(new THREE.LineCurve3(points.at(-1)!,points[0]));group.add(new THREE.Mesh(new THREE.TubeGeometry(curve,Math.max(8,points.length*2),radius,5,false),material))}
function addStroke(group:THREE.Group,path:StrokePath,material:THREE.MeshStandardMaterial,radius:number,dash?:[number,number],offset:Point=[0,0],rotation=0){const points=scaled(path.points,offset,rotation);if(dash)for(const segment of dashedSegments(points,Boolean(path.closed),dash))addTube(group,segment,material,radius);else addTube(group,points,material,radius,Boolean(path.closed))}
function arcs(mode:RingMode):Array<[number,number]>{if(mode==='broken')return[[0,48],[82,156],[210,292]];if(mode==='clock')return Array.from({length:12},(_,i)=>[i*30,i*30+12]);if(mode==='tech')return Array.from({length:12},(_,i)=>[i*30,i*30+16]);if(mode==='cosmic')return[[10,72],[96,168],[196,278],[302,350]];return[[0,360]]}
function material(color:string|number){const c=new THREE.Color(color);return new THREE.MeshStandardMaterial({color:c,emissive:c,emissiveIntensity:2.4,roughness:.22,metalness:.18,transparent:true,opacity:0,depthWrite:false,depthTest:false,side:THREE.DoubleSide,blending:THREE.AdditiveBlending})}
function mergeLayer(group:THREE.Group){
  const buckets=new Map<THREE.Material,THREE.BufferGeometry[]>();
  const sourceTypes=new Map<THREE.Material,Set<string>>();
  for(const child of [...group.children]){
    if(!(child instanceof THREE.Mesh))continue;
    child.updateMatrix();
    const geometry=child.geometry.clone().applyMatrix4(child.matrix);
    const list=buckets.get(child.material)??[];list.push(geometry);buckets.set(child.material,list);
    const types=sourceTypes.get(child.material)??new Set<string>();types.add(child.geometry.type);sourceTypes.set(child.material,types);
    child.geometry.dispose();group.remove(child);
  }
  for(const [mat,geometries] of buckets){
    const geometry=geometries.length===1?geometries[0]:mergeGeometries(geometries,false);
    if(!geometry)continue;
    geometry.userData.sourceTypes=[...(sourceTypes.get(mat)??[])];
    const mesh=new THREE.Mesh(geometry,mat);mesh.renderOrder=100;mesh.frustumCulled=false;group.add(mesh);
    if(geometries.length>1)geometries.forEach(item=>item.dispose());
  }
}

/** Spirit World artwork rebuilt as actual tubes, toruses, spheres, and depth. */
export function createHandMagicSeal(element:ElementType,primary:string,secondary:string,facingTarget:THREE.Object3D):THREE.Group{
  if(element==='healing')return createHealingPalm(facingTarget);
  if(element==='time')return createTimePalm(facingTarget);
  if(element==='robot')return createRobotPalm(facingTarget);
  if(element==='space')return createSpacePalm(facingTarget);
  if(element==='light')return createLightPalm(facingTarget);
  if(element==='soil')return createMineralPalm(facingTarget);
  if(element==='trees')return createTreePalm(facingTarget);
  if(element==='dark')return createDarkPalm(facingTarget);
  const profile=MAGIC_SEAL_PROFILES[element],root=new THREE.Group();root.name=`hand-magic-seal-${element}`;root.visible=false;root.renderOrder=40;
  const aura=new THREE.Group(),outer=new THREE.Group(),inner=new THREE.Group(),shapeFace=new THREE.Group(),outerRunes=new THREE.Group(),innerRunes=new THREE.Group(),core=new THREE.Group(),release=new THREE.Group();
  aura.name='seal-aura';outer.name='seal-outer-depth';inner.name='seal-inner-depth';shapeFace.name='seal-source-shape';outerRunes.name='seal-outer-runes';innerRunes.name='seal-inner-runes';core.name='seal-core';release.name='seal-release';root.add(aura,outer,inner,shapeFace,outerRunes,innerRunes,core,release);
  const primaryMat=material(primary),secondaryMat=material(secondary),whiteMat=material(0xffffff),auraMat=material(secondary),releaseMat=material(primary),materials=[primaryMat,secondaryMat,whiteMat,auraMat,releaseMat];
  arcs(profile.ringMode).forEach(([start,end],i)=>addStroke(aura,{points:ellipse(78,78,start*Math.PI/180,end*Math.PI/180,Math.max(6,Math.ceil((end-start)/5)))},i%2?secondaryMat:primaryMat,.012));
  for(const path of sealShapePaths(profile.shape)){const mat=path.layer==='outer'?primaryMat:secondaryMat,radius=(path.layer==='outer'?.011:.0085)*(path.width??1),dash=path.dashed==='outer'?profile.outerDash:path.dashed==='inner'?profile.innerDash:undefined;addStroke(path.layer==='outer'?outer:inner,path,mat,radius,dash)}
  const count=glyphCount(profile.shape);
  for(let i=0;i<count;i++){const rim=rimGlyph(profile.shape,i,count,99),mat=i%2===0?primaryMat:secondaryMat;for(const path of runePaths(profile.rune,i))addStroke(outerRunes,path,mat,.0085,undefined,rim.point,rim.rotation)}
  for(let i=0;i<6;i++){const rim=rimGlyph(profile.shape,i,6,55),mat=i%2===0?secondaryMat:primaryMat;for(const path of runePaths(profile.rune,i+1))addStroke(innerRunes,path,mat,.0065,undefined,rim.point,rim.rotation)}
  const sphere=new THREE.Mesh(new THREE.SphereGeometry(.032,12,8),whiteMat);sphere.scale.z=.56;core.add(sphere);
  for(const path of runePaths(profile.rune,0))addStroke(core,{...path,points:path.points.map(([x,y])=>[x*3.1,y*3.1])},secondaryMat,.016);
  release.add(new THREE.Mesh(new THREE.TorusGeometry(.14,.008,6,40),releaseMat));
  for(const z of[-.035,.035]){const rail=new THREE.Group();rail.position.z=z;aura.add(rail);for(const path of sealShapePaths(profile.shape,87,70).filter(path=>path.layer==='outer'))addStroke(rail,path,z<0?secondaryMat:primaryMat,.009)}
  // Keep a clock's circular mechanism; other schools retain their own outline.
  for(let i=0;i<12;i++){const angle=i*Math.PI*2/12,pillar=new THREE.Mesh(new THREE.CylinderGeometry(.006,.006,.07,5),i%2?secondaryMat:primaryMat);pillar.rotation.x=Math.PI/2;pillar.position.set(Math.cos(angle)*.69,Math.sin(angle)*.69,0);aura.add(pillar)}
  [aura,outer,inner,outerRunes,innerRunes,core,release].forEach(mergeLayer);
  const faceMaterials:THREE.MeshBasicMaterial[]=[];
  root.traverse(node=>{if(node instanceof THREE.Mesh){node.renderOrder=100;node.frustumCulled=false}});
  root.userData.seal={profile,primary,secondary,facingTarget,aura,outer,inner,shapeFace,outerRunes,innerRunes,core,release,materials,faceMaterials,facesReady:false,activation:0};return root;
}

function ensureSpiritFaces(seal:{profile:MagicSealProfile;primary:string;secondary:string;aura:THREE.Group;shapeFace:THREE.Group;outerRunes:THREE.Group;innerRunes:THREE.Group;faceMaterials:THREE.MeshBasicMaterial[];facesReady:boolean}){
  if(seal.facesReady)return;
  const faces=[
    addSpiritFace(seal.aura,spiritLayerTexture('aura',seal.profile,seal.primary,seal.secondary),.045),
    addSpiritFace(seal.shapeFace,spiritLayerTexture('shape',seal.profile,seal.primary,seal.secondary),.052),
    addSpiritFace(seal.outerRunes,spiritLayerTexture('outerRunes',seal.profile,seal.primary,seal.secondary),.058),
    addSpiritFace(seal.innerRunes,spiritLayerTexture('innerRunes',seal.profile,seal.primary,seal.secondary),.064),
  ].filter((item):item is THREE.MeshBasicMaterial=>Boolean(item));
  seal.faceMaterials.push(...faces);seal.facesReady=true;
}

/** Locks the seal center to the palm and points its physical front face toward the caster. */
export function updateHandMagicSeal(root:THREE.Group,active:boolean,time:number,delta:number,intensity=1):void{
  const chrono=root.userData.timeSeal;
  if(chrono){
    chrono.activation=THREE.MathUtils.lerp(chrono.activation,active?1:0,1-Math.exp(-delta*(active?18:11)));
    root.visible=chrono.activation>.012;if(!root.visible)return;
    if(root.parent){root.parent.updateWorldMatrix(true,false);root.parent.getWorldQuaternion(parentQuaternion);root.quaternion.copy(parentQuaternion).invert();}
    root.scale.setScalar((.65+chrono.activation*.35)*Math.max(.9,intensity));
    root.traverse(node=>{if(node instanceof THREE.Mesh && node.material instanceof THREE.MeshBasicMaterial){const m=node.material;m.userData.timeOpacity ??= m.opacity;m.opacity=m.userData.timeOpacity*chrono.activation;}});
    chrono.update(time);return;
  }
  const cosmos=(root.userData.healingSeal ?? root.userData.robotSeal ?? root.userData.spaceSeal) as {facingTarget:THREE.Object3D;activation:number;update:(time:number,opacity:number)=>void}|undefined;
  if(cosmos){
    cosmos.activation=THREE.MathUtils.lerp(cosmos.activation,active?1:0,1-Math.exp(-delta*(active?18:11)));
    root.visible=cosmos.activation>.012;if(!root.visible)return;
    if(root.parent){root.parent.updateWorldMatrix(true,false);cosmos.facingTarget.updateWorldMatrix(true,false);root.parent.getWorldPosition(handPosition);cosmos.facingTarget.getWorldPosition(targetPosition);direction.subVectors(targetPosition,handPosition).normalize().multiplyScalar(.72).addScaledVector(cameraFacing,.7).normalize();xAxis.crossVectors(sealUp,direction).normalize();if(xAxis.lengthSq()<.001)xAxis.set(1,0,0);yAxis.crossVectors(direction,xAxis).normalize();basis.makeBasis(xAxis,yAxis,direction);worldQuaternion.setFromRotationMatrix(basis);root.parent.getWorldQuaternion(parentQuaternion);root.quaternion.copy(parentQuaternion).invert().multiply(worldQuaternion)}
    root.scale.setScalar((.65+cosmos.activation*.35)*Math.max(.9,intensity));
    cosmos.update(time,cosmos.activation);return;
  }
  const light=root.userData.lightSeal as {facingTarget:THREE.Object3D;activation:number;update:(time:number,opacity:number)=>void}|undefined;
  if(light){
    light.activation=THREE.MathUtils.lerp(light.activation,active?1:0,1-Math.exp(-delta*(active?18:11)));
    root.visible=light.activation>.012;if(!root.visible)return;
    if(root.parent){root.parent.updateWorldMatrix(true,false);light.facingTarget.updateWorldMatrix(true,false);root.parent.getWorldPosition(handPosition);light.facingTarget.getWorldPosition(targetPosition);direction.subVectors(targetPosition,handPosition).normalize().multiplyScalar(.72).addScaledVector(cameraFacing,.7).normalize();xAxis.crossVectors(sealUp,direction).normalize();if(xAxis.lengthSq()<.001)xAxis.set(1,0,0);yAxis.crossVectors(direction,xAxis).normalize();basis.makeBasis(xAxis,yAxis,direction);worldQuaternion.setFromRotationMatrix(basis);root.parent.getWorldQuaternion(parentQuaternion);root.quaternion.copy(parentQuaternion).invert().multiply(worldQuaternion)}
    root.scale.setScalar((.6+light.activation*.4)*Math.max(.9,intensity));
    light.update(time,light.activation);return;
  }
  const shade=root.userData.darkSeal as {facingTarget:THREE.Object3D;materials:THREE.ShaderMaterial[];hand:{update:(grip:number)=>void};activation:number}|undefined;
  if(shade){
    shade.activation=THREE.MathUtils.lerp(shade.activation,active?1:0,1-Math.exp(-delta*(active?18:11)));
    root.visible=shade.activation>.012;if(!root.visible)return;
    if(root.parent){root.parent.updateWorldMatrix(true,false);shade.facingTarget.updateWorldMatrix(true,false);root.parent.getWorldPosition(handPosition);shade.facingTarget.getWorldPosition(targetPosition);direction.subVectors(targetPosition,handPosition).normalize().multiplyScalar(.72).addScaledVector(cameraFacing,.7).normalize();xAxis.crossVectors(sealUp,direction).normalize();if(xAxis.lengthSq()<.001)xAxis.set(1,0,0);yAxis.crossVectors(direction,xAxis).normalize();basis.makeBasis(xAxis,yAxis,direction);worldQuaternion.setFromRotationMatrix(basis);root.parent.getWorldQuaternion(parentQuaternion);root.quaternion.copy(parentQuaternion).invert().multiply(worldQuaternion)}
    root.scale.setScalar((.65+shade.activation*.35)*Math.max(.9,intensity));
    shade.hand.update(.2 + shade.activation * .6);
    shade.materials.forEach(material=>{material.uniforms.uTime.value=time;material.uniforms.uOpacity.value=shade.activation;});
    return;
  }
  const tree=root.userData.treeSeal as {facingTarget:THREE.Object3D;materials:THREE.ShaderMaterial[];shoots:Array<{update:(growth:number)=>void}>;activation:number}|undefined;
  if(tree){
    tree.activation=THREE.MathUtils.lerp(tree.activation,active?1:0,1-Math.exp(-delta*(active?18:11)));
    root.visible=tree.activation>.012;if(!root.visible)return;
    if(root.parent){root.parent.updateWorldMatrix(true,false);tree.facingTarget.updateWorldMatrix(true,false);root.parent.getWorldPosition(handPosition);tree.facingTarget.getWorldPosition(targetPosition);direction.subVectors(targetPosition,handPosition).normalize().multiplyScalar(.72).addScaledVector(cameraFacing,.7).normalize();xAxis.crossVectors(sealUp,direction).normalize();if(xAxis.lengthSq()<.001)xAxis.set(1,0,0);yAxis.crossVectors(direction,xAxis).normalize();basis.makeBasis(xAxis,yAxis,direction);worldQuaternion.setFromRotationMatrix(basis);root.parent.getWorldQuaternion(parentQuaternion);root.quaternion.copy(parentQuaternion).invert().multiply(worldQuaternion)}
    root.scale.setScalar((.65+tree.activation*.35)*Math.max(.9,intensity));
    tree.shoots.forEach(shoot=>shoot.update(tree.activation));
    tree.materials.forEach(material=>{material.uniforms.uTime.value=time;material.uniforms.uOpacity.value=tree.activation;});
    return;
  }
  const mineral=root.userData.mineralSeal as {facingTarget:THREE.Object3D;materials:THREE.ShaderMaterial[];fragments:THREE.Mesh[];activation:number}|undefined;
  if(mineral){
    mineral.activation=THREE.MathUtils.lerp(mineral.activation,active?1:0,1-Math.exp(-delta*(active?18:11)));
    root.visible=mineral.activation>.012;if(!root.visible)return;
    if(root.parent){root.parent.updateWorldMatrix(true,false);mineral.facingTarget.updateWorldMatrix(true,false);root.parent.getWorldPosition(handPosition);mineral.facingTarget.getWorldPosition(targetPosition);direction.subVectors(targetPosition,handPosition).normalize().multiplyScalar(.72).addScaledVector(cameraFacing,.7).normalize();xAxis.crossVectors(sealUp,direction).normalize();if(xAxis.lengthSq()<.001)xAxis.set(1,0,0);yAxis.crossVectors(direction,xAxis).normalize();basis.makeBasis(xAxis,yAxis,direction);worldQuaternion.setFromRotationMatrix(basis);root.parent.getWorldQuaternion(parentQuaternion);root.quaternion.copy(parentQuaternion).invert().multiply(worldQuaternion)}
    root.scale.setScalar((.7+mineral.activation*.3)*Math.max(.9,intensity));
    mineral.fragments.forEach((fragment,i)=>{const a=i*Math.PI/4,r=.22+(1-mineral.activation)*.1;fragment.position.set(Math.sin(a)*r,Math.cos(a)*r,Math.sin(time*2+i)*.008);});
    mineral.materials.forEach(material=>{material.uniforms.uOpacity.value=mineral.activation;});
    return;
  }
  const seal=root.userData.seal as {profile:MagicSealProfile;primary:string;secondary:string;facingTarget:THREE.Object3D;aura:THREE.Group;outer:THREE.Group;inner:THREE.Group;shapeFace:THREE.Group;outerRunes:THREE.Group;innerRunes:THREE.Group;core:THREE.Group;release:THREE.Group;materials:THREE.MeshStandardMaterial[];faceMaterials:THREE.MeshBasicMaterial[];facesReady:boolean;activation:number}|undefined;if(!seal)return;
  if(active)ensureSpiritFaces(seal);
  seal.activation=THREE.MathUtils.lerp(seal.activation,active?1:0,1-Math.exp(-delta*(active?18:11)));root.visible=seal.activation>.012;if(!root.visible)return;
  root.position.set(0,0,0);
  if(root.parent){root.parent.updateWorldMatrix(true,false);seal.facingTarget.updateWorldMatrix(true,false);root.parent.getWorldPosition(handPosition);seal.facingTarget.getWorldPosition(targetPosition);direction.subVectors(targetPosition,handPosition).normalize();direction.multiplyScalar(.72).addScaledVector(cameraFacing,.7).normalize();xAxis.crossVectors(sealUp,direction).normalize();if(xAxis.lengthSq()<.001)xAxis.set(1,0,0);yAxis.crossVectors(direction,xAxis).normalize();basis.makeBasis(xAxis,yAxis,direction);worldQuaternion.setFromRotationMatrix(basis);root.parent.getWorldQuaternion(parentQuaternion);root.quaternion.copy(parentQuaternion).invert().multiply(worldQuaternion)}
  const pulse=1+Math.sin(time*4.2)*.035;root.scale.setScalar(.74*(.82+seal.activation*.18)*pulse*Math.max(.9,intensity));
  const innerRotation=rotation(time,seal.profile.innerSeconds,seal.profile.innerDirection);seal.outer.rotation.z=innerRotation;seal.inner.rotation.z=innerRotation;seal.shapeFace.rotation.z=innerRotation;seal.aura.rotation.z=rotation(time,seal.profile.outerSeconds,seal.profile.outerDirection);seal.outerRunes.rotation.z=rotation(time,seal.profile.glyphSeconds,-seal.profile.outerDirection as 1|-1);seal.innerRunes.rotation.z=rotation(time,seal.profile.glyphSeconds*.9,seal.profile.innerDirection);seal.core.scale.setScalar(.82+Math.sin(time*Math.PI*1.25)*.16);
  const releaseProgress=(time*.95)%1;seal.release.scale.setScalar(.4+releaseProgress*(seal.profile.releaseScale-.4));seal.materials.forEach((mat,i)=>{mat.opacity=seal.activation*(i===3?.08:i===4?(1-releaseProgress)*.3:i===2?.55:.28)});seal.faceMaterials.forEach((mat,i)=>{mat.opacity=seal.activation*(i===0?.4:i===1?.82:.58)});
}
function rotation(time:number,seconds:number,direction:1|-1){return direction*time*Math.PI*2/seconds}
