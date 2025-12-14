import React from 'react';

const LinkageView = ({ t }) => {
  const handleTestLinkage = async () => {
    if (window.electron) {
      try {
        const result = await window.electron.sendTestMessage();
        if (result) {
          alert('联动指令已发送！请查看酒馆聊天框。');
        } else {
          alert('发送失败：未连接到插件。请确保酒馆已启动且插件已加载。');
        }
      } catch (e) {
        alert('发送失败: ' + e.message);
      }
    }
  };

  return (
    <div className="cards-container">
      <div className="card">
        <h3>{t.linkage.card_title}</h3>
        <p>{t.linkage.card_desc}</p>
        <button 
          className="action-btn"
          onClick={handleTestLinkage}
          style={{ backgroundColor: '#28a745', color: 'white' }}
        >
          {t.linkage.test_btn}
        </button>
      </div>
    </div>
  );
};

export default LinkageView;
