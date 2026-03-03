import { useState } from 'react';
import {
  Stack, Title, Card, TextInput, Button, Group, Text, ActionIcon,
  Modal, Accordion, Badge, Checkbox,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { notifications } from '@mantine/notifications';
import { IconPlus, IconEdit, IconTrash } from '@tabler/icons-react';
import { useNavigate } from 'react-router-dom';
import api from '../api/client';
import type { Company, Role } from '../types';

function CompanyForm({
  initial,
  onSubmit,
  loading,
}: {
  initial?: Company;
  onSubmit: (values: Partial<Company>) => void;
  loading: boolean;
}) {
  const [isCurrent, setIsCurrent] = useState(!initial?.end_date && !!initial?.start_date);

  const form = useForm({
    initialValues: {
      name: initial?.name || '',
      description: initial?.description || '',
      industry: initial?.industry || '',
      start_date: initial?.start_date || '',
      end_date: initial?.end_date || '',
      city: initial?.city || '',
      state: initial?.state || '',
    },
  });

  const handleSubmit = (values: typeof form.values) => {
    const cleaned = { ...values };
    if (isCurrent) cleaned.end_date = '';
    if (!cleaned.start_date) (cleaned as Record<string, unknown>).start_date = null;
    if (!cleaned.end_date) (cleaned as Record<string, unknown>).end_date = null;
    onSubmit(cleaned);
  };

  return (
    <form onSubmit={form.onSubmit(handleSubmit)}>
      <Stack>
        <TextInput label="Company Name" required {...form.getInputProps('name')} />
        <TextInput label="Description" {...form.getInputProps('description')} />
        <TextInput label="Industry" {...form.getInputProps('industry')} />
        <TextInput label="Start Date" type="date" {...form.getInputProps('start_date')} />
        <Checkbox
          label="I currently work here"
          checked={isCurrent}
          onChange={(e) => {
            setIsCurrent(e.currentTarget.checked);
            if (e.currentTarget.checked) form.setFieldValue('end_date', '');
          }}
        />
        {!isCurrent && (
          <TextInput label="End Date" type="date" {...form.getInputProps('end_date')} />
        )}
        <Group grow>
          <TextInput label="City" {...form.getInputProps('city')} />
          <TextInput label="State" {...form.getInputProps('state')} />
        </Group>
        <Button type="submit" loading={loading}>Save</Button>
      </Stack>
    </form>
  );
}

function RoleForm({
  initial,
  onSubmit,
  loading,
  buttonLabel,
}: {
  initial?: Role;
  onSubmit: (values: Partial<Role>) => void;
  loading: boolean;
  buttonLabel?: string;
}) {
  const [isCurrent, setIsCurrent] = useState(!initial?.end_date && !!initial?.start_date);

  const form = useForm({
    initialValues: {
      title: initial?.title || '',
      level: initial?.level || '',
      start_date: initial?.start_date || '',
      end_date: initial?.end_date || '',
      city: initial?.city || '',
      state: initial?.state || '',
      is_remote: initial?.is_remote || false,
      summary: initial?.summary || '',
    },
  });

  const handleSubmit = (values: typeof form.values) => {
    const cleaned = { ...values };
    if (isCurrent) cleaned.end_date = '';
    if (!cleaned.start_date) (cleaned as Record<string, unknown>).start_date = null;
    if (!cleaned.end_date) (cleaned as Record<string, unknown>).end_date = null;
    onSubmit(cleaned);
  };

  return (
    <form onSubmit={form.onSubmit(handleSubmit)}>
      <Stack>
        <TextInput label="Title" required {...form.getInputProps('title')} />
        <TextInput label="Level / Grade" placeholder="e.g. L4 Lead, Senior L5" {...form.getInputProps('level')} />
        <TextInput label="Start Date" type="date" {...form.getInputProps('start_date')} />
        <Checkbox
          label="This is my current role"
          checked={isCurrent}
          onChange={(e) => {
            setIsCurrent(e.currentTarget.checked);
            if (e.currentTarget.checked) form.setFieldValue('end_date', '');
          }}
        />
        {!isCurrent && (
          <TextInput label="End Date" type="date" {...form.getInputProps('end_date')} />
        )}
        <Group grow>
          <TextInput label="City" {...form.getInputProps('city')} />
          <TextInput label="State" {...form.getInputProps('state')} />
        </Group>
        <Checkbox
          label="Remote"
          {...form.getInputProps('is_remote', { type: 'checkbox' })}
        />
        <TextInput label="Summary" {...form.getInputProps('summary')} />
        <Button type="submit" loading={loading}>{buttonLabel || 'Add Role'}</Button>
      </Stack>
    </form>
  );
}

function CompanyCard({ company }: { company: Company }) {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const [editOpen, setEditOpen] = useState(false);
  const [roleOpen, setRoleOpen] = useState(false);

  const { data: roles } = useQuery<Role[]>({
    queryKey: ['roles', company.id],
    queryFn: () => api.get(`/companies/${company.id}/roles`).then((r) => r.data),
  });

  const updateMut = useMutation({
    mutationFn: (data: Partial<Company>) =>
      api.put(`/companies/${company.id}`, data).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['companies'] });
      setEditOpen(false);
      notifications.show({ message: 'Company updated', color: 'green' });
    },
  });

  const deleteMut = useMutation({
    mutationFn: () => api.delete(`/companies/${company.id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['companies'] });
      notifications.show({ message: 'Company deleted', color: 'red' });
    },
  });

  const createRoleMut = useMutation({
    mutationFn: (data: Partial<Role>) =>
      api.post(`/companies/${company.id}/roles`, data).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['roles', company.id] });
      setRoleOpen(false);
      notifications.show({ message: 'Role added', color: 'green' });
    },
  });

  return (
    <>
      <Card shadow="sm" padding="lg" withBorder>
        <Group justify="space-between" mb="sm">
          <div>
            <Text fw={600} size="lg">{company.name}</Text>
            {company.industry && <Badge variant="light">{company.industry}</Badge>}
            {company.start_date && (
              <Text size="sm" c="dimmed">
                {company.start_date} — {company.end_date || 'Present'}
              </Text>
            )}
          </div>
          <Group gap="xs">
            <ActionIcon variant="subtle" onClick={() => setEditOpen(true)}>
              <IconEdit size={16} />
            </ActionIcon>
            <ActionIcon variant="subtle" color="red" onClick={() => { if (window.confirm('Are you sure you want to delete this company?')) deleteMut.mutate(); }}>
              <IconTrash size={16} />
            </ActionIcon>
          </Group>
        </Group>

        {company.description && <Text size="sm" mb="sm">{company.description}</Text>}

        {roles && roles.length > 0 && (
          <Accordion variant="contained">
            {roles.map((role) => (
              <Accordion.Item key={role.id} value={String(role.id)}>
                <Accordion.Control>
                  <Group justify="space-between">
                    <Text fw={500}>{role.title}{role.level ? ` (${role.level})` : ''}</Text>
                    <Text size="sm" c="dimmed">
                      {role.start_date} — {role.end_date || 'Present'}
                    </Text>
                  </Group>
                </Accordion.Control>
                <Accordion.Panel>
                  {role.summary && <Text size="sm" mb="sm">{role.summary}</Text>}
                  <Button
                    size="xs"
                    variant="light"
                    onClick={() => navigate(`/companies/${company.id}/roles/${role.id}`)}
                  >
                    View Details
                  </Button>
                </Accordion.Panel>
              </Accordion.Item>
            ))}
          </Accordion>
        )}

        <Button
          variant="light"
          size="xs"
          mt="sm"
          leftSection={<IconPlus size={14} />}
          onClick={() => setRoleOpen(true)}
        >
          Add Role
        </Button>
      </Card>

      <Modal opened={editOpen} onClose={() => setEditOpen(false)} title="Edit Company">
        <CompanyForm
          initial={company}
          onSubmit={(v) => updateMut.mutate(v)}
          loading={updateMut.isPending}
        />
      </Modal>

      <Modal opened={roleOpen} onClose={() => setRoleOpen(false)} title="Add Role">
        <RoleForm onSubmit={(v) => createRoleMut.mutate(v)} loading={createRoleMut.isPending} />
      </Modal>
    </>
  );
}

export default function CompaniesPage() {
  const qc = useQueryClient();
  const [addOpen, setAddOpen] = useState(false);

  const { data: companies, isLoading } = useQuery<Company[]>({
    queryKey: ['companies'],
    queryFn: () => api.get('/companies').then((r) => r.data),
  });

  const createMut = useMutation({
    mutationFn: (data: Partial<Company>) => api.post('/companies', data).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['companies'] });
      setAddOpen(false);
      notifications.show({ message: 'Company created', color: 'green' });
    },
  });

  if (isLoading) return <div>Loading...</div>;

  return (
    <Stack>
      <Group justify="space-between">
        <Title order={2}>Companies & Roles</Title>
        <Button leftSection={<IconPlus size={16} />} onClick={() => setAddOpen(true)}>
          Add Company
        </Button>
      </Group>

      <Stack>
        {companies?.map((c) => <CompanyCard key={c.id} company={c} />)}
        {companies?.length === 0 && <Text c="dimmed">No companies yet. Add one to get started.</Text>}
      </Stack>

      <Modal opened={addOpen} onClose={() => setAddOpen(false)} title="Add Company">
        <CompanyForm onSubmit={(v) => createMut.mutate(v)} loading={createMut.isPending} />
      </Modal>
    </Stack>
  );
}
