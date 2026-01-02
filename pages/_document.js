import { Html, Head, Main, NextScript } from "next/document";

export default function Document() {
  return (
    <Html lang="pt-BR">
      <Head>
        {/* Favicon */}
        <link rel="icon" href="/favicon.png" type="image/png" />

        {/* (Opcional) compatibilidade extra */}
        <link rel="apple-touch-icon" href="/favicon.png" />
        <meta name="theme-color" content="#f59e0b" />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
