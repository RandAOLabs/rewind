import React from 'react';
import './Header.css';

import ArioLogo from '../icons/ar.io-logo-square-light.png';

export default function Header() {
  return (
    <header className="header">
      <div className="logo">
        <img src={ArioLogo} alt="ARIO Logo" />
      </div>
    </header>
  );
}
