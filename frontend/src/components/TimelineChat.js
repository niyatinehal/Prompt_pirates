import React, { useState } from "react";

const TimelineChat = ({ messages, onSend }) => {
  const [input, setInput] = useState("");

  const handleSend = () => {
    if (input.trim()) {
      onSend(input);
      setInput("");
    }
  };

  return (
    <div
      style={{
        maxWidth: 500,
        margin: "40px auto",
        background: "#fff",
        borderRadius: 12,
        boxShadow: "0 2px 8px #ccc",
        padding: 24,
      }}
    >
      <div style={{ marginBottom: 16 }}>
        {messages.map((msg, idx) => (
          <div
            key={idx}
            style={{
              textAlign: msg.sender === "patient" ? "right" : "left",
              margin: "8px 0",
            }}
          >
            <span
              style={{
                background: msg.sender === "patient" ? "#d1e7dd" : "#e2e3e5",
                padding: "8px 16px",
                borderRadius: 8,
              }}
            >
              {msg.text}
            </span>
          </div>
        ))}
      </div>
      <div style={{ display: "flex" }}>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          style={{
            flex: 1,
            padding: 8,
            borderRadius: 8,
            border: "1px solid #ccc",
          }}
          placeholder="Type your message..."
        />
        <button
          onClick={handleSend}
          style={{
            marginLeft: 8,
            padding: "8px 16px",
            borderRadius: 8,
            background: "#1976d2",
            color: "#fff",
            border: "none",
          }}
        >
          Send
        </button>
      </div>
    </div>
  );
};

export default TimelineChat;
