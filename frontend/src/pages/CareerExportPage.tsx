import { useState, useEffect, useRef } from 'react';
import {
  Stack, Title, Text, Checkbox, Button, Group, Code, Alert, Badge,
} from '@mantine/core';
import { useQuery, useMutation } from '@tanstack/react-query';
import { IconCheck, IconCopy, IconRefresh } from '@tabler/icons-react';
import { CopyButton } from '@mantine/core';
import api from '../api/client';

interface Role {
  id: number;
  title: string;
  company_name: string | null;
  start_date: string | null;
  end_date: string | null;
}

function formatDateRange(start: string | null, end: string | null): string {
  const fmt = (d: string) => new Date(d + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
  return `${start ? fmt(start) : '?'} – ${end ? fmt(end) : 'Present'}`;
}

export default function CareerExportPage() {
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [includeSupporting, setIncludeSupporting] = useState(true);
  const [includeAwards, setIncludeAwards] = useState(true);
  const [includePresentations, setIncludePresentations] = useState(true);
  const [includeResponsibilities, setIncludeResponsibilities] = useState(true);
  const [content, setContent] = useState<string | null>(null);
  const autoTriggered = useRef(false);

  const rolesQuery = useQuery({
    queryKey: ['all-roles'],
    queryFn: () => api.get('/roles').then((r) => r.data as Role[]),
  });

  const exportMut = useMutation({
    mutationFn: (ids: Set<number>) =>
      api.post('/workflow/export-document', {
        role_ids: Array.from(ids),
        include_supporting: includeSupporting,
        include_awards: includeAwards,
        include_presentations: includePresentations,
        include_responsibilities: includeResponsibilities,
      }).then((r) => r.data as { content: string }),
    onSuccess: (data) => setContent(data.content),
  });

  // Pre-select top 5 and auto-trigger on first load
  useEffect(() => {
    if (rolesQuery.data && !autoTriggered.current) {
      autoTriggered.current = true;
      const top5 = new Set(rolesQuery.data.slice(0, 5).map((r) => r.id));
      setSelectedIds(top5);
      exportMut.mutate(top5);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rolesQuery.data]);

  const toggleRole = (id: number) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectedRoles = rolesQuery.data?.filter((r) => selectedIds.has(r.id)) ?? [];

  return (
    <Stack>
      <Title order={2}>Career Export</Title>
      <Text c="dimmed" size="sm">
        Markdown export of selected roles — ready to paste into an AI chat.
      </Text>

      <Group align="flex-start" gap="xl">
        <Stack gap="xs">
          <Text fw={500} size="sm">Roles to include:</Text>
          {rolesQuery.isLoading && <Text size="sm" c="dimmed">Loading roles…</Text>}
          {rolesQuery.data?.map((role) => (
            <Checkbox
              key={role.id}
              checked={selectedIds.has(role.id)}
              onChange={() => toggleRole(role.id)}
              label={
                <Stack gap={0}>
                  <Text size="sm" fw={500}>{role.title}</Text>
                  <Text size="xs" c="dimmed">
                    {role.company_name && `${role.company_name} · `}
                    {formatDateRange(role.start_date, role.end_date)}
                  </Text>
                </Stack>
              }
            />
          ))}
        </Stack>

        <Stack gap="xs">
          <Text fw={500} size="sm">Include in export:</Text>
          <Checkbox label="Supporting details" checked={includeSupporting} onChange={(e) => setIncludeSupporting(e.currentTarget.checked)} />
          <Checkbox label="Awards" checked={includeAwards} onChange={(e) => setIncludeAwards(e.currentTarget.checked)} />
          <Checkbox label="Presentations" checked={includePresentations} onChange={(e) => setIncludePresentations(e.currentTarget.checked)} />
          <Checkbox label="Responsibilities" checked={includeResponsibilities} onChange={(e) => setIncludeResponsibilities(e.currentTarget.checked)} />
        </Stack>
      </Group>

      {selectedRoles.length > 0 && (
        <Group gap="xs" wrap="wrap">
          <Text size="sm" fw={500}>Selected:</Text>
          {selectedRoles.map((r) => (
            <Badge key={r.id} variant="light" size="sm">{r.title}</Badge>
          ))}
        </Group>
      )}

      <Button
        leftSection={<IconRefresh size={14} />}
        variant="light"
        size="sm"
        onClick={() => exportMut.mutate(selectedIds)}
        loading={exportMut.isPending}
        disabled={selectedIds.size === 0}
        w="fit-content"
      >
        Regenerate
      </Button>

      {exportMut.isError && (
        <Alert color="red" title="Error">
          Failed to generate export. Make sure the server is running.
        </Alert>
      )}

      {content && (
        <Stack gap="xs">
          <Group justify="space-between">
            <Text fw={500} size="sm">
              Generated career data ({content.length.toLocaleString()} chars)
            </Text>
            <CopyButton value={content}>
              {({ copied, copy }) => (
                <Button
                  size="xs"
                  variant="light"
                  leftSection={copied ? <IconCheck size={14} /> : <IconCopy size={14} />}
                  color={copied ? 'teal' : 'blue'}
                  onClick={copy}
                >
                  {copied ? 'Copied!' : 'Copy to Clipboard'}
                </Button>
              )}
            </CopyButton>
          </Group>
          <Code block style={{ maxHeight: 600, overflow: 'auto', whiteSpace: 'pre-wrap', fontSize: 12 }}>
            {content}
          </Code>
        </Stack>
      )}
    </Stack>
  );
}
