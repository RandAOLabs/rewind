import React, { useState } from 'react';
import { Tooltip } from 'antd';
import BrandLogo from '../icons/ar.io-logo-square-light.png';
import { QuestionCircleOutlined } from '@ant-design/icons';
import { FaGithub, FaDiscord } from 'react-icons/fa';
import { Link } from 'react-router-dom';

//import MarkdownModal from '@src/components/modals/MarkdownModal';
//import { APP_VERSION, ARIO_DISCORD_LINK } from '../../../utils/constants';


import './Footer.css';

export default function Footer() {
  const [showChangeLog, setShowChangeLog] = useState(false);

  return (
    <div className="flex-row app-footer">
      {/* LEFT */}
      <div className="flex-row flex-left w-fit">
        <img
          src={BrandLogo}
          alt="ARIO Logo"
          className="footer-icon"
        />
        <Link
          className="footer-link"
          to="https://ar.io/legal/terms-of-service-and-privacy-policy"
          target="_blank"
          rel="noreferrer"
        >
          Terms &amp; Conditions
        </Link>
      </div>

      {/* SPACER */}
      <div className="flex-space-between" />

      {/* RIGHT */}
      <div className="flex-row flex-right w-fit">
        <Tooltip
          title="Show Changelog"
          placement="top"
          color="var(--text-faded)"
        >
          <button
            className="footer-button"
            onClick={() => setShowChangeLog(true)}
          >
            {`v${"APP_VERSION"}-${import.meta.env.VITE_GITHUB_HASH?.slice(0, 6)}`}
          </button>
        </Tooltip>

        <Tooltip title="GitHub" placement="top" color="var(--text-faded)">
          <button
            className="footer-icon-button"
            onClick={() => window.open('https://github.com/ar-io/', '_blank')}
          >
            <FaGithub className="footer-icon" />
          </button>
        </Tooltip>

        <Tooltip title="Discord" placement="top" color="var(--text-faded)">
          <button
            className="footer-icon-button"
            onClick={() => window.open("ARIO_DISCORD_LINK", '_blank')}
          >
            <FaDiscord className="footer-icon" />
          </button>
        </Tooltip>

        <Tooltip
          title="Documentation"
          placement="top"
          color="var(--text-faded)"
        >
          <button
            className="footer-icon-button"
            onClick={() => window.open('https://docs.ar.io/arns', '_blank')}
          >
            <QuestionCircleOutlined className="footer-icon" />
          </button>
        </Tooltip>
      </div>
    </div>
  );
}
