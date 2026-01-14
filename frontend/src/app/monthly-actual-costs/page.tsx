'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { Employee, MonthlyActualCost } from '@/types';
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

export default function MonthlyActualCostsPage() {
  const router = useRouter();
  const [costs, setCosts] = useState<MonthlyActualCost[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [currentCost, setCurrentCost] = useState<Partial<MonthlyActualCost> | null>(null);
  const [isEdit, setIsEdit] = useState(false);

  useEffect(() => {
    loadCosts();
    loadEmployees();
  }, []);

  const employeeMap = useMemo(() => {
    const map = new Map<number, string>();
    employees.forEach((employee) => {
      map.set(employee.employee_id, employee.name);
    });
    return map;
  }, [employees]);

  const loadCosts = async () => {
    try {
      const response = await api.get<MonthlyActualCost[]>('/monthly-actual-costs');
      if (response.success) {
        setCosts(response.data || []);
      }
    } catch (error) {
      console.error('Failed to load monthly costs:', error);
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

  const handleOpenDialog = (cost?: MonthlyActualCost) => {
    if (cost) {
      setCurrentCost(cost);
      setIsEdit(true);
    } else {
      setCurrentCost({
        employee_id: employees[0]?.employee_id,
        target_month: '',
        total_salary: undefined,
        total_work_hours: undefined,
        calculated_unit_cost: undefined,
      });
      setIsEdit(false);
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setCurrentCost(null);
    setIsEdit(false);
  };

  const toNumberOrNull = (value?: number | string) => {
    if (value === '' || value === undefined || value === null) return null;
    const parsed = Number(value);
    return Number.isNaN(parsed) ? null : parsed;
  };

  const handleSave = async () => {
    if (!currentCost) return;

    const payload = {
      ...currentCost,
      employee_id: currentCost.employee_id ? Number(currentCost.employee_id) : undefined,
      total_salary: toNumberOrNull(currentCost.total_salary),
      total_work_hours: toNumberOrNull(currentCost.total_work_hours),
      calculated_unit_cost: toNumberOrNull(currentCost.calculated_unit_cost),
    };

    try {
      if (isEdit && currentCost.cost_id) {
        await api.put(`/monthly-actual-costs/${currentCost.cost_id}`, payload);
      } else {
        await api.post('/monthly-actual-costs', payload);
      }
      handleCloseDialog();
      loadCosts();
    } catch (error) {
      console.error('Failed to save monthly cost:', error);
      alert('保存に失敗しました');
    }
  };

  const handleDelete = async (id: number) => {
    if (confirm('本当に削除しますか?')) {
      try {
        await api.delete(`/monthly-actual-costs/${id}`);
        loadCosts();
      } catch (error) {
        console.error('Failed to delete monthly cost:', error);
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
          月次給与実績
        </Typography>
        <Button variant="contained" sx={{ ml: 'auto' }} onClick={() => handleOpenDialog()}>
          新規登録
        </Button>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>社員</TableCell>
              <TableCell>対象月</TableCell>
              <TableCell>総支給額</TableCell>
              <TableCell>総稼働時間</TableCell>
              <TableCell>算出単価</TableCell>
              <TableCell>操作</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {costs.map((cost) => (
              <TableRow key={cost.cost_id}>
                <TableCell>{employeeMap.get(cost.employee_id) || '-'}</TableCell>
                <TableCell>{cost.target_month}</TableCell>
                <TableCell>{cost.total_salary}</TableCell>
                <TableCell>{cost.total_work_hours}</TableCell>
                <TableCell>{cost.calculated_unit_cost ?? '-'}</TableCell>
                <TableCell>
                  <IconButton onClick={() => handleOpenDialog(cost)}>
                    <Edit />
                  </IconButton>
                  <IconButton onClick={() => handleDelete(cost.cost_id)}>
                    <Delete />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>{isEdit ? '月次給与実績編集' : '月次給与実績登録'}</DialogTitle>
        <DialogContent>
          <TextField
            select
            fullWidth
            label="社員"
            value={currentCost?.employee_id ?? ''}
            onChange={(e) =>
              setCurrentCost({ ...currentCost, employee_id: Number(e.target.value) })
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
            fullWidth
            label="対象月"
            type="date"
            value={currentCost?.target_month || ''}
            onChange={(e) => setCurrentCost({ ...currentCost, target_month: e.target.value })}
            margin="normal"
            required
            InputLabelProps={{ shrink: true }}
          />
          <TextField
            fullWidth
            label="総支給額"
            type="number"
            value={currentCost?.total_salary ?? ''}
            onChange={(e) => setCurrentCost({ ...currentCost, total_salary: e.target.value })}
            margin="normal"
            required
          />
          <TextField
            fullWidth
            label="総稼働時間"
            type="number"
            value={currentCost?.total_work_hours ?? ''}
            onChange={(e) =>
              setCurrentCost({ ...currentCost, total_work_hours: e.target.value })
            }
            margin="normal"
            required
          />
          <TextField
            fullWidth
            label="算出単価"
            type="number"
            value={currentCost?.calculated_unit_cost ?? ''}
            onChange={(e) =>
              setCurrentCost({ ...currentCost, calculated_unit_cost: e.target.value })
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
