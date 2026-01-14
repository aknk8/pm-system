'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { Client, Employee, Project } from '@/types';
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

const SERVICE_TYPES: Project['service_type'][] = ['コンサル', 'テスト', 'ライセンス'];
const STATUS_TYPES: Project['status'][] = ['進行中', '完了', '一時停止', 'キャンセル'];

export default function ProjectsPage() {
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [currentProject, setCurrentProject] = useState<Partial<Project> | null>(null);
  const [isEdit, setIsEdit] = useState(false);

  useEffect(() => {
    loadProjects();
    loadClients();
    loadEmployees();
  }, []);

  const canRegister = clients.length > 0 && employees.length > 0;

  const clientMap = useMemo(() => {
    const map = new Map<number, string>();
    clients.forEach((client) => {
      map.set(client.client_id, client.name);
    });
    return map;
  }, [clients]);

  const employeeMap = useMemo(() => {
    const map = new Map<number, string>();
    employees.forEach((employee) => {
      map.set(employee.employee_id, employee.name);
    });
    return map;
  }, [employees]);

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

  const loadEmployees = async () => {
    try {
      const response = await api.get<Employee[]>('/employees');
      if (response.success) {
        setEmployees(response.data || []);
      }
    } catch (error) {
      console.error('Failed to load employees:', error);
    }
  };

  const handleOpenDialog = (project?: Project) => {
    if (!project && !canRegister) {
      return;
    }
    if (project) {
      setCurrentProject(project);
      setIsEdit(true);
    } else {
      setCurrentProject({
        project_code: '',
        name: '',
        client_id: clients[0]?.client_id,
        pm_employee_id: employees[0]?.employee_id,
        service_type: 'コンサル',
        status: '進行中',
        start_date: '',
        end_date: '',
        contract_amount: undefined,
        budget_revenue: undefined,
        budget_cost: undefined,
        description: '',
      });
      setIsEdit(false);
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setCurrentProject(null);
    setIsEdit(false);
  };

  const toNumberOrNull = (value?: number | string) => {
    if (value === '' || value === undefined || value === null) return null;
    const parsed = Number(value);
    return Number.isNaN(parsed) ? null : parsed;
  };

  const handleSave = async () => {
    if (!currentProject) return;

    const payload = {
      ...currentProject,
      client_id: toNumberOrNull(currentProject.client_id) || undefined,
      pm_employee_id: toNumberOrNull(currentProject.pm_employee_id) || undefined,
      contract_amount: toNumberOrNull(currentProject.contract_amount),
      budget_revenue: toNumberOrNull(currentProject.budget_revenue),
      budget_cost: toNumberOrNull(currentProject.budget_cost),
      end_date: currentProject.end_date || null,
    };

    try {
      if (isEdit && currentProject.project_id) {
        await api.put(`/projects/${currentProject.project_id}`, payload);
      } else {
        await api.post('/projects', payload);
      }
      handleCloseDialog();
      loadProjects();
    } catch (error) {
      console.error('Failed to save project:', error);
      alert('保存に失敗しました');
    }
  };

  const handleDelete = async (id: number) => {
    if (confirm('本当に削除しますか?')) {
      try {
        await api.delete(`/projects/${id}`);
        loadProjects();
      } catch (error) {
        console.error('Failed to delete project:', error);
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
          プロジェクト管理
        </Typography>
        <Button variant="contained" sx={{ ml: 'auto' }} onClick={() => handleOpenDialog()}>
          新規登録
        </Button>
      </Box>

      {!canRegister && (
        <Paper sx={{ p: 2, mb: 3 }}>
          <Typography variant="body1">
            プロジェクトを登録するにはクライアントと社員の登録が必要です。
          </Typography>
          <Typography variant="body2" color="text.secondary">
            先にクライアント管理と社員管理でマスタ登録を行ってください。
          </Typography>
        </Paper>
      )}

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>コード</TableCell>
              <TableCell>名称</TableCell>
              <TableCell>クライアント</TableCell>
              <TableCell>PM</TableCell>
              <TableCell>種別</TableCell>
              <TableCell>開始日</TableCell>
              <TableCell>ステータス</TableCell>
              <TableCell>操作</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {projects.map((project) => (
              <TableRow key={project.project_id}>
                <TableCell>{project.project_code}</TableCell>
                <TableCell>{project.name}</TableCell>
                <TableCell>{clientMap.get(project.client_id) || '-'}</TableCell>
                <TableCell>{employeeMap.get(project.pm_employee_id) || '-'}</TableCell>
                <TableCell>{project.service_type}</TableCell>
                <TableCell>{project.start_date}</TableCell>
                <TableCell>{project.status}</TableCell>
                <TableCell>
                  <IconButton onClick={() => handleOpenDialog(project)}>
                    <Edit />
                  </IconButton>
                  <IconButton onClick={() => handleDelete(project.project_id)}>
                    <Delete />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>{isEdit ? 'プロジェクト編集' : '新規プロジェクト登録'}</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="プロジェクトコード"
            value={currentProject?.project_code || ''}
            onChange={(e) => setCurrentProject({ ...currentProject, project_code: e.target.value })}
            margin="normal"
            required
          />
          <TextField
            fullWidth
            label="名称"
            value={currentProject?.name || ''}
            onChange={(e) => setCurrentProject({ ...currentProject, name: e.target.value })}
            margin="normal"
            required
          />
          <TextField
            select
            fullWidth
            label="クライアント"
            value={currentProject?.client_id ?? ''}
            onChange={(e) =>
              setCurrentProject({ ...currentProject, client_id: Number(e.target.value) })
            }
            margin="normal"
            required
          >
            {clients.map((client) => (
              <MenuItem key={client.client_id} value={client.client_id}>
                {client.name}
              </MenuItem>
            ))}
          </TextField>
          <TextField
            select
            fullWidth
            label="PM"
            value={currentProject?.pm_employee_id ?? ''}
            onChange={(e) =>
              setCurrentProject({ ...currentProject, pm_employee_id: Number(e.target.value) })
            }
            margin="normal"
            required
          >
            {employees.map((employee) => (
              <MenuItem key={employee.employee_id} value={employee.employee_id}>
                {employee.name}
              </MenuItem>
            ))}
          </TextField>
          <TextField
            select
            fullWidth
            label="サービス種別"
            value={currentProject?.service_type || 'コンサル'}
            onChange={(e) =>
              setCurrentProject({
                ...currentProject,
                service_type: e.target.value as Project['service_type'],
              })
            }
            margin="normal"
            required
          >
            {SERVICE_TYPES.map((service) => (
              <MenuItem key={service} value={service}>
                {service}
              </MenuItem>
            ))}
          </TextField>
          <TextField
            fullWidth
            label="開始日"
            type="date"
            value={currentProject?.start_date || ''}
            onChange={(e) => setCurrentProject({ ...currentProject, start_date: e.target.value })}
            margin="normal"
            required
            InputLabelProps={{ shrink: true }}
          />
          <TextField
            fullWidth
            label="終了日"
            type="date"
            value={currentProject?.end_date || ''}
            onChange={(e) => setCurrentProject({ ...currentProject, end_date: e.target.value })}
            margin="normal"
            InputLabelProps={{ shrink: true }}
          />
          <TextField
            fullWidth
            label="契約金額"
            type="number"
            value={currentProject?.contract_amount ?? ''}
            onChange={(e) =>
              setCurrentProject({ ...currentProject, contract_amount: e.target.value })
            }
            margin="normal"
          />
          <TextField
            fullWidth
            label="予算売上"
            type="number"
            value={currentProject?.budget_revenue ?? ''}
            onChange={(e) => setCurrentProject({ ...currentProject, budget_revenue: e.target.value })}
            margin="normal"
          />
          <TextField
            fullWidth
            label="予算原価"
            type="number"
            value={currentProject?.budget_cost ?? ''}
            onChange={(e) => setCurrentProject({ ...currentProject, budget_cost: e.target.value })}
            margin="normal"
          />
          <TextField
            select
            fullWidth
            label="ステータス"
            value={currentProject?.status || '進行中'}
            onChange={(e) =>
              setCurrentProject({
                ...currentProject,
                status: e.target.value as Project['status'],
              })
            }
            margin="normal"
          >
            {STATUS_TYPES.map((status) => (
              <MenuItem key={status} value={status}>
                {status}
              </MenuItem>
            ))}
          </TextField>
          <TextField
            fullWidth
            label="説明"
            value={currentProject?.description || ''}
            onChange={(e) =>
              setCurrentProject({ ...currentProject, description: e.target.value })
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
