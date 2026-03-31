import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/api-auth';
import { createServiceClient } from '@/lib/supabase-server';
import { parseDriverExcel, getExcelSheetNames, parseAllSheets } from '@/lib/excel-parser';

/**
 * POST /api/drivers/upload
 * Upload Excel file with driver records
 * 
 * Query params:
 * - preview=true: Only return sheet names and preview data without saving
 * - sheet: Specific sheet name to upload (optional, uploads selected sheet)
 */
export async function POST(request) {
  const { response, lmsUser } = await requireAdmin();
  if (response) return response;

  try {
    const { searchParams } = new URL(request.url);
    const preview = searchParams.get('preview') === 'true';
    const selectedSheet = searchParams.get('sheet');
    
    const formData = await request.formData();
    const file = formData.get('file');

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Check file type
    const fileName = file.name;
    if (!fileName.endsWith('.xlsx') && !fileName.endsWith('.xls')) {
      return NextResponse.json({ error: 'Invalid file type. Please upload an Excel file (.xlsx or .xls)' }, { status: 400 });
    }

    // Read file buffer
    const buffer = Buffer.from(await file.arrayBuffer());

    // Preview mode - return sheet names and record counts
    if (preview) {
      const { sheets, availableSheets } = parseAllSheets(buffer);
      
      const sheetSummary = availableSheets.map(name => ({
        name,
        recordCount: sheets[name].recordCount,
        errorCount: sheets[name].errors.length,
        sampleRecords: sheets[name].drivers.slice(0, 3).map(d => ({
          name: d.full_name,
          email: d.email,
          spinr_approved: d.spinr_approved,
        })),
      }));
      
      return NextResponse.json({
        success: true,
        data: {
          fileName,
          sheets: sheetSummary,
          availableSheets,
        },
      });
    }

    // Parse Excel file (specific sheet or first sheet)
    const { drivers, errors: parseErrors, sheetName } = parseDriverExcel(buffer, selectedSheet);

    if (drivers.length === 0) {
      return NextResponse.json({ 
        error: 'No valid driver records found in the selected sheet',
        parseErrors 
      }, { status: 400 });
    }

    const supabase = await createServiceClient();

    let newRecords = 0;
    let updatedRecords = 0;
    let failedRecords = 0;
    const errors = [...parseErrors];

    // Process each driver
    for (const driver of drivers) {
      try {
        // Check if driver exists by email
        const { data: existing } = await supabase
          .from('driver_records')
          .select('id, training_status')
          .eq('email', driver.email)
          .single();

        if (existing) {
          // Update existing record (preserve training_status if already registered/completed)
          const updateData = {
            ...driver,
            source_file: fileName,
            source_sheet: sheetName,
            uploaded_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          };

          // Don't override training status for registered/completed drivers
          if (['registered', 'in_progress', 'completed'].includes(existing.training_status)) {
            delete updateData.training_status;
          }

          const { error: updateError } = await supabase
            .from('driver_records')
            .update(updateData)
            .eq('id', existing.id);

          if (updateError) {
            errors.push({ email: driver.email, error: updateError.message });
            failedRecords++;
          } else {
            updatedRecords++;
          }
        } else {
          // Insert new record
          const { error: insertError } = await supabase
            .from('driver_records')
            .insert({
              ...driver,
              source_file: fileName,
              source_sheet: sheetName,
              training_status: 'not_invited',
            });

          if (insertError) {
            errors.push({ email: driver.email, error: insertError.message });
            failedRecords++;
          } else {
            newRecords++;
          }
        }
      } catch (err) {
        errors.push({ email: driver.email, error: err.message });
        failedRecords++;
      }
    }

    // Log upload history
    await supabase.from('driver_upload_history').insert({
      file_name: fileName,
      sheet_name: sheetName,
      total_records: drivers.length,
      new_records: newRecords,
      updated_records: updatedRecords,
      failed_records: failedRecords,
      errors: errors.length > 0 ? errors : null,
      uploaded_by: lmsUser.id,
    });

    // Log audit entry
    await supabase.from('audit_log').insert({
      user_id: lmsUser.id,
      action: 'driver_excel_upload',
      entity_type: 'driver_records',
      details: {
        file_name: fileName,
        sheet_name: sheetName,
        total_records: drivers.length,
        new_records: newRecords,
        updated_records: updatedRecords,
        failed_records: failedRecords,
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        fileName,
        sheetName,
        totalRecords: drivers.length,
        newRecords,
        updatedRecords,
        failedRecords,
        errors: errors.length > 0 ? errors : undefined,
      },
    });
  } catch (error) {
    console.error('Driver upload error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
