'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { Client } from '@/types';
import {
  Container,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Box,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
} from '@mui/material';
import { Edit, Delete, ArrowBack } from '@mui/icons-material';

export default function ClientsPage() {
  const router = useRouter();
  const [clients, setClients] = useState<Client[]>([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [currentClient, setCurrentClient] = useState<Partial<Client> | null>(null);
  const [isEdit, setIsEdit] = useState(false);

  useEffect(() => {
    loadClients();
  }, []);

  const loadClients = async () => {
    try {
      const response = await api.get('/clients');
      if (response.success) {
        setClients(response.data || []);
      }
    } catch (error) {
      console.error('Failed to load clients:', error);
    }
  };

  const handleOpenDialog = (client?: Client) => {
    if (client) {
      setCurrentClient(client);
      setIsEdit(true);
    } else {
      setCurrentClient({
        client_code: '',
        name: '',
        industry: '',
        payment_terms: '',
        contact_person: '',
        contact_email: '',
        contact_tel: '',
        address: '',
      });
      setIsEdit(false);
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setCurrentClient(null);
    setIsEdit(false);
  };

  const handleSave = async () => {
    try {
      if (isEdit && currentClient?.client_id) {
        await api.put(`/clients/${currentClient.client_id}`, currentClient);
      } else {
        await api.post('/clients', currentClient);
      }
      handleCloseDialog();
      loadClients();
    } catch (error) {
      console.error('Failed to save client:', error);
      alert('保存に失敗しました');
    }
  };

  const handleDelete = async (id: number) => {
    if (confirm('本当に削除しますか?')) {
      try {
        await api.delete(`/clients/${id}`);
        loadClients();
      } catch (error) {
        console.error('Failed to delete client:', error);
        alert('削除に失敗しました');
      }
    }
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <IconButton onClick={() => router.push('/dashboard')}>
          <ArrowBack />
        </IconButton>
        <Typography variant="h4" sx={{ ml: 2 }}>
          クライアント管理
        </Typography>
        <Button
          variant="contained"
          sx={{ ml: 'auto' }}
          onClick={() => handleOpenDialog()}
        >
          新規登録
        </Button>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>コード</TableCell>
              <TableCell>名前</TableCell>
              <TableCell>業界</TableCell>
              <TableCell>担当者</TableCell>
              <TableCell>メール</TableCell>
              <TableCell>操作</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {clients.map((client) => (
              <TableRow key={client.client_id}>
                <TableCell>{client.client_code}</TableCell>
                <TableCell>{client.name}</TableCell>
                <TableCell>{client.industry}</TableCell>
                <TableCell>{client.contact_person}</TableCell>
                <TableCell>{client.contact_email}</TableCell>
                <TableCell>
                  <IconButton onClick={() => handleOpenDialog(client)}>
                    <Edit />
                  </IconButton>
                  <IconButton onClick={() => handleDelete(client.client_id)}>
                    <Delete />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>{isEdit ? 'クライアント編集' : '新規クライアント登録'}</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="クライアントコード"
            value={currentClient?.client_code || ''}
            onChange={(e) =>
              setCurrentClient({ ...currentClient, client_code: e.target.value })
            }
            margin="normal"
            required
          />
          <TextField
            fullWidth
            label="名前"
            value={currentClient?.name || ''}
            onChange={(e) => setCurrentClient({ ...currentClient, name: e.target.value })}
            margin="normal"
            required
          />
          <TextField
            fullWidth
            label="業界"
            value={currentClient?.industry || ''}
            onChange={(e) => setCurrentClient({ ...currentClient, industry: e.target.value })}
            margin="normal"
          />
          <TextField
            fullWidth
            label="担当者"
            value={currentClient?.contact_person || ''}
            onChange={(e) =>
              setCurrentClient({ ...currentClient, contact_person: e.target.value })
            }
            margin="normal"
          />
          <TextField
            fullWidth
            label="メールアドレス"
            value={currentClient?.contact_email || ''}
            onChange={(e) =>
              setCurrentClient({ ...currentClient, contact_email: e.target.value })
            }
            margin="normal"
          />
          <TextField
            fullWidth
            label="電話番号"
            value={currentClient?.contact_tel || ''}
            onChange={(e) =>
              setCurrentClient({ ...currentClient, contact_tel: e.target.value })
            }
            margin="normal"
          />
          <TextField
            fullWidth
            label="住所"
            value={currentClient?.address || ''}
            onChange={(e) => setCurrentClient({ ...currentClient, address: e.target.value })}
            margin="normal"
            multiline
            rows={2}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>キャンセル</Button>
          <Button onClick={handleSave} variant="contained">
            保存
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}
