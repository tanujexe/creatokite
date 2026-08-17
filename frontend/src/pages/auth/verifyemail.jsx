import { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import axios from 'axios';

export default function VerifyEmail() {
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const token = searchParams.get('token');
    if (!token) {
      setStatus('error');
      setMessage('No verification token found.');
      return;
    }

    axios.get(`${import.meta.env.VITE_API_URL || 'http://127.0.0.1:5000'}/api/auth/verify-email?token=${token}`)
      .then(res => {
        setStatus('success');
        setMessage(res.data.message || 'Email verified!');
      })
      .catch(err => {
        setStatus('error');
        setMessage(err.response?.data?.message || 'Verification failed.');
      });
  }, []);

  return (
    <div style={{
      minHeight: '100dvh',
      background: 'var(--bg)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 'clamp(12px,4vw,24px)',
    }}>
      <div style={{ width: '100%', maxWidth: 420 }}>
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
           
          <img src="/logo.jpeg" alt="CreatoKite"
            style={{ width:48, height:48, borderRadius:14, objectFit:'contain',
               margin:'0 auto 14px', display:'block' }}/>
          <h1 style={{ fontFamily: 'var(--fd)', fontSize: 'clamp(20px,5vw,26px)', fontWeight: 800 }}>
            Email Verification
          </h1>
        </div>

        <div style={{
          background: 'var(--s1)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--r2)',
          padding: 'clamp(18px,5vw,28px)',
          textAlign: 'center',
        }}>
          {status === 'loading' && (
            <>
              <div style={{ fontSize: 48, marginBottom: 16 }}>⏳</div>
              <p style={{ color: 'var(--t2)', fontSize: 14 }}>Verifying your email...</p>
            </>
          )}

          {status === 'success' && (
            <>
              <div style={{ fontSize: 48, marginBottom: 16 }}>✅</div>
              <h2 style={{ fontWeight: 700, marginBottom: 8 }}>Email Verified!</h2>
              <p style={{ color: 'var(--t2)', fontSize: 14, marginBottom: 24 }}>{message}</p>
              <Link to="/login" style={{
                display: 'inline-block',
                background: 'linear-gradient(135deg,var(--p),var(--acc))',
                color: 'white', padding: '10px 28px',
                borderRadius: 'var(--r)', textDecoration: 'none',
                fontWeight: 600, fontSize: 14,
              }}>
                Go to Login →
              </Link>
            </>
          )}

          {status === 'error' && (
            <>
              <div style={{ fontSize: 48, marginBottom: 16 }}>❌</div>
              <h2 style={{ fontWeight: 700, marginBottom: 8 }}>Verification Failed</h2>
              <p style={{ color: 'var(--t2)', fontSize: 14, marginBottom: 24 }}>{message}</p>
              <Link to="/register" style={{
                display: 'inline-block',
                background: 'linear-gradient(135deg,var(--p),var(--acc))',
                color: 'white', padding: '10px 28px',
                borderRadius: 'var(--r)', textDecoration: 'none',
                fontWeight: 600, fontSize: 14,
              }}>
                Register Again →
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
}