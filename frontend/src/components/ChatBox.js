import React, { useState, useEffect, useRef } from "react";
import { sendMessageToApi } from "../services/api";

/* ── canvas helpers ───────────────────────────────────────────────────── */
function wrapCanvasText(ctx, text, maxWidth) {
  var words = text.split(" ");
  var lines = [];
  var line  = "";
  for (var i = 0; i < words.length; i++) {
    var test = line + words[i] + " ";
    if (ctx.measureText(test).width > maxWidth && line !== "") {
      lines.push(line.trim());
      line = words[i] + " ";
    } else {
      line = test;
    }
  }
  if (line.trim()) lines.push(line.trim());
  return lines;
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

function downloadStory(discussion) {
  /* pick first user message and first bot response from the messages array */
  var msgs     = discussion.messages || [discussion.userMessage, discussion.botMessage].filter(Boolean);
  var dreamMsg = msgs.find(function(m) { return m.isUser; })   || msgs[0];
  var interpMsg= msgs.find(function(m) { return !m.isUser; })  || msgs[1];

  var W = 1080, H = 1920;
  var canvas = document.createElement("canvas");
  canvas.width  = W;
  canvas.height = H;
  var ctx = canvas.getContext("2d");

  /* background */
  var bg = ctx.createLinearGradient(0, 0, W, H);
  bg.addColorStop(0, "#05071e");
  bg.addColorStop(0.5, "#0d0c2b");
  bg.addColorStop(1, "#07101e");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  var g1 = ctx.createRadialGradient(W*0.2, H*0.3, 0, W*0.2, H*0.3, W*0.55);
  g1.addColorStop(0, "rgba(124,58,237,0.38)"); g1.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = g1; ctx.fillRect(0, 0, W, H);

  var g2 = ctx.createRadialGradient(W*0.8, H*0.7, 0, W*0.8, H*0.7, W*0.4);
  g2.addColorStop(0, "rgba(59,130,246,0.22)"); g2.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = g2; ctx.fillRect(0, 0, W, H);

  /* stars */
  [[80,150],[200,400],[350,100],[500,300],[700,80],[900,250],[150,600],
   [450,500],[800,450],[1000,700],[300,800],[600,900],[100,1000],
   [850,1100],[400,1200],[750,1300],[200,1400],[950,1500],[500,1600],
   [300,1750],[700,1820],[180,1860],[880,200],[630,650],[260,1100]
  ].forEach(function(s) {
    var r = Math.random() * 2 + 0.8;
    ctx.beginPath(); ctx.arc(s[0], s[1], r, 0, Math.PI*2);
    ctx.fillStyle = "rgba(255,255,255,"+(Math.random()*0.5+0.4)+")"; ctx.fill();
  });

  /* title card */
  ctx.fillStyle = "rgba(255,255,255,0.05)";
  roundRect(ctx, 80, 90, W-160, 180, 24); ctx.fill();
  ctx.strokeStyle = "rgba(124,58,237,0.35)"; ctx.lineWidth = 1.5;
  roundRect(ctx, 80, 90, W-160, 180, 24); ctx.stroke();
  ctx.font = "bold 52px Georgia,serif"; ctx.fillStyle = "#c4b5fd";
  ctx.textAlign = "center"; ctx.fillText("✶ Interprétation des Rêves ✶", W/2, 200);

  /* dream card */
  ctx.fillStyle = "rgba(255,255,255,0.04)";
  roundRect(ctx, 80, 330, W-160, 580, 20); ctx.fill();
  ctx.strokeStyle = "rgba(255,255,255,0.08)"; ctx.lineWidth = 1;
  roundRect(ctx, 80, 330, W-160, 580, 20); ctx.stroke();
  ctx.font = "600 36px Arial,sans-serif"; ctx.fillStyle = "#94a3b8"; ctx.textAlign = "left";
  ctx.fillText("🌙  Mon Rêve", 140, 400);
  ctx.strokeStyle = "rgba(124,58,237,0.4)"; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(140, 425); ctx.lineTo(W-140, 425); ctx.stroke();
  ctx.font = "italic 40px Georgia,serif"; ctx.fillStyle = "#f1f5f9";
  var dreamLines = wrapCanvasText(ctx, "“" + dreamMsg.text + "”", W-280);
  var y = 490;
  dreamLines.forEach(function(l) { ctx.fillText(l, 140, y); y += 60; });

  /* interpretation card */
  var it = 980;
  ctx.fillStyle = "rgba(124,58,237,0.08)";
  roundRect(ctx, 80, it, W-160, 640, 20); ctx.fill();
  ctx.strokeStyle = "rgba(124,58,237,0.3)"; ctx.lineWidth = 1.5;
  roundRect(ctx, 80, it, W-160, 640, 20); ctx.stroke();
  ctx.font = "600 36px Arial,sans-serif"; ctx.fillStyle = "#94a3b8";
  ctx.fillText("💫  Interprétation", 140, it+72);
  ctx.strokeStyle = "rgba(124,58,237,0.4)"; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(140, it+98); ctx.lineTo(W-140, it+98); ctx.stroke();
  ctx.font = "38px Arial,sans-serif"; ctx.fillStyle = "#c4b5fd";
  var iLines = wrapCanvasText(ctx, interpMsg ? interpMsg.text : "", W-280);
  var iy = it+158;
  iLines.forEach(function(l) { ctx.fillText(l, 140, iy); iy += 58; });

  /* footer */
  ctx.font = "30px Arial,sans-serif"; ctx.fillStyle = "#475569"; ctx.textAlign = "center";
  var date = new Date(dreamMsg.timestamp).toLocaleDateString("fr-FR", { day:"numeric", month:"long", year:"numeric" });
  ctx.fillText(date, W/2, 1730);
  ctx.font = "bold 34px Arial,sans-serif"; ctx.fillStyle = "rgba(124,58,237,0.7)";
  ctx.fillText("✶  Dreamex", W/2, 1820);

  canvas.toBlob(function(blob) {
    var url = URL.createObjectURL(blob);
    var a = document.createElement("a");
    a.href = url; a.download = "story_"+Date.now()+".png"; a.click();
    URL.revokeObjectURL(url);
  }, "image/png");
}

/* ── migration: old items had {userMessage, botMessage} not {messages:[]} ─ */
function migrateItem(item, i) {
  var base = item.id ? item : Object.assign({}, item, { id: Date.now() + i });
  if (!base.messages) {
    base.messages = [base.userMessage, base.botMessage].filter(Boolean);
  }
  return base;
}

/* ── ChatBox ──────────────────────────────────────────────────────────── */
const ChatBox = () => {
  const [messages, setMessages]                   = useState([]);
  const [input, setInput]                         = useState("");
  const [chatHistory, setChatHistory]             = useState([]);
  const [isHistoryVisible, setIsHistoryVisible]   = useState(false);
  const [searchTerm, setSearchTerm]               = useState("");
  const [selectedDiscussion, setSelectedDiscussion] = useState(null);
  const [isLoading, setIsLoading]                 = useState(false);
  const [currentHistoryId, setCurrentHistoryId]   = useState(null); // tracks active session

  const [editingId, setEditingId]     = useState(null);
  const [editingTitle, setEditingTitle] = useState("");
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [storyTarget, setStoryTarget] = useState(null);
  const [isListening, setIsListening] = useState(false);
  const [voiceSupported]              = useState(function() {
    return !!(window.SpeechRecognition || window.webkitSpeechRecognition);
  });
  const [voiceLang, setVoiceLang]     = useState(function() {
    var saved = localStorage.getItem("voiceLang");
    if (saved) return saved;
    var nav = (navigator.language || "").toLowerCase();
    if (nav.startsWith("fr")) return "fr-FR";
    if (nav.startsWith("ar")) return "ar-SA";
    return "en-US";
  });

  const messagesEndRef  = useRef(null);
  const renameInputRef  = useRef(null);
  const recognitionRef  = useRef(null);

  /* ── voice ───────────────────────────────────────────────────────── */
  const startListening = function() {
    if (!voiceSupported) return;

    if (isListening) {
      if (recognitionRef.current) recognitionRef.current.stop();
      setIsListening(false);
      return;
    }

    var SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    var recognition = new SR();
    recognition.lang = voiceLang;
    recognition.continuous = false;
    recognition.interimResults = true;

    recognition.onstart = function() { setIsListening(true); };

    recognition.onresult = function(event) {
      var transcript = "";
      for (var i = event.resultIndex; i < event.results.length; i++) {
        transcript += event.results[i][0].transcript;
      }
      setInput(transcript);
    };

    recognition.onend = function() { setIsListening(false); };
    recognition.onerror = function() { setIsListening(false); };

    recognitionRef.current = recognition;
    recognition.start();
  };

  useEffect(function() {
    localStorage.setItem("voiceLang", voiceLang);
  }, [voiceLang]);

  /* ── persist ─────────────────────────────────────────────────────── */
  useEffect(function() {
    try {
      var stored = JSON.parse(localStorage.getItem("chatHistory")) || [];
      setChatHistory(stored.map(migrateItem));
    } catch(e) {
      localStorage.removeItem("chatHistory");
      setChatHistory([]);
    }
  }, []);

  useEffect(function() {
    localStorage.setItem("chatHistory", JSON.stringify(chatHistory));
  }, [chatHistory]);

  useEffect(function() {
    if (messagesEndRef.current) messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  useEffect(function() {
    if (editingId !== null && renameInputRef.current) {
      renameInputRef.current.focus();
      renameInputRef.current.select();
    }
  }, [editingId]);

  /* ── send ────────────────────────────────────────────────────────── */
  const handleSendMessage = async function() {
    var userInput = input.trim();
    if (!userInput || isLoading) return;

    var userMsg = { text: userInput, isUser: true, timestamp: new Date() };
    var nextMessages = messages.concat(userMsg);
    setMessages(nextMessages);
    setInput("");
    setIsLoading(true);

    try {
      var data = await sendMessageToApi(userInput);
      var botMsg = { text: data.response, isUser: false, timestamp: new Date() };
      var allMessages = nextMessages.concat(botMsg);
      setMessages(allMessages);

      if (messages.length === 0) {
        /* first exchange → create history item */
        var newId = Date.now();
        var title = "Rêve de " + userInput.split(" ").slice(0, 3).join(" ");
        setChatHistory(function(prev) {
          return prev.concat({ id: newId, title: title, messages: allMessages });
        });
        setCurrentHistoryId(newId);
      } else if (currentHistoryId) {
        /* subsequent exchanges → update existing item */
        setChatHistory(function(prev) {
          return prev.map(function(item) {
            return item.id === currentHistoryId
              ? Object.assign({}, item, { messages: allMessages })
              : item;
          });
        });
      }
    } catch(e) {
      setMessages(function(prev) {
        return prev.concat({ text: "Une erreur est survenue. Veuillez réessayer.", isUser: false, timestamp: new Date() });
      });
    } finally {
      setIsLoading(false);
    }
  };

  /* ── rename ──────────────────────────────────────────────────────── */
  const startRename = function(e, id, currentTitle) {
    e.stopPropagation();
    setEditingId(id);
    setEditingTitle(currentTitle);
  };

  const commitRename = function() {
    if (editingTitle.trim()) {
      setChatHistory(function(prev) {
        return prev.map(function(item) {
          return item.id === editingId ? Object.assign({}, item, { title: editingTitle.trim() }) : item;
        });
      });
    }
    setEditingId(null);
  };

  const handleRenameKey = function(e) {
    if (e.key === "Enter")  commitRename();
    if (e.key === "Escape") setEditingId(null);
  };

  /* ── delete ──────────────────────────────────────────────────────── */
  const deleteOne = function(e, id) {
    e.stopPropagation();
    setChatHistory(function(prev) { return prev.filter(function(item) { return item.id !== id; }); });
    setSelectedIds(function(prev) { var n = new Set(prev); n.delete(id); return n; });
    if (selectedDiscussion && selectedDiscussion.id === id) setSelectedDiscussion(null);
    if (currentHistoryId === id) setCurrentHistoryId(null);
  };

  const deleteSelected = function() {
    setChatHistory(function(prev) { return prev.filter(function(item) { return !selectedIds.has(item.id); }); });
    setSelectedIds(new Set());
  };

  /* ── select ──────────────────────────────────────────────────────── */
  const toggleSelect = function(e, id) {
    e.stopPropagation();
    setSelectedIds(function(prev) {
      var n = new Set(prev);
      if (n.has(id)) n.delete(id); else n.add(id);
      return n;
    });
  };

  const selectAll    = function() { setSelectedIds(new Set(filteredHistory.map(function(d) { return d.id; }))); };
  const clearSelection = function() { setSelectedIds(new Set()); };

  /* ── export ──────────────────────────────────────────────────────── */
  const exportItems = function(items) {
    var dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(items, null, 2));
    var a = document.createElement("a");
    a.setAttribute("href", dataStr);
    a.setAttribute("download", "reves_" + Date.now() + ".json");
    a.click(); a.remove();
  };

  /* ── misc ────────────────────────────────────────────────────────── */
  const startNewDiscussion = function() {
    setMessages([]);
    setSelectedDiscussion(null);
    setCurrentHistoryId(null);
    /* messages already saved incrementally in chatHistory */
  };

  const clearHistory = function() {
    setChatHistory([]);
    setSelectedIds(new Set());
    setCurrentHistoryId(null);
    localStorage.removeItem("chatHistory");
  };

  const selectDiscussion = function(discussion) {
    setSelectedDiscussion(discussion);
    setIsHistoryVisible(false);
  };

  const toggleHistory = function() {
    setIsHistoryVisible(function(v) { return !v; });
    setSelectedDiscussion(null);
  };

  /* ── derived ─────────────────────────────────────────────────────── */
  var filteredHistory = chatHistory
    .filter(function(chat) {
      var q = searchTerm.toLowerCase();
      if (chat.title && chat.title.toLowerCase().includes(q)) return true;
      if (chat.messages) return chat.messages.some(function(m) { return m.text.toLowerCase().includes(q); });
      return chat.userMessage && chat.userMessage.text.toLowerCase().includes(q);
    })
    .sort(function(a, b) {
      var ta = a.messages && a.messages[0] ? a.messages[0].timestamp : (a.userMessage ? a.userMessage.timestamp : 0);
      var tb = b.messages && b.messages[0] ? b.messages[0].timestamp : (b.userMessage ? b.userMessage.timestamp : 0);
      return new Date(tb) - new Date(ta);
    })
    .slice(0, 20);

  var selCount       = selectedIds.size;
  var selectedItems  = chatHistory.filter(function(item) { return selectedIds.has(item.id); });

  /* messages to display in chat area */
  var displayMessages = selectedDiscussion
    ? (selectedDiscussion.messages || [selectedDiscussion.userMessage, selectedDiscussion.botMessage].filter(Boolean))
    : messages;

  /* first timestamp for a discussion */
  function firstTimestamp(d) {
    if (d.messages && d.messages[0]) return d.messages[0].timestamp;
    if (d.userMessage) return d.userMessage.timestamp;
    return new Date();
  }

  /* ── render ─────────────────────────────────────────────────────── */
  return (
    <div className="chat-box-container">

      {/* Story modal */}
      {storyTarget && (
        <div className="story-modal-overlay" onClick={function() { setStoryTarget(null); }}>
          <div className="story-modal" onClick={function(e) { e.stopPropagation(); }}>
            <div className="story-preview">
              <div className="story-header">
                <span className="story-header-title">✦ Interprétation des Rêves ✦</span>
              </div>
              {(function() {
                var msgs      = storyTarget.messages || [storyTarget.userMessage, storyTarget.botMessage].filter(Boolean);
                var dreamMsg  = msgs.find(function(m) { return m.isUser; });
                var interpMsg = msgs.find(function(m) { return !m.isUser; });
                return (
                  <React.Fragment>
                    <div className="story-section">
                      <span className="story-label">🌙 Mon Rêve</span>
                      <p className="story-dream-text">"{dreamMsg ? dreamMsg.text : ""}"</p>
                    </div>
                    <div className="story-divider" />
                    <div className="story-section story-interp-section">
                      <span className="story-label">💫 Interprétation</span>
                      <p className="story-interp-text">{interpMsg ? interpMsg.text : ""}</p>
                    </div>
                  </React.Fragment>
                );
              })()}
              <div className="story-footer">
                <span className="story-date">
                  {new Date(firstTimestamp(storyTarget)).toLocaleDateString("fr-FR", { day:"numeric", month:"long", year:"numeric" })}
                </span>
                <span className="story-brand">✦ Dreamex</span>
              </div>
            </div>
            <div className="story-actions">
              <button className="story-btn download-btn" onClick={function() { downloadStory(storyTarget); }}>
                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3" />
                </svg>
                Télécharger PNG
              </button>
              <button className="story-btn close-btn" onClick={function() { setStoryTarget(null); }}>Fermer</button>
            </div>
          </div>
        </div>
      )}

      {/* Sidebar */}
      <div className={"history-container" + (isHistoryVisible ? "" : " collapsed")}>
        <div className="sidebar-top">
          {isHistoryVisible && <span className="sidebar-title">Historique</span>}
          <button onClick={toggleHistory} className="history-toggle-button" title={isHistoryVisible ? "Réduire" : "Historique"}>
            {isHistoryVisible ? (
              <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M15 18l-6-6 6-6" /></svg>
            ) : (
              <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M9 18l6-6-6-6" /></svg>
            )}
          </button>
        </div>

        {isHistoryVisible && (
          <div className="sidebar-content">
            <input type="text" value={searchTerm}
              onChange={function(e) { setSearchTerm(e.target.value); }}
              placeholder="Rechercher un rêve..." className="history-search" />

            {selCount > 0 && (
              <div className="selection-bar">
                <span className="selection-count">{selCount} sélectionné{selCount > 1 ? "s" : ""}</span>
                <div className="selection-actions">
                  <button className="sel-action-btn" title="Tout sélectionner" onClick={selectAll}>
                    <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="9 11 12 14 22 4" /><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" /></svg>
                  </button>
                  <button className="sel-action-btn export-sel-btn" title="Exporter la sélection" onClick={function() { exportItems(selectedItems); }}>
                    <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3" /></svg>
                  </button>
                  <button className="sel-action-btn delete-sel-btn" title="Supprimer la sélection" onClick={deleteSelected}>
                    <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14H6L5 6" /><path d="M10 11v6M14 11v6" /></svg>
                  </button>
                  <button className="sel-action-btn" title="Désélectionner" onClick={clearSelection}>
                    <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                  </button>
                </div>
              </div>
            )}

            <div className="history-list-container">
              {selCount === 0 && <div className="history-list-label">Discussions récentes</div>}
              <ul className="history-list">
                {filteredHistory.length > 0 ? (
                  filteredHistory.map(function(discussion) {
                    var isSelected = selectedIds.has(discussion.id);
                    var isEditing  = editingId === discussion.id;
                    var msgCount   = discussion.messages ? Math.floor(discussion.messages.length / 2) : 1;
                    return (
                      <li key={discussion.id}
                        className={"history-item" + (isSelected ? " selected" : "")}
                        onClick={function() {
                          if (isEditing) return;
                          if (selCount > 0) {
                            setSelectedIds(function(prev) {
                              var n = new Set(prev);
                              if (n.has(discussion.id)) n.delete(discussion.id); else n.add(discussion.id);
                              return n;
                            });
                          } else {
                            selectDiscussion(discussion);
                          }
                        }}>

                        <button className={"item-checkbox" + (isSelected ? " checked" : "")}
                          onClick={function(e) { toggleSelect(e, discussion.id); }} title="Sélectionner">
                          {isSelected && (
                            <svg viewBox="0 0 24 24" width="10" height="10" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round"><polyline points="20 6 9 17 4 12" /></svg>
                          )}
                        </button>

                        <div className="item-body">
                          {isEditing ? (
                            <input ref={renameInputRef} className="rename-input" value={editingTitle}
                              onChange={function(e) { setEditingTitle(e.target.value); }}
                              onKeyDown={handleRenameKey} onBlur={commitRename}
                              onClick={function(e) { e.stopPropagation(); }} />
                          ) : (
                            <span className="history-item-title">{discussion.title}</span>
                          )}
                          <div className="item-meta">
                            <span className="history-item-date">
                              {new Date(firstTimestamp(discussion)).toLocaleDateString("fr-FR", { day:"numeric", month:"short" })}
                            </span>
                            {msgCount > 1 && (
                              <span className="item-msg-count">{msgCount} échanges</span>
                            )}
                          </div>
                        </div>

                        {!isEditing && (
                          <div className="item-actions">
                            <button className="item-action-btn rename-btn" title="Renommer"
                              onClick={function(e) { startRename(e, discussion.id, discussion.title); }}>
                              <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>
                            </button>
                            <button className="item-action-btn story-icon-btn" title="Story Instagram"
                              onClick={function(e) { e.stopPropagation(); setStoryTarget(discussion); }}>
                              <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5" /><circle cx="12" cy="12" r="4" /><circle cx="18" cy="6" r="1" fill="currentColor" /></svg>
                            </button>
                            <button className="item-action-btn export-icon-btn" title="Exporter"
                              onClick={function(e) { e.stopPropagation(); exportItems([discussion]); }}>
                              <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3" /></svg>
                            </button>
                            <button className="item-action-btn delete-icon-btn" title="Supprimer"
                              onClick={function(e) { deleteOne(e, discussion.id); }}>
                              <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14H6L5 6" /></svg>
                            </button>
                          </div>
                        )}
                      </li>
                    );
                  })
                ) : (
                  <p className="history-empty">Aucune discussion pour l'instant</p>
                )}
              </ul>
            </div>

            <div className="sidebar-buttons">
              <button onClick={startNewDiscussion} className="sidebar-btn new-btn">
                <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M12 5v14M5 12h14" /></svg>
                Nouveau rêve
              </button>
              <button onClick={function() { exportItems(chatHistory); }} className="sidebar-btn">
                <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3" /></svg>
                Exporter tout
              </button>
              <button onClick={clearHistory} className="sidebar-btn clear-btn">
                <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14H6L5 6" /><path d="M10 11v6M14 11v6" /></svg>
                Effacer tout
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Chat area */}
      <div className="chat-container">
        <div className="dialogue-box">
          {displayMessages.length === 0 && !isLoading ? (
            <div className="empty-state">
              <div className="empty-state-icon">🌙</div>
              <p className="empty-state-text">Partagez votre rêve et découvrez ce que votre subconscient vous révèle</p>
            </div>
          ) : (
            <React.Fragment>
              {displayMessages.map(function(msg, index) {
                return (
                  <div key={index} className={msg.isUser ? "user-message" : "bot-message"}>
                    {msg.text}
                  </div>
                );
              })}
              {isLoading && (
                <div className="bot-message">
                  <div className="typing-indicator">
                    <div className="typing-dot" /><div className="typing-dot" /><div className="typing-dot" />
                  </div>
                </div>
              )}
            </React.Fragment>
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className="user-input">
          <input type="text" value={input}
            onChange={function(e) { setInput(e.target.value); }}
            onKeyDown={function(e) { if (e.key === "Enter") handleSendMessage(); }}
            placeholder={isListening ? "En écoute..." : selectedDiscussion ? "Lecture seule — ouvrez un nouveau rêve pour continuer" : "Décrivez votre rêve..."}
            disabled={!!selectedDiscussion || isLoading} />
          {voiceSupported && (
            <div className="voice-controls">
              <div className="voice-lang-selector">
                {[["fr-FR","FR"],["en-US","EN"],["ar-SA","عر"]].map(function(pair) {
                  return (
                    <button
                      key={pair[0]}
                      className={"lang-pill" + (voiceLang === pair[0] ? " active" : "")}
                      onClick={function() { setVoiceLang(pair[0]); }}
                      disabled={isListening}
                      title={pair[0]}
                    >{pair[1]}</button>
                  );
                })}
              </div>
              <button
                className={"mic-button" + (isListening ? " listening" : "")}
                onClick={startListening}
                disabled={!!selectedDiscussion || isLoading}
                title={isListening ? "Arrêter l'écoute" : "Parler"}
              >
              {isListening ? (
                <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
                  <rect x="6" y="6" width="12" height="12" rx="2" />
                </svg>
              ) : (
                <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3z" />
                  <path d="M19 10v2a7 7 0 01-14 0v-2M12 19v4M8 23h8" />
                </svg>
              )}
            </button>
          </div>
          )}
          <button className="send-button" onClick={handleSendMessage}
            disabled={!!selectedDiscussion || isLoading || !input.trim()} title="Envoyer">
            <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" /></svg>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatBox;
