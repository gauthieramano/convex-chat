import { faker } from "@faker-js/faker";
import { useMutation, useQuery } from "convex/react";
import { useEffect, useState } from "react";
import { api } from "../convex/_generated/api";

// For demo purposes. In a real app, you'd have real user data.
const NAME = getOrSetFakeName();

export default function App() {
  const [newMessageText, setNewMessageText] = useState("");
  const [nameFilter, setNameFilter] = useState("");

  const messages = useQuery(api.chat.fetchMessages, { nameFilter });
  const sendMessage = useMutation(api.chat.sendMessage);

  // biome-ignore lint/correctness/useExhaustiveDependencies: scroll when new messages
  useEffect(() => {
    // Make sure scrollTo works on button click in Chrome
    setTimeout(() => {
      window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" });
    }, 0);
  }, [messages]);

  return (
    <main className="chat">
      <header>
        <h1>Convex Chat</h1>
        <p>
          Connected as <strong>{NAME}</strong>
        </p>
        <div className="name-filter">
          <input
            type="text"
            value={nameFilter}
            onChange={(e) => setNameFilter(e.target.value)}
            placeholder="Filter messages by name…"
            className="filter-input"
          />
        </div>
      </header>
      {messages?.map((message) => (
        <article
          key={message._id}
          className={message.user === NAME ? "message-mine" : ""}
        >
          <div>{message.user}</div>

          <p>{message.body}</p>
        </article>
      ))}
      <form
        onSubmit={async (e) => {
          e.preventDefault();

          await sendMessage({ user: NAME, body: newMessageText });

          setNewMessageText("");
        }}
      >
        <input
          value={newMessageText}
          onChange={async (e) => {
            const text = e.target.value;
            setNewMessageText(text);
          }}
          placeholder="Write a message…"
        />
        <button type="submit" disabled={!newMessageText}>
          Send
        </button>
      </form>
    </main>
  );
}

function getOrSetFakeName() {
  const nameKey = "tutorial_name";
  const name = sessionStorage.getItem(nameKey);
  if (!name) {
    const newName = faker.person.firstName();
    sessionStorage.setItem(nameKey, newName);
    return newName;
  }
  return name;
}
