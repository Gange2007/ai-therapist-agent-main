'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { getSessionAnalytics } from '@/lib/api/chat';
import { Activity, AlertTriangle, Heart, TrendingUp } from 'lucide-react';

interface SessionAnalyticsProps {
  sessionId: string;
}

export function SessionAnalytics({ sessionId }: SessionAnalyticsProps) {
  const [analytics, setAnalytics] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const data = await getSessionAnalytics(sessionId);
        setAnalytics(data);
      } catch (error) {
        console.error('Failed to fetch analytics:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAnalytics();
  }, [sessionId]);

  if (isLoading) {
    return <div className="text-sm text-muted-foreground">Loading analytics...</div>;
  }

  if (!analytics) {
    return <div className="text-sm text-muted-foreground">No analytics available</div>;
  }

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case 'positive':
        return 'bg-green-500';
      case 'negative':
        return 'bg-red-500';
      default:
        return 'bg-yellow-500';
    }
  };

  const getRiskLevelColor = (level: number) => {
    if (level >= 7) return 'text-red-600';
    if (level >= 4) return 'text-yellow-600';
    return 'text-green-600';
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5" />
          Session Analytics
        </CardTitle>
        <CardDescription>Track your emotional journey and progress</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Message Count */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Messages</span>
          <Badge variant="secondary">{analytics.messageCount}</Badge>
        </div>

        {/* Themes */}
        {analytics.themes && analytics.themes.length > 0 && (
          <div>
            <span className="text-sm text-muted-foreground block mb-2">Themes</span>
            <div className="flex flex-wrap gap-2">
              {analytics.themes.map((theme: string, index: number) => (
                <Badge key={index} variant="outline">
                  {theme}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Current Sentiment */}
        {analytics.currentSentiment && (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Heart className="h-4 w-4" />
              <span className="text-sm text-muted-foreground">Current Sentiment</span>
            </div>
            <div className="flex items-center gap-2">
              <div className={`h-2 w-2 rounded-full ${getSentimentColor(analytics.currentSentiment.sentiment)}`} />
              <Badge variant="outline" className="capitalize">
                {analytics.currentSentiment.sentiment}
              </Badge>
            </div>
          </div>
        )}

        {/* Current Risk Level */}
        {analytics.currentRiskLevel && (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              <span className="text-sm text-muted-foreground">Risk Level</span>
            </div>
            <Badge className={getRiskLevelColor(analytics.currentRiskLevel.riskLevel)}>
              {analytics.currentRiskLevel.riskLevel}/10
            </Badge>
          </div>
        )}

        {/* Escalation Status */}
        {analytics.requiresEscalation && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-md">
            <div className="flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 text-red-600 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-red-900">Escalation Required</p>
                <p className="text-xs text-red-700 mt-1">{analytics.escalationReason}</p>
              </div>
            </div>
          </div>
        )}

        {/* Sentiment History */}
        {analytics.sentimentHistory && analytics.sentimentHistory.length > 1 && (
          <div>
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="h-4 w-4" />
              <span className="text-sm text-muted-foreground">Sentiment Trend</span>
            </div>
            <div className="flex items-end gap-1 h-8">
              {analytics.sentimentHistory.slice(-10).map((entry: any, index: number) => (
                <div
                  key={index}
                  className={`flex-1 rounded-t ${getSentimentColor(entry.sentiment)}`}
                  style={{ height: `${(entry.score * 100)}%` }}
                  title={`${entry.sentiment}: ${entry.score}`}
                />
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
