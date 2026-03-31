import { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ActionIcon,
  Anchor,
  Badge,
  Breadcrumbs,
  Button,
  Card,
  Divider,
  Group,
  Modal,
  NumberInput,
  Select,
  Stack,
  Switch,
  Tabs,
  Text,
  TextInput,
  Textarea,
  Title,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { IconEdit, IconGripVertical, IconPlus, IconTrash } from '@tabler/icons-react';
import api from '../api/client';
import type {
  Accomplishment,
  Award,
  Company,
  KnowledgeEntry,
  OrgPosition,
  Presentation,
  Responsibility,
  Role,
  RoleSkill,
  Skill,
  TeamStructure,
} from '../types';

function normalizeDate(value?: string | null) {
  return value ? value : undefined;
}

function normalizeAccomplishmentCategory(category?: string | null) {
  return (category || 'resume_bullet').trim().toLowerCase();
}

function reorderIds(ids: number[], sourceId: number, targetId: number) {
  const fromIndex = ids.indexOf(sourceId);
  const toIndex = ids.indexOf(targetId);
  if (fromIndex === -1 || toIndex === -1 || fromIndex === toIndex) {
    return ids;
  }
  const next = [...ids];
  const [moved] = next.splice(fromIndex, 1);
  next.splice(toIndex, 0, moved);
  return next;
}

function RoleForm({
  initial,
  onSubmit,
  loading,
  buttonLabel = 'Save',
}: {
  initial: Role;
  onSubmit: (values: Partial<Role>) => void;
  loading: boolean;
  buttonLabel?: string;
}) {
  const [isCurrent, setIsCurrent] = useState(!initial.end_date && !!initial.start_date);
  const form = useForm({
    initialValues: {
      title: initial.title,
      level: initial.level || '',
      start_date: initial.start_date || '',
      end_date: initial.end_date || '',
      city: initial.city || '',
      state: initial.state || '',
      is_remote: initial.is_remote || false,
      summary: initial.summary || '',
    },
  });

  return (
    <form
      onSubmit={form.onSubmit((values) => {
        onSubmit({
          ...values,
          start_date: normalizeDate(values.start_date),
          end_date: isCurrent ? undefined : normalizeDate(values.end_date),
        });
      })}
    >
      <Stack>
        <TextInput label="Title" required {...form.getInputProps('title')} />
        <TextInput label="Level / Grade" {...form.getInputProps('level')} />
        <TextInput label="Start Date" type="date" {...form.getInputProps('start_date')} />
        <Switch
          label="Current role"
          checked={isCurrent}
          onChange={(event) => {
            setIsCurrent(event.currentTarget.checked);
            if (event.currentTarget.checked) {
              form.setFieldValue('end_date', '');
            }
          }}
        />
        {!isCurrent && <TextInput label="End Date" type="date" {...form.getInputProps('end_date')} />}
        <Group grow>
          <TextInput label="City" {...form.getInputProps('city')} />
          <TextInput label="State" {...form.getInputProps('state')} />
        </Group>
        <Switch label="Remote" {...form.getInputProps('is_remote', { type: 'checkbox' })} />
        <Textarea label="Summary" autosize minRows={2} {...form.getInputProps('summary')} />
        <Button type="submit" loading={loading}>
          {buttonLabel}
        </Button>
      </Stack>
    </form>
  );
}

// ---- Accomplishments Tab ----
function AccomplishmentInlineForm({
  initial,
  onSave,
  onCancel,
  loading,
}: {
  initial?: Accomplishment;
  onSave: (values: Partial<Accomplishment>) => void;
  onCancel: () => void;
  loading: boolean;
}) {
  const form = useForm({
    initialValues: {
      description: initial?.description || '',
      tech_stack: initial?.tech_stack || '',
      key_result: initial?.key_result || '',
      category: initial?.category || 'resume_bullet',
    },
  });

  return (
    <form
      onSubmit={form.onSubmit(onSave)}
      onClick={(e) => e.stopPropagation()}
      style={{ padding: '8px 0 4px 28px' }}
    >
      <Stack gap="xs">
        <Textarea label="Description" required autosize minRows={2} {...form.getInputProps('description')} />
        <TextInput label="Tech Stack" {...form.getInputProps('tech_stack')} />
        <TextInput label="Key Result" {...form.getInputProps('key_result')} />
        <Select
          label="Category"
          data={[
            { value: 'resume_bullet', label: 'Resume Bullet' },
            { value: 'supporting_detail', label: 'Supporting Detail' },
            { value: 'knowledge_base', label: 'Knowledge Base' },
          ]}
          {...form.getInputProps('category')}
        />
        <Group justify="flex-end">
          <Button variant="default" size="xs" onClick={onCancel}>Cancel</Button>
          <Button type="submit" size="xs" loading={loading}>Save</Button>
        </Group>
      </Stack>
    </form>
  );
}

function AccomplishmentsTab({ roleId }: { roleId: number }) {
  const qc = useQueryClient();
  const [expandedId, setExpandedId] = useState<number | 'new' | null>(null);
  const [draggingId, setDraggingId] = useState<number | null>(null);

  const { data: items } = useQuery<Accomplishment[]>({
    queryKey: ['accomplishments', roleId],
    queryFn: () => api.get(`/roles/${roleId}/accomplishments`).then((r) => r.data),
  });

  const createMut = useMutation({
    mutationFn: (data: Partial<Accomplishment>) => api.post(`/roles/${roleId}/accomplishments`, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['accomplishments', roleId] });
      setExpandedId(null);
    },
  });

  const updateMut = useMutation({
    mutationFn: (data: Partial<Accomplishment> & { id: number }) => api.put(`/accomplishments/${data.id}`, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['accomplishments', roleId] });
      setExpandedId(null);
    },
  });

  const deleteMut = useMutation({
    mutationFn: (id: number) => api.delete(`/accomplishments/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['accomplishments', roleId] }),
  });

  const reorderMut = useMutation({
    mutationFn: (accomplishmentIds: number[]) =>
      api.patch(`/roles/${roleId}/accomplishments/reorder`, { accomplishment_ids: accomplishmentIds }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['accomplishments', roleId] });
      notifications.show({ message: 'Accomplishments reordered', color: 'green' });
    },
  });

  const categoryColors: Record<string, string> = {
    resume_bullet: 'blue',
    supporting_detail: 'yellow',
    knowledge_base: 'gray',
  };

  const orderedItems = useMemo(
    () => [...(items || [])].sort((a, b) => a.sort_order - b.sort_order),
    [items]
  );

  const handleDrop = (targetId: number) => {
    if (!draggingId || draggingId === targetId || reorderMut.isPending) {
      setDraggingId(null);
      return;
    }
    const currentIds = orderedItems.map((item) => item.id);
    const nextIds = reorderIds(currentIds, draggingId, targetId);
    if (nextIds.join(',') !== currentIds.join(',')) {
      reorderMut.mutate(nextIds);
    }
    setDraggingId(null);
  };

  return (
    <Stack gap="xs">
      <Group justify="space-between">
        <Stack gap={0}>
          <Text fw={500}>Accomplishments</Text>
          <Text c="dimmed" size="xs">
            Drag items to reorder. Click to edit.
          </Text>
        </Stack>
        <Button size="xs" leftSection={<IconPlus size={14} />} onClick={() => setExpandedId('new')}>
          Add
        </Button>
      </Group>

      {orderedItems.map((item) => {
        const isExpanded = expandedId === item.id;
        return (
          <div
            key={item.id}
            draggable
            onDragStart={() => setDraggingId(item.id)}
            onDragOver={(e) => e.preventDefault()}
            onDrop={() => handleDrop(item.id)}
            onDragEnd={() => setDraggingId(null)}
            style={{
              opacity: draggingId === item.id ? 0.6 : 1,
              outline: draggingId && draggingId !== item.id ? '1px dashed var(--mantine-color-gray-4)' : undefined,
              borderRadius: 4,
            }}
          >
            <Group
              gap="xs"
              wrap="nowrap"
              style={{ cursor: 'pointer', padding: '4px 0' }}
              onClick={() => setExpandedId(isExpanded ? null : item.id)}
            >
              <IconGripVertical size={14} color="var(--mantine-color-gray-5)" style={{ flexShrink: 0, cursor: 'grab' }} />
              <Badge
                size="xs"
                color={categoryColors[item.category]}
                variant="filled"
                circle
                style={{ flexShrink: 0, width: 10, height: 10, minWidth: 10, padding: 0 }}
              />
              <Text size="sm" style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: isExpanded ? 'normal' : 'nowrap' }}>
                {item.description}
              </Text>
              <ActionIcon
                size="sm"
                variant="subtle"
                color="red"
                onClick={(e) => { e.stopPropagation(); if (window.confirm('Are you sure you want to delete this accomplishment?')) deleteMut.mutate(item.id); }}
                style={{ flexShrink: 0 }}
              >
                <IconTrash size={14} />
              </ActionIcon>
            </Group>
            {isExpanded && (
              <AccomplishmentInlineForm
                initial={item}
                onSave={(values) => updateMut.mutate({ ...values, id: item.id })}
                onCancel={() => setExpandedId(null)}
                loading={updateMut.isPending}
              />
            )}
          </div>
        );
      })}
      {orderedItems.length === 0 && expandedId !== 'new' && <Text c="dimmed" size="sm">No accomplishments yet.</Text>}

      {expandedId === 'new' && (
        <AccomplishmentInlineForm
          onSave={(values) => createMut.mutate(values)}
          onCancel={() => setExpandedId(null)}
          loading={createMut.isPending}
        />
      )}
    </Stack>
  );
}

// ---- Responsibilities Tab ----
function ResponsibilityInlineForm({
  initial,
  onSave,
  onCancel,
  loading,
}: {
  initial?: Responsibility;
  onSave: (values: Partial<Responsibility>) => void;
  onCancel: () => void;
  loading: boolean;
}) {
  const form = useForm({
    initialValues: {
      description: initial?.description || '',
    },
  });

  return (
    <form
      onSubmit={form.onSubmit(onSave)}
      onClick={(e) => e.stopPropagation()}
      style={{ padding: '8px 0 4px 28px' }}
    >
      <Stack gap="xs">
        <Textarea label="Description" required autosize minRows={2} {...form.getInputProps('description')} />
        <Group justify="flex-end">
          <Button variant="default" size="xs" onClick={onCancel}>Cancel</Button>
          <Button type="submit" size="xs" loading={loading}>Save</Button>
        </Group>
      </Stack>
    </form>
  );
}

function ResponsibilitiesTab({ roleId }: { roleId: number }) {
  const qc = useQueryClient();
  const [expandedId, setExpandedId] = useState<number | 'new' | null>(null);
  const [draggingId, setDraggingId] = useState<number | null>(null);

  const { data: items } = useQuery<Responsibility[]>({
    queryKey: ['responsibilities', roleId],
    queryFn: () => api.get(`/roles/${roleId}/responsibilities`).then((r) => r.data),
  });

  const createMut = useMutation({
    mutationFn: (data: Partial<Responsibility>) => api.post(`/roles/${roleId}/responsibilities`, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['responsibilities', roleId] });
      setExpandedId(null);
    },
  });

  const updateMut = useMutation({
    mutationFn: (data: Partial<Responsibility> & { id: number }) => api.put(`/responsibilities/${data.id}`, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['responsibilities', roleId] });
      setExpandedId(null);
    },
  });

  const deleteMut = useMutation({
    mutationFn: (id: number) => api.delete(`/responsibilities/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['responsibilities', roleId] }),
  });

  const reorderMut = useMutation({
    mutationFn: (responsibilityIds: number[]) =>
      api.patch(`/roles/${roleId}/responsibilities/reorder`, { responsibility_ids: responsibilityIds }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['responsibilities', roleId] });
      notifications.show({ message: 'Responsibilities reordered', color: 'green' });
    },
  });

  const orderedItems = useMemo(
    () => [...(items || [])].sort((a, b) => a.sort_order - b.sort_order),
    [items]
  );

  const handleDrop = (targetId: number) => {
    if (!draggingId || draggingId === targetId || reorderMut.isPending) {
      setDraggingId(null);
      return;
    }
    const currentIds = orderedItems.map((item) => item.id);
    const nextIds = reorderIds(currentIds, draggingId, targetId);
    if (nextIds.join(',') !== currentIds.join(',')) {
      reorderMut.mutate(nextIds);
    }
    setDraggingId(null);
  };

  return (
    <Stack gap="xs">
      <Group justify="space-between">
        <Stack gap={0}>
          <Text fw={500}>Responsibilities</Text>
          <Text c="dimmed" size="xs">
            Drag items to reorder. Click to edit.
          </Text>
        </Stack>
        <Button size="xs" leftSection={<IconPlus size={14} />} onClick={() => setExpandedId('new')}>
          Add
        </Button>
      </Group>

      {orderedItems.map((item) => {
        const isExpanded = expandedId === item.id;
        return (
          <div
            key={item.id}
            draggable
            onDragStart={() => setDraggingId(item.id)}
            onDragOver={(e) => e.preventDefault()}
            onDrop={() => handleDrop(item.id)}
            onDragEnd={() => setDraggingId(null)}
            style={{
              opacity: draggingId === item.id ? 0.6 : 1,
              outline: draggingId && draggingId !== item.id ? '1px dashed var(--mantine-color-gray-4)' : undefined,
              borderRadius: 4,
            }}
          >
            <Group
              gap="xs"
              wrap="nowrap"
              style={{ cursor: 'pointer', padding: '4px 0' }}
              onClick={() => setExpandedId(isExpanded ? null : item.id)}
            >
              <IconGripVertical size={14} color="var(--mantine-color-gray-5)" style={{ flexShrink: 0, cursor: 'grab' }} />
              <Text size="sm" style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: isExpanded ? 'normal' : 'nowrap' }}>
                {item.description}
              </Text>
              <ActionIcon
                size="sm"
                variant="subtle"
                color="red"
                onClick={(e) => { e.stopPropagation(); if (window.confirm('Are you sure you want to delete this responsibility?')) deleteMut.mutate(item.id); }}
                style={{ flexShrink: 0 }}
              >
                <IconTrash size={14} />
              </ActionIcon>
            </Group>
            {isExpanded && (
              <ResponsibilityInlineForm
                initial={item}
                onSave={(values) => updateMut.mutate({ ...values, id: item.id })}
                onCancel={() => setExpandedId(null)}
                loading={updateMut.isPending}
              />
            )}
          </div>
        );
      })}
      {orderedItems.length === 0 && expandedId !== 'new' && <Text c="dimmed" size="sm">No responsibilities yet.</Text>}

      {expandedId === 'new' && (
        <ResponsibilityInlineForm
          onSave={(values) => createMut.mutate(values)}
          onCancel={() => setExpandedId(null)}
          loading={createMut.isPending}
        />
      )}
    </Stack>
  );
}

