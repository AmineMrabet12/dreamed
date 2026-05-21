import React, { useState, useEffect, useMemo } from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar, Cell } from 'recharts';

function migrateItem(item, i) {
  var base = Object.assign({}, item);
  if (!base.id) base.id = Date.now() + i;
  if (!base.messages) {
    base.messages = [base.userMessage, base.botMessage].filter(Boolean);
  }
  return base;
}

var STOP_WORDS = new Set([
  'je','tu','il','elle','nous','vous','ils','elles','le','la','les','un','une',
  'des','du','de','et','en','au','aux','que','qui','quoi','dans','sur','sous',
  'par','pour','avec','sans','mon','ma','mes','ton','ta','tes','son','sa','ses',
  'ce','cette','ces','se','si','ne','pas','plus','mais','ou','donc','ni','car',
  'est','était','sont','être','avoir','avais','avait','ont','été','bien','alors',
  'comme','quand','ai','très','aussi','tout','plus','même','dont','où','leur',
  'leurs','y','en','on','nous','cela','ça','c','d','j','l','m','n','s','t',
  'i','you','he','she','we','they','the','a','an','and','or','but','in','on',
  'at','to','for','of','with','is','was','are','were','be','been','have','has',
  'had','do','did','will','would','could','should','my','your','his','her','its',
  'our','their','this','that','these','those','it','not','no','so','if','all',
  'just','about','me','him','us','them','what','which','who','from','by','get',
  'got','can','see','one','two','had','but','his','her','him','its','our',
]);

