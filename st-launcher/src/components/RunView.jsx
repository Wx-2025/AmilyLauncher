import React, { useState, useRef } from 'react';
import Terminal from './Terminal';

const RunView = ({ onBack, history }) => {
  const [activeTab, setActiveTab] = useState('tavern');
  const webviewRef = useRef(null);

  const openDevTools = () => {
    if (webviewRef.current) {
      webviewRef.current.openDevTools();
    }
  };

  const reload = () => {
    if (webviewRef.current) {
      webviewRef.current.reload();
    }
  };

  const testLinkage = () => {
    if (webviewRef.current) {
      // 尝试调用 AmilyHelper
      webviewRef.current.executeJavaScript(`
        if (window.AmilyHelper) {
          window.AmilyHelper.triggerSlash('/echo [系统] 启动器与插件联动成功！');
          console.log('联动指令已发送');
        } else {
          console.warn('未检测到 AmilyHelper，请确保插件已启用');
          alert('未检测到 AmilyHelper 插件，请确保 SillyTavern 已加载该插件。');
        }
      `);
    }
  };

  // 自动重试逻辑
  React.useEffect(() => {
    const webview = webviewRef.current;
    if (webview) {
      const handleFail = () => {
        console.log('加载失败，3秒后重试...');
        setTimeout(() => {
          if (webview.reload) webview.reload();
        }, 3000);
      };
      webview.addEventListener('did-fail-load', handleFail);
      return () => {
        webview.removeEventListener('did-fail-load', handleFail);
      };
    }
  }, []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', width: '100%', backgroundColor: '#1e1e1e' }}>
      {/* 顶部导航栏 */}
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        padding: '0 10px', 
        backgroundColor: '#252526', 
        borderBottom: '1px solid #333',
        height: '40px'
      }}>
        <button 
          onClick={onBack}
          style={{ 
            padding: '4px 12px', 
            marginRight: '10px',
            backgroundColor: '#333', 
            border: '1px solid #555', 
            color: '#fff',
            cursor: 'pointer',
            borderRadius: '4px'
          }}
        >
          ← 返回
        </button>

        <button 
          onClick={reload}
          style={{ 
            padding: '4px 12px', 
            marginRight: '10px',
            backgroundColor: '#007acc', 
            border: 'none', 
            color: '#fff',
            cursor: 'pointer',
            borderRadius: '4px'
          }}
        >
          ↻ 刷新
        </button>

        <button 
          onClick={testLinkage}
          style={{ 
            padding: '4px 12px', 
            marginRight: '20px',
            backgroundColor: '#28a745', 
            border: 'none', 
            color: '#fff',
            cursor: 'pointer',
            borderRadius: '4px'
          }}
        >
          🔗 测试联动
        </button>

        <div style={{ display: 'flex', gap: '2px', height: '100%' }}>
          {['tavern', 'terminal', 'console'].map(tab => (
            <div
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                padding: '0 20px',
                display: 'flex',
                alignItems: 'center',
                cursor: 'pointer',
                backgroundColor: activeTab === tab ? '#1e1e1e' : 'transparent',
                color: activeTab === tab ? '#fff' : '#ccc',
                borderTop: activeTab === tab ? '2px solid #007acc' : '2px solid transparent',
                fontWeight: activeTab === tab ? 'bold' : 'normal'
              }}
            >
              {tab === 'tavern' && '酒馆'}
              {tab === 'terminal' && '终端'}
              {tab === 'console' && '控制台'}
            </div>
          ))}
        </div>
      </div>

      {/* 内容区域 */}
      <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
        
        {/* 酒馆 Webview */}
        <div style={{ 
          width: '100%', 
          height: '100%', 
          display: activeTab === 'tavern' ? 'flex' : 'none' 
        }}>
          <webview 
            ref={webviewRef}
            src="http://127.0.0.1:8000" 
            style={{ width: '100%', height: '100%' }}
            allowpopups="true"
            disablewebsecurity="true"
          />
        </div>

        {/* 终端 */}
        <div style={{ 
          width: '100%', 
          height: '100%', 
          display: activeTab === 'terminal' ? 'block' : 'none',
          backgroundColor: '#000'
        }}>
          <Terminal history={history} />
        </div>

        {/* 控制台 (DevTools 引导) */}
        <div style={{ 
          width: '100%', 
          height: '100%', 
          display: activeTab === 'console' ? 'flex' : 'none',
          justifyContent: 'center',
          alignItems: 'center',
          flexDirection: 'column',
          color: '#ccc'
        }}>
          <p>这里可以查看酒馆页面的调试信息。</p>
          <button 
            onClick={openDevTools}
            style={{ 
              padding: '10px 20px', 
              backgroundColor: '#007acc', 
              color: 'white', 
              border: 'none', 
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '16px'
            }}
          >
            打开开发者工具 (DevTools)
          </button>
        </div>

      </div>
    </div>
  );
};

export default RunView;
