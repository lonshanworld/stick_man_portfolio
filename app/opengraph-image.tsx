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
          justifyContent: 'space-between',
          padding: '54px 64px',
          color: '#e9e6dc',
          background: '#1e1e21',
          fontFamily: 'sans-serif',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: 20, borderBottom: '1px solid #55534c', fontSize: 16, letterSpacing: 2 }}>
          <span>INDEPENDENT MIND. THOUGHTFUL ENGINEERING.</span>
          <span>BANGKOK / WORLDWIDE</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', fontSize: 148, fontWeight: 700, letterSpacing: -9 }}>
          Lon Shan
          <svg width="100" height="100" viewBox="0 0 100 100" style={{ marginLeft: 24 }}>
            <g stroke="#fff2c8" strokeWidth="7"><path d="M50 4v92M4 50h92M17 17l66 66M17 83l66-66" /></g>
          </svg>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', paddingTop: 30, borderTop: '1px solid #55534c' }}>
          <span style={{ fontSize: 40, letterSpacing: -1 }}>Creative by instinct.</span>
          <span style={{ fontSize: 44, fontFamily: 'serif', fontStyle: 'italic', color: '#fff2c8', letterSpacing: -1 }}>Steady by design.</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', color: '#b7b4aa', fontSize: 17 }}>
          <span>WEB & SYSTEMS / MOBILE / CREATIVE CODE</span><span>LONSHAN.COM</span>
        </div>
      </div>
    ),
    size,
  );
}
