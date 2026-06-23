const fs = require('fs');

function checkFile(path) {
  const code = fs.readFileSync(path, 'utf8');
  let lines = code.split('\n');
  lines.forEach((line, i) => {
    if (line.match(/set[A-Z][a-zA-Z]*\(/) && 
        !line.includes('=>') && 
        !line.includes('useEffect') && 
        !line.includes('useCallback') && 
        !line.includes('handle') && 
        !line.includes('onC') && 
        !line.includes('setTimeout') && 
        !line.includes('onClick')) {
      console.log(`${path}:${i+1}: ${line.trim()}`);
    }
  });
}

fs.readdirSync('src/components/turing').forEach(f => {
  if (f.endsWith('.tsx')) checkFile('src/components/turing/' + f);
});
checkFile('src/App.tsx');
