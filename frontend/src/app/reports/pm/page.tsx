'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { Employee, ProjectProfitReport } from '@/types';
import {
  Box,
  Container,
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
import { ArrowBack } from '@mui/icons-material';

const formatNumber = (value: number | null | undefined) => {
  if (value === null || value === undefined) return '-';
  const num = Number(value);
  if (Number.isNaN(num)) return '-';
  return num.toLocaleString();
};

export default function PmReportPage() {
  const router = useRouter();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<number | ''>('');
  const [reports, setReports] = useState<ProjectProfitReport[]>([]);

  useEffect(() => {
    loadEmployees();
  }, []);

  useEffect(() => {
    if (selectedEmployeeId === '') {
      setReports([]);
      return;
    }
    loadReports(selectedEmployeeId);
  }, [selectedEmployeeId]);

  const employeeMap = useMemo(() => {
    const map = new Map<number, string>();
    employees.forEach((employee) => map.set(employee.employee_id, employee.name));
    return map;
  }, [employees]);

  const loadEmployees = async () => {
    try {
      const response = await api.get<Employee[]>('/employees');
      if (response.success) {
        setEmployees(response.data || []);
        if (response.data && response.data.length > 0) {
          setSelectedEmployeeId(response.data[0].employee_id);
        }
      }
    } catch (error) {
      console.error('Failed to load employees:', error);
    }
  };

  const loadReports = async (employeeId: number) => {
    try {
      const response = await api.get<ProjectProfitReport[]>(
        `/reports/pm/${employeeId}/profit`
      );
      if (response.success) {
        setReports(response.data || []);
      }
    } catch (error) {
      console.error('Failed to load pm report:', error);
    }
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <IconButton onClick={() => router.push('/dashboard')}>
          <ArrowBack />
        </IconButton>
        <Typography variant="h4" sx={{ ml: 2 }}>
          PM別損益
        </Typography>
      </Box>

      {employees.length === 0 ? (
        <Paper sx={{ p: 2 }}>
          <Typography variant="body1">
            レポートを表示するには社員の登録が必要です。
          </Typography>
        </Paper>
      ) : (
        <>
          <Paper sx={{ p: 2, mb: 3 }}>
            <TextField
              select
              fullWidth
              label="PM"
              value={selectedEmployeeId}
              onChange={(e) => setSelectedEmployeeId(Number(e.target.value))}
            >
              {employees.map((employee) => (
                <MenuItem key={employee.employee_id} value={employee.employee_id}>
                  {employee.name}
                </MenuItem>
              ))}
            </TextField>
          </Paper>

          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>プロジェクト</TableCell>
                  <TableCell>売上</TableCell>
                  <TableCell>労務原価(標準)</TableCell>
                  <TableCell>外注費</TableCell>
                  <TableCell>その他原価</TableCell>
                  <TableCell>利益(標準)</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {reports.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} align="center">
                      データがありません。
                    </TableCell>
                  </TableRow>
                ) : (
                  reports.map((report) => (
                    <TableRow key={report.project_id}>
                      <TableCell>{report.project_name}</TableCell>
                      <TableCell>{formatNumber(report.revenue)}</TableCell>
                      <TableCell>{formatNumber(report.cost_labor_standard)}</TableCell>
                      <TableCell>{formatNumber(report.cost_partner)}</TableCell>
                      <TableCell>{formatNumber(report.cost_other)}</TableCell>
                      <TableCell>{formatNumber(report.profit_standard)}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
            選択中: {employeeMap.get(selectedEmployeeId as number) || '-'}
          </Typography>
        </>
      )}
    </Container>
  );
}
