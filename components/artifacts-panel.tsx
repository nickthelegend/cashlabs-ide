"use client"

import React, { useState, useEffect } from "react"
import { FileCode, Rocket, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"

interface ArtifactsPanelProps {
  webcontainer: any;
  onDeploy: (filename: string, artifact?: any) => Promise<void>;
  fileContents?: Record<string, string>;
}

export function ArtifactsPanel({ webcontainer, onDeploy, fileContents }: ArtifactsPanelProps) {
  const [artifactFiles, setArtifactFiles] = useState<{ name: string, type: string, contractName?: string }[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const loadArtifacts = () => {
    if (fileContents) {
      const artifacts = Object.keys(fileContents)
        .filter(path => path.startsWith('artifacts/'))
        .map(path => path.replace('artifacts/', ''))
        .filter(file => file.endsWith('.json') && !file.endsWith('.info.txt'))
        .map(file => {
          let type = 'unknown';
          let contractName: string | undefined;

          try {
            const content = fileContents[`artifacts/${file}`];
            if (content) {
              const parsed = JSON.parse(content);
              // CashScript artifact
              if (parsed.contractName && parsed.bytecode && parsed.abi) {
                type = 'cashscript';
                contractName = parsed.contractName;
              }
              // Algorand ARC artifacts (legacy)
              else if (file.endsWith('.arc32.json') || file.endsWith('.arc56.json')) {
                type = 'algorand';
                contractName = parsed.contract?.name || parsed.name;
              }
            }
          } catch (e) {
            // Ignore parse errors
          }

          return { name: file, type, contractName };
        })
        .filter(f => f.type !== 'unknown'); // Only show known artifact types

      setArtifactFiles(artifacts);
    }
  };

  useEffect(() => {
    loadArtifacts();
  }, [fileContents]);

  const handleDeploy = async (file: { name: string; type: string; contractName?: string }) => {
    setIsLoading(true);
    try {
      const content = fileContents?.[`artifacts/${file.name}`];
      if (content) {
        const artifact = JSON.parse(content);
        await onDeploy(file.name, artifact);
      } else {
        await onDeploy(file.name);
      }
    } catch (error) {
      console.error('Deploy error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-4 h-full overflow-auto" style={{ backgroundColor: "var(--background-color)", color: "var(--text-color)" }}>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold">Compiled Contracts</h2>
        <Button
          variant="ghost"
          size="sm"
          onClick={loadArtifacts}
          className="text-xs"
        >
          <RefreshCw className="w-3 h-3 mr-1" />
          Refresh
        </Button>
      </div>

      <p className="text-sm text-[#969696] mb-4">
        Click Build to compile your .cash files, then deploy them here.
      </p>

      {artifactFiles.length === 0 ? (
        <div className="text-center py-8 text-[#969696]">
          <FileCode className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p className="text-sm">No compiled contracts found.</p>
          <p className="text-xs mt-1">Build your CashScript contracts to see them here.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {artifactFiles.map((file) => (
            <div
              key={file.name}
              className="bg-[#2d2d30] p-4 rounded-lg border border-[#3e3e42] hover:border-[#4e4e52] transition-colors"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <FileCode className="w-4 h-4 text-blue-400" />
                    <span className="text-sm font-medium">
                      {file.contractName || file.name.replace('.json', '')}
                    </span>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded ${file.type === 'cashscript'
                        ? 'bg-green-600/20 text-green-400'
                        : 'bg-blue-600/20 text-blue-400'
                      }`}>
                      {file.type === 'cashscript' ? 'CashScript' : 'Algorand'}
                    </span>
                  </div>
                  <p className="text-[10px] text-[#969696] font-mono">{file.name}</p>
                </div>
                <Button
                  size="sm"
                  onClick={() => handleDeploy(file)}
                  disabled={isLoading}
                  className="bg-green-600 hover:bg-green-700 text-xs ml-3"
                >
                  <Rocket className="w-3 h-3 mr-1" />
                  Deploy
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}