import { useState } from "react";
import axios from "axios";
import "./App.css";

function App() {
  const [input, setInput] = useState("");
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  const handleSubmit = async () => {
    try {
      setError("");
      setResult(null);

      const formattedData = input
        .split(",")
        .map((item) => item.trim())
        .filter((item) => item !== "");

      const response = await axios.post("http://localhost:3000/bfhl", {
        data: formattedData,
      });

      setResult(response.data);
    } catch (err) {
      setError("Failed to fetch API response");
    }
  };

  return (
    <div className="app">
      <div className="container">
        <h1>🌳 Hierarchy Builder</h1>
        <p>Enter node relationships separated by commas</p>

        <textarea
          placeholder="A->B, A->C, B->D"
          value={input}
          onChange={(e) => setInput(e.target.value)}
        />

        <button onClick={handleSubmit}>Build Hierarchy</button>

        {error && <div className="error">{error}</div>}

        {result && (
          <div className="response-box">
            <h2>📄 API Response</h2>
            <pre>{JSON.stringify(result, null, 2)}</pre>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;