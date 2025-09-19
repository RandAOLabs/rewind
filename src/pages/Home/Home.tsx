import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import FeelingLuckyButton, { getRandomArNSName } from './components/FeelingLuckyButton';
import './Home.css';
import Footer from '../../shared/components/Footer/Footer';

export default function Home() {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState<boolean>(true);
  const navigate = useNavigate();

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoadingSuggestions(true);
        const [one, two, three] = await Promise.all([
          getRandomArNSName(),
          getRandomArNSName(),
          getRandomArNSName(),
        ]);
        if (!cancelled) setSuggestions([one, two, three]);
      } catch (e) {
        console.error('suggestions init failed:', e);
        if (!cancelled) setSuggestions([]);
      } finally {
        if (!cancelled) setLoadingSuggestions(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const goToDetail = () => {
    const name = query.trim().toLowerCase();
    if (name) navigate(`/history/${encodeURIComponent(name)}`);
  };

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    goToDetail();
  };

  const useSuggestion = (s: string) => {
    setQuery(s);
    navigate(`/history/${encodeURIComponent(s)}`);
  };

  return (
    <div className="home">
      <div className="home-aurora" aria-hidden="true" />

      <main className="hero">
        <section className="hero-card">
          <h1 className="title">
            <span className="title-fade">Search</span> Name History
          </h1>
          <p className="subtitle">
          Explore ownership and content changes across ArNS names and undernames.          </p>

          <form className="search-container" onSubmit={onSubmit}>
            <input
              type="text"
              className="search-input"
              placeholder="Enter a name (e.g. example)"
              value={query}
              onChange={e => setQuery(e.target.value)}
              aria-label="Search for a name"
              autoFocus
            />
            <button
              type="submit"
              className="search-button"
              aria-label="Search"
              onClick={goToDetail}
            >
              <span className="icon search" />
            </button>
          </form>

          <div className="hint">Press <kbd>Enter</kbd> to search</div>

          {/* Suggestions block with loading state */}
          <div className="suggestions-wrap" aria-live="polite">
            <div className="suggestions-heading">
              {loadingSuggestions ? 'Random names loading…' : ''}
            </div>

            <div className="suggestions" role="list">
              {loadingSuggestions
                ? [0, 1, 2].map(i => (
                    <span
                      key={`skeleton-${i}`}
                      className="suggestion-chip chip-skeleton"
                      aria-hidden="true"
                    />
                  ))
                : suggestions.map(s => (
                    <button
                      key={s}
                      className="suggestion-chip"
                      role="listitem"
                      onClick={() => useSuggestion(s)}
                      aria-label={`Search ${s}`}
                    >
                      {s}
                    </button>
                  ))
              }
            </div>

          </div>

          <FeelingLuckyButton />
          <div className="powered-by">Randomized by RandAO</div>

        </section>
      </main>

      <Footer />
    </div>
  );
}
