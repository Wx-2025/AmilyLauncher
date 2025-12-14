import React from 'react';

const Announcement = ({ t }) => {
  return (
    <div style={{ padding: '20px', color: '#fff' }}>
      <div className="header">
        <h2>{t.sidebar.announcement}</h2>
      </div>
      
      <div className="card" style={{ marginBottom: '20px' }}>
        <h3>开发团队留言</h3>
        <div style={{ padding: '15px', backgroundColor: '#1e1e1e', borderRadius: '4px', color: '#ccc' }}>
          <p>欢迎使用 Amily 酒馆管理器！</p>
          <p>这是一个早期版本，更多功能正在开发中。</p>
          <p>服务器接入后，这里将显示最新的更新日志和团队动态。</p>
        </div>
      </div>

      <div className="card">
        <h3>关于核心扩展</h3>
        <p>本启动器已自动为您安装 <strong>ST-Amily2-Chat-Optimisation</strong> 插件。</p>
        <p>该插件提供了强大的聊天优化功能，建议保持启用。</p>
      </div>
    </div>
  );
};

export default Announcement;
