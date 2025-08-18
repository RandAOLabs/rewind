import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Home.css';
import Footer from '../../shared/components/Footer/Footer';

export default function Home() {
  const [query, setQuery] = useState('');
  const navigate = useNavigate();

  // Called on form submit or button click
  const goToDetail = () => {
    const name = query.trim().toLowerCase();
    if (name) {
      // adjust this path to match your router
      navigate(`/history/${encodeURIComponent(name)}`);
    }
  };

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    goToDetail();
  };

  return (

    <div className="home">

      <main className="hero">
        <h1 className="title">Search Name History</h1>
        <p className="subtitle">
          View the historical ownership and site changes of ar.io domains and undernames.
        </p>

        <form className="search-container" onSubmit={onSubmit}>
          <input
            type="text"
            className="search-input"
            placeholder="Search for a name"
            value={query}
            onChange={e => setQuery(e.target.value)}
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
      </main>

    <Footer />
    </div>
  );
}
