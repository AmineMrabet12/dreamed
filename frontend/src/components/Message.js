// src/components/Message.js
import React from 'react';

const Message = ({ text, isUser }) => {
  return (
    <div className={`message ${isUser ? 'user' : 'bot'}`}>
      <p>{text}</p>
    </div>
  );
};

export default Message;
