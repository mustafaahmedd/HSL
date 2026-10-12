'use client';

import React, { useEffect, useRef, useState } from 'react';

// In-app replacements for window.confirm / window.prompt. Call from anywhere (no hook needed):
//   if (!(await confirmDialog({ title: 'Delete team?', message: '…', danger: true }))) return;
//   const value = await promptDialog({ title: 'Rename', defaultValue: 'A' });   // null if cancelled
// <DialogHost /> is mounted once in the root layout. For plain notifications use react-toastify's `toast`.

export interface ConfirmOptions {
  title?: string;
  message?: React.ReactNode;
  confirmText?: string;
  cancelText?: string;
  danger?: boolean;
  /** User must type this exact text (case-insensitive) before confirming, e.g. "RESET". */
  requireText?: string;
}

export interface PromptOptions extends Omit<ConfirmOptions, 'requireText'> {
  label?: string;
  defaultValue?: string;
  placeholder?: string;
  inputType?: 'text' | 'number';
}

type Request =
  | { kind: 'confirm'; options: ConfirmOptions; resolve: (v: boolean) => void }
  | { kind: 'prompt'; options: PromptOptions; resolve: (v: string | null) => void };

let enqueue: ((r: Request) => void) | null = null;

export function confirmDialog(options: ConfirmOptions): Promise<boolean> {
  return new Promise(resolve => {
    if (!enqueue) return resolve(false);
    enqueue({ kind: 'confirm', options, resolve });
  });
}

export function promptDialog(options: PromptOptions): Promise<string | null> {
  return new Promise(resolve => {
    if (!enqueue) return resolve(null);
    enqueue({ kind: 'prompt', options, resolve });
  });
}

export function DialogHost() {
  const [queue, setQueue] = useState<Request[]>([]);
  const [value, setValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const current = queue[0];

  useEffect(() => {
    enqueue = r => setQueue(q => [...q, r]);
    return () => { enqueue = null; };
  }, []);

  useEffect(() => {
    if (!current) return;
    setValue(current.kind === 'prompt' ? current.options.defaultValue ?? '' : '');
    setTimeout(() => inputRef.current?.focus(), 0);
  }, [current]);

  if (!current) return null;

  const { options } = current;
  const requireText = current.kind === 'confirm' ? current.options.requireText : undefined;
  const needsInput = current.kind === 'prompt' || !!requireText;
  const canConfirm = !requireText || value.trim().toUpperCase() === requireText.toUpperCase();

  const close = (confirmed: boolean) => {
    if (current.kind === 'confirm') current.resolve(confirmed);
    else current.resolve(confirmed ? value : null);
    setQueue(q => q.slice(1));
  };

  return (
    <div
      className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/50 p-4"
      onMouseDown={e => { if (e.target === e.currentTarget) close(false); }}
      onKeyDown={e => { if (e.key === 'Escape') close(false); }}
      role="dialog"
      aria-modal="true"
    >
      <form
        className="w-full max-w-md rounded-xl bg-white p-6 shadow-2xl"
        onSubmit={e => { e.preventDefault(); if (canConfirm) close(true); }}
      >
        {options.title && <h2 className="text-lg font-semibold text-gray-900">{options.title}</h2>}
        {options.message && <div className="mt-2 text-sm text-gray-600 whitespace-pre-line">{options.message}</div>}

        {needsInput && (
          <div className="mt-4">
            {current.kind === 'prompt' && current.options.label && (
              <label className="mb-1 block text-sm font-medium text-gray-700">{current.options.label}</label>
            )}
            {requireText && (
              <label className="mb-1 block text-sm text-gray-700">
                Type <span className="font-mono font-semibold">{requireText}</span> to confirm
              </label>
            )}
            <input
              ref={inputRef}
              type={current.kind === 'prompt' ? current.options.inputType || 'text' : 'text'}
              value={value}
              placeholder={current.kind === 'prompt' ? current.options.placeholder : undefined}
              onChange={e => setValue(e.target.value)}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
        )}

        <div className="mt-6 flex justify-end gap-2">
          <button
            type="button"
            onClick={() => close(false)}
            className="rounded-md bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200"
          >
            {options.cancelText || 'Cancel'}
          </button>
          <button
            type="submit"
            autoFocus={!needsInput}
            disabled={!canConfirm}
            className={`rounded-md px-4 py-2 text-sm font-medium text-white disabled:opacity-40 ${options.danger ? 'bg-red-600 hover:bg-red-700' : 'bg-blue-600 hover:bg-blue-700'}`}
          >
            {options.confirmText || 'OK'}
          </button>
        </div>
      </form>
    </div>
  );
}
