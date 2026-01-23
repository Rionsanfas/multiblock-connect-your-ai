import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { Copy, Check, Download, ExternalLink, AlertCircle, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

interface CodeBlockProps {
  language: string;
  code: string;
}

function CodeBlock({ language, code }: CodeBlockProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative group my-3 rounded-lg overflow-hidden border border-border/30">
      {/* Header with language and copy button */}
      <div className="flex items-center justify-between px-3 py-1.5 bg-muted/50 border-b border-border/30">
        <span className="text-xs font-mono text-muted-foreground">
          {language || 'code'}
        </span>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1 px-2 py-1 text-xs rounded-md bg-secondary/50 hover:bg-secondary transition-colors"
        >
          {copied ? (
            <>
              <Check className="h-3 w-3 text-green-500" />
              <span className="text-green-500">Copied</span>
            </>
          ) : (
            <>
              <Copy className="h-3 w-3" />
              <span>Copy</span>
            </>
          )}
        </button>
      </div>
      
      {/* Code content */}
      <SyntaxHighlighter
        language={language || 'text'}
        style={oneDark}
        customStyle={{
          margin: 0,
          padding: '1rem',
          fontSize: '0.8125rem',
          lineHeight: '1.5',
          background: 'hsl(var(--muted) / 0.3)',
        }}
        codeTagProps={{
          style: {
            fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace',
          },
        }}
      >
        {code.trim()}
      </SyntaxHighlighter>
    </div>
  );
}

/**
 * Image component with loading states, error handling, and download support
 */
interface ImagePreviewProps {
  src: string;
  alt: string;
}

