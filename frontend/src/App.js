import React, { useState } from 'react';
import Header from './components/Header';
import ChatBox from './components/ChatBox';
import Dashboard from './components/Dashboard';
import './App.css';

const App = function() {
  var [activePage, setActivePage] = useState("chat");
  return (
    <div className="App">
      <Header activePage={activePage} onNavigate={setActivePage} />
      <div className={"page-slot" + (activePage === "chat" ? "" : " page-hidden")}>
        <ChatBox />
      </div>
      <div className={"page-slot" + (activePage === "dashboard" ? "" : " page-hidden")}>
        <Dashboard isActive={activePage === "dashboard"} />
      </div>
    </div>
  );
};

export default App;
