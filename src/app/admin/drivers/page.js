'use client';

import { useState, useEffect, useRef } from 'react';
import { createClient } from '@/lib/supabase-client';
import { toast } from 'sonner';
import {
    Upload, Users, Search, Filter, Mail, MessageSquare, Send,
    ChevronDown, ChevronUp, CheckCircle, Clock, XCircle, AlertCircle,
    RefreshCw, Download, UserCheck, UserX, Bell, Car, Edit, Trash2, X, MapPin, Link2
} from 'lucide-react';

export default function AdminDriversPage() {
    const [drivers, setDrivers] = useState([]);
    const [groupCounts, setGroupCounts] = useState({});
    const [selectedGroup, setSelectedGroup] = useState('all_spinr_approved');
    const [selectedCity, setSelectedCity] = useState('');
    const [cities, setCities] = useState([]);
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [selectedDrivers, setSelectedDrivers] = useState([]);
    const [expandedDriver, setExpandedDriver] = useState(null);
    const [showCommunicateModal, setShowCommunicateModal] = useState(false);
    const [showUploadModal, setShowUploadModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [editingDriver, setEditingDriver] = useState(null);
    const [pagination, setPagination] = useState({ page: 1, total: 0, totalPages: 1 });
    const [syncing, setSyncing] = useState(false);
    const fileInputRef = useRef(null);

    useEffect(() => { loadDrivers(); }, [selectedGroup, selectedCity, search, pagination.page]);

    async function syncWithLMS() {
        setSyncing(true);
        try {
            const response = await fetch('/api/drivers/sync', {
                method: 'POST',
            });
            const result = await response.json();

            if (result.success) {
                const { synced, notRegistered, alreadyLinked } = result.data;
                toast.success(
                    `Sync complete: ${synced} updated, ${alreadyLinked} already linked, ${notRegistered} not registered`
                );
                loadDrivers();
            } else {
                toast.error(result.error || 'Sync failed');
            }
        } catch (error) {
            toast.error('Sync failed: ' + error.message);
        }
        setSyncing(false);
    }

    async function loadDrivers() {
        setLoading(true);
        try {
            const params = new URLSearchParams({
                group: selectedGroup,
                page: pagination.page.toString(),
                limit: '50',
            });
            if (search) params.set('search', search);
            if (selectedCity) params.set('city', selectedCity);

            const response = await fetch(`/api/drivers?${params}`);
            const result = await response.json();

            if (result.success) {
                setDrivers(result.data.drivers);
                setPagination(result.data.pagination);
                setGroupCounts(result.data.groupCounts);
                
                // Extract unique cities
                const uniqueCities = [...new Set(result.data.drivers.map(d => d.city).filter(Boolean))];
                setCities(prev => {
                    const allCities = [...new Set([...prev, ...uniqueCities])];
                    return allCities.sort();
                });
            } else {
                toast.error(result.error || 'Failed to load drivers');
            }
        } catch (error) {
            toast.error('Failed to load drivers');
        }
        setLoading(false);
    }

    function handleFileSelect(event) {
        const file = event.target.files?.[0];
        if (!file) return;
        setShowUploadModal(true);
    }

    function toggleSelectAll() {
        if (selectedDrivers.length === drivers.length) {
            setSelectedDrivers([]);
        } else {
            setSelectedDrivers(drivers.map(d => d.id));
        }
    }

    function toggleSelectDriver(driverId) {
        setSelectedDrivers(prev =>
            prev.includes(driverId)
                ? prev.filter(id => id !== driverId)
                : [...prev, driverId]
        );
    }

    function getTrainingStatusBadge(status) {
        const badges = {
            completed: { label: 'Completed', color: 'bg-green-50 text-green-700', icon: CheckCircle },
            in_progress: { label: 'In Progress', color: 'bg-amber-50 text-amber-700', icon: Clock },
            registered: { label: 'Registered', color: 'bg-blue-50 text-blue-700', icon: UserCheck },
            invited: { label: 'Invited', color: 'bg-purple-50 text-purple-700', icon: Bell },
            not_invited: { label: 'Not Invited', color: 'bg-gray-100 text-gray-600', icon: UserX },
        };
        return badges[status] || badges.not_invited;
    }

    async function handleEditDriver(driver) {
        setEditingDriver(driver);
        setShowEditModal(true);
    }

    async function handleDeleteDriver(driver) {
        if (!confirm(`Are you sure you want to delete ${driver.full_name}? This action cannot be undone.`)) {
            return;
        }

        try {
            const response = await fetch(`/api/drivers/${driver.id}`, {
                method: 'DELETE',
            });

            const result = await response.json();

            if (result.success) {
                toast.success('Driver deleted successfully');
                loadDrivers();
            } else {
                toast.error(result.error || 'Failed to delete driver');
            }
        } catch (error) {
            toast.error('Failed to delete driver');
        }
    }

    const groups = [
        { key: 'all_spinr_approved', label: 'All Spinr Approved', count: groupCounts.all_spinr_approved },
        { key: 'not_registered', label: 'Not Registered', count: groupCounts.not_registered },
        { key: 'registered_not_completed', label: 'In Training', count: groupCounts.registered_not_completed },
        { key: 'training_completed', label: 'Completed', count: groupCounts.training_completed },
        { key: 'needs_reminder', label: 'Needs Reminder', count: groupCounts.needs_reminder },
    ];

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <h1 className="text-xl sm:text-2xl font-bold">Driver Management</h1>
                <div className="flex gap-2">
                    <button
                        onClick={syncWithLMS}
                        disabled={syncing}
                        className="flex items-center gap-2 px-4 py-2 bg-white border border-[hsl(var(--border))] text-[hsl(var(--foreground))] rounded-xl text-sm font-medium hover:bg-[hsl(var(--secondary))] transition-colors disabled:opacity-50"
                        title="Sync driver records with LMS users to update registration status"
                    >
                        {syncing ? (
                            <RefreshCw className="w-4 h-4 animate-spin" />
                        ) : (
                            <Link2 className="w-4 h-4" />
                        )}
                        {syncing ? 'Syncing...' : 'Sync with LMS'}
                    </button>
                    <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileSelect}
                        accept=".xlsx,.xls"
                        className="hidden"
                    />
                    <button
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploading}
                        className="flex items-center gap-2 px-4 py-2 bg-[hsl(var(--primary))] text-white rounded-xl text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
                    >
                        {uploading ? (
                            <RefreshCw className="w-4 h-4 animate-spin" />
                        ) : (
                            <Upload className="w-4 h-4" />
                        )}
                        {uploading ? 'Uploading...' : 'Upload Excel'}
                    </button>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                {groups.map((g) => (
                    <button
                        key={g.key}
                        onClick={() => { setSelectedGroup(g.key); setPagination(prev => ({ ...prev, page: 1 })); }}
                        className={`bg-white rounded-xl p-3 shadow-sm text-center transition-all ${selectedGroup === g.key ? 'ring-2 ring-[hsl(var(--primary))]' : 'hover:shadow-md'
                            }`}
                    >
                        <p className="text-xl font-bold">{g.count || 0}</p>
                        <p className="text-xs text-[hsl(var(--muted-foreground))]">{g.label}</p>
                    </button>
                ))}
            </div>

            {/* Search & Filters */}
            <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[hsl(var(--muted-foreground))]" />
                    <input
                        type="text"
                        value={search}
                        onChange={(e) => { setSearch(e.target.value); setPagination(prev => ({ ...prev, page: 1 })); }}
                        placeholder="Search by name, email, or phone..."
                        className="w-full pl-10 pr-4 py-3 rounded-xl border border-[hsl(var(--border))] bg-white focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))] text-sm"
                    />
                </div>
                {cities.length > 0 && (
                    <div className="relative">
                        <MapPin className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[hsl(var(--muted-foreground))]" />
                        <select
                            value={selectedCity}
                            onChange={(e) => { setSelectedCity(e.target.value); setPagination(prev => ({ ...prev, page: 1 })); }}
                            className="pl-10 pr-8 py-3 rounded-xl border border-[hsl(var(--border))] bg-white focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))] text-sm appearance-none min-w-[150px]"
                        >
                            <option value="">All Cities</option>
                            {cities.map(city => (
                                <option key={city} value={city}>{city}</option>
                            ))}
                        </select>
                    </div>
                )}
                {selectedDrivers.length > 0 && (
                    <div className="flex gap-2">
                        <button
                            onClick={() => setShowCommunicateModal(true)}
                            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 transition-colors"
                        >
                            <Send className="w-4 h-4" />
                            Send to {selectedDrivers.length} selected
                        </button>
                    </div>
                )}
            </div>

            {/* Quick Actions for Group */}
            <div className="flex gap-2 flex-wrap">
                <button
                    onClick={() => {
                        setSelectedDrivers(drivers.map(d => d.id));
                        setShowCommunicateModal(true);
                    }}
                    disabled={drivers.length === 0}
                    className="flex items-center gap-2 px-3 py-2 bg-white border border-[hsl(var(--border))] rounded-xl text-sm font-medium hover:bg-[hsl(var(--secondary))] transition-colors disabled:opacity-50"
                >
                    <Mail className="w-4 h-4" />
                    Email All in Group
                </button>
                <button
                    onClick={() => {
                        setSelectedDrivers(drivers.map(d => d.id));
                        setShowCommunicateModal(true);
                    }}
                    disabled={drivers.length === 0}
                    className="flex items-center gap-2 px-3 py-2 bg-white border border-[hsl(var(--border))] rounded-xl text-sm font-medium hover:bg-[hsl(var(--secondary))] transition-colors disabled:opacity-50"
                >
                    <MessageSquare className="w-4 h-4" />
                    SMS All in Group
                </button>
            </div>

            {/* Driver List */}
            {loading ? (
                <div className="flex items-center justify-center py-20">
                    <div className="w-8 h-8 border-2 border-[hsl(var(--primary))] border-t-transparent rounded-full animate-spin" />
                </div>
            ) : drivers.length === 0 ? (
                <div className="bg-white rounded-xl p-8 text-center">
                    <Users className="w-12 h-12 mx-auto text-[hsl(var(--muted-foreground))] mb-3" />
                    <p className="text-lg font-medium">No drivers found</p>
                    <p className="text-sm text-[hsl(var(--muted-foreground))]">
                        Upload an Excel file to add drivers
                    </p>
                </div>
            ) : (
                <div className="space-y-2">
                    {/* Select All */}
                    <div className="flex items-center gap-3 px-4 py-2 bg-white rounded-xl">
                        <input
                            type="checkbox"
                            checked={selectedDrivers.length === drivers.length && drivers.length > 0}
                            onChange={toggleSelectAll}
                            className="w-4 h-4 rounded border-[hsl(var(--border))]"
                        />
                        <span className="text-sm text-[hsl(var(--muted-foreground))]">
                            Select All ({drivers.length} drivers)
                        </span>
                    </div>

                    {/* Driver Cards */}
                    {drivers.map((driver) => {
                        const status = getTrainingStatusBadge(driver.training_status);
                        const isExpanded = expandedDriver === driver.id;
                        const StatusIcon = status.icon;

                        return (
                            <div key={driver.id} className="bg-white rounded-xl shadow-sm overflow-hidden">
                                {/* Main Row */}
                                <div className="p-4 flex items-center gap-3">
                                    <input
                                        type="checkbox"
                                        checked={selectedDrivers.includes(driver.id)}
                                        onChange={() => toggleSelectDriver(driver.id)}
                                        className="w-4 h-4 rounded border-[hsl(var(--border))]"
                                        onClick={(e) => e.stopPropagation()}
                                    />
                                    <div
                                        className="flex-1 flex items-center justify-between gap-3 cursor-pointer"
                                        onClick={() => setExpandedDriver(isExpanded ? null : driver.id)}
                                    >
                                        <div className="flex items-center gap-3 min-w-0 flex-1">
                                            <div className="w-10 h-10 bg-[hsl(var(--primary))] rounded-full flex items-center justify-center text-white text-sm font-medium shrink-0">
                                                {driver.full_name?.charAt(0)?.toUpperCase() || '?'}
                                            </div>
                                            <div className="min-w-0">
                                                <p className="text-sm font-medium truncate">{driver.full_name}</p>
                                                <p className="text-xs text-[hsl(var(--muted-foreground))] truncate">{driver.email}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2 shrink-0">
                                            {driver.city && (
                                                <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 flex items-center gap-1">
                                                    <MapPin className="w-3 h-3" /> {driver.city}
                                                </span>
                                            )}
                                            {driver.spinr_approved && (
                                                <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-green-50 text-green-700">
                                                    Spinr Approved
                                                </span>
                                            )}
                                            <span className={`text-xs font-medium px-2 py-0.5 rounded-full flex items-center gap-1 ${status.color}`}>
                                                <StatusIcon className="w-3 h-3" /> {status.label}
                                            </span>
                                            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                                        </div>
                                    </div>
                                </div>

                                {/* Expanded Details */}
                                {isExpanded && (
                                    <div className="border-t border-[hsl(var(--border))] p-4 bg-[hsl(var(--secondary))]/30 space-y-4">
                                        {/* Contact Info */}
                                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                                            <div>
                                                <p className="text-[hsl(var(--muted-foreground))]">Phone</p>
                                                <p className="font-medium">{driver.phone || 'N/A'}</p>
                                            </div>
                                            <div>
                                                <p className="text-[hsl(var(--muted-foreground))]">License</p>
                                                <p className="font-medium">{driver.driving_license_number || 'N/A'}</p>
                                            </div>
                                            <div>
                                                <p className="text-[hsl(var(--muted-foreground))]">License Class</p>
                                                <p className="font-medium">{driver.license_class || 'N/A'}</p>
                                            </div>
                                            <div>
                                                <p className="text-[hsl(var(--muted-foreground))]">SGI Approved</p>
                                                <p className="font-medium">{driver.sgi_approved ? 'Yes' : 'No'}</p>
                                            </div>
                                        </div>

                                        {/* Vehicle Info */}
                                        {(driver.car_make || driver.vehicle_type) && (
                                            <div>
                                                <h4 className="text-xs font-semibold text-[hsl(var(--muted-foreground))] uppercase mb-2 flex items-center gap-1">
                                                    <Car className="w-3 h-3" /> Vehicle
                                                </h4>
                                                <div className="bg-white rounded-lg p-3">
                                                    <p className="text-sm font-medium">
                                                        {driver.car_year} {driver.car_make} {driver.car_model}
                                                    </p>
                                                    <p className="text-xs text-[hsl(var(--muted-foreground))]">
                                                        {driver.vehicle_type} - Plate: {driver.vehicle_plate || 'N/A'}
                                                    </p>
                                                </div>
                                            </div>
                                        )}

                                        {/* Communication History */}
                                        <div className="grid grid-cols-2 gap-4 text-xs">
                                            <div>
                                                <p className="text-[hsl(var(--muted-foreground))]">Reminders Sent</p>
                                                <p className="font-medium">{driver.reminder_count || 0}</p>
                                            </div>
                                            <div>
                                                <p className="text-[hsl(var(--muted-foreground))]">Last Reminder</p>
                                                <p className="font-medium">
                                                    {driver.last_reminder_sent_at
                                                        ? new Date(driver.last_reminder_sent_at).toLocaleDateString()
                                                        : 'Never'}
                                                </p>
                                            </div>
                                        </div>

                                        {/* Actions */}
                                        <div className="flex flex-wrap gap-2 pt-2 border-t border-[hsl(var(--border))]">
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleEditDriver(driver);
                                                }}
                                                className="flex items-center gap-1.5 text-xs font-medium px-3 py-2 rounded-lg bg-[hsl(var(--primary))] text-white hover:opacity-90 transition-opacity"
                                            >
                                                <Edit className="w-3.5 h-3.5" />
                                                Edit
                                            </button>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setSelectedDrivers([driver.id]);
                                                    setShowCommunicateModal(true);
                                                }}
                                                className="flex items-center gap-1.5 text-xs font-medium px-3 py-2 rounded-lg bg-white border border-[hsl(var(--border))] hover:bg-[hsl(var(--secondary))] transition-colors"
                                            >
                                                <Mail className="w-3.5 h-3.5" />
                                                Send Email
                                            </button>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setSelectedDrivers([driver.id]);
                                                    setShowCommunicateModal(true);
                                                }}
                                                className="flex items-center gap-1.5 text-xs font-medium px-3 py-2 rounded-lg bg-white border border-[hsl(var(--border))] hover:bg-[hsl(var(--secondary))] transition-colors"
                                            >
                                                <MessageSquare className="w-3.5 h-3.5" />
                                                Send SMS
                                            </button>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleDeleteDriver(driver);
                                                }}
                                                className="flex items-center gap-1.5 text-xs font-medium px-3 py-2 rounded-lg bg-red-50 text-red-600 border border-red-200 hover:bg-red-100 transition-colors"
                                            >
                                                <Trash2 className="w-3.5 h-3.5" />
                                                Delete
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Pagination */}
            {pagination.totalPages > 1 && (
                <div className="flex justify-center gap-2">
                    <button
                        onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                        disabled={pagination.page === 1}
                        className="px-4 py-2 text-sm font-medium bg-white rounded-lg border border-[hsl(var(--border))] disabled:opacity-50"
                    >
                        Previous
                    </button>
                    <span className="px-4 py-2 text-sm">
                        Page {pagination.page} of {pagination.totalPages}
                    </span>
                    <button
                        onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                        disabled={pagination.page === pagination.totalPages}
                        className="px-4 py-2 text-sm font-medium bg-white rounded-lg border border-[hsl(var(--border))] disabled:opacity-50"
                    >
                        Next
                    </button>
                </div>
            )}

            {/* Communication Modal */}
            {showCommunicateModal && (
                <CommunicateModal
                    driverIds={selectedDrivers}
                    groupName={selectedGroup}
                    onClose={() => setShowCommunicateModal(false)}
                    onSuccess={() => {
                        setShowCommunicateModal(false);
                        setSelectedDrivers([]);
                        loadDrivers();
                        toast.success('Communications sent successfully');
                    }}
                />
            )}

            {/* Upload Modal with Sheet Selection */}
            {showUploadModal && (
                <UploadModal
                    fileInputRef={fileInputRef}
                    onClose={() => {
                        setShowUploadModal(false);
                        if (fileInputRef.current) fileInputRef.current.value = '';
                    }}
                    onSuccess={() => {
                        setShowUploadModal(false);
                        if (fileInputRef.current) fileInputRef.current.value = '';
                        loadDrivers();
                    }}
                />
            )}

            {/* Edit Driver Modal */}
            {showEditModal && editingDriver && (
                <EditDriverModal
                    driver={editingDriver}
                    onClose={() => {
                        setShowEditModal(false);
                        setEditingDriver(null);
                    }}
                    onSuccess={() => {
                        setShowEditModal(false);
                        setEditingDriver(null);
                        loadDrivers();
                        toast.success('Driver updated successfully');
                    }}
                />
            )}
        </div>
    );
}

