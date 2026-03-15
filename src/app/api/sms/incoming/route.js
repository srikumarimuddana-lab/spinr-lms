import { NextResponse } from 'next/server';
import { sendSMS } from '@/lib/twilio-client';

// Standard STOP keywords that trigger opt-out
const STOP_KEYWORDS = ['stop', 'stop all', 'unsubscribe', 'cancel', 'end', 'quit'];
// Keywords to re-opt in
const OPTIN_KEYWORDS = ['start', 'subscribe', 'yes', 'unstop', 'opt in'];

/**
 * Format phone number to consistent E.164 format
 */
function formatPhoneNumber(phone) {
    let formatted = phone.trim().replace(/\s/g, '');
    if (!formatted.startsWith('+')) {
        formatted = '+1' + formatted.replace(/\D/g, '');
    }
    return formatted;
}

/**
 * Check if message is a STOP keyword
 */
function isStopKeyword(message) {
    const normalized = message.toLowerCase().trim();
    return STOP_KEYWORDS.includes(normalized);
}

/**
 * Check if message is an OPT-IN keyword
 */
function isOptInKeyword(message) {
    const normalized = message.toLowerCase().trim();
    return OPTIN_KEYWORDS.includes(normalized);
}

/**
 * POST - Handle incoming SMS from Twilio
 * Twilio will POST to this endpoint when user replies with STOP, etc.
 */
export async function POST(request) {
    try {
        // Parse form data from Twilio (Twilio sends form-urlencoded)
        const formData = await request.formData();

        const from = formData.get('From');      // User's phone number
        const body = formData.get('Body');      // The message content
        const messageSid = formData.get('MessageSid');   // Message SID

        // Log the incoming message for debugging
        console.log('Incoming SMS:', { from, body, messageSid });

        if (!from || !body) {
            console.error('Missing required fields from Twilio');
            return NextResponse.xml('<Response></Response>', { status: 200 });
        }

        // Format phone number consistently
        const phone = formatPhoneNumber(from);

        // Get Supabase client
        const { createClient } = await import('@supabase/supabase-js');
        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL,
            process.env.SUPABASE_SERVICE_ROLE_KEY
        );

        // Log the incoming message to sms_log
        await supabase.from('sms_log').insert({
            phone: phone,
            message: body,
            status: 'received',
            processed_as: 'incoming_sms',
        });

        // Check if this is a STOP keyword
        if (isStopKeyword(body)) {
            console.log(`User ${phone} opted out via SMS STOP`);

            // Add or update opt-out record
            const { error: upsertError } = await supabase
                .from('sms_optout')
                .upsert({
                    phone: phone,
                    opted_out_at: new Date().toISOString(),
                    optout_method: 'sms_stop',
                    is_active: true,
                    reopted_in_at: null,
                }, {
                    onConflict: 'phone',
                    ignoreDuplicates: false,
                });

            if (upsertError) {
                console.error('Failed to record opt-out:', upsertError);
            }

            // Send confirmation message (Twilio requires valid TwiML response)
            // Note: We respond with TwiML to send an automated reply
            const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Message>You have been unsubscribed from Spinr SMS messages. Reply START to opt back in.</Message>
</Response>`;

            return new NextResponse(twiml, {
                headers: {
                    'Content-Type': 'text/xml',
                },
            });
        }

        // Check if this is an OPT-IN keyword (re-subscribing)
        if (isOptInKeyword(body)) {
            console.log(`User ${phone} opted back in via SMS`);

            // Update opt-out record to mark as re-opted in
            const { error: updateError } = await supabase
                .from('sms_optout')
                .update({
                    is_active: false,
                    reopted_in_at: new Date().toISOString(),
                    updated_at: new Date().toISOString(),
                })
                .eq('phone', phone)
                .eq('is_active', true);

            if (updateError) {
                console.error('Failed to record re-opt-in:', updateError);
            }

            const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Message>You have been resubscribed to Spinr SMS messages. Thank you!</Message>
</Response>`;

            return new NextResponse(twiml, {
                headers: {
                    'Content-Type': 'text/xml',
                },
            });
        }

        // For any other message, respond with help info
        const helpTwiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Message>Reply STOP to unsubscribe from Spinr SMS. Reply START to resubscribe.</Message>
</Response>`;

        return new NextResponse(helpTwiml, {
            headers: {
                'Content-Type': 'text/xml',
            },
        });

    } catch (error) {
        console.error('Error handling incoming SMS:', error);

        // Always return valid TwiML to avoid Twilio errors
        const errorTwiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response></Response>`;

        return new NextResponse(errorTwiml, {
            headers: {
                'Content-Type': 'text/xml',
            },
        });
    }
}

/**
 * GET - Health check endpoint
 */
export async function GET() {
    return NextResponse.json({
        status: 'ok',
        message: 'SMS incoming webhook is active',
        endpoints: {
            POST: 'Handle incoming SMS messages',
        }
    });
}
