const BASE = 'https://jishya.com';

// Home page plus every section anchor on it.
const SECTIONS = ['', '#about', '#workshop', '#curriculum', '#reviews', '#faq', '#enroll'];

export default function sitemap() {
  const lastModified = new Date();
  return SECTIONS.map((hash) => ({
    url: hash ? `${BASE}/${hash}` : BASE,
    lastModified,
    changeFrequency: 'weekly',
    priority: hash === '' ? 1 : 0.7,
  }));
}
