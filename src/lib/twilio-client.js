import twilio from 'twilio';

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER;

// Initialize Twilio client only if credentials are available
const client = accountSid && authToken ? twilio(accountSid, authToken) : null;

/**
 * Send an SMS message via Twilio
 * @param {string} to - Phone number to send to (E.164 format, e.g., +1234567890)
 * @param {string} message - Message body
 * @returns {Promise<{success: boolean, sid?: string, error?: string}>}
 */
export async function sendSMS(to, message) {
    if (!client) {
        console.error('Twilio client not initialized. Check environment variables.');
        return { success: false, error: 'Twilio not configured' };
    }

    if (!to) {
        return { success: false, error: 'Phone number is required' };
    }

    // Format phone number to E.164 if not already
    let formattedPhone = to.trim();
    if (!formattedPhone.startsWith('+')) {
        // Assume Canadian number if no country code
        formattedPhone = '+1' + formattedPhone.replace(/\D/g, '');
    }

    try {
        const result = await client.messages.create({
            body: message,
            from: twilioPhoneNumber,
            to: formattedPhone,
        });

        console.log('SMS sent successfully:', result.sid);
        return { success: true, sid: result.sid };
    } catch (error) {
        console.error('Twilio SMS error:', error.message);
        return { success: false, error: error.message };
    }
}

/**
 * Send SMS with retry logic
 * @param {string} to - Phone number
 * @param {string} message - Message body
 * @param {number} maxRetries - Maximum retry attempts
 * @returns {Promise<{success: boolean, sid?: string, error?: string}>}
 */
export async function sendSMSWithRetry(to, message, maxRetries = 3) {
    for (let attempt = 0; attempt < maxRetries; attempt++) {
        const result = await sendSMS(to, message);

        if (result.success) {
            return result;
        }

        // Don't retry on certain errors
        if (result.error && (
            result.error.includes('invalid') ||
            result.error.includes('unverified') ||
            result.error.includes('not configured')
        )) {
            return result;
        }

        // Wait before retry (exponential backoff)
        if (attempt < maxRetries - 1) {
            const waitTime = Math.pow(2, attempt) * 1000;
            console.log(`Retry ${attempt + 1}/${maxRetries} for ${to} after ${waitTime}ms`);
            await new Promise(resolve => setTimeout(resolve, waitTime));
        }
    }

    return { success: false, error: 'Max retries exceeded' };
}

export default { sendSMS, sendSMSWithRetry };

/**
 * Check if a phone number has opted out of SMS
 * @param {string} phone - Phone number to check (E.164 format)
 * @returns {Promise<{isOptedOut: boolean, optedOutAt?: string}>}
 */
export async function checkOptOutStatus(phone) {
    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    // Format phone number consistently
    let formattedPhone = phone.trim();
    if (!formattedPhone.startsWith('+')) {
        formattedPhone = '+1' + formattedPhone.replace(/\D/g, '');
    }

    const { data, error } = await supabase
        .from('sms_optout')
        .select('opted_out_at, is_active')
        .eq('phone', formattedPhone)
        .eq('is_active', true)
        .single();

    if (error || !data) {
        // No opt-out record found - not opted out
        return { isOptedOut: false };
    }

    return {
        isOptedOut: true,
        optedOutAt: data.opted_out_at
    };
}