function ImagePreview({ src, alt }: ImagePreviewProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  const handleDownload = async () => {
    try {
      const response = await fetch(src);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = alt || 'generated-image.png';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to download image:', error);
      // Fallback: open in new tab
      window.open(src, '_blank');
    }
  };

  if (hasError) {
    return (
      <div className="my-3 p-4 rounded-lg border border-destructive/30 bg-destructive/10 flex items-center gap-3">
        <AlertCircle className="h-5 w-5 text-destructive flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-sm text-destructive font-medium">Failed to load image</p>
          <p className="text-xs text-muted-foreground truncate mt-0.5">{src}</p>
        </div>
        <a 
          href={src} 
          target="_blank" 
          rel="noopener noreferrer"
          className="flex items-center gap-1 px-2 py-1 text-xs rounded-md bg-secondary/50 hover:bg-secondary transition-colors"
        >
          <ExternalLink className="h-3 w-3" />
          Open
        </a>
      </div>
    );
  }

  return (
    <div className="my-3 relative group">
      {/* Loading state */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-muted/50 rounded-lg">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      )}
      
      {/* Image container */}
      <div 
        className={cn(
          "relative overflow-hidden rounded-lg border border-border/30 bg-muted/20 cursor-pointer transition-all",
          isExpanded ? "max-w-full" : "max-w-md",
          isLoading && "min-h-[200px]"
        )}
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <img
          src={src}
          alt={alt || 'Generated image'}
          className={cn(
            "w-full h-auto transition-opacity duration-300",
            isLoading ? "opacity-0" : "opacity-100"
          )}
          onLoad={() => setIsLoading(false)}
          onError={() => {
            setIsLoading(false);
            setHasError(true);
          }}
        />
        
        {/* Overlay with actions */}
        {!isLoading && (
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
            <div className="flex gap-2">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleDownload();
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-md bg-white/90 text-black hover:bg-white transition-colors"
              >
                <Download className="h-4 w-4" />
                Download
              </button>
              <a
                href={src}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-md bg-white/90 text-black hover:bg-white transition-colors"
              >
                <ExternalLink className="h-4 w-4" />
                Open
              </a>
            </div>
          </div>
        )}
      </div>
      
      {/* Caption */}
      {alt && alt !== 'Generated image' && alt !== 'Generated Image' && (
        <p className="text-xs text-muted-foreground mt-1.5 italic">{alt}</p>
      )}
    </div>
  );
}

/**
 * Video component with loading states and controls
 */
interface VideoPreviewProps {
  src: string;
  alt?: string;
}

function VideoPreview({ src, alt }: VideoPreviewProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  if (hasError) {
    return (
      <div className="my-3 p-4 rounded-lg border border-destructive/30 bg-destructive/10 flex items-center gap-3">
        <AlertCircle className="h-5 w-5 text-destructive flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-sm text-destructive font-medium">Failed to load video</p>
          <p className="text-xs text-muted-foreground truncate mt-0.5">{src}</p>
        </div>
        <a 
          href={src} 
          target="_blank" 
          rel="noopener noreferrer"
          className="flex items-center gap-1 px-2 py-1 text-xs rounded-md bg-secondary/50 hover:bg-secondary transition-colors"
        >
          <ExternalLink className="h-3 w-3" />
          Open
        </a>
      </div>
    );
  }

  return (
    <div className="my-3 relative">
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-muted/50 rounded-lg min-h-[200px]">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      )}
      
      <video
        src={src}
        controls
        className={cn(
          "w-full max-w-lg rounded-lg border border-border/30",
          isLoading && "opacity-0"
        )}
        onLoadedData={() => setIsLoading(false)}
        onError={() => {
          setIsLoading(false);
          setHasError(true);
        }}
      >
        Your browser does not support the video tag.
      </video>
      
      {alt && (
        <p className="text-xs text-muted-foreground mt-1.5 italic">{alt}</p>
      )}
    </div>
  );
}

export function MarkdownRenderer({ content, className }: MarkdownRendererProps) {
  return (
    <div className={cn("markdown-content text-[15px] sm:text-base leading-relaxed", className)}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          // Code blocks
          code({ className, children, ...props }) {
            const match = /language-(\w+)/.exec(className || '');
            const code = String(children).replace(/\n$/, '');
            const isInline = !match && !code.includes('\n');

            if (!isInline && match) {
              return <CodeBlock language={match[1]} code={code} />;
            }

            if (!isInline) {
              return <CodeBlock language="" code={code} />;
            }

            // Inline code
            return (
              <code
                className="px-1.5 py-0.5 rounded-md bg-muted/50 font-mono text-[0.8125rem] text-foreground"
                {...props}
              >
                {children}
              </code>
            );
          },

          // Pre blocks (handle non-language code blocks)
          pre({ children }) {
            // Check if the child is a code element without language
            const codeChild = React.Children.toArray(children).find(
              child => React.isValidElement(child) && child.type === 'code'
            );
            
            if (codeChild && React.isValidElement(codeChild)) {
              const code = String(codeChild.props.children || '').replace(/\n$/, '');
              const className = codeChild.props.className || '';
              const match = /language-(\w+)/.exec(className);
              
              if (!match) {
                return <CodeBlock language="" code={code} />;
              }
            }
            
            return <>{children}</>;
          },

          // Images - CRITICAL: properly render generated images
          img({ src, alt }) {
            if (!src) return null;
            
            // Check if it's a video URL
            const isVideo = src.match(/\.(mp4|webm|ogg|mov)(\?|$)/i) || 
                           src.includes('video') ||
                           alt?.toLowerCase().includes('video');
            
            if (isVideo) {
              return <VideoPreview src={src} alt={alt} />;
            }
            
            return <ImagePreview src={src} alt={alt || 'Image'} />;
          },

          // Paragraphs
          p({ children }) {
            return <p className="mb-3 last:mb-0 leading-relaxed">{children}</p>;
          },

          // Headers
          h1({ children }) {
            return <h1 className="text-xl font-bold mb-3 mt-4 first:mt-0">{children}</h1>;
          },
          h2({ children }) {
            return <h2 className="text-lg font-semibold mb-2 mt-4 first:mt-0">{children}</h2>;
          },
          h3({ children }) {
            return <h3 className="text-base font-semibold mb-2 mt-3 first:mt-0">{children}</h3>;
          },
          h4({ children }) {
            return <h4 className="text-sm font-semibold mb-2 mt-3 first:mt-0">{children}</h4>;
          },

          // Lists
          ul({ children }) {
            return <ul className="list-disc pl-5 mb-3 space-y-1">{children}</ul>;
          },
          ol({ children }) {
            return <ol className="list-decimal pl-5 mb-3 space-y-1">{children}</ol>;
          },
          li({ children }) {
            return <li className="leading-relaxed">{children}</li>;
          },

          // Bold and italic
          strong({ children }) {
            return <strong className="font-semibold text-foreground">{children}</strong>;
          },
          em({ children }) {
            return <em className="italic">{children}</em>;
          },

          // Links - also handle video links
          a({ href, children }) {
            // Check if link points to a video
            const isVideoLink = href?.match(/\.(mp4|webm|ogg|mov)(\?|$)/i) ||
                               href?.includes('video');
            
            if (isVideoLink && href) {
              return <VideoPreview src={href} alt={String(children) || undefined} />;
            }
            
            return (
              <a
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                {children}
              </a>
            );
          },

          // Blockquotes
          blockquote({ children }) {
            return (
              <blockquote className="border-l-3 border-primary/50 pl-4 my-3 text-muted-foreground italic">
                {children}
              </blockquote>
            );
          },

          // Horizontal rule
          hr() {
            return <hr className="my-4 border-border/50" />;
          },

          // Tables
          table({ children }) {
            return (
              <div className="overflow-x-auto my-3">
                <table className="min-w-full border-collapse border border-border/30 text-sm">
                  {children}
                </table>
              </div>
            );
          },
          thead({ children }) {
            return <thead className="bg-muted/30">{children}</thead>;
          },
          th({ children }) {
            return (
              <th className="border border-border/30 px-3 py-2 text-left font-semibold">
                {children}
              </th>
            );
          },
          td({ children }) {
            return (
              <td className="border border-border/30 px-3 py-2">
                {children}
              </td>
            );
          },
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
