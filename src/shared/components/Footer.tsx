import React from 'react';
import './Footer.css';

export default function Footer() {
  return (
    <footer className="footer">
      <div className="footer-section">
        <h4>Solutions</h4>
        <ul>
          <li><a href="/domains">Domains</a></li>
          <li><a href="/gateways">Gateways</a></li>
          <li><a href="/storage">Storage</a></li>
          <li><a href="/access">Access</a></li>
        </ul>
      </div>

      <div className="footer-section">
        <h4>Ecosystem</h4>
        <ul>
          <li><a href="/articles">Articles &amp; Updates</a></li>
          <li><a href="/cloudmap">Cloudmap</a></li>
          <li><a href="/tldrs">TLDRs</a></li>
          <li><a href="/foundation">Foundation</a></li>
          <li><a href="/press">Press</a></li>
          <li><a href="/explore">Explore</a></li>
        </ul>
      </div>

      <div className="footer-section">
        <h4>Use Cases</h4>
        <ul>
          <li><a href="/use-cases/ai">Decentralized AI</a></li>
          <li><a href="/use-cases/sites">Sites &amp; Apps</a></li>
          <li><a href="/use-cases/storage">File Storage</a></li>
        </ul>
      </div>

      <div className="footer-copy">© 2025 AR.IO™</div>
    </footer>
  );
}
