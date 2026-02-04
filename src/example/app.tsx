import React, { useState, useEffect } from "react";
import { stratumService, isPlaceholderToken } from "./stratum";
import { EVENT_ID } from "./catalog";

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState<{
    id: string;
    email: string;
    name: string;
  } | null>(null);
  const [rollbarAvailable, setRollbarAvailable] = useState<boolean | null>(null);
  const [lastAction, setLastAction] = useState<string | null>(null);

  useEffect(() => {
    stratumService.isRollbarAvailable().then((available) => {
      setRollbarAvailable(available);
    });

    stratumService
      .publish(EVENT_ID.LOADED, {
        pluginData: {
          RollbarPlugin: {
            properties: { loadedAt: new Date().toISOString() },
          },
        },
      })
      .then((ok) => setLastAction(ok ? "LOADED sent" : "LOADED failed (Rollbar not available)"))
      .catch(() => setLastAction("LOADED failed"));
  }, []);

  const handleLogin = async () => {
    const userData = {
      id: "user_" + Date.now(),
      email: "user@example.com",
      name: "John Doe",
    };

    await stratumService.publish(EVENT_ID.USER_SIGNED_IN, {
      pluginData: {
        RollbarPlugin: {
          properties: {
            id: userData.id,
            username: userData.name,
            email: userData.email,
          },
        },
      },
    });

    setUser(userData);
    setIsLoggedIn(true);

    await stratumService.publish(EVENT_ID.USER_LOGIN, {
      pluginData: {
        RollbarPlugin: {
          properties: {
            login_method: "email",
            user_id: userData.id,
          },
        },
      },
    });
  };

  const handleLogout = async () => {
    if (!user) return;

    await stratumService.publish(EVENT_ID.USER_LOGOUT, {
      pluginData: {
        RollbarPlugin: {
          properties: {
            user_id: user.id,
            session_duration: "5 minutes",
          },
        },
      },
    });

    await stratumService.publish(EVENT_ID.USER_SIGNED_OUT, {
      pluginData: { RollbarPlugin: { properties: {} } },
    });

    setUser(null);
    setIsLoggedIn(false);
  };

  const handleTrackEvent = async () => {
    const ok = await stratumService.publish(EVENT_ID.BUTTON_CLICK, {
      pluginData: {
        RollbarPlugin: {
          properties: {
            button_name: "example_button",
            page: "home",
            user_logged_in: isLoggedIn.toString(),
          },
        },
      },
    });
    if (typeof window !== "undefined" && window.document) {
      console.log("[Stratum Rollbar] BUTTON_CLICK publish result:", ok);
    }
    setLastAction(ok ? "BUTTON_CLICK sent" : "BUTTON_CLICK failed");
  };

  const handleSendError = async () => {
    const ok = await stratumService.publish(EVENT_ID.GENERIC_ERROR, {
      pluginData: {
        RollbarPlugin: {
          properties: {
            error: "Example error from Stratum Rollbar demo",
            message: "User clicked Send Error",
          },
        },
      },
    });
    setLastAction(ok ? "GENERIC_ERROR sent" : "GENERIC_ERROR failed");
  };

  const handleSendErrorWithStack = async () => {
    const err = new Error("Example error with stack trace");
    const ok = await stratumService.publish(EVENT_ID.GENERIC_ERROR, {
      pluginData: {
        RollbarPlugin: {
          properties: {
            error: err,
            message: "User clicked Send Error with Stack",
          },
        },
      },
    });
    setLastAction(ok ? "GENERIC_ERROR (with stack) sent" : "GENERIC_ERROR failed");
  };

  const handleSendWarning = async () => {
    const ok = await stratumService.publish(EVENT_ID.RATE_LIMIT_WARNING, {
      pluginData: {
        RollbarPlugin: {
          properties: { limit: 100, current: 95 },
        },
      },
    });
    setLastAction(ok ? "RATE_LIMIT_WARNING sent" : "RATE_LIMIT_WARNING failed");
  };

  const handleSendDebug = async () => {
    const ok = await stratumService.publish(EVENT_ID.DEBUG_ACTION, {
      pluginData: {
        RollbarPlugin: {
          properties: { action: "debug_button_clicked" },
        },
      },
    });
    setLastAction(ok ? "DEBUG_ACTION sent" : "DEBUG_ACTION failed");
  };

  return (
    <div style={{ padding: "20px", fontFamily: "Arial, sans-serif" }}>
      <h1>Stratum Rollbar Example</h1>

      {isPlaceholderToken && (
        <div
          data-testid="placeholder-token-banner"
          style={{
            marginBottom: "16px",
            padding: "12px",
            backgroundColor: "#fff3cd",
            border: "1px solid #ffc107",
            borderRadius: "4px",
          }}
        >
          <strong>No Rollbar token.</strong> Set <code>ROLLBAR_CLIENT_TOKEN</code> or{" "}
          <code>NEXT_PUBLIC_ROLLBAR_CLIENT_TOKEN</code> (e.g. in <code>.env</code>) so events appear in your Rollbar project.
        </div>
      )}
      <div
        style={{
          marginBottom: "20px",
          padding: "10px",
          backgroundColor: "#f5f5f5",
        }}
      >
        <h3>Status</h3>
        <p data-testid="rollbar-status">
          <strong>Rollbar:</strong>{" "}
          {rollbarAvailable === null
            ? "Checking…"
            : rollbarAvailable
              ? "Available"
              : "Not available"}
        </p>
        <p data-testid="login-status">
          <strong>Login:</strong> {isLoggedIn ? "Logged in" : "Anonymous"}
        </p>
        {lastAction != null && (
          <p data-testid="last-action">
            <strong>Last action:</strong> {lastAction}
          </p>
        )}
        {user && (
          <p data-testid="user-info">
            <strong>User:</strong> {user.name} ({user.email})
          </p>
        )}
      </div>

      <div style={{ marginBottom: "20px" }}>
        <h3>User</h3>
        {!isLoggedIn ? (
          <button
            data-testid="btn-login"
            onClick={handleLogin}
            style={{
              padding: "10px 20px",
              marginRight: "10px",
              backgroundColor: "#4CAF50",
              color: "white",
              border: "none",
              borderRadius: "4px",
            }}
          >
            Login (identify person)
          </button>
        ) : (
          <button
            data-testid="btn-logout"
            onClick={handleLogout}
            style={{
              padding: "10px 20px",
              marginRight: "10px",
              backgroundColor: "#f44336",
              color: "white",
              border: "none",
              borderRadius: "4px",
            }}
          >
            Logout (clear person)
          </button>
        )}
      </div>

      <div style={{ marginBottom: "20px" }}>
        <h3>Events</h3>
        <button
          data-testid="btn-track-event"
          onClick={handleTrackEvent}
          style={{
            padding: "10px 20px",
            marginRight: "10px",
            marginBottom: "8px",
            backgroundColor: "#9C27B0",
            color: "white",
            border: "none",
            borderRadius: "4px",
          }}
        >
          Send info (button click)
        </button>
        <button
          data-testid="btn-send-warning"
          onClick={handleSendWarning}
          style={{
            padding: "10px 20px",
            marginRight: "10px",
            marginBottom: "8px",
            backgroundColor: "#FF9800",
            color: "white",
            border: "none",
            borderRadius: "4px",
          }}
        >
          Send warning
        </button>
        <button
          data-testid="btn-send-error"
          onClick={handleSendError}
          style={{
            padding: "10px 20px",
            marginRight: "10px",
            marginBottom: "8px",
            backgroundColor: "#f44336",
            color: "white",
            border: "none",
            borderRadius: "4px",
          }}
        >
          Send error (message)
        </button>
        <button
          data-testid="btn-send-error-stack"
          onClick={handleSendErrorWithStack}
          style={{
            padding: "10px 20px",
            marginRight: "10px",
            marginBottom: "8px",
            backgroundColor: "#b71c1c",
            color: "white",
            border: "none",
            borderRadius: "4px",
          }}
        >
          Send error (with stack)
        </button>
        <button
          data-testid="btn-send-debug"
          onClick={handleSendDebug}
          style={{
            padding: "10px 20px",
            marginBottom: "8px",
            backgroundColor: "#607D8B",
            color: "white",
            border: "none",
            borderRadius: "4px",
          }}
        >
          Send debug
        </button>
      </div>

      <div
        style={{
          marginTop: "30px",
          padding: "15px",
          backgroundColor: "#e3f2fd",
          borderRadius: "4px",
        }}
      >
        <h3>How it works</h3>
        <ul>
          <li>
            <strong>Identify:</strong> Login sends an IDENTIFY event so Rollbar
            associates events with the person (id, username, email).
          </li>
          <li>
            <strong>Clear person:</strong> Logout sends CLEAR_PERSON so future
            events are not tied to that user.
          </li>
          <li>
            <strong>Log levels:</strong> Info, warning, error, critical, and
            debug map to Rollbar’s methods.
          </li>
          <li>
            <strong>Errors:</strong> Pass an <code>Error</code> in properties to
            send stack traces to Rollbar.
          </li>
        </ul>
      </div>
    </div>
  );
}

export default App;
