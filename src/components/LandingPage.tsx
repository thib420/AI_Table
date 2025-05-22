"use client";

import React, { useState } from 'react';
import { Search, Sparkles, Shield, ArrowRight, Check, Globe, Database, Brain, Target } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { DemoModal } from '@/components/DemoModal';

interface LandingPageProps {
  onGetStarted: () => void;
}

export function LandingPage({ onGetStarted }: LandingPageProps) {
  const [isDemoModalOpen, setIsDemoModalOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-blue-500 rounded-lg flex items-center justify-center">
                <Search className="h-4 w-4 text-white" />
              </div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                AI Table
              </h1>
            </div>
            <Button onClick={onGetStarted} className="bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600">
              Get Started
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 px-6">
        <div className="container mx-auto text-center max-w-4xl">
          <Badge variant="secondary" className="mb-6 bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300">
            <Sparkles className="w-3 h-3 mr-1" />
            AI-Powered Professional Search
          </Badge>
          
          <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-purple-600 via-blue-600 to-indigo-600 bg-clip-text text-transparent leading-tight">
            Find & Analyze
            <br />
            Professional Profiles
            <br />
            <span className="text-4xl md:text-5xl">with AI Intelligence</span>
          </h1>
          
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto leading-relaxed">
            Transform your professional networking and recruitment with AI-powered profile analysis. 
            Search LinkedIn profiles, extract insights, and build comprehensive contact databases in minutes.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <Button 
              onClick={onGetStarted} 
              size="lg" 
              className="bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-lg px-8 py-6"
            >
              Start Free Trial
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <Button 
              variant="outline" 
              size="lg" 
              className="text-lg px-8 py-6"
              onClick={() => setIsDemoModalOpen(true)}
            >
              Watch Demo
            </Button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-2xl mx-auto">
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-600">10M+</div>
              <div className="text-sm text-muted-foreground">Profiles Analyzed</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600">95%</div>
              <div className="text-sm text-muted-foreground">Accuracy Rate</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-indigo-600">50+</div>
              <div className="text-sm text-muted-foreground">AI Insights</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-6 bg-muted/30">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">Powerful Features for Modern Professionals</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Everything you need to find, analyze, and connect with the right professionals
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader>
                <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center mb-4">
                  <Search className="h-6 w-6 text-purple-600" />
                </div>
                <CardTitle>Smart Profile Search</CardTitle>
                <CardDescription>
                  Find professionals using natural language queries. Search by role, company, location, or skills.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader>
                <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center mb-4">
                  <Brain className="h-6 w-6 text-blue-600" />
                </div>
                <CardTitle>AI-Powered Analysis</CardTitle>
                <CardDescription>
                  Extract insights like company size, seniority level, contact information, and decision-making power.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader>
                <div className="w-12 h-12 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center mb-4">
                  <Database className="h-6 w-6 text-green-600" />
                </div>
                <CardTitle>Dynamic Tables</CardTitle>
                <CardDescription>
                  Organize data in customizable tables with sortable columns and real-time AI enrichment.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader>
                <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900 rounded-lg flex items-center justify-center mb-4">
                  <Target className="h-6 w-6 text-orange-600" />
                </div>
                <CardTitle>Contact Extraction</CardTitle>
                <CardDescription>
                  Automatically extract emails, phone numbers, locations, and optimal contact methods.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader>
                <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-900 rounded-lg flex items-center justify-center mb-4">
                  <Globe className="h-6 w-6 text-indigo-600" />
                </div>
                <CardTitle>Global Reach</CardTitle>
                <CardDescription>
                  Search across multiple regions and languages with intelligent profile matching.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader>
                <div className="w-12 h-12 bg-pink-100 dark:bg-pink-900 rounded-lg flex items-center justify-center mb-4">
                  <Shield className="h-6 w-6 text-pink-600" />
                </div>
                <CardTitle>Enterprise Security</CardTitle>
                <CardDescription>
                  Bank-level security with encrypted data storage and compliance with privacy regulations.
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 px-6">
        <div className="container mx-auto max-w-4xl">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">How It Works</h2>
            <p className="text-xl text-muted-foreground">
              Get started in minutes with our intuitive workflow
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-2xl font-bold text-white">1</span>
              </div>
              <h3 className="text-xl font-semibold mb-4">Search Profiles</h3>
              <p className="text-muted-foreground">
                Enter your search query using natural language. Find professionals by role, company, or skills.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-2xl font-bold text-white">2</span>
              </div>
              <h3 className="text-xl font-semibold mb-4">AI Analysis</h3>
              <p className="text-muted-foreground">
                Our AI automatically extracts insights and enriches profiles with valuable business intelligence.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-2xl font-bold text-white">3</span>
              </div>
              <h3 className="text-xl font-semibold mb-4">Export & Connect</h3>
              <p className="text-muted-foreground">
                Export your enriched data or use our built-in tools to reach out to your target prospects.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="py-20 px-6 bg-muted/30">
        <div className="container mx-auto max-w-5xl">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">Simple, Transparent Pricing</h2>
            <p className="text-xl text-muted-foreground">
              Choose the plan that fits your needs
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card className="border-2 border-muted">
              <CardHeader className="text-center">
                <CardTitle className="text-2xl">Starter</CardTitle>
                <div className="text-4xl font-bold mt-4">$29<span className="text-lg font-normal text-muted-foreground">/month</span></div>
                <CardDescription className="mt-2">Perfect for individuals and small teams</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  <li className="flex items-center">
                    <Check className="h-4 w-4 text-green-500 mr-2" />
                    100 profile searches/month
                  </li>
                  <li className="flex items-center">
                    <Check className="h-4 w-4 text-green-500 mr-2" />
                    Basic AI insights
                  </li>
                  <li className="flex items-center">
                    <Check className="h-4 w-4 text-green-500 mr-2" />
                    CSV export
                  </li>
                  <li className="flex items-center">
                    <Check className="h-4 w-4 text-green-500 mr-2" />
                    Email support
                  </li>
                </ul>
                <Button className="w-full mt-6" variant="outline">
                  Get Started
                </Button>
              </CardContent>
            </Card>

            <Card className="border-2 border-purple-500 relative">
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                <Badge className="bg-gradient-to-r from-purple-500 to-blue-500 text-white">
                  Most Popular
                </Badge>
              </div>
              <CardHeader className="text-center">
                <CardTitle className="text-2xl">Professional</CardTitle>
                <div className="text-4xl font-bold mt-4">$99<span className="text-lg font-normal text-muted-foreground">/month</span></div>
                <CardDescription className="mt-2">For growing businesses and teams</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  <li className="flex items-center">
                    <Check className="h-4 w-4 text-green-500 mr-2" />
                    1,000 profile searches/month
                  </li>
                  <li className="flex items-center">
                    <Check className="h-4 w-4 text-green-500 mr-2" />
                    Advanced AI insights
                  </li>
                  <li className="flex items-center">
                    <Check className="h-4 w-4 text-green-500 mr-2" />
                    Custom AI columns
                  </li>
                  <li className="flex items-center">
                    <Check className="h-4 w-4 text-green-500 mr-2" />
                    API access
                  </li>
                  <li className="flex items-center">
                    <Check className="h-4 w-4 text-green-500 mr-2" />
                    Priority support
                  </li>
                </ul>
                <Button className="w-full mt-6 bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600">
                  Start Free Trial
                </Button>
              </CardContent>
            </Card>

            <Card className="border-2 border-muted">
              <CardHeader className="text-center">
                <CardTitle className="text-2xl">Enterprise</CardTitle>
                <div className="text-4xl font-bold mt-4">Custom</div>
                <CardDescription className="mt-2">For large organizations</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  <li className="flex items-center">
                    <Check className="h-4 w-4 text-green-500 mr-2" />
                    Unlimited searches
                  </li>
                  <li className="flex items-center">
                    <Check className="h-4 w-4 text-green-500 mr-2" />
                    Custom AI models
                  </li>
                  <li className="flex items-center">
                    <Check className="h-4 w-4 text-green-500 mr-2" />
                    White-label solution
                  </li>
                  <li className="flex items-center">
                    <Check className="h-4 w-4 text-green-500 mr-2" />
                    Dedicated support
                  </li>
                  <li className="flex items-center">
                    <Check className="h-4 w-4 text-green-500 mr-2" />
                    SLA guarantee
                  </li>
                </ul>
                <Button className="w-full mt-6" variant="outline">
                  Contact Sales
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-6">
        <div className="container mx-auto text-center max-w-3xl">
          <h2 className="text-4xl font-bold mb-6">
            Ready to Transform Your Professional Search?
          </h2>
          <p className="text-xl text-muted-foreground mb-8">
            Join thousands of professionals who are already using AI Table to find and connect with the right people.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              onClick={onGetStarted} 
              size="lg" 
              className="bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-lg px-8 py-6"
            >
              Start Your Free Trial
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <Button 
              variant="outline" 
              size="lg" 
              className="text-lg px-8 py-6"
              onClick={() => setIsDemoModalOpen(true)}
            >
              Schedule Demo
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-muted/30 py-12 px-6">
        <div className="container mx-auto max-w-6xl">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-blue-500 rounded-lg flex items-center justify-center">
                  <Search className="h-4 w-4 text-white" />
                </div>
                <h3 className="text-lg font-bold">AI Table</h3>
              </div>
              <p className="text-sm text-muted-foreground">
                AI-powered professional search and analysis platform.
              </p>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>Features</li>
                <li>Pricing</li>
                <li>API</li>
                <li>Integrations</li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>About</li>
                <li>Blog</li>
                <li>Careers</li>
                <li>Contact</li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Support</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>Help Center</li>
                <li>Documentation</li>
                <li>Status</li>
                <li>Privacy Policy</li>
              </ul>
            </div>
          </div>
          
          <div className="border-t mt-8 pt-8 text-center text-sm text-muted-foreground">
            © 2024 AI Table. All rights reserved.
          </div>
        </div>
      </footer>

      {/* Demo Modal */}
      <DemoModal 
        isOpen={isDemoModalOpen} 
        onClose={() => setIsDemoModalOpen(false)} 
      />
    </div>
  );
} 