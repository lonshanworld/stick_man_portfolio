import * as THREE from 'three';

/** Crossed turbulent flame sheets: the outline itself flickers and breaks into hot wisps. */
export function createFireFlame(width: number, height: number, seed: number) {
  const material = new THREE.ShaderMaterial({
    uniforms: { uTime: { value: 0 }, uOpacity: { value: 1 }, uSeed: { value: seed } },
    vertexShader: `varying vec2 vUv; void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,
    fragmentShader: `varying vec2 vUv; uniform float uTime,uOpacity,uSeed;
      float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
      float n2(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);
        return mix(mix(hash(i),hash(i+vec2(1,0)),f.x),mix(hash(i+vec2(0,1)),hash(i+vec2(1,1)),f.x),f.y);}
      void main(){float y=vUv.y;float t=uTime*2.7+uSeed;
        float flow=n2(vec2(vUv.x*5.+uSeed,y*6.-t*2.));
        float fine=n2(vec2(vUv.x*13.+uSeed,y*12.-t*3.));
        float x=(vUv.x-.5)*2.+sin(y*9.-t*3.)*y*.16+(flow-.5)*y*.48;
        float envelope=pow(max(0.,1.-y),.7)*(.57+.17*sin(y*7.))+.06;
        float edge=envelope-abs(x)+(flow-.5)*.26;
        float mask=smoothstep(-.06,.13,edge)*smoothstep(0.,.09,y)*(1.-smoothstep(.8,1.,y));
        float wisps=smoothstep(.18,.53,flow+fine*.28-y*.28);
        float heat=clamp((1.-abs(x)/max(.1,envelope))*(1.-y*.7)*(.5+.5*flow)+flow*.23,0.,1.);
        vec3 color=mix(vec3(.95,.055,.004),vec3(1.,.38,.015),smoothstep(.1,.5,heat));
        color=mix(color,vec3(1.,.9,.48),smoothstep(.58,.96,heat));
        float alpha=mask*wisps*uOpacity*.85;if(alpha<.01)discard;
        gl_FragColor=vec4(color,alpha);
        #include <colorspace_fragment>
      }`,
    transparent:true, depthWrite:false, side:THREE.DoubleSide, toneMapped:false,
  });
  material.userData.opacity=1;material.userData.element='fire';
  const group=new THREE.Group();group.name='turbulent-flame-envelope';
  const geometry=new THREE.PlaneGeometry(width,height);geometry.translate(0,height/2,0);
  for(let i=0;i<3;i++){const sheet=new THREE.Mesh(geometry,material);sheet.rotation.y=i*Math.PI/3;sheet.renderOrder=6;group.add(sheet);}
  const update = (time: number) => { material.uniforms.uTime.value=time; group.scale.set(1+Math.sin(time*13+seed)*.06,1+Math.sin(time*17+seed)*.08,1); };
  return { root: group, material, update };
}

