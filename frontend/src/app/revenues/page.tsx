'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { Project, RevenueRecord } from '@/types';
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

const ALLOCATION_TYPES: RevenueRecord['allocation_type'][] = ['monthly', 'one_time'];

export default function RevenuesPage() {
  const router = useRouter();
  const [revenues, setRevenues] = useState<RevenueRecord[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [currentRevenue, setCurrentRevenue] = useState<Partial<RevenueRecord> | null>(null);
  const [isEdit, setIsEdit] = useState(false);

  useEffect(() => {
    loadRevenues();
    loadProjects();
  }, []);

  const projectMap = useMemo(() => {
    const map = new Map<number, string>();
    projects.forEach((project) => {
      map.set(project.project_id, project.name);
    });
    return map;
  }, [projects]);

  const loadRevenues = async () => {
    try {
      const response = await api.get<RevenueRecord[]>('/revenues');
      if (response.success) {
        setRevenues(response.data || []);
      }
    } catch (error) {
      console.error('Failed to load revenues:', error);
    }
  };

  const loadProjects = async () => {
    try {
      const response = await api.get<Project[]>('/projects');
      if (response.success) {
        setProjects(response.data || []);
      }
    } catch (error) {
      console.error('Failed to load projects:', error);
    }
  };

  const handleOpenDialog = (revenue?: RevenueRecord) => {
    if (revenue) {
      setCurrentRevenue(revenue);
      setIsEdit(true);
    } else {
      setCurrentRevenue({
        project_id: projects[0]?.project_id,
        revenue_month: '',
        amount: undefined,
        currency: 'JPY',
        allocation_type: 'monthly',
        description: '',
      });
      setIsEdit(false);
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setCurrentRevenue(null);
    setIsEdit(false);
  };

  const toNumberOrNull = (value?: number | string) => {
    if (value === '' || value === undefined || value === null) return null;
    const parsed = Number(value);
    return Number.isNaN(parsed) ? null : parsed;
  };

  const handleSave = async () => {
    if (!currentRevenue) return;

    const payload = {
      ...currentRevenue,
      project_id: currentRevenue.project_id ? Number(currentRevenue.project_id) : undefined,
      amount: toNumberOrNull(currentRevenue.amount),
    };

    try {
      if (isEdit && currentRevenue.revenue_id) {
        await api.put(`/revenues/${currentRevenue.revenue_id}`, payload);
      } else {
        await api.post('/revenues', payload);
      }
      handleCloseDialog();
      loadRevenues();
    } catch (error) {
      console.error('Failed to save revenue:', error);
      alert('保存に失敗しました');
    }
  };

  const handleDelete = async (id: number) => {
    if (confirm('本当に削除しますか?')) {
      try {
        await api.delete(`/revenues/${id}`);
        loadRevenues();
      } catch (error) {
        console.error('Failed to delete revenue:', error);
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
          売上実績
        </Typography>
        <Button variant="contained" sx={{ ml: 'auto' }} onClick={() => handleOpenDialog()}>
          新規登録
        </Button>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>プロジェクト</TableCell>
              <TableCell>対象月</TableCell>
              <TableCell>金額</TableCell>
              <TableCell>配賦種別</TableCell>
              <TableCell>操作</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {revenues.map((revenue) => (
              <TableRow key={revenue.revenue_id}>
                <TableCell>{projectMap.get(revenue.project_id) || '-'}</TableCell>
                <TableCell>{revenue.revenue_month}</TableCell>
                <TableCell>
                  {revenue.amount} {revenue.currency}
                </TableCell>
                <TableCell>{revenue.allocation_type}</TableCell>
                <TableCell>
                  <IconButton onClick={() => handleOpenDialog(revenue)}>
                    <Edit />
                  </IconButton>
                  <IconButton onClick={() => handleDelete(revenue.revenue_id)}>
                    <Delete />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>{isEdit ? '売上実績編集' : '売上実績登録'}</DialogTitle>
        <DialogContent>
          <TextField
            select
            fullWidth
            label="プロジェクト"
            value={currentRevenue?.project_id ?? ''}
            onChange={(e) =>
              setCurrentRevenue({ ...currentRevenue, project_id: Number(e.target.value) })
            }
            margin="normal"
            required
          >
            {projects.map((project) => (
              <MenuItem key={project.project_id} value={project.project_id}>
                {project.name}
              </MenuItem>
            ))}
          </TextField>
          <TextField
            fullWidth
            label="対象月"
            type="date"
            value={currentRevenue?.revenue_month || ''}
            onChange={(e) =>
              setCurrentRevenue({ ...currentRevenue, revenue_month: e.target.value })
            }
            margin="normal"
            required
            InputLabelProps={{ shrink: true }}
          />
          <TextField
            fullWidth
            label="金額"
            type="number"
            value={currentRevenue?.amount ?? ''}
            onChange={(e) => setCurrentRevenue({ ...currentRevenue, amount: e.target.value })}
            margin="normal"
            required
          />
          <TextField
            fullWidth
            label="通貨"
            value={currentRevenue?.currency || 'JPY'}
            onChange={(e) => setCurrentRevenue({ ...currentRevenue, currency: e.target.value })}
            margin="normal"
          />
          <TextField
            select
            fullWidth
            label="配賦種別"
            value={currentRevenue?.allocation_type || 'monthly'}
            onChange={(e) =>
              setCurrentRevenue({
                ...currentRevenue,
                allocation_type: e.target.value as RevenueRecord['allocation_type'],
              })
            }
            margin="normal"
          >
            {ALLOCATION_TYPES.map((allocation) => (
              <MenuItem key={allocation} value={allocation}>
                {allocation}
              </MenuItem>
            ))}
          </TextField>
          <TextField
            fullWidth
            label="説明"
            value={currentRevenue?.description || ''}
            onChange={(e) =>
              setCurrentRevenue({ ...currentRevenue, description: e.target.value })
            }
            margin="normal"
            multiline
            rows={3}
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
