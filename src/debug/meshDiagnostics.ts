/**
 * Mesh Loading Diagnostics Helper
 * Exposes debugging functions to window for console-based mesh loading tests
 */

export const MESH_FILES = [
  'mid_stomach.stl', 'top_stomach.stl', 'disk.stl', 'torso.stl',
  'chest.stl', 'kinectone.stl', 'head_base.stl', 'head.stl',
  'jaw.stl', 'skull.stl', 'earleftv1.stl', 'earrightv1.stl',
  'face.stl', 'eyesupport.stl', 'r_eyesupport.stl', 'l_eyesupport.stl',
  'camera.stl', 'eye.stl', 'iris.stl',
  'r_shoulder_base.stl', 'r_shoulder.stl', 'l_shoulder_base.stl', 'l_shoulder.stl',
  'bicep.stl', 'bicepcover.stl', 'r_forearm.stl', 'l_forearm.stl',
  'r_hand.stl', 'l_hand.stl',
  'r_thumb5_1.stl', 'thumb5_2.stl', 'thumb5_3.stl',
  'l_thumb5_1.stl',
  'index3_1.stl', 'index3_2.stl', 'index3_3.stl',
  'middle3_1.stl', 'middle3_2.stl', 'middle3_3.stl',
  'r_ring3_1.stl', 'ring3_2.stl', 'ring3_3.stl', 'ring3_4.stl',
  'l_ring3_1.stl',
  'r_pinky3_1.stl', 'pinky3_2.stl', 'pinky3_3.stl', 'pinky3_4.stl',
  'l_pinky3_1.stl',
  'r_cover_hand.stl', 'r_cover_handring.stl', 'r_cover_handpinky.stl',
  'r_cover_thumb.stl', 'r_cover_index.stl', 'r_cover_middle.stl',
  'r_cover_ring.stl', 'r_cover_pinky.stl',
  'l_cover_hand.stl', 'l_cover_handring.stl', 'l_cover_handpinky.stl',
  'l_cover_thumb.stl', 'l_cover_index.stl', 'l_cover_middle.stl',
  'l_cover_ring.stl', 'l_cover_pinky.stl',
];

export interface MeshDiagnosticResult {
  filename: string;
  status: 'ok' | 'missing' | 'error';
  size?: number;
  error?: string;
}

export async function testMeshLoading(): Promise<MeshDiagnosticResult[]> {
  const results: MeshDiagnosticResult[] = [];
  
  for (const file of MESH_FILES) {
    const url = `/meshes/${file}`;
    try {
      const response = await fetch(url, { headers: { 'Accept': '*/*' } });
      
      if (response.ok) {
        const buffer = await response.arrayBuffer();
        results.push({
          filename: file,
          status: 'ok',
          size: buffer.byteLength,
        });
        console.log(`✓ ${file}: ${buffer.byteLength} bytes`);
      } else {
        results.push({
          filename: file,
          status: 'missing',
          error: `HTTP ${response.status}: ${response.statusText}`,
        });
        console.error(`✗ ${file}: ${response.status}`);
      }
    } catch (error) {
      results.push({
        filename: file,
        status: 'error',
        error: error instanceof Error ? error.message : String(error),
      });
      console.error(`✗ ${file}: ${error}`);
    }
  }
  
  const summary = {
    total: results.length,
    ok: results.filter(r => r.status === 'ok').length,
    missing: results.filter(r => r.status === 'missing').length,
    error: results.filter(r => r.status === 'error').length,
  };
  
  console.log('\n=== Mesh Loading Summary ===');
  console.log(JSON.stringify(summary, null, 2));
  console.log('\nFailed meshes:');
  results.filter(r => r.status !== 'ok').forEach(r => {
    console.log(`  ${r.filename}: ${r.error}`);
  });
  
  return results;
}

export async function testSingleMesh(filename: string): Promise<boolean> {
  const url = `/meshes/${filename}`;
  try {
    console.log(`Testing: ${url}`);
    const response = await fetch(url, { headers: { 'Accept': '*/*' } });
    console.log(`Response: ${response.status} ${response.statusText}`);
    console.log(`Content-Type: ${response.headers.get('Content-Type')}`);
    console.log(`Content-Length: ${response.headers.get('Content-Length')}`);
    
    if (response.ok) {
      const buffer = await response.arrayBuffer();
      console.log(`✓ Successfully loaded ${filename}: ${buffer.byteLength} bytes`);
      return true;
    } else {
      console.error(`✗ Failed to load ${filename}: HTTP ${response.status}`);
      return false;
    }
  } catch (error) {
    console.error(`✗ Error loading ${filename}:`, error);
    return false;
  }
}

// Export diagnostics to window for console access
if (typeof window !== 'undefined') {
  (window as any).meshDiagnostics = {
    testMeshLoading,
    testSingleMesh,
    MESH_FILES,
  };
}
