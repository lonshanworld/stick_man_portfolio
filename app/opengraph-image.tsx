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
          <svg width="100" height="100" viewBox="0 0 24 24" fill="none" stroke="#fff2c8" strokeWidth="1.6" strokeLinecap="round" style={{ marginLeft: 24 }}>
            <circle cx="12" cy="12" r="4" />
            <path d="M12 2v2M12 20v2M2 12h2M20 12h2M4.93 4.93l1.42 1.42M17.65 17.65l1.42 1.42M4.93 19.07l1.42-1.42M17.65 6.35l1.42-1.42" />
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
