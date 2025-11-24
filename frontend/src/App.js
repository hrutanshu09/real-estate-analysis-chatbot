import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import {
  Container,
  Row,
  Col,
  Form,
  Button,
  Card,
  Spinner,
  Table,
} from "react-bootstrap";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from "recharts";

function App() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const chatEndRef = useRef(null);

  // Auto-scroll chat window
  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  const API_BASE = "http://127.0.0.1:8000";

  const sendMessage = async (e) => {
    e.preventDefault();
    const text = input.trim();
    if (!text) return;

    // Add user message
    setMessages((prev) => [...prev, { sender: "user", text }]);
    setInput("");
    setLoading(true);

    try {
      const res = await axios.post(`${API_BASE}/api/chat/`, {
        message: text,
      });

      const botMsg = {
        sender: "bot",
        text: res.data.summary,
        chart: res.data.chart,
        table: res.data.table,
      };

      setMessages((prev) => [...prev, botMsg]);
    } catch (err) {
      console.error(err);
      setMessages((prev) => [
        ...prev,
        { sender: "bot", text: "Error: Unable to process your request." },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const renderChart = (chart) => {
    if (!chart || !chart.labels || !chart.datasets) return null;

    const data = chart.labels.map((year, idx) => {
      const row = { year };
      chart.datasets.forEach((ds) => {
        row[ds.label] = ds.data[idx];
      });
      return row;
    });

    return (
      <LineChart width={600} height={300} data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="year" />
        <YAxis />
        <Tooltip />
        <Legend />
        {chart.datasets.map((ds, i) => (
          <Line key={i} type="monotone" dataKey={ds.label} dot={false} />
        ))}
      </LineChart>
    );
  };

  const renderTable = (data) => {
    if (!data || data.length === 0) return null;

    const cols = Object.keys(data[0]);

    return (
      <Table striped bordered size="sm" className="mt-3">
        <thead>
          <tr>
            {cols.map((c) => (
              <th key={c}>{c}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, i) => (
            <tr key={i}>
              {cols.map((c) => (
                <td key={c}>{row[c]}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </Table>
    );
  };

  return (
    <Container className="mt-4">
      <Row className="justify-content-center">
        <Col md={8}>
          <h3 className="text-center mb-3">Real Estate Analysis Chatbot</h3>

          <Card style={{ height: "60vh", overflowY: "auto" }}>
            <Card.Body>
              {messages.map((msg, i) => (
                <div
                  key={i}
                  className={`d-flex mb-3 ${
                    msg.sender === "user"
                      ? "justify-content-end"
                      : "justify-content-start"
                  }`}
                >
                  <div
                    style={{
                      maxWidth: "70%",
                      padding: "10px 14px",
                      borderRadius: "12px",
                      background: msg.sender === "user" ? "#0d6efd" : "#e9ecef",
                      color: msg.sender === "user" ? "white" : "black",
                    }}
                  >
                    {msg.text}

                    {msg.sender === "bot" && (
                      <>
                        <div className="mt-3">{renderChart(msg.chart)}</div>
                        <div>{renderTable(msg.table)}</div>
                      </>
                    )}
                  </div>
                </div>
              ))}
              {loading && (
                <div className="text-center">
                  <Spinner animation="border" size="sm" /> Analyzing...
                </div>
              )}
              <div ref={chatEndRef}></div>
            </Card.Body>
          </Card>

          <Form onSubmit={sendMessage} className="mt-3">
            <Row>
              <Col xs={9}>
                <Form.Control
                  type="text"
                  placeholder="Ask e.g. 'Give me analysis of Wakad'"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                />
              </Col>
              <Col xs={3}>
                <Button type="submit" className="w-100" disabled={loading}>
                  Send
                </Button>
              </Col>
            </Row>
          </Form>
        </Col>
      </Row>
    </Container>
  );
}

export default App;
