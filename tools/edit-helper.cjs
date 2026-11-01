const fs=require('fs');
exports.edit=(p,pairs)=>{let s=fs.readFileSync(p,'utf8');const crlf=s.includes('\r\n');s=s.replace(/\r\n/g,'\n');
for(const [a,b] of pairs){ if(!s.includes(a)){console.log('MISSING in',p,':',a.slice(0,80));continue} s=s.replace(a,()=>b)}
fs.writeFileSync(p,crlf?s.replace(/\n/g,'\r\n'):s)}