// ---- Skills Tab ----
function SkillsTab({ roleId }: { roleId: number }) {
  const qc = useQueryClient();
  const [newSkillName, setNewSkillName] = useState('');

  const { data: allSkills } = useQuery<Skill[]>({
    queryKey: ['skills'],
    queryFn: () => api.get('/skills').then((r) => r.data),
  });

  const { data: roleSkills } = useQuery<RoleSkill[]>({
    queryKey: ['roleSkills', roleId],
    queryFn: () => api.get(`/roles/${roleId}/skills`).then((r) => r.data),
  });

  const createSkillMut = useMutation({
    mutationFn: (data: { name: string; skill_type: string }) => api.post('/skills', data).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['skills'] }),
  });

  const addRoleSkillMut = useMutation({
    mutationFn: (data: { skill_id: number; proficiency?: string }) => api.post(`/roles/${roleId}/skills`, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['roleSkills', roleId] }),
  });

  const removeRoleSkillMut = useMutation({
    mutationFn: (skillId: number) => api.delete(`/roles/${roleId}/skills/${skillId}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['roleSkills', roleId] }),
  });

  const assignedIds = new Set(roleSkills?.map((rs) => rs.skill_id) || []);
  const available = allSkills?.filter((skill) => !assignedIds.has(skill.id)) || [];

  return (
    <Stack>
      <Text fw={500}>Assigned Skills</Text>
      <Group>
        {roleSkills?.map((rs) => (
          <Badge
            key={rs.id}
            rightSection={
              <ActionIcon size="xs" variant="transparent" onClick={() => { if (window.confirm('Remove this skill?')) removeRoleSkillMut.mutate(rs.skill_id); }}>
                <IconTrash size={12} />
              </ActionIcon>
            }
          >
            {rs.skill_name}
          </Badge>
        ))}
        {roleSkills?.length === 0 && <Text c="dimmed" size="sm">No skills assigned.</Text>}
      </Group>

      <Text fw={500} mt="md">Add Existing Skill</Text>
      <Group>
        <Select
          placeholder="Select skill"
          data={available.map((skill) => ({ value: String(skill.id), label: skill.name }))}
          onChange={(value) => value && addRoleSkillMut.mutate({ skill_id: Number(value) })}
          searchable
          clearable
        />
      </Group>

      <Text fw={500} mt="md">Create New Skill</Text>
      <Group>
        <TextInput
          placeholder="Skill name"
          value={newSkillName}
          onChange={(event) => setNewSkillName(event.target.value)}
        />
        <Button
          size="xs"
          onClick={() => {
            if (newSkillName.trim()) {
              createSkillMut.mutate(
                { name: newSkillName.trim(), skill_type: 'technical' },
                {
                  onSuccess: (skill: Skill) => {
                    addRoleSkillMut.mutate({ skill_id: skill.id });
                    setNewSkillName('');
                  },
                }
              );
            }
          }}
        >
          Create & Add
        </Button>
      </Group>
    </Stack>
  );
}

// ---- Awards Tab ----
function AwardsTab({ roleId }: { roleId: number }) {
  const qc = useQueryClient();
  const [addOpen, setAddOpen] = useState(false);
  const [editItem, setEditItem] = useState<Award | null>(null);

  const { data: items } = useQuery<Award[]>({
    queryKey: ['awards', roleId],
    queryFn: () => api.get(`/roles/${roleId}/awards`).then((r) => r.data),
  });

  const createMut = useMutation({
    mutationFn: (data: Partial<Award>) => api.post(`/roles/${roleId}/awards`, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['awards', roleId] });
      setAddOpen(false);
    },
  });

  const updateMut = useMutation({
    mutationFn: (data: Partial<Award> & { id: number }) => api.put(`/awards/${data.id}`, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['awards', roleId] });
      setEditItem(null);
    },
  });

  const deleteMut = useMutation({
    mutationFn: (id: number) => api.delete(`/awards/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['awards', roleId] }),
  });

  return (
    <Stack>
      <Group justify="space-between">
        <Text fw={500}>Awards</Text>
        <Button size="xs" leftSection={<IconPlus size={14} />} onClick={() => setAddOpen(true)}>Add</Button>
      </Group>
      {items?.map((item) => (
        <Card key={item.id} shadow="xs" padding="sm" withBorder>
          <Group justify="space-between">
            <div>
              <Text fw={500}>{item.title}</Text>
              {item.issuer && <Text size="sm" c="dimmed">{item.issuer}</Text>}
              {item.resume_relevant && <Badge size="xs" color="green">Resume</Badge>}
            </div>
            <Group gap="xs">
              <ActionIcon size="sm" variant="subtle" onClick={() => setEditItem(item)}>
                <IconEdit size={14} />
              </ActionIcon>
              <ActionIcon size="sm" color="red" variant="subtle" onClick={() => { if (window.confirm('Are you sure you want to delete this award?')) deleteMut.mutate(item.id); }}>
                <IconTrash size={14} />
              </ActionIcon>
            </Group>
          </Group>
          {item.description && <Text size="sm">{item.description}</Text>}
        </Card>
      ))}
      {items?.length === 0 && <Text c="dimmed" size="sm">No awards yet.</Text>}

      <Modal opened={addOpen} onClose={() => setAddOpen(false)} title="Add Award">
        <AwardForm onSubmit={(values) => createMut.mutate(values)} loading={createMut.isPending} />
      </Modal>
      <Modal opened={!!editItem} onClose={() => setEditItem(null)} title="Edit Award">
        {editItem && (
          <AwardForm
            initial={editItem}
            onSubmit={(values) => updateMut.mutate({ ...values, id: editItem.id })}
            loading={updateMut.isPending}
          />
        )}
      </Modal>
    </Stack>
  );
}

