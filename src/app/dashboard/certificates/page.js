'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase-client';
import { Award, ExternalLink, Download } from 'lucide-react';

export default function CertificatesPage() {
    const [certificates, setCertificates] = useState([]);
    const [loading, setLoading] = useState(true);
    const supabase = createClient();

    useEffect(() => { loadCertificates(); }, []);

    async function loadCertificates() {
        const { data: { user } } = await supabase.auth.getUser();
        const { data } = await supabase
            .from('training_certificates')
            .select('*')
            .eq('user_id', user?.id)
            .order('issued_at', { ascending: false });
        setCertificates(data || []);
        setLoading(false);
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <div className="w-8 h-8 border-2 border-[hsl(var(--primary))] border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-xl sm:text-2xl font-bold">My Certificates</h1>
                <p className="text-sm text-[hsl(var(--muted-foreground))] mt-1">Your verifiable training certificates for insurance and city compliance.</p>
            </div>

            {certificates.length === 0 ? (
                <div className="bg-white rounded-xl p-8 text-center shadow-sm">
                    <Award className="w-12 h-12 text-[hsl(var(--muted-foreground))] mx-auto mb-3" />
                    <h3 className="font-semibold mb-1">No certificates yet</h3>
                    <p className="text-sm text-[hsl(var(--muted-foreground))]">Complete a course and pass all quizzes to earn certificates.</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {certificates.map((cert) => (
                        <div key={cert.id} className="bg-white rounded-xl p-5 shadow-sm border-l-4 border-green-500">
                            <div className="flex items-start justify-between gap-3">
                                <div className="flex-1 min-w-0">
                                    <h3 className="font-semibold text-sm">{cert.course_title}</h3>
                                    <p className="text-xs text-[hsl(var(--muted-foreground))] mt-1">
                                        Certificate #{cert.certificate_number}
                                    </p>
                                    <div className="flex flex-wrap gap-3 mt-2 text-xs text-[hsl(var(--muted-foreground))]">
                                        <span>Score: <strong className="text-[hsl(var(--foreground))]">{Math.round(cert.final_quiz_score || 0)}%</strong></span>
                                        <span>Issued: <strong className="text-[hsl(var(--foreground))]">{new Date(cert.issued_at).toLocaleDateString()}</strong></span>
                                        <span className={`font-medium ${cert.status === 'active' ? 'text-green-600' : 'text-red-600'}`}>
                                            {cert.status?.toUpperCase()}
                                        </span>
                                    </div>
                                </div>
                                <Award className="w-8 h-8 text-green-500 shrink-0" />
                            </div>
                            <div className="flex gap-2 mt-4">
                                <a
                                    href={`/verify/${cert.certificate_number}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-1.5 text-xs font-medium text-[hsl(var(--primary))] bg-[hsl(var(--primary))]/5 px-3 py-2 rounded-lg hover:bg-[hsl(var(--primary))]/10 transition-colors touch-target"
                                >
                                    <ExternalLink className="w-3.5 h-3.5" /> Verify Link
                                </a>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
