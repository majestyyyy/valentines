'use client';

import { useEffect, useState } from 'react';
import { checkRateLimit } from '@/lib/emailRateLimit';
import { AlertTriangle, CheckCircle, Mail } from 'lucide-react';

export default function EmailLimitDashboard() {
  const [stats, setStats] = useState({
    count: 0,
    remaining: 0,
    percentUsed: 0,
    resetTime: ''
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const limit = await checkRateLimit(500);
        setStats({
          count: limit.count,
          remaining: limit.remaining,
          percentUsed: limit.percentUsed,
          resetTime: limit.resetTime
        });
      } catch (error) {
        console.error('Failed to fetch email stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
    // Refresh every 2 minutes
    const interval = setInterval(fetchStats, 2 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const getStatusColor = () => {
    if (stats.percentUsed < 50) return 'green';
    if (stats.percentUsed < 80) return 'yellow';
    return 'red';
  };

  const getStatusText = () => {
    if (stats.percentUsed < 50) return 'Healthy';
    if (stats.percentUsed < 80) return 'Moderate';
    return 'Critical';
  };

  const getStatusIcon = () => {
    const color = getStatusColor();
    if (color === 'green') return <CheckCircle className="w-5 h-5 text-green-600" />;
    if (color === 'yellow') return <Mail className="w-5 h-5 text-yellow-600" />;
    return <AlertTriangle className="w-5 h-5 text-red-600" />;
  };

  const colorClasses = {
    green: {
      bg: 'bg-green-50',
      text: 'text-green-600',
      border: 'border-green-200',
      bar: 'bg-green-600'
    },
    yellow: {
      bg: 'bg-yellow-50',
      text: 'text-yellow-600',
      border: 'border-yellow-200',
      bar: 'bg-yellow-600'
    },
    red: {
      bg: 'bg-red-50',
      text: 'text-red-600',
      border: 'border-red-200',
      bar: 'bg-red-600'
    }
  };

  const statusColor = getStatusColor();
  const classes = colorClasses[statusColor as keyof typeof colorClasses];

  if (loading) {
    return (
      <div className="bg-white p-4 rounded-lg shadow border border-gray-200 animate-pulse">
        <div className="h-4 bg-gray-200 rounded w-1/3 mb-2"></div>
        <div className="h-8 bg-gray-200 rounded w-1/2 mb-2"></div>
        <div className="h-3 bg-gray-200 rounded w-2/3"></div>
      </div>
    );
  }

  return (
    <div className={`${classes.bg} p-4 rounded-lg shadow border ${classes.border}`}>
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-bold text-gray-900 flex items-center gap-2">
          {getStatusIcon()}
          Gmail Rate Limit
        </h3>
        <span className={`text-xs font-semibold px-2 py-1 rounded ${classes.bg} ${classes.text}`}>
          {getStatusText()}
        </span>
      </div>
      
      <div className={`text-3xl font-bold ${classes.text} mb-1`}>
        {stats.count.toLocaleString()} / 500
      </div>
      
      <div className="text-sm text-gray-600 mb-3">
        <strong>{stats.remaining.toLocaleString()}</strong> emails remaining today
      </div>

      <div className="w-full bg-gray-200 rounded-full h-3 mb-2">
        <div
          className={`h-3 rounded-full ${classes.bar} transition-all duration-500`}
          style={{ width: `${Math.min(stats.percentUsed, 100)}%` }}
        />
      </div>

      <div className="text-xs text-gray-500">
        Resets at: {stats.resetTime.split(',')[1]} PST
      </div>

      {stats.percentUsed >= 80 && (
        <div className={`mt-3 p-2 ${classes.bg} border ${classes.border} rounded text-xs ${classes.text}`}>
          <strong>⚠️ Warning:</strong> Approaching rate limit. Consider switching to SendGrid or Mailgun.
        </div>
      )}

      {stats.percentUsed >= 100 && (
        <div className="mt-3 p-2 bg-red-100 border border-red-300 rounded text-xs text-red-800">
          <strong>🚫 Limit Reached:</strong> Email sending is blocked until midnight PST.
        </div>
      )}
    </div>
  );
}
