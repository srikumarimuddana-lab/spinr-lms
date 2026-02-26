'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase-client';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'sonner';
import { ArrowLeft, Plus, Trash2, Save, GripVertical } from 'lucide-react';

export default function AdminCourseEditorPage() {
    const { courseId } = useParams();
    const router = useRouter();
    const [course, setCourse] = useState(null);
    const [lessons, setLessons] = useState([]);
    const [quizzes, setQuizzes] = useState([]);
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [saving, setSaving] = useState(false);
    const [loading, setLoading] = useState(true);

    // Lesson editor
    const [editLesson, setEditLesson] = useState(null);
    const [lessonTitle, setLessonTitle] = useState('');
    const [lessonContent, setLessonContent] = useState('');

    // Quiz builder
    const [showQuizBuilder, setShowQuizBuilder] = useState(false);
    const [quizTitle, setQuizTitle] = useState('');
    const [passingScore, setPassingScore] = useState(70);
    const [questions, setQuestions] = useState([]);

    const supabase = createClient();

    useEffect(() => { loadCourse(); }, [courseId]);

    async function loadCourse() {
        const { data: c } = await supabase.from('courses').select('*').eq('id', courseId).single();
        const { data: l } = await supabase.from('lessons').select('*').eq('course_id', courseId).order('sort_order');
        const { data: q } = await supabase.from('quizzes').select('*, quiz_questions(*, quiz_options(*))').eq('course_id', courseId).order('sort_order');
        setCourse(c); setLessons(l || []); setQuizzes(q || []);
        setTitle(c?.title || ''); setDescription(c?.description || '');
        setLoading(false);
    }

    async function saveCourse() {
        setSaving(true);
        const { error } = await supabase.from('courses').update({ title, description, updated_at: new Date().toISOString() }).eq('id', courseId);
        if (error) toast.error(error.message);
        else toast.success('Course saved!');
        setSaving(false);
    }

    async function addLesson() {
        const { error } = await supabase.from('lessons').insert({ course_id: courseId, title: 'New Lesson', content: '', sort_order: lessons.length });
        if (error) toast.error(error.message);
        else { toast.success('Lesson added!'); loadCourse(); }
    }

    async function saveLesson() {
        setSaving(true);
        const { error } = await supabase.from('lessons').update({ title: lessonTitle, content: lessonContent, updated_at: new Date().toISOString() }).eq('id', editLesson.id);
        if (error) toast.error(error.message);
        else { toast.success('Lesson saved!'); setEditLesson(null); loadCourse(); }
        setSaving(false);
    }

    async function deleteLesson(id) {
        if (!confirm('Delete this lesson?')) return;
        await supabase.from('lessons').delete().eq('id', id);
        toast.success('Deleted'); loadCourse();
    }

    async function createQuiz() {
        if (!quizTitle || questions.length === 0) { toast.error('Add a title and at least one question'); return; }
        setSaving(true);

        const { data: quiz, error } = await supabase.from('quizzes').insert({ course_id: courseId, title: quizTitle, passing_score: passingScore, sort_order: quizzes.length }).select().single();
        if (error) { toast.error(error.message); setSaving(false); return; }

        for (let qi = 0; qi < questions.length; qi++) {
            const q = questions[qi];
            const { data: qData } = await supabase.from('quiz_questions').insert({ quiz_id: quiz.id, question_text: q.text, sort_order: qi }).select().single();
            if (qData) {
                for (let oi = 0; oi < q.options.length; oi++) {
                    await supabase.from('quiz_options').insert({ question_id: qData.id, option_text: q.options[oi].text, is_correct: q.options[oi].correct, sort_order: oi });
                }
            }
        }

        toast.success('Quiz created!');
        setShowQuizBuilder(false); setQuizTitle(''); setPassingScore(70); setQuestions([]);
        loadCourse();
        setSaving(false);
    }

    async function deleteQuiz(id) {
        if (!confirm('Delete this quiz?')) return;
        await supabase.from('quizzes').delete().eq('id', id);
        toast.success('Deleted'); loadCourse();
    }

    function addQuestion() {
        setQuestions([...questions, { text: '', options: [{ text: '', correct: false }, { text: '', correct: false }, { text: '', correct: false }, { text: '', correct: false }] }]);
    }

    function updateQuestion(qi, field, value) {
        const updated = [...questions];
        updated[qi][field] = value;
        setQuestions(updated);
    }

    function updateOption(qi, oi, field, value) {
        const updated = [...questions];
        if (field === 'correct') {
            updated[qi].options = updated[qi].options.map((o, i) => ({ ...o, correct: i === oi }));
        } else {
            updated[qi].options[oi][field] = value;
        }
        setQuestions(updated);
    }

    function removeQuestion(qi) {
        setQuestions(questions.filter((_, i) => i !== qi));
    }

    if (loading) return <div className="flex items-center justify-center py-20"><div className="w-8 h-8 border-2 border-[hsl(var(--primary))] border-t-transparent rounded-full animate-spin" /></div>;

    // Lesson editor modal
    if (editLesson) return (
        <div className="space-y-6">
            <button onClick={() => setEditLesson(null)} className="inline-flex items-center gap-1.5 text-sm text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] touch-target">
                <ArrowLeft className="w-4 h-4" /> Back to Course
            </button>
            <div className="bg-white rounded-xl p-5 shadow-sm space-y-4">
                <h3 className="font-semibold">Edit Lesson</h3>
                <input type="text" value={lessonTitle} onChange={(e) => setLessonTitle(e.target.value)} placeholder="Lesson Title" className="w-full px-4 py-3 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--secondary))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))] text-base touch-target" />
                <textarea value={lessonContent} onChange={(e) => setLessonContent(e.target.value)} placeholder="Lesson content... Write the training material here." rows={15} className="w-full px-4 py-3 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--secondary))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))] text-sm font-mono resize-y" />
                <button onClick={saveLesson} disabled={saving} className="bg-[hsl(var(--primary))] text-white px-6 py-2.5 rounded-xl text-sm font-medium hover:opacity-90 disabled:opacity-50 touch-target flex items-center gap-2">
                    <Save className="w-4 h-4" /> {saving ? 'Saving...' : 'Save Lesson'}
                </button>
            </div>
        </div>
    );

    return (
        <div className="space-y-6">
            <Link href="/admin/courses" className="inline-flex items-center gap-1.5 text-sm text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] touch-target">
                <ArrowLeft className="w-4 h-4" /> Back to Courses
            </Link>

            {/* Course Info */}
            <div className="bg-white rounded-xl p-5 shadow-sm space-y-4">
                <h2 className="font-semibold">Course Details</h2>
                <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Course Title" className="w-full px-4 py-3 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--secondary))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))] text-base touch-target" />
                <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Description" rows={3} className="w-full px-4 py-3 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--secondary))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))] text-base resize-none" />
                <button onClick={saveCourse} disabled={saving} className="bg-[hsl(var(--primary))] text-white px-6 py-2.5 rounded-xl text-sm font-medium hover:opacity-90 disabled:opacity-50 touch-target flex items-center gap-2">
                    <Save className="w-4 h-4" /> {saving ? 'Saving...' : 'Save'}
                </button>
            </div>

            {/* Lessons */}
            <div className="bg-white rounded-xl p-5 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="font-semibold">Lessons ({lessons.length})</h2>
                    <button onClick={addLesson} className="flex items-center gap-1.5 bg-[hsl(var(--secondary))] px-3 py-2 rounded-lg text-xs font-medium hover:bg-[hsl(var(--border))] touch-target">
                        <Plus className="w-3.5 h-3.5" /> Add Lesson
                    </button>
                </div>
                <div className="space-y-2">
                    {lessons.map((lesson, i) => (
                        <div key={lesson.id} className="flex items-center justify-between gap-2 px-3 py-3 rounded-xl bg-[hsl(var(--secondary))] hover:bg-[hsl(var(--border))] transition-colors">
                            <div className="flex items-center gap-2 min-w-0 flex-1">
                                <GripVertical className="w-4 h-4 text-[hsl(var(--muted-foreground))] shrink-0" />
                                <span className="text-sm font-medium truncate">{i + 1}. {lesson.title}</span>
                            </div>
                            <div className="flex items-center gap-1 shrink-0">
                                <button onClick={() => { setEditLesson(lesson); setLessonTitle(lesson.title); setLessonContent(lesson.content); }} className="p-2 rounded-lg hover:bg-white transition-colors touch-target text-blue-600 text-xs font-medium">Edit</button>
                                <button onClick={() => deleteLesson(lesson.id)} className="p-2 rounded-lg hover:bg-red-50 transition-colors touch-target"><Trash2 className="w-4 h-4 text-red-500" /></button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Quizzes */}
            <div className="bg-white rounded-xl p-5 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="font-semibold">Quizzes ({quizzes.length})</h2>
                    <button onClick={() => { setShowQuizBuilder(true); addQuestion(); }} className="flex items-center gap-1.5 bg-[hsl(var(--secondary))] px-3 py-2 rounded-lg text-xs font-medium hover:bg-[hsl(var(--border))] touch-target">
                        <Plus className="w-3.5 h-3.5" /> Add Quiz
                    </button>
                </div>
                <div className="space-y-2">
                    {quizzes.map((quiz) => (
                        <div key={quiz.id} className="flex items-center justify-between gap-2 px-3 py-3 rounded-xl bg-[hsl(var(--secondary))]">
                            <div className="min-w-0 flex-1">
                                <p className="text-sm font-medium truncate">{quiz.title}</p>
                                <p className="text-xs text-[hsl(var(--muted-foreground))]">{quiz.quiz_questions?.length || 0} questions · Pass: {quiz.passing_score}%</p>
                            </div>
                            <button onClick={() => deleteQuiz(quiz.id)} className="p-2 rounded-lg hover:bg-red-50 transition-colors touch-target"><Trash2 className="w-4 h-4 text-red-500" /></button>
                        </div>
                    ))}
                </div>
            </div>

            {/* Quiz Builder */}
            {showQuizBuilder && (
                <div className="bg-white rounded-xl p-5 shadow-sm space-y-4">
                    <h3 className="font-semibold">Create Quiz</h3>
                    <input type="text" value={quizTitle} onChange={(e) => setQuizTitle(e.target.value)} placeholder="Quiz Title" className="w-full px-4 py-3 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--secondary))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))] text-base touch-target" />
                    <div className="flex items-center gap-2">
                        <label className="text-sm font-medium">Passing Score:</label>
                        <input type="number" value={passingScore} onChange={(e) => setPassingScore(Number(e.target.value))} min={0} max={100} className="w-20 px-3 py-2 rounded-lg border border-[hsl(var(--border))] text-sm text-center" />
                        <span className="text-sm text-[hsl(var(--muted-foreground))]">%</span>
                    </div>

                    {questions.map((q, qi) => (
                        <div key={qi} className="border border-[hsl(var(--border))] rounded-xl p-4 space-y-3">
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-semibold text-[hsl(var(--muted-foreground))]">Question {qi + 1}</span>
                                <button onClick={() => removeQuestion(qi)} className="text-red-500 text-xs hover:underline touch-target">Remove</button>
                            </div>
                            <input type="text" value={q.text} onChange={(e) => updateQuestion(qi, 'text', e.target.value)} placeholder="Question text" className="w-full px-4 py-3 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--secondary))] text-sm touch-target" />
                            <div className="space-y-2">
                                {q.options.map((opt, oi) => (
                                    <div key={oi} className="flex items-center gap-2">
                                        <input type="radio" name={`correct-${qi}`} checked={opt.correct} onChange={() => updateOption(qi, oi, 'correct', true)} className="w-4 h-4 text-[hsl(var(--primary))]" />
                                        <input type="text" value={opt.text} onChange={(e) => updateOption(qi, oi, 'text', e.target.value)} placeholder={`Option ${oi + 1}`} className="flex-1 px-3 py-2 rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--secondary))] text-sm touch-target" />
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}

                    <button onClick={addQuestion} className="w-full border-2 border-dashed border-[hsl(var(--border))] py-3 rounded-xl text-sm text-[hsl(var(--muted-foreground))] hover:border-[hsl(var(--primary))] hover:text-[hsl(var(--primary))] transition-colors touch-target">
                        + Add Question
                    </button>

                    <div className="flex gap-2">
                        <button onClick={createQuiz} disabled={saving} className="bg-[hsl(var(--primary))] text-white px-6 py-2.5 rounded-xl text-sm font-medium hover:opacity-90 disabled:opacity-50 touch-target">{saving ? 'Creating...' : 'Create Quiz'}</button>
                        <button onClick={() => { setShowQuizBuilder(false); setQuestions([]); }} className="bg-[hsl(var(--secondary))] px-6 py-2.5 rounded-xl text-sm font-medium touch-target">Cancel</button>
                    </div>
                </div>
            )}
        </div>
    );
}
