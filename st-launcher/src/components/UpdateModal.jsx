import React from 'react';

const UpdateModal = ({ updateInfo, onUpdate, progress }) => {
  if (!updateInfo) return null;

  const { version, changelog, force } = updateInfo;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.8)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 1000
    }}>
      <div style={{
        backgroundColor: '#252526',
        padding: '30px',
        borderRadius: '12px',
        width: '400px',
        border: '1px solid #3f3f46',
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5)'
      }}>
        <h2 style={{ marginTop: 0, color: '#fff' }}>发现新版本 v{version}</h2>
        
        <div style={{ 
          margin: '20px 0', 
          maxHeight: '200px', 
          overflowY: 'auto',
          backgroundColor: '#1e1e1e',
          padding: '15px',
          borderRadius: '8px',
          color: '#ccc',
          whiteSpace: 'pre-wrap',
          fontSize: '14px'
        }}>
          {changelog}
        </div>

        {progress > 0 ? (
          <div style={{ marginTop: '20px' }}>
            <div style={{ marginBottom: '5px', color: '#ccc', fontSize: '12px' }}>正在下载更新... {progress}%</div>
            <div style={{ 
              width: '100%', 
              height: '6px', 
              backgroundColor: '#333', 
              borderRadius: '3px',
              overflow: 'hidden'
            }}>
              <div style={{ 
                width: `${progress}%`, 
                height: '100%', 
                backgroundColor: '#22c55e',
                transition: 'width 0.2s'
              }} />
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
            {!force && (
              <button 
                onClick={() => onUpdate(false)}
                style={{
                  padding: '10px 20px',
                  backgroundColor: 'transparent',
                  border: '1px solid #555',
                  color: '#ccc',
                  borderRadius: '6px',
                  cursor: 'pointer'
                }}
              >
                稍后提醒
              </button>
            )}
            <button 
              onClick={() => onUpdate(true)}
              style={{
                padding: '10px 20px',
                backgroundColor: '#22c55e',
                border: 'none',
                color: 'white',
                borderRadius: '6px',
                cursor: 'pointer',
                fontWeight: 'bold'
              }}
            >
              立即更新
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default UpdateModal;