var Dashboard = function({ isActive }) {
  var [history, setHistory] = useState([]);
  var [isLoaded, setIsLoaded] = useState(false);

  useEffect(function() {
    if (!isActive) return;
    try {
      var stored = JSON.parse(localStorage.getItem('chatHistory')) || [];
      setHistory(stored.map(migrateItem));
    } catch(e) {
      setHistory([]);
    }
    // slight delay to allow entrance animations
    setTimeout(() => setIsLoaded(true), 100);
  }, [isActive]);

  const stats = useMemo(() => {
    var totalChats = history.length;
    var totalMessages = history.reduce((acc, item) => acc + (item.messages ? item.messages.length : 0), 0);
    
    var userMessages = history.reduce((acc, item) => {
      if (!item.messages) return acc;
      return acc + item.messages.filter(m => m.isUser).length;
    }, 0);
    
    var avgExchanges = totalChats ? (userMessages / totalChats).toFixed(1) : '0';

    var daySet = new Set();
    history.forEach(item => {
      if (item.messages && item.messages[0]) {
        daySet.add(new Date(item.messages[0].timestamp).toDateString());
      }
    });
    var activeDays = daySet.size;

    /* ── Activity — last 14 days ──────────────────────────────── */
    var today = new Date(); 
    today.setHours(0,0,0,0);
    var activityMap = {};
    for (var i = 13; i >= 0; i--) {
      var d = new Date(today); 
      d.setDate(d.getDate() - i);
      activityMap[d.toDateString()] = { dateObj: new Date(d), count: 0 };
    }
    history.forEach(item => {
      if (item.messages && item.messages[0]) {
        var dd = new Date(item.messages[0].timestamp); 
        dd.setHours(0,0,0,0);
        var key = dd.toDateString();
        if (key in activityMap) activityMap[key].count++;
      }
    });
    var activityData = Object.values(activityMap).map(x => ({
      label: x.dateObj.toLocaleDateString('fr-FR', { day:'numeric', month:'short' }),
      count: x.count,
    }));

    /* ── Top keywords ─────────────────────────────────────────── */
    var wordCount = {};
    history.forEach(item => {
      if (!item.messages) return;
      item.messages.filter(m => m.isUser).forEach(m => {
        if (!m.text) return;
        m.text.toLowerCase()
          .replace(/[^a-zàâäéèêëîïôùûüæœçğşı؀-ۿ ]/g, ' ')
          .split(/\s+/)
          .forEach(w => {
            if (w.length > 2 && !STOP_WORDS.has(w)) {
              wordCount[w] = (wordCount[w] || 0) + 1;
            }
          });
      });
    });
    var topWords = Object.keys(wordCount)
      .sort((a, b) => wordCount[b] - wordCount[a])
      .slice(0, 10);
    
    var maxKeywordCount = topWords.length ? wordCount[topWords[0]] : 1;
    var keywordsData = topWords.map(w => ({ word: w, count: wordCount[w], pct: (wordCount[w] / maxKeywordCount) * 100 }));

    /* ── Longest chat ─────────────────────────────────────────── */
    var longestChat = null;
    history.forEach(item => {
      var count = item.messages ? Math.floor(item.messages.length / 2) : 0;
      var currMax = longestChat && longestChat.messages ? Math.floor(longestChat.messages.length / 2) : 0;
      if (!longestChat || count > currMax) {
        longestChat = item;
      }
    });

    /* ── Day-of-week distribution ─────────────────────────────── */
    // getDay() 0 is Sunday, 1 is Monday. We'll map to start with Monday for French UI.
    var dowLabels = ['Lun','Mar','Mer','Jeu','Ven','Sam','Dim'];
    // indices: getDay() returns 0 for Sunday. 
    // We want Monday(1) to be index 0. Sunday(0) to be index 6.
    var dowCounts = [0,0,0,0,0,0,0];
    history.forEach(item => {
      if (item.messages && item.messages[0]) {
        var day = new Date(item.messages[0].timestamp).getDay();
        var index = day === 0 ? 6 : day - 1;
        dowCounts[index]++;
      }
    });
    var dowData = dowLabels.map((lbl, idx) => ({
      name: lbl,
      count: dowCounts[idx]
    }));

    return {
      totalChats, totalMessages, avgExchanges, activeDays,
      activityData, keywordsData, longestChat, dowData
    };
  }, [history]);

  if (!isLoaded) return <div className="dashboard-loading">Chargement...</div>;

  if (stats.totalChats === 0) {
    return (
      <div className="dashboard-empty fade-in">
        <div className="empty-state-icon">📊</div>
        <p className="empty-state-text">
          Aucune donnée pour l'instant.<br />
          Commencez à interpréter vos rêves !
        </p>
      </div>
    );
  }

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="custom-tooltip">
          <p className="label">{`${label}`}</p>
          <p className="intro">{`${payload[0].value} rêve(s)`}</p>
        </div>
      );
    }
    return null;
  };

  const longestMsg = stats.longestChat && stats.longestChat.messages && stats.longestChat.messages.find(m => m.isUser);

  return (
    <div className="dashboard fade-in">
      <div className="dashboard-inner">

        <h2 className="dashboard-title">Tableau de bord</h2>

        {/* KPI cards */}
        <div className="kpi-grid">
          <div className="kpi-card glass-panel staggered-1">
            <div className="kpi-glow"></div>
            <span className="kpi-icon">🌙</span>
            <span className="kpi-value">{stats.totalChats}</span>
            <span className="kpi-label">Rêves analysés</span>
          </div>
          <div className="kpi-card glass-panel staggered-2">
            <div className="kpi-glow"></div>
            <span className="kpi-icon">💬</span>
            <span className="kpi-value">{stats.totalMessages}</span>
            <span className="kpi-label">Messages échangés</span>
          </div>
          <div className="kpi-card glass-panel staggered-3">
            <div className="kpi-glow"></div>
            <span className="kpi-icon">🔁</span>
            <span className="kpi-value">{stats.avgExchanges}</span>
            <span className="kpi-label">Moy. échanges / rêve</span>
          </div>
          <div className="kpi-card glass-panel staggered-4">
            <div className="kpi-glow"></div>
            <span className="kpi-icon">📅</span>
            <span className="kpi-value">{stats.activeDays}</span>
            <span className="kpi-label">Jours actifs</span>
          </div>
        </div>

        <div className="dashboard-row">

          {/* Activity last 14 days */}
          <div className="dash-card activity-card glass-panel staggered-5">
            <h3 className="dash-card-title">Activité — 14 derniers jours</h3>
            <div className="chart-container">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={stats.activityData} margin={{ top: 10, right: 0, left: -25, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="label" stroke="rgba(255,255,255,0.2)" tick={{fill: '#94a3b8', fontSize: 10}} axisLine={false} tickLine={false} />
                  <YAxis stroke="rgba(255,255,255,0.2)" tick={{fill: '#94a3b8', fontSize: 10}} axisLine={false} tickLine={false} />
                  <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'rgba(255,255,255,0.1)', strokeWidth: 1, strokeDasharray: '4 4' }} />
                  <Area type="monotone" dataKey="count" stroke="#8b5cf6" strokeWidth={3} fillOpacity={1} fill="url(#colorCount)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Top keywords */}
          <div className="dash-card keywords-card glass-panel staggered-6">
            <h3 className="dash-card-title">Mots les plus fréquents</h3>
            {stats.keywordsData.length > 0 ? (
              <div className="keywords-list">
                {stats.keywordsData.map((kw, idx) => (
                  <div key={kw.word} className="keyword-row">
                    <span className="keyword-rank">#{idx + 1}</span>
                    <span className="keyword-word">{kw.word}</span>
                    <div className="keyword-bar-track">
                      <div className="keyword-bar-fill" style={{ width: kw.pct + '%' }} />
                    </div>
                    <span className="keyword-count">{kw.count}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="dash-empty-hint">Pas encore assez de données</p>
            )}
          </div>

        </div>

        <div className="dashboard-row">

          {/* Day-of-week distribution */}
          <div className="dash-card dow-card glass-panel staggered-7">
            <h3 className="dash-card-title">Répartition par jour</h3>
            <div className="chart-container">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.dowData} margin={{ top: 10, right: 0, left: -25, bottom: 0 }}>
                  <defs>
                    <linearGradient id="barColor" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#3b82f6"/>
                      <stop offset="100%" stopColor="#8b5cf6"/>
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="name" stroke="rgba(255,255,255,0.2)" tick={{fill: '#94a3b8', fontSize: 10}} axisLine={false} tickLine={false} />
                  <YAxis stroke="rgba(255,255,255,0.2)" tick={{fill: '#94a3b8', fontSize: 10}} axisLine={false} tickLine={false} />
                  <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.05)' }} />
                  <Bar dataKey="count" fill="url(#barColor)" radius={[4, 4, 0, 0]}>
                    {stats.dowData.map((entry, index) => (
                      <Cell key={`cell-${index}`} className="bar-hover-cell" />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Longest chat */}
          {stats.longestChat && Math.floor(stats.longestChat.messages.length / 2) >= 1 && (
            <div className="dash-card longest-card glass-panel staggered-8 showcase-card">
              <div className="showcase-glow" />
              <h3 className="dash-card-title">Rêve le plus long</h3>
              <div className="longest-inner">
                <div className="longest-icon-wrapper">
                  <span className="longest-icon">🏆</span>
                </div>
                <div className="longest-info">
                  <span className="longest-title">{stats.longestChat.title || 'Rêve sans titre'}</span>
                  <span className="longest-meta">
                    {Math.floor(stats.longestChat.messages.length / 2)} échange{Math.floor(stats.longestChat.messages.length / 2) > 1 ? 's' : ''} &middot;&nbsp;
                    {new Date(stats.longestChat.messages[0].timestamp).toLocaleDateString('fr-FR', { day:'numeric', month:'long', year:'numeric' })}
                  </span>
                </div>
              </div>
              <div className="longest-preview-wrapper">
                <div className="longest-preview">
                  "{longestMsg && longestMsg.text ? (longestMsg.text.length > 150 ? longestMsg.text.slice(0, 150) + '…' : longestMsg.text) : '...'}"
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default Dashboard;
