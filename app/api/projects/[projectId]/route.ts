import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function PUT(request: NextRequest, { params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await params
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json({ error: 'No authorization header' }, { status: 401 })
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)

    if (authError || !user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    const body = await request.json()
    const { file_structure, name, is_public } = body

    // 1. Determine Artifact (if any)
    let artifact_json = null;
    if (file_structure.artifacts?.directory) {
      const artifacts = file_structure.artifacts.directory;
      const firstJson = Object.keys(artifacts).find(k => k.endsWith('.json'));
      if (firstJson) {
        try {
          artifact_json = JSON.parse(artifacts[firstJson].file.contents);
        } catch (e) { }
      }
    }

    // 2. Extract Main Source Code (if any)
    let main_code = null;
    if (file_structure.contracts?.directory) {
      const contracts = file_structure.contracts.directory;
      const firstCash = Object.keys(contracts).find(k => k.endsWith('.cash'));
      if (firstCash) {
        main_code = contracts[firstCash].file.contents;
      }
    }

    // Fallback: if we couldn't find main_code specifically, use the whole JSON in source_code
    // But it's better to store the primary .cash file in source_code for the public view

    const updateData: any = {
      updated_at: new Date().toISOString()
    };

    if (main_code) updateData.source_code = main_code;
    else updateData.source_code = JSON.stringify(file_structure); // fallback

    if (artifact_json) updateData.artifact_json = artifact_json;
    if (name) updateData.name = name;
    if (typeof is_public !== 'undefined') updateData.is_public = is_public;

    const { data: contract, error } = await supabase
      .from('contracts')
      .update(updateData)
      .eq('id', projectId)
      .eq('owner_id', user.id)
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ contract })
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}