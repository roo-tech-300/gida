import Head from 'expo-router/head';

const SITE_URL = 'https://gida.apartments';
const TITLE = 'Gida - The real estate spot for Nigerian Students';
const DESCRIPTION = 'Gida is the real estate platform for Nigerian students. Discover verified lodges around campus, match with compatible roommates and pay securely in one place.';

export function DefaultHead() {
  return (
    <Head>
      <title>{TITLE}</title>
      <meta name="description" content={DESCRIPTION} />
      <link rel="canonical" href={SITE_URL} />
      <meta property="og:type" content="website" />
      <meta property="og:site_name" content="Gida" />
      <meta property="og:title" content={TITLE} />
      <meta property="og:description" content={DESCRIPTION} />
      <meta property="og:url" content={SITE_URL} />
      <meta property="og:image" content={`${SITE_URL}/landing/gida.png`} />
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={TITLE} />
      <meta name="twitter:description" content={DESCRIPTION} />
      <meta name="twitter:image" content={`${SITE_URL}/landing/gida.png`} />
    </Head>
  );
}
