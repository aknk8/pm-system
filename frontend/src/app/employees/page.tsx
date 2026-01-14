'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { Employee } from '@/types';
import {
  Box,
  Button,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
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

export default function EmployeesPage() {
  const router = useRouter();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [currentEmployee, setCurrentEmployee] = useState<Partial<Employee> | null>(null);
  const [isEdit, setIsEdit] = useState(false);

  useEffect(() => {
    loadEmployees();
  }, []);

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

  const handleOpenDialog = (employee?: Employee) => {
    if (employee) {
      setCurrentEmployee(employee);
      setIsEdit(true);
    } else {
      setCurrentEmployee({
        employee_code: '',
        name: '',
        name_kana: '',
        department: '',
        position: '',
        email: '',
        hire_date: '',
        standard_unit_cost: undefined,
        standard_unit_cost_currency: 'JPY',
      });
      setIsEdit(false);
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setCurrentEmployee(null);
    setIsEdit(false);
  };

  const toNumberOrNull = (value?: number | string) => {
    if (value === '' || value === undefined || value === null) return null;
    const parsed = Number(value);
    return Number.isNaN(parsed) ? null : parsed;
  };

  const handleSave = async () => {
    if (!currentEmployee) return;

    const payload = {
      ...currentEmployee,
      standard_unit_cost: toNumberOrNull(currentEmployee.standard_unit_cost),
    };

    try {
      if (isEdit && currentEmployee.employee_id) {
        await api.put(`/employees/${currentEmployee.employee_id}`, payload);
      } else {
        await api.post('/employees', payload);
      }
      handleCloseDialog();
      loadEmployees();
    } catch (error) {
      console.error('Failed to save employee:', error);
      alert('保存に失敗しました');
    }
  };

  const handleDelete = async (id: number) => {
    if (confirm('本当に削除しますか?')) {
      try {
        await api.delete(`/employees/${id}`);
        loadEmployees();
      } catch (error) {
        console.error('Failed to delete employee:', error);
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
          社員管理
        </Typography>
        <Button variant="contained" sx={{ ml: 'auto' }} onClick={() => handleOpenDialog()}>
          新規登録
        </Button>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>社員コード</TableCell>
              <TableCell>氏名</TableCell>
              <TableCell>部署</TableCell>
              <TableCell>役職</TableCell>
              <TableCell>メール</TableCell>
              <TableCell>標準単価</TableCell>
              <TableCell>操作</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {employees.map((employee) => (
              <TableRow key={employee.employee_id}>
                <TableCell>{employee.employee_code}</TableCell>
                <TableCell>{employee.name}</TableCell>
                <TableCell>{employee.department}</TableCell>
                <TableCell>{employee.position}</TableCell>
                <TableCell>{employee.email}</TableCell>
                <TableCell>
                  {employee.standard_unit_cost !== undefined
                    ? `${employee.standard_unit_cost} ${employee.standard_unit_cost_currency}`
                    : '-'}
                </TableCell>
                <TableCell>
                  <IconButton onClick={() => handleOpenDialog(employee)}>
                    <Edit />
                  </IconButton>
                  <IconButton onClick={() => handleDelete(employee.employee_id)}>
                    <Delete />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>{isEdit ? '社員編集' : '新規社員登録'}</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="社員コード"
            value={currentEmployee?.employee_code || ''}
            onChange={(e) =>
              setCurrentEmployee({ ...currentEmployee, employee_code: e.target.value })
            }
            margin="normal"
            required
          />
          <TextField
            fullWidth
            label="氏名"
            value={currentEmployee?.name || ''}
            onChange={(e) => setCurrentEmployee({ ...currentEmployee, name: e.target.value })}
            margin="normal"
            required
          />
          <TextField
            fullWidth
            label="氏名かな"
            value={currentEmployee?.name_kana || ''}
            onChange={(e) => setCurrentEmployee({ ...currentEmployee, name_kana: e.target.value })}
            margin="normal"
          />
          <TextField
            fullWidth
            label="部署"
            value={currentEmployee?.department || ''}
            onChange={(e) =>
              setCurrentEmployee({ ...currentEmployee, department: e.target.value })
            }
            margin="normal"
          />
          <TextField
            fullWidth
            label="役職"
            value={currentEmployee?.position || ''}
            onChange={(e) =>
              setCurrentEmployee({ ...currentEmployee, position: e.target.value })
            }
            margin="normal"
          />
          <TextField
            fullWidth
            label="メールアドレス"
            value={currentEmployee?.email || ''}
            onChange={(e) => setCurrentEmployee({ ...currentEmployee, email: e.target.value })}
            margin="normal"
          />
          <TextField
            fullWidth
            label="入社日"
            type="date"
            value={currentEmployee?.hire_date || ''}
            onChange={(e) =>
              setCurrentEmployee({ ...currentEmployee, hire_date: e.target.value })
            }
            margin="normal"
            InputLabelProps={{ shrink: true }}
          />
          <TextField
            fullWidth
            label="標準単価"
            type="number"
            value={currentEmployee?.standard_unit_cost ?? ''}
            onChange={(e) =>
              setCurrentEmployee({ ...currentEmployee, standard_unit_cost: e.target.value })
            }
            margin="normal"
          />
          <TextField
            fullWidth
            label="通貨"
            value={currentEmployee?.standard_unit_cost_currency || 'JPY'}
            onChange={(e) =>
              setCurrentEmployee({
                ...currentEmployee,
                standard_unit_cost_currency: e.target.value,
              })
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
