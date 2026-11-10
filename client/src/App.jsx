
import { useEffect, useState } from "react";
import "./App.css";

const API = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const today = () => {
  const d = new Date();
  const offset = d.getTimezoneOffset();
  return new Date(d.getTime() - offset * 60000)
    .toISOString().slice(0, 10);
};

const emptyForm = {
  reading_date: today(),
  time_slot: "Morning",
  value: ""
};

function App() {
  const [token, setToken] = useState(localStorage.getItem("sweetyToken"));
  const [user, setUser] = useState(
    JSON.parse(localStorage.getItem("sweetyUser") || "null")
  );
  const [mode, setMode] = useState("login");
  const [authForm, setAuthForm] = useState({
    name: "", email: "", password: ""
  });
  const [form, setForm] = useState(emptyForm);
  const [readings, setReadings] = useState([]);
  const [reports, setReports] = useState(null);
  const [selectedDate, setSelectedDate] = useState(today());
  const [editingId, setEditingId] = useState(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const request = async (path, options = {}) => {
    const response = await fetch(`${API}${path}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...options.headers
      }
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Something went wrong.");
    }

    return data;
  };

  const handleAuth = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const endpoint = mode === "login" ? "/auth/login" : "/auth/register";
      const data = await request(endpoint, {
        method: "POST",
        body: JSON.stringify(authForm)
      });

      if (mode === "register") {
        setMessage("Account created! Please log in.");
        setMode("login");
        setAuthForm({ name: "", email: authForm.email, password: "" });
      } else {
        localStorage.setItem("sweetyToken", data.token);
        localStorage.setItem("sweetyUser", JSON.stringify(data.user));
        setToken(data.token);
        setUser(data.user);
        setMessage("Welcome to Sweety!");
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem("sweetyToken");
    localStorage.removeItem("sweetyUser");
    setToken(null);
    setUser(null);
    setReadings([]);
    setReports(null);
    setMessage("You have logged out.");
  };

  const loadReadings = async () => {
    try {
      const data = await request("/readings");
      setReadings(data.readings || []);
    } catch (err) {
      setError(err.message);
    }
  };

  const loadReports = async (date = selectedDate) => {
    try {
      const data = await request(`/reports?date=${date}`);
      setReports(data);
    } catch (err) {
      setError(err.message);
    }
  };

  useEffect(() => {
    if (token) {
      loadReadings();
      loadReports();
    }
  }, [token]);

  const saveReading = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");

    try {
      const path = editingId ? `/readings/${editingId}` : "/readings";
      await request(path, {
        method: editingId ? "PUT" : "POST",
        body: JSON.stringify({
          ...form,
          value: Number(form.value)
        })
      });

      setMessage(editingId ? "Reading updated!" : "Reading added!");
      setForm(emptyForm);
      setEditingId(null);
      await loadReadings();
      await loadReports();
    } catch (err) {
      setError(err.message);
    }
  };

  const editReading = (reading) => {
    setEditingId(reading.id);
    setForm({
      reading_date: String(reading.reading_date).slice(0, 10),
      time_slot: reading.time_slot,
      value: reading.value
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const deleteReading = async (id) => {
    if (!window.confirm("Are you sure you want to delete this reading?")) {
      return;
    }

    try {
      await request(`/readings/${id}`, { method: "DELETE" });
      setMessage("Reading deleted.");
      await loadReadings();
      await loadReports();
    } catch (err) {
      setError(err.message);
    }
  };

  const changeReportDate = async (date) => {
    setSelectedDate(date);
    await loadReports(date);
  };

  const formatDate = (date) =>
    new Date(`${String(date).slice(0, 10)}T00:00:00`).toLocaleDateString(
      "en-IN",
      { day: "numeric", month: "short", year: "numeric" }
    );

  const StatCard = ({ title, data }) => (
    <div className="stat-card">
      <p>{title}</p>
      <h2>{data?.count ? data.average : "—"}</h2>
      <span>
        {data?.count
          ? `${data.lowest}–${data.highest} mg/dL · ${data.count} readings`
          : "No readings yet"}
      </span>
    </div>
  );

  if (!token) {
    return (
      <main className="auth-page">
        <section className="auth-card">
          <div className="brand-icon">S</div>
          <h1>Sweety</h1>
          <p className="subtitle">Your daily glucose companion</p>

          <div className="auth-tabs">
            <button
              className={mode === "login" ? "active" : ""}
              onClick={() => { setMode("login"); setError(""); }}
            >
              Log in
            </button>
            <button
              className={mode === "register" ? "active" : ""}
              onClick={() => { setMode("register"); setError(""); }}
            >
              Sign up
            </button>
          </div>

          <form onSubmit={handleAuth}>
            {mode === "register" && (
              <label>
                Full name
                <input
                  required
                  value={authForm.name}
                  onChange={(e) => setAuthForm({
                    ...authForm, name: e.target.value
                  })}
                  placeholder="Your name"
                />
              </label>
            )}

            <label>
              Email address
              <input
                type="email"
                required
                value={authForm.email}
                onChange={(e) => setAuthForm({
                  ...authForm, email: e.target.value
                })}
                placeholder="you@example.com"
              />
            </label>

            <label>
              Password
              <input
                type="password"
                required
                minLength="8"
                value={authForm.password}
                onChange={(e) => setAuthForm({
                  ...authForm, password: e.target.value
                })}
                placeholder="Minimum 8 characters"
              />
            </label>

            {error && <div className="alert error">{error}</div>}
            {message && <div className="alert success">{message}</div>}

            <button className="primary-btn" disabled={loading}>
              {loading ? "Please wait..." :
                mode === "login" ? "Log in to Sweety" : "Create account"}
            </button>
          </form>
          <p className="auth-footer">Your health data, organized simply.</p>
        </section>
      </main>
    );
  }

  return (
    <main className="dashboard">
      <header className="topbar">
        <div className="brand">
          <div className="brand-icon small">S</div>
          <div>
            <h2>Sweety</h2>
            <span>Blood Glucose Tracker</span>
          </div>
        </div>
        <div className="user-area">
          <span>Welcome, {user?.name || "User"}</span>
          <button className="logout-btn" onClick={logout}>Log out</button>
        </div>
      </header>

      <section className="welcome">
        <div>
          <p className="eyebrow">YOUR HEALTH OVERVIEW</p>
          <h1>Good to see you, {user?.name || "there"}!</h1>
          <p>Keep track of your daily glucose readings.</p>
        </div>
        <div className="date-badge">{formatDate(today())}</div>
      </section>

      {error && <div className="alert error">{error}</div>}
      {message && <div className="alert success">{message}</div>}

      <section className="content-grid">
        <div className="panel form-panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">DAILY TRACKING</p>
              <h2>{editingId ? "Edit reading" : "Add glucose reading"}</h2>
            </div>
            <span className="panel-symbol">＋</span>
          </div>

          <form onSubmit={saveReading}>
            <label>
              Reading date
              <input
                type="date"
                required
                max={today()}
                value={form.reading_date}
                onChange={(e) => setForm({
                  ...form, reading_date: e.target.value
                })}
              />
            </label>

            <label>
              Time slot
              <select
                value={form.time_slot}
                onChange={(e) => setForm({
                  ...form, time_slot: e.target.value
                })}
              >
                <option>Morning</option>
                <option>After breakfast</option>
                <option>After lunch</option>
                <option>After dinner</option>
              </select>
            </label>

            <label>
              Glucose value (mg/dL)
              <input
                type="number"
                min="40"
                max="600"
                step="1"
                required
                placeholder="Enter value"
                value={form.value}
                onChange={(e) => setForm({
                  ...form, value: e.target.value
                })}
              />
            </label>

            <button className="primary-btn">
              {editingId ? "Update reading" : "Save reading"}
            </button>

            {editingId && (
              <button
                type="button"
                className="cancel-btn"
                onClick={() => {
                  setEditingId(null);
                  setForm(emptyForm);
                }}
              >
                Cancel editing
              </button>
            )}
          </form>
          <p className="helper-text">Allowed range: 40–600 mg/dL. Maximum 4 readings per day.</p>
        </div>

        <div className="panel reports-panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">YOUR REPORTS</p>
              <h2>Glucose summary</h2>
            </div>
            <span className="panel-symbol">▤</span>
          </div>

          <label>
            Select report date
            <input
              type="date"
              max={today()}
              value={selectedDate}
              onChange={(e) => changeReportDate(e.target.value)}
            />
          </label>

          {reports && (
            <div className="stats-grid">
              <StatCard title="Daily average" data={reports.daily} />
              <StatCard title="Month to date" data={reports.monthToDate} />
              <StatCard title="Previous month" data={reports.previousMonth} />
            </div>
          )}
          <p className="helper-text">
            Averages are calculated from your recorded readings.
          </p>
        </div>
      </section>

      <section className="panel readings-panel">
        <div className="panel-heading">
          <div>
            <p className="eyebrow">HISTORY</p>
            <h2>Your glucose readings</h2>
          </div>
          <span className="count-badge">{readings.length} total</span>
        </div>

        {readings.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">♡</div>
            <h3>No readings yet</h3>
            <p>Add your first glucose reading to see your history here.</p>
          </div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Time slot</th>
                  <th>Glucose value</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {readings.map((reading) => (
                  <tr key={reading.id}>
                    <td>{formatDate(reading.reading_date)}</td>
                    <td>{reading.time_slot}</td>
                    <td><strong>{reading.value} mg/dL</strong></td>
                    <td className="actions">
                      <button onClick={() => editReading(reading)}>Edit</button>
                      <button
                        className="delete-btn"
                        onClick={() => deleteReading(reading.id)}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {reports && (
        <section className="panel daily-panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">SELECTED DATE</p>
              <h2>Daily reading details</h2>
            </div>
            <span className="count-badge">{reports.daily.count} readings</span>
          </div>
          {reports.daily.readings.length === 0 ? (
            <div className="empty-state">
              <h3>No readings for this date</h3>
              <p>Select another date or add a reading.</p>
            </div>
          ) : (
            <div className="slot-list">
              {reports.daily.readings.map((r) => (
                <div className="slot-row" key={r.id}>
                  <span>{r.time_slot}</span>
                  <strong>{r.value} mg/dL</strong>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      <footer className="footer">
        Sweety · Blood Glucose Tracker
        <p>For record keeping only. Follow your healthcare professional's advice.</p>
      </footer>
    </main>
  );
}

export default App;
