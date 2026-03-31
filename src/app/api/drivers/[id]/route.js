import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/api-auth';
import { createServiceClient } from '@/lib/supabase-server';

/**
 * GET /api/drivers/[id]
 * Get a single driver record
 */
export async function GET(request, { params }) {
  const { response } = await requireAdmin();
  if (response) return response;

  try {
    const { id } = await params;
    const supabase = await createServiceClient();

    const { data: driver, error } = await supabase
      .from('driver_records')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !driver) {
      return NextResponse.json({ error: 'Driver not found' }, { status: 404 });
    }

    // Get communication history
    const { data: communications } = await supabase
      .from('driver_communication_log')
      .select('*')
      .eq('driver_id', id)
      .order('sent_at', { ascending: false })
      .limit(20);

    return NextResponse.json({
      success: true,
      data: {
        driver,
        communications: communications || [],
      },
    });
  } catch (error) {
    console.error('Get driver error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

/**
 * PUT /api/drivers/[id]
 * Update a driver record
 */
export async function PUT(request, { params }) {
  const { response, lmsUser } = await requireAdmin();
  if (response) return response;

  try {
    const { id } = await params;
    const body = await request.json();
    const supabase = await createServiceClient();

    // Fields that can be updated
    const allowedFields = [
      'full_name', 'date_of_birth', 'phone', 'email', 'driving_license_number',
      'license_class', 'address', 'sgi_approved', 'spinr_approved', 'vehicle_plate',
      'vin', 'vehicle_type', 'car_year', 'car_make', 'car_model',
      'criminal_record_check_expiry', 'car_insurance_expiry', 'vehicle_inspection_expiry',
      'drivers_abstract_status', 'work_authorization_expiry', 'is_pr', 'is_citizen',
      'profile_complete', 'decals_sent', 'training_status', 'city'
    ];

    // Filter to only allowed fields
    const updateData = {};
    allowedFields.forEach(field => {
      if (body[field] !== undefined) {
        updateData[field] = body[field];
      }
    });

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 });
    }

    // Add updated timestamp
    updateData.updated_at = new Date().toISOString();

    // Get original record for audit log
    const { data: original } = await supabase
      .from('driver_records')
      .select('*')
      .eq('id', id)
      .single();

    if (!original) {
      return NextResponse.json({ error: 'Driver not found' }, { status: 404 });
    }

    // Update record
    const { data: updated, error } = await supabase
      .from('driver_records')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw error;
    }

    // Log audit entry
    await supabase.from('audit_log').insert({
      user_id: lmsUser.id,
      action: 'driver_record_update',
      entity_type: 'driver_records',
      entity_id: id,
      details: {
        original: original,
        changes: updateData,
      },
    });

    return NextResponse.json({
      success: true,
      data: updated,
    });
  } catch (error) {
    console.error('Update driver error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

/**
 * DELETE /api/drivers/[id]
 * Delete a driver record
 */
export async function DELETE(request, { params }) {
  const { response, lmsUser } = await requireAdmin();
  if (response) return response;

  try {
    const { id } = await params;
    const supabase = await createServiceClient();

    // Get record for audit log
    const { data: driver } = await supabase
      .from('driver_records')
      .select('*')
      .eq('id', id)
      .single();

    if (!driver) {
      return NextResponse.json({ error: 'Driver not found' }, { status: 404 });
    }

    // Delete record
    const { error } = await supabase
      .from('driver_records')
      .delete()
      .eq('id', id);

    if (error) {
      throw error;
    }

    // Log audit entry
    await supabase.from('audit_log').insert({
      user_id: lmsUser.id,
      action: 'driver_record_delete',
      entity_type: 'driver_records',
      entity_id: id,
      details: {
        deleted_record: driver,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Driver record deleted',
    });
  } catch (error) {
    console.error('Delete driver error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
