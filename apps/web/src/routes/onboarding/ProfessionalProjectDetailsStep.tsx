/**
 * Professional Project Details Step
 *
 * Compact, minimal form for project basics.
 */

import {
  FormControl,
  FormLabel,
  Input,
  Select,
  Textarea,
  VStack,
  Text,
  HStack,
} from '@chakra-ui/react';
import { useCallback, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useOnboarding, useOnboardingStepNavigation } from './OnboardingContext';
import { ProfessionalStepShell } from './ProfessionalStepShell';

const citationOptions = ['APA', 'MLA', 'CHICAGO', 'IEEE', 'HARVARD'] as const;

export function ProfessionalProjectDetailsStep() {
  const navigate = useNavigate();
  const {
    project,
    projectError,
    projectLoading,
    savingProject,
    saveProject,
    projectDraft,
    updateProjectDraft,
  } = useOnboarding();
  const [localError, setLocalError] = useState<string | null>(null);

  const isDisabled = projectLoading || savingProject;

  const ensureValid = useCallback(() => {
    if (!projectDraft.title.trim() || !projectDraft.topic.trim()) {
      setLocalError('Project title and topic are required');
      return false;
    }
    setLocalError(null);
    return true;
  }, [projectDraft]);

  const persistProject = useCallback(async () => {
    if (!ensureValid()) {
      return false;
    }
    try {
      await saveProject(projectDraft);
      return true;
    } catch (error) {
      setLocalError((error as Error).message);
      return false;
    }
  }, [ensureValid, projectDraft, saveProject]);

  const handlePrevious = useCallback(() => {
    navigate('/onboarding');
    return false;
  }, [navigate]);

  const handleNext = useCallback(async () => {
    const ok = await persistProject();
    if (ok) {
      navigate('/onboarding/research');
    }
    return false;
  }, [navigate, persistProject]);

  const navigationHandlers = useMemo(
    () => ({
      onPrevious: handlePrevious,
      onNext: handleNext,
    }),
    [handleNext, handlePrevious]
  );

  useOnboardingStepNavigation(navigationHandlers);

  const alertMessage = localError ?? projectError;

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        void handleNext();
      }}
      noValidate
    >
      <ProfessionalStepShell
        title="Project basics"
        description="Start by defining your thesis project details. This information will be used throughout your research and writing process."
        error={alertMessage}
        onPrevious={handlePrevious}
        onNext={handleNext}
        isLoading={savingProject}
        isNextDisabled={
          !projectDraft.title.trim() || !projectDraft.topic.trim() || isDisabled
        }
      >
        <VStack spacing={5} align="stretch">
          {/* Project Title */}
          <FormControl isRequired>
            <FormLabel
              fontSize="sm"
              fontWeight="500"
              color="#0F172A"
              mb={2}
            >
              Project title
            </FormLabel>
            <Input
              placeholder="e.g., The Impact of Social Media on Community Engagement"
              size="sm"
              value={projectDraft.title}
              onChange={(e) => updateProjectDraft({ title: e.target.value })}
              isDisabled={isDisabled}
              bg="white"
              border="1px solid"
              borderColor="#E2E8F0"
              borderRadius="md"
              fontSize="sm"
              _hover={{ borderColor: '#CBD5E1' }}
              _focus={{
                borderColor: '#64748B',
                boxShadow: '0 0 0 1px #64748B',
              }}
            />
          </FormControl>

          {/* Research Topic */}
          <FormControl isRequired>
            <FormLabel
              fontSize="sm"
              fontWeight="500"
              color="#0F172A"
              mb={2}
            >
              Research topic
            </FormLabel>
            <Input
              placeholder="e.g., Social Media Impact on Community Participation"
              size="sm"
              value={projectDraft.topic}
              onChange={(e) => updateProjectDraft({ topic: e.target.value })}
              isDisabled={isDisabled}
              bg="white"
              border="1px solid"
              borderColor="#E2E8F0"
              borderRadius="md"
              fontSize="sm"
              _hover={{ borderColor: '#CBD5E1' }}
              _focus={{
                borderColor: '#64748B',
                boxShadow: '0 0 0 1px #64748B',
              }}
            />
            <Text fontSize="xs" color="#64748B" mt={1.5}>
              A concise statement of your research focus
            </Text>
          </FormControl>

          {/* Description */}
          <FormControl>
            <FormLabel
              fontSize="sm"
              fontWeight="500"
              color="#0F172A"
              mb={2}
            >
              Description
              <Text
                as="span"
                fontSize="xs"
                fontWeight="400"
                color="#64748B"
                ml={1}
              >
                (optional)
              </Text>
            </FormLabel>
            <Textarea
              placeholder="Provide additional context about your research..."
              size="sm"
              rows={4}
              value={projectDraft.description || ''}
              onChange={(e) =>
                updateProjectDraft({ description: e.target.value })
              }
              isDisabled={isDisabled}
              bg="white"
              border="1px solid"
              borderColor="#E2E8F0"
              borderRadius="md"
              fontSize="sm"
              _hover={{ borderColor: '#CBD5E1' }}
              _focus={{
                borderColor: '#64748B',
                boxShadow: '0 0 0 1px #64748B',
              }}
            />
          </FormControl>

          {/* Two Column Layout */}
          <HStack spacing={4} align="start">
            {/* Citation Style */}
            <FormControl flex={1}>
              <FormLabel
                fontSize="sm"
                fontWeight="500"
                color="#0F172A"
                mb={2}
              >
                Citation style
              </FormLabel>
              <Select
                size="sm"
                value={projectDraft.citationStyle}
                onChange={(e) =>
                  updateProjectDraft({
                    citationStyle: e.target.value as (typeof citationOptions)[number],
                  })
                }
                isDisabled={isDisabled}
                bg="white"
                border="1px solid"
                borderColor="#E2E8F0"
                borderRadius="md"
                fontSize="sm"
                _hover={{ borderColor: '#CBD5E1' }}
                _focus={{
                  borderColor: '#64748B',
                  boxShadow: '0 0 0 1px #64748B',
                }}
              >
                {citationOptions.map((style) => (
                  <option key={style} value={style}>
                    {style}
                  </option>
                ))}
              </Select>
            </FormControl>

            {/* Field of Study */}
            <FormControl flex={1}>
              <FormLabel
                fontSize="sm"
                fontWeight="500"
                color="#0F172A"
                mb={2}
              >
                Field of study
                <Text
                  as="span"
                  fontSize="xs"
                  fontWeight="400"
                  color="#64748B"
                  ml={1}
                >
                  (optional)
                </Text>
              </FormLabel>
              <Input
                placeholder="e.g., Sociology"
                size="sm"
                value={projectDraft.fieldOfStudy || ''}
                onChange={(e) =>
                  updateProjectDraft({ fieldOfStudy: e.target.value })
                }
                isDisabled={isDisabled}
                bg="white"
                border="1px solid"
                borderColor="#E2E8F0"
                borderRadius="md"
                fontSize="sm"
                _hover={{ borderColor: '#CBD5E1' }}
                _focus={{
                  borderColor: '#64748B',
                  boxShadow: '0 0 0 1px #64748B',
                }}
              />
            </FormControl>
          </HStack>
        </VStack>
      </ProfessionalStepShell>
    </form>
  );
}
