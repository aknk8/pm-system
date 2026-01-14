'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import {
  Container,
  Grid,
  Paper,
  Typography,
  Box,
  Card,
  CardContent,
  Button,
  AppBar,
  Toolbar,
} from '@mui/material';

export default function DashboardPage() {
  const router = useRouter();
  const [summary, setSummary] = useState<any>(null);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }

    loadSummary();
  }, []);

  const loadSummary = async () => {
    try {
      const response = await api.get('/dashboard/summary');
      if (response.success) {
        setSummary(response.data);
      }
    } catch (error) {
      console.error('Failed to load summary:', error);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    router.push('/login');
  };

  return (
    <>
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            取引管理システム
          </Typography>
          <Typography variant="body2" sx={{ mr: 2 }}>
            {user?.username} さん
          </Typography>
          <Button color="inherit" onClick={handleLogout}>
            ログアウト
          </Button>
        </Toolbar>
      </AppBar>
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Typography variant="h4" sx={{ mb: 4 }}>
          ダッシュボード
        </Typography>

        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography color="text.secondary" gutterBottom>
                  総売上
                </Typography>
                <Typography variant="h4">
                  ¥{summary?.total_revenue?.toLocaleString() || 0}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography color="text.secondary" gutterBottom>
                  進行中プロジェクト
                </Typography>
                <Typography variant="h4">
                  {summary?.total_projects || 0}
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" sx={{ mb: 2 }}>
                マスタ管理
              </Typography>
              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                <Button variant="outlined" onClick={() => router.push('/clients')}>
                  クライアント管理
                </Button>
                <Button variant="outlined" onClick={() => router.push('/employees')}>
                  社員管理
                </Button>
                <Button variant="outlined" onClick={() => router.push('/partners')}>
                  パートナー管理
                </Button>
                <Button variant="outlined" onClick={() => router.push('/projects')}>
                  プロジェクト管理
                </Button>
                <Button variant="outlined" onClick={() => router.push('/contracts')}>
                  契約管理
                </Button>
              </Box>
            </Paper>
          </Grid>

          <Grid item xs={12}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" sx={{ mb: 2 }}>
                実績管理
              </Typography>
              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                <Button variant="outlined" onClick={() => router.push('/assignment-plans')}>
                  アサイン計画
                </Button>
                <Button variant="outlined" onClick={() => router.push('/work-records')}>
                  稼働実績
                </Button>
                <Button variant="outlined" onClick={() => router.push('/monthly-actual-costs')}>
                  月次給与実績
                </Button>
                <Button variant="outlined" onClick={() => router.push('/revenues')}>
                  売上実績
                </Button>
                <Button variant="outlined" onClick={() => router.push('/expenses')}>
                  経費実績
                </Button>
              </Box>
            </Paper>
          </Grid>

          <Grid item xs={12}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" sx={{ mb: 2 }}>
                分析・レポート
              </Typography>
              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                <Button variant="outlined" onClick={() => router.push('/reports/projects')}>
                  プロジェクト損益
                </Button>
                <Button variant="outlined" onClick={() => router.push('/reports/pm')}>
                  PM別分析
                </Button>
                <Button variant="outlined" onClick={() => router.push('/reports/clients')}>
                  クライアント別分析
                </Button>
              </Box>
            </Paper>
          </Grid>
        </Grid>
      </Container>
    </>
  );
}
