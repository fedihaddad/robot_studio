import { contextBridge, ipcRenderer } from 'electron';

type TerminalLoggerPayload = {
  message: string;
  data?: unknown;
};

const safeSend = (payload: TerminalLoggerPayload) => {
  try {
    ipcRenderer.send('terminal-log', payload);
  } catch {
    // Do nothing - logging is best-effort.
  }
};

contextBridge.exposeInMainWorld('terminalLogger', {
  log: (message: string, data?: unknown) => {
    safeSend({ message, data });
  },
});
