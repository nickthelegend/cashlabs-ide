import React from "react";
import { Folder, File, ChevronRight, ChevronDown } from "lucide-react";

interface FileTreeProps {
  fileStructure: any;
  activeFile: string;
  onFileSelect: (filePath: string) => void;
  onContextMenu?: (e: React.MouseEvent, filePath: string) => void;
  onRename?: (oldPath: string, newPath: string) => void;
  renamingPath?: string | null;
  onRenamingPathChange?: (path: string | null) => void;
  currentPath?: string;
}

const FileTree: React.FC<FileTreeProps> = ({
  fileStructure,
  activeFile,
  onFileSelect,
  onContextMenu,
  onRename,
  renamingPath,
  onRenamingPathChange,
  currentPath = "",
}) => {
  const [expanded, setExpanded] = React.useState<Record<string, boolean>>({});
  const [tempName, setTempName] = React.useState("");

  React.useEffect(() => {
    if (renamingPath && (renamingPath === currentPath || renamingPath.startsWith(currentPath + "/"))) {
      const parts = renamingPath.split('/');
      const currentParts = currentPath ? currentPath.split('/') : [];
      if (parts.length === currentParts.length + 1) {
        setTempName(parts[parts.length - 1]);
      }
    }
  }, [renamingPath, currentPath]);

  const toggleExpand = (name: string) => {
    setExpanded((prev) => ({ ...prev, [name]: !prev[name] }));
  };

  const handleRenameSubmit = (oldPath: string) => {
    if (tempName && onRename) {
      const pathParts = oldPath.split("/");
      pathParts[pathParts.length - 1] = tempName;
      const newPath = pathParts.join("/");
      if (newPath !== oldPath) {
        onRename(oldPath, newPath);
      }
    }
    onRenamingPathChange?.(null);
  };

  const sortedEntries = Object.entries(fileStructure).sort(([nameA, entryA], [nameB, entryB]) => {
    const isDirA = (entryA as any).directory;
    const isDirB = (entryB as any).directory;

    if (isDirA && !isDirB) return -1;
    if (!isDirA && isDirB) return 1;
    return nameA.localeCompare(nameB);
  });

  return (
    <div className="text-sm">
      {sortedEntries.map(([name, entry]) => {
        const fullPath = currentPath ? `${currentPath}/${name}` : name;
        const isDirectory = (entry as any).directory;
        const isFile = (entry as any).file;
        const isCurrentlyActive = activeFile === fullPath;
        const isEditing = renamingPath === fullPath;

        return (
          <div key={fullPath}>
            {isDirectory ? (
              <div>
                <div
                  className="flex items-center gap-2 py-1 px-2 cursor-pointer hover:bg-muted/50 group"
                  onClick={() => toggleExpand(name)}
                  onContextMenu={(e) => onContextMenu?.(e, fullPath)}
                >
                  {expanded[name] ? (
                    <ChevronDown size={16} className="flex-shrink-0" />
                  ) : (
                    <ChevronRight size={16} className="flex-shrink-0" />
                  )}
                  <Folder size={16} className="flex-shrink-0 text-blue-400" />
                  {isEditing ? (
                    <input
                      className="bg-[#1e1e1e] border border-[#0e639c] text-white px-1 w-full outline-none"
                      value={tempName}
                      onChange={(e) => setTempName(e.target.value)}
                      onBlur={() => handleRenameSubmit(fullPath)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleRenameSubmit(fullPath);
                        if (e.key === "Escape") onRenamingPathChange?.(null);
                      }}
                      autoFocus
                      onClick={(e) => e.stopPropagation()}
                    />
                  ) : (
                    <span className="truncate">{name}</span>
                  )}
                </div>
                {expanded[name] && (
                  <div className="ml-4 border-l border-[#3e3e42] pl-2">
                    <FileTree
                      fileStructure={(entry as any).directory}
                      activeFile={activeFile}
                      onFileSelect={onFileSelect}
                      onContextMenu={onContextMenu}
                      onRename={onRename}
                      renamingPath={renamingPath}
                      onRenamingPathChange={onRenamingPathChange}
                      currentPath={fullPath}
                    />
                  </div>
                )}
              </div>
            ) : isFile ? (
              <div
                className={`flex items-center gap-2 py-1 px-2 cursor-pointer hover:bg-muted/50 group ${isCurrentlyActive ? "bg-[#37373d] text-white" : ""
                  }`}
                onClick={() => onFileSelect(fullPath)}
                onContextMenu={(e) => onContextMenu?.(e, fullPath)}
              >
                <div className="w-4 flex-shrink-0" />
                <File size={16} className="flex-shrink-0 text-gray-400" />
                {isEditing ? (
                  <input
                    className="bg-[#1e1e1e] border border-[#0e639c] text-white px-1 w-full outline-none"
                    value={tempName}
                    onChange={(e) => setTempName(e.target.value)}
                    onBlur={() => handleRenameSubmit(fullPath)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleRenameSubmit(fullPath);
                      if (e.key === "Escape") onRenamingPathChange?.(null);
                    }}
                    autoFocus
                    onClick={(e) => e.stopPropagation()}
                  />
                ) : (
                  <span className="truncate">{name}</span>
                )}
              </div>
            ) : null}
          </div>
        );
      })}
    </div>
  );
};

export default FileTree;
