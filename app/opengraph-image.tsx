import { ImageResponse } from 'next/og';

export const alt = 'Lon Shan — Full-Stack and Creative Software Engineer';
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = 'image/png';

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          padding: '72px',
          color: '#fff0e0',
          background: 'radial-gradient(circle at 75% 20%, #3a0a00 0%, #08030a 58%, #050711 100%)',
          fontFamily: 'sans-serif',
        }}
      >
        <div style={{ display: 'flex', color: '#ff9900', fontSize: 24, letterSpacing: 8 }}>
          LON SHAN
        </div>
        <div style={{ display: 'flex', marginTop: 24, fontSize: 72, fontWeight: 800, letterSpacing: -2 }}>
          Full-Stack &amp; Creative
        </div>
        <div style={{ display: 'flex', fontSize: 72, fontWeight: 800, letterSpacing: -2 }}>
          Software Engineer
        </div>
        <div style={{ display: 'flex', marginTop: 30, color: '#ffb899', fontSize: 28 }}>
          Next.js · Flutter · TypeScript · 3D WebGL
        </div>
      </div>
    ),
    size,
  );
}
