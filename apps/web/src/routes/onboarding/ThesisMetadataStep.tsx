import {
  Alert,
  AlertDescription,
  AlertIcon,
  Box,
  Button,
  Checkbox,
  FormControl,
  FormHelperText,
  FormLabel,
  Heading,
  Input,
  Select,
  Stack,
  Text,
  Textarea,
  VStack,
  HStack,
  Divider
} from '@chakra-ui/react';
import { useCallback, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageShell } from '../shared/PageShell';
import { useOnboarding, useOnboardingStepNavigation } from './OnboardingContext';
import type { ThesisMetadata } from '@thesis-copilot/shared';

type ThesisMetadataFormValues = {
  // Author
  firstName: string;
  lastName: string;
  middleName?: string;
  studentId?: string;

  // Degree
  degreeType: 'BACHELOR' | 'MASTER' | 'PHD';
  fieldOfStudy: string;
  fullDegreeTitle?: string;

  // Institution
  institutionName: string;
  department: string;
  faculty?: string;
  location?: string;

  // Dates
  submissionDate: string;
  defenseDate?: string;

  // Front matter content
  abstract?: string;
  acknowledgements?: string;
  dedication?: string;

  // Optional sections
  includeCopyright: boolean;
  includeDedication: boolean;
  includeAcknowledgements: boolean;
  includeListOfTables: boolean;
  includeListOfFigures: boolean;
};

const defaultFormValues: ThesisMetadataFormValues = {
  firstName: '',
  lastName: '',
  degreeType: 'MASTER',
  fieldOfStudy: '',
  institutionName: '',
  department: '',
  submissionDate: new Date().toISOString().split('T')[0], // Today's date in YYYY-MM-DD
  includeCopyright: false,
  includeDedication: false,
  includeAcknowledgements: false,
  includeListOfTables: false,
  includeListOfFigures: false
};

