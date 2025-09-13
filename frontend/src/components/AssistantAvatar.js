import React from "react";
import Lottie from "lottie-react";
// import avatarAnimation from "../assets/assistant-avatar.json";

const AssistantAvatar = () => (
  <div style={{ width: 120, margin: "0 auto", textAlign: "center" }}>
    <span
      style={{ fontSize: 80, display: "block" }}
      role="img"
      aria-label="Doctor AI"
    >
      🩺🤖
    </span>
    <h2>Dr. AI Assistant</h2>
  </div>
);

export default AssistantAvatar;
