import './globals.css';
import { safeBaseUrlObject } from '@/lib/validate';

export const metadata = {
  metadataBase: safeBaseUrlObject(),
  title: {
    default: 'JRWay — sua página de links e fotos, do seu jeito',
    template: '%s · JRWay'
  },
  description:
    'Plataforma estilo Linktree: crie sua conta, personalize sua página com temas, cores, efeitos e fotos, e compartilhe todos os seus links em uma única URL.'
};

export const viewport = {
  themeColor: '#07080f',
  width: 'device-width',
  initialScale: 1
};

export default function RootLayout({ children }) {
  return (
    // suppressHydrationWarning: extensões de navegador (ex.: Bitdefender) injetam
    // atributos no <html>/<body> antes da hidratação — sem isso o React reclama.
    <html lang="pt-BR" suppressHydrationWarning={true}>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Space+Grotesk:wght@500;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body suppressHydrationWarning={true}>{children}</body>
    </html>
  );
}
