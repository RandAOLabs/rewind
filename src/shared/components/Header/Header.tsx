import { Link } from 'react-router-dom';
import logoLight from '../icons/ar.io-logo-square-light.png';

export default function Header() {
  return (
    <header
      style={{
        height: '5rem',
        backgroundColor: '#131314',
        
      }}
    >
      <div
        style={{
          maxWidth: '1024px',
          margin: '0 auto',
          padding: '0.25rem 1.5rem',
          display: 'flex',
          alignItems: 'center',
          height: '100%',
        }}
      >
        <a href="/" data-discover="true">
          <img
            src={logoLight}
            alt="AR.IO logo"
            style={{
              height: '3rem',  // ← force it to 24px tall
              width: 'auto',
            }}
          />
        </a>
      </div>
    </header>
  )
}
