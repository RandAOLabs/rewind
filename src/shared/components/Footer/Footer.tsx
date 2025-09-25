import React, { useState } from 'react';
import { Tooltip } from 'antd';
import BrandLogo from '../icons/powered-by-ario-light.png';
import { QuestionCircleOutlined } from '@ant-design/icons';
import { FaGithub, FaDiscord } from 'react-icons/fa';
import { Link } from 'react-router-dom';

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
          className="footer-icon-logo"
          onClick={() => window.open('https://ar.io', '_blank')}
        />
      </div>

      {/* SPACER */}
      <div className="flex-space-between" />

      {/* RIGHT */}
      <div className="flex-row flex-right w-fit">
        <Tooltip title="GitHub" placement="top" color="var(--text-faded)">
          <button
            className="footer-icon-button"
            onClick={() => window.open('https://github.com/RandAOLabs/rewind', '_blank')}
          >
            <FaGithub className="footer-icon" />
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
