import { Metadata } from 'next';
import { generateSEOMetadata } from '@/shared/utils/seo';

export const metadata: Metadata = generateSEOMetadata({
  title: 'About Converr - AI-Powered Professional Intelligence Platform',
  description: 'Learn about Converr\'s mission to transform professional networking with AI. Discover our story, team, and commitment to helping businesses grow through intelligent lead generation.',
  canonical: '/about',
  keywords: ['about converr', 'AI company', 'professional intelligence', 'team', 'mission', 'vision'],
});

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-white">
      <div className="container mx-auto px-6 py-20 max-w-4xl">
        <header className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold mb-6 text-gray-900">
            About Converr
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            We're revolutionizing how businesses discover, analyze, and connect with 
            professional opportunities through the power of artificial intelligence.
          </p>
        </header>

        <section className="mb-16">
          <h2 className="text-3xl font-bold mb-6 text-gray-900">Our Mission</h2>
          <p className="text-lg text-gray-600 mb-6">
            At Converr, we believe that building meaningful professional relationships 
            shouldn't be a time-consuming, manual process. Our mission is to empower 
            businesses of all sizes with AI-powered tools that make professional 
            networking efficient, accurate, and scalable.
          </p>
          <p className="text-lg text-gray-600">
            We're transforming the way companies find and connect with the right 
            professionals, turning hours of manual research into minutes of intelligent, 
            targeted outreach.
          </p>
        </section>

        <section className="mb-16">
          <h2 className="text-3xl font-bold mb-6 text-gray-900">Our Story</h2>
          <p className="text-lg text-gray-600 mb-6">
            Founded in 2024, Converr was born from the frustration of spending countless 
            hours on manual prospect research. Our founders, experienced in both AI 
            technology and business development, recognized the need for a more intelligent 
            approach to professional networking.
          </p>
          <p className="text-lg text-gray-600 mb-6">
            Starting with a simple question - "What if AI could understand professional 
            relationships as well as humans do?" - we've built a platform that combines 
            advanced machine learning with comprehensive professional data to deliver 
            unprecedented insights and efficiency.
          </p>
          <p className="text-lg text-gray-600">
            Today, we're proud to serve over 500 companies worldwide, helping them 
            build stronger professional networks and drive revenue growth through 
            intelligent lead generation.
          </p>
        </section>

        <section className="mb-16">
          <h2 className="text-3xl font-bold mb-6 text-gray-900">Our Values</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-gray-50 p-6 rounded-lg">
              <h3 className="text-xl font-semibold mb-3 text-gray-900">Innovation</h3>
              <p className="text-gray-600">
                We continuously push the boundaries of what's possible with AI, 
                always seeking better ways to solve professional networking challenges.
              </p>
            </div>
            <div className="bg-gray-50 p-6 rounded-lg">
              <h3 className="text-xl font-semibold mb-3 text-gray-900">Privacy</h3>
              <p className="text-gray-600">
                We maintain the highest standards of data protection and privacy, 
                ensuring our users' information is always secure and compliant.
              </p>
            </div>
            <div className="bg-gray-50 p-6 rounded-lg">
              <h3 className="text-xl font-semibold mb-3 text-gray-900">Accuracy</h3>
              <p className="text-gray-600">
                We're committed to providing the most accurate and up-to-date 
                professional intelligence available in the market.
              </p>
            </div>
            <div className="bg-gray-50 p-6 rounded-lg">
              <h3 className="text-xl font-semibold mb-3 text-gray-900">Simplicity</h3>
              <p className="text-gray-600">
                We believe powerful technology should be easy to use, making 
                sophisticated AI accessible to businesses of all sizes.
              </p>
            </div>
          </div>
        </section>

        <section className="text-center">
          <h2 className="text-3xl font-bold mb-6 text-gray-900">Ready to Get Started?</h2>
          <p className="text-lg text-gray-600 mb-8">
            Join the companies already transforming their professional networking with Converr.
          </p>
          <a 
            href="/"
            className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-slate-800 to-blue-600 text-white font-medium rounded-lg hover:from-slate-900 hover:to-blue-700 transition-colors"
          >
            Start Your Free Trial
          </a>
        </section>
      </div>
    </main>
  );
} 