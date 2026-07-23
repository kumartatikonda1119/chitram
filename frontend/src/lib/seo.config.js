/**
 * Centralized SEO configuration for Chitram.
 * All default metadata, social links, and site info live here.
 */

const SEO_CONFIG = {
  siteName: "Chitram",
  siteUrl: "https://chitram.dev",
  defaultTitle: "Chitram | Movie Discovery Platform",
  defaultDescription:
    "Chitram is a modern movie discovery platform where cinema lovers can explore movies, TV shows, actors, and filmmakers, create personalized watchlists, write reviews, join engaging discussions, and receive intelligent recommendations. Designed for everyone passionate about cinema, Chitram combines powerful discovery tools with a vibrant community, making it easy to discover great stories, share opinions, connect with fellow movie enthusiasts, and explore the art and science of filmmaking.",
  defaultImage: "https://chitram.dev/film-icon.svg",
  themeColor: "#f59e0b",
  twitterHandle: "@chitramwebsite",
  locale: "en_US",

  // Creator info
  creator: {
    name: "Kumar Tatikonda",
    email: "kumartatikonda1119@gmail.com",
    website: "https://kumarr.me",
  },

  // Official social links — used in schema.org sameAs and OG
  socialLinks: {
    instagram: "https://www.instagram.com/chitram.website/",
    linkedin: "https://www.linkedin.com/in/chitramwebsite/",
    twitter: "https://x.com/chitramwebsite",
    github: "https://github.com/kumartatikonda1119/chitram",
  },

  // Contact
  contactEmail: "chitram.website@gmail.com",
};

/**
 * Build a canonical URL for a given path.
 * @param {string} path — route path, e.g. "/about"
 * @returns {string} full canonical URL
 */
export const getCanonicalUrl = (path = "/") => {
  const base = SEO_CONFIG.siteUrl;
  // HashRouter uses /#/ so canonical includes the hash
  if (path === "/") return base;
  return `${base}/#${path}`;
};

/**
 * Get all social link URLs as an array (for schema.org sameAs).
 */
export const getSocialLinksArray = () => {
  return Object.values(SEO_CONFIG.socialLinks);
};

export default SEO_CONFIG;
