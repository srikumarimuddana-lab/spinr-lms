import { createServiceClient } from '@/lib/supabase-server';
import Image from 'next/image';
import { CheckCircle, XCircle, Shield } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function VerifyCertificatePage({ params }) {
    const { certificateNumber } = await params;
    const supabase = await createServiceClient();

    const { data: cert } = await supabase
        .from('training_certificates')
        .select('*')
        .eq('certificate_number', certificateNumber)
        .single();

    return (
        <div className="min-h-screen bg-[hsl(var(--secondary))] flex flex-col">
            <header className="bg-white border-b border-[hsl(var(--border))] px-4 py-4">
                <div className="max-w-2xl mx-auto flex items-center gap-3">
                    <Image src="/logo.png" alt="Spinr" width={90} height={30} className="h-8 w-auto" />
                    <span className="text-xs font-medium text-[hsl(var(--muted-foreground))] bg-[hsl(var(--secondary))] px-2 py-0.5 rounded-full">Certificate Verification</span>
                </div>
            </header>

            <main className="flex-1 flex items-center justify-center px-4 py-8">
                <div className="w-full max-w-lg">
                    {cert ? (
                        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
                            <div className={`p-6 text-center text-white ${cert.status === 'active' ? 'bg-gradient-to-r from-green-500 to-green-600' : 'bg-gradient-to-r from-red-500 to-red-600'}`}>
                                {cert.status === 'active' ? (
                                    <CheckCircle className="w-16 h-16 mx-auto mb-3" />
                                ) : (
                                    <XCircle className="w-16 h-16 mx-auto mb-3" />
                                )}
                                <h1 className="text-2xl font-bold">
                                    {cert.status === 'active' ? 'Verified Certificate' : 'Certificate ' + cert.status?.toUpperCase()}
                                </h1>
                            </div>
                            <div className="p-6 space-y-4">
                                <div className="flex items-center gap-2 text-sm">
                                    <Shield className="w-4 h-4 text-[hsl(var(--primary))]" />
                                    <span className="font-medium">Spinr Driver Training Certificate</span>
                                </div>
                                {[
                                    { label: 'Driver Name', value: cert.driver_name },
                                    { label: 'Email', value: cert.driver_email },
                                    { label: 'Course', value: cert.course_title },
                                    { label: 'Certificate #', value: cert.certificate_number },
                                    { label: 'Quiz Score', value: `${Math.round(cert.final_quiz_score || 0)}%` },
                                    { label: 'Issued', value: new Date(cert.issued_at).toLocaleDateString('en-CA', { year: 'numeric', month: 'long', day: 'numeric' }) },
                                    { label: 'Status', value: cert.status?.toUpperCase() },
                                ].map(({ label, value }) => (
                                    <div key={label} className="flex justify-between py-2 border-b border-[hsl(var(--border))] last:border-0 text-sm">
                                        <span className="text-[hsl(var(--muted-foreground))]">{label}</span>
                                        <span className="font-medium text-right">{value}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
                            <XCircle className="w-16 h-16 text-red-400 mx-auto mb-3" />
                            <h1 className="text-2xl font-bold mb-2">Certificate Not Found</h1>
                            <p className="text-sm text-[hsl(var(--muted-foreground))]">
                                The certificate number <strong>{certificateNumber}</strong> was not found in our records.
                            </p>
                        </div>
                    )}
                </div>
            </main>

            <footer className="text-center py-6 text-xs text-[hsl(var(--muted-foreground))]">
                © 2026 Spinr. This page verifies driver training certificates for insurance and city authorities.
            </footer>
        </div>
    );
}
