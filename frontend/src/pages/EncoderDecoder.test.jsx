import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import EncoderDecoder from './EncoderDecoder';

function renderAt(path, state) {
  return render(
    <MemoryRouter initialEntries={[{ pathname: path, state }]}>
      <Routes>
        <Route path="/encode" element={<EncoderDecoder key="encode" mode="encode" />} />
        <Route path="/decode" element={<EncoderDecoder key="decode" mode="decode" />} />
      </Routes>
    </MemoryRouter>,
  );
}

beforeEach(() => {
  // Simulate the API being offline; in-browser algorithms must still work.
  vi.stubGlobal('fetch', vi.fn(() => Promise.reject(new TypeError('offline'))));
});
afterEach(() => { cleanup(); vi.unstubAllGlobals(); });

describe('EncoderDecoder', () => {
  it('encodes in the browser and hands off to the decoder', async () => {
    renderAt('/encode', { algorithm: 'base64' });
    fireEvent.change(screen.getByLabelText('Text to encode'), { target: { value: 'Hi 👋' } });
    fireEvent.click(screen.getByRole('button', { name: /encode \/ encrypt/i }));
    expect(await screen.findByText('SGkg8J+Riw==')).toBeInTheDocument();
    expect(screen.getByText(/in your browser/)).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /decode it/i }));
    expect(screen.getByLabelText('Text to decode')).toHaveValue('SGkg8J+Riw==');
    fireEvent.click(screen.getByRole('button', { name: /decode \/ decrypt/i }));
    expect(await screen.findByText('Hi 👋')).toBeInTheDocument();
  });

  it('shows a clear error when the API is needed but offline', async () => {
    renderAt('/encode', { algorithm: 'aes' });
    expect(await screen.findByText(/isn't reachable/)).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText('Text to encode'), { target: { value: 'secret' } });
    fireEvent.change(screen.getByLabelText('Passphrase'), { target: { value: 'pw' } });
    fireEvent.click(screen.getByRole('button', { name: /encode \/ encrypt/i }));
    expect(await screen.findByRole('alert')).toHaveTextContent(/Cannot reach the CryptoForge API/);
  });

  it('disables hashes in decode mode', () => {
    renderAt('/decode');
    expect(screen.getByRole('button', { name: /SHA-256/ })).toBeDisabled();
    expect(screen.queryByRole('tab', { name: /file/i })).not.toBeInTheDocument();
  });
});
