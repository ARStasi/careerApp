import { useState } from 'react';
import { Stack, Title, Card, TextInput, Button, Group, Text, Modal, ActionIcon } from '@mantine/core';
import { useForm } from '@mantine/form';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { notifications } from '@mantine/notifications';
import { IconPlus, IconEdit, IconTrash } from '@tabler/icons-react';
import api from '../api/client';
import type { Certification } from '../types';

function CertForm({
  initial,
  onSubmit,
  loading,
}: {
  initial?: Certification;
  onSubmit: (values: Partial<Certification>) => void;
  loading: boolean;
}) {
  const form = useForm({
    initialValues: {
      name: initial?.name || '',
      issuing_org: initial?.issuing_org || '',
      issue_date: initial?.issue_date || '',
      expiry_date: initial?.expiry_date || '',
      credential_id: initial?.credential_id || '',
    },
  });

  return (
    <form onSubmit={form.onSubmit(onSubmit)}>
      <Stack>
        <TextInput label="Certification Name" required {...form.getInputProps('name')} />
        <TextInput label="Issuing Organization" {...form.getInputProps('issuing_org')} />
        <Group grow>
          <TextInput label="Issue Date" type="date" {...form.getInputProps('issue_date')} />
          <TextInput label="Expiry Date" type="date" {...form.getInputProps('expiry_date')} />
        </Group>
        <TextInput label="Credential ID" {...form.getInputProps('credential_id')} />
        <Button type="submit" loading={loading}>Save</Button>
      </Stack>
    </form>
  );
}

export default function CertificationsPage() {
  const qc = useQueryClient();
  const [addOpen, setAddOpen] = useState(false);
  const [editItem, setEditItem] = useState<Certification | null>(null);

  const { data: items, isLoading } = useQuery<Certification[]>({
    queryKey: ['certifications'],
    queryFn: () => api.get('/certifications').then((r) => r.data),
  });

  const createMut = useMutation({
    mutationFn: (data: Partial<Certification>) => api.post('/certifications', data).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['certifications'] });
      setAddOpen(false);
      notifications.show({ message: 'Certification added', color: 'green' });
    },
  });

  const updateMut = useMutation({
    mutationFn: ({ id, ...data }: Partial<Certification> & { id: number }) =>
      api.put(`/certifications/${id}`, data).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['certifications'] });
      setEditItem(null);
      notifications.show({ message: 'Certification updated', color: 'green' });
    },
  });

  const deleteMut = useMutation({
    mutationFn: (id: number) => api.delete(`/certifications/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['certifications'] });
      notifications.show({ message: 'Certification deleted', color: 'red' });
    },
  });

  if (isLoading) return <div>Loading...</div>;

  return (
    <Stack>
      <Group justify="space-between">
        <Title order={2}>Certifications</Title>
        <Button leftSection={<IconPlus size={16} />} onClick={() => setAddOpen(true)}>Add</Button>
      </Group>

      {items?.map((item) => (
        <Card key={item.id} shadow="sm" padding="lg" withBorder>
          <Group justify="space-between">
            <div>
              <Text fw={600}>{item.name}</Text>
              {item.issuing_org && <Text size="sm" c="dimmed">{item.issuing_org}</Text>}
              {item.credential_id && <Text size="xs" c="dimmed">ID: {item.credential_id}</Text>}
            </div>
            <Group gap="xs">
              <ActionIcon variant="subtle" onClick={() => setEditItem(item)}><IconEdit size={16} /></ActionIcon>
              <ActionIcon variant="subtle" color="red" onClick={() => { if (window.confirm('Are you sure you want to delete this certification?')) deleteMut.mutate(item.id); }}><IconTrash size={16} /></ActionIcon>
            </Group>
          </Group>
        </Card>
      ))}
      {items?.length === 0 && <Text c="dimmed">No certifications yet.</Text>}

      <Modal opened={addOpen} onClose={() => setAddOpen(false)} title="Add Certification">
        <CertForm onSubmit={(v) => createMut.mutate(v)} loading={createMut.isPending} />
      </Modal>
      <Modal opened={!!editItem} onClose={() => setEditItem(null)} title="Edit Certification">
        {editItem && (
          <CertForm
            initial={editItem}
            onSubmit={(v) => updateMut.mutate({ ...v, id: editItem.id })}
            loading={updateMut.isPending}
          />
        )}
      </Modal>
    </Stack>
  );
}
