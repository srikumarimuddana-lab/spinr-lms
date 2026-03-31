import { NextResponse } from 'next/server';
import { createClient, createServiceClient } from '@/lib/supabase-server';
import crypto from 'crypto';

/**
 * Generate a unique certificate number with collision retry
 * Format: SPINR-CERT-{YEAR}-{RANDOM_HEX}
 * Uses crypto.randomBytes for uniqueness instead of counting rows
 */
async function generateUniqueCertNumber(serviceClient, maxRetries = 5) {
    const year = new Date().getFullYear();
    
    for (let attempt = 0; attempt < maxRetries; attempt++) {
        // Generate a random 4-byte hex string (8 characters, ~4 billion possibilities)
        const randomPart = crypto.randomBytes(4).toString('hex').toUpperCase();
        const certNumber = `SPINR-CERT-${year}-${randomPart}`;
        
        // Check if this certificate number already exists
        const { data: existing } = await serviceClient
            .from('training_certificates')
            .select('id')
            .eq('certificate_number', certNumber)
            .maybeSingle();
        
        if (!existing) {
            return certNumber;
        }
        
        // Collision occurred, try again
        console.warn(`Certificate number collision for ${certNumber}, retrying...`);
    }
    
    throw new Error('Failed to generate unique certificate number after max retries');
}

export async function POST(request) {
    try {
        const { courseId } = await request.json();
        
        if (!courseId) {
            return NextResponse.json({ error: 'courseId is required' }, { status: 400 });
        }

        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const serviceClient = await createServiceClient();

        // ATOMIC CHECK: First check if certificate already exists to prevent duplicates
        // Using FOR UPDATE would be ideal but Supabase doesn't support it via JS client
        // So we use a unique constraint on (user_id, course_id) and handle insert errors
        const { data: existing } = await serviceClient
            .from('training_certificates')
            .select('id, certificate_number')
            .eq('user_id', user.id)
            .eq('course_id', courseId)
            .maybeSingle();
        
        if (existing) {
            return NextResponse.json({ 
                message: 'Certificate already issued',
                certificateNumber: existing.certificate_number 
            });
        }

        // Check if all quizzes in the course are passed
        const { data: quizzes } = await serviceClient.from('quizzes').select('id').eq('course_id', courseId);
        if (!quizzes || quizzes.length === 0) return NextResponse.json({ message: 'No quizzes in course' });

        const { data: attempts } = await serviceClient.from('quiz_attempts').select('*').eq('user_id', user.id).in('quiz_id', quizzes.map((q) => q.id));

        const allPassed = quizzes.every((quiz) => attempts?.some((a) => a.quiz_id === quiz.id && a.passed));
        if (!allPassed) return NextResponse.json({ message: 'Not all quizzes passed yet' });

        // CRITICAL: Verify all lessons are completed before issuing certificate
        const { data: lessons } = await serviceClient.from('lessons').select('id').eq('course_id', courseId);
        if (!lessons || lessons.length === 0) return NextResponse.json({ message: 'No lessons in course' });

        // Check lesson progress for all lessons in the course
        const { data: progress } = await serviceClient.from('lesson_progress')
            .select('lesson_id, completed')
            .eq('user_id', user.id)
            .in('lesson_id', lessons.map((l) => l.id));

        // Verify all lessons are completed
        const allLessonsComplete = lessons.every((lesson) =>
            progress?.some((p) => p.lesson_id === lesson.id && p.completed)
        );
        if (!allLessonsComplete) return NextResponse.json({
            message: 'Complete all lessons before earning the certificate',
            error: 'lessons_not_completed'
        });

        // Get user and course details
        const { data: lmsUser } = await serviceClient.from('lms_users').select('*').eq('id', user.id).single();
        const { data: course } = await serviceClient.from('courses').select('*').eq('id', courseId).single();

        if (!course) {
            return NextResponse.json({ error: 'Course not found' }, { status: 404 });
        }

        // Calculate best quiz score (average of best scores per quiz)
        const bestScores = quizzes.map((quiz) => {
            const quizAttempts = attempts.filter((a) => a.quiz_id === quiz.id && a.passed);
            return Math.max(...quizAttempts.map((a) => a.score));
        });
        const avgScore = bestScores.reduce((a, b) => a + b, 0) / bestScores.length;

        // Generate unique certificate number with collision handling
        const certNumber = await generateUniqueCertNumber(serviceClient);

        // Insert certificate with retry on duplicate key error
        // This handles the race condition where two requests pass the existence check
        const { error: insertError } = await serviceClient.from('training_certificates').insert({
            certificate_number: certNumber,
            user_id: user.id,
            course_id: courseId,
            driver_name: lmsUser?.full_name || user.email,
            driver_email: lmsUser?.email || user.email,
            course_title: course.title,
            final_quiz_score: avgScore,
            metadata: { quiz_count: quizzes.length, best_scores: bestScores },
        });

        if (insertError) {
            // Check if it's a duplicate key error (user already has certificate for this course)
            if (insertError.code === '23505') { // PostgreSQL unique violation
                // Re-fetch the existing certificate
                const { data: existingCert } = await serviceClient
                    .from('training_certificates')
                    .select('certificate_number')
                    .eq('user_id', user.id)
                    .eq('course_id', courseId)
                    .single();
                
                return NextResponse.json({ 
                    message: 'Certificate already issued',
                    certificateNumber: existingCert?.certificate_number 
                });
            }
            
            console.error('Certificate insert error:', insertError);
            return NextResponse.json({ error: 'Failed to issue certificate' }, { status: 500 });
        }

        // Update enrollment to completed
        await serviceClient.from('enrollments').update({
            status: 'completed',
            progress: 100,
            completed_at: new Date().toISOString(),
        }).eq('user_id', user.id).eq('course_id', courseId);

        // Audit log
        await serviceClient.from('audit_log').insert({
            user_id: user.id,
            action: 'certificate_issued',
            entity_type: 'certificate',
            details: { certificate_number: certNumber, course_title: course.title, score: avgScore },
        });

        return NextResponse.json({ success: true, certificateNumber: certNumber });
    } catch (error) {
        console.error('Certificate error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
