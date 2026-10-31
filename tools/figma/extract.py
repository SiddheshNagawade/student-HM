import json,glob,os
f=sorted(glob.glob('/root/.claude/projects/-home-user/*.jsonl'),key=os.path.getmtime)[-1]
scr={}; svg={}
p='/home/user/figdump/screens.json'
if os.path.exists(p): scr=json.load(open(p))
ps='/home/user/figdump/svgs.json'
if os.path.exists(ps): svg=json.load(open(ps))
for line in open(f):
    try: o=json.loads(line)
    except: continue
    msg=o.get('message',{})
    c=msg.get('content') if isinstance(msg,dict) else None
    if not isinstance(c,list): continue
    for b in c:
        if not isinstance(b,dict) or b.get('type')!='tool_result': continue
        cc=b.get('content'); texts=[x.get('text','') for x in cc if isinstance(x,dict)] if isinstance(cc,list) else [cc or '']
        for t in texts:
            t=t.strip()
            if not t.startswith('{'): continue
            try: d=json.loads(t)
            except: continue
            if not isinstance(d,dict): continue
            for k,v in d.items():
                if isinstance(v,dict) and v.get('i')==k and 'k' in v: scr[k]=v
                if k=='svgs' and isinstance(v,dict): svg.update(v)
json.dump(scr,open(p,'w')); json.dump(svg,open(ps,'w'))
print('screens',len(scr),'svgs',len(svg))
