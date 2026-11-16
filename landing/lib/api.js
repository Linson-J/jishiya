import axios from 'axios';

export const API_URL = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000').replace(/\/+$/, '');

const http = axios.create({
  baseURL: API_URL,
  timeout: 5000,
  headers: { Accept: 'application/json' },
});

/* -------------------------------------------------------------------------- */
/* Fallback data — used whenever the API is down or returns nothing useful,   */
/* so the page is never empty.                                                */
/* -------------------------------------------------------------------------- */

export const FALLBACK_WORKSHOP = {
  title: 'Grow Your Business & Personal Brand with AI + Digital Marketing',
  subtitle:
    'PhD-led, step-by-step live training to get leads, build income, and grow your brand online — even starting from zero.',
  date: 'October 22–23',
  platform: 'Zoom',
  time_slot: '6:30–9:00 PM IST',
  duration: '5 Hours',
  language: 'Tamil',
  price: '₹999',
  cta_link: '#enroll',
  seats_note: 'Few left',
};

export const FALLBACK_STATS = [
  { id: 1, label: 'Students Trained', value: '1500+' },
  { id: 2, label: 'Professionals Empowered', value: '70K+' },
  { id: 3, label: 'Countries Reached', value: '20+' },
  { id: 4, label: 'Digital Marketing', value: 'PhD' },
];

export const FALLBACK_TESTIMONIALS = [
  {
    id: 1,
    name: 'Alwin',
    location: 'Mumbai',
    rating: 5,
    review:
      'I have understood the uniqueness of each digital platform. It helps me to choose the appropriate platform. I will implement this in my YouTube Channel shortly.',
  },
  {
    id: 2,
    name: 'Sam',
    location: 'Malaysia',
    rating: 5,
    review:
      'I learned to digitise all my knowledge for better digital visibility. Algorithms & Keywords. The concept delivery was good and clear.',
  },
  {
    id: 3,
    name: 'Larissa',
    location: 'France',
    rating: 5,
    review: 'I learned the foundations of Digital Marketing. Jishya is approachable and teaches in an easier way.',
  },
  {
    id: 4,
    name: 'Anto',
    location: 'UAE',
    rating: 5,
    review:
      'Using ChatGPT to frame content outlines, how to schedule a 30-day content plan. I am referring this to my friends.',
  },
  {
    id: 5,
    name: 'Ann George',
    location: 'Texas, USA',
    rating: 5,
    review:
      'The teaching is so good and crystal clear that even a fresher can understand. Jishya taught from the heart.',
  },
  {
    id: 6,
    name: 'Femi',
    location: 'Maldives',
    rating: 5,
    review:
      "I'm a Nurse. After 2 days with Dr. Jishya I realised digital marketing is for everyone — not just IT professionals.",
  },
];

export const FALLBACK_FAQ = [
  {
    id: 1,
    question: 'Who is this workshop for?',
    answer: 'Suitable for homemakers, students, office goers and business owners. No prior experience needed.',
  },
  {
    id: 2,
    question: 'What time and date?',
    answer: 'October 22nd & 23rd, 6:30–9:00 PM IST on Zoom. 5 hours across 2 days.',
  },
  {
    id: 3,
    question: 'Will I get a recording?',
    answer: 'LIVE session only. No recordings. Attend live for full experience and interactive Q&A.',
  },
  {
    id: 4,
    question: 'How will I get the link?',
    answer: 'Email or WhatsApp 24 hours before. Check inbox and spam folder.',
  },
  {
    id: 5,
    question: 'I want more help in my business?',
    answer: '1-on-1 consulting program starting at ₹2,499/hour.',
  },
  {
    id: 6,
    question: "Didn't receive mail after payment?",
    answer: 'Check inbox and spam for info@jishya.com. Write to us if not received.',
  },
];

export const FALLBACK_CURRICULUM = [
  {
    id: 1,
    module_no: 1,
    title: 'SEO Essentials',
    description:
      'Rank higher on Google and get discovered by the right audience organically. Understand what drives search traffic.',
  },
  {
    id: 2,
    module_no: 2,
    title: 'Keyword Research & Tools',
    description:
      'Find the right keywords your audience is searching for using free and pro tools Dr. Jishya personally uses.',
  },
  {
    id: 3,
    module_no: 3,
    title: 'Content Strategy & Planning',
    description:
      'Build a 365-day content calendar. Create content that converts, engages, and keeps your audience coming back.',
  },
  {
    id: 4,
    module_no: 4,
    title: 'Social Media Growth',
    description:
      'Leverage Instagram, Facebook & LinkedIn for maximum organic reach. Understand algorithms and viral content.',
  },
  {
    id: 5,
    module_no: 5,
    title: 'Freelancing & Personal Brand',
    description: 'Discover high-paying freelance opportunities. Build a personal brand that attracts clients.',
  },
  {
    id: 6,
    module_no: 6,
    title: 'YouTube & Analytics',
    description:
      'Grow and monetise your YouTube channel. Understand data-driven strategies that compound over time.',
  },
];

// No photos until the client supplies them; components render placeholders.
export const FALLBACK_GALLERY = [];

/* -------------------------------------------------------------------------- */
/* Fetchers                                                                   */
/* -------------------------------------------------------------------------- */

async function load(path, fallback, isUsable) {
  try {
    const { data } = await http.get(path);
    return isUsable(data) ? data : fallback;
  } catch (err) {
    console.warn(`[api] GET ${path} failed (${err.message}) — using fallback data`);
    return fallback;
  }
}

const nonEmptyArray = (d) => Array.isArray(d) && d.length > 0;
const anyArray = (d) => Array.isArray(d);
const workshopOk = (d) => d && typeof d === 'object' && !Array.isArray(d) && typeof d.title === 'string';

export const getWorkshop = () => load('/api/workshop', FALLBACK_WORKSHOP, workshopOk);
export const getStats = () => load('/api/stats', FALLBACK_STATS, nonEmptyArray);
export const getTestimonials = () => load('/api/testimonials', FALLBACK_TESTIMONIALS, nonEmptyArray);
export const getFaq = () => load('/api/faq', FALLBACK_FAQ, nonEmptyArray);
export const getCurriculum = () => load('/api/curriculum', FALLBACK_CURRICULUM, nonEmptyArray);
export const getGallery = () => load('/api/gallery', FALLBACK_GALLERY, anyArray);
export const getWorkshops = () => load('/api/workshop/list', [], anyArray);

/** Fetches everything the landing page needs, in parallel. */
export async function getAllData() {
  const [workshop, stats, testimonials, faq, curriculum, gallery, workshops] = await Promise.all([
    getWorkshop(),
    getStats(),
    getTestimonials(),
    getFaq(),
    getCurriculum(),
    getGallery(),
    getWorkshops(),
  ]);
  return { workshop, stats, testimonials, faq, curriculum, gallery, workshops };
}

/** Turns "/uploads/gallery/x.jpg" into an absolute URL on the backend. */
export function assetUrl(path) {
  if (!path) return '';
  if (/^https?:\/\//i.test(path)) return path;
  return `${API_URL}${path.startsWith('/') ? '' : '/'}${path}`;
}