function CommunicateModal({ driverIds, groupName, onClose, onSuccess }) {
    const [communicationType, setCommunicationType] = useState('email');
    const [messageType, setMessageType] = useState('invite');
    const [emailSubject, setEmailSubject] = useState('');
    const [emailBody, setEmailBody] = useState('');
    const [smsMessage, setSmsMessage] = useState('');
    const [updateStatus, setUpdateStatus] = useState(true);
    const [sending, setSending] = useState(false);

    const defaultMessages = {
        invite: {
            email: {
                subject: 'Complete Your Spinr Driver Training',
                body: `<p>Hi {{name}},</p>
<p>You're invited to complete your Spinr Driver Training! This training is required for all Spinr-approved drivers.</p>
<p><a href="{{signupLink}}" style="background-color: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; display: inline-block;">Start Training</a></p>
<p>Best regards,<br>The Spinr Team</p>`,
            },
            sms: 'Hi {{name}}! Complete your Spinr Driver Training to stay active. Sign up: {{signupLink}} - Spinr Team',
        },
        reminder: {
            email: {
                subject: 'Reminder: Complete Your Spinr Training',
                body: `<p>Hi {{name}},</p>
<p>This is a friendly reminder to complete your Spinr Driver Training.</p>
<p><a href="{{dashboardLink}}" style="background-color: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; display: inline-block;">Continue Training</a></p>
<p>Best regards,<br>The Spinr Team</p>`,
            },
            sms: 'Hi {{name}}! Reminder: Complete your Spinr training soon. Log in: {{dashboardLink}} - Spinr Team',
        },
    };

    useEffect(() => {
        if (messageType !== 'custom') {
            setEmailSubject(defaultMessages[messageType]?.email?.subject || '');
            setEmailBody(defaultMessages[messageType]?.email?.body || '');
            setSmsMessage(defaultMessages[messageType]?.sms || '');
        }
    }, [messageType]);

    async function handleSend() {
        setSending(true);
        try {
            const response = await fetch('/api/drivers/communicate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    driver_ids: driverIds,
                    communication_type: communicationType,
                    message_type: messageType,
                    email_subject: emailSubject,
                    email_body: emailBody,
                    sms_message: smsMessage,
                    update_status: updateStatus,
                }),
            });

            const result = await response.json();

            if (result.success) {
                const { email, sms } = result.data.results;
                let message = '';
                if (communicationType === 'email' || communicationType === 'both') {
                    message += `Emails: ${email.sent} sent, ${email.failed} failed. `;
                }
                if (communicationType === 'sms' || communicationType === 'both') {
                    message += `SMS: ${sms.sent} sent, ${sms.failed} failed.`;
                }
                toast.success(message);
                onSuccess();
            } else {
                toast.error(result.error || 'Failed to send communications');
            }
        } catch (error) {
            toast.error('Failed to send: ' + error.message);
        }
        setSending(false);
    }

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                <div className="p-6 border-b border-[hsl(var(--border))]">
                    <h2 className="text-lg font-bold">Send Communication</h2>
                    <p className="text-sm text-[hsl(var(--muted-foreground))]">
                        Sending to {driverIds.length} driver(s)
                    </p>
                </div>

                <div className="p-6 space-y-6">
                    {/* Communication Type */}
                    <div>
                        <label className="block text-sm font-medium mb-2">Communication Type</label>
                        <div className="flex gap-2">
                            {[
                                { value: 'email', label: 'Email Only', icon: Mail },
                                { value: 'sms', label: 'SMS Only', icon: MessageSquare },
                                { value: 'both', label: 'Both', icon: Send },
                            ].map((option) => {
                                const Icon = option.icon;
                                return (
                                    <button
                                        key={option.value}
                                        onClick={() => setCommunicationType(option.value)}
                                        className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-medium transition-all ${communicationType === option.value
                                            ? 'bg-[hsl(var(--primary))] text-white'
                                            : 'bg-[hsl(var(--secondary))] hover:bg-[hsl(var(--secondary))]/80'
                                            }`}
                                    >
                                        <Icon className="w-4 h-4" />
                                        {option.label}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Message Type */}
                    <div>
                        <label className="block text-sm font-medium mb-2">Message Type</label>
                        <div className="flex gap-2">
                            {[
                                { value: 'invite', label: 'Invitation' },
                                { value: 'reminder', label: 'Reminder' },
                                { value: 'custom', label: 'Custom' },
                            ].map((option) => (
                                <button
                                    key={option.value}
                                    onClick={() => setMessageType(option.value)}
                                    className={`flex-1 px-4 py-3 rounded-xl text-sm font-medium transition-all ${messageType === option.value
                                        ? 'bg-[hsl(var(--primary))] text-white'
                                        : 'bg-[hsl(var(--secondary))] hover:bg-[hsl(var(--secondary))]/80'
                                        }`}
                                >
                                    {option.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Email Content */}
                    {(communicationType === 'email' || communicationType === 'both') && (
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-2">Email Subject</label>
                                <input
                                    type="text"
                                    value={emailSubject}
                                    onChange={(e) => setEmailSubject(e.target.value)}
                                    className="w-full px-4 py-3 rounded-xl border border-[hsl(var(--border))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))] text-sm"
                                    placeholder="Email subject..."
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-2">
                                    Email Body (HTML supported)
                                </label>
                                <textarea
                                    value={emailBody}
                                    onChange={(e) => setEmailBody(e.target.value)}
                                    rows={6}
                                    className="w-full px-4 py-3 rounded-xl border border-[hsl(var(--border))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))] text-sm font-mono"
                                    placeholder="Email body..."
                                />
                                <p className="text-xs text-[hsl(var(--muted-foreground))] mt-1">
                                    Variables: {'{{name}}'}, {'{{email}}'}, {'{{signupLink}}'}, {'{{dashboardLink}}'}
                                </p>
                            </div>
                        </div>
                    )}

                    {/* SMS Content */}
                    {(communicationType === 'sms' || communicationType === 'both') && (
                        <div>
                            <label className="block text-sm font-medium mb-2">
                                SMS Message ({smsMessage.length}/160 chars)
                            </label>
                            <textarea
                                value={smsMessage}
                                onChange={(e) => setSmsMessage(e.target.value)}
                                rows={3}
                                maxLength={160}
                                className="w-full px-4 py-3 rounded-xl border border-[hsl(var(--border))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))] text-sm"
                                placeholder="SMS message..."
                            />
                            <p className="text-xs text-[hsl(var(--muted-foreground))] mt-1">
                                Variables: {'{{name}}'}, {'{{signupLink}}'}, {'{{dashboardLink}}'}
                            </p>
                        </div>
                    )}

                    {/* Update Status Option */}
                    {messageType === 'invite' && (
                        <div className="flex items-center gap-3">
                            <input
                                type="checkbox"
                                id="updateStatus"
                                checked={updateStatus}
                                onChange={(e) => setUpdateStatus(e.target.checked)}
                                className="w-4 h-4 rounded"
                            />
                            <label htmlFor="updateStatus" className="text-sm">
                                Update driver status to "Invited" after sending
                            </label>
                        </div>
                    )}
                </div>

                <div className="p-6 border-t border-[hsl(var(--border))] flex justify-end gap-3">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-sm font-medium rounded-xl border border-[hsl(var(--border))] hover:bg-[hsl(var(--secondary))] transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSend}
                        disabled={sending}
                        className="flex items-center gap-2 px-4 py-2 bg-[hsl(var(--primary))] text-white rounded-xl text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
                    >
                        {sending ? (
                            <RefreshCw className="w-4 h-4 animate-spin" />
                        ) : (
                            <Send className="w-4 h-4" />
                        )}
                        {sending ? 'Sending...' : 'Send'}
                    </button>
                </div>
            </div>
        </div>
    );
}

function UploadModal({ fileInputRef, onClose, onSuccess }) {
    const [loading, setLoading] = useState(true);
    const [sheets, setSheets] = useState([]);
    const [selectedSheets, setSelectedSheets] = useState([]);
    const [uploading, setUploading] = useState(false);
    const [uploadResults, setUploadResults] = useState(null);

    useEffect(() => {
        previewFile();
    }, []);

    async function previewFile() {
        const file = fileInputRef.current?.files?.[0];
        if (!file) {
            onClose();
            return;
        }

        setLoading(true);
        try {
            const formData = new FormData();
            formData.append('file', file);

            const response = await fetch('/api/drivers/upload?preview=true', {
                method: 'POST',
                body: formData,
            });

            const result = await response.json();

            if (result.success) {
                setSheets(result.data.sheets);
                // Pre-select all sheets
                setSelectedSheets(result.data.sheets.map(s => s.name));
            } else {
                toast.error(result.error || 'Failed to preview file');
                onClose();
            }
        } catch (error) {
            toast.error('Failed to preview file: ' + error.message);
            onClose();
        }
        setLoading(false);
    }

    function toggleSheet(sheetName) {
        setSelectedSheets(prev =>
            prev.includes(sheetName)
                ? prev.filter(s => s !== sheetName)
                : [...prev, sheetName]
        );
    }

    async function handleUpload() {
        if (selectedSheets.length === 0) {
            toast.error('Please select at least one sheet to upload');
            return;
        }

        const file = fileInputRef.current?.files?.[0];
        if (!file) {
            onClose();
            return;
        }

        setUploading(true);
        const results = [];

        for (const sheetName of selectedSheets) {
            try {
                const formData = new FormData();
                formData.append('file', file);

                const response = await fetch(`/api/drivers/upload?sheet=${encodeURIComponent(sheetName)}`, {
                    method: 'POST',
                    body: formData,
                });

                const result = await response.json();
                results.push({
                    sheetName,
                    success: result.success,
                    ...(result.success ? result.data : { error: result.error }),
                });
            } catch (error) {
                results.push({
                    sheetName,
                    success: false,
                    error: error.message,
                });
            }
        }

        setUploadResults(results);
        setUploading(false);

        const successCount = results.filter(r => r.success).length;
        if (successCount === selectedSheets.length) {
            toast.success('All sheets uploaded successfully');
            setTimeout(onSuccess, 1500);
        } else {
            toast.warning(`${successCount}/${selectedSheets.length} sheets uploaded successfully`);
        }
    }

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                <div className="p-6 border-b border-[hsl(var(--border))] flex items-center justify-between">
                    <div>
                        <h2 className="text-lg font-bold">Upload Driver Data</h2>
                        <p className="text-sm text-[hsl(var(--muted-foreground))]">
                            {fileInputRef.current?.files?.[0]?.name}
                        </p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-[hsl(var(--secondary))] rounded-lg">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-6">
                    {loading ? (
                        <div className="flex items-center justify-center py-12">
                            <RefreshCw className="w-8 h-8 animate-spin text-[hsl(var(--primary))]" />
                        </div>
                    ) : uploadResults ? (
                        <div className="space-y-4">
                            <h3 className="font-medium">Upload Results</h3>
                            {uploadResults.map((result, idx) => (
                                <div
                                    key={idx}
                                    className={`p-4 rounded-xl ${result.success ? 'bg-green-50' : 'bg-red-50'}`}
                                >
                                    <div className="flex items-center justify-between">
                                        <span className="font-medium">{result.sheetName}</span>
                                        {result.success ? (
                                            <CheckCircle className="w-5 h-5 text-green-600" />
                                        ) : (
                                            <XCircle className="w-5 h-5 text-red-600" />
                                        )}
                                    </div>
                                    {result.success ? (
                                        <p className="text-sm text-green-700 mt-1">
                                            {result.newRecords} new, {result.updatedRecords} updated
                                        </p>
                                    ) : (
                                        <p className="text-sm text-red-700 mt-1">{result.error}</p>
                                    )}
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <h3 className="font-medium">Select Sheets to Upload (Cities)</h3>
                                <button
                                    onClick={() => {
                                        if (selectedSheets.length === sheets.length) {
                                            setSelectedSheets([]);
                                        } else {
                                            setSelectedSheets(sheets.map(s => s.name));
                                        }
                                    }}
                                    className="text-sm text-[hsl(var(--primary))] hover:underline"
                                >
                                    {selectedSheets.length === sheets.length ? 'Deselect All' : 'Select All'}
                                </button>
                            </div>

                            <div className="space-y-2">
                                {sheets.map((sheet) => (
                                    <div
                                        key={sheet.name}
                                        onClick={() => toggleSheet(sheet.name)}
                                        className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${selectedSheets.includes(sheet.name)
                                            ? 'border-[hsl(var(--primary))] bg-[hsl(var(--primary))]/5'
                                            : 'border-[hsl(var(--border))] hover:border-[hsl(var(--primary))]/50'
                                            }`}
                                    >
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <input
                                                    type="checkbox"
                                                    checked={selectedSheets.includes(sheet.name)}
                                                    onChange={() => { }}
                                                    className="w-4 h-4 rounded"
                                                />
                                                <div>
                                                    <p className="font-medium flex items-center gap-2">
                                                        <MapPin className="w-4 h-4 text-[hsl(var(--primary))]" />
                                                        {sheet.name}
                                                    </p>
                                                    <p className="text-sm text-[hsl(var(--muted-foreground))]">
                                                        {sheet.recordCount} drivers
                                                        {sheet.errorCount > 0 && (
                                                            <span className="text-amber-600 ml-2">
                                                                ({sheet.errorCount} errors)
                                                            </span>
                                                        )}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                        {sheet.sampleRecords?.length > 0 && (
                                            <div className="mt-3 pt-3 border-t border-[hsl(var(--border))]">
                                                <p className="text-xs text-[hsl(var(--muted-foreground))] mb-1">Sample records:</p>
                                                <div className="space-y-1">
                                                    {sheet.sampleRecords.map((record, idx) => (
                                                        <p key={idx} className="text-xs">
                                                            {record.name} - {record.email}
                                                            {record.spinr_approved && (
                                                                <span className="ml-2 text-green-600">Spinr Approved</span>
                                                            )}
                                                        </p>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {!uploadResults && !loading && (
                    <div className="p-6 border-t border-[hsl(var(--border))] flex justify-end gap-3">
                        <button
                            onClick={onClose}
                            className="px-4 py-2 text-sm font-medium rounded-xl border border-[hsl(var(--border))] hover:bg-[hsl(var(--secondary))] transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleUpload}
                            disabled={uploading || selectedSheets.length === 0}
                            className="flex items-center gap-2 px-4 py-2 bg-[hsl(var(--primary))] text-white rounded-xl text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
                        >
                            {uploading ? (
                                <RefreshCw className="w-4 h-4 animate-spin" />
                            ) : (
                                <Upload className="w-4 h-4" />
                            )}
                            {uploading ? 'Uploading...' : `Upload ${selectedSheets.length} Sheet(s)`}
                        </button>
                    </div>
                )}

                {uploadResults && (
                    <div className="p-6 border-t border-[hsl(var(--border))] flex justify-end">
                        <button
                            onClick={onSuccess}
                            className="px-4 py-2 bg-[hsl(var(--primary))] text-white rounded-xl text-sm font-medium hover:opacity-90 transition-opacity"
                        >
                            Done
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}

function EditDriverModal({ driver, onClose, onSuccess }) {
    const [formData, setFormData] = useState({
        full_name: driver.full_name || '',
        email: driver.email || '',
        phone: driver.phone || '',
        driving_license_number: driver.driving_license_number || '',
        license_class: driver.license_class || '',
        address: driver.address || '',
        sgi_approved: driver.sgi_approved || false,
        spinr_approved: driver.spinr_approved || false,
        vehicle_plate: driver.vehicle_plate || '',
        vin: driver.vin || '',
        vehicle_type: driver.vehicle_type || '',
        car_year: driver.car_year || '',
        car_make: driver.car_make || '',
        car_model: driver.car_model || '',
        city: driver.city || '',
        training_status: driver.training_status || 'not_invited',
    });
    const [saving, setSaving] = useState(false);

    function handleChange(field, value) {
        setFormData(prev => ({ ...prev, [field]: value }));
    }

    async function handleSave() {
        setSaving(true);
        try {
            const response = await fetch(`/api/drivers/${driver.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });

            const result = await response.json();

            if (result.success) {
                onSuccess();
            } else {
                toast.error(result.error || 'Failed to update driver');
            }
        } catch (error) {
            toast.error('Failed to update driver: ' + error.message);
        }
        setSaving(false);
    }

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                <div className="p-6 border-b border-[hsl(var(--border))] flex items-center justify-between">
                    <div>
                        <h2 className="text-lg font-bold">Edit Driver</h2>
                        <p className="text-sm text-[hsl(var(--muted-foreground))]">{driver.email}</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-[hsl(var(--secondary))] rounded-lg">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-6 space-y-6">
                    {/* Personal Information */}
                    <div>
                        <h3 className="font-medium mb-4">Personal Information</h3>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium mb-1">Full Name</label>
                                <input
                                    type="text"
                                    value={formData.full_name}
                                    onChange={(e) => handleChange('full_name', e.target.value)}
                                    className="w-full px-3 py-2 rounded-lg border border-[hsl(var(--border))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))] text-sm"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Email</label>
                                <input
                                    type="email"
                                    value={formData.email}
                                    onChange={(e) => handleChange('email', e.target.value)}
                                    className="w-full px-3 py-2 rounded-lg border border-[hsl(var(--border))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))] text-sm"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Phone</label>
                                <input
                                    type="text"
                                    value={formData.phone}
                                    onChange={(e) => handleChange('phone', e.target.value)}
                                    className="w-full px-3 py-2 rounded-lg border border-[hsl(var(--border))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))] text-sm"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">City</label>
                                <input
                                    type="text"
                                    value={formData.city}
                                    onChange={(e) => handleChange('city', e.target.value)}
                                    className="w-full px-3 py-2 rounded-lg border border-[hsl(var(--border))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))] text-sm"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">License Number</label>
                                <input
                                    type="text"
                                    value={formData.driving_license_number}
                                    onChange={(e) => handleChange('driving_license_number', e.target.value)}
                                    className="w-full px-3 py-2 rounded-lg border border-[hsl(var(--border))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))] text-sm"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">License Class</label>
                                <input
                                    type="text"
                                    value={formData.license_class}
                                    onChange={(e) => handleChange('license_class', e.target.value)}
                                    className="w-full px-3 py-2 rounded-lg border border-[hsl(var(--border))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))] text-sm"
                                />
                            </div>
                        </div>
                        <div className="mt-4">
                            <label className="block text-sm font-medium mb-1">Address</label>
                            <input
                                type="text"
                                value={formData.address}
                                onChange={(e) => handleChange('address', e.target.value)}
                                className="w-full px-3 py-2 rounded-lg border border-[hsl(var(--border))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))] text-sm"
                            />
                        </div>
                    </div>

                    {/* Vehicle Information */}
                    <div>
                        <h3 className="font-medium mb-4">Vehicle Information</h3>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium mb-1">Vehicle Type</label>
                                <input
                                    type="text"
                                    value={formData.vehicle_type}
                                    onChange={(e) => handleChange('vehicle_type', e.target.value)}
                                    className="w-full px-3 py-2 rounded-lg border border-[hsl(var(--border))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))] text-sm"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Plate Number</label>
                                <input
                                    type="text"
                                    value={formData.vehicle_plate}
                                    onChange={(e) => handleChange('vehicle_plate', e.target.value)}
                                    className="w-full px-3 py-2 rounded-lg border border-[hsl(var(--border))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))] text-sm"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Year</label>
                                <input
                                    type="text"
                                    value={formData.car_year}
                                    onChange={(e) => handleChange('car_year', e.target.value)}
                                    className="w-full px-3 py-2 rounded-lg border border-[hsl(var(--border))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))] text-sm"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Make</label>
                                <input
                                    type="text"
                                    value={formData.car_make}
                                    onChange={(e) => handleChange('car_make', e.target.value)}
                                    className="w-full px-3 py-2 rounded-lg border border-[hsl(var(--border))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))] text-sm"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Model</label>
                                <input
                                    type="text"
                                    value={formData.car_model}
                                    onChange={(e) => handleChange('car_model', e.target.value)}
                                    className="w-full px-3 py-2 rounded-lg border border-[hsl(var(--border))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))] text-sm"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">VIN</label>
                                <input
                                    type="text"
                                    value={formData.vin}
                                    onChange={(e) => handleChange('vin', e.target.value)}
                                    className="w-full px-3 py-2 rounded-lg border border-[hsl(var(--border))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))] text-sm"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Status */}
                    <div>
                        <h3 className="font-medium mb-4">Status</h3>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="flex items-center gap-3">
                                <input
                                    type="checkbox"
                                    id="sgi_approved"
                                    checked={formData.sgi_approved}
                                    onChange={(e) => handleChange('sgi_approved', e.target.checked)}
                                    className="w-4 h-4 rounded"
                                />
                                <label htmlFor="sgi_approved" className="text-sm">SGI Approved</label>
                            </div>
                            <div className="flex items-center gap-3">
                                <input
                                    type="checkbox"
                                    id="spinr_approved"
                                    checked={formData.spinr_approved}
                                    onChange={(e) => handleChange('spinr_approved', e.target.checked)}
                                    className="w-4 h-4 rounded"
                                />
                                <label htmlFor="spinr_approved" className="text-sm">Spinr Approved</label>
                            </div>
                        </div>
                        <div className="mt-4">
                            <label className="block text-sm font-medium mb-1">Training Status</label>
                            <select
                                value={formData.training_status}
                                onChange={(e) => handleChange('training_status', e.target.value)}
                                className="w-full px-3 py-2 rounded-lg border border-[hsl(var(--border))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))] text-sm"
                            >
                                <option value="not_invited">Not Invited</option>
                                <option value="invited">Invited</option>
                                <option value="registered">Registered</option>
                                <option value="in_progress">In Progress</option>
                                <option value="completed">Completed</option>
                            </select>
                        </div>
                    </div>
                </div>

                <div className="p-6 border-t border-[hsl(var(--border))] flex justify-end gap-3">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-sm font-medium rounded-xl border border-[hsl(var(--border))] hover:bg-[hsl(var(--secondary))] transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="flex items-center gap-2 px-4 py-2 bg-[hsl(var(--primary))] text-white rounded-xl text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
                    >
                        {saving ? (
                            <RefreshCw className="w-4 h-4 animate-spin" />
                        ) : (
                            <CheckCircle className="w-4 h-4" />
                        )}
                        {saving ? 'Saving...' : 'Save Changes'}
                    </button>
                </div>
            </div>
        </div>
    );
}
