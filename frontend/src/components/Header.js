import React from 'react';

const Header = function({ activePage, onNavigate }) {
  return (
    <header className="header-container">
      <div className="header-content">
        <h1 className="header-title">✦ Interprétation des Rêves ✦</h1>
        <span className="header-subtitle">Intelligence Onirique</span>
      </div>
      <nav className="header-nav">
        <button
          className={"header-nav-btn" + (activePage === "chat" ? " active" : "")}
          onClick={function() { onNavigate("chat"); }}
        >
          <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
          </svg>
          Chat
        </button>
        <button
          className={"header-nav-btn" + (activePage === "dashboard" ? " active" : "")}
          onClick={function() { onNavigate("dashboard"); }}
        >
          <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" />
            <rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" />
          </svg>
          Dashboard
        </button>
      </nav>
    </header>
  );
};

export default Header;
