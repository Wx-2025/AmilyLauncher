import React, { useEffect, useRef } from 'react';
import { Terminal as XTerm } from 'xterm';
import { FitAddon } from 'xterm-addon-fit';
import 'xterm/css/xterm.css';

const Terminal = ({ history }) => {
  const terminalRef = useRef(null);
  const xtermRef = useRef(null);

  useEffect(() => {
    if (!terminalRef.current) return;

    // 初始化 xterm
    const term = new XTerm({
      cursorBlink: true,
      theme: {
        background: '#1e1e1e',
      },
      fontFamily: 'Consolas, "Courier New", monospace',
      fontSize: 14,
    });

    const fitAddon = new FitAddon();
    term.loadAddon(fitAddon);

    term.open(terminalRef.current);
    fitAddon.fit();
    xtermRef.current = term;

    if (history) {
      term.write(history);
    } else {
      term.writeln('欢迎使用 SillyTavern 启动器终端');
      term.writeln('----------------------------------------');
      term.writeln('终端组件已就绪，等待后端连接...');
    }

    // 处理窗口大小调整
    const handleResize = () => fitAddon.fit();
    window.addEventListener('resize', handleResize);

    // 连接 Electron IPC
    if (window.electron) {
      window.electron.onTerminalData((data) => {
        term.write(data);
        term.scrollToBottom(); // 确保自动滚动到底部
      });
      term.onData((data) => window.electron.sendKeystroke(data));
    }

    return () => {
      window.removeEventListener('resize', handleResize);
      term.dispose();
    };
  }, []);

  return (
    <div 
      ref={terminalRef} 
      style={{ 
        width: '100%', 
        height: '100%', 
        backgroundColor: '#1e1e1e',
        padding: '10px'
      }} 
    />
  );
};

export default Terminal;
