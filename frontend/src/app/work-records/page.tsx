'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { Employee, Partner, Project, WorkRecord } from '@/types';
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

const RESOURCE_TYPES: WorkRecord['resource_type'][] = ['employee', 'partner'];

export default function WorkRecordsPage() {
  const router = useRouter();
  const [records, setRecords] = useState<WorkRecord[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [partners, setPartners] = useState<Partner[]>([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [currentRecord, setCurrentRecord] = useState<Partial<WorkRecord> | null>(null);
  const [isEdit, setIsEdit] = useState(false);

  useEffect(() => {
    loadRecords();
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

  const loadRecords = async () => {
    try {
      const response = await api.get<WorkRecord[]>('/work-records');
      if (response.success) {
        setRecords(response.data || []);
      }
    } catch (error) {
      console.error('Failed to load work records:', error);
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

  const handleOpenDialog = (record?: WorkRecord) => {
    if (record) {
      setCurrentRecord(record);
      setIsEdit(true);
    } else {
      setCurrentRecord({
        project_id: projects[0]?.project_id,
        resource_type: 'employee',
        employee_id: employees[0]?.employee_id,
        partner_id: undefined,
        work_date: '',
        hours: undefined,
      });
      setIsEdit(false);
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setCurrentRecord(null);
    setIsEdit(false);
  };

  const toNumberOrNull = (value?: number | string) => {
    if (value === '' || value === undefined || value === null) return null;
    const parsed = Number(value);
    return Number.isNaN(parsed) ? null : parsed;
  };

  const handleSave = async () => {
    if (!currentRecord) return;

    const payload = {
      ...currentRecord,
      project_id: currentRecord.project_id ? Number(currentRecord.project_id) : undefined,
      employee_id:
        currentRecord.resource_type === 'employee'
          ? toNumberOrNull(currentRecord.employee_id)
          : null,
      partner_id:
        currentRecord.resource_type === 'partner'
          ? toNumberOrNull(currentRecord.partner_id)
          : null,
      hours: toNumberOrNull(currentRecord.hours),
    };

    try {
      if (isEdit && currentRecord.record_id) {
        await api.put(`/work-records/${currentRecord.record_id}`, payload);
      } else {
        await api.post('/work-records', payload);
      }
      handleCloseDialog();
      loadRecords();
    } catch (error) {
      console.error('Failed to save work record:', error);
      alert('保存に失敗しました');
    }
  };

  const handleDelete = async (id: number) => {
    if (confirm('本当に削除しますか?')) {
      try {
        await api.delete(`/work-records/${id}`);
        loadRecords();
      } catch (error) {
        console.error('Failed to delete work record:', error);
        alert('削除に失敗しました');
      }
    }
  };

  const resourceLabel = (record: WorkRecord) => {
    if (record.resource_type === 'employee') {
      return employeeMap.get(record.employee_id || 0) || '-';
    }
    return partnerMap.get(record.partner_id || 0) || '-';
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <IconButton onClick={() => router.push('/dashboard')}>
          <ArrowBack />
        </IconButton>
        <Typography variant="h4" sx={{ ml: 2 }}>
          稼働実績
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
              <TableCell>日付</TableCell>
              <TableCell>時間</TableCell>
              <TableCell>操作</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {records.map((record) => (
              <TableRow key={record.record_id}>
                <TableCell>{projectMap.get(record.project_id) || '-'}</TableCell>
                <TableCell>{record.resource_type}</TableCell>
                <TableCell>{resourceLabel(record)}</TableCell>
                <TableCell>{record.work_date}</TableCell>
                <TableCell>{record.hours}</TableCell>
                <TableCell>
                  <IconButton onClick={() => handleOpenDialog(record)}>
                    <Edit />
                  </IconButton>
                  <IconButton onClick={() => handleDelete(record.record_id)}>
                    <Delete />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>{isEdit ? '稼働実績編集' : '稼働実績登録'}</DialogTitle>
        <DialogContent>
          <TextField
            select
            fullWidth
            label="プロジェクト"
            value={currentRecord?.project_id ?? ''}
            onChange={(e) =>
              setCurrentRecord({ ...currentRecord, project_id: Number(e.target.value) })
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
            value={currentRecord?.resource_type || 'employee'}
            onChange={(e) =>
              setCurrentRecord({
                ...currentRecord,
                resource_type: e.target.value as WorkRecord['resource_type'],
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
          {currentRecord?.resource_type === 'partner' ? (
            <TextField
              select
              fullWidth
              label="パートナー"
              value={currentRecord?.partner_id ?? ''}
              onChange={(e) =>
                setCurrentRecord({ ...currentRecord, partner_id: Number(e.target.value) })
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
              value={currentRecord?.employee_id ?? ''}
              onChange={(e) =>
                setCurrentRecord({ ...currentRecord, employee_id: Number(e.target.value) })
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
            label="日付"
            type="date"
            value={currentRecord?.work_date || ''}
            onChange={(e) => setCurrentRecord({ ...currentRecord, work_date: e.target.value })}
            margin="normal"
            required
            InputLabelProps={{ shrink: true }}
          />
          <TextField
            fullWidth
            label="時間"
            type="number"
            value={currentRecord?.hours ?? ''}
            onChange={(e) => setCurrentRecord({ ...currentRecord, hours: e.target.value })}
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
