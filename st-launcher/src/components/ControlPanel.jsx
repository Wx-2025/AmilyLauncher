import React, { useState, useEffect } from 'react';

const ControlPanel = ({ type, setStatus, disabled, version, onSuccess, t }) => {
  const [progress, setProgress] = useState(0);
  const [isDownloading, setIsDownloading] = useState(false);

  useEffect(() => {
    if (window.electron) {
      const unsubscribe = window.electron.onDownloadProgress((data) => {
        setIsDownloading(true);
        if (data.progress >= 0) {
          setProgress(data.progress);
        } else if (data.downloaded) {
          // 如果无法计算百分比，使用负数表示已下载大小（MB）
          setProgress(-1 * (data.downloaded / 1024 / 1024).toFixed(2));
        }
        if (data.progress === 100) {
          setIsDownloading(false);
        }
      });
      return unsubscribe;
    }
  }, []);

  const handleInstall = async () => {
    if (window.electron) {
      setStatus('安装中...');
      setProgress(0);
      try {
        await window.electron.install(version);
        setStatus('安装完成');
        // 延迟一点时间确保文件系统更新
        setTimeout(() => {
          if (onSuccess) onSuccess();
        }, 1000);
      } catch (e) {
        setStatus('安装失败');
      } finally {
        setIsDownloading(false);
      }
    }
  };

  const handleStart = async () => {
    if (window.electron) {
      setStatus('运行中');
      try {
        await window.electron.start();
        if (onSuccess) onSuccess();
      } catch (e) {
        setStatus('启动失败');
      }
    }
  };


  if (type === 'install') {
    const progressText = progress >= 0 ? `${progress}%` : `${Math.abs(progress)} MB`;
    const progressWidth = progress >= 0 ? `${progress}%` : '100%';
    const progressClass = progress >= 0 ? '' : 'indeterminate';

    return (
      <div style={{ width: '100%' }}>
        <button 
          className="action-btn install-btn"
          onClick={handleInstall}
          disabled={disabled || isDownloading}
        >
          {isDownloading ? `Downloading ${progressText}` : t.dashboard.install_btn}
        </button>
        {isDownloading && (
          <div style={{ 
            width: '100%', 
            height: '4px', 
            backgroundColor: '#444', 
            marginTop: '10px',
            borderRadius: '2px',
            overflow: 'hidden',
            position: 'relative'
          }}>
            <div 
              className={progressClass}
              style={{ 
                width: progressWidth, 
                height: '100%', 
                backgroundColor: '#007acc',
                transition: 'width 0.2s'
              }} 
            />
          </div>
        )}
      </div>
    );
  }

  if (type === 'start') {
    return (
      <button 
        className="action-btn start-btn"
        onClick={handleStart}
        disabled={disabled}
      >
        {t.dashboard.start_btn}
      </button>
    );
  }

  return null;
};

export default ControlPanel;
