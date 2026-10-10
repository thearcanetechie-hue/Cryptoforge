import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronDown, ChevronRight, Play } from 'lucide-react';

function LessonItem({ item, stepsTitle, tryMode }) {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const id = `lesson-${item.name.replace(/\W+/g, '-').toLowerCase()}`;

  return (
    <div className={`accordion-item ${open ? 'open' : ''}`}>
      <button className="accordion-header" onClick={() => setOpen(o => !o)} aria-expanded={open} aria-controls={id}>
        <span>{item.name}</span>
        {open ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
      </button>
      {open && (
        <div className="accordion-body" id={id}>
          <p className="learn-overview">{item.overview}</p>
          <h4>{stepsTitle}</h4>
          <ol className="learn-steps">{item.how.map((s, i) => <li key={i}>{s}</li>)}</ol>
          {item.tip && <div className="tip-box">💡 <strong>Tip:</strong> {item.tip}</div>}
          <h4>Example</h4>
          <div className="learn-example">
            <div className="ex-row"><span className="ex-label">Input</span><code>{item.example.input}</code></div>
            <div className="ex-row"><span className="ex-label">Output</span><code>{item.example.output}</code></div>
          </div>
          {item.useCases && (
            <>
              <h4>Common use cases</h4>
              <div className="use-cases">{item.useCases.map(u => <span key={u} className="tag">{u}</span>)}</div>
            </>
          )}
          {item.pitfalls && (
            <>
              <h4>Common pitfalls</h4>
              <ul className="pitfall-list">{item.pitfalls.map(p => <li key={p}>⚠️ {p}</li>)}</ul>
            </>
          )}
          {item.algo && (
            <button className="gen-key-btn try-btn" onClick={() => navigate(`/${tryMode}`, { state: { algorithm: item.algo, text: item.tryText } })}>
              <Play size={13} /> Try it in the playground
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export default function Lessons({ icon: Icon, title, subtitle, lessons, stepsTitle, tryMode }) {
  return (
    <div className="page learn-page">
      <div className="page-header">
        <div className="page-title-row"><Icon size={24} /><h1>{title}</h1></div>
        <p className="page-subtitle">{subtitle}</p>
      </div>
      <div className="learn-content">
        {lessons.map(section => (
          <section key={section.category} className="learn-section" style={{ '--sec-color': section.color }}>
            <div className="learn-section-header"><div className="sec-dot" /><h2>{section.category}</h2></div>
            <div className="accordion">
              {section.items.map(item => <LessonItem key={item.name} item={item} stepsTitle={stepsTitle} tryMode={tryMode} />)}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
