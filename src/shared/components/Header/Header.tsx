// src/shared/components/Header/Header.tsx
import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import logoLight from '../icons/REWIND_WHITE_LOGO.png';
import './Header.css';
import { AiOutlineSearch } from 'react-icons/ai';

export default function Header() {
  const location = useLocation();
  const navigate = useNavigate();
  const [query, setQuery] = useState('');

  // match /history/:name
  const historyMatch = location.pathname.match(/^\/history\/([^/]+)$/);
  const isHistoryPage = Boolean(historyMatch);

  const onSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const name = query.trim().toLowerCase();
    if (name) {
      navigate(`/history/${encodeURIComponent(name)}`);
      setQuery('');
    }
  };

  return (
    <header className="app-header">
      <div className="header-inner">
        <Link to="/" data-discover="true" className="logo-link">
          <img
            src={logoLight}
            alt="AR.IO logo"
            className="logo-img"
          />
        </Link>

        {isHistoryPage && (
          <form className="header-search" onSubmit={onSearchSubmit}>
            <input
              type="text"
              className="header-search-input"
              placeholder="Jump to another name"
              value={query}
              onChange={e => setQuery(e.target.value)}
            />
            <button type="submit" className="header-search-btn" aria-label="Search">
              <AiOutlineSearch size={18} />
            </button>
          </form>
        )}
      </div>
    </header>
);
}
