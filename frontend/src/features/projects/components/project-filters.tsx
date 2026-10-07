'use client';

import { useState, useEffect } from 'react';
import { useDebounce } from '@/hooks/useDebounce';
import { Input } from '@/components/ui/input';
import { IconSearch } from '@/components/icons';

interface ProjectFiltersProps {
  search: string;
  onSearchChange: (value: string) => void;
  status?: string;
  onStatusChange?: (value: string) => void;
  className?: string;
}

export function ProjectFilters({
  search,
  onSearchChange,
  status = '',
  onStatusChange,
  className = '',
}: ProjectFiltersProps) {
  const [localSearch, setLocalSearch] = useState(search);
  const debouncedSearch = useDebounce(localSearch, 300);

  useEffect(() => {
    onSearchChange(debouncedSearch);
  }, [debouncedSearch, onSearchChange]);

  useEffect(() => {
    setLocalSearch(search);
  }, [search]);

  return (
    <div className={`flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full ${className}`}>
      <div className="flex-1">
        <Input
          type="text"
          value={localSearch}
          onChange={(e) => setLocalSearch(e.target.value)}
          placeholder="Search by name or description..."
          leftIcon={<IconSearch className="h-4 w-4" />}
          className="h-10 rounded-xl border-neutral-200/90 bg-neutral-50/50 shadow-xs placeholder:text-neutral-400 focus:bg-white"
        />
      </div>
      {onStatusChange && (
        <div className="w-full sm:w-44 shrink-0">
          <select
            value={status}
            onChange={(e) => onStatusChange(e.target.value)}
            className="h-10 w-full rounded-xl border border-neutral-200/90 bg-neutral-50/50 px-3 text-sm text-neutral-800 shadow-xs focus:bg-white focus:border-primary-500 focus:outline-hidden"
          >
            <option value="">All Statuses</option>
            <option value="Not Started">Not Started</option>
            <option value="In Progress">In Progress</option>
            <option value="Completed">Completed</option>
          </select>
        </div>
      )}
    </div>
  );
}