function AwardForm({
  initial,
  onSubmit,
  loading,
}: {
  initial?: Award;
  onSubmit: (values: Partial<Award>) => void;
  loading: boolean;
}) {
  const form = useForm({
    initialValues: {
      title: initial?.title || '',
      description: initial?.description || '',
      date: initial?.date || '',
      issuer: initial?.issuer || '',
      resume_relevant: initial?.resume_relevant || false,
    },
  });
  return (
    <form
      onSubmit={form.onSubmit((values) =>
        onSubmit({
          ...values,
          date: normalizeDate(values.date),
        })
      )}
    >
      <Stack>
        <TextInput label="Title" required {...form.getInputProps('title')} />
        <TextInput label="Description" {...form.getInputProps('description')} />
        <TextInput label="Date" type="date" {...form.getInputProps('date')} />
        <TextInput label="Issuer" {...form.getInputProps('issuer')} />
        <Switch label="Resume Relevant" {...form.getInputProps('resume_relevant', { type: 'checkbox' })} />
        <Button type="submit" loading={loading}>Save</Button>
      </Stack>
    </form>
  );
}

// ---- Presentations Tab ----
function PresentationsTab({ roleId }: { roleId: number }) {
  const qc = useQueryClient();
  const [addOpen, setAddOpen] = useState(false);
  const [editItem, setEditItem] = useState<Presentation | null>(null);

  const { data: items } = useQuery<Presentation[]>({
    queryKey: ['presentations', roleId],
    queryFn: () => api.get(`/roles/${roleId}/presentations`).then((r) => r.data),
  });

  const createMut = useMutation({
    mutationFn: (data: Partial<Presentation>) => api.post(`/roles/${roleId}/presentations`, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['presentations', roleId] });
      setAddOpen(false);
    },
  });

  const updateMut = useMutation({
    mutationFn: (data: Partial<Presentation> & { id: number }) => api.put(`/presentations/${data.id}`, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['presentations', roleId] });
      setEditItem(null);
    },
  });

  const deleteMut = useMutation({
    mutationFn: (id: number) => api.delete(`/presentations/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['presentations', roleId] }),
  });

  return (
    <Stack>
      <Group justify="space-between">
        <Text fw={500}>Presentations</Text>
        <Button size="xs" leftSection={<IconPlus size={14} />} onClick={() => setAddOpen(true)}>Add</Button>
      </Group>
      {items?.map((item) => (
        <Card key={item.id} shadow="xs" padding="sm" withBorder>
          <Group justify="space-between">
            <div>
              <Text fw={500}>{item.title}</Text>
              {item.venue && <Text size="sm" c="dimmed">{item.venue}</Text>}
              {item.resume_relevant && <Badge size="xs" color="green">Resume</Badge>}
            </div>
            <Group gap="xs">
              <ActionIcon size="sm" variant="subtle" onClick={() => setEditItem(item)}>
                <IconEdit size={14} />
              </ActionIcon>
              <ActionIcon size="sm" color="red" variant="subtle" onClick={() => { if (window.confirm('Are you sure you want to delete this presentation?')) deleteMut.mutate(item.id); }}>
                <IconTrash size={14} />
              </ActionIcon>
            </Group>
          </Group>
        </Card>
      ))}
      {items?.length === 0 && <Text c="dimmed" size="sm">No presentations yet.</Text>}

      <Modal opened={addOpen} onClose={() => setAddOpen(false)} title="Add Presentation">
        <PresentationForm onSubmit={(values) => createMut.mutate(values)} loading={createMut.isPending} />
      </Modal>
      <Modal opened={!!editItem} onClose={() => setEditItem(null)} title="Edit Presentation">
        {editItem && (
          <PresentationForm
            initial={editItem}
            onSubmit={(values) => updateMut.mutate({ ...values, id: editItem.id })}
            loading={updateMut.isPending}
          />
        )}
      </Modal>
    </Stack>
  );
}

function PresentationForm({
  initial,
  onSubmit,
  loading,
}: {
  initial?: Presentation;
  onSubmit: (values: Partial<Presentation>) => void;
  loading: boolean;
}) {
  const form = useForm({
    initialValues: {
      title: initial?.title || '',
      venue: initial?.venue || '',
      date: initial?.date || '',
      audience: initial?.audience || '',
      resume_relevant: initial?.resume_relevant || false,
    },
  });
  return (
    <form
      onSubmit={form.onSubmit((values) =>
        onSubmit({
          ...values,
          date: normalizeDate(values.date),
        })
      )}
    >
      <Stack>
        <TextInput label="Title" required {...form.getInputProps('title')} />
        <TextInput label="Venue" {...form.getInputProps('venue')} />
        <TextInput label="Date" type="date" {...form.getInputProps('date')} />
        <TextInput label="Audience" {...form.getInputProps('audience')} />
        <Switch label="Resume Relevant" {...form.getInputProps('resume_relevant', { type: 'checkbox' })} />
        <Button type="submit" loading={loading}>Save</Button>
      </Stack>
    </form>
  );
}

// ---- Team Structure Tab ----
function TeamTab({ roleId }: { roleId: number }) {
  const qc = useQueryClient();
  const { data: ts } = useQuery<TeamStructure | null>({
    queryKey: ['teamStructure', roleId],
    queryFn: () => api.get(`/roles/${roleId}/team-structure`).then((r) => r.data),
  });

  const form = useForm({
    initialValues: {
      direct_reports: ts?.direct_reports || 0,
      team_size: ts?.team_size || 0,
      responsibilities: ts?.responsibilities || '',
    },
  });

  if (ts && form.values.direct_reports === 0 && ts.direct_reports !== 0) {
    form.setValues({
      direct_reports: ts.direct_reports,
      team_size: ts.team_size,
      responsibilities: ts.responsibilities || '',
    });
  }

  const upsertMut = useMutation({
    mutationFn: (data: Partial<TeamStructure>) => api.put(`/roles/${roleId}/team-structure`, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['teamStructure', roleId] });
      notifications.show({ message: 'Team structure saved', color: 'green' });
    },
  });

  return (
    <form onSubmit={form.onSubmit((values) => upsertMut.mutate(values))}>
      <Stack>
        <NumberInput label="Direct Reports" {...form.getInputProps('direct_reports')} />
        <NumberInput label="Team Size" {...form.getInputProps('team_size')} />
        <Textarea label="Responsibilities" autosize minRows={3} {...form.getInputProps('responsibilities')} />
        <Button type="submit" loading={upsertMut.isPending}>Save</Button>
      </Stack>
    </form>
  );
}

// ---- Org Position Tab ----
function OrgTab({ roleId }: { roleId: number }) {
  const qc = useQueryClient();
  const { data: op } = useQuery<OrgPosition | null>({
    queryKey: ['orgPosition', roleId],
    queryFn: () => api.get(`/roles/${roleId}/org-position`).then((r) => r.data),
  });

  const form = useForm({
    initialValues: {
      reports_to: op?.reports_to || '',
      department: op?.department || '',
      org_level: op?.org_level || '',
    },
  });

  if (op && !form.values.reports_to && op.reports_to) {
    form.setValues({
      reports_to: op.reports_to || '',
      department: op.department || '',
      org_level: op.org_level || '',
    });
  }

  const upsertMut = useMutation({
    mutationFn: (data: Partial<OrgPosition>) => api.put(`/roles/${roleId}/org-position`, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['orgPosition', roleId] });
      notifications.show({ message: 'Org position saved', color: 'green' });
    },
  });

  return (
    <form onSubmit={form.onSubmit((values) => upsertMut.mutate(values))}>
      <Stack>
        <TextInput label="Reports To" {...form.getInputProps('reports_to')} />
        <TextInput label="Department" {...form.getInputProps('department')} />
        <TextInput label="Org Level" {...form.getInputProps('org_level')} />
        <Button type="submit" loading={upsertMut.isPending}>Save</Button>
      </Stack>
    </form>
  );
}

// ---- Knowledge Tab ----
function KnowledgeTab({ roleId }: { roleId: number }) {
  const qc = useQueryClient();
  const [addOpen, setAddOpen] = useState(false);
  const [editItem, setEditItem] = useState<KnowledgeEntry | null>(null);

  const { data: items } = useQuery<KnowledgeEntry[]>({
    queryKey: ['knowledge', roleId],
    queryFn: () => api.get(`/knowledge?role_id=${roleId}`).then((r) => r.data),
  });

  const createMut = useMutation({
    mutationFn: (data: Partial<KnowledgeEntry>) => api.post('/knowledge', { ...data, role_id: roleId }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['knowledge', roleId] });
      setAddOpen(false);
    },
  });

  const updateMut = useMutation({
    mutationFn: (data: Partial<KnowledgeEntry> & { id: number }) => api.put(`/knowledge/${data.id}`, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['knowledge', roleId] });
      setEditItem(null);
    },
  });

  const deleteMut = useMutation({
    mutationFn: (id: number) => api.delete(`/knowledge/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['knowledge', roleId] }),
  });

  return (
    <Stack>
      <Group justify="space-between">
        <Text fw={500}>Knowledge Notes</Text>
        <Button size="xs" leftSection={<IconPlus size={14} />} onClick={() => setAddOpen(true)}>Add</Button>
      </Group>
      {items?.map((item) => (
        <Card key={item.id} shadow="xs" padding="sm" withBorder>
          <Group justify="space-between">
            <Text fw={500}>{item.title}</Text>
            <Group gap="xs">
              <ActionIcon size="sm" variant="subtle" onClick={() => setEditItem(item)}>
                <IconEdit size={14} />
              </ActionIcon>
              <ActionIcon size="sm" color="red" variant="subtle" onClick={() => { if (window.confirm('Are you sure you want to delete this note?')) deleteMut.mutate(item.id); }}>
                <IconTrash size={14} />
              </ActionIcon>
            </Group>
          </Group>
          {item.content && <Text size="sm">{item.content}</Text>}
        </Card>
      ))}
      {items?.length === 0 && <Text c="dimmed" size="sm">No notes yet.</Text>}

      <Modal opened={addOpen} onClose={() => setAddOpen(false)} title="Add Note">
        <KnowledgeForm onSubmit={(values) => createMut.mutate(values)} loading={createMut.isPending} />
      </Modal>
      <Modal opened={!!editItem} onClose={() => setEditItem(null)} title="Edit Note">
        {editItem && (
          <KnowledgeForm
            initial={editItem}
            onSubmit={(values) => updateMut.mutate({ ...values, id: editItem.id, role_id: roleId })}
            loading={updateMut.isPending}
          />
        )}
      </Modal>
    </Stack>
  );
}

