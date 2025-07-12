import React from 'react';
import './Home.css';
import Footer from '../../shared/components/Footer';
import Header from '../../shared/components/Header';
export default function Home() {
  return (
    <div className="home">
      <Header />
      <header className="nav">

        <div className="nav-icons">
          {/* TODO: replace these spans with your actual SVG/icon components */}
          <span className="icon bell" aria-label="Notifications" />
          <span className="icon tool" aria-label="Tools" />
          <span className="icon settings" aria-label="Settings" />
        </div>
      </header>
      <main className="hero">
        <h1 className="title">Search Name History</h1>
        <p className="subtitle">
          View the historical ownership and site changes of ar.io domains and undernames.
        </p>
        <div className="search-container">
          <input
            type="text"
            className="search-input"
            placeholder="Search for a name"
          />
          <button className="search-button" aria-label="Search">
            <span className="icon search" />
          </button>
        </div>
      </main>
      <Footer />
    </div>
  );
}