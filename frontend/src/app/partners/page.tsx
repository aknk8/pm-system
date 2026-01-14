'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { Partner } from '@/types';
import {
  Box,
  Button,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  MenuItem,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material';
import { ArrowBack, Delete, Edit } from '@mui/icons-material';

const CONTRACT_UNITS: Partner['contract_unit'][] = ['時給', '日額', '月額'];

export default function PartnersPage() {
  const router = useRouter();
  const [partners, setPartners] = useState<Partner[]>([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [currentPartner, setCurrentPartner] = useState<Partial<Partner> | null>(null);
  const [isEdit, setIsEdit] = useState(false);

  useEffect(() => {
    loadPartners();
  }, []);

  const loadPartners = async () => {
    try {
      const response = await api.get<Partner[]>('/partners');
      if (response.success) {
        setPartners(response.data || []);
      }
    } catch (error) {
      console.error('Failed to load partners:', error);
    }
  };

  const handleOpenDialog = (partner?: Partner) => {
    if (partner) {
      setCurrentPartner(partner);
      setIsEdit(true);
    } else {
      setCurrentPartner({
        partner_code: '',
        name: '',
        company_name: '',
        contract_unit_price: undefined,
        contract_unit: '時給',
        contract_unit_currency: 'JPY',
        contact_email: '',
        contact_tel: '',
      });
      setIsEdit(false);
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setCurrentPartner(null);
    setIsEdit(false);
  };

  const toNumberOrNull = (value?: number | string) => {
    if (value === '' || value === undefined || value === null) return null;
    const parsed = Number(value);
    return Number.isNaN(parsed) ? null : parsed;
  };

  const handleSave = async () => {
    if (!currentPartner) return;

    const payload = {
      ...currentPartner,
      contract_unit_price: toNumberOrNull(currentPartner.contract_unit_price),
    };

    try {
      if (isEdit && currentPartner.partner_id) {
        await api.put(`/partners/${currentPartner.partner_id}`, payload);
      } else {
        await api.post('/partners', payload);
      }
      handleCloseDialog();
      loadPartners();
    } catch (error) {
      console.error('Failed to save partner:', error);
      alert('保存に失敗しました');
    }
  };

  const handleDelete = async (id: number) => {
    if (confirm('本当に削除しますか?')) {
      try {
        await api.delete(`/partners/${id}`);
        loadPartners();
      } catch (error) {
        console.error('Failed to delete partner:', error);
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
          パートナー管理
        </Typography>
        <Button variant="contained" sx={{ ml: 'auto' }} onClick={() => handleOpenDialog()}>
          新規登録
        </Button>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>パートナーコード</TableCell>
              <TableCell>氏名</TableCell>
              <TableCell>会社名</TableCell>
              <TableCell>契約単価</TableCell>
              <TableCell>単位</TableCell>
              <TableCell>メール</TableCell>
              <TableCell>操作</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {partners.map((partner) => (
              <TableRow key={partner.partner_id}>
                <TableCell>{partner.partner_code}</TableCell>
                <TableCell>{partner.name}</TableCell>
                <TableCell>{partner.company_name}</TableCell>
                <TableCell>
                  {partner.contract_unit_price} {partner.contract_unit_currency}
                </TableCell>
                <TableCell>{partner.contract_unit}</TableCell>
                <TableCell>{partner.contact_email}</TableCell>
                <TableCell>
                  <IconButton onClick={() => handleOpenDialog(partner)}>
                    <Edit />
                  </IconButton>
                  <IconButton onClick={() => handleDelete(partner.partner_id)}>
                    <Delete />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>{isEdit ? 'パートナー編集' : '新規パートナー登録'}</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="パートナーコード"
            value={currentPartner?.partner_code || ''}
            onChange={(e) =>
              setCurrentPartner({ ...currentPartner, partner_code: e.target.value })
            }
            margin="normal"
            required
          />
          <TextField
            fullWidth
            label="氏名"
            value={currentPartner?.name || ''}
            onChange={(e) => setCurrentPartner({ ...currentPartner, name: e.target.value })}
            margin="normal"
            required
          />
          <TextField
            fullWidth
            label="会社名"
            value={currentPartner?.company_name || ''}
            onChange={(e) =>
              setCurrentPartner({ ...currentPartner, company_name: e.target.value })
            }
            margin="normal"
            required
          />
          <TextField
            fullWidth
            label="契約単価"
            type="number"
            value={currentPartner?.contract_unit_price ?? ''}
            onChange={(e) =>
              setCurrentPartner({ ...currentPartner, contract_unit_price: e.target.value })
            }
            margin="normal"
            required
          />
          <TextField
            select
            fullWidth
            label="単位"
            value={currentPartner?.contract_unit || '時給'}
            onChange={(e) =>
              setCurrentPartner({
                ...currentPartner,
                contract_unit: e.target.value as Partner['contract_unit'],
              })
            }
            margin="normal"
            required
          >
            {CONTRACT_UNITS.map((unit) => (
              <MenuItem key={unit} value={unit}>
                {unit}
              </MenuItem>
            ))}
          </TextField>
          <TextField
            fullWidth
            label="通貨"
            value={currentPartner?.contract_unit_currency || 'JPY'}
            onChange={(e) =>
              setCurrentPartner({
                ...currentPartner,
                contract_unit_currency: e.target.value,
              })
            }
            margin="normal"
          />
          <TextField
            fullWidth
            label="メールアドレス"
            value={currentPartner?.contact_email || ''}
            onChange={(e) =>
              setCurrentPartner({ ...currentPartner, contact_email: e.target.value })
            }
            margin="normal"
          />
          <TextField
            fullWidth
            label="電話番号"
            value={currentPartner?.contact_tel || ''}
            onChange={(e) =>
              setCurrentPartner({ ...currentPartner, contact_tel: e.target.value })
            }
            margin="normal"
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
