import { Card, SimpleGrid, Text, Title, Stack } from '@mantine/core';
import { useQuery } from '@tanstack/react-query';
import api from '../api/client';
import type { Company, Profile, Education, Certification } from '../types';

export default function Dashboard() {
  const { data: profile } = useQuery<Profile | null>({
    queryKey: ['profile'],
    queryFn: () => api.get('/profile').then((r) => r.data),
  });
  const { data: companies } = useQuery<Company[]>({
    queryKey: ['companies'],
    queryFn: () => api.get('/companies').then((r) => r.data),
  });
  const { data: education } = useQuery<Education[]>({
    queryKey: ['education'],
    queryFn: () => api.get('/education').then((r) => r.data),
  });
  const { data: certifications } = useQuery<Certification[]>({
    queryKey: ['certifications'],
    queryFn: () => api.get('/certifications').then((r) => r.data),
  });

  return (
    <Stack>
      <Title order={2}>Dashboard</Title>
      {profile?.name && <Text size="lg">Welcome, {profile.name}</Text>}
      <SimpleGrid cols={{ base: 1, sm: 2, md: 4 }}>
        <Card shadow="sm" padding="lg" withBorder>
          <Text fw={500} size="lg">{companies?.length ?? 0}</Text>
          <Text c="dimmed">Companies</Text>
        </Card>
        <Card shadow="sm" padding="lg" withBorder>
          <Text fw={500} size="lg">{education?.length ?? 0}</Text>
          <Text c="dimmed">Education</Text>
        </Card>
        <Card shadow="sm" padding="lg" withBorder>
          <Text fw={500} size="lg">{certifications?.length ?? 0}</Text>
          <Text c="dimmed">Certifications</Text>
        </Card>
        <Card shadow="sm" padding="lg" withBorder>
          <Text c="dimmed">Use the Resume Workflow to generate tailored resumes</Text>
        </Card>
      </SimpleGrid>
    </Stack>
  );
}
