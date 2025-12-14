import React, { useState, useEffect } from 'react';
import ControlPanel from './ControlPanel';

const VersionManager = ({ setStatus, isElectronAvailable, t }) => {
  const [installedVersions, setInstalledVersions] = useState([]);
  const [currentVersion, setCurrentVersion] = useState(null);
  const [availableVersions, setAvailableVersions] = useState([]);
  const [selectedInstallVersion, setSelectedInstallVersion] = useState('');

  const refreshInstalled = async () => {
    if (window.electron) {
      const { versions, current } = await window.electron.getInstalledVersions();
      setInstalledVersions(versions);
      setCurrentVersion(current);
    }
  };

  useEffect(() => {
    refreshInstalled();
    if (window.electron) {
      window.electron.getVersions().then(list => {
        setAvailableVersions(list);
        if (list.length > 0) setSelectedInstallVersion(list[0].tag);
      });
    }
  }, []);

  const handleSwitch = async (version) => {
    if (window.electron) {
      try {
        await window.electron.switchVersion(version);
        await refreshInstalled();
        setStatus(`已切换至版本 ${version}`);
      } catch (e) {
        setStatus(`切换失败: ${e.message}`);
      }
    }
  };

  return (
    <div className="cards-container">
      {/* 已安装版本 */}
      <div className="card" style={{ gridColumn: 'span 2' }}>
        <h3>{t.dashboard.installed_versions}</h3>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginTop: '15px' }}>
          {installedVersions.length === 0 && <p>None</p>}
          {installedVersions.map(v => (
            <div key={v} style={{ 
              padding: '10px', 
              backgroundColor: '#333', 
              borderRadius: '4px',
              border: currentVersion === v ? '1px solid #4caf50' : '1px solid #444',
              display: 'flex',
              alignItems: 'center',
              gap: '10px'
            }}>
              <span style={{ fontWeight: 'bold' }}>{v}</span>
              {currentVersion === v && <span style={{ fontSize: '12px', color: '#4caf50' }}>[Current]</span>}
              {currentVersion !== v && (
                <button 
                  onClick={() => handleSwitch(v)}
                  style={{ padding: '4px 8px', cursor: 'pointer', fontSize: '12px' }}
                >
                  Switch
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* 安装新版本 */}
      <div className="card">
        <h3>{t.dashboard.install_new}</h3>
        <p>{t.dashboard.install_new_desc}</p>
        
        <div style={{ marginBottom: '10px' }}>
          <label style={{ fontSize: '12px', color: '#ccc', marginRight: '10px' }}>{t.dashboard.select_version}</label>
          <select 
            value={selectedInstallVersion} 
            onChange={(e) => setSelectedInstallVersion(e.target.value)}
            style={{ padding: '5px', borderRadius: '4px', backgroundColor: '#333', color: '#fff', border: '1px solid #555' }}
          >
            {availableVersions.length === 0 && <option value="">获取中...</option>}
            {availableVersions.map(v => (
              <option key={v.tag} value={v.tag}>{v.name || v.tag}</option>
            ))}
          </select>
        </div>

        <ControlPanel 
          type="install" 
          setStatus={setStatus} 
          disabled={!isElectronAvailable} 
          version={selectedInstallVersion} 
          onSuccess={refreshInstalled}
          t={t}
        />
      </div>
    </div>
  );
};

export default VersionManager;
