import dynamic from 'next/dynamic';
import Masthead from '../components/Masthead';
import Hero from '../components/Hero';
import WorkshopBand from '../components/WorkshopBand';
import BackToTop from '../components/BackToTop';
import { getAllData } from '../lib/api';

// ISR: the statically generated page is rebuilt in the background at most every 60 seconds.
export const revalidate = 60;

// Below-the-fold sections are code-split. They still render on the server, so SEO is unaffected.
const PhotoStrip = dynamic(() => import('../components/PhotoStrip'));
const Transform = dynamic(() => import('../components/Transform'));
const Curriculum = dynamic(() => import('../components/Curriculum'));
const WhoFor = dynamic(() => import('../components/WhoFor'));
const About = dynamic(() => import('../components/About'));
const Testimonials = dynamic(() => import('../components/Testimonials'));
const FAQ = dynamic(() => import('../components/FAQ'));
const UpcomingEvents = dynamic(() => import('../components/UpcomingEvents'));
const SocialFeed = dynamic(() => import('../components/SocialFeed'));
const ContactForm = dynamic(() => import('../components/ContactForm'));
const CTABand = dynamic(() => import('../components/CTABand'));
const Footer = dynamic(() => import('../components/Footer'));

export default async function Home() {
  const { workshop, stats, testimonials, faq, curriculum, gallery, workshops } = await getAllData();

  return (
    <div id="top" className="">
      <Masthead workshop={workshop} />
      <main>
        <Hero workshop={workshop} stats={stats} gallery={gallery} />
        <WorkshopBand workshop={workshop} />
        <UpcomingEvents workshops={workshops} priorityId={workshop.id} />
        <PhotoStrip gallery={gallery} />
        <Transform />
        <Curriculum curriculum={curriculum} />
        <WhoFor />
        <Testimonials testimonials={testimonials} />
        <About />
        <FAQ faq={faq} />
        <SocialFeed />
        <ContactForm />
        <CTABand workshop={workshop} />
      </main>
      <Footer />
      <BackToTop />
    </div>
  );
}
