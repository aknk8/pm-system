'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { Project, ProjectProfitReport } from '@/types';
import {
  Box,
  Container,
  IconButton,
  MenuItem,
  Paper,
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

export default function ProjectReportPage() {
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<number | ''>('');
  const [report, setReport] = useState<ProjectProfitReport | null>(null);

  useEffect(() => {
    loadProjects();
  }, []);

  useEffect(() => {
    if (selectedProjectId === '') {
      setReport(null);
      return;
    }
    loadReport(selectedProjectId);
  }, [selectedProjectId]);

  const projectMap = useMemo(() => {
    const map = new Map<number, Project>();
    projects.forEach((project) => map.set(project.project_id, project));
    return map;
  }, [projects]);

  const loadProjects = async () => {
    try {
      const response = await api.get<Project[]>('/projects');
      if (response.success) {
        setProjects(response.data || []);
        if (response.data && response.data.length > 0) {
          setSelectedProjectId(response.data[0].project_id);
        }
      }
    } catch (error) {
      console.error('Failed to load projects:', error);
    }
  };

  const loadReport = async (projectId: number) => {
    try {
      const response = await api.get<ProjectProfitReport>(`/reports/projects/${projectId}/profit`);
      if (response.success) {
        setReport(response.data || null);
      }
    } catch (error) {
      console.error('Failed to load project report:', error);
    }
  };

  const selectedProject = selectedProjectId
    ? projectMap.get(selectedProjectId)
    : undefined;

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <IconButton onClick={() => router.push('/dashboard')}>
          <ArrowBack />
        </IconButton>
        <Typography variant="h4" sx={{ ml: 2 }}>
          プロジェクト損益
        </Typography>
      </Box>

      {projects.length === 0 ? (
        <Paper sx={{ p: 2 }}>
          <Typography variant="body1">
            レポートを表示するにはプロジェクトの登録が必要です。
          </Typography>
        </Paper>
      ) : (
        <>
          <Paper sx={{ p: 2, mb: 3 }}>
            <TextField
              select
              fullWidth
              label="プロジェクト"
              value={selectedProjectId}
              onChange={(e) => setSelectedProjectId(Number(e.target.value))}
            >
              {projects.map((project) => (
                <MenuItem key={project.project_id} value={project.project_id}>
                  {project.name}
                </MenuItem>
              ))}
            </TextField>
          </Paper>

          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>
              {selectedProject?.name || 'プロジェクト'} 損益サマリー
            </Typography>
            {report ? (
              <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                <Typography>クライアント: {report.client_name}</Typography>
                <Typography>PM: {report.pm_name}</Typography>
                <Typography>サービス種別: {report.service_type}</Typography>
                <Typography>契約金額: {formatNumber(report.contract_amount)}</Typography>
                <Typography>売上: {formatNumber(report.revenue)}</Typography>
                <Typography>労務原価(標準): {formatNumber(report.cost_labor_standard)}</Typography>
                <Typography>外注費: {formatNumber(report.cost_partner)}</Typography>
                <Typography>その他原価: {formatNumber(report.cost_other)}</Typography>
                <Typography>利益(標準): {formatNumber(report.profit_standard)}</Typography>
              </Box>
            ) : (
              <Typography color="text.secondary">データがありません。</Typography>
            )}
          </Paper>
        </>
      )}
    </Container>
  );
}
