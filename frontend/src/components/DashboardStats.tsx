import * as React from 'react';
import { useState, useEffect } from 'react';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';
import Alert from '@mui/material/Alert';
import PostAddIcon from '@mui/icons-material/PostAdd';
import ScheduleIcon from '@mui/icons-material/Schedule';
import ImageIcon from '@mui/icons-material/Image';

interface StatData {
  label: string;
  value: number;
  iconType: string;
}

export default function DashboardStats() {
  const [stats, setStats] = useState<StatData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Simulate API call to fetch stats
    const fetchStats = async () => {
      try {
        setLoading(true);
        setError(null);

        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Mock data - in real app, this would come from API
        const mockStats: StatData[] = [
          { label: 'Published Posts', value: 128, iconType: 'post' },
          { label: 'Scheduled Posts', value: 12, iconType: 'schedule' },
          { label: 'Images Uploaded', value: 54, iconType: 'image' },
        ];

        setStats(mockStats);
      } catch (err) {
        setError('Failed to load dashboard statistics');
        console.error('Error fetching stats:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  const renderIcon = (iconType: string) => {
    switch (iconType) {
      case 'post':
        return <PostAddIcon color="primary" />;
      case 'schedule':
        return <ScheduleIcon color="secondary" />;
      case 'image':
        return <ImageIcon color="action" />;
      default:
        return <PostAddIcon color="primary" />;
    }
  };

  if (loading) {
    return (
      <Box sx={{ mt: 2, display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '200px' }}>
        <CircularProgress />
        <Typography sx={{ ml: 2 }}>Loading dashboard statistics...</Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ mt: 2 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
          {/* Show placeholder cards when there's an error */}
          {[
            { label: 'Published Posts', value: 0, iconType: 'post' },
            { label: 'Scheduled Posts', value: 0, iconType: 'schedule' },
            { label: 'Images Uploaded', value: 0, iconType: 'image' },
          ].map((stat) => (
            <Box key={stat.label} sx={{ flex: '1 1 300px', minWidth: '250px' }}>
              <Card elevation={3} sx={{ opacity: 0.6 }}>
                <CardContent sx={{ display: 'flex', alignItems: 'center' }}>
                  <Box sx={{ mr: 2 }}>{renderIcon(stat.iconType)}</Box>
                  <Box>
                    <Typography variant="h5" fontWeight={700}>{stat.value}</Typography>
                    <Typography color="text.secondary">{stat.label}</Typography>
                  </Box>
                </CardContent>
              </Card>
            </Box>
          ))}
        </Box>
      </Box>
    );
  }

  return (
    <Box sx={{ mt: 2, display: 'flex', flexWrap: 'wrap', gap: 3 }}>
      {stats.map((stat) => (
        <Box key={stat.label} sx={{ flex: '1 1 300px', minWidth: '250px' }}>
          <Card elevation={3}>
            <CardContent sx={{ display: 'flex', alignItems: 'center' }}>
              <Box sx={{ mr: 2 }}>{renderIcon(stat.iconType)}</Box>
              <Box>
                <Typography variant="h5" fontWeight={700}>{stat.value}</Typography>
                <Typography color="text.secondary">{stat.label}</Typography>
              </Box>
            </CardContent>
          </Card>
        </Box>
      ))}
      <Box sx={{ flex: '1 1 300px', minWidth: '250px' }}>
        <Card elevation={3}>
          <CardContent>
            <Typography variant="subtitle1" color="text.secondary" gutterBottom>
              Quick Actions
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <Typography variant="body2">• Create new post</Typography>
              <Typography variant="body2">• Schedule for later</Typography>
              <Typography variant="body2">• Upload images</Typography>
            </Box>
          </CardContent>
        </Card>
      </Box>
    </Box>
  );
}
