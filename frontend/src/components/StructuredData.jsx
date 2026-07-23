import { Helmet } from "react-helmet-async";
import SEO_CONFIG, { getSocialLinksArray, getCanonicalUrl } from "@/lib/seo.config";

/**
 * Injects JSON-LD structured data into the page <head>.
 *
 * Usage:
 *   <StructuredData type="website" />              — homepage
 *   <StructuredData type="movie" data={movieObj} /> — movie page
 *   <StructuredData type="series" data={seriesObj} />
 *   <StructuredData type="person" data={personObj} />
 */
const StructuredData = ({ type = "website", data = {} }) => {
  const schemas = [];

  // Always include Organization
  const orgSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: SEO_CONFIG.siteName,
    url: SEO_CONFIG.siteUrl,
    logo: SEO_CONFIG.defaultImage,
    contactPoint: {
      "@type": "ContactPoint",
      email: SEO_CONFIG.contactEmail,
      contactType: "customer support",
    },
    sameAs: getSocialLinksArray(),
  };
  schemas.push(orgSchema);

  if (type === "website") {
    // WebSite with SearchAction
    const websiteSchema = {
      "@context": "https://schema.org",
      "@type": "WebSite",
      name: SEO_CONFIG.siteName,
      url: SEO_CONFIG.siteUrl,
      description: SEO_CONFIG.defaultDescription,
      potentialAction: {
        "@type": "SearchAction",
        target: {
          "@type": "EntryPoint",
          urlTemplate: `${SEO_CONFIG.siteUrl}/#/search?q={search_term_string}`,
        },
        "query-input": "required name=search_term_string",
      },
    };
    schemas.push(websiteSchema);
  }

  if (type === "movie" && data.title) {
    const movieSchema = {
      "@context": "https://schema.org",
      "@type": "Movie",
      name: data.title,
      description: data.overview || "",
      image: data.poster
        ? `https://image.tmdb.org/t/p/w500${data.poster}`
        : SEO_CONFIG.defaultImage,
      datePublished: data.releaseDate || "",
      genre: data.genres || [],
      url: getCanonicalUrl(`/movie/${data.id}`),
    };
    if (data.rating) {
      movieSchema.aggregateRating = {
        "@type": "AggregateRating",
        ratingValue: data.rating,
        bestRating: 10,
        ratingCount: data.voteCount || 1,
      };
    }
    if (data.director) {
      movieSchema.director = {
        "@type": "Person",
        name: data.director,
      };
    }
    schemas.push(movieSchema);
  }

  if (type === "series" && data.title) {
    const seriesSchema = {
      "@context": "https://schema.org",
      "@type": "TVSeries",
      name: data.title,
      description: data.overview || "",
      image: data.poster
        ? `https://image.tmdb.org/t/p/w500${data.poster}`
        : SEO_CONFIG.defaultImage,
      datePublished: data.firstAirDate || "",
      genre: data.genres || [],
      numberOfSeasons: data.numberOfSeasons || undefined,
      url: getCanonicalUrl(`/series/${data.id}`),
    };
    if (data.rating) {
      seriesSchema.aggregateRating = {
        "@type": "AggregateRating",
        ratingValue: data.rating,
        bestRating: 10,
        ratingCount: data.voteCount || 1,
      };
    }
    schemas.push(seriesSchema);
  }

  if (type === "person" && data.name) {
    const personSchema = {
      "@context": "https://schema.org",
      "@type": "Person",
      name: data.name,
      description: data.biography || "",
      image: data.profilePath
        ? `https://image.tmdb.org/t/p/w500${data.profilePath}`
        : undefined,
      birthDate: data.birthday || undefined,
      birthPlace: data.placeOfBirth || undefined,
      url: getCanonicalUrl(`/person/${data.id}`),
    };
    schemas.push(personSchema);
  }

  return (
    <Helmet>
      {schemas.map((schema, i) => (
        <script
          key={i}
          type="application/ld+json"
        >
          {JSON.stringify(schema)}
        </script>
      ))}
    </Helmet>
  );
};

export default StructuredData;
