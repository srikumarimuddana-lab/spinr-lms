import { NextResponse } from 'next/server';
import { sendBulkEmails, getAvailableTemplates } from '@/lib/email/sender';

export async function POST(request) {
    try {
        const { subject, body, userIds, additionalEmails, preheader, ctaLink, ctaText, templateId } = await request.json();

        if (!subject || !body) {
            return NextResponse.json({ error: 'Subject and body are required' }, { status: 400 });
        }

        // Get users from Supabase
        const { createClient } = await import('@supabase/supabase-js');
        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL,
            process.env.SUPABASE_SERVICE_ROLE_KEY
        );

        let emails = [];

        // Get selected users by IDs
        if (userIds && Array.isArray(userIds) && userIds.length > 0) {
            const { data: users } = await supabase
                .from('lms_users')
                .select('email, full_name')
                .in('id', userIds);

            if (users) {
                emails = users.map(u => u.email).filter(Boolean);
            }
        }

        // Add additional emails
        if (additionalEmails && typeof additionalEmails === 'string') {
            const additionalList = additionalEmails
                .split(/[\n,]/)
                .map(e => e.trim().toLowerCase())
                .filter(e => e && e.includes('@'));

            // Add unique emails
            additionalList.forEach(email => {
                if (!emails.includes(email)) {
                    emails.push(email);
                }
            });
        }

        if (emails.length === 0) {
            return NextResponse.json({ error: 'No valid email addresses found' }, { status: 400 });
        }

        // If templateId provided, use database template with variable substitution
        if (templateId) {
            const { createServiceClient } = await import('@/lib/supabase-server');
            const serviceClient = await createServiceClient();

            const { data: template } = await serviceClient
                .from('email_templates')
                .select('*')
                .eq('id', templateId)
                .single();

            if (template) {
                // Send using the template from database
                const result = await sendBulkEmails({
                    recipients: emails,
                    templateType: template.type,
                    variables: (email, index) => ({
                        subject,
                        preheader: preheader || '',
                        content: body,
                        ctaButton: ctaLink ? { href: ctaLink, text: ctaText || 'Learn More' } : null,
                    }),
                });

                if (result.error) {
                    return NextResponse.json({ error: 'Failed to send promotional emails' }, { status: 500 });
                }

                return NextResponse.json({
                    success: true,
                    ...result,
                    message: `Sent promotional email to ${result.sentCount} recipients${result.failedCount > 0 ? ` (${result.failedCount} failed)` : ''}`
                });
            }
        }

        // Fallback: Send using promotional template type (will use database template)
        const result = await sendBulkEmails({
            recipients: emails,
            templateType: 'promotional',
            variables: (email) => ({
                subject,
                preheader: preheader || '',
                content: body,
                ctaButton: ctaLink ? { href: ctaLink, text: ctaText || 'Learn More' } : null,
            }),
        });

        if (result.error) {
            return NextResponse.json({ error: 'Failed to send promotional emails' }, { status: 500 });
        }

        return NextResponse.json({
            success: true,
            ...result,
            message: `Sent promotional email to ${result.sentCount} recipients${result.failedCount > 0 ? ` (${result.failedCount} failed)` : ''}`
        });

    } catch (error) {
        console.error('Promotional email error:', error);
        return NextResponse.json({ error: 'Failed to send promotional email' }, { status: 500 });
    }
}

export async function GET() {
    const templates = await getAvailableTemplates();
    return NextResponse.json({ templates });
}
