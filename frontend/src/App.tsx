import { useState, useEffect } from "react";

export default function App() {
  const [input, setInput] = useState("");
  const [history, setHistory] = useState<{ expr: string; result: string }[]>([]);
  const [loading, setLoading] = useState(false);

  function append(value: string) {
    if (["sin", "cos", "tan", "log", "ln"].includes(value)) {
      setInput((prev) => prev + value + "(");
    } else {
      setInput((prev) => prev + value);
    }
  }

  function clear() {
    setInput("");
  }

  function backspace() {
    setInput((prev) => prev.slice(0, -1));
  }

  async function submit() {
    if (!input.trim()) return;

    setLoading(true);

    try {
      const res = await fetch("http://localhost:5000/evaluate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ payload: input }),
      });

      const data = await res.json();
      const value = typeof data === "number" ? data.toString() : String(data);

      setHistory((prev) => [...prev, { expr: input, result: value }]);
      setInput("");
    } catch (err) {
      setHistory((prev) => [
        ...prev,
        { expr: input, result: `Error contacting server ${err}` },
      ]);
    }

    setLoading(false);
  }

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Enter") {
        submit();
        return;
      }

      const allowed = "0123456789.+-*/^()";

      if (allowed.includes(e.key)) {
        setInput((prev) => prev + e.key);
      }

      if (e.key === "Backspace") {
        setInput((prev) => prev.slice(0, -1));
      }
    }

    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [input]);

  const styles: { [key: string]: React.CSSProperties } = {
    page: {
      width: "100vw",
      height: "100vh",
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      background: "linear-gradient(135deg,#dbeafe,#e9d5ff,#fbcfe8)",
      fontFamily: "sans-serif",
    },

    calculator: {
      width: "90vw",
      height: "90vh",
      maxWidth: 1200,
      background: "white",
      borderRadius: 24,
      padding: 30,
      boxShadow: "0 15px 40px rgba(0,0,0,0.2)",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "flex-start",
      gap: 30,
    },

    screen: {
      width: "100%",
      background: "#e2e8f0",
      borderRadius: 16,
      padding: 16,
      boxShadow: "inset 0 3px 8px rgba(0,0,0,0.15)",
      border: "1px solid #cbd5e1",
    },

    input: {
      textAlign: "right",
      fontSize: 34,
      color: "#0f172a",
      background: "#f8fafc",
      padding: "12px 14px",
      borderRadius: 10,
      marginBottom: 12,
      minHeight: 44,
      fontFamily: "monospace",
      border: "1px solid #cbd5e1",
    },

    history: {
      background: "#f8fafc",
      borderRadius: 10,
      border: "1px solid #cbd5e1",
      padding: 12,
      maxHeight: "25vh",
      overflowY: "auto",
      fontSize: 18,
      color: "#0f172a",
    },

    historyEntry: {
      marginBottom: 14,
      paddingBottom: 6,
      borderBottom: "1px solid #e2e8f0",
    },

    expr: {
      textAlign: "left",
      color: "#475569",
      fontFamily: "monospace",
    },

    result: {
      textAlign: "right",
      fontWeight: 700,
      fontSize: 20,
      color: "#0f172a",
      fontFamily: "monospace",
    },

    buttonArea: {
      display: "flex",
      gap: 60,
      justifyContent: "center",
      alignItems: "flex-start",
      width: "100%",
    },

    numberGrid: {
      display: "grid",
      gridTemplateColumns: "repeat(3,90px)",
      gap: 18,
    },

    operatorCol: {
      display: "flex",
      flexDirection: "column",
      gap: 18,
    },

    button: {
      width: 90,
      height: 70,
      borderRadius: 14,
      border: "none",
      cursor: "pointer",
      fontSize: 24,
      color: "#0f172a",
      boxShadow: "0 3px 8px rgba(0,0,0,0.25)",
    },

    numberButton: { background: "#bfdbfe" },
    operatorButton: { background: "#fbcfe8" },
    funcButton: { background: "#c7d2fe" },
    clearButton: { background: "#fecaca" },
    enterButton: { background: "#bbf7d0" },
    backButton: { background: "#fde68a" },

    funcRow: {
      display: "grid",
      gridTemplateColumns: "repeat(7,1fr)",
      gap: 18,
      width: "100%",
    },

    funcBtn: {
      height: 55,
      borderRadius: 12,
      border: "none",
      cursor: "pointer",
      fontSize: 18,
      color: "#0f172a",
      boxShadow: "0 3px 8px rgba(0,0,0,0.2)",
      background: "#c7d2fe",
      fontFamily: "monospace",
    },
  };

  const numbers = ["7", "8", "9", "4", "5", "6", "1", "2", "3"];
  const operators = ["+", "-", "*", "/", "^"];
  const functions = ["sin", "cos", "tan", "log", "ln", "pi", "e"];

  return (
    <div style={styles.page}>
      <div style={styles.calculator}>

        <div style={styles.screen}>
          <div style={styles.input}>{input}</div>

          <div style={styles.history}>
            {history.map((h, i) => (
              <div key={i} style={styles.historyEntry}>
                <div style={styles.expr}>{h.expr}</div>
                <div style={styles.result}>{h.result}</div>
              </div>
            ))}

            {loading && (
              <div style={{ textAlign: "right", color: "gray" }}>
                Computing...
              </div>
            )}
          </div>
        </div>

        <div style={styles.buttonArea}>
          <div style={styles.numberGrid}>
            {numbers.map((n) => (
              <button
                key={n}
                style={{ ...styles.button, ...styles.numberButton }}
                onClick={() => append(n)}
              >
                {n}
              </button>
            ))}

            <button
              style={{ ...styles.button, ...styles.numberButton, gridColumn: "span 3", width: "100%" }}
              onClick={() => append("0")}
            >
              0
            </button>

            <button
              style={{ ...styles.button, ...styles.numberButton }}
              onClick={() => append(".")}
            >
              .
            </button>

            <button
              style={{ ...styles.button, ...styles.funcButton }}
              onClick={() => append("(")}
            >
              (
            </button>

            <button
              style={{ ...styles.button, ...styles.funcButton }}
              onClick={() => append(")")}
            >
              )
            </button>
          </div>

          <div style={styles.operatorCol}>
            {operators.map((op) => (
              <button
                key={op}
                style={{ ...styles.button, ...styles.operatorButton }}
                onClick={() => append(op)}
              >
                {op}
              </button>
            ))}

            <button
              style={{ ...styles.button, ...styles.backButton }}
              onClick={backspace}
            >
              ⌫
            </button>

            <button
              style={{ ...styles.button, ...styles.clearButton }}
              onClick={clear}
            >
              C
            </button>

            <button
              style={{ ...styles.button, ...styles.enterButton }}
              onClick={submit}
            >
              =
            </button>
          </div>
        </div>

        <div style={styles.funcRow}>
          {functions.map((f) => (
            <button key={f} style={styles.funcBtn} onClick={() => append(f)}>
              {f}
            </button>
          ))}
        </div>

      </div>
    </div>
  );
}
