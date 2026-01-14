'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { AssignmentPlan, Employee, Partner, Project } from '@/types';
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

const RESOURCE_TYPES: AssignmentPlan['resource_type'][] = ['employee', 'partner'];

export default function AssignmentPlansPage() {
  const router = useRouter();
  const [plans, setPlans] = useState<AssignmentPlan[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [partners, setPartners] = useState<Partner[]>([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [currentPlan, setCurrentPlan] = useState<Partial<AssignmentPlan> | null>(null);
  const [isEdit, setIsEdit] = useState(false);

  useEffect(() => {
    loadPlans();
    loadProjects();
    loadEmployees();
    loadPartners();
  }, []);

  const projectMap = useMemo(() => {
    const map = new Map<number, string>();
    projects.forEach((project) => {
      map.set(project.project_id, project.name);
    });
    return map;
  }, [projects]);

  const employeeMap = useMemo(() => {
    const map = new Map<number, string>();
    employees.forEach((employee) => {
      map.set(employee.employee_id, employee.name);
    });
    return map;
  }, [employees]);

  const partnerMap = useMemo(() => {
    const map = new Map<number, string>();
    partners.forEach((partner) => {
      map.set(partner.partner_id, partner.name);
    });
    return map;
  }, [partners]);

  const loadPlans = async () => {
    try {
      const response = await api.get<AssignmentPlan[]>('/assignment-plans');
      if (response.success) {
        setPlans(response.data || []);
      }
    } catch (error) {
      console.error('Failed to load assignment plans:', error);
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

  const handleOpenDialog = (plan?: AssignmentPlan) => {
    if (plan) {
      setCurrentPlan(plan);
      setIsEdit(true);
    } else {
      setCurrentPlan({
        project_id: projects[0]?.project_id,
        resource_type: 'employee',
        employee_id: employees[0]?.employee_id,
        partner_id: undefined,
        target_month: '',
        planned_hours: undefined,
      });
      setIsEdit(false);
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setCurrentPlan(null);
    setIsEdit(false);
  };

  const toNumberOrNull = (value?: number | string) => {
    if (value === '' || value === undefined || value === null) return null;
    const parsed = Number(value);
    return Number.isNaN(parsed) ? null : parsed;
  };

  const handleSave = async () => {
    if (!currentPlan) return;

    const payload = {
      ...currentPlan,
      project_id: currentPlan.project_id ? Number(currentPlan.project_id) : undefined,
      employee_id:
        currentPlan.resource_type === 'employee'
          ? toNumberOrNull(currentPlan.employee_id)
          : null,
      partner_id:
        currentPlan.resource_type === 'partner'
          ? toNumberOrNull(currentPlan.partner_id)
          : null,
      planned_hours: toNumberOrNull(currentPlan.planned_hours),
    };

    try {
      if (isEdit && currentPlan.plan_id) {
        await api.put(`/assignment-plans/${currentPlan.plan_id}`, payload);
      } else {
        await api.post('/assignment-plans', payload);
      }
      handleCloseDialog();
      loadPlans();
    } catch (error) {
      console.error('Failed to save assignment plan:', error);
      alert('保存に失敗しました');
    }
  };

  const handleDelete = async (id: number) => {
    if (confirm('本当に削除しますか?')) {
      try {
        await api.delete(`/assignment-plans/${id}`);
        loadPlans();
      } catch (error) {
        console.error('Failed to delete assignment plan:', error);
        alert('削除に失敗しました');
      }
    }
  };

  const resourceLabel = (plan: AssignmentPlan) => {
    if (plan.resource_type === 'employee') {
      return employeeMap.get(plan.employee_id || 0) || '-';
    }
    return partnerMap.get(plan.partner_id || 0) || '-';
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <IconButton onClick={() => router.push('/dashboard')}>
          <ArrowBack />
        </IconButton>
        <Typography variant="h4" sx={{ ml: 2 }}>
          アサイン計画
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
              <TableCell>種別</TableCell>
              <TableCell>対象</TableCell>
              <TableCell>対象月</TableCell>
              <TableCell>予定工数</TableCell>
              <TableCell>操作</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {plans.map((plan) => (
              <TableRow key={plan.plan_id}>
                <TableCell>{projectMap.get(plan.project_id) || '-'}</TableCell>
                <TableCell>{plan.resource_type}</TableCell>
                <TableCell>{resourceLabel(plan)}</TableCell>
                <TableCell>{plan.target_month}</TableCell>
                <TableCell>{plan.planned_hours}</TableCell>
                <TableCell>
                  <IconButton onClick={() => handleOpenDialog(plan)}>
                    <Edit />
                  </IconButton>
                  <IconButton onClick={() => handleDelete(plan.plan_id)}>
                    <Delete />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>{isEdit ? 'アサイン計画編集' : 'アサイン計画登録'}</DialogTitle>
        <DialogContent>
          <TextField
            select
            fullWidth
            label="プロジェクト"
            value={currentPlan?.project_id ?? ''}
            onChange={(e) =>
              setCurrentPlan({ ...currentPlan, project_id: Number(e.target.value) })
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
            select
            fullWidth
            label="種別"
            value={currentPlan?.resource_type || 'employee'}
            onChange={(e) =>
              setCurrentPlan({
                ...currentPlan,
                resource_type: e.target.value as AssignmentPlan['resource_type'],
              })
            }
            margin="normal"
            required
          >
            {RESOURCE_TYPES.map((resourceType) => (
              <MenuItem key={resourceType} value={resourceType}>
                {resourceType}
              </MenuItem>
            ))}
          </TextField>
          {currentPlan?.resource_type === 'partner' ? (
            <TextField
              select
              fullWidth
              label="パートナー"
              value={currentPlan?.partner_id ?? ''}
              onChange={(e) =>
                setCurrentPlan({ ...currentPlan, partner_id: Number(e.target.value) })
              }
              margin="normal"
              required
            >
              {partners.map((partner) => (
                <MenuItem key={partner.partner_id} value={partner.partner_id}>
                  {partner.name}
                </MenuItem>
              ))}
            </TextField>
          ) : (
            <TextField
              select
              fullWidth
              label="社員"
              value={currentPlan?.employee_id ?? ''}
              onChange={(e) =>
                setCurrentPlan({ ...currentPlan, employee_id: Number(e.target.value) })
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
          )}
          <TextField
            fullWidth
            label="対象月"
            type="date"
            value={currentPlan?.target_month || ''}
            onChange={(e) => setCurrentPlan({ ...currentPlan, target_month: e.target.value })}
            margin="normal"
            required
            InputLabelProps={{ shrink: true }}
          />
          <TextField
            fullWidth
            label="予定工数"
            type="number"
            value={currentPlan?.planned_hours ?? ''}
            onChange={(e) => setCurrentPlan({ ...currentPlan, planned_hours: e.target.value })}
            margin="normal"
            required
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
