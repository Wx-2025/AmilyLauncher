import React from 'react';

const AboutView = ({ t }) => {
  const [version, setVersion] = React.useState('1.0.0');

  React.useEffect(() => {
    if (window.electron) {
      window.electron.getAppVersion().then(setVersion);
    }
  }, []);

  return (
    <div className="cards-container" style={{ display: 'block' }}>
      <div className="header">
        <h2>{t.about.title}</h2>
        <p>v{version}</p>
      </div>

      <div className="card" style={{ marginBottom: '20px' }}>
        <h3>{t.about.community}</h3>
        <p>{t.about.community_desc}</p>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button 
            className="action-btn" 
            onClick={() => window.electron.sendCommand('openUrl', { url: 'https://qm.qq.com/q/vORLx9dtfy' })}
            style={{ backgroundColor: '#12b7f5', color: 'white', width: 'auto' }}
          >
            {t.about.group1}
          </button>
          <button 
            className="action-btn" 
            onClick={() => window.electron.sendCommand('openUrl', { url: 'https://qm.qq.com/q/A99n1xf118' })}
            style={{ backgroundColor: '#12b7f5', color: 'white', width: 'auto' }}
          >
            {t.about.group2}
          </button>
        </div>
      </div>

      <div className="card" style={{ marginBottom: '20px' }}>
        <h3>{t.about.disclaimer}</h3>
        <div style={{ fontSize: '14px', lineHeight: '1.6', color: '#ccc' }}>
          <p>1. <strong>仅供学习交流</strong>：本软件（Amily 酒馆管理器）及其关联插件仅供个人技术研究、学习和交流使用。严禁用于任何商业用途或非法用途。</p>
          <p>2. <strong>内容责任</strong>：本软件本身不包含任何违规内容。用户在使用本软件过程中产生、导入、下载或传播的任何内容（包括但不限于角色卡、聊天记录、提示词、插件配置等），均由用户自行承担全部法律责任。开发者不对用户的行为及产生的内容承担任何责任。</p>
          <p>3. <strong>合规使用</strong>：请用户严格遵守所在国家或地区的法律法规。严禁使用本软件生成、传播色情、暴力、政治敏感或其他违反法律法规的内容。</p>
          <p>4. <strong>第三方服务</strong>：本软件可能涉及第三方服务（如 GitHub、API 接口等）。开发者不对第三方服务的可用性、安全性或合法性负责。</p>
          <p>5. <strong>数据安全</strong>：本软件的数据存储在用户本地。请用户自行妥善保管数据，开发者不对因意外导致的数据丢失负责。</p>
        </div>
      </div>

      <div className="card" style={{ marginBottom: '20px' }}>
        <h3>{t.about.privacy}</h3>
        <div style={{ fontSize: '14px', lineHeight: '1.6', color: '#ccc' }}>
          <p>1. <strong>数据收集</strong>：本软件不会收集用户的个人隐私信息、聊天记录或 API 密钥。所有数据均存储在用户本地设备上。</p>
          <p>2. <strong>网络通信</strong>：本软件仅在下载更新、安装插件或用户主动配置 API 时进行网络通信。软件不会在后台偷偷上传用户数据。</p>
          <p>3. <strong>权限使用</strong>：本软件需要文件读写权限以管理 SillyTavern 程序及数据，需要网络权限以进行更新。</p>
        </div>
      </div>

      <div className="card">
        <h3>{t.about.privacy_amily}</h3>
        <div style={{ fontSize: '14px', lineHeight: '1.6', color: '#ccc' }}>
          <p>亲爱的用户：</p>
          <p>为了让大家用得放心，我们对服务器端代码及验证机制进行了严格的审查。在此郑重向大家承诺：</p>
          
          <h4 style={{ color: '#fff', marginTop: '15px' }}>1. 零内容上传</h4>
          <p>您的所有<strong>聊天记录、角色卡、世界书设定</strong>等核心数据，<strong>完全保留在您的本地电脑中</strong>（SillyTavern 本地环境）。我们的验证服务器绝不会请求、接收或存储这些敏感信息。</p>

          <h4 style={{ color: '#fff', marginTop: '15px' }}>2. 零隐私收集</h4>
          <p>在激活插件时，我们的服务器<strong>仅接收您填写的“插件授权码”</strong>（Code）用于比对验证、避免第三方贩子的倒卖行为。</p>
          <ul style={{ paddingLeft: '20px', margin: '5px 0' }}>
            <li><strong>不收集</strong>您的 IP 地址或地理位置。</li>
            <li><strong>不收集</strong>您的设备信息、系统版本或浏览器指纹。</li>
            <li><strong>不收集</strong>任何个人身份信息。</li>
          </ul>

          <h4 style={{ color: '#fff', marginTop: '15px' }}>3. 纯匿名的在线统计</h4>
          <p>您可能在仪表盘看到的“在线人数”，仅统计当前的 WebSocket <strong>活跃连接数量</strong>。这是一个纯数字统计，我们无法（也不会）追踪连接背后的具体用户身份。</p>

          <h4 style={{ color: '#fff', marginTop: '15px' }}>4. 代码公开透明</h4>
          <p>我们的验证逻辑简单纯粹，旨在保护正版（非商业等方式获取当前插件）用户的权益，同时最大程度尊重每一位用户的隐私边界。</p>
          
          <p style={{ marginTop: '15px', fontStyle: 'italic' }}>感谢您的信任与支持！<br/>— Amily2号开发者：诗与酒.</p>
        </div>
      </div>

      <div style={{ marginTop: '30px', textAlign: 'center', fontSize: '12px', color: '#666' }}>
        <p>使用本软件即表示您已阅读并同意上述条款。</p>
        <p>Copyright © 2025 Amily Team. All Rights Reserved.</p>
      </div>
    </div>
  );
};

export default AboutView;
