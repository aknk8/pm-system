'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { Client, ClientRevenueReport } from '@/types';
import {
  Box,
  Container,
  IconButton,
  MenuItem,
  Paper,
  TextField,
  Typography,
} from '@mui/material';
import { ArrowBack } from '@mui/icons-material';

const formatNumber = (value: number | null | undefined) => {
  if (value === null || value === undefined) return '-';
  const num = Number(value);
  if (Number.isNaN(num)) return '-';
  return num.toLocaleString();
};

export default function ClientReportPage() {
  const router = useRouter();
  const [clients, setClients] = useState<Client[]>([]);
  const [selectedClientId, setSelectedClientId] = useState<number | ''>('');
  const [report, setReport] = useState<ClientRevenueReport | null>(null);

  useEffect(() => {
    loadClients();
  }, []);

  useEffect(() => {
    if (selectedClientId === '') {
      setReport(null);
      return;
    }
    loadReport(selectedClientId);
  }, [selectedClientId]);

  const clientMap = useMemo(() => {
    const map = new Map<number, string>();
    clients.forEach((client) => map.set(client.client_id, client.name));
    return map;
  }, [clients]);

  const loadClients = async () => {
    try {
      const response = await api.get<Client[]>('/clients');
      if (response.success) {
        setClients(response.data || []);
        if (response.data && response.data.length > 0) {
          setSelectedClientId(response.data[0].client_id);
        }
      }
    } catch (error) {
      console.error('Failed to load clients:', error);
    }
  };

  const loadReport = async (clientId: number) => {
    try {
      const response = await api.get<ClientRevenueReport>(
        `/reports/clients/${clientId}/revenue`
      );
      if (response.success) {
        setReport(response.data || null);
      }
    } catch (error) {
      console.error('Failed to load client report:', error);
    }
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <IconButton onClick={() => router.push('/dashboard')}>
          <ArrowBack />
        </IconButton>
        <Typography variant="h4" sx={{ ml: 2 }}>
          クライアント別収益
        </Typography>
      </Box>

      {clients.length === 0 ? (
        <Paper sx={{ p: 2 }}>
          <Typography variant="body1">
            レポートを表示するにはクライアントの登録が必要です。
          </Typography>
        </Paper>
      ) : (
        <>
          <Paper sx={{ p: 2, mb: 3 }}>
            <TextField
              select
              fullWidth
              label="クライアント"
              value={selectedClientId}
              onChange={(e) => setSelectedClientId(Number(e.target.value))}
            >
              {clients.map((client) => (
                <MenuItem key={client.client_id} value={client.client_id}>
                  {client.name}
                </MenuItem>
              ))}
            </TextField>
          </Paper>

          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>
              {clientMap.get(selectedClientId as number) || 'クライアント'} 収益
            </Typography>
            {report ? (
              <Typography variant="h4">
                {formatNumber(report.total_revenue)}
              </Typography>
            ) : (
              <Typography color="text.secondary">データがありません。</Typography>
            )}
          </Paper>
        </>
      )}
    </Container>
  );
}
