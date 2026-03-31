import { Routes, Route } from 'react-router-dom';
import { AppShell, NavLink, Group, Title } from '@mantine/core';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  IconHome,
  IconUser,
  IconBuilding,
  IconSchool,
  IconCertificate,
  IconFileText,
  IconBriefcase,
  IconRobot,
  IconFileExport,
} from '@tabler/icons-react';
import Dashboard from './pages/Dashboard';
import ProfilePage from './pages/ProfilePage';
import CompaniesPage from './pages/CompaniesPage';
import RoleDetailPage from './pages/RoleDetailPage';
import EducationPage from './pages/EducationPage';
import CertificationsPage from './pages/CertificationsPage';
import WorkflowPage from './pages/WorkflowPage';
import ApplicationsPage from './pages/ApplicationsPage';
import InstructionsPage from './pages/InstructionsPage';
import CareerExportPage from './pages/CareerExportPage';

const navItems = [
  { label: 'Dashboard', path: '/', icon: IconHome },
  { label: 'Profile', path: '/profile', icon: IconUser },
  { label: 'Companies', path: '/companies', icon: IconBuilding },
  { label: 'Education', path: '/education', icon: IconSchool },
  { label: 'Certifications', path: '/certifications', icon: IconCertificate },
  { label: 'Applications', path: '/applications', icon: IconBriefcase },
  { label: 'Career Export', path: '/career-export', icon: IconFileExport },
  { label: 'AI Instructions', path: '/instructions', icon: IconRobot },
  { label: 'Resume Workflow', path: '/workflow', icon: IconFileText },
];

export default function App() {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <AppShell navbar={{ width: 220, breakpoint: 'sm' }} padding="md">
      <AppShell.Navbar p="xs">
        <Group mb="md" px="xs">
          <Title order={4}>Career Manager</Title>
        </Group>
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            label={item.label}
            leftSection={<item.icon size={18} />}
            active={location.pathname === item.path}
            onClick={() => navigate(item.path)}
          />
        ))}
      </AppShell.Navbar>
      <AppShell.Main>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/companies" element={<CompaniesPage />} />
          <Route path="/companies/:companyId/roles/:roleId" element={<RoleDetailPage />} />
          <Route path="/education" element={<EducationPage />} />
          <Route path="/certifications" element={<CertificationsPage />} />
          <Route path="/applications" element={<ApplicationsPage />} />
          <Route path="/career-export" element={<CareerExportPage />} />
          <Route path="/instructions" element={<InstructionsPage />} />
          <Route path="/workflow" element={<WorkflowPage />} />
        </Routes>
      </AppShell.Main>
    </AppShell>
  );
}
