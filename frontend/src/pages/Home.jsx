import { useNavigate } from 'react-router-dom';
import { BookOpen, Code2, Cpu, Hash, Key, Lock, Shield, Unlock, Zap } from 'lucide-react';
import { useAlgorithms } from '../lib/useAlgorithms';

const CATEGORY_STYLE = {
  symmetric: { color: '#4f9cf9', icon: Lock },
  asymmetric: { color: '#a855f7', icon: Key },
  classic: { color: '#eab308', icon: Zap },
  encoding: { color: '#22c55e', icon: Code2 },
  hashing: { color: '#f97316', icon: Hash },
};

export default function Home() {
  const navigate = useNavigate();
  const { algorithms } = useAlgorithms();
  const groups = Object.entries(algorithms);
  const total = groups.reduce((n, [, list]) => n + list.length, 0);

  const features = [
    { icon: Lock, title: 'Encode & Encrypt', desc: 'AES-256-GCM, RSA, Fernet, classical ciphers, encodings and hashes — for text or files.', to: '/encode', cta: 'Start encoding' },
    { icon: Unlock, title: 'Decode & Decrypt', desc: 'Reverse any encoding or decrypt with the right key. Wrong keys get a clear error, not garbage.', to: '/decode', cta: 'Start decoding' },
    { icon: BookOpen, title: 'Learn how it works', desc: 'Step-by-step explanations, worked examples and real-world use cases for every technique.', to: '/learn-encode', cta: 'Open lessons' },
    { icon: Cpu, title: 'Private by default', desc: 'Encodings, classical ciphers and SHA hashes run entirely in your browser. Nothing is stored.', to: '/encode', cta: 'Try it' },
  ];

  return (
    <div className="page home-page">
      <section className="hero">
        <div className="hero-badge"><Shield size={14} /><span>Cryptography Playground</span></div>
        <h1 className="hero-title">
          <span>Encrypt. Encode.</span>
          <br />
          <span className="gradient-text">Understand.</span>
        </h1>
        <p className="hero-desc">
          A full-stack toolkit for symmetric and public-key encryption, classical ciphers, encoding schemes and hash
          functions — with lessons that explain what is happening under the hood.
        </p>
        <div className="hero-actions">
          <button className="btn-primary" onClick={() => navigate('/encode')}><Lock size={16} /> Start encoding</button>
          <button className="btn-secondary" onClick={() => navigate('/learn-encode')}><BookOpen size={16} /> Learn first</button>
        </div>
        <div className="stats-row">
          <div className="stat"><span className="stat-num">{total}</span><span className="stat-label">Algorithms</span></div>
          <div className="stat-divider" />
          <div className="stat"><span className="stat-num">{groups.length}</span><span className="stat-label">Categories</span></div>
          <div className="stat-divider" />
          <div className="stat"><span className="stat-num">0</span><span className="stat-label">Data stored</span></div>
        </div>
      </section>

      <section className="categories-section">
        <h2 className="section-title">Explore by category</h2>
        <div className="category-grid">
          {groups.map(([cat, list]) => {
            const { color, icon: Icon } = CATEGORY_STYLE[cat] ?? { color: '#4f9cf9', icon: Shield };
            return (
              <button key={cat} className="category-card" style={{ '--cat-color': color }} onClick={() => navigate('/encode', { state: { algorithm: list[0]?.id } })}>
                <span className="cat-icon-wrap"><Icon size={22} /></span>
                <h3>{cat}</h3>
                <p>{list.length} algorithm{list.length !== 1 ? 's' : ''}</p>
                <span className="cat-samples">
                  {list.slice(0, 3).map(a => <span key={a.id} className="tag">{a.name}</span>)}
                  {list.length > 3 && <span className="tag muted">+{list.length - 3}</span>}
                </span>
              </button>
            );
          })}
        </div>
      </section>

      <section className="features-section">
        <h2 className="section-title">What you can do</h2>
        <div className="features-grid">
          {features.map(({ icon: Icon, title, desc, to, cta }) => (
            <div key={title} className="feature-card">
              <div className="feature-icon"><Icon size={20} /></div>
              <h3>{title}</h3>
              <p>{desc}</p>
              <button className="feature-link" onClick={() => navigate(to)}>{cta} →</button>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
