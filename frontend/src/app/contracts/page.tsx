'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { Client, Contract, Project } from '@/types';
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

const CONTRACT_STATUS: Contract['contract_status'][] = ['締結済', '交渉中', 'キャンセル', '期限切れ'];

export default function ContractsPage() {
  const router = useRouter();
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [currentContract, setCurrentContract] = useState<Partial<Contract> | null>(null);
  const [isEdit, setIsEdit] = useState(false);

  useEffect(() => {
    loadContracts();
    loadProjects();
    loadClients();
  }, []);

  const projectMap = useMemo(() => {
    const map = new Map<number, Project>();
    projects.forEach((project) => {
      map.set(project.project_id, project);
    });
    return map;
  }, [projects]);

  const clientMap = useMemo(() => {
    const map = new Map<number, string>();
    clients.forEach((client) => {
      map.set(client.client_id, client.name);
    });
    return map;
  }, [clients]);

  const loadContracts = async () => {
    try {
      const response = await api.get<Contract[]>('/contracts');
      if (response.success) {
        setContracts(response.data || []);
      }
    } catch (error) {
      console.error('Failed to load contracts:', error);
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

  const loadClients = async () => {
    try {
      const response = await api.get<Client[]>('/clients');
      if (response.success) {
        setClients(response.data || []);
      }
    } catch (error) {
      console.error('Failed to load clients:', error);
    }
  };

  const handleOpenDialog = (contract?: Contract) => {
    if (contract) {
      setCurrentContract(contract);
      setIsEdit(true);
    } else {
      setCurrentContract({
        project_id: projects[0]?.project_id,
        contract_number: '',
        start_date: '',
        end_date: '',
        contract_amount: undefined,
        contract_status: '締結済',
        description: '',
      });
      setIsEdit(false);
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setCurrentContract(null);
    setIsEdit(false);
  };

  const toNumberOrNull = (value?: number | string) => {
    if (value === '' || value === undefined || value === null) return null;
    const parsed = Number(value);
    return Number.isNaN(parsed) ? null : parsed;
  };

  const handleSave = async () => {
    if (!currentContract) return;

    const payload = {
      ...currentContract,
      project_id: currentContract.project_id ? Number(currentContract.project_id) : undefined,
      contract_amount: toNumberOrNull(currentContract.contract_amount),
      end_date: currentContract.end_date || null,
    };

    try {
      if (isEdit && currentContract.contract_id) {
        await api.put(`/contracts/${currentContract.contract_id}`, payload);
      } else {
        await api.post('/contracts', payload);
      }
      handleCloseDialog();
      loadContracts();
    } catch (error) {
      console.error('Failed to save contract:', error);
      alert('保存に失敗しました');
    }
  };

  const handleDelete = async (id: number) => {
    if (confirm('本当に削除しますか?')) {
      try {
        await api.delete(`/contracts/${id}`);
        loadContracts();
      } catch (error) {
        console.error('Failed to delete contract:', error);
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
          契約管理
        </Typography>
        <Button variant="contained" sx={{ ml: 'auto' }} onClick={() => handleOpenDialog()}>
          新規登録
        </Button>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>契約番号</TableCell>
              <TableCell>プロジェクト</TableCell>
              <TableCell>クライアント</TableCell>
              <TableCell>開始日</TableCell>
              <TableCell>終了日</TableCell>
              <TableCell>金額</TableCell>
              <TableCell>ステータス</TableCell>
              <TableCell>操作</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {contracts.map((contract) => {
              const project = projectMap.get(contract.project_id);
              return (
                <TableRow key={contract.contract_id}>
                  <TableCell>{contract.contract_number}</TableCell>
                  <TableCell>{project?.name || '-'}</TableCell>
                  <TableCell>
                    {project ? clientMap.get(project.client_id) || '-' : '-'}
                  </TableCell>
                  <TableCell>{contract.start_date}</TableCell>
                  <TableCell>{contract.end_date || '-'}</TableCell>
                  <TableCell>{contract.contract_amount}</TableCell>
                  <TableCell>{contract.contract_status}</TableCell>
                  <TableCell>
                    <IconButton onClick={() => handleOpenDialog(contract)}>
                      <Edit />
                    </IconButton>
                    <IconButton onClick={() => handleDelete(contract.contract_id)}>
                      <Delete />
                    </IconButton>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>{isEdit ? '契約編集' : '新規契約登録'}</DialogTitle>
        <DialogContent>
          <TextField
            select
            fullWidth
            label="プロジェクト"
            value={currentContract?.project_id ?? ''}
            onChange={(e) =>
              setCurrentContract({ ...currentContract, project_id: Number(e.target.value) })
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
            label="契約番号"
            value={currentContract?.contract_number || ''}
            onChange={(e) =>
              setCurrentContract({ ...currentContract, contract_number: e.target.value })
            }
            margin="normal"
            required
          />
          <TextField
            fullWidth
            label="開始日"
            type="date"
            value={currentContract?.start_date || ''}
            onChange={(e) => setCurrentContract({ ...currentContract, start_date: e.target.value })}
            margin="normal"
            required
            InputLabelProps={{ shrink: true }}
          />
          <TextField
            fullWidth
            label="終了日"
            type="date"
            value={currentContract?.end_date || ''}
            onChange={(e) => setCurrentContract({ ...currentContract, end_date: e.target.value })}
            margin="normal"
            InputLabelProps={{ shrink: true }}
          />
          <TextField
            fullWidth
            label="契約金額"
            type="number"
            value={currentContract?.contract_amount ?? ''}
            onChange={(e) =>
              setCurrentContract({ ...currentContract, contract_amount: e.target.value })
            }
            margin="normal"
            required
          />
          <TextField
            select
            fullWidth
            label="ステータス"
            value={currentContract?.contract_status || '締結済'}
            onChange={(e) =>
              setCurrentContract({
                ...currentContract,
                contract_status: e.target.value as Contract['contract_status'],
              })
            }
            margin="normal"
          >
            {CONTRACT_STATUS.map((status) => (
              <MenuItem key={status} value={status}>
                {status}
              </MenuItem>
            ))}
          </TextField>
          <TextField
            fullWidth
            label="説明"
            value={currentContract?.description || ''}
            onChange={(e) =>
              setCurrentContract({ ...currentContract, description: e.target.value })
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
