import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth, getDashboardPath } from "../contexts/AuthContext";
import { authAPI } from "../api";

export default function LoginSuccess() {
  const { setUser } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get("token");
    const refreshToken = params.get("refreshToken");

    if (token) {
      // Wiping out any existing state
      localStorage.removeItem("ck_token");
      localStorage.removeItem("ck_refresh");
      setUser(null);

      // Set new tokens
      localStorage.setItem("ck_token", token);
      if (refreshToken) {
        localStorage.setItem("ck_refresh", refreshToken);
      }

      // Fetch user profile
      authAPI.me()
        .then(res => {
          if (res.success && res.user) {
            setUser(res.user);
            // Route to correct dashboard path based on role
            navigate(getDashboardPath(res.user.role), { replace: true });
          } else {
            navigate("/login?error=invalid_user", { replace: true });
          }
        })
        .catch(err => {
          console.error("Error getting user profile:", err);
          navigate("/login?error=profile_failed", { replace: true });
        });
    } else {
      navigate("/login", { replace: true });
    }
  }, [navigate, setUser]);

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--s1)',
        color: 'var(--t1)'
      }}
    >
      Logging in...
    </div>
  );
}