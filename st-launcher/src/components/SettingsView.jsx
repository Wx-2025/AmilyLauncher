import React, { useState } from 'react';

const SettingsView = ({ t, language, setLanguage }) => {
  const [backupStatus, setBackupStatus] = useState('');
  const [proxyUrl, setProxyUrl] = useState('http://127.0.0.1:7890');
  const [memorySize, setMemorySize] = useState('600');

  const handleOpenDir = async (type) => {
    if (window.electron) {
      await window.electron.sendCommand('openDir', { type });
    }
  };

  const handleBackup = async () => {
    if (window.electron) {
      setBackupStatus('正在备份...');
      try {
        const result = await window.electron.sendCommand('createBackup');
        setBackupStatus(`备份成功: ${result}`);
        alert(`备份已创建：${result}`);
      } catch (e) {
        setBackupStatus('备份失败');
        alert('备份失败: ' + e.message);
      }
    }
  };

  const handleClearCache = async () => {
    if (confirm('确定要清理下载缓存吗？这将删除未完成的下载文件。')) {
      if (window.electron) {
        try {
          await window.electron.sendCommand('clearCache');
          alert('缓存已清理');
        } catch (e) {
          alert('清理失败: ' + e.message);
        }
      }
    }
  };

  const handleUpdateConfig = async (type, value) => {
    if (window.electron) {
      try {
        await window.electron.sendCommand('updateConfig', { type, value });
        alert('设置已更新，重启酒馆后生效');
      } catch (e) {
        alert('设置失败: ' + e.message);
      }
    }
  };

  return (
    <div className="cards-container" style={{ display: 'block' }}>
      <div className="header">
        <h2>{t.settings.title}</h2>
      </div>

      <div className="card" style={{ marginBottom: '20px' }}>
        <h3>{t.settings.language}</h3>
        <p>{t.settings.language_desc}</p>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button 
            className="action-btn" 
            onClick={() => setLanguage('zh')}
            style={{ 
              backgroundColor: language === 'zh' ? '#007acc' : '#333', 
              border: '1px solid #555',
              width: 'auto'
            }}
          >
            简体中文
          </button>
          <button 
            className="action-btn" 
            onClick={() => setLanguage('en')}
            style={{ 
              backgroundColor: language === 'en' ? '#007acc' : '#333', 
              border: '1px solid #555',
              width: 'auto'
            }}
          >
            English
          </button>
        </div>
      </div>

      <div className="card" style={{ marginBottom: '20px' }}>
        <h3>{t.settings.network}</h3>
        <p>{t.settings.network_desc}</p>
        <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
          <input 
            type="text" 
            value={proxyUrl} 
            onChange={(e) => setProxyUrl(e.target.value)}
            placeholder="http://127.0.0.1:7890"
            style={{ flex: 1, padding: '10px', borderRadius: '4px', border: '1px solid #555', backgroundColor: '#333', color: '#fff' }}
          />
          <button 
            className="action-btn" 
            onClick={() => handleUpdateConfig('proxy', proxyUrl)}
            style={{ backgroundColor: '#007acc', color: 'white', width: 'auto' }}
          >
            {t.settings.apply_proxy}
          </button>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button 
            className="action-btn" 
            onClick={() => setProxyUrl('http://127.0.0.1:7890')}
            style={{ backgroundColor: '#333', border: '1px solid #555', fontSize: '12px', padding: '8px' }}
          >
            Clash (7890)
          </button>
          <button 
            className="action-btn" 
            onClick={() => setProxyUrl('http://127.0.0.1:10809')}
            style={{ backgroundColor: '#333', border: '1px solid #555', fontSize: '12px', padding: '8px' }}
          >
            v2rayN (10809)
          </button>
          <button 
            className="action-btn" 
            onClick={() => handleUpdateConfig('proxy', 'disabled')}
            style={{ backgroundColor: '#dc3545', color: 'white', fontSize: '12px', padding: '8px', marginLeft: 'auto' }}
          >
            {t.settings.close_proxy}
          </button>
        </div>
      </div>

      <div className="card" style={{ marginBottom: '20px' }}>
        <h3>{t.settings.performance}</h3>
        <p>{t.settings.performance_desc}</p>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <input 
            type="number" 
            value={memorySize} 
            onChange={(e) => setMemorySize(e.target.value)}
            style={{ width: '100px', padding: '10px', borderRadius: '4px', border: '1px solid #555', backgroundColor: '#333', color: '#fff' }}
          />
          <span style={{ color: '#ccc' }}>MB</span>
          <button 
            className="action-btn" 
            onClick={() => handleUpdateConfig('memory', memorySize)}
            style={{ backgroundColor: '#007acc', color: 'white', width: 'auto', marginLeft: '10px' }}
          >
            {t.settings.apply_settings}
          </button>
        </div>
      </div>

      <div className="card" style={{ marginBottom: '20px' }}>
        <h3>{t.settings.directories}</h3>
        <p>{t.settings.directories_desc}</p>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button 
            className="action-btn" 
            onClick={() => handleOpenDir('userData')}
            style={{ backgroundColor: '#333', border: '1px solid #555' }}
          >
            {t.settings.open_user_data}
          </button>
          <button 
            className="action-btn" 
            onClick={() => handleOpenDir('versions')}
            style={{ backgroundColor: '#333', border: '1px solid #555' }}
          >
            {t.settings.open_versions}
          </button>
        </div>
      </div>

      <div className="card" style={{ marginBottom: '20px' }}>
        <h3>{t.settings.backup}</h3>
        <p>{t.settings.backup_desc}</p>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <button 
            className="action-btn" 
            onClick={handleBackup}
            style={{ backgroundColor: '#007acc', color: 'white', width: 'auto', minWidth: '120px' }}
          >
            {t.settings.backup_btn}
          </button>
          <span style={{ color: '#ccc', fontSize: '14px' }}>{backupStatus}</span>
        </div>
      </div>

      <div className="card">
        <h3>{t.settings.maintenance}</h3>
        <p>{t.settings.maintenance_desc}</p>
        <button 
          className="action-btn" 
          onClick={handleClearCache}
          style={{ backgroundColor: '#dc3545', color: 'white', width: 'auto' }}
        >
          {t.settings.clear_cache}
        </button>
      </div>
    </div>
  );
};

export default SettingsView;
