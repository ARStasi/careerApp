import { useMemo, useState } from 'react';
import {
  ActionIcon,
  Badge,
  Button,
  Card,
  Group,
  Modal,
  Select,
  Stack,
  Text,
  TextInput,
  Textarea,
  Title,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { IconEdit, IconPlus, IconSearch, IconTrash } from '@tabler/icons-react';
import api from '../api/client';
import type { Company, KnowledgeEntry, Role } from '../types';

function KnowledgeEntryForm({
  companies,
  roles,
  initial,
  onSubmit,
  loading,
}: {
  companies: Company[];
  roles: Role[];
  initial?: KnowledgeEntry;
  onSubmit: (values: Partial<KnowledgeEntry>) => void;
  loading: boolean;
}) {
  const form = useForm({
    initialValues: {
      title: initial?.title || '',
      content: initial?.content || '',
      company_id: initial?.company_id ? String(initial.company_id) : '',
      role_id: initial?.role_id ? String(initial.role_id) : '',
    },
  });

  const selectedCompanyId = form.values.company_id ? Number(form.values.company_id) : null;
  const roleOptions = roles
    .filter((role) => !selectedCompanyId || role.company_id === selectedCompanyId)
    .map((role) => ({ value: String(role.id), label: role.title }));

  return (
    <form
      onSubmit={form.onSubmit((values) => {
        const roleId = values.role_id ? Number(values.role_id) : undefined;
        const selectedRole = roles.find((role) => role.id === roleId);
        const companyIdFromRole = selectedRole?.company_id;
        const explicitCompanyId = values.company_id ? Number(values.company_id) : undefined;

        onSubmit({
          title: values.title,
          content: values.content,
          role_id: roleId,
          company_id: explicitCompanyId || companyIdFromRole,
        });
      })}
    >
      <Stack>
        <TextInput label="Title" required {...form.getInputProps('title')} />
        <Textarea label="Content" autosize minRows={4} {...form.getInputProps('content')} />
        <Select
          label="Company (optional)"
          placeholder="Select company"
          data={companies.map((company) => ({ value: String(company.id), label: company.name }))}
          clearable
          searchable
          {...form.getInputProps('company_id')}
          onChange={(value) => {
            form.setFieldValue('company_id', value || '');
            const selectedRole = roles.find((role) => role.id === Number(form.values.role_id));
            if (selectedRole && value && selectedRole.company_id !== Number(value)) {
              form.setFieldValue('role_id', '');
            }
          }}
        />
        <Select
          label="Role (optional)"
          placeholder="Select role"
          data={roleOptions}
          clearable
          searchable
          {...form.getInputProps('role_id')}
        />
        <Button type="submit" loading={loading}>Save</Button>
      </Stack>
    </form>
  );
}

export default function KnowledgeBasePage() {
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [filterCompanyId, setFilterCompanyId] = useState<string | null>(null);
  const [filterRoleId, setFilterRoleId] = useState<string | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [editItem, setEditItem] = useState<KnowledgeEntry | null>(null);

  const { data: entries, isLoading } = useQuery<KnowledgeEntry[]>({
    queryKey: ['knowledge'],
    queryFn: () => api.get('/knowledge').then((r) => r.data),
  });

  const { data: companies = [] } = useQuery<Company[]>({
    queryKey: ['companies'],
    queryFn: () => api.get('/companies').then((r) => r.data),
  });

  const { data: roleGroups = [] } = useQuery<{ companyId: number; roles: Role[] }[]>({
    queryKey: ['allRoles', companies.map((company) => company.id)],
    queryFn: async () => {
      if (!companies.length) {
        return [];
      }
      return Promise.all(
        companies.map(async (company) => ({
          companyId: company.id,
          roles: (await api.get(`/companies/${company.id}/roles`)).data as Role[],
        }))
      );
    },
    enabled: companies.length > 0,
  });

  const roles = useMemo(() => roleGroups.flatMap((group) => group.roles), [roleGroups]);
  const roleById = useMemo(() => new Map(roles.map((role) => [role.id, role])), [roles]);
  const companyById = useMemo(() => new Map(companies.map((company) => [company.id, company])), [companies]);

  const createMut = useMutation({
    mutationFn: (data: Partial<KnowledgeEntry>) => api.post('/knowledge', data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['knowledge'] });
      setAddOpen(false);
      notifications.show({ message: 'Knowledge note created', color: 'green' });
    },
  });

  const updateMut = useMutation({
    mutationFn: (data: Partial<KnowledgeEntry> & { id: number }) => api.put(`/knowledge/${data.id}`, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['knowledge'] });
      setEditItem(null);
      notifications.show({ message: 'Knowledge note updated', color: 'green' });
    },
  });

  const deleteMut = useMutation({
    mutationFn: (id: number) => api.delete(`/knowledge/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['knowledge'] });
      notifications.show({ message: 'Knowledge note deleted', color: 'red' });
    },
  });

  const filteredEntries = useMemo(() => {
    const searchLower = search.trim().toLowerCase();
    return (entries || []).filter((entry) => {
      if (filterCompanyId && String(entry.company_id || '') !== filterCompanyId) {
        return false;
      }
      if (filterRoleId && String(entry.role_id || '') !== filterRoleId) {
        return false;
      }
      if (!searchLower) {
        return true;
      }
      return (
        entry.title.toLowerCase().includes(searchLower) ||
        (entry.content || '').toLowerCase().includes(searchLower)
      );
    });
  }, [entries, filterCompanyId, filterRoleId, search]);

  const roleFilterOptions = roles
    .filter((role) => !filterCompanyId || role.company_id === Number(filterCompanyId))
    .map((role) => ({ value: String(role.id), label: role.title }));

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <Stack>
      <Group justify="space-between">
        <Title order={2}>Knowledge Base</Title>
        <Button leftSection={<IconPlus size={16} />} onClick={() => setAddOpen(true)}>
          Add Note
        </Button>
      </Group>

      <Group grow>
        <TextInput
          leftSection={<IconSearch size={14} />}
          placeholder="Search title or content"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
        <Select
          placeholder="Filter by company"
          data={companies.map((company) => ({ value: String(company.id), label: company.name }))}
          value={filterCompanyId}
          onChange={(value) => {
            setFilterCompanyId(value);
            if (filterRoleId) {
              const selectedRole = roles.find((role) => role.id === Number(filterRoleId));
              if (!selectedRole || (value && selectedRole.company_id !== Number(value))) {
                setFilterRoleId(null);
              }
            }
          }}
          clearable
          searchable
        />
        <Select
          placeholder="Filter by role"
          data={roleFilterOptions}
          value={filterRoleId}
          onChange={setFilterRoleId}
          clearable
          searchable
        />
      </Group>

      <Stack>
        {filteredEntries.map((entry) => {
          const role = entry.role_id ? roleById.get(entry.role_id) : undefined;
          const company =
            (entry.company_id ? companyById.get(entry.company_id) : undefined) ||
            (role ? companyById.get(role.company_id) : undefined);

          return (
            <Card key={entry.id} shadow="sm" padding="md" withBorder>
              <Group justify="space-between" mb="xs">
                <Stack gap={2}>
                  <Text fw={600}>{entry.title}</Text>
                  <Group gap="xs">
                    {company && <Badge variant="light">{company.name}</Badge>}
                    {role && <Badge color="gray" variant="light">{role.title}</Badge>}
                  </Group>
                </Stack>
                <Group gap="xs">
                  <ActionIcon variant="subtle" onClick={() => setEditItem(entry)}>
                    <IconEdit size={16} />
                  </ActionIcon>
                  <ActionIcon variant="subtle" color="red" onClick={() => { if (window.confirm('Are you sure you want to delete this knowledge entry?')) deleteMut.mutate(entry.id); }}>
                    <IconTrash size={16} />
                  </ActionIcon>
                </Group>
              </Group>
              {entry.content && <Text size="sm">{entry.content}</Text>}
            </Card>
          );
        })}
      </Stack>

      {filteredEntries.length === 0 && (
        <Text c="dimmed">No knowledge entries match the current filters.</Text>
      )}

      <Modal opened={addOpen} onClose={() => setAddOpen(false)} title="Add Knowledge Note">
        <KnowledgeEntryForm
          companies={companies}
          roles={roles}
          onSubmit={(values) => createMut.mutate(values)}
          loading={createMut.isPending}
        />
      </Modal>
      <Modal opened={!!editItem} onClose={() => setEditItem(null)} title="Edit Knowledge Note">
        {editItem && (
          <KnowledgeEntryForm
            companies={companies}
            roles={roles}
            initial={editItem}
            onSubmit={(values) => updateMut.mutate({ ...values, id: editItem.id })}
            loading={updateMut.isPending}
          />
        )}
      </Modal>
    </Stack>
  );
}
