import { useSeoMeta } from '@unhead/react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Brain, Clock, TrendingUp, BookOpen } from 'lucide-react';

const Index = () => {
  useSeoMeta({
    title: 'Note Revisitor - Review Your Notes',
    description: 'Review your notes to see which might fit the current vibe. A Nostr-powered app for rediscovering your thoughts.',
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          {/* Hero Section */}
          <div className="space-y-4">
            <h1 className="text-5xl font-bold text-gray-900 dark:text-gray-100">
              Note Revisitor
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              Review your notes to see which might fit the current vibe.
            </p>
            <div className="pt-4">
              <Button asChild size="lg" className="text-lg px-8 py-3">
                <Link to="/notes">
                  <Brain className="h-5 w-5 mr-2" />
                  Start Revisiting
                </Link>
              </Button>
            </div>
          </div>

          {/* Features Grid */}
          <div className="grid md:grid-cols-3 gap-6 pt-12">
            <Card className="border-0 shadow-lg">
              <CardHeader className="text-center">
                <Clock className="h-12 w-12 text-blue-500 mx-auto mb-4" />
                <CardTitle>Smart Scheduling</CardTitle>
                <CardDescription>
                  Revisit notes at optimal intervals to rediscover insights that match your current mindset
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-0 shadow-lg">
              <CardHeader className="text-center">
                <TrendingUp className="h-12 w-12 text-green-500 mx-auto mb-4" />
                <CardTitle>Track Progress</CardTitle>
                <CardDescription>
                  Monitor your revisiting journey and see which notes resonate with you over time
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-0 shadow-lg">
              <CardHeader className="text-center">
                <BookOpen className="h-12 w-12 text-purple-500 mx-auto mb-4" />
                <CardTitle>Nostr Powered</CardTitle>
                <CardDescription>
                  Your notes live on the decentralized Nostr network, ready to be rediscovered whenever inspiration strikes
                </CardDescription>
              </CardHeader>
            </Card>
          </div>

          {/* How It Works */}
          <div className="pt-16 space-y-8">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
              How It Works
            </h2>
            <div className="grid md:grid-cols-4 gap-6 text-left">
              <div className="space-y-3">
                <div className="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center font-bold">
                  1
                </div>
                <h3 className="font-semibold">Write Notes</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Use your favorite Nostr client to write thoughts, ideas, or anything that captures your interest
                </p>
              </div>
              <div className="space-y-3">
                <div className="w-8 h-8 bg-green-500 text-white rounded-full flex items-center justify-center font-bold">
                  2
                </div>
                <h3 className="font-semibold">Initial Revisit</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Revisit your note after 1 day to see if it still resonates
                </p>
              </div>
              <div className="space-y-3">
                <div className="w-8 h-8 bg-purple-500 text-white rounded-full flex items-center justify-center font-bold">
                  3
                </div>
                <h3 className="font-semibold">Spaced Revisits</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Continue revisiting at increasing intervals: 3 days, 1 week, 2 weeks
                </p>
              </div>
              <div className="space-y-3">
                <div className="w-8 h-8 bg-orange-500 text-white rounded-full flex items-center justify-center font-bold">
                  4
                </div>
                <h3 className="font-semibold">Complete the Cycle</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  After all revisits, you'll have fully explored which notes resonate with you
                </p>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="pt-16 text-center">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Vibed with{' '}
              <a
                href="https://soapbox.pub/mkstack"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-500 hover:underline"
              >
                MKStack
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
