'use client';

import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

function UnsubscribeContent() {
    const params = useSearchParams();
    const success = params.get('success') === '1';
    const email = params.get('email') || '';
    const error = params.get('error');

    return (
        <div style={{
            minHeight: '100vh',
            background: '#f5f5f5',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif",
            padding: '20px',
        }}>
            <div style={{
                background: '#fff',
                borderRadius: 16,
                padding: '48px 40px',
                maxWidth: 480,
                width: '100%',
                boxShadow: '0 4px 24px rgba(0,0,0,0.08)',
                textAlign: 'center',
            }}>
                {/* Logo */}
                <img
                    src="https://www.spinr.ca/logo.png"
                    alt="Spinr"
                    style={{ height: 36, marginBottom: 32 }}
                />

                {success ? (
                    <>
                        {/* Success state */}
                        <div style={{
                            width: 64, height: 64,
                            background: '#f0fdf4',
                            borderRadius: '50%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            margin: '0 auto 20px',
                            fontSize: 28,
                        }}>
                            ✓
                        </div>
                        <h1 style={{ margin: '0 0 12px', fontSize: 24, fontWeight: 800, color: '#111827' }}>
                            You've been unsubscribed
                        </h1>
                        <p style={{ margin: '0 0 8px', color: '#6b7280', fontSize: 15, lineHeight: 1.6 }}>
                            {email
                                ? <><strong style={{ color: '#374151' }}>{email}</strong> will no longer receive promotional emails from Spinr.</>
                                : 'You will no longer receive promotional emails from Spinr.'
                            }
                        </p>
                        <p style={{ margin: '0 0 32px', color: '#9ca3af', fontSize: 13, lineHeight: 1.6 }}>
                            You may still receive important emails like booking confirmations and receipts.
                        </p>
                        <a
                            href="https://www.spinr.ca"
                            style={{
                                display: 'inline-block',
                                background: '#111827',
                                color: '#fff',
                                padding: '12px 28px',
                                borderRadius: 50,
                                textDecoration: 'none',
                                fontWeight: 700,
                                fontSize: 14,
                            }}
                        >
                            Back to Spinr
                        </a>
                    </>
                ) : error === 'invalid' ? (
                    <>
                        {/* Invalid token */}
                        <div style={{
                            width: 64, height: 64,
                            background: '#fef2f2',
                            borderRadius: '50%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            margin: '0 auto 20px',
                            fontSize: 28,
                        }}>
                            ✕
                        </div>
                        <h1 style={{ margin: '0 0 12px', fontSize: 24, fontWeight: 800, color: '#111827' }}>
                            Invalid link
                        </h1>
                        <p style={{ margin: '0 0 32px', color: '#6b7280', fontSize: 15, lineHeight: 1.6 }}>
                            This unsubscribe link is invalid or has expired. Please use the link from your most recent email.
                        </p>
                        <a
                            href="https://www.spinr.ca"
                            style={{
                                display: 'inline-block',
                                background: '#111827',
                                color: '#fff',
                                padding: '12px 28px',
                                borderRadius: 50,
                                textDecoration: 'none',
                                fontWeight: 700,
                                fontSize: 14,
                            }}
                        >
                            Back to Spinr
                        </a>
                    </>
                ) : (
                    <>
                        {/* Server error */}
                        <div style={{
                            width: 64, height: 64,
                            background: '#fff7ed',
                            borderRadius: '50%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            margin: '0 auto 20px',
                            fontSize: 28,
                        }}>
                            ⚠
                        </div>
                        <h1 style={{ margin: '0 0 12px', fontSize: 24, fontWeight: 800, color: '#111827' }}>
                            Something went wrong
                        </h1>
                        <p style={{ margin: '0 0 32px', color: '#6b7280', fontSize: 15, lineHeight: 1.6 }}>
                            We couldn't process your request. Please try again or contact{' '}
                            <a href="mailto:support@spinr.ca" style={{ color: '#dc2626' }}>support@spinr.ca</a>.
                        </p>
                        <a
                            href="https://www.spinr.ca"
                            style={{
                                display: 'inline-block',
                                background: '#111827',
                                color: '#fff',
                                padding: '12px 28px',
                                borderRadius: 50,
                                textDecoration: 'none',
                                fontWeight: 700,
                                fontSize: 14,
                            }}
                        >
                            Back to Spinr
                        </a>
                    </>
                )}
            </div>
        </div>
    );
}

export default function UnsubscribePage() {
    return (
        <Suspense>
            <UnsubscribeContent />
        </Suspense>
    );
}