function KnowledgeForm({
  initial,
  onSubmit,
  loading,
}: {
  initial?: KnowledgeEntry;
  onSubmit: (values: Partial<KnowledgeEntry>) => void;
  loading: boolean;
}) {
  const form = useForm({
    initialValues: {
      title: initial?.title || '',
      content: initial?.content || '',
    },
  });
  return (
    <form onSubmit={form.onSubmit(onSubmit)}>
      <Stack>
        <TextInput label="Title" required {...form.getInputProps('title')} />
        <Textarea label="Content" autosize minRows={4} {...form.getInputProps('content')} />
        <Button type="submit" loading={loading}>Save</Button>
      </Stack>
    </form>
  );
}

// ---- Overview Tab ----
function OverviewTab({ roleId, role }: { roleId: number; role: Role }) {
  const { data: accomplishments } = useQuery<Accomplishment[]>({
    queryKey: ['accomplishments', roleId],
    queryFn: () => api.get(`/roles/${roleId}/accomplishments`).then((r) => r.data),
  });
  const { data: responsibilities } = useQuery<Responsibility[]>({
    queryKey: ['responsibilities', roleId],
    queryFn: () => api.get(`/roles/${roleId}/responsibilities`).then((r) => r.data),
  });
  const { data: roleSkills } = useQuery<RoleSkill[]>({
    queryKey: ['roleSkills', roleId],
    queryFn: () => api.get(`/roles/${roleId}/skills`).then((r) => r.data),
  });
  const { data: awards } = useQuery<Award[]>({
    queryKey: ['awards', roleId],
    queryFn: () => api.get(`/roles/${roleId}/awards`).then((r) => r.data),
  });
  const { data: presentations } = useQuery<Presentation[]>({
    queryKey: ['presentations', roleId],
    queryFn: () => api.get(`/roles/${roleId}/presentations`).then((r) => r.data),
  });
  const { data: teamStructure } = useQuery<TeamStructure | null>({
    queryKey: ['teamStructure', roleId],
    queryFn: () => api.get(`/roles/${roleId}/team-structure`).then((r) => r.data),
  });
  const { data: orgPosition } = useQuery<OrgPosition | null>({
    queryKey: ['orgPosition', roleId],
    queryFn: () => api.get(`/roles/${roleId}/org-position`).then((r) => r.data),
  });
  const { data: knowledge } = useQuery<KnowledgeEntry[]>({
    queryKey: ['knowledge', roleId],
    queryFn: () => api.get(`/knowledge?role_id=${roleId}`).then((r) => r.data),
  });

  const sortedAccomplishments = useMemo(
    () =>
      [...(accomplishments || [])]
        .map((item) => ({
          ...item,
          category: normalizeAccomplishmentCategory(item.category) as Accomplishment['category'],
        }))
        .sort((a, b) => a.sort_order - b.sort_order),
    [accomplishments]
  );
  const sortedResponsibilities = useMemo(
    () => [...(responsibilities || [])].sort((a, b) => a.sort_order - b.sort_order),
    [responsibilities]
  );

  const resumeBullets = sortedAccomplishments.filter((a) => a.category === 'resume_bullet');
  const supportingDetails = sortedAccomplishments.filter((a) => a.category === 'supporting_detail');
  const knowledgeBase = sortedAccomplishments.filter((a) => a.category === 'knowledge_base');

  const hasTeamInfo = teamStructure && (teamStructure.direct_reports || teamStructure.team_size || teamStructure.responsibilities);
  const hasOrgInfo = orgPosition && (orgPosition.reports_to || orgPosition.department || orgPosition.org_level);

  const isEmpty =
    !role.summary &&
    !hasTeamInfo &&
    !hasOrgInfo &&
    sortedResponsibilities.length === 0 &&
    sortedAccomplishments.length === 0 &&
    (!roleSkills || roleSkills.length === 0) &&
    (!awards || awards.length === 0) &&
    (!presentations || presentations.length === 0) &&
    (!knowledge || knowledge.length === 0);

  if (isEmpty) {
    return <Text c="dimmed" size="sm">No data yet. Use the other tabs to add content.</Text>;
  }

  return (
    <Stack gap="lg">
      {role.summary && (
        <div>
          <Text fw={600} size="sm" c="dimmed" tt="uppercase" mb={6}>Summary</Text>
          <Text size="sm">{role.summary}</Text>
        </div>
      )}

      {(hasTeamInfo || hasOrgInfo) && (
        <>
          <Divider label="Context" labelPosition="left" />
          <Group gap="xl" align="flex-start">
            {hasTeamInfo && (
              <Stack gap={4}>
                {!!teamStructure.direct_reports && (
                  <Text size="sm"><Text span fw={600}>Direct Reports:</Text> {teamStructure.direct_reports}</Text>
                )}
                {!!teamStructure.team_size && (
                  <Text size="sm"><Text span fw={600}>Team Size:</Text> {teamStructure.team_size}</Text>
                )}
                {teamStructure.responsibilities && (
                  <Text size="sm" c="dimmed">{teamStructure.responsibilities}</Text>
                )}
              </Stack>
            )}
            {hasOrgInfo && (
              <Stack gap={4}>
                {orgPosition.reports_to && (
                  <Text size="sm"><Text span fw={600}>Reports To:</Text> {orgPosition.reports_to}</Text>
                )}
                {orgPosition.department && (
                  <Text size="sm"><Text span fw={600}>Department:</Text> {orgPosition.department}</Text>
                )}
                {orgPosition.org_level && (
                  <Text size="sm"><Text span fw={600}>Org Level:</Text> {orgPosition.org_level}</Text>
                )}
              </Stack>
            )}
          </Group>
        </>
      )}

      {sortedResponsibilities.length > 0 && (
        <>
          <Divider label="Responsibilities" labelPosition="left" />
          <Stack gap={4}>
            {sortedResponsibilities.map((r) => (
              <Text key={r.id} size="sm">• {r.description}</Text>
            ))}
          </Stack>
        </>
      )}

      {resumeBullets.length > 0 && (
        <>
          <Divider label="Key Accomplishments" labelPosition="left" />
          <Stack gap="sm">
            {resumeBullets.map((a) => (
              <div key={a.id}>
                <Text size="sm">• {a.description}</Text>
                {a.tech_stack && <Text size="xs" c="dimmed" ml="md">Tech: {a.tech_stack}</Text>}
                {a.key_result && <Text size="xs" c="blue" ml="md">Result: {a.key_result}</Text>}
              </div>
            ))}
          </Stack>
        </>
      )}

      {supportingDetails.length > 0 && (
        <>
          <Divider label="Supporting Details" labelPosition="left" />
          <Stack gap="sm">
            {supportingDetails.map((a) => (
              <div key={a.id}>
                <Text size="sm">• {a.description}</Text>
                {a.tech_stack && <Text size="xs" c="dimmed" ml="md">Tech: {a.tech_stack}</Text>}
                {a.key_result && <Text size="xs" c="blue" ml="md">Result: {a.key_result}</Text>}
              </div>
            ))}
          </Stack>
        </>
      )}

      {knowledgeBase.length > 0 && (
        <>
          <Divider label="Knowledge Base" labelPosition="left" />
          <Stack gap="sm">
            {knowledgeBase.map((a) => (
              <div key={a.id}>
                <Text size="sm">• {a.description}</Text>
                {a.tech_stack && <Text size="xs" c="dimmed" ml="md">Tech: {a.tech_stack}</Text>}
                {a.key_result && <Text size="xs" c="blue" ml="md">Result: {a.key_result}</Text>}
              </div>
            ))}
          </Stack>
        </>
      )}

      {roleSkills && roleSkills.length > 0 && (
        <>
          <Divider label="Skills" labelPosition="left" />
          <Group gap="xs">
            {roleSkills.map((rs) => (
              <Badge key={rs.id} variant="light">{rs.skill_name}</Badge>
            ))}
          </Group>
        </>
      )}

      {awards && awards.length > 0 && (
        <>
          <Divider label="Awards" labelPosition="left" />
          <Stack gap="xs">
            {awards.map((award) => (
              <div key={award.id}>
                <Group gap="xs">
                  <Text size="sm" fw={500}>{award.title}</Text>
                  {award.resume_relevant && <Badge size="xs" color="green">Resume</Badge>}
                </Group>
                {(award.issuer || award.date) && (
                  <Text size="xs" c="dimmed">
                    {[award.issuer, award.date].filter(Boolean).join(' — ')}
                  </Text>
                )}
                {award.description && <Text size="xs">{award.description}</Text>}
              </div>
            ))}
          </Stack>
        </>
      )}

      {presentations && presentations.length > 0 && (
        <>
          <Divider label="Presentations" labelPosition="left" />
          <Stack gap="xs">
            {presentations.map((pres) => (
              <div key={pres.id}>
                <Group gap="xs">
                  <Text size="sm" fw={500}>{pres.title}</Text>
                  {pres.resume_relevant && <Badge size="xs" color="green">Resume</Badge>}
                </Group>
                {(pres.venue || pres.date || pres.audience) && (
                  <Text size="xs" c="dimmed">
                    {[pres.venue, pres.date, pres.audience ? `Audience: ${pres.audience}` : ''].filter(Boolean).join(' — ')}
                  </Text>
                )}
              </div>
            ))}
          </Stack>
        </>
      )}

      {knowledge && knowledge.length > 0 && (
        <>
          <Divider label="Notes" labelPosition="left" />
          <Stack gap="sm">
            {knowledge.map((note) => (
              <div key={note.id}>
                <Text size="sm" fw={500}>{note.title}</Text>
                {note.content && <Text size="sm" c="dimmed">{note.content}</Text>}
              </div>
            ))}
          </Stack>
        </>
      )}
    </Stack>
  );
}

