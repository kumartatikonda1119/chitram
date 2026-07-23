import { Helmet } from "react-helmet-async";
import SEO_CONFIG, { getCanonicalUrl } from "@/lib/seo.config";

/**
 * Reusable SEO component for every page.
 *
 * @param {object} props
 * @param {string} [props.title]       — Page title (appended with " | Chitram")
 * @param {string} [props.description] — Meta description (truncated to 160 chars)
 * @param {string} [props.image]       — OG / Twitter image URL
 * @param {string} [props.canonical]   — Canonical path (e.g. "/about")
 * @param {string} [props.type]        — OG type (default: "website")
 * @param {boolean} [props.noindex]    — If true, adds noindex robots tag
 */
const SEO = ({
  title,
  description,
  image,
  canonical,
  type = "website",
  noindex = false,
}) => {
  const pageTitle = title
    ? `${title} | ${SEO_CONFIG.siteName}`
    : SEO_CONFIG.defaultTitle;

  const pageDescription = description
    ? description.length > 160
      ? description.substring(0, 157) + "..."
      : description
    : SEO_CONFIG.defaultDescription;

  const pageImage = image || SEO_CONFIG.defaultImage;
  const pageCanonical = canonical
    ? getCanonicalUrl(canonical)
    : SEO_CONFIG.siteUrl;

  return (
    <Helmet>
      {/* Primary */}
      <title>{pageTitle}</title>
      <meta name="description" content={pageDescription} />
      <link rel="canonical" href={pageCanonical} />

      {/* Robots */}
      {noindex ? (
        <meta name="robots" content="noindex, nofollow" />
      ) : (
        <meta name="robots" content="index, follow" />
      )}

      {/* Open Graph */}
      <meta property="og:title" content={pageTitle} />
      <meta property="og:description" content={pageDescription} />
      <meta property="og:type" content={type} />
      <meta property="og:url" content={pageCanonical} />
      <meta property="og:image" content={pageImage} />
      <meta property="og:site_name" content={SEO_CONFIG.siteName} />
      <meta property="og:locale" content={SEO_CONFIG.locale} />

      {/* Twitter Card */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:site" content={SEO_CONFIG.twitterHandle} />
      <meta name="twitter:title" content={pageTitle} />
      <meta name="twitter:description" content={pageDescription} />
      <meta name="twitter:image" content={pageImage} />
    </Helmet>
  );
};

export default SEO;
