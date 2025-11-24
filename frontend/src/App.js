import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import "./App.css";
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
  ResponsiveContainer,
} from "recharts";

function App() {
  const [messages, setMessages] = useState([
    { 
      sender: "bot", 
      text: "Hello! I can analyze real estate trends for you. Ask me about locations like 'Wakad' or 'Aundh'." 
    }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  
  // Stores the list of active locations (e.g., ["Wakad", "Aundh"])
  const [activeAreas, setActiveAreas] = useState([]);

  const chatEndRef = useRef(null);

  const API_BASE = "http://127.0.0.1:8000";

  const suggestions = [
    "Compare Wakad and Aundh",
    "Analyze all locations",
    "Best buy in Pune",
    "Download data"
  ];

  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  const sendMessage = async (textOverride) => {
    const text = textOverride || input.trim();
    if (!text) return;

    // Handle "Download" intent locally or via button
    if (text.toLowerCase().includes("download")) {
      handleDownload();
      setMessages((prev) => [...prev, { sender: "user", text }]);
      setInput("");
      return;
    }

    const newMsg = { sender: "user", text };
    setMessages((prev) => [...prev, newMsg]);
    setInput("");
    setLoading(true);

    try {
      const res = await axios.post(`${API_BASE}/api/chat/`, {
        message: text,
        context: { areas: activeAreas } // Send array of areas
      });

      const botMsg = {
        sender: "bot",
        text: res.data.summary,
        chart: res.data.chart,
        table: res.data.table,
        growth: res.data.growth, // Support growth metrics if available
      };

      // Update context
      if (res.data.context && res.data.context.areas) {
        setActiveAreas(res.data.context.areas);
      }

      setMessages((prev) => [...prev, botMsg]);
    } catch (err) {
      console.error(err);
      setMessages((prev) => [
        ...prev,
        { sender: "bot", text: "Sorry, I encountered an error. Please try again." },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async () => {
    try {
      const res = await axios.post(
        `${API_BASE}/api/download/`,
        { areas: activeAreas },
        { responseType: "blob" } 
      );

      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement("a");
      link.href = url;
      
      const filename = activeAreas.length > 0 
        ? `Report_${activeAreas.join("_")}.csv` 
        : "Real_Estate_Full_Report.csv";
        
      link.setAttribute("download", filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      console.error("Download failed:", err);
      alert("Failed to download data.");
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    sendMessage();
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

    const colors = ["#8884d8", "#82ca9d", "#ffc658", "#ff7300", "#0088FE"];

    return (
      <div style={{ width: '100%', height: 300, marginTop: '15px' }}>
        <ResponsiveContainer>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
            <XAxis dataKey="year" stroke="#888" />
            <YAxis stroke="#888" />
            <Tooltip contentStyle={{ borderRadius: '10px', border: 'none', boxShadow: '0 2px 10px rgba(0,0,0,0.1)' }} />
            <Legend />
            {chart.datasets.map((ds, i) => (
              <Line 
                key={i} 
                type="monotone" 
                dataKey={ds.label} 
                stroke={colors[i % colors.length]} 
                strokeWidth={3}
                dot={{ r: 4 }} 
                activeDot={{ r: 6 }} 
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    );
  };

  const renderGrowth = (growth) => {
    if (!growth) return null;
    const color = growth.trend === "increasing" ? "green" : growth.trend === "decreasing" ? "red" : "gray";
    const icon = growth.trend === "increasing" ? "▲" : growth.trend === "decreasing" ? "▼" : "●";

    return (
      <div className="mt-3 p-3 bg-white rounded shadow-sm" style={{ borderLeft: `4px solid ${color}` }}>
        <h6 className="text-muted mb-1">Growth Analysis ({growth.trend})</h6>
        <div className="d-flex justify-content-between align-items-center">
          <div>
            <small>Initial</small>
            <div className="fw-bold">{growth.initial}</div>
          </div>
          <div style={{ color: color, fontWeight: "bold", fontSize: "1.2rem" }}>
            {icon} {growth.percent_change}%
          </div>
          <div className="text-end">
            <small>Current</small>
            <div className="fw-bold">{growth.final}</div>
          </div>
        </div>
      </div>
    );
  };

  const renderTable = (data) => {
    if (!data || data.length === 0) return null;

    // 1. Group rows by "final location"
    const groupedData = data.reduce((acc, row) => {
      const loc = row["final location"] || "General Data";
      if (!acc[loc]) acc[loc] = [];
      acc[loc].push(row);
      return acc;
    }, {});

    // 2. Render a separate table block for each location
    return (
      <div className="mt-4">
        {Object.entries(groupedData).map(([location, rows], index) => {
          if (rows.length === 0) return null;
          // Extract columns dynamically from the first row of this group
          const cols = Object.keys(rows[0]);

          return (
            <div key={index} className="mb-5"> 
              <h5 className="mb-2 text-primary" style={{ fontWeight: "bold", borderBottom: "2px solid #eee", paddingBottom: "8px" }}>
                📍 {location}
              </h5>
              <Card className="shadow-sm border-0">
                <div className="table-responsive">
                  <Table hover size="sm" className="mb-0" style={{ fontSize: "0.9rem" }}>
                    <thead className="bg-light">
                      <tr>
                        {cols.map((c) => (
                          <th key={c} className="py-2 text-secondary" style={{ fontWeight: 600, textTransform: "capitalize" }}>
                            {c}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {rows.map((row, rIdx) => (
                        <tr key={rIdx}>
                          {cols.map((c) => (
                            <td key={c} className="py-2">{row[c]}</td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </div>
              </Card>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <Container fluid className="main-container px-5">
      <Row>
        {/* Chat Section */}
        <Col md={8} lg={8}>
          <Card className="chat-card">
            <Card.Header className="chat-header d-flex justify-content-between align-items-center px-4">
              <div>
                <h4 
                  className="bbh-sans-bartle-regular" 
                  style={{ color: '#444', margin: 0, fontSize: '2rem' }}
                >
                  📊 Real Estate Assistant
                </h4>
                {activeAreas.length > 0 && (
                  <small className="text-muted">
                    Context: <strong>{activeAreas.join(", ")}</strong>
                  </small>
                )}
              </div>
              <Button 
                variant="outline-primary" 
                size="sm" 
                onClick={handleDownload}
                title="Download CSV Report"
                style={{ borderRadius: "20px", fontSize: "0.8rem" }}
              >
                ⬇ Download Data
              </Button>
            </Card.Header>

            <div className="chat-body">
              {messages.map((msg, i) => (
                <div key={i} className={`message-row ${msg.sender === "user" ? "user-message" : "bot-message"}`}>
                  <div className="message-bubble">
                    {msg.text}
                    {msg.sender === "bot" && (
                      <>
                        {renderChart(msg.chart)}
                        {renderGrowth(msg.growth)}
                        {renderTable(msg.table)}
                      </>
                    )}
                  </div>
                </div>
              ))}
              
              {loading && (
                <div className="message-row bot-message">
                  <div className="message-bubble" style={{ fontStyle: 'italic', color: '#888' }}>
                    <Spinner animation="grow" size="sm" className="me-2" />
                    Analyzing market data...
                  </div>
                </div>
              )}
              <div ref={chatEndRef}></div>
            </div>

            <div className="input-area">
              <div className="mb-3">
                <div className="quick-actions">
                  {suggestions
                    .filter((s) => s !== "Download data")
                    .map((s, i) => (
                      <div
                        key={i}
                        className="suggestion-chip"
                        onClick={() => sendMessage(s)}
                      >
                        {s}
                      </div>
                    ))}
                </div>

                <div className="d-flex justify-content-center mt-2">
                  <div
                    className="suggestion-chip"
                    onClick={() => sendMessage("Download data")}
                    style={{
                      backgroundColor: "#ff7300",
                      color: "white",
                      borderColor: "#ff7300",
                    }}
                  >
                    Download data
                  </div>
                </div>
              </div>
              
              <Form onSubmit={handleSubmit}>
                <Row className="g-2">
                  <Col>
                    <Form.Control
                      type="text"
                      className="custom-input"
                      placeholder="Type a message..."
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      disabled={loading}
                    />
                  </Col>
                  <Col xs="auto">
                    <Button type="submit" className="send-btn" disabled={loading}>
                      ➤
                    </Button>
                  </Col>
                </Row>
              </Form>
            </div>
          </Card>
        </Col>

        {/* Instructions Section (Right Side) */}
        <Col md={4} lg={4} className="d-none d-md-block">
          <Card className="p-4 border-0 shadow-sm" style={{ backgroundColor: 'rgba(255, 255, 255, 0.85)', borderRadius: '20px' }}>
            <h5 
              className="mb-3 bbh-sans-bartle-regular" 
              style={{ color: '#444', fontSize: '1.8rem' }}
            >
              ℹ️ How to Download
            </h5>
            <p className="instruction-text">
              You can download the real estate data as a CSV file to analyze it yourself.
            </p>
            <hr style={{ borderColor: '#ddd' }}/>
            <h6 style={{ fontSize: '1.1rem', fontWeight: '600', color: '#667eea' }}>Smart Download</h6>
            <p className="instruction-subtext">
              If you are discussing specific locations (e.g., "Wakad vs Aundh"), the file will contain data for <strong>only those areas</strong>. 
              If no location is selected, you will get the <strong>full dataset</strong>.
            </p>
            <h6 style={{ fontSize: '1.1rem', fontWeight: '600', color: '#667eea' }}>How to Use</h6>
            <p className="instruction-subtext">
              Click the <strong>"⬇ Download Data"</strong> button at the top right of the chat, or simply type <strong>"Download data"</strong> in the chat.
            </p>
          </Card>
        </Col>
      </Row>
    </Container>
  );
}

export default App;