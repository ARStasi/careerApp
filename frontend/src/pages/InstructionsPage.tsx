import { useState, useEffect } from 'react';
import {
  Stack, Title, Button, Group, Textarea, Text, Alert, LoadingOverlay, Box,
} from '@mantine/core';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { IconAlertCircle, IconCheck, IconRefresh } from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';
import api from '../api/client';

export default function InstructionsPage() {
  const queryClient = useQueryClient();
  const [draft, setDraft] = useState('');
  const [isDirty, setIsDirty] = useState(false);

  const { data, isLoading } = useQuery<{ content: string }>({
    queryKey: ['instructions'],
    queryFn: () => api.get('/workflow/instructions').then((r) => r.data),
  });

  useEffect(() => {
    if (data?.content !== undefined && !isDirty) {
      setDraft(data.content);
    }
  }, [data?.content]);

  const saveMut = useMutation({
    mutationFn: (content: string) =>
      api.put('/workflow/instructions', { content }).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['instructions'] });
      setIsDirty(false);
      notifications.show({
        title: 'Saved',
        message: 'Instructions updated successfully.',
        color: 'green',
        icon: <IconCheck size={16} />,
      });
    },
    onError: () => {
      notifications.show({
        title: 'Error',
        message: 'Failed to save instructions.',
        color: 'red',
        icon: <IconAlertCircle size={16} />,
      });
    },
  });

  function handleChange(value: string) {
    setDraft(value);
    setIsDirty(value !== data?.content);
  }

  function handleReset() {
    if (data?.content !== undefined) {
      setDraft(data.content);
      setIsDirty(false);
    }
  }

  return (
    <Stack>
      <Group justify="space-between" align="flex-start">
        <div>
          <Title order={2}>AI Instructions</Title>
          <Text c="dimmed" size="sm" mt={4}>
            Edit the instructions sent to the AI when tailoring your resume.
          </Text>
        </div>
        <Group>
          <Button
            variant="default"
            leftSection={<IconRefresh size={16} />}
            onClick={handleReset}
            disabled={!isDirty}
          >
            Reset
          </Button>
          <Button
            onClick={() => saveMut.mutate(draft)}
            loading={saveMut.isPending}
            disabled={!isDirty}
          >
            Save
          </Button>
        </Group>
      </Group>

      {isDirty && (
        <Alert color="yellow" icon={<IconAlertCircle size={16} />}>
          You have unsaved changes.
        </Alert>
      )}

      <Box pos="relative">
        <LoadingOverlay visible={isLoading} />
        <Textarea
          value={draft}
          onChange={(e) => handleChange(e.currentTarget.value)}
          autosize
          minRows={30}
          styles={{ input: { fontFamily: 'monospace', fontSize: 13 } }}
        />
      </Box>
    </Stack>
  );
}
