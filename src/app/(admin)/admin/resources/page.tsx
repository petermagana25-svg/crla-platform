'use client';

import { FormEvent, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

type ResourceCategory = 'marketing' | 'training';

type Resource = {
  id: string;
  title: string | null;
  description: string | null;
  category: ResourceCategory | null;
  file_url: string | null;
  created_at: string | null;
};

const categoryOptions: ResourceCategory[] = ['marketing', 'training'];

export default function AdminResourcesPage() {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<ResourceCategory>('marketing');
  const [file, setFile] = useState<File | null>(null);
  const [fileInputKey, setFileInputKey] = useState(0);
  const [resources, setResources] = useState<Resource[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [activeDeleteId, setActiveDeleteId] = useState<string | null>(null);
  const [message, setMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  useEffect(() => {
    fetchResources();
  }, []);

  useEffect(() => {
    if (message?.type !== 'success') {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setMessage(null);
    }, 1500);

    return () => window.clearTimeout(timeoutId);
  }, [message]);

  async function fetchResources() {
    setIsLoading(true);

    const { data, error } = await supabase
      .from('resources')
      .select('id, title, description, category, file_url, created_at')
      .order('created_at', { ascending: false });

    if (error) {
      setMessage({
        type: 'error',
        text: error.message || 'Unable to load resources.',
      });
      setResources([]);
      setIsLoading(false);
      return;
    }

    setResources(data ?? []);
    setIsLoading(false);
  }

  function getStoragePathFromUrl(fileUrl: string) {
    try {
      const url = new URL(fileUrl);
      const marker = '/object/public/resources/';
      const index = url.pathname.indexOf(marker);

      if (index === -1) {
        return null;
      }

      return decodeURIComponent(url.pathname.slice(index + marker.length));
    } catch {
      return null;
    }
  }

  function formatCreatedAt(value: string | null) {
    if (!value) {
      return '—';
    }

    return new Date(value).toLocaleString();
  }

  async function handleUpload(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!file) {
      setMessage({
        type: 'error',
        text: 'Choose a file to upload.',
      });
      return;
    }

    setIsUploading(true);
    setMessage(null);

    try {
      const formData = new FormData();
      formData.append('title', title.trim());
      formData.append('description', description.trim());
      formData.append('category', category);
      formData.append('file', file);

      const response = await fetch('/api/admin/resources/upload', {
        method: 'POST',
        body: formData,
      });

      const result = (await response.json().catch(() => null)) as
        | {
            success?: boolean;
            error?: {
              message?: string;
            };
          }
        | null;

      if (!response.ok || !result?.success) {
        throw new Error(
          result?.error?.message || 'Unable to upload resource.'
        );
      }

      setTitle('');
      setDescription('');
      setCategory('marketing');
      setFile(null);
      setFileInputKey((current) => current + 1);
      await fetchResources();
      setMessage({
        type: 'success',
        text: 'Updated ✓',
      });
    } catch (error) {
      setMessage({
        type: 'error',
        text:
          error instanceof Error ? error.message : 'Unable to upload resource.',
      });
    } finally {
      setIsUploading(false);
    }
  }

  async function handleDelete(resource: Resource) {
    if (!resource.file_url) {
      setMessage({
        type: 'error',
        text: 'This resource is missing a file URL.',
      });
      return;
    }

    const storagePath = getStoragePathFromUrl(resource.file_url);

    if (!storagePath) {
      setMessage({
        type: 'error',
        text: 'Unable to resolve the storage path for this resource.',
      });
      return;
    }

    setActiveDeleteId(resource.id);
    setMessage(null);

    try {
      const { error: storageError } = await supabase.storage
        .from('resources')
        .remove([storagePath]);

      if (storageError) {
        throw new Error(storageError.message || 'Unable to delete file.');
      }

      const { error: deleteError } = await supabase
        .from('resources')
        .delete()
        .eq('id', resource.id);

      if (deleteError) {
        throw new Error(deleteError.message || 'Unable to delete resource.');
      }

      await fetchResources();
      setMessage({
        type: 'success',
        text: 'Updated ✓',
      });
    } catch (error) {
      setMessage({
        type: 'error',
        text:
          error instanceof Error ? error.message : 'Unable to delete resource.',
      });
    } finally {
      setActiveDeleteId(null);
    }
  }

  return (
    <section className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-white">Resources</h2>
        <p className="mt-1 text-sm text-slate-400">
          Upload and manage internal marketing and training files.
        </p>
      </div>

      {message && (
        <div
          className={`rounded-2xl px-4 py-3 text-sm ${
            message.type === 'success'
              ? 'border border-emerald-400/30 bg-emerald-400/10 text-emerald-200'
              : 'border border-red-400/30 bg-red-400/10 text-red-200'
          }`}
        >
          {message.text}
        </div>
      )}

      <form
        onSubmit={handleUpload}
        className="rounded-2xl border border-white/10 bg-white/5 p-6"
      >
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-200">Title</label>
            <input
              type="text"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              disabled={isUploading}
              required
              className="w-full rounded-lg border border-white/10 bg-slate-950 px-3 py-2 text-sm text-white outline-none transition focus:border-white/20 disabled:cursor-not-allowed disabled:opacity-60"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-200">Category</label>
            <select
              value={category}
              onChange={(event) =>
                setCategory(event.target.value as ResourceCategory)
              }
              disabled={isUploading}
              className="w-full rounded-lg border border-white/10 bg-slate-950 px-3 py-2 text-sm text-white outline-none transition focus:border-white/20 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {categoryOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2 md:col-span-2">
            <label className="text-sm font-medium text-slate-200">
              Description
            </label>
            <textarea
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              disabled={isUploading}
              rows={4}
              required
              className="w-full rounded-lg border border-white/10 bg-slate-950 px-3 py-2 text-sm text-white outline-none transition focus:border-white/20 disabled:cursor-not-allowed disabled:opacity-60"
            />
          </div>

          <div className="space-y-2 md:col-span-2">
            <label className="text-sm font-medium text-slate-200">File</label>
            <input
              key={fileInputKey}
              type="file"
              onChange={(event) =>
                setFile(event.target.files ? event.target.files[0] : null)
              }
              disabled={isUploading}
              required
              className="w-full rounded-lg border border-white/10 bg-slate-950 px-3 py-2 text-sm text-slate-300 file:mr-4 file:rounded-md file:border-0 file:bg-white file:px-3 file:py-2 file:text-sm file:font-medium file:text-slate-950 disabled:cursor-not-allowed disabled:opacity-60"
            />
          </div>
        </div>

        <div className="mt-6 flex items-center gap-4">
          <button
            type="submit"
            disabled={isUploading}
            className="rounded-lg bg-white px-4 py-2 text-sm font-medium text-slate-950 transition hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isUploading ? 'Uploading...' : 'Upload Resource'}
          </button>
          {isUploading && (
            <span className="text-sm text-slate-400">Uploading...</span>
          )}
        </div>
      </form>

      <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/5">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-white/10 text-left">
            <thead className="bg-white/5">
              <tr className="text-xs uppercase tracking-[0.2em] text-slate-400">
                <th className="px-4 py-3 font-medium">Title</th>
                <th className="px-4 py-3 font-medium">Category</th>
                <th className="px-4 py-3 font-medium">Link</th>
                <th className="px-4 py-3 font-medium">Created</th>
                <th className="px-4 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {resources.map((resource) => {
                const isDeleting = activeDeleteId === resource.id;

                return (
                  <tr key={resource.id} className="text-sm text-slate-200">
                    <td className="px-4 py-4">{resource.title || '—'}</td>
                    <td className="px-4 py-4">{resource.category || '—'}</td>
                    <td className="px-4 py-4">
                      {resource.file_url ? (
                        <a
                          href={resource.file_url}
                          target="_blank"
                          rel="noreferrer"
                          className="text-sm font-medium text-sky-300 transition hover:text-sky-200"
                        >
                          Open file
                        </a>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td className="px-4 py-4">
                      {formatCreatedAt(resource.created_at)}
                    </td>
                    <td className="px-4 py-4">
                      <button
                        type="button"
                        onClick={() => handleDelete(resource)}
                        disabled={isDeleting || isUploading}
                        className="rounded-lg border border-white/10 px-4 py-2 text-sm font-medium text-white transition hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {isDeleting ? 'Updating...' : 'Delete'}
                      </button>
                    </td>
                  </tr>
                );
              })}

              {!isLoading && resources.length === 0 && (
                <tr>
                  <td
                    colSpan={5}
                    className="px-4 py-8 text-center text-sm text-slate-400"
                  >
                    No resources found.
                  </td>
                </tr>
              )}

              {isLoading && (
                <tr>
                  <td
                    colSpan={5}
                    className="px-4 py-8 text-center text-sm text-slate-400"
                  >
                    Loading resources...
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
