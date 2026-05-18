export function UploadScreen({ onLoad }: { onLoad: (json: string) => void }) {
  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => onLoad(ev.target?.result as string);
    reader.readAsText(file);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => onLoad(ev.target?.result as string);
    reader.readAsText(file);
  }

  return (
    <div style={{
      minHeight      : '100vh',
      display        : 'flex',
      flexDirection  : 'column',
      alignItems     : 'center',
      justifyContent : 'center',
      padding        : '24px',
    }}>
      <div style={{ fontSize: '48px', marginBottom: '12px' }}>🪦</div>
      <h1 style={{ fontSize: '28px', fontWeight: 700, marginBottom: '8px' }}>depgrave</h1>
      <p style={{ color: '#64748b', marginBottom: '40px', fontSize: '15px' }}>
        dependency graveyard analyzer
      </p>

      <div
        onDrop={handleDrop}
        onDragOver={e => e.preventDefault()}
        style={{
          background     : '#13131f',
          border         : '2px dashed #2d2d3d',
          borderRadius   : '16px',
          padding        : '48px 64px',
          textAlign      : 'center',
          cursor         : 'pointer',
          transition     : 'border-color 0.2s',
        }}
        onMouseEnter={e => (e.currentTarget.style.borderColor = '#7dd3fc')}
        onMouseLeave={e => (e.currentTarget.style.borderColor = '#2d2d3d')}
      >
        <div style={{ fontSize: '32px', marginBottom: '12px' }}>📂</div>
        <p style={{ color: '#e2e8f0', marginBottom: '8px', fontWeight: 500 }}>
          Drop your report.json here
        </p>
        <p style={{ color: '#64748b', fontSize: '13px', marginBottom: '20px' }}>
          Generate it with: <code style={{ color: '#7dd3fc' }}>depgrave --output report.json</code>
        </p>
        <label style={{
          background   : '#1e3a5f',
          border       : '1px solid #7dd3fc44',
          borderRadius : '8px',
          color        : '#7dd3fc',
          cursor       : 'pointer',
          fontSize     : '13px',
          padding      : '10px 20px',
        }}>
          Browse file
          <input type="file" accept=".json" onChange={handleFile} style={{ display: 'none' }} />
        </label>
      </div>
    </div>
  );
}