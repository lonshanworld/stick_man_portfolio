'use client';

import { useEffect, useRef } from 'react';

/** Keep the real heading readable while the polished WebGL lettering loads. */
export function HeroName3D({ name }: { name: string }) {
  const hostRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    let cancelled = false;
    let dispose: (() => void) | undefined;

    async function initialize() {
      const [THREE, { TextGeometry }, { FontLoader }, { RoomEnvironment }, fontData] = await Promise.all([
        import('three'),
        import('three/addons/geometries/TextGeometry.js'),
        import('three/addons/loaders/FontLoader.js'),
        import('three/addons/environments/RoomEnvironment.js'),
        fetch('/fonts/helvetiker_bold.typeface.json').then(response => {
          if (!response.ok) throw new Error('Unable to load hero font');
          return response.json();
        }),
      ]);
      if (cancelled || !host) return;

      const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.setClearColor(0x000000, 0);
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.15;
      renderer.domElement.setAttribute('aria-hidden', 'true');
      host.appendChild(renderer.domElement);

      const scene = new THREE.Scene();
      const camera = new THREE.OrthographicCamera(-4, 4, 1, -1, .1, 30);
      camera.position.set(0, 0, 10);

      // A studio environment supplies actual softbox reflections on the bevels.
      const room = new RoomEnvironment();
      const pmrem = new THREE.PMREMGenerator(renderer);
      const environment = pmrem.fromScene(room, .025);
      scene.environment = environment.texture;
      room.dispose();
      pmrem.dispose();

      const geometry = new TextGeometry(name, {
        font: new FontLoader().parse(fontData),
        size: 1,
        depth: .18,
        curveSegments: 24,
        bevelEnabled: true,
        bevelThickness: .035,
        bevelSize: .025,
        bevelSegments: 6,
      });
      geometry.center();
      geometry.computeBoundingBox();
      const bounds = geometry.boundingBox!;
      const textWidth = bounds.max.x - bounds.min.x;
      const textHeight = bounds.max.y - bounds.min.y;

      // Broad reflected studio lights across the face, with real environment
      // reflections providing the sharper highlights along each rounded edge.
      const finishCanvas = document.createElement('canvas');
      finishCanvas.width = 1024;
      finishCanvas.height = 256;
      const finishContext = finishCanvas.getContext('2d')!;
      const finish = new THREE.CanvasTexture(finishCanvas);
      finish.colorSpace = THREE.SRGBColorSpace;
      const positions = geometry.getAttribute('position');
      const uvs = geometry.getAttribute('uv');
      for (let i = 0; i < positions.count; i++) {
        uvs.setXY(i, (positions.getX(i) - bounds.min.x) / textWidth, (positions.getY(i) - bounds.min.y) / textHeight);
      }
      uvs.needsUpdate = true;
      const material = new THREE.MeshPhysicalMaterial({
        color: 0xffffff,
        map: finish,
        metalness: .72,
        roughness: .25,
        clearcoat: .65,
        clearcoatRoughness: .18,
        envMapIntensity: 1.5,
      });
      const edgeMaterial = new THREE.MeshPhysicalMaterial({
        color: 0x8794a7,
        metalness: .85,
        roughness: .2,
        envMapIntensity: 1.5,
      });
      const text = new THREE.Mesh(geometry, [material, edgeMaterial]);
      text.rotation.set(.08, -.14, 0);
      scene.add(text);

      const keyLight = new THREE.DirectionalLight(0xffffff, 4);
      keyLight.position.set(-3, 5, 10);
      scene.add(keyLight);
      const rimLight = new THREE.DirectionalLight(0xeeeeee, 3);
      rimLight.position.set(4, 1, 3);
      scene.add(rimLight);

      let frame = 0;
      const render = () => {
        cancelAnimationFrame(frame);
        frame = requestAnimationFrame(() => {
          renderer.render(scene, camera);
          host.dataset.ready = 'true';
        });
      };
      const resize = () => {
        const width = host.clientWidth;
        const height = host.clientHeight * 1.5;
        if (!width || !height) return;
        renderer.setSize(width, height, false);
        const aspect = width / height;
        const viewHeight = Math.max(textHeight * 1.55, (textWidth + .35) / aspect);
        camera.left = -viewHeight * aspect / 2;
        camera.right = viewHeight * aspect / 2;
        camera.top = viewHeight / 2;
        camera.bottom = -viewHeight / 2;
        camera.updateProjectionMatrix();
        render();
      };
      const updateTheme = () => {
        const dark = document.documentElement.dataset.theme !== 'light';
        const gradient = finishContext.createLinearGradient(0, 0, 0, 256);
        const tones = dark
          ? ['#f2f2ef', '#d4d4d0', '#ffffff', '#b8b8b4', '#e7e7e3', '#f5f5f2']
          : ['#242424', '#121212', '#454545', '#1c1c1c', '#323232', '#202020'];
        [0, .24, .43, .56, .78, 1].forEach((stop, i) => gradient.addColorStop(stop, tones[i]));
        finishContext.fillStyle = gradient;
        finishContext.fillRect(0, 0, 1024, 256);
        finish.needsUpdate = true;
        material.metalness = dark ? .35 : .3;
        material.envMapIntensity = dark ? 1 : .55;
        edgeMaterial.color.set(dark ? 0xc5c5c1 : 0x292929);
        edgeMaterial.envMapIntensity = dark ? 1.2 : .6;
        render();
      };
      const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
      const onPointerMove = (event: PointerEvent) => {
        if (motion.matches || event.pointerType === 'touch') return;
        const rect = host.getBoundingClientRect();
        const x = (event.clientX - rect.left) / rect.width - .5;
        keyLight.position.x = -3 + x * 3;
        text.rotation.y = -.14 + x * .035;
        render();
      };
      const onPointerLeave = () => {
        keyLight.position.x = -3;
        text.rotation.y = -.14;
        render();
      };
      const resizeObserver = new ResizeObserver(resize);
      resizeObserver.observe(host);
      const themeObserver = new MutationObserver(updateTheme);
      themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
      host.addEventListener('pointermove', onPointerMove);
      host.addEventListener('pointerleave', onPointerLeave);
      updateTheme();
      resize();

      dispose = () => {
        cancelAnimationFrame(frame);
        resizeObserver.disconnect();
        themeObserver.disconnect();
        host.removeEventListener('pointermove', onPointerMove);
        host.removeEventListener('pointerleave', onPointerLeave);
        delete host.dataset.ready;
        renderer.domElement.remove();
        geometry.dispose();
        material.dispose();
        edgeMaterial.dispose();
        finish.dispose();
        environment.dispose();
        renderer.dispose();
      };
    }

    // Plain text remains available on browsers that cannot create a WebGL context.
    void initialize().catch(error => {
      console.warn('3D hero lettering is unavailable; showing the text fallback.', error);
      dispose?.();
    });
    return () => {
      cancelled = true;
      dispose?.();
    };
  }, [name]);

  return <span ref={hostRef} className="folio-masthead-name">{name}</span>;
}
