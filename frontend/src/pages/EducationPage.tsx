import { useState } from 'react';
import { Stack, Title, Card, TextInput, Button, Group, Text, Modal, ActionIcon } from '@mantine/core';
import { useForm } from '@mantine/form';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { notifications } from '@mantine/notifications';
import { IconPlus, IconEdit, IconTrash } from '@tabler/icons-react';
import api from '../api/client';
import type { Education } from '../types';

function cleanDates(values: Record<string, unknown>) {
  const cleaned = { ...values };
  if (!cleaned.start_date) cleaned.start_date = null;
  if (!cleaned.end_date) cleaned.end_date = null;
  return cleaned;
}

function EducationForm({
  initial,
  onSubmit,
  loading,
}: {
  initial?: Education;
  onSubmit: (values: Partial<Education>) => void;
  loading: boolean;
}) {
  const form = useForm({
    initialValues: {
      institution: initial?.institution || '',
      degree: initial?.degree || '',
      field: initial?.field || '',
      city: initial?.city || '',
      state: initial?.state || '',
      start_date: initial?.start_date || '',
      end_date: initial?.end_date || '',
    },
  });

  return (
    <form onSubmit={form.onSubmit((v) => onSubmit(cleanDates(v) as Partial<Education>))}>
      <Stack>
        <TextInput label="Institution" required {...form.getInputProps('institution')} />
        <TextInput label="Degree" {...form.getInputProps('degree')} />
        <TextInput label="Field of Study" {...form.getInputProps('field')} />
        <Group grow>
          <TextInput label="City" {...form.getInputProps('city')} />
          <TextInput label="State" {...form.getInputProps('state')} />
        </Group>
        <Group grow>
          <TextInput label="Start Date (optional)" type="date" {...form.getInputProps('start_date')} />
          <TextInput label="End Date (optional)" type="date" {...form.getInputProps('end_date')} />
        </Group>
        <Button type="submit" loading={loading}>Save</Button>
      </Stack>
    </form>
  );
}

export default function EducationPage() {
  const qc = useQueryClient();
  const [addOpen, setAddOpen] = useState(false);
  const [editItem, setEditItem] = useState<Education | null>(null);

  const { data: items, isLoading } = useQuery<Education[]>({
    queryKey: ['education'],
    queryFn: () => api.get('/education').then((r) => r.data),
  });

  const createMut = useMutation({
    mutationFn: (data: Partial<Education>) => api.post('/education', data).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['education'] });
      setAddOpen(false);
      notifications.show({ message: 'Education added', color: 'green' });
    },
  });

  const updateMut = useMutation({
    mutationFn: ({ id, ...data }: Partial<Education> & { id: number }) =>
      api.put(`/education/${id}`, data).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['education'] });
      setEditItem(null);
      notifications.show({ message: 'Education updated', color: 'green' });
    },
  });

  const deleteMut = useMutation({
    mutationFn: (id: number) => api.delete(`/education/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['education'] });
      notifications.show({ message: 'Education deleted', color: 'red' });
    },
  });

  if (isLoading) return <div>Loading...</div>;

  return (
    <Stack>
      <Group justify="space-between">
        <Title order={2}>Education</Title>
        <Button leftSection={<IconPlus size={16} />} onClick={() => setAddOpen(true)}>Add</Button>
      </Group>

      {items?.map((item) => (
        <Card key={item.id} shadow="sm" padding="lg" withBorder>
          <Group justify="space-between">
            <div>
              <Text fw={600}>{item.institution}</Text>
              {item.degree && <Text size="sm">{item.degree}{item.field ? ` in ${item.field}` : ''}</Text>}
              {item.city && item.state && <Text size="sm" c="dimmed">{item.city}, {item.state}</Text>}
            </div>
            <Group gap="xs">
              <ActionIcon variant="subtle" onClick={() => setEditItem(item)}><IconEdit size={16} /></ActionIcon>
              <ActionIcon variant="subtle" color="red" onClick={() => { if (window.confirm('Are you sure you want to delete this education entry?')) deleteMut.mutate(item.id); }}><IconTrash size={16} /></ActionIcon>
            </Group>
          </Group>
        </Card>
      ))}
      {items?.length === 0 && <Text c="dimmed">No education entries yet.</Text>}

      <Modal opened={addOpen} onClose={() => setAddOpen(false)} title="Add Education">
        <EducationForm onSubmit={(v) => createMut.mutate(v)} loading={createMut.isPending} />
      </Modal>
      <Modal opened={!!editItem} onClose={() => setEditItem(null)} title="Edit Education">
        {editItem && (
          <EducationForm
            initial={editItem}
            onSubmit={(v) => updateMut.mutate({ ...v, id: editItem.id })}
            loading={updateMut.isPending}
          />
        )}
      </Modal>
    </Stack>
  );
}
