/**
 * Type augmentations for File System Access API features not yet present
 * in the TypeScript DOM lib bundled with this project.
 */

interface Window {
  showDirectoryPicker(): Promise<FileSystemDirectoryHandle>;
}

interface FileSystemHandle {
  requestPermission(descriptor: { mode: 'read' | 'readwrite' }): Promise<PermissionState>;
}
