/**
 * ProjectFilters Component
 *
 * Search, filter, and sort controls for dashboard projects.
 */

import {
  Flex,
  Input,
  InputGroup,
  InputLeftElement,
  HStack,
  Badge,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  Button,
  ButtonGroup,
  IconButton,
  Box,
} from '@chakra-ui/react';
import { Search, ChevronDown, Grid2, List } from 'lucide-react';

export interface FilterState {
  searchQuery: string;
  statusFilter: 'all' | 'active' | 'planning' | 'complete';
  sortBy: 'recent' | 'name' | 'progress';
  viewMode: 'grid' | 'list';
}

interface ProjectFiltersProps {
  filters: FilterState;
  onFilterChange: (filters: Partial<FilterState>) => void;
  projectCounts?: {
    all: number;
    active: number;
    planning: number;
    complete: number;
  };
}

interface FilterChipProps {
  label: string;
  isActive: boolean;
  count?: number;
  onClick: () => void;
}

function FilterChip({ label, isActive, count, onClick }: FilterChipProps) {
  return (
    <Badge
      as="button"
      onClick={onClick}
      px={3}
      py={2}
      borderRadius="lg"
      fontSize="sm"
      fontWeight="semibold"
      cursor="pointer"
      transition="all 0.2s"
      bg={isActive ? '#607A94' : 'white'}
      color={isActive ? 'white' : '#6B7280'}
      border="1px solid"
      borderColor={isActive ? '#607A94' : '#E5E7EB'}
      _hover={{
        bg: isActive ? '#506580' : '#F9FAFB',
        borderColor: isActive ? '#506580' : '#607A94',
      }}
    >
      {label}
      {count !== undefined && (
        <Box
          as="span"
          ml={2}
          px={2}
          py={0.5}
          bg={isActive ? 'rgba(255,255,255,0.2)' : '#E5E7EB'}
          borderRadius="md"
          fontSize="xs"
        >
          {count}
        </Box>
      )}
    </Badge>
  );
}

export function ProjectFilters({
  filters,
  onFilterChange,
  projectCounts = { all: 0, active: 0, planning: 0, complete: 0 },
}: ProjectFiltersProps) {
  const sortOptions = [
    { value: 'recent', label: 'Recently updated' },
    { value: 'name', label: 'Name (A-Z)' },
    { value: 'progress', label: 'Progress' },
  ];

  const currentSortLabel =
    sortOptions.find((opt) => opt.value === filters.sortBy)?.label || 'Sort';

  return (
    <Box
      bg="white"
      p={4}
      borderRadius="xl"
      border="1px solid"
      borderColor="#E5E7EB"
      mb={6}
    >
      <Flex
        gap={4}
        wrap="wrap"
        align="center"
        direction={{ base: 'column', md: 'row' }}
      >
        {/* Search */}
        <InputGroup maxW={{ base: '100%', md: '320px' }} flex={{ md: 1 }}>
          <InputLeftElement pointerEvents="none">
            <Search size={18} color="#9CA3AF" />
          </InputLeftElement>
          <Input
            placeholder="Search projects..."
            value={filters.searchQuery}
            onChange={(e) => onFilterChange({ searchQuery: e.target.value })}
            borderRadius="lg"
            borderColor="#E5E7EB"
            _focus={{
              borderColor: '#607A94',
              boxShadow: '0 0 0 1px #607A94',
            }}
          />
        </InputGroup>

        <Flex gap={4} wrap="wrap" align="center" flex={{ md: 2 }}>
          {/* Filter chips */}
          <HStack spacing={2} wrap="wrap">
            <FilterChip
              label="All"
              isActive={filters.statusFilter === 'all'}
              count={projectCounts.all}
              onClick={() => onFilterChange({ statusFilter: 'all' })}
            />
            <FilterChip
              label="Active"
              isActive={filters.statusFilter === 'active'}
              count={projectCounts.active}
              onClick={() => onFilterChange({ statusFilter: 'active' })}
            />
            <FilterChip
              label="Planning"
              isActive={filters.statusFilter === 'planning'}
              count={projectCounts.planning}
              onClick={() => onFilterChange({ statusFilter: 'planning' })}
            />
            <FilterChip
              label="Complete"
              isActive={filters.statusFilter === 'complete'}
              count={projectCounts.complete}
              onClick={() => onFilterChange({ statusFilter: 'complete' })}
            />
          </HStack>

          {/* Sort menu */}
          <Menu>
            <MenuButton
              as={Button}
              rightIcon={<ChevronDown size={16} />}
              size="sm"
              variant="outline"
              borderColor="#E5E7EB"
              color="#6B7280"
              _hover={{ bg: '#F9FAFB', borderColor: '#607A94' }}
              _active={{ bg: '#F3F4F6' }}
            >
              Sort: {currentSortLabel}
            </MenuButton>
            <MenuList>
              {sortOptions.map((option) => (
                <MenuItem
                  key={option.value}
                  onClick={() =>
                    onFilterChange({ sortBy: option.value as FilterState['sortBy'] })
                  }
                  bg={filters.sortBy === option.value ? '#F9FAFB' : 'white'}
                  fontWeight={filters.sortBy === option.value ? 'semibold' : 'normal'}
                >
                  {option.label}
                </MenuItem>
              ))}
            </MenuList>
          </Menu>

          {/* View toggle */}
          <ButtonGroup size="sm" isAttached variant="outline">
            <IconButton
              icon={<Grid2 size={16} />}
              aria-label="Grid view"
              onClick={() => onFilterChange({ viewMode: 'grid' })}
              bg={filters.viewMode === 'grid' ? '#607A94' : 'white'}
              color={filters.viewMode === 'grid' ? 'white' : '#6B7280'}
              borderColor="#E5E7EB"
              _hover={{
                bg: filters.viewMode === 'grid' ? '#506580' : '#F9FAFB',
              }}
            />
            <IconButton
              icon={<List size={16} />}
              aria-label="List view"
              onClick={() => onFilterChange({ viewMode: 'list' })}
              bg={filters.viewMode === 'list' ? '#607A94' : 'white'}
              color={filters.viewMode === 'list' ? 'white' : '#6B7280'}
              borderColor="#E5E7EB"
              _hover={{
                bg: filters.viewMode === 'list' ? '#506580' : '#F9FAFB',
              }}
            />
          </ButtonGroup>
        </Flex>
      </Flex>
    </Box>
  );
}
