import { NextResponse } from 'next/server';
import { sendSMSWithRetry, checkOptOutStatus } from '@/lib/twilio-client';
import { requireAdmin } from '@/lib/api-auth';

const DEFAULT_MESSAGE = `Hey! Complete your Spinr driver registration in 2 mins and start earning. 
Open the app: https://spinr.ca/signup?ref=sms 
Reply STOP to opt out.`;

// Delay helper to respect rate limits
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

export async function POST(request) {
    try {
        // Require admin authentication
        const auth = await requireAdmin();
        if (auth.response) return auth.response;

        const { phones, message, customMessage } = await request.json();

        if (!phones || !Array.isArray(phones) || phones.length === 0) {
            return NextResponse.json({ error: 'Phone numbers are required' }, { status: 400 });
        }

        // Clean up phone numbers (remove spaces, newlines, etc.)
        const cleanPhones = phones
            .map(p => p.trim())
            .filter(p => p.length > 0);

        if (cleanPhones.length === 0) {
            return NextResponse.json({ error: 'No valid phone numbers provided' }, { status: 400 });
        }

        // Get Supabase client
        const { createClient } = await import('@supabase/supabase-js');
        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL,
            process.env.SUPABASE_SERVICE_ROLE_KEY
        );

        // Use custom message if provided, otherwise default
        const smsMessage = customMessage || message || DEFAULT_MESSAGE;

        let sentCount = 0;
        let failedCount = 0;
        let skippedCount = 0;
        const results = [];

        // Twilio rate limit: ~100 messages/second for standard accounts
        // Add small delay between sends to be safe
        const SMS_DELAY_MS = 100;

        for (let i = 0; i < cleanPhones.length; i++) {
            const phone = cleanPhones[i];

            try {
                // Check if user has opted out before attempting to send
                const optOutStatus = await checkOptOutStatus(phone);
                if (optOutStatus.isOptedOut) {
                    console.log(`Skipping SMS to ${phone} - user has opted out`);
                    // Log the skipped message
                    await supabase.from('sms_log').insert({
                        phone: phone,
                        message: smsMessage,
                        status: 'skipped',
                        processed_as: 'opted_out',
                        optout_at: optOutStatus.optedOutAt,
                    });
                    skippedCount++;
                    results.push({ phone, status: 'skipped', reason: 'opted_out' });
                    continue;
                }

                // Insert pending record first
                const { data: logEntry, error: insertError } = await supabase
                    .from('sms_log')
                    .insert({
                        phone: phone,
                        message: smsMessage,
                        status: 'pending',
                    })
                    .select()
                    .single();

                if (insertError) {
                    console.error('Failed to insert SMS log:', insertError);
                }

                // Send SMS
                const result = await sendSMSWithRetry(phone, smsMessage);

                if (result.success) {
                    // Update log as sent
                    if (logEntry) {
                        await supabase
                            .from('sms_log')
                            .update({
                                status: 'sent',
                                twilio_sid: result.sid,
                                sent_at: new Date().toISOString(),
                            })
                            .eq('id', logEntry.id);
                    }
                    sentCount++;
                    results.push({ phone, status: 'sent', sid: result.sid });
                } else {
                    // Update log as failed
                    if (logEntry) {
                        await supabase
                            .from('sms_log')
                            .update({
                                status: 'failed',
                                error_message: result.error,
                            })
                            .eq('id', logEntry.id);
                    }
                    failedCount++;
                    results.push({ phone, status: 'failed', error: result.error });
                }
            } catch (err) {
                console.error('Exception sending to', phone, ':', err);
                failedCount++;
                results.push({ phone, status: 'failed', error: err.message });
            }

            // Add delay between sends (except after the last one)
            if (i < cleanPhones.length - 1) {
                await delay(SMS_DELAY_MS);
            }
        }

        return NextResponse.json({
            success: true,
            sentCount,
            failedCount,
            skippedCount,
            total: cleanPhones.length,
            message: `Sent SMS to ${sentCount} users${failedCount > 0 ? ` (${failedCount} failed)` : ''}${skippedCount > 0 ? ` (${skippedCount} skipped - opted out)` : ''}`,
            results,
        });

    } catch (error) {
        console.error('SMS reminder error:', error);
        return NextResponse.json({ error: 'Failed to send SMS reminders' }, { status: 500 });
    }
}

// GET endpoint to fetch SMS history
export async function GET(request) {
    try {
        // Require admin authentication
        const auth = await requireAdmin();
        if (auth.response) return auth.response;

        const { searchParams } = new URL(request.url);
        const limit = parseInt(searchParams.get('limit') || '50');
        const status = searchParams.get('status');

        const { createClient } = await import('@supabase/supabase-js');
        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL,
            process.env.SUPABASE_SERVICE_ROLE_KEY
        );

        let query = supabase
            .from('sms_log')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(limit);

        if (status && status !== 'all') {
            query = query.eq('status', status);
        }

        const { data, error } = await query;

        if (error) {
            return NextResponse.json({ error: 'Failed to fetch SMS history' }, { status: 500 });
        }

        // Get summary stats
        const { count: totalCount } = await supabase
            .from('sms_log')
            .select('*', { count: 'exact', head: true });

        const { count: sentCount } = await supabase
            .from('sms_log')
            .select('*', { count: 'exact', head: true })
            .eq('status', 'sent');

        const { count: failedCount } = await supabase
            .from('sms_log')
            .select('*', { count: 'exact', head: true })
            .eq('status', 'failed');

        return NextResponse.json({
            logs: data || [],
            summary: {
                total: totalCount || 0,
                sent: sentCount || 0,
                failed: failedCount || 0,
            },
        });

    } catch (error) {
        console.error('SMS history error:', error);
        return NextResponse.json({ error: 'Failed to fetch SMS history' }, { status: 500 });
    }
}
