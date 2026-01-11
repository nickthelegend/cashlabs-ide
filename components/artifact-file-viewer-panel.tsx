"use client"

import React, { useState, useEffect } from "react"
import { Rocket, FileCode, Copy, Check, Download, Eye } from "lucide-react"
import { Button } from "@/components/ui/button"

interface ArtifactFileViewerPanelProps {
  filePath: string;
  fileContents?: Record<string, string>;
  selectedTemplate?: string;
  onDeploy: (filename: string, artifact: any) => Promise<void>;
  onClose: () => void;
}

export function ArtifactFileViewerPanel({
  filePath,
  fileContents,
  selectedTemplate,
  onDeploy,
  onClose,
}: ArtifactFileViewerPanelProps) {
  const [fileContent, setFileContent] = useState<string | null>(null);
  const [parsedArtifact, setParsedArtifact] = useState<any>(null);
  const [copied, setCopied] = useState(false);
  const [isDeploying, setIsDeploying] = useState(false);

  const fileName = filePath.split("/").pop() || filePath;
  const isJsonArtifact = fileName.endsWith('.json');
  const isDeployable = isJsonArtifact && !fileName.endsWith('.info.txt');

  useEffect(() => {
    const fetchFileContent = async () => {
      if (!filePath) {
        setFileContent(null);
        return;
      }

      console.log('[ArtifactViewer] Fetching:', filePath);
      console.log('[ArtifactViewer] Available keys:', Object.keys(fileContents || {}));

      // Try multiple path variations
      const pathVariations = [
        filePath,
        `artifacts/${filePath}`,
        filePath.replace('artifacts/', ''),
      ];

      let content: string | null = null;

      for (const path of pathVariations) {
        if (fileContents && fileContents[path]) {
          console.log('[ArtifactViewer] Found at:', path);
          content = fileContents[path];
          break;
        }
      }

      if (content) {
        setFileContent(content);

        // Try to parse as JSON for artifacts
        if (isJsonArtifact) {
          try {
            const parsed = JSON.parse(content);
            setParsedArtifact(parsed);
          } catch (e) {
            console.log('[ArtifactViewer] Not valid JSON');
            setParsedArtifact(null);
          }
        }
      } else {
        console.log('[ArtifactViewer] File not found, paths tried:', pathVariations);
        setFileContent("File not found. Try rebuilding the project.");
      }
    };

    fetchFileContent();
  }, [filePath, fileContents, isJsonArtifact]);

  const handleCopy = () => {
    if (fileContent) {
      navigator.clipboard.writeText(fileContent);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDownload = () => {
    if (fileContent) {
      const blob = new Blob([fileContent], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  const handleDeploy = async () => {
    if (!parsedArtifact) return;
    setIsDeploying(true);
    try {
      await onDeploy(fileName, parsedArtifact);
    } finally {
      setIsDeploying(false);
    }
  };

  return (
    <div className="p-4 h-full overflow-auto flex flex-col" style={{ backgroundColor: "var(--background-color)", color: "var(--text-color)" }}>
      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-2">
          <FileCode className="w-5 h-5 text-blue-400" />
          <h2 className="text-lg font-bold">{fileName}</h2>
        </div>
        <button
          onClick={onClose}
          className="px-3 py-1.5 rounded text-xs font-medium transition-colors hover:opacity-80"
          style={{ backgroundColor: "var(--button-color)", color: "var(--text-color)" }}
        >
          Close
        </button>
      </div>

      {/* Contract Info (for JSON artifacts) */}
      {parsedArtifact && parsedArtifact.contractName && (
        <div className="mb-4 p-4 bg-[#2d2d30] rounded-lg border border-[#3e3e42]">
          <h3 className="text-sm font-semibold text-green-400 mb-3">
            📋 Contract: {parsedArtifact.contractName}
          </h3>

          {/* Constructor Inputs */}
          {parsedArtifact.constructorInputs?.length > 0 && (
            <div className="mb-3">
              <h4 className="text-xs font-medium text-gray-400 mb-1">Constructor Arguments:</h4>
              <div className="space-y-1">
                {parsedArtifact.constructorInputs.map((input: any, i: number) => (
                  <div key={i} className="text-xs bg-[#1e1e1e] px-2 py-1 rounded flex justify-between">
                    <span className="text-blue-300">{input.name}</span>
                    <span className="text-gray-500">{input.type}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Functions */}
          {parsedArtifact.abi?.length > 0 && (
            <div className="mb-3">
              <h4 className="text-xs font-medium text-gray-400 mb-1">Functions:</h4>
              <div className="space-y-1">
                {parsedArtifact.abi.map((fn: any, i: number) => (
                  <div key={i} className="text-xs bg-[#1e1e1e] px-2 py-1 rounded">
                    <span className="text-yellow-300">{fn.name}</span>
                    <span className="text-gray-500">(</span>
                    {fn.inputs.map((inp: any, j: number) => (
                      <span key={j}>
                        {j > 0 && <span className="text-gray-500">, </span>}
                        <span className="text-purple-300">{inp.name}</span>
                        <span className="text-gray-600">: {inp.type}</span>
                      </span>
                    ))}
                    <span className="text-gray-500">)</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Bytecode Stats */}
          {parsedArtifact.bytecode && (
            <div className="text-xs text-gray-400">
              Bytecode: {parsedArtifact.bytecode.split(' ').length} opcodes
            </div>
          )}
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-2 mb-4">
        <Button
          variant="outline"
          size="sm"
          onClick={handleCopy}
          className="text-xs"
        >
          {copied ? <Check className="w-3 h-3 mr-1" /> : <Copy className="w-3 h-3 mr-1" />}
          {copied ? 'Copied!' : 'Copy'}
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={handleDownload}
          className="text-xs"
        >
          <Download className="w-3 h-3 mr-1" />
          Download
        </Button>
        {isDeployable && parsedArtifact && (
          <Button
            size="sm"
            onClick={handleDeploy}
            disabled={isDeploying}
            className="bg-green-600 hover:bg-green-700 text-xs"
          >
            <Rocket className="w-3 h-3 mr-1" />
            {isDeploying ? 'Deploying...' : 'Deploy Contract'}
          </Button>
        )}
      </div>

      {/* File Content */}
      <div className="flex-1 overflow-auto">
        <pre className="bg-[#1e1e1e] p-3 rounded-lg overflow-auto text-xs font-mono whitespace-pre-wrap" style={{ borderColor: "var(--border-color)", border: "1px solid" }}>
          {fileContent === null ? "Loading..." : fileContent}
        </pre>
      </div>
    </div>
  );
}
