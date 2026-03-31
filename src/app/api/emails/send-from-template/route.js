import { NextResponse } from 'next/server';
import { sendBulkEmails, getAvailableTemplates } from '@/lib/email/sender';

/**
 * Send email from any database template
 *
 * Body:
 * {
 *   templateType: 'training_reminder',
 *   recipients: ['user1@example.com', 'user2@example.com'],
 *   variables: {
 *     userName: 'John',
 *     courseTitle: 'Safety Training',
 *     ...
 *   }
 * }
 */
export async function POST(request) {
    try {
        const { templateType, recipients, variables } = await request.json();

        if (!templateType || !recipients || !Array.isArray(recipients)) {
            return NextResponse.json(
                { error: 'templateType and recipients array are required' },
                { status: 400 }
            );
        }

        const result = await sendBulkEmails({
            recipients,
            templateType,
            variables: typeof variables === 'function' ? variables : () => variables,
        });

        if (result.error) {
            console.error('Email sending error:', result.error);
            return NextResponse.json(
                { error: 'Failed to send emails', details: result.error.message },
                { status: 500 }
            );
        }

        return NextResponse.json({
            success: true,
            ...result,
        });

    } catch (error) {
        console.error('Send from template error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

export async function GET() {
    const templates = await getAvailableTemplates();
    return NextResponse.json({ templates });
}