export function ThesisMetadataStep() {
  const navigate = useNavigate();
  const { project, saveProject, projectDraft } = useOnboarding();
  const [formValues, setFormValues] = useState<ThesisMetadataFormValues>(defaultFormValues);
  const [localError, setLocalError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const updateField = useCallback((field: keyof ThesisMetadataFormValues, value: any) => {
    setFormValues((prev) => ({ ...prev, [field]: value }));
  }, []);

  const validateForm = useCallback(() => {
    if (!formValues.firstName.trim()) {
      setLocalError('First name is required');
      return false;
    }
    if (!formValues.lastName.trim()) {
      setLocalError('Last name is required');
      return false;
    }
    if (!formValues.fieldOfStudy.trim()) {
      setLocalError('Field of study is required');
      return false;
    }
    if (!formValues.institutionName.trim()) {
      setLocalError('Institution name is required');
      return false;
    }
    if (!formValues.department.trim()) {
      setLocalError('Department is required');
      return false;
    }
    if (!formValues.submissionDate) {
      setLocalError('Submission date is required');
      return false;
    }
    setLocalError(null);
    return true;
  }, [formValues]);

  const handleSave = useCallback(async () => {
    if (!validateForm()) {
      return false;
    }

    setIsSaving(true);
    try {
      // Convert form values to ThesisMetadata format
      const thesisMetadata: ThesisMetadata = {
        title: projectDraft.title,
        author: {
          firstName: formValues.firstName,
          lastName: formValues.lastName,
          middleName: formValues.middleName,
          studentId: formValues.studentId
        },
        degree: {
          type: formValues.degreeType,
          fieldOfStudy: formValues.fieldOfStudy,
          fullTitle: formValues.fullDegreeTitle
        },
        institution: {
          name: formValues.institutionName,
          department: formValues.department,
          faculty: formValues.faculty,
          location: formValues.location
        },
        submissionDate: formValues.submissionDate,
        defenseDate: formValues.defenseDate,
        abstract: formValues.abstract,
        acknowledgements: formValues.acknowledgements,
        dedication: formValues.dedication,
        includeCopyright: formValues.includeCopyright,
        includeDedication: formValues.includeDedication,
        includeAcknowledgements: formValues.includeAcknowledgements,
        includeListOfTables: formValues.includeListOfTables,
        includeListOfFigures: formValues.includeListOfFigures
      };

      // Save project with metadata
      await saveProject({
        ...projectDraft,
        thesisMetadata
      });

      return true;
    } catch (error) {
      setLocalError((error as Error).message);
      return false;
    } finally {
      setIsSaving(false);
    }
  }, [formValues, projectDraft, saveProject, validateForm]);

  const handleNext = useCallback(async () => {
    const success = await handleSave();
    if (success) {
      navigate('/dashboard');
    }
    return false;
  }, [handleSave, navigate]);

  const handlePrevious = useCallback(() => {
    navigate('/onboarding/constitution');
    return false;
  }, [navigate]);

  const navigationHandlers = useMemo(
    () => ({
      onNext: handleNext,
      onPrevious: handlePrevious
    }),
    [handleNext, handlePrevious]
  );

  useOnboardingStepNavigation(navigationHandlers);

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        handleNext();
      }}
      noValidate
    >
      <PageShell
        title="Step 4: Thesis Metadata"
        description="Provide information for your professional thesis document formatting."
      >
        <VStack spacing={10} align="stretch">
          {localError && (
            <Alert
              status="error"
              borderRadius="lg"
              bg="rgba(239, 68, 68, 0.08)"
              border="1px solid rgba(239, 68, 68, 0.2)"
            >
              <AlertIcon color="red.500" />
              <AlertDescription color="academic.primaryText">{localError}</AlertDescription>
            </Alert>
          )}

          {/* Helper Text */}
          <Text color="academic.secondaryText" fontSize="sm">
            This information will be used to generate a professional title page, abstract, and other
            front matter for your thesis document.
          </Text>

          {/* Author Information */}
          <Box>
            <Heading size="md" mb={4} color="academic.primaryText">
              Author Information
            </Heading>
            <VStack spacing={4} align="stretch">
              <HStack spacing={4}>
                <FormControl isRequired>
                  <FormLabel>First Name</FormLabel>
                  <Input
                    value={formValues.firstName}
                    onChange={(e) => updateField('firstName', e.target.value)}
                    placeholder="John"
                  />
                </FormControl>

                <FormControl>
                  <FormLabel>Middle Name</FormLabel>
                  <Input
                    value={formValues.middleName || ''}
                    onChange={(e) => updateField('middleName', e.target.value)}
                    placeholder="Michael (optional)"
                  />
                </FormControl>

                <FormControl isRequired>
                  <FormLabel>Last Name</FormLabel>
                  <Input
                    value={formValues.lastName}
                    onChange={(e) => updateField('lastName', e.target.value)}
                    placeholder="Doe"
                  />
                </FormControl>
              </HStack>

              <FormControl>
                <FormLabel>Student ID</FormLabel>
                <Input
                  value={formValues.studentId || ''}
                  onChange={(e) => updateField('studentId', e.target.value)}
                  placeholder="123456789 (optional)"
                />
              </FormControl>
            </VStack>
          </Box>

          <Divider />

          {/* Degree Information */}
          <Box>
            <Heading size="md" mb={4} color="academic.primaryText">
              Degree Information
            </Heading>
            <VStack spacing={4} align="stretch">
              <FormControl isRequired>
                <FormLabel>Degree Level</FormLabel>
                <Select
                  value={formValues.degreeType}
                  onChange={(e) =>
                    updateField('degreeType', e.target.value as 'BACHELOR' | 'MASTER' | 'PHD')
                  }
                >
                  <option value="BACHELOR">Bachelor's Degree</option>
                  <option value="MASTER">Master's Degree</option>
                  <option value="PHD">Doctoral Degree (PhD)</option>
                </Select>
              </FormControl>

              <FormControl isRequired>
                <FormLabel>Field of Study</FormLabel>
                <Input
                  value={formValues.fieldOfStudy}
                  onChange={(e) => updateField('fieldOfStudy', e.target.value)}
                  placeholder="e.g., Computer Science, Psychology, Business Administration"
                />
              </FormControl>

              <FormControl>
                <FormLabel>Full Degree Title</FormLabel>
                <Input
                  value={formValues.fullDegreeTitle || ''}
                  onChange={(e) => updateField('fullDegreeTitle', e.target.value)}
                  placeholder="e.g., Master of Science (optional, auto-generated if empty)"
                />
                <FormHelperText>
                  Leave empty to auto-generate based on degree level and field
                </FormHelperText>
              </FormControl>
            </VStack>
          </Box>

          <Divider />

          {/* Institution Information */}
          <Box>
            <Heading size="md" mb={4} color="academic.primaryText">
              Institution Information
            </Heading>
            <VStack spacing={4} align="stretch">
              <FormControl isRequired>
                <FormLabel>Institution Name</FormLabel>
                <Input
                  value={formValues.institutionName}
                  onChange={(e) => updateField('institutionName', e.target.value)}
                  placeholder="e.g., University of California"
                />
              </FormControl>

              <FormControl>
                <FormLabel>Faculty/School</FormLabel>
                <Input
                  value={formValues.faculty || ''}
                  onChange={(e) => updateField('faculty', e.target.value)}
                  placeholder="e.g., Faculty of Engineering (optional)"
                />
              </FormControl>

              <FormControl isRequired>
                <FormLabel>Department</FormLabel>
                <Input
                  value={formValues.department}
                  onChange={(e) => updateField('department', e.target.value)}
                  placeholder="e.g., Department of Computer Science"
                />
              </FormControl>

              <FormControl>
                <FormLabel>Location</FormLabel>
                <Input
                  value={formValues.location || ''}
                  onChange={(e) => updateField('location', e.target.value)}
                  placeholder="e.g., Berkeley, California (optional)"
                />
              </FormControl>
            </VStack>
          </Box>

          <Divider />

          {/* Dates */}
          <Box>
            <Heading size="md" mb={4} color="academic.primaryText">
              Dates
            </Heading>
            <VStack spacing={4} align="stretch">
              <FormControl isRequired>
                <FormLabel>Submission Date</FormLabel>
                <Input
                  type="month"
                  value={formValues.submissionDate.slice(0, 7)} // YYYY-MM
                  onChange={(e) => updateField('submissionDate', e.target.value + '-01')}
                />
                <FormHelperText>Select the month and year of submission</FormHelperText>
              </FormControl>

              <FormControl>
                <FormLabel>Defense Date</FormLabel>
                <Input
                  type="date"
                  value={formValues.defenseDate || ''}
                  onChange={(e) => updateField('defenseDate', e.target.value)}
                />
                <FormHelperText>Optional: Date of thesis defense</FormHelperText>
              </FormControl>
            </VStack>
          </Box>

          <Divider />

          {/* Front Matter Content */}
          <Box>
            <Heading size="md" mb={4} color="academic.primaryText">
              Front Matter Content
            </Heading>
            <VStack spacing={4} align="stretch">
              <FormControl>
                <FormLabel>Abstract</FormLabel>
                <Textarea
                  value={formValues.abstract || ''}
                  onChange={(e) => updateField('abstract', e.target.value)}
                  placeholder="A brief summary of your thesis (200-350 words)..."
                  rows={6}
                  resize="vertical"
                />
                <FormHelperText>
                  Optional: You can add this later. Character limit: 500 words
                </FormHelperText>
              </FormControl>

              <FormControl>
                <FormLabel>Dedication</FormLabel>
                <Textarea
                  value={formValues.dedication || ''}
                  onChange={(e) => updateField('dedication', e.target.value)}
                  placeholder="e.g., To my family and friends who supported me throughout this journey..."
                  rows={3}
                  resize="vertical"
                />
                <FormHelperText>Optional: A personal dedication (typically 1-2 lines)</FormHelperText>
              </FormControl>

              <FormControl>
                <FormLabel>Acknowledgements</FormLabel>
                <Textarea
                  value={formValues.acknowledgements || ''}
                  onChange={(e) => updateField('acknowledgements', e.target.value)}
                  placeholder="I would like to thank my advisor, Dr. Smith, for their guidance..."
                  rows={5}
                  resize="vertical"
                />
                <FormHelperText>
                  Optional: Acknowledge those who helped with your research
                </FormHelperText>
              </FormControl>
            </VStack>
          </Box>

          <Divider />

          {/* Optional Sections */}
          <Box>
            <Heading size="md" mb={4} color="academic.primaryText">
              Optional Sections
            </Heading>
            <VStack spacing={3} align="stretch">
              <Checkbox
                isChecked={formValues.includeCopyright}
                onChange={(e) => updateField('includeCopyright', e.target.checked)}
              >
                Include Copyright Page
              </Checkbox>

              <Checkbox
                isChecked={formValues.includeDedication}
                onChange={(e) => updateField('includeDedication', e.target.checked)}
              >
                Include Dedication Page
              </Checkbox>

              <Checkbox
                isChecked={formValues.includeAcknowledgements}
                onChange={(e) => updateField('includeAcknowledgements', e.target.checked)}
              >
                Include Acknowledgements Page
              </Checkbox>

              <Checkbox
                isChecked={formValues.includeListOfTables}
                onChange={(e) => updateField('includeListOfTables', e.target.checked)}
              >
                Include List of Tables
              </Checkbox>

              <Checkbox
                isChecked={formValues.includeListOfFigures}
                onChange={(e) => updateField('includeListOfFigures', e.target.checked)}
              >
                Include List of Figures
              </Checkbox>
            </VStack>
          </Box>

          {/* Form Actions */}
          <Stack direction={{ base: 'column', md: 'row' }} spacing={4} pt={4}>
            <Button
              colorScheme="brand"
              type="submit"
              isLoading={isSaving}
              size="lg"
              loadingText="Saving..."
            >
              Save & Complete Setup
            </Button>
            <Button
              variant="outline"
              onClick={() => navigate('/onboarding/constitution')}
              isDisabled={isSaving}
              size="lg"
            >
              Back
            </Button>
            <Button
              variant="ghost"
              onClick={() => navigate('/dashboard')}
              isDisabled={isSaving}
              size="lg"
            >
              Skip for Now
            </Button>
          </Stack>

          <Text fontSize="xs" color="academic.secondaryText" fontStyle="italic">
            💡 You can update this information anytime from your project settings
          </Text>
        </VStack>
      </PageShell>
    </form>
  );
}
