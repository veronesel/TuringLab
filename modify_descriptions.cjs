const fs = require('fs');

const file = fs.readFileSync('src/data/scenarios.ts', 'utf8');

let newFile = file.replace(
  /description: "(.*?)",\s*initialTape: "(.*?)",/g,
  (match, desc, tape) => {
    let usage = "";
    if (tape.includes('#')) usage = ` Edit the tape with values around '#' (e.g. ${tape}), then press Play.`;
    else if (desc.toLowerCase().includes('unary') && tape.includes('0')) usage = ` Edit the tape with unary numbers separated by '0' (e.g. ${tape}), then press Play.`;
    else if (desc.toLowerCase().includes('unary')) usage = ` Edit the tape with a unary sequence (e.g. ${tape}), then press Play.`;
    else if (desc.toLowerCase().includes('binary')) usage = ` Edit the tape with a binary sequence (e.g. ${tape}), then press Play.`;
    else if (tape === '_') usage = ` Just press Play.`;
    else usage = ` Edit the tape with your input (e.g. ${tape}), then press Play.`;
    
    // Avoid double appending
    if (desc.includes('Edit the tape') || desc.includes('Just press Play') || desc.includes('e.g.')) return match;
    
    return `description: "${desc}${usage}", initialTape: "${tape}",`;
  }
);

fs.writeFileSync('src/data/scenarios.ts', newFile);
console.log('Descriptions updated');
