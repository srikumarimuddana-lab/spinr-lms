'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase-client';
import Link from 'next/link';
import { toast } from 'sonner';
import { Plus, Edit, Trash2, Eye, EyeOff } from 'lucide-react';

export default function AdminCoursesPage() {
    const [courses, setCourses] = useState([]);
    const [showCreate, setShowCreate] = useState(false);
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const supabase = createClient();

    useEffect(() => { loadCourses(); }, []);

    async function loadCourses() {
        const { data } = await supabase.from('courses').select('*').order('sort_order');
        setCourses(data || []);
        setLoading(false);
    }

    async function createCourse(e) {
        e.preventDefault();
        setSaving(true);
        const { data: { user } } = await supabase.auth.getUser();
        const { error } = await supabase.from('courses').insert({ title, description, created_by: user.id });
        if (error) toast.error(error.message);
        else { toast.success('Course created!'); setTitle(''); setDescription(''); setShowCreate(false); loadCourses(); }
        setSaving(false);
    }

    async function togglePublish(course) {
        const { error } = await supabase.from('courses').update({ is_published: !course.is_published }).eq('id', course.id);
        if (error) toast.error(error.message);
        else { toast.success(course.is_published ? 'Unpublished' : 'Published!'); loadCourses(); }
    }

    async function deleteCourse(id) {
        if (!confirm('Delete this course and all its lessons/quizzes?')) return;
        const { error } = await supabase.from('courses').delete().eq('id', id);
        if (error) toast.error(error.message);
        else { toast.success('Deleted'); loadCourses(); }
    }

    if (loading) return <div className="flex items-center justify-center py-20"><div className="w-8 h-8 border-2 border-[hsl(var(--primary))] border-t-transparent rounded-full animate-spin" /></div>;

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-xl sm:text-2xl font-bold">Manage Courses</h1>
                <button onClick={() => setShowCreate(!showCreate)} className="flex items-center gap-1.5 bg-[hsl(var(--primary))] text-white px-4 py-2.5 rounded-xl text-sm font-medium hover:opacity-90 transition-opacity touch-target">
                    <Plus className="w-4 h-4" /> New Course
                </button>
            </div>

            {showCreate && (
                <form onSubmit={createCourse} className="bg-white rounded-xl p-5 shadow-sm space-y-4">
                    <h3 className="font-semibold">Create New Course</h3>
                    <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Course Title" required className="w-full px-4 py-3 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--secondary))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))] text-base touch-target" />
                    <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Course Description" rows={3} className="w-full px-4 py-3 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--secondary))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))] text-base resize-none" />
                    <div className="flex gap-2">
                        <button type="submit" disabled={saving} className="bg-[hsl(var(--primary))] text-white px-6 py-2.5 rounded-xl text-sm font-medium hover:opacity-90 disabled:opacity-50 touch-target">{saving ? 'Creating...' : 'Create'}</button>
                        <button type="button" onClick={() => setShowCreate(false)} className="bg-[hsl(var(--secondary))] px-6 py-2.5 rounded-xl text-sm font-medium touch-target">Cancel</button>
                    </div>
                </form>
            )}

            <div className="space-y-3">
                {courses.map((course) => (
                    <div key={course.id} className="bg-white rounded-xl p-4 shadow-sm">
                        <div className="flex items-start justify-between gap-3">
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                    <h3 className="font-semibold text-sm truncate">{course.title}</h3>
                                    <span className={`text-xs px-2 py-0.5 rounded-full ${course.is_published ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                                        {course.is_published ? 'Published' : 'Draft'}
                                    </span>
                                </div>
                                <p className="text-xs text-[hsl(var(--muted-foreground))] mt-1 line-clamp-1">{course.description}</p>
                            </div>
                            <div className="flex items-center gap-1 shrink-0">
                                <button onClick={() => togglePublish(course)} className="p-2 rounded-lg hover:bg-[hsl(var(--secondary))] transition-colors touch-target" title={course.is_published ? 'Unpublish' : 'Publish'}>
                                    {course.is_published ? <EyeOff className="w-4 h-4 text-gray-500" /> : <Eye className="w-4 h-4 text-green-600" />}
                                </button>
                                <Link href={`/admin/courses/${course.id}`} className="p-2 rounded-lg hover:bg-[hsl(var(--secondary))] transition-colors touch-target">
                                    <Edit className="w-4 h-4 text-blue-600" />
                                </Link>
                                <button onClick={() => deleteCourse(course.id)} className="p-2 rounded-lg hover:bg-red-50 transition-colors touch-target">
                                    <Trash2 className="w-4 h-4 text-red-500" />
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
