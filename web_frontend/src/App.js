import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import './App.css';


// Placeholder components for pages
function HomePage() {
  return (
    <div>
      <h2>Home Page</h2>
      <p>Welcome to Djangobet!</p>
    </div>
  );
}

function LoginPage() {
  return <h2>Login Page - Placeholder</h2>;
}

function RegisterPage() {
  return <h2>Register Page - Placeholder</h2>;
}

function App() {
  return (
    <Router>
      <div className="App">
        <nav>
          <ul>
            <li>
              <Link to="/">Home</Link>
            </li>
            <li>
              <Link to="/login">Login</Link>
            </li>
            <li>
              <Link to="/register">Register</Link>
            </li>
          </ul>
        </nav>

        <hr />

        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/" element={<HomePage />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App; 