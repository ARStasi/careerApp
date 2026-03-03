import { useState } from 'react';
import {
  Stack, Title, Card, TextInput, Textarea, Button, Group, Text, Modal,
  ActionIcon, Badge, Select, Checkbox,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { notifications } from '@mantine/notifications';
import { IconPlus, IconEdit, IconTrash, IconExternalLink } from '@tabler/icons-react';
import api from '../api/client';
import type { JobApplication, ApplicationStatus } from '../types';

const STATUS_OPTIONS: { value: ApplicationStatus; label: string }[] = [
  { value: 'applied', label: 'Applied' },
  { value: 'email_rejected', label: 'Email Rejected' },
  { value: 'ghosted', label: 'Ghosted' },
  { value: 'withdrew', label: 'Withdrew' },
  { value: 'req_pulled', label: 'Req Pulled' },
  { value: 'interview_scheduled', label: 'Interview Scheduled' },
  { value: 'interview_rejected', label: 'Interview Rejected' },
  { value: 'offered', label: 'Offered' },
  { value: 'accepted', label: 'Accepted' },
];

const STATUS_COLORS: Record<ApplicationStatus, string> = {
  applied: 'blue',
  email_rejected: 'red',
  ghosted: 'gray',
  withdrew: 'orange',
  req_pulled: 'gray',
  interview_scheduled: 'yellow',
  interview_rejected: 'red',
  offered: 'teal',
  accepted: 'green',
};

function statusLabel(status: ApplicationStatus): string {
  return STATUS_OPTIONS.find((o) => o.value === status)?.label || status;
}

function ApplicationForm({
  initial,
  onSubmit,
  loading,
}: {
  initial?: JobApplication;
  onSubmit: (values: Partial<JobApplication>) => void;
  loading: boolean;
}) {
  const form = useForm({
    initialValues: {
      company_name: initial?.company_name || '',
      job_title: initial?.job_title || '',
      req_url: initial?.req_url || '',
      date_applied: initial?.date_applied || new Date().toISOString().slice(0, 10),
      status: initial?.status || 'applied',
      status_date: initial?.status_date || '',
      cover_letter_submitted: initial?.cover_letter_submitted || false,
      notes: initial?.notes || '',
    },
  });

  return (
    <form onSubmit={form.onSubmit(onSubmit)}>
      <Stack>
        <TextInput label="Company Name" required {...form.getInputProps('company_name')} />
        <TextInput label="Job Title" required {...form.getInputProps('job_title')} />
        <TextInput label="Requisition URL" {...form.getInputProps('req_url')} />
        <Group grow>
          <TextInput label="Date Applied" type="date" required {...form.getInputProps('date_applied')} />
          <Select
            label="Status"
            data={STATUS_OPTIONS}
            {...form.getInputProps('status')}
          />
        </Group>
        <TextInput label="Status Date" type="date" {...form.getInputProps('status_date')} />
        <Checkbox
          label="Cover letter submitted"
          {...form.getInputProps('cover_letter_submitted', { type: 'checkbox' })}
        />
        <Textarea label="Notes" autosize minRows={2} {...form.getInputProps('notes')} />
        <Button type="submit" loading={loading}>Save</Button>
      </Stack>
    </form>
  );
}

export default function ApplicationsPage() {
  const qc = useQueryClient();
  const [addOpen, setAddOpen] = useState(false);
  const [editItem, setEditItem] = useState<JobApplication | null>(null);

  const { data: items, isLoading } = useQuery<JobApplication[]>({
    queryKey: ['job-applications'],
    queryFn: () => api.get('/job-applications').then((r) => r.data),
  });

  const createMut = useMutation({
    mutationFn: (data: Partial<JobApplication>) =>
      api.post('/job-applications', data).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['job-applications'] });
      setAddOpen(false);
      notifications.show({ message: 'Application added', color: 'green' });
    },
  });

  const updateMut = useMutation({
    mutationFn: ({ id, ...data }: Partial<JobApplication> & { id: number }) =>
      api.put(`/job-applications/${id}`, data).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['job-applications'] });
      setEditItem(null);
      notifications.show({ message: 'Application updated', color: 'green' });
    },
  });

  const statusMut = useMutation({
    mutationFn: ({ id, status }: { id: number; status: string }) =>
      api.patch(`/job-applications/${id}/status`, {
        status,
        status_date: new Date().toISOString().slice(0, 10),
      }).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['job-applications'] });
      notifications.show({ message: 'Status updated', color: 'green' });
    },
  });

  const deleteMut = useMutation({
    mutationFn: (id: number) => api.delete(`/job-applications/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['job-applications'] });
      notifications.show({ message: 'Application deleted', color: 'red' });
    },
  });

  if (isLoading) return <div>Loading...</div>;

  return (
    <Stack>
      <Group justify="space-between">
        <Title order={2}>Job Applications</Title>
        <Button leftSection={<IconPlus size={16} />} onClick={() => setAddOpen(true)}>Add</Button>
      </Group>

      {items?.map((item) => (
        <Card key={item.id} shadow="sm" padding="lg" withBorder>
          <Group justify="space-between" align="flex-start">
            <div style={{ flex: 1 }}>
              <Group gap="sm" mb={4}>
                <Text fw={600}>{item.company_name}</Text>
                <Badge color={STATUS_COLORS[item.status]}>{statusLabel(item.status)}</Badge>
                {item.cover_letter_submitted && <Badge variant="outline" color="violet">CL</Badge>}
              </Group>
              <Text size="sm">{item.job_title}</Text>
              <Text size="xs" c="dimmed">Applied: {item.date_applied}</Text>
              {item.status_date && (
                <Text size="xs" c="dimmed">Status updated: {item.status_date}</Text>
              )}
              {item.notes && <Text size="xs" mt={4}>{item.notes}</Text>}
            </div>
            <Group gap="xs">
              {item.req_url && (
                <ActionIcon
                  variant="subtle"
                  component="a"
                  href={item.req_url}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <IconExternalLink size={16} />
                </ActionIcon>
              )}
              <Select
                size="xs"
                w={160}
                data={STATUS_OPTIONS}
                value={item.status}
                onChange={(val) => {
                  if (val && val !== item.status) {
                    statusMut.mutate({ id: item.id, status: val });
                  }
                }}
              />
              <ActionIcon variant="subtle" onClick={() => setEditItem(item)}>
                <IconEdit size={16} />
              </ActionIcon>
              <ActionIcon
                variant="subtle"
                color="red"
                onClick={() => {
                  if (window.confirm('Delete this application?')) deleteMut.mutate(item.id);
                }}
              >
                <IconTrash size={16} />
              </ActionIcon>
            </Group>
          </Group>
        </Card>
      ))}
      {items?.length === 0 && <Text c="dimmed">No applications tracked yet.</Text>}

      <Modal opened={addOpen} onClose={() => setAddOpen(false)} title="Add Application">
        <ApplicationForm onSubmit={(v) => createMut.mutate(v)} loading={createMut.isPending} />
      </Modal>
      <Modal opened={!!editItem} onClose={() => setEditItem(null)} title="Edit Application">
        {editItem && (
          <ApplicationForm
            initial={editItem}
            onSubmit={(v) => updateMut.mutate({ ...v, id: editItem.id })}
            loading={updateMut.isPending}
          />
        )}
      </Modal>
    </Stack>
  );
}
