// main.js

const { Plugin, PluginSettingTab, Setting, Notice } = require('obsidian');

const DEFAULT_SETTINGS = {
  folderPath: 'Excalidraw' // Default folder changed to 'Excalidraw'
};

class ExcalidrawCollabPlugin extends Plugin {
  async onload() {
    console.log('Loading Excalidraw Collaboration Plugin');
    await this.loadSettings();

    // Add command
    this.addCommand({
      id: 'open-excalidraw-collab',
      name: 'Open Excalidraw Collaboration Room',
      callback: () => this.openExcalidrawCollab()
    });

    // Add ribbon icon
    this.addRibbonIcon('pencil', 'Open Excalidraw Collaboration Room', () => this.openExcalidrawCollab());

    // Add settings tab
    this.addSettingTab(new ExcalidrawCollabSettingsTab(this.app, this));
  }

  async openExcalidrawCollab() {
    // Generate room and key
    const roomBytes = window.crypto.getRandomValues(new Uint8Array(10));
    const room = Array.from(roomBytes)
      .map((byte) => `0${byte.toString(16)}`.slice(-2))
      .join('');
    const keyObj = await window.crypto.subtle.generateKey({ name: 'AES-GCM', length: 128 }, true, [
      'encrypt',
      'decrypt'
    ]);
    const exportedKey = await window.crypto.subtle.exportKey('jwk', keyObj);
    const key = exportedKey.k;
    const link = `https://excalidraw.com/#room=${room},${key}`;

    // Ensure folder exists
    const folderPath = this.settings.folderPath || 'Excalidraw';
    let folder = this.app.vault.getAbstractFileByPath(folderPath);
    if (!folder) {
      await this.app.vault.createFolder(folderPath);
      folder = this.app.vault.getAbstractFileByPath(folderPath);
    }

    // Save link to file
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const fileName = `ExcalidrawCollab-${timestamp}.md`;
    const filePath = `${folderPath}/${fileName}`;
    const fileContent = `# Excalidraw Collaboration Room\n\n[Open Collaboration Room](${link})`;

    await this.app.vault.create(filePath, fileContent);

    // Open the file in a new leaf
    // const file = this.app.vault.getAbstractFileByPath(filePath);
    // const leaf = this.app.workspace.getLeaf(false);
    // await leaf.openFile(file);

    // Open the link in the default web browser
    // require('electron').shell.openExternal(link);
    // app.workspace.openLinkText(link, '');
    window.open('obsidian://web-open?url=' + encodeURIComponent(link), '_blank');
    navigator.clipboard.writeText(link).then(() => console.log('Link copied to clipboard!'));

    // Notify user
    new Notice('Excalidraw collaboration room opened in your browser and link copied to clipboard.');
  }

  async loadSettings() {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
  }

  async saveSettings() {
    await this.saveData(this.settings);
  }
}

class ExcalidrawCollabSettingsTab extends PluginSettingTab {
  constructor(app, plugin) {
    super(app, plugin);
    this.plugin = plugin;
  }

  display() {
    const { containerEl } = this;

    containerEl.empty();
    containerEl.createEl('h2', { text: 'Excalidraw Collaboration Settings' });

    new Setting(containerEl)
      .setName('Folder Path')
      .setDesc('Folder to save the Excalidraw collaboration links.')
      .addText((text) =>
        text
          .setPlaceholder('Enter folder path')
          .setValue(this.plugin.settings.folderPath)
          .onChange(async (value) => {
            this.plugin.settings.folderPath = value;
            await this.plugin.saveSettings();
          })
      );
  }
}

module.exports = ExcalidrawCollabPlugin;