import { NextResponse } from 'next/server';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request) {
    try {
        const { subject, body, userIds, additionalEmails } = await request.json();

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
                .select('email')
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

        // Send emails in batches (Resend allows up to 100 per batch)
        const batchSize = 100;
        let sentCount = 0;
        let failedCount = 0;

        for (let i = 0; i < emails.length; i += batchSize) {
            const batch = emails.slice(i, i + batchSize);

            const { error } = await resend.emails.send({
                from: process.env.EMAIL_FROM_ADDRESS || 'Spinr Training <noreply@training.spinr.ca>',
                to: batch,
                subject: subject,
                html: body,
            });

            if (error) {
                console.error('Resend error:', error);
                failedCount += batch.length;
            } else {
                sentCount += batch.length;
            }
        }

        return NextResponse.json({
            success: true,
            sentCount,
            failedCount,
            message: `Sent promotional email to ${sentCount} recipients`
        });

    } catch (error) {
        console.error('Promotional email error:', error);
        return NextResponse.json({ error: 'Failed to send promotional email' }, { status: 500 });
    }
}
