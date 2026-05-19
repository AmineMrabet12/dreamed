import React, { useState, useEffect } from 'react';

function migrateItem(item, i) {
  var base = item.id ? item : Object.assign({}, item, { id: Date.now() + i });
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

  useEffect(function() {
    if (!isActive) return;
    try {
      var stored = JSON.parse(localStorage.getItem('chatHistory')) || [];
      setHistory(stored.map(migrateItem));
    } catch(e) {
      setHistory([]);
    }
  }, [isActive]);

  /* ── KPIs ──────────────────────────────────────────────────── */
  var totalChats    = history.length;
  var totalMessages = history.reduce(function(acc, item) {
    return acc + (item.messages ? item.messages.length : 0);
  }, 0);
  var userMessages  = history.reduce(function(acc, item) {
    if (!item.messages) return acc;
    return acc + item.messages.filter(function(m) { return m.isUser; }).length;
  }, 0);
  var avgExchanges  = totalChats ? (userMessages / totalChats).toFixed(1) : '0';

  var daySet = new Set();
  history.forEach(function(item) {
    if (item.messages && item.messages[0]) {
      daySet.add(new Date(item.messages[0].timestamp).toDateString());
    }
  });
  var activeDays = daySet.size;

  /* ── Activity — last 14 days ──────────────────────────────── */
  var today = new Date(); today.setHours(0,0,0,0);
  var activityMap = {};
  for (var i = 13; i >= 0; i--) {
    var d = new Date(today); d.setDate(d.getDate() - i);
    activityMap[d.toDateString()] = 0;
  }
  history.forEach(function(item) {
    if (item.messages && item.messages[0]) {
      var dd = new Date(item.messages[0].timestamp); dd.setHours(0,0,0,0);
      var key = dd.toDateString();
      if (key in activityMap) activityMap[key]++;
    }
  });
  var activityData = Object.keys(activityMap).map(function(key) {
    return { label: key, count: activityMap[key] };
  });
  var maxActivity = Math.max.apply(null, activityData.map(function(x) { return x.count; })) || 1;

  /* ── Top keywords ─────────────────────────────────────────── */
  var wordCount = {};
  history.forEach(function(item) {
    if (!item.messages) return;
    item.messages.filter(function(m) { return m.isUser; }).forEach(function(m) {
      m.text.toLowerCase()
        .replace(/[^a-zàâäéèêëîïôùûüæœçğşı؀-ۿ ]/g, ' ')
        .split(/\s+/)
        .forEach(function(w) {
          if (w.length > 2 && !STOP_WORDS.has(w)) {
            wordCount[w] = (wordCount[w] || 0) + 1;
          }
        });
    });
  });
  var topWords = Object.keys(wordCount)
    .sort(function(a, b) { return wordCount[b] - wordCount[a]; })
    .slice(0, 10);

  /* ── Longest chat ─────────────────────────────────────────── */
  var longestChat = null;
  history.forEach(function(item) {
    var count = item.messages ? Math.floor(item.messages.length / 2) : 0;
    if (!longestChat || count > Math.floor(longestChat.messages.length / 2)) {
      longestChat = item;
    }
  });

  /* ── Day-of-week distribution ─────────────────────────────── */
  var dowLabels = ['Dim','Lun','Mar','Mer','Jeu','Ven','Sam'];
  var dowCounts = [0,0,0,0,0,0,0];
  history.forEach(function(item) {
    if (item.messages && item.messages[0]) {
      dowCounts[new Date(item.messages[0].timestamp).getDay()]++;
    }
  });
  var maxDow = Math.max.apply(null, dowCounts) || 1;

  /* ── Empty state ──────────────────────────────────────────── */
  if (totalChats === 0) {
    return (
      <div className="dashboard-empty">
        <div className="empty-state-icon">📊</div>
        <p className="empty-state-text">
          Aucune donnée pour l'instant.<br />
          Commencez à interpréter vos rêves !
        </p>
      </div>
    );
  }

  /* ── Render ───────────────────────────────────────────────── */
  return (
    <div className="dashboard">
      <div className="dashboard-inner">

        <h2 className="dashboard-title">Tableau de bord</h2>

        {/* KPI cards */}
        <div className="kpi-grid">
          <div className="kpi-card">
            <span className="kpi-icon">🌙</span>
            <span className="kpi-value">{totalChats}</span>
            <span className="kpi-label">Rêves analysés</span>
          </div>
          <div className="kpi-card">
            <span className="kpi-icon">💬</span>
            <span className="kpi-value">{totalMessages}</span>
            <span className="kpi-label">Messages échangés</span>
          </div>
          <div className="kpi-card">
            <span className="kpi-icon">🔁</span>
            <span className="kpi-value">{avgExchanges}</span>
            <span className="kpi-label">Moy. échanges / rêve</span>
          </div>
          <div className="kpi-card">
            <span className="kpi-icon">📅</span>
            <span className="kpi-value">{activeDays}</span>
            <span className="kpi-label">Jours actifs</span>
          </div>
        </div>

        <div className="dashboard-row">

          {/* Activity last 14 days */}
          <div className="dash-card activity-card">
            <h3 className="dash-card-title">Activité — 14 derniers jours</h3>
            <div className="bar-chart">
              {activityData.map(function(d, idx) {
                var heightPct = (d.count / maxActivity) * 100;
                var date      = new Date(d.label);
                var dayLbl    = date.toLocaleDateString('fr-FR', { day:'numeric', month:'short' });
                return (
                  <div key={idx} className="bar-col">
                    <div className="bar-track">
                      <div className="bar-fill" style={{ height: heightPct + '%' }}
                        title={d.count + ' rêve(s)'} />
                    </div>
                    <span className="bar-label">{dayLbl}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Top keywords */}
          <div className="dash-card keywords-card">
            <h3 className="dash-card-title">Mots les plus fréquents</h3>
            {topWords.length > 0 ? (
              <div className="keywords-list">
                {topWords.map(function(word, idx) {
                  var pct = Math.round((wordCount[word] / wordCount[topWords[0]]) * 100);
                  return (
                    <div key={word} className="keyword-row">
                      <span className="keyword-rank">#{idx + 1}</span>
                      <span className="keyword-word">{word}</span>
                      <div className="keyword-bar-track">
                        <div className="keyword-bar-fill" style={{ width: pct + '%' }} />
                      </div>
                      <span className="keyword-count">{wordCount[word]}</span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="dash-empty-hint">Pas encore assez de données</p>
            )}
          </div>

        </div>

        <div className="dashboard-row">

          {/* Day-of-week distribution */}
          <div className="dash-card dow-card">
            <h3 className="dash-card-title">Répartition par jour</h3>
            <div className="dow-chart">
              {dowLabels.map(function(lbl, idx) {
                var heightPct = (dowCounts[idx] / maxDow) * 100;
                return (
                  <div key={lbl} className="bar-col">
                    <div className="bar-track">
                      <div className="bar-fill dow-fill" style={{ height: heightPct + '%' }}
                        title={dowCounts[idx] + ' rêve(s)'} />
                    </div>
                    <span className="bar-label">{lbl}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Longest chat */}
          {longestChat && Math.floor(longestChat.messages.length / 2) >= 1 && (
            <div className="dash-card longest-card">
              <h3 className="dash-card-title">Rêve le plus long</h3>
              <div className="longest-inner">
                <span className="longest-icon">🏆</span>
                <div className="longest-info">
                  <span className="longest-title">{longestChat.title}</span>
                  <span className="longest-meta">
                    {Math.floor(longestChat.messages.length / 2)} échange{Math.floor(longestChat.messages.length / 2) > 1 ? 's' : ''} &middot;&nbsp;
                    {new Date(longestChat.messages[0].timestamp).toLocaleDateString('fr-FR', { day:'numeric', month:'long', year:'numeric' })}
                  </span>
                </div>
              </div>
              <div className="longest-preview">
                "{longestChat.messages.find(function(m) { return m.isUser; }) &&
                  longestChat.messages.find(function(m) { return m.isUser; }).text.slice(0, 120)}
                {longestChat.messages.find(function(m) { return m.isUser; }) &&
                  longestChat.messages.find(function(m) { return m.isUser; }).text.length > 120 ? '…' : ''}"
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default Dashboard;
