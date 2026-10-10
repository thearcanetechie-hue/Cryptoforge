import { useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { AlertCircle, ArrowRight, Check, Copy, Cpu, Download, Key, Loader, Lock, RefreshCw, Server, Unlock, Wifi, WifiOff } from 'lucide-react';
import FileDrop from '../components/FileDrop';
import { encodeFileRemote, generateKey, runRemote } from '../lib/api';
import { encodeBytesLocal, runLocal, runsInBrowser } from '../lib/codecs';
import { useAlgorithms } from '../lib/useAlgorithms';

const CATEGORIES = {
  symmetric: '🔒 Symmetric',
  asymmetric: '🔑 Asymmetric',
  classic: '📜 Classic',
  encoding: '💻 Encoding',
  hashing: '#️⃣ Hashing',
};
const FILE_ALGOS = new Set(['base64', 'hex', 'binary', 'md5', 'sha1', 'sha256', 'sha512', 'sha3_256', 'sha3_512', 'blake2b', 'blake2s']);

const isMac = typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform);

export default function EncoderDecoder({ mode }) {
  const encoding = mode === 'encode';
  const navigate = useNavigate();
  const prefill = useLocation().state ?? {};
  const { algorithms, online } = useAlgorithms();

  const flat = useMemo(() => Object.values(algorithms).flat(), [algorithms]);
  const [selectedId, setSelectedId] = useState(prefill.algorithm ?? 'aes');
  const [filter, setFilter] = useState('all');
  const [inputMode, setInputMode] = useState('text');
  const [inputText, setInputText] = useState(prefill.text ?? '');
  const [key, setKey] = useState(prefill.key ?? '');
  const [publicKey, setPublicKey] = useState(prefill.publicKey ?? '');
  const [privateKey, setPrivateKey] = useState(prefill.privateKey ?? '');
  const [file, setFile] = useState(null);
  const [output, setOutput] = useState(null); // { text, where }
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);

  const selected = flat.find(a => a.id === selectedId) ?? flat[0];
  const visible = filter === 'all' ? flat : algorithms[filter] ?? [];
  const oneWay = selected.encodeOnly && !encoding;
  const isRsa = selected.category === 'asymmetric';
  const local = runsInBrowser(selected.id);
  const fileMode = encoding && inputMode === 'file';
  const fileUnsupported = fileMode && !FILE_ALGOS.has(selected.id);
  const needsServer = fileMode ? !['base64', 'hex', 'binary', 'sha1', 'sha256', 'sha512'].includes(selected.id) : !local;

  const reset = () => { setOutput(null); setError(''); };
  const choose = a => { if (!(a.encodeOnly && !encoding)) { setSelectedId(a.id); reset(); } };

  const handleGenKey = async () => {
    setError('');
    try {
      const data = await generateKey(selected.id);
      if (data.type === 'asymmetric') { setPublicKey(data.public_key); setPrivateKey(data.private_key); }
      else setKey(data.key);
    } catch (e) {
      setError(e.message);
    }
  };

  const canRun = !busy && !oneWay && !fileUnsupported && (fileMode ? !!file : inputText.length > 0);

  const handleRun = async () => {
    if (!canRun) return;
    reset();
    setBusy(true);
    try {
      if (fileMode) {
        const bytes = new Uint8Array(await file.arrayBuffer());
        const localResult = await encodeBytesLocal(selected.id, bytes);
        if (localResult !== null) setOutput({ text: localResult, where: 'browser' });
        else setOutput({ text: (await encodeFileRemote(file, selected.id)).result, where: 'server' });
        return;
      }
      const keyToUse = isRsa ? (encoding ? publicKey : privateKey) : key;
      const localResult = await runLocal(selected.id, mode, inputText, keyToUse);
      if (localResult !== null) setOutput({ text: localResult, where: 'browser' });
      else setOutput({ text: (await runRemote(mode, { text: inputText, algorithm: selected.id, key: keyToUse })).result, where: 'server' });
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(output.text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      setError('Clipboard access was blocked by the browser — select the result and copy it manually.');
    }
  };

  const handleDownload = () => {
    const url = URL.createObjectURL(new Blob([output.text], { type: 'text/plain' }));
    const a = Object.assign(document.createElement('a'), { href: url, download: `cryptoforge-${selected.id}-${mode}d.txt` });
    a.click();
    URL.revokeObjectURL(url);
  };

  const sendToDecoder = () =>
    navigate('/decode', { state: { algorithm: selected.id, text: output.text, key, publicKey, privateKey } });

  return (
    <div className="page codec-page">
      <div className="page-header">
        <div className="page-title-row">
          {encoding ? <Lock size={24} /> : <Unlock size={24} />}
          <h1>{encoding ? 'Encode & Encrypt' : 'Decode & Decrypt'}</h1>
        </div>
        <p className="page-subtitle">
          {encoding ? 'Transform text or a file with any supported algorithm.' : 'Reverse an encoding, or decrypt ciphertext with the right key.'}
        </p>
      </div>

      <div className="codec-layout">
        <div className="algo-panel">
          <div className="algo-filters" role="tablist" aria-label="Algorithm category">
            {['all', ...Object.keys(CATEGORIES)].map(c => (
              <button key={c} role="tab" aria-selected={filter === c} className={`filter-chip ${filter === c ? 'active' : ''}`} onClick={() => setFilter(c)}>
                {c === 'all' ? '⚡ All' : CATEGORIES[c]}
              </button>
            ))}
          </div>
          <div className="algo-list">
            {visible.map(a => {
              const disabled = a.encodeOnly && !encoding;
              return (
                <button
                  key={a.id}
                  className={`algo-item ${selected.id === a.id ? 'active' : ''} ${disabled ? 'disabled' : ''}`}
                  onClick={() => choose(a)}
                  disabled={disabled}
                  aria-pressed={selected.id === a.id}
                  title={disabled ? 'Hashes are one-way and cannot be decoded' : a.description}
                >
                  <span className="algo-info">
                    <span className="algo-name">{a.name}</span>
                    <span className="algo-cat">{a.category}</span>
                  </span>
                  {a.encodeOnly && <span className="one-way-badge">one-way</span>}
                </button>
              );
            })}
          </div>
        </div>

        <div className="workspace">
          <div className="algo-badge-bar">
            <span className="algo-badge-name">{selected.name}</span>
            <span className="algo-badge-desc">{selected.description}</span>
            <span className="backend-badge" title={needsServer ? 'Runs on the CryptoForge API' : 'Runs entirely in your browser'}>
              {needsServer ? (online === false ? <WifiOff size={13} /> : <Wifi size={13} />) : <Cpu size={13} />}
              {needsServer ? (online === false ? 'API offline' : 'server') : 'in-browser'}
            </span>
          </div>

          {needsServer && online === false && !oneWay && (
            <div className="info-box warning">
              <AlertCircle size={16} />
              <span>
                {selected.name} runs on the Python API, which isn't reachable. Start it with{' '}
                <code>uvicorn main:app --reload</code> in <code>backend/</code>, or pick an in-browser algorithm.
              </span>
            </div>
          )}

          {encoding && (
            <div className="input-tabs" role="tablist" aria-label="Input type">
              <button role="tab" aria-selected={inputMode === 'text'} className={`tab ${inputMode === 'text' ? 'active' : ''}`} onClick={() => { setInputMode('text'); reset(); }}>✏️ Text</button>
              <button role="tab" aria-selected={inputMode === 'file'} className={`tab ${inputMode === 'file' ? 'active' : ''}`} onClick={() => { setInputMode('file'); reset(); }}>📁 File</button>
            </div>
          )}

          {fileMode ? (
            <>
              <FileDrop file={file} onFile={f => { setFile(f); reset(); }} onError={setError} />
              {fileUnsupported && (
                <div className="info-box warning"><AlertCircle size={16} /><span>File mode works with Base64, Hex, Binary and the hash functions. Pick one of those to process a file.</span></div>
              )}
            </>
          ) : (
            <textarea
              className="main-textarea"
              aria-label={encoding ? 'Text to encode' : 'Text to decode'}
              placeholder={encoding ? 'Enter text to encode or encrypt…' : 'Paste encoded or encrypted text…'}
              value={inputText}
              onChange={e => setInputText(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) handleRun(); }}
              rows={6}
            />
          )}

          {selected.needsKey && !fileMode && (
            <div className="key-section">
              {isRsa ? (
                <>
                  <div className="key-row">
                    <label htmlFor="pub">Public key {encoding && <em>(used to encrypt)</em>}</label>
                    <textarea id="pub" className="key-textarea" placeholder="-----BEGIN PUBLIC KEY-----" value={publicKey} onChange={e => setPublicKey(e.target.value)} rows={4} />
                  </div>
                  <div className="key-row">
                    <label htmlFor="priv">Private key {!encoding && <em>(used to decrypt)</em>}</label>
                    <textarea id="priv" className="key-textarea" placeholder="-----BEGIN PRIVATE KEY-----" value={privateKey} onChange={e => setPrivateKey(e.target.value)} rows={4} />
                  </div>
                  <button className="gen-key-btn" onClick={handleGenKey}><Key size={14} /> Generate RSA key pair</button>
                </>
              ) : (
                <div className="key-row horizontal">
                  <label htmlFor="key">{selected.keyType === 'number' ? 'Shift' : selected.id === 'fernet' ? 'Fernet key' : selected.id === 'vigenere' ? 'Keyword' : 'Passphrase'}</label>
                  <input
                    id="key"
                    type={selected.keyType === 'number' ? 'number' : 'text'}
                    className="key-input"
                    placeholder={selected.keyType === 'number' ? '3' : selected.id === 'fernet' ? 'Click Generate for a valid key' : 'Enter a secret…'}
                    value={key}
                    onChange={e => setKey(e.target.value)}
                    autoComplete="off"
                    spellCheck={false}
                  />
                  {selected.generateKey && <button className="gen-key-btn small" onClick={handleGenKey}><RefreshCw size={13} /> Generate</button>}
                </div>
              )}
            </div>
          )}

          {oneWay && (
            <div className="info-box warning"><AlertCircle size={16} /><span>{selected.name} is a one-way hash — it cannot be decoded.</span></div>
          )}

          <button className="run-btn" onClick={handleRun} disabled={!canRun}>
            {busy ? <Loader size={18} className="spin" /> : encoding ? <Lock size={18} /> : <Unlock size={18} />}
            {busy ? 'Working…' : encoding ? 'Encode / Encrypt' : 'Decode / Decrypt'}
            {!busy && !fileMode && <kbd>{isMac ? '⌘' : 'Ctrl'} ↵</kbd>}
          </button>

          {error && <div className="info-box error" role="alert"><AlertCircle size={16} /><span>{error}</span></div>}

          {output && (
            <div className="result-box">
              <div className="result-header">
                <span className="result-meta">
                  Result
                  <span className="where">{output.where === 'browser' ? <><Cpu size={12} /> in your browser</> : <><Server size={12} /> on the server</>}</span>
                  <span className="where">{output.text.length.toLocaleString()} chars</span>
                </span>
                <div className="result-actions">
                  <button onClick={handleCopy} className="icon-btn">{copied ? <Check size={15} /> : <Copy size={15} />}{copied ? 'Copied' : 'Copy'}</button>
                  <button onClick={handleDownload} className="icon-btn"><Download size={15} /> Save</button>
                  {encoding && !selected.encodeOnly && !fileMode && (
                    <button onClick={sendToDecoder} className="icon-btn accent">Decode it <ArrowRight size={15} /></button>
                  )}
                </div>
              </div>
              <pre className="result-text">{output.text || <em className="muted">(empty)</em>}</pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
