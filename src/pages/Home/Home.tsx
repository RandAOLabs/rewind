import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import FeelingLuckyButton from './components/FeelingLuckyButton';
import './Home.css';
import Footer from '../../shared/components/Footer/Footer';
import { ARIORewindService } from 'ao-js-sdk';
import { getRewind } from '../History/utils/rewind';


const rewind = await getRewind();
const [one, two, three] = await Promise.all([
  rewind.getRandomARNSName(),
  rewind.getRandomARNSName(),
  rewind.getRandomARNSName(),
]);

export default function Home() {
  const [query, setQuery] = useState('');
  const navigate = useNavigate();

  const goToDetail = () => {
    const name = query.trim().toLowerCase();
    if (name) navigate(`/history/${encodeURIComponent(name)}`);
  };

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    goToDetail();
  };

  // optional, click a suggestion to fill + search
  const useSuggestion = (s: string) => {
    setQuery(s);
    navigate(`/history/${encodeURIComponent(s)}`);
  };

  return (
    <div className="home">
      {/* soft animated aurora */}
      <div className="home-aurora" aria-hidden="true" />

      <main className="hero">
        <section className="hero-card">
          <h1 className="title">
            <span className="title-fade">Search</span> Name History
          </h1>
          <p className="subtitle">
            Explore ownership and content changes across ar.io names and undernames.
          </p>

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

          <div className="suggestions" role="list">
            {[one, two, three].map(s => (
              <button
                key={s}
                className="suggestion-chip"
                role="listitem"
                onClick={() => useSuggestion(s)}
                aria-label={`Search ${s}`}
              >
                {s}
              </button>
            ))}
          </div>
          <FeelingLuckyButton />

        </section>
      </main>

      <Footer />
    </div>
  );
}
