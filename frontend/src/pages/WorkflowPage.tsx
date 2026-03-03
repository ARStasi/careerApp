import { useState } from 'react';
import {
  Stack, Title, Stepper, Button, Group, Checkbox, Text, Textarea,
  TextInput, Card, Code, Alert, CopyButton,
} from '@mantine/core';
import { useQuery, useMutation } from '@tanstack/react-query';
import { IconCheck, IconCopy, IconDownload, IconAlertCircle } from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';
import api from '../api/client';
import type { Company, Role } from '../types';

export default function WorkflowPage() {
  const [active, setActive] = useState(0);
  const [selectedRoleIds, setSelectedRoleIds] = useState<number[]>([]);
  const [includeSupporting, setIncludeSupporting] = useState(true);
  const [includeAwards, setIncludeAwards] = useState(true);
  const [includePresentations, setIncludePresentations] = useState(true);
  const [includeResponsibilities, setIncludeResponsibilities] = useState(true);
  const [exportDoc, setExportDoc] = useState('');
  const [instructions, setInstructions] = useState('');
  const [yamlContent, setYamlContent] = useState('');
  const [validationResult, setValidationResult] = useState<{
    valid: boolean;
    error?: string;
    errors?: string[];
  } | null>(null);
  const [companyName, setCompanyName] = useState('');
  const [savedOutputPath, setSavedOutputPath] = useState('');

  // Track Application state
  const [trackJobTitle, setTrackJobTitle] = useState('');
  const [trackReqUrl, setTrackReqUrl] = useState('');
  const [trackDateApplied, setTrackDateApplied] = useState(
    new Date().toISOString().slice(0, 10)
  );
  const [trackCoverLetter, setTrackCoverLetter] = useState(false);
  const [trackNotes, setTrackNotes] = useState('');

  // Fetch companies and their roles
  const { data: companies } = useQuery<Company[]>({
    queryKey: ['companies'],
    queryFn: () => api.get('/companies').then((r) => r.data),
  });

  // For each company, fetch roles
  const { data: allRoles } = useQuery<{ companyId: number; roles: Role[] }[]>({
    queryKey: ['allRoles', companies?.map((c) => c.id)],
    queryFn: async () => {
      if (!companies) return [];
      const results = await Promise.all(
        companies.map(async (c) => ({
          companyId: c.id,
          roles: (await api.get(`/companies/${c.id}/roles`)).data as Role[],
        }))
      );
      return results;
    },
    enabled: !!companies && companies.length > 0,
  });

  const instructionsMut = useMutation({
    mutationFn: () => api.get('/workflow/instructions').then((r) => r.data),
    onSuccess: (data) => setInstructions(data.content),
  });

  const exportMut = useMutation({
    mutationFn: () =>
      api.post('/workflow/export-document', {
        role_ids: selectedRoleIds,
        include_supporting: includeSupporting,
        include_awards: includeAwards,
        include_presentations: includePresentations,
        include_responsibilities: includeResponsibilities,
      }).then((r) => r.data),
    onSuccess: (data) => {
      setExportDoc(data.content);
      setActive(2);
    },
  });

  const validateMut = useMutation({
    mutationFn: () =>
      api.post('/workflow/validate-yaml', { yaml_content: yamlContent }).then((r) => r.data),
    onSuccess: (data) => setValidationResult(data),
  });

  const convertMut = useMutation({
    mutationFn: async () => {
      const response = await api.post(
        '/workflow/convert-yaml',
        { yaml_content: yamlContent, company_name: companyName },
        { responseType: 'blob' }
      );
      const outputPath = response.headers['x-resume-output-path'];
      setSavedOutputPath(outputPath || '');
      const contentDisposition = response.headers['content-disposition'];
      let filename = `Resume - ${companyName}.docx`;
      if (contentDisposition) {
        const match = contentDisposition.match(/filename="(.+)"/);
        if (match) filename = match[1];
      }
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    },
  });

  const trackMut = useMutation({
    mutationFn: () =>
      api.post('/job-applications', {
        company_name: companyName,
        job_title: trackJobTitle,
        req_url: trackReqUrl || null,
        date_applied: trackDateApplied,
        cover_letter_submitted: trackCoverLetter,
        notes: trackNotes || null,
      }).then((r) => r.data),
    onSuccess: () => {
      notifications.show({ message: 'Application tracked', color: 'green' });
      setActive(5);
    },
  });

  const toggleRole = (roleId: number) => {
    setSelectedRoleIds((prev) =>
      prev.includes(roleId) ? prev.filter((id) => id !== roleId) : [...prev, roleId]
    );
  };

  return (
    <Stack>
      <Title order={2}>Resume Workflow</Title>

      <Stepper active={active} onStepClick={setActive}>
        {/* Step 0: Instructions */}
        <Stepper.Step label="Instructions" description="Copy AI instructions">
          <Stack mt="md">
            <Alert icon={<IconAlertCircle size={16} />} title="Workflow" color="blue">
              1. Copy the instructions below and paste them into your AI chat.
              2. Next, you'll select roles and generate your career data to paste into the AI.
              3. The AI will ask for the job requisition - paste it.
              4. The AI will generate a YAML resume - copy it for the next step.
            </Alert>
            {!instructions && (
              <Button onClick={() => instructionsMut.mutate()} loading={instructionsMut.isPending}>
                Load Instructions
              </Button>
            )}
            {instructions && (
              <>
                <Group justify="space-between">
                  <Text fw={500}>AI Instructions</Text>
                  <CopyButton value={instructions}>
                    {({ copied, copy }) => (
                      <Button
                        size="xs"
                        variant="light"
                        leftSection={copied ? <IconCheck size={14} /> : <IconCopy size={14} />}
                        onClick={copy}
                      >
                        {copied ? 'Copied!' : 'Copy to Clipboard'}
                      </Button>
                    )}
                  </CopyButton>
                </Group>
                <Code block style={{ maxHeight: 500, overflow: 'auto', whiteSpace: 'pre-wrap' }}>
                  {instructions}
                </Code>
              </>
            )}
            <Button onClick={() => setActive(1)} disabled={!instructions}>
              Next: Select Career Data
            </Button>
          </Stack>
        </Stepper.Step>

        {/* Step 1: Select Data */}
        <Stepper.Step label="Select Data" description="Choose roles & options">
          <Stack mt="md">
            <Text fw={500}>Select roles to include in export:</Text>
            {companies?.map((company) => {
              const companyRoles = allRoles?.find((r) => r.companyId === company.id)?.roles || [];
              return (
                <Card key={company.id} shadow="xs" padding="sm" withBorder>
                  <Text fw={600} mb="xs">{company.name}</Text>
                  {companyRoles.map((role) => (
                    <Checkbox
                      key={role.id}
                      label={`${role.title} (${role.start_date || '?'} - ${role.end_date || 'Present'})`}
                      checked={selectedRoleIds.includes(role.id)}
                      onChange={() => toggleRole(role.id)}
                      mb="xs"
                    />
                  ))}
                  {companyRoles.length === 0 && <Text size="sm" c="dimmed">No roles</Text>}
                </Card>
              );
            })}
            {(!companies || companies.length === 0) && (
              <Text c="dimmed">No companies found. Add companies and roles first.</Text>
            )}

            <Text fw={500} mt="md">Export options:</Text>
            <Checkbox
              label="Include supporting details"
              checked={includeSupporting}
              onChange={(e) => setIncludeSupporting(e.currentTarget.checked)}
            />
            <Checkbox
              label="Include awards"
              checked={includeAwards}
              onChange={(e) => setIncludeAwards(e.currentTarget.checked)}
            />
            <Checkbox
              label="Include presentations"
              checked={includePresentations}
              onChange={(e) => setIncludePresentations(e.currentTarget.checked)}
            />
            <Checkbox
              label="Include responsibilities"
              checked={includeResponsibilities}
              onChange={(e) => setIncludeResponsibilities(e.currentTarget.checked)}
            />

            <Button
              onClick={() => exportMut.mutate()}
              loading={exportMut.isPending}
              disabled={selectedRoleIds.length === 0}
            >
              Generate Export Document
            </Button>
          </Stack>
        </Stepper.Step>

        {/* Step 2: Career Data Export */}
        <Stepper.Step label="Career Data" description="Copy career data">
          <Stack mt="md">
            <Group justify="space-between">
              <Text fw={500}>Generated Career Data</Text>
              <CopyButton value={exportDoc}>
                {({ copied, copy }) => (
                  <Button
                    size="xs"
                    variant="light"
                    leftSection={copied ? <IconCheck size={14} /> : <IconCopy size={14} />}
                    onClick={copy}
                  >
                    {copied ? 'Copied!' : 'Copy to Clipboard'}
                  </Button>
                )}
              </CopyButton>
            </Group>
            <Code block style={{ maxHeight: 500, overflow: 'auto', whiteSpace: 'pre-wrap' }}>
              {exportDoc}
            </Code>
            <Button onClick={() => setActive(3)}>
              Next: Paste YAML
            </Button>
          </Stack>
        </Stepper.Step>

        {/* Step 3: Paste YAML */}
        <Stepper.Step label="Paste YAML" description="Validate AI output">
          <Stack mt="md">
            <Text fw={500}>Paste the YAML resume from the AI:</Text>
            <Textarea
              value={yamlContent}
              onChange={(e) => {
                setYamlContent(e.target.value);
                setValidationResult(null);
              }}
              autosize
              minRows={10}
              maxRows={30}
              placeholder="Paste YAML here..."
              styles={{ input: { fontFamily: 'monospace' } }}
            />

            <Group>
              <Button variant="light" onClick={() => validateMut.mutate()} loading={validateMut.isPending}>
                Validate YAML
              </Button>
            </Group>

            {validationResult && (
              <Alert
                color={validationResult.valid ? 'green' : 'red'}
                title={validationResult.valid ? 'Valid YAML' : 'Validation Error'}
              >
                {validationResult.valid
                  ? 'YAML structure is valid and matches the expected schema.'
                  : validationResult.error || validationResult.errors?.join(', ')}
              </Alert>
            )}

            <Button onClick={() => setActive(4)} disabled={!yamlContent.trim()}>
              Next: Track Application
            </Button>
          </Stack>
        </Stepper.Step>

        {/* Step 4: Track Application */}
        <Stepper.Step label="Track" description="Log application">
          <Stack mt="md">
            <Text fw={500}>Track this job application (optional)</Text>
            <TextInput
              label="Company Name"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              required
            />
            <TextInput
              label="Job Title"
              placeholder="e.g. Senior Software Engineer"
              value={trackJobTitle}
              onChange={(e) => setTrackJobTitle(e.target.value)}
              required
            />
            <TextInput
              label="Requisition URL"
              placeholder="https://..."
              value={trackReqUrl}
              onChange={(e) => setTrackReqUrl(e.target.value)}
            />
            <TextInput
              label="Date Applied"
              type="date"
              value={trackDateApplied}
              onChange={(e) => setTrackDateApplied(e.target.value)}
              required
            />
            <Checkbox
              label="Cover letter submitted"
              checked={trackCoverLetter}
              onChange={(e) => setTrackCoverLetter(e.currentTarget.checked)}
            />
            <Textarea
              label="Notes"
              placeholder="Any notes about this application..."
              value={trackNotes}
              onChange={(e) => setTrackNotes(e.target.value)}
              autosize
              minRows={2}
            />
            <Group>
              <Button
                onClick={() => trackMut.mutate()}
                loading={trackMut.isPending}
                disabled={!companyName.trim() || !trackJobTitle.trim()}
              >
                Save & Continue
              </Button>
              <Button variant="subtle" onClick={() => setActive(5)}>
                Skip
              </Button>
            </Group>
          </Stack>
        </Stepper.Step>

        {/* Step 5: Convert & Download */}
        <Stepper.Step label="Download" description="Generate Word doc">
          <Stack mt="md">
            <TextInput
              label="Company Name"
              placeholder="Enter company name for filename"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              required
            />
            <Button
              leftSection={<IconDownload size={16} />}
              onClick={() => convertMut.mutate()}
              loading={convertMut.isPending}
              disabled={!companyName.trim() || !yamlContent.trim()}
            >
              Convert to Word & Download
            </Button>
            {convertMut.isSuccess && (
              <Alert color="green" title="Success">
                Word document downloaded successfully.
                {savedOutputPath ? ` Saved to ${savedOutputPath}.` : ''}
              </Alert>
            )}
            {convertMut.isError && (
              <Alert color="red" title="Error">
                Failed to convert YAML to Word. Check the YAML format.
              </Alert>
            )}
          </Stack>
        </Stepper.Step>
      </Stepper>
    </Stack>
  );
}
