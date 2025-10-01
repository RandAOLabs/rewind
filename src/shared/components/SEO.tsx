// src/components/SEO.tsx
import { useEffect } from "react";

interface SEOProps {
  title?: string;
  description?: string;
  image?: string;
}

export default function SEO({
  title = "Rewind",
  description = "Explore ArNS history and details.",
  image = "/REWIND_WHITE_LOGO.png",
}: SEOProps) {
  useEffect(() => {
    document.title = title;

    const setMeta = (name: string, content: string) => {
      let el = document.querySelector(`meta[name="${name}"]`) as HTMLMetaElement | null;
      if (!el) {
        el = document.createElement("meta");
        el.setAttribute("name", name);
        document.head.appendChild(el);
      }
      el.setAttribute("content", content);
    };

    const setOG = (property: string, content: string) => {
      let el = document.querySelector(`meta[property="${property}"]`) as HTMLMetaElement | null;
      if (!el) {
        el = document.createElement("meta");
        el.setAttribute("property", property);
        document.head.appendChild(el);
      }
      el.setAttribute("content", content);
    };

    setMeta("description", description);
    setMeta("twitter:card", "summary_large_image");
    setMeta("twitter:title", title);
    setMeta("twitter:description", description);
    setMeta("twitter:image", image);

    setOG("og:title", title);
    setOG("og:description", description);
    setOG("og:image", image);
    setOG("og:type", "website");
    setOG("og:site_name", "Rewind");
  }, [title, description, image]);

  return null;
}