// ---- Main Page ----
export default function RoleDetailPage() {
  const qc = useQueryClient();
  const { companyId, roleId } = useParams();
  const navigate = useNavigate();
  const rid = Number(roleId);
  const parsedCompanyId = Number(companyId);
  const [editRoleOpen, setEditRoleOpen] = useState(false);

  const { data: role } = useQuery<Role>({
    queryKey: ['role', rid],
    queryFn: () => api.get(`/roles/${rid}`).then((r) => r.data),
    enabled: !!rid,
  });

  const { data: company } = useQuery<Company>({
    queryKey: ['company', parsedCompanyId],
    queryFn: () => api.get(`/companies/${companyId}`).then((r) => r.data),
    enabled: !!companyId,
  });

  const updateRoleMut = useMutation({
    mutationFn: (data: Partial<Role> & { id: number }) => api.put(`/roles/${data.id}`, data).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['role', rid] });
      qc.invalidateQueries({ queryKey: ['roles', parsedCompanyId] });
      setEditRoleOpen(false);
      notifications.show({ message: 'Role updated', color: 'green' });
    },
  });

  const deleteRoleMut = useMutation({
    mutationFn: () => api.delete(`/roles/${rid}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['roles', parsedCompanyId] });
      notifications.show({ message: 'Role deleted', color: 'red' });
      navigate('/companies');
    },
  });

  return (
    <Stack>
      <Breadcrumbs>
        <Anchor onClick={() => navigate('/companies')}>Companies</Anchor>
        <Anchor onClick={() => navigate('/companies')}>{company?.name || '...'}</Anchor>
        <Text>{role?.title || '...'}</Text>
      </Breadcrumbs>

      <Group justify="space-between">
        <div>
          <Title order={2}>{role?.title}{role?.level ? ` (${role.level})` : ''}</Title>
          {role?.start_date && (
            <Text c="dimmed">
              {role.start_date} — {role.end_date || 'Present'}
              {role.city && role.state && ` | ${role.city}, ${role.state}`}
              {role.is_remote && ' (Remote)'}
            </Text>
          )}
        </div>
        <Group gap="xs">
          <Button
            variant="light"
            leftSection={<IconEdit size={14} />}
            onClick={() => setEditRoleOpen(true)}
            disabled={!role}
          >
            Edit Role
          </Button>
          <Button
            color="red"
            variant="light"
            leftSection={<IconTrash size={14} />}
            onClick={() => { if (window.confirm('Are you sure you want to delete this role? This will also delete all associated data.')) deleteRoleMut.mutate(); }}
            loading={deleteRoleMut.isPending}
            disabled={!role}
          >
            Delete Role
          </Button>
        </Group>
      </Group>

      <Tabs defaultValue="overview">
        <Tabs.List>
          <Tabs.Tab value="overview">Overview</Tabs.Tab>
          <Tabs.Tab value="accomplishments">Accomplishments</Tabs.Tab>
          <Tabs.Tab value="responsibilities">Responsibilities</Tabs.Tab>
          <Tabs.Tab value="skills">Skills</Tabs.Tab>
          <Tabs.Tab value="awards">Awards</Tabs.Tab>
          <Tabs.Tab value="presentations">Presentations</Tabs.Tab>
          <Tabs.Tab value="team">Team</Tabs.Tab>
          <Tabs.Tab value="org">Org</Tabs.Tab>
          <Tabs.Tab value="notes">Notes</Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value="overview" pt="md">
          {role && <OverviewTab roleId={rid} role={role} />}
        </Tabs.Panel>
        <Tabs.Panel value="accomplishments" pt="md"><AccomplishmentsTab roleId={rid} /></Tabs.Panel>
        <Tabs.Panel value="responsibilities" pt="md"><ResponsibilitiesTab roleId={rid} /></Tabs.Panel>
        <Tabs.Panel value="skills" pt="md"><SkillsTab roleId={rid} /></Tabs.Panel>
        <Tabs.Panel value="awards" pt="md"><AwardsTab roleId={rid} /></Tabs.Panel>
        <Tabs.Panel value="presentations" pt="md"><PresentationsTab roleId={rid} /></Tabs.Panel>
        <Tabs.Panel value="team" pt="md"><TeamTab roleId={rid} /></Tabs.Panel>
        <Tabs.Panel value="org" pt="md"><OrgTab roleId={rid} /></Tabs.Panel>
        <Tabs.Panel value="notes" pt="md"><KnowledgeTab roleId={rid} /></Tabs.Panel>
      </Tabs>

      <Modal opened={editRoleOpen} onClose={() => setEditRoleOpen(false)} title="Edit Role">
        {role && (
          <RoleForm
            initial={role}
            onSubmit={(values) => updateRoleMut.mutate({ ...values, id: role.id })}
            loading={updateRoleMut.isPending}
          />
        )}
      </Modal>
    </Stack>
  );
}
