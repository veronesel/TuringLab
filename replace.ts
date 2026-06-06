import * as fs from 'fs';
import * as path from 'path';

const mappings: Record<string, string> = {
    'bg-\\[#0A0C10\\]': 'bg-bg-base',
    'bg-\\[#0A0C10\\]\\/90': 'bg-bg-base/90',
    'bg-\\[#010409\\]': 'bg-bg-base',
    'bg-\\[#161B22\\]': 'bg-bg-panel',
    'bg-\\[#161B22\\]/50': 'bg-bg-panel/50',
    'bg-\\[#161B22\\]/90': 'bg-bg-panel/90',
    'bg-\\[#0D1117\\]': 'bg-bg-surface',
    'bg-\\[#21262D\\]': 'bg-bg-element',
    'hover:bg-\\[#21262D\\]': 'hover:bg-bg-element',
    'hover:bg-\\[#30363D\\]': 'hover:bg-border-active',
    'border-\\[#2D333B\\]': 'border-border-main',
    'border-\\[#404b5a\\]': 'border-border-active',
    'border-\\[#30363D\\]': 'border-border-active',
    'text-\\[#E0E0E0\\]': 'text-text-primary',
    'text-white': 'text-text-primary',
    // 'text-black': 'text-bg-panel', // Careful with text-black and text-white, maybe leave them.
    'text-slate-200': 'text-text-primary',
    'text-slate-300': 'text-text-secondary',
    'text-slate-400': 'text-text-secondary',
    'text-slate-500': 'text-text-muted',
    'text-slate-600': 'text-text-faint',
    'text-slate-800': 'text-border-main',
    'text-amber-500': 'text-primary-base',
    'text-amber-400': 'text-primary-base',
    'bg-amber-500': 'bg-primary-base',
    'bg-amber-500/20': 'bg-primary-base/20',
    'bg-amber-500/10': 'bg-primary-base/10',
    'bg-amber-600': 'bg-primary-dark',
    'bg-slate-800': 'bg-bg-element',
    'border-amber-500': 'border-primary-base',
    'border-amber-500/50': 'border-primary-base/50',
    'border-amber-500/30': 'border-primary-base/30',
    'border-amber-500/20': 'border-primary-base/20',
    'border-b-amber-500': 'border-b-primary-base',
    'border-t-amber-500': 'border-t-primary-base',
    'accent-amber-500': 'accent-primary-base',
    'shadow-\\[0_0_10px_rgba\\(245,158,11,0\\.5\\)\\]': 'shadow-[0_0_10px_var(--color-primary-base)]',
    'shadow-\\[0_0_15px_rgba\\(245,158,11,0\\.2\\)\\]': 'shadow-[0_0_15px_var(--color-primary-base)]',
    'shadow-\\[0_0_25px_rgba\\(245,158,11,0\\.4\\)\\]': 'shadow-[0_0_25px_var(--color-primary-base)]',
    'shadow-\\[0_10px_40px_rgba\\(0,0,0,0\\.5\\)\\]': 'shadow-[0_10px_40px_rgba(0,0,0,0.5)]',
    'shadow-amber-500/20': 'shadow-primary-base/20',
    'ring-amber-500/40': 'ring-primary-base/40',
    'ring-amber-500/20': 'ring-primary-base/20',
    'text-purple-400': 'text-primary-base',
    'text-purple-500': 'text-primary-base',
    'bg-purple-500/20': 'bg-primary-base/20',
    'bg-purple-600/20': 'bg-primary-base/20',
    'bg-purple-600/40': 'bg-primary-base/40',
    'border-purple-500/30': 'border-primary-base/30',
    'text-blue-400': 'text-[#93c5fd]',
    'bg-blue-600/20': 'bg-[#1e3a8a]/20',
    'bg-blue-600/40': 'bg-[#1e3a8a]/40',
    'border-blue-500/30': 'border-[#3b82f6]/30',
};

function processDirectory(dir: string) {
    const files = fs.readdirSync(dir);
    
    for (const file of files) {
        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);
        
        if (stat.isDirectory()) {
            processDirectory(fullPath);
        } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts')) {
            let content = fs.readFileSync(fullPath, 'utf8');
            let modified = false;
            
            for (const [key, value] of Object.entries(mappings)) {
                // Ensure we don't accidentally match substrings by just replacing directly.
                // Regex is fine since its just simple replacements
                const regex = new RegExp(key, 'g');
                if (regex.test(content)) {
                    content = content.replace(regex, value);
                    modified = true;
                }
            }
            // Fix some hardcoded values in diagram
            if (content.includes("'#2D333B'")) {
                 content = content.replace(/'#2D333B'/g, "'var(--color-border-main)'");
                 modified = true;
            }
            if (content.includes("'#e2e8f0'")) {
                 content = content.replace(/'#e2e8f0'/g, "'var(--color-text-primary)'");
                 modified = true;
            }
            if (content.includes("'transparent'")) {
                 content = content.replace(/'transparent'/g, "'transparent'"); 
            }
            
            if (modified) {
                fs.writeFileSync(fullPath, content, 'utf8');
                console.log(`Updated: ${fullPath}`);
            }
        }
    }
}

processDirectory('./src');
