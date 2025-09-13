import React, { useEffect, useState } from "react";
import { io } from "socket.io-client";
import AssistantAvatar from "./components/AssistantAvatar";
import TimelineChat from "./components/TimelineChat";

const socket = io("http://localhost:5000");

function App() {
  const [messages, setMessages] = useState([]);

  useEffect(() => {
    socket.on("chat", (msg) => {
      setMessages((prev) => [...prev, msg]);
    });
    return () => socket.off("chat");
  }, []);

  const sendMessage = (msg) => {
    socket.emit("chat", msg);
    setMessages((prev) => [...prev, { sender: "patient", text: msg }]);
  };

  return (
    <div style={{ background: "#f0f4fa", minHeight: "100vh" }}>
      <AssistantAvatar />
      <TimelineChat
        messages={messages}
        onSend={sendMessage}
      />
    </div>
  );
}

export default App;
