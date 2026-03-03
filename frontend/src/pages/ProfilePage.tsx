import { useEffect, useState } from 'react';
import { TextInput, Button, Stack, Title, Card, Text, Group } from '@mantine/core';
import { useForm } from '@mantine/form';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { notifications } from '@mantine/notifications';
import { IconEdit } from '@tabler/icons-react';
import api from '../api/client';
import type { Profile } from '../types';

function ProfileView({ profile, onEdit }: { profile: Profile; onEdit: () => void }) {
  const fields: { label: string; value?: string }[] = [
    { label: 'Name', value: profile.name },
    { label: 'Email', value: profile.email },
    { label: 'Phone', value: profile.phone },
    { label: 'Location', value: [profile.city, profile.state].filter(Boolean).join(', ') || undefined },
    { label: 'Portfolio', value: profile.portfolio_url },
    { label: 'GitHub', value: profile.github_url },
    { label: 'LinkedIn', value: profile.linkedin_url },
  ];

  return (
    <Card shadow="sm" padding="lg" withBorder maw={600}>
      <Group justify="space-between" mb="md">
        <Title order={3}>{profile.name}</Title>
        <Button variant="light" size="xs" leftSection={<IconEdit size={14} />} onClick={onEdit}>
          Edit
        </Button>
      </Group>
      <Stack gap="xs">
        {fields.map(({ label, value }) =>
          value ? (
            <Group key={label} gap="xs">
              <Text fw={500} size="sm" w={80}>{label}:</Text>
              <Text size="sm">{value}</Text>
            </Group>
          ) : null
        )}
      </Stack>
    </Card>
  );
}

export default function ProfilePage() {
  const qc = useQueryClient();
  const [editing, setEditing] = useState(false);

  const { data: profile, isLoading } = useQuery<Profile | null>({
    queryKey: ['profile'],
    queryFn: () => api.get('/profile').then((r) => r.data),
  });

  const form = useForm<Profile>({
    initialValues: {
      name: '',
      email: '',
      phone: '',
      city: '',
      state: '',
      portfolio_url: '',
      github_url: '',
      linkedin_url: '',
    },
  });

  useEffect(() => {
    if (profile) {
      form.setValues({
        name: profile.name || '',
        email: profile.email || '',
        phone: profile.phone || '',
        city: profile.city || '',
        state: profile.state || '',
        portfolio_url: profile.portfolio_url || '',
        github_url: profile.github_url || '',
        linkedin_url: profile.linkedin_url || '',
      });
    }
  }, [profile]); // eslint-disable-line react-hooks/exhaustive-deps

  const shouldShowEditor = editing || (!isLoading && !profile);

  const mutation = useMutation({
    mutationFn: (data: Profile) => api.put('/profile', data).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['profile'] });
      setEditing(false);
      notifications.show({ title: 'Saved', message: 'Profile updated', color: 'green' });
    },
  });

  if (isLoading) return <div>Loading...</div>;

  return (
    <Stack>
      <Title order={2}>Profile</Title>

      {!shouldShowEditor && profile ? (
        <ProfileView profile={profile} onEdit={() => setEditing(true)} />
      ) : (
        <Card shadow="sm" padding="lg" withBorder maw={600}>
          <form onSubmit={form.onSubmit((values) => mutation.mutate(values))}>
            <Stack>
              <TextInput label="Full Name" required {...form.getInputProps('name')} />
              <TextInput label="Email" {...form.getInputProps('email')} />
              <TextInput label="Phone" {...form.getInputProps('phone')} />
              <TextInput label="City" {...form.getInputProps('city')} />
              <TextInput label="State" {...form.getInputProps('state')} />
              <TextInput label="Portfolio URL" {...form.getInputProps('portfolio_url')} />
              <TextInput label="GitHub URL" {...form.getInputProps('github_url')} />
              <TextInput label="LinkedIn URL" {...form.getInputProps('linkedin_url')} />
              <Group>
                <Button type="submit" loading={mutation.isPending}>Save Profile</Button>
                {profile && (
                  <Button variant="subtle" onClick={() => setEditing(false)}>Cancel</Button>
                )}
              </Group>
            </Stack>
          </form>
        </Card>
      )}
    </Stack>
  );
}
