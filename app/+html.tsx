import { ScrollViewStyleReset } from 'expo-router/html';

import { DesignColors } from '@/constants/design';

export default function Root({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Outfit:wght@400;500;600;700;800&family=Playfair+Display:ital,wght@0,400;0,500;0,600;0,700;1,400&display=swap"
          rel="stylesheet"
        />
        <ScrollViewStyleReset />
        <style>{`
          html, body, #root {
            height: 100%;
            background-color: ${DesignColors.surfaceContainerLowest};
          }
          body {
            font-family: 'Outfit', Inter, system-ui, -apple-system, sans-serif;
          }
          @keyframes floatAnim {
            0% { transform: translateY(0px); }
            50% { transform: translateY(-14px); }
            100% { transform: translateY(0px); }
          }
          @keyframes floatTiltAnim {
            0% { transform: rotate(10deg) translateY(0px); }
            50% { transform: rotate(10deg) translateY(-10px); }
            100% { transform: rotate(10deg) translateY(0px); }
          }
          @keyframes pulseGlow {
            0%, 100% { box-shadow: 0 12px 36px rgba(157, 126, 67, 0.35); }
            50% { box-shadow: 0 18px 55px rgba(157, 126, 67, 0.55); }
          }
          @keyframes fadeSlideUp {
            from { opacity: 0; transform: translateY(28px); }
            to { opacity: 1; transform: translateY(0); }
          }
          .anim-float {
            animation: floatAnim 6s ease-in-out infinite;
          }
          .anim-float-delayed {
            animation: floatAnim 6s ease-in-out 1.2s infinite;
          }
          .anim-float-tilt {
            animation: floatTiltAnim 6s ease-in-out infinite;
          }
          .anim-glow {
            animation: pulseGlow 3s ease-in-out infinite;
          }
          .anim-fade-up {
            animation: fadeSlideUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards;
          }
          .glass-pill {
            background: rgba(255, 255, 255, 0.12) !important;
            border: 1px solid rgba(255, 255, 255, 0.25) !important;
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.25), inset 0 1px 0 rgba(255, 255, 255, 0.25) !important;
            backdrop-filter: blur(24px) saturate(160%) !important;
            -webkit-backdrop-filter: blur(24px) saturate(160%) !important;
          }
        `}</style>
      </head>
      <body>{children}</body>
    </html>
  );
}
