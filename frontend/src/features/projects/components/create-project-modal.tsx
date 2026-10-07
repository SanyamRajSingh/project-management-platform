'use client';

import { useState } from 'react';
import { useCreateProject } from '@/features/projects/hooks/useProjects';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { Input, Textarea } from '@/components/ui/input';

interface CreateProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CreateProjectModal({ isOpen, onClose }: CreateProjectModalProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState('Not Started');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [dateError, setDateError] = useState('');
  const createProject = useCreateProject();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmedName = name.trim();
    if (!trimmedName) return;

    if (startDate && endDate && new Date(startDate) > new Date(endDate)) {
      setDateError('Start date must be before or equal to end date');
      return;
    }
    setDateError('');

    createProject.mutate(
      {
        name: trimmedName,
        description: description.trim() || undefined,
        status,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
      },
      {
        onSuccess: () => {
          setName('');
          setDescription('');
          setStatus('Not Started');
          setStartDate('');
          setEndDate('');
          setDateError('');
          onClose();
        },
      },
    );
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Create Project"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button type="submit" form="create-project-form" loading={createProject.isPending} disabled={!name.trim()}>
            Create
          </Button>
        </>
      }
    >
      {createProject.error && (
        <div className="mb-4 rounded-lg bg-red-50 border border-red-100 p-3 text-sm text-red-700">
          Failed to create project. Please try again.
        </div>
      )}

      {dateError && (
        <div className="mb-4 rounded-lg bg-red-50 border border-red-100 p-3 text-sm text-red-700">
          {dateError}
        </div>
      )}

      <form id="create-project-form" onSubmit={handleSubmit} className="space-y-4">
        <Input
          id="project-name"
          label="Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Project name"
          autoFocus
        />
        <Textarea
          id="project-desc"
          label="Description (optional)"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="What is this project about?"
          rows={2}
        />
        <div>
          <label htmlFor="project-status" className="block text-sm font-medium text-neutral-700 mb-1">
            Status
          </label>
          <select
            id="project-status"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="w-full rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-900 shadow-xs focus:border-primary-500 focus:outline-hidden focus:ring-1 focus:ring-primary-500"
          >
            <option value="Not Started">Not Started</option>
            <option value="In Progress">In Progress</option>
            <option value="Completed">Completed</option>
          </select>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Input
            id="project-start-date"
            label="Start Date (optional)"
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
          <Input
            id="project-end-date"
            label="End Date (optional)"
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
          />
        </div>
      </form>
    </Modal>
  );
}
