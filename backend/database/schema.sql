-- Dr. Jishya portfolio — MySQL schema + seed data
-- Run with:  mysql -u root -p < database/schema.sql

CREATE DATABASE IF NOT EXISTS jishya_db
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE jishya_db;

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS users (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  email       VARCHAR(255) UNIQUE NOT NULL,
  password    VARCHAR(255) NOT NULL,
  created_at  TIMESTAMP DEFAULT NOW()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS workshop (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  title       VARCHAR(255),
  subtitle    TEXT,
  date        VARCHAR(100),
  platform    VARCHAR(100),
  time_slot   VARCHAR(100),
  duration    VARCHAR(50),
  language    VARCHAR(50),
  price       VARCHAR(50),
  cta_link    VARCHAR(255),
  seats_note  VARCHAR(100),
  is_priority BOOLEAN NOT NULL DEFAULT FALSE,
  is_active   BOOLEAN NOT NULL DEFAULT TRUE,
  updated_at  TIMESTAMP DEFAULT NOW() ON UPDATE NOW()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS stats (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  label       VARCHAR(100),
  value       VARCHAR(50),
  sort_order  INT DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS testimonials (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  name        VARCHAR(100),
  location    VARCHAR(100),
  review      TEXT,
  rating      INT DEFAULT 5,
  is_active   BOOLEAN DEFAULT TRUE,
  sort_order  INT DEFAULT 0,
  created_at  TIMESTAMP DEFAULT NOW()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS faq (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  question    TEXT,
  answer      TEXT,
  sort_order  INT DEFAULT 0,
  is_active   BOOLEAN DEFAULT TRUE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS curriculum (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  module_no   INT,
  title       VARCHAR(100),
  description TEXT,
  is_active   BOOLEAN DEFAULT TRUE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS gallery (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  image_url   VARCHAR(255),
  caption     VARCHAR(255),
  category    ENUM('portrait','workshop','logo'),
  sort_order  INT DEFAULT 0,
  created_at  TIMESTAMP DEFAULT NOW()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS events (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  title       VARCHAR(255) NOT NULL,
  event_date  DATE NOT NULL,
  event_time  VARCHAR(100),
  location    VARCHAR(255),
  description TEXT,
  link        VARCHAR(255),
  is_active   BOOLEAN DEFAULT TRUE,
  created_at  TIMESTAMP DEFAULT NOW()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------------
-- Seed data (re-running this file will duplicate seed rows; use on a fresh DB)
-- ---------------------------------------------------------------------------

-- Admin user — password: Admin@123 (bcrypt, 12 salt rounds). CHANGE AFTER FIRST LOGIN.
INSERT INTO users (email, password) VALUES
  ('admin@jishya.com', '$2b$12$1W6zZy5Mgf3HdqVOr5NPt.b6s1LtyKH2P8C6Nu/mW7clMwSRU9KGO');

INSERT INTO workshop (title, subtitle, date, platform, time_slot, duration, language, price, cta_link, seats_note, is_priority) VALUES
  ('Grow Your Business & Personal Brand with AI + Digital Marketing',
   'PhD-led, step-by-step live training to get leads, build income, and grow your brand online — even starting from zero.',
   'October 22–23',
   'Zoom',
   '6:30–9:00 PM IST',
   '5 Hours',
   'Tamil',
   '₹999',
   'https://jishya.com/enroll',
   'Few left', TRUE);

INSERT INTO stats (label, value, sort_order) VALUES
  ('Students Trained',         '1500+', 1),
  ('Professionals Empowered',  '70K+',  2),
  ('Countries Reached',        '20+',   3),
  ('Digital Marketing',        'PhD',   4);

INSERT INTO testimonials (name, location, review, rating, is_active, sort_order) VALUES
  ('Alwin',      'Mumbai',     'I have understood the uniqueness of each digital platform. It helps me to choose the appropriate platform. I will implement this in my YouTube Channel shortly.', 5, TRUE, 1),
  ('Sam',        'Malaysia',   'I learned to digitise all my knowledge for better digital visibility. Algorithms & Keywords. The concept delivery was good and clear.', 5, TRUE, 2),
  ('Larissa',    'France',     'I learned the foundations of Digital Marketing. Jishya is approachable and teaches in an easier way.', 5, TRUE, 3),
  ('Anto',       'UAE',        'Using ChatGPT to frame content outlines, how to schedule a 30-day content plan. I am referring this to my friends.', 5, TRUE, 4),
  ('Ann George', 'Texas, USA', 'The teaching is so good and crystal clear that even a fresher can understand. Jishya taught from the heart.', 5, TRUE, 5),
  ('Femi',       'Maldives',   'I''m a Nurse. After 2 days with Dr. Jishya I realised digital marketing is for everyone — not just IT professionals.', 5, TRUE, 6);

INSERT INTO faq (question, answer, sort_order, is_active) VALUES
  ('Who is this workshop for?',
   'Suitable for homemakers, students, office goers and business owners. No prior experience needed.', 1, TRUE),
  ('What time and date?',
   'October 22nd & 23rd, 6:30–9:00 PM IST on Zoom. 5 hours across 2 days.', 2, TRUE),
  ('Will I get a recording?',
   'LIVE session only. No recordings. Attend live for full experience and interactive Q&A.', 3, TRUE),
  ('How will I get the link?',
   'Email or WhatsApp 24 hours before. Check inbox and spam folder.', 4, TRUE),
  ('I want more help in my business?',
   '1-on-1 consulting program starting at ₹2,499/hour.', 5, TRUE),
  ('Didn''t receive mail after payment?',
   'Check inbox and spam for info@jishya.com. Write to us if not received.', 6, TRUE);

INSERT INTO curriculum (module_no, title, description, is_active) VALUES
  (1, 'SEO Essentials',
      'Rank higher on Google and get discovered by the right audience organically. Understand what drives search traffic.', TRUE),
  (2, 'Keyword Research & Tools',
      'Find the right keywords your audience is searching for using free and pro tools Dr. Jishya personally uses.', TRUE),
  (3, 'Content Strategy & Planning',
      'Build a 365-day content calendar. Create content that converts, engages, and keeps your audience coming back.', TRUE),
  (4, 'Social Media Growth',
      'Leverage Instagram, Facebook & LinkedIn for maximum organic reach. Understand algorithms and viral content.', TRUE),
  (5, 'Freelancing & Personal Brand',
      'Discover high-paying freelance opportunities. Build a personal brand that attracts clients.', TRUE),
  (6, 'YouTube & Analytics',
      'Grow and monetise your YouTube channel. Understand data-driven strategies that compound over time.', TRUE);

-- Visitor enquiries submitted from the landing page contact form.
CREATE TABLE IF NOT EXISTS enquiries (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  name        VARCHAR(100) NOT NULL,
  email       VARCHAR(255) NULL,
  phone       VARCHAR(30)  NULL,
  message     TEXT NOT NULL,
  is_read     BOOLEAN NOT NULL DEFAULT FALSE,
  created_at  TIMESTAMP DEFAULT NOW(),
  INDEX idx_enquiries_read_created (is_read, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
