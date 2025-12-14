import React, { useState, useEffect } from 'react';
import Terminal from './components/Terminal';
import ControlPanel from './components/ControlPanel';
import Announcement from './components/Announcement';
import VersionManager from './components/VersionManager';
import LinkageView from './components/LinkageView';
import AboutView from './components/AboutView';
import SettingsView from './components/SettingsView';
import UpdateModal from './components/UpdateModal';
import { resources } from './locales';

export const LanguageContext = React.createContext();

function App() {
  const [status, setStatus] = useState('就绪');
  const [isElectronAvailable, setIsElectronAvailable] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [language, setLanguage] = useState('zh');
  const terminalHistory = React.useRef('');
  
  const t = resources[language];

  // 更新相关状态
  const [updateInfo, setUpdateInfo] = useState(null);
  const [updateProgress, setUpdateProgress] = useState(0);

  useEffect(() => {
    if (window.electron) {
      setIsElectronAvailable(true);
      // 全局监听日志，用于历史回放
      const unsubscribe = window.electron.onTerminalData((data) => {
        terminalHistory.current += data;
      });
      
      // 监听更新
      const unsubUpdate = window.electron.onUpdateAvailable((info) => {
        setUpdateInfo(info);
      });
      const unsubProgress = window.electron.onUpdateProgress((progress) => {
        setUpdateProgress(progress);
      });
      const unsubError = window.electron.onUpdateError((error) => {
        alert('更新失败: ' + error);
        setUpdateInfo(null);
        setUpdateProgress(0);
      });

      return () => {
        unsubscribe();
        unsubUpdate();
        unsubProgress();
        unsubError();
      };
    }
  }, []);

  const handleUpdate = (confirm) => {
    if (confirm) {
      window.electron.startUpdate(updateInfo.downloadUrl);
    } else {
      setUpdateInfo(null);
    }
  };

  const renderContent = () => {
    if (activeTab === 'dashboard') {
      return (
        <>
          <div className="header">
            <h2>{t.dashboard.title}</h2>
            <span className={`status-badge ${status === '就绪' ? 'ready' : 'busy'}`}>
              {status}
            </span>
          </div>

          {!isElectronAvailable && (
            <div className="error-banner">
              ⚠️ 检测到 Electron 环境异常，功能可能无法使用。请检查 preload.js 是否正确加载。
            </div>
          )}

          <div className="cards-container">
            <div className="card">
              <h3>{t.dashboard.start_tavern}</h3>
              <p>{t.dashboard.start_desc}</p>
              <ControlPanel 
                type="start" 
                setStatus={setStatus} 
                disabled={!isElectronAvailable} 
                t={t}
              />
            </div>
          </div>

          {/* 版本管理区域 */}
          <div style={{ marginBottom: '20px' }}>
            <VersionManager setStatus={setStatus} isElectronAvailable={isElectronAvailable} t={t} />
          </div>

          <div className="terminal-section">
            <div className="terminal-header">{t.dashboard.logs}</div>
            <div className="terminal-wrapper">
              <Terminal history={terminalHistory.current} />
            </div>
          </div>
        </>
      );
    } else if (activeTab === 'linkage') {
      return (
        <>
          <div className="header">
            <h2>{t.linkage.title}</h2>
          </div>
          <LinkageView t={t} />
        </>
      );
    } else if (activeTab === 'announcement') {
      return <Announcement t={t} />;
    } else if (activeTab === 'settings') {
      return <SettingsView t={t} language={language} setLanguage={setLanguage} />;
    } else if (activeTab === 'about') {
      return <AboutView t={t} />;
    }
  };

  return (
    <LanguageContext.Provider value={{ t, language, setLanguage }}>
      <div className="app-container">
        {/* 侧边栏 */}
        <div className="sidebar">
          <div className="logo">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M13 2L3 14H12L11 22L21 10H12L13 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Amily
          </div>
          <div 
            className={`menu-item ${activeTab === 'dashboard' ? 'active' : ''}`}
            onClick={() => setActiveTab('dashboard')}
          >
            {t.sidebar.dashboard}
          </div>
          <div 
            className={`menu-item ${activeTab === 'linkage' ? 'active' : ''}`}
            onClick={() => setActiveTab('linkage')}
          >
            {t.sidebar.linkage}
          </div>
          <div 
            className={`menu-item ${activeTab === 'announcement' ? 'active' : ''}`}
            onClick={() => setActiveTab('announcement')}
          >
            {t.sidebar.announcement}
          </div>
          <div 
            className={`menu-item ${activeTab === 'settings' ? 'active' : ''}`}
            onClick={() => setActiveTab('settings')}
          >
            {t.sidebar.settings}
          </div>
          <div 
            className={`menu-item ${activeTab === 'about' ? 'active' : ''}`}
            onClick={() => setActiveTab('about')}
          >
            {t.sidebar.about}
          </div>
        </div>

        {/* 主内容区 */}
        <div className="main-content">
          {renderContent()}
        </div>
        
        {/* 更新弹窗 */}
        <UpdateModal 
          updateInfo={updateInfo} 
          onUpdate={handleUpdate} 
          progress={updateProgress} 
        />
      </div>
    </LanguageContext.Provider>
  );
}

export default App;
