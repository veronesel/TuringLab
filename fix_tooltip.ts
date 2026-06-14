import fs from 'fs';

let content = fs.readFileSync('src/components/turing/StateDiagram.tsx', 'utf8');

const search = '               <div className="absolute right-full mr-2 top-0 px-2 py-1 bg-bg-surface text-text-primary text-[10px] whitespace-nowrap rounded border border-border-main opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-[100]">\n                 Checkpoints (Click to open)\n               </div>';

const replace = '               {!showCheckpoints && (\n                 <div className="absolute right-full mr-2 top-0 px-2 py-1 bg-bg-surface text-text-primary text-[10px] whitespace-nowrap rounded border border-border-main opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-[100]">\n                   Checkpoints (Click to open)\n                 </div>\n               )}';

if(content.includes(search)) {
  content = content.replace(search, replace);
  fs.writeFileSync('src/components/turing/StateDiagram.tsx', content);
  console.log("Replaced successfully");
} else {
  console.log("Could not find text");
}
