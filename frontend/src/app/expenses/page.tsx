'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { ExpenseRecord, Project } from '@/types';
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

export default function ExpensesPage() {
  const router = useRouter();
  const [expenses, setExpenses] = useState<ExpenseRecord[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [currentExpense, setCurrentExpense] = useState<Partial<ExpenseRecord> | null>(null);
  const [isEdit, setIsEdit] = useState(false);

  useEffect(() => {
    loadExpenses();
    loadProjects();
  }, []);

  const projectMap = useMemo(() => {
    const map = new Map<number, string>();
    projects.forEach((project) => {
      map.set(project.project_id, project.name);
    });
    return map;
  }, [projects]);

  const loadExpenses = async () => {
    try {
      const response = await api.get<ExpenseRecord[]>('/expenses');
      if (response.success) {
        setExpenses(response.data || []);
      }
    } catch (error) {
      console.error('Failed to load expenses:', error);
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

  const handleOpenDialog = (expense?: ExpenseRecord) => {
    if (expense) {
      setCurrentExpense(expense);
      setIsEdit(true);
    } else {
      setCurrentExpense({
        project_id: projects[0]?.project_id,
        expense_type: '',
        amount: undefined,
        currency: 'JPY',
        occurred_date: '',
        description: '',
        invoice_number: '',
      });
      setIsEdit(false);
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setCurrentExpense(null);
    setIsEdit(false);
  };

  const toNumberOrNull = (value?: number | string) => {
    if (value === '' || value === undefined || value === null) return null;
    const parsed = Number(value);
    return Number.isNaN(parsed) ? null : parsed;
  };

  const handleSave = async () => {
    if (!currentExpense) return;

    const payload = {
      ...currentExpense,
      project_id: currentExpense.project_id ? Number(currentExpense.project_id) : undefined,
      amount: toNumberOrNull(currentExpense.amount),
    };

    try {
      if (isEdit && currentExpense.expense_id) {
        await api.put(`/expenses/${currentExpense.expense_id}`, payload);
      } else {
        await api.post('/expenses', payload);
      }
      handleCloseDialog();
      loadExpenses();
    } catch (error) {
      console.error('Failed to save expense:', error);
      alert('保存に失敗しました');
    }
  };

  const handleDelete = async (id: number) => {
    if (confirm('本当に削除しますか?')) {
      try {
        await api.delete(`/expenses/${id}`);
        loadExpenses();
      } catch (error) {
        console.error('Failed to delete expense:', error);
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
          経費実績
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
              <TableCell>日付</TableCell>
              <TableCell>金額</TableCell>
              <TableCell>請求書番号</TableCell>
              <TableCell>操作</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {expenses.map((expense) => (
              <TableRow key={expense.expense_id}>
                <TableCell>{projectMap.get(expense.project_id) || '-'}</TableCell>
                <TableCell>{expense.expense_type}</TableCell>
                <TableCell>{expense.occurred_date}</TableCell>
                <TableCell>
                  {expense.amount} {expense.currency}
                </TableCell>
                <TableCell>{expense.invoice_number || '-'}</TableCell>
                <TableCell>
                  <IconButton onClick={() => handleOpenDialog(expense)}>
                    <Edit />
                  </IconButton>
                  <IconButton onClick={() => handleDelete(expense.expense_id)}>
                    <Delete />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>{isEdit ? '経費実績編集' : '経費実績登録'}</DialogTitle>
        <DialogContent>
          <TextField
            select
            fullWidth
            label="プロジェクト"
            value={currentExpense?.project_id ?? ''}
            onChange={(e) =>
              setCurrentExpense({ ...currentExpense, project_id: Number(e.target.value) })
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
            label="種別"
            value={currentExpense?.expense_type || ''}
            onChange={(e) =>
              setCurrentExpense({ ...currentExpense, expense_type: e.target.value })
            }
            margin="normal"
            required
          />
          <TextField
            fullWidth
            label="日付"
            type="date"
            value={currentExpense?.occurred_date || ''}
            onChange={(e) =>
              setCurrentExpense({ ...currentExpense, occurred_date: e.target.value })
            }
            margin="normal"
            required
            InputLabelProps={{ shrink: true }}
          />
          <TextField
            fullWidth
            label="金額"
            type="number"
            value={currentExpense?.amount ?? ''}
            onChange={(e) => setCurrentExpense({ ...currentExpense, amount: e.target.value })}
            margin="normal"
            required
          />
          <TextField
            fullWidth
            label="通貨"
            value={currentExpense?.currency || 'JPY'}
            onChange={(e) => setCurrentExpense({ ...currentExpense, currency: e.target.value })}
            margin="normal"
          />
          <TextField
            fullWidth
            label="請求書番号"
            value={currentExpense?.invoice_number || ''}
            onChange={(e) =>
              setCurrentExpense({ ...currentExpense, invoice_number: e.target.value })
            }
            margin="normal"
          />
          <TextField
            fullWidth
            label="説明"
            value={currentExpense?.description || ''}
            onChange={(e) =>
              setCurrentExpense({ ...currentExpense, description: e.target.value })
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
